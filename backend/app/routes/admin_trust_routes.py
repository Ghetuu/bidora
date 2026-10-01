"""
=====================================================================
AUCTION TRUST & RISK SCORE  (admin side)

GET /admin/auctions/trust-scores?status=pending
    -> {"count": N, "scores": {"<auction_id>": {...score...}, ...}}

GET /admin/auctions/{auction_id}/trust-score
    -> {...score...}

Score = 80 (neutral start) + bonuses - deductions, clamped to 0..100
Higher score = more trustworthy.

    75-100  low risk
    50-74   medium risk
    0-49    high risk      (also forced to high on a critical signal,
                            e.g. the seller bidding on their own auction)

Every signal is returned in "reasons" so the admin can see WHY.
Read-only: nothing here changes the database.
=====================================================================
"""

from collections import defaultdict
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.auction import Auction
from app.models.auction_image import AuctionImage
from app.models.bids import Bid
from app.models.contact_message import ContactMessage


router = APIRouter(
    prefix="/admin",
    tags=["Admin Trust Score"]
)

BASE_SCORE = 80
LOW_AT = 75
MEDIUM_AT = 50

ALLOWED_STATUSES = {"pending", "approved", "rejected", "live", "ended", "all"}


# =====================================================
# SMALL HELPERS
# =====================================================

def _f(value):
    try:
        return float(value) if value is not None else 0.0
    except (TypeError, ValueError):
        return 0.0


def _norm(text):
    return " ".join(str(text or "").lower().split())


def _last10(text):
    digits = "".join(c for c in str(text or "") if c.isdigit())
    return digits[-10:]


class _Reasons:
    """Collects the signals that make up the score."""

    def __init__(self):
        self.items = []
        self.critical = False

    def add(self, label, points, critical=False):
        self.items.append({
            "label": label,
            "points": points,
            "type": "trust" if points > 0 else "risk" if points < 0 else "info",
        })
        if critical:
            self.critical = True

    @property
    def total(self):
        return sum(i["points"] for i in self.items)


# =====================================================
# 1. SELLER TRUST
# =====================================================

def _check_seller(auction, seller, db, now, r):
    if seller is None:
        r.add("Seller account not found", -20)
        return

    if not seller.email_verified:
        r.add("Seller email is not verified", -15)

    status = str(seller.account_status or "").upper()
    if status != "APPROVED":
        r.add(f"Seller account status is {status or 'unknown'}", -25)

    if (seller.admin_remark or "").strip():
        r.add("Admin has left a remark on this seller's account", -10)

    if seller.registration_date:
        age_days = (now - seller.registration_date).days
        if age_days < 7:
            r.add(f"Very new account ({max(age_days, 0)} days old)", -15)
        elif age_days < 30:
            r.add(f"New account ({age_days} days old)", -8)
        elif age_days >= 180:
            r.add(f"Established account ({age_days // 30} months old)", 5)

    # history of the seller's OTHER auctions
    rows = (
        db.query(Auction.status, func.count(Auction.id))
        .filter(Auction.user_id == auction.user_id, Auction.id != auction.id)
        .group_by(Auction.status)
        .all()
    )
    counts = {str(s): int(c) for s, c in rows}

    rejected = counts.get("rejected", 0)
    good = counts.get("approved", 0) + counts.get("live", 0) + counts.get("ended", 0)
    decided = rejected + good
    ended = counts.get("ended", 0)

    if decided == 0:
        r.add("First-time seller, no auction history", -5)
    elif decided >= 2 and rejected / decided >= 0.5:
        r.add(f"{rejected} of {decided} earlier auctions were rejected", -15)
    elif rejected >= 1:
        r.add(f"{rejected} earlier auction(s) rejected", -5)

    if ended >= 3:
        r.add(f"{ended} auctions completed successfully before", 10)
    elif ended >= 1:
        r.add(f"{ended} auction(s) completed before", 5)

    # does the seller details on the auction match the account?
    if _norm(auction.seller_email) != _norm(seller.email):
        r.add("Auction seller email differs from the account email", -8)

    contact = _last10(auction.seller_contact)
    if contact and contact != _last10(seller.mobile):
        r.add("Auction contact number differs from the account mobile", -5)

    if _norm(auction.seller_name) != _norm(seller.fullname):
        r.add("Auction seller name differs from the account name", -5)


# =====================================================
# 2. AUCTION LISTING RISK
# =====================================================

def _check_listing(auction, db, now, r):
    if not (auction.purchase_proof_path or "").strip():
        r.add("No purchase proof uploaded", -15)
    else:
        r.add("Purchase proof uploaded", 3)

    if not (auction.seller_proof_path or "").strip():
        r.add("No seller ID proof uploaded", -10)

    if not auction.terms_accepted:
        r.add("Seller did not accept the terms", -10)

    # images
    images = (
        db.query(func.count(AuctionImage.id))
        .filter(AuctionImage.auction_id == auction.id)
        .scalar()
    ) or 0
    if images == 0:
        r.add("No product images", -15)
    elif images == 1:
        r.add("Only one product image", -5)
    elif images >= 3:
        r.add(f"{images} product images", 3)

    # description
    desc = (auction.description or "").strip()
    if len(desc) < 30:
        r.add("Very short description", -8)
    elif _norm(desc) == _norm(auction.product_title):
        r.add("Description just repeats the title", -8)

    # prices
    purchase = _f(auction.purchase_price)
    start = _f(auction.starting_price)
    if purchase <= 0:
        r.add("Purchase price is zero or missing", -10)
    else:
        ratio = start / purchase
        if ratio > 1.2:
            r.add(f"Starting price is {ratio:.1f}x the purchase price", -15)
        elif ratio < 0.05 and purchase >= 10000:
            r.add("Starting price is under 5% of purchase price", -5)

    if _f(auction.shipping_charges) > start > 0:
        r.add("Shipping charge is higher than the starting price", -5)

    # dates
    if auction.purchase_date and auction.purchase_date > now.date():
        r.add("Purchase date is in the future", -15)

    if auction.auction_start and auction.auction_end:
        hours = (auction.auction_end - auction.auction_start).total_seconds() / 3600
        if hours <= 0:
            r.add("Auction end is not after its start", -20)
        elif hours < 0.5:
            r.add("Extremely short auction (under 30 minutes)", -8)
        elif hours > 24 * 30:
            r.add("Unusually long auction (over 30 days)", -5)


# =====================================================
# 3. BIDDING BEHAVIOUR
# =====================================================

def _check_bidding(auction, db, r):
    bids = (
        db.query(Bid)
        .filter(Bid.auction_id == auction.id)
        .order_by(Bid.created_at.asc())
        .all()
    )
    if not bids:
        return

    # seller bidding on their own auction = shill bidding
    own = [b for b in bids if b.user_id == auction.user_id]
    if own:
        r.add(f"Seller placed {len(own)} bid(s) on their own auction", -40, critical=True)

    # bidder name equals seller name but a different account
    seller_name = _norm(auction.seller_name)
    look_alike = [
        b for b in bids
        if b.user_id != auction.user_id and _norm(b.bidder_name) == seller_name
    ]
    if look_alike:
        r.add("A bidder has the same name as the seller (different account)", -15)

    per_user = defaultdict(list)
    for b in bids:
        per_user[b.user_id].append(b.created_at)

    if len(bids) >= 6:
        top_user, top_times = max(per_user.items(), key=lambda kv: len(kv[1]))
        share = len(top_times) / len(bids)
        if len(per_user) == 1:
            r.add(f"All {len(bids)} bids come from one bidder", -10)
        elif share > 0.7:
            r.add(f"One bidder placed {round(share * 100)}% of the bids", -10)

    # 3 bids by the same user within 10 seconds
    for times in per_user.values():
        times = [t for t in times if t]
        if any((times[i + 2] - times[i]).total_seconds() <= 10 for i in range(len(times) - 2)):
            r.add("Rapid burst of bids from one user (3 within 10 seconds)", -10)
            break


# =====================================================
# 4. COMPLAINTS (contact form)
# =====================================================

def _check_complaints(auction, db, r):
    own_ids = [row[0] for row in db.query(Auction.id).filter(Auction.user_id == auction.user_id).all()]
    candidates = set()
    for i in own_ids:
        candidates.add(str(i))
        candidates.add(f"#{i}")

    if not candidates:
        return

    rows = (
        db.query(ContactMessage.auction_id)
        .filter(ContactMessage.auction_id.in_(candidates))
        .all()
    )
    this_id = str(auction.id)
    on_this = sum(1 for (aid,) in rows if str(aid).strip().lstrip("#") == this_id)
    on_others = len(rows) - on_this

    if on_this:
        r.add(f"{on_this} support message(s) about this auction", -min(on_this * 10, 20))
    if on_others:
        r.add(f"{on_others} support message(s) about the seller's other auctions", -min(on_others * 5, 10))


# =====================================================
# PUBLIC FUNCTION
# =====================================================

def calculate_trust_score(auction, db, now=None):
    now = now or datetime.utcnow()
    r = _Reasons()

    seller = db.query(User).filter(User.id == auction.user_id).first()

    _check_seller(auction, seller, db, now, r)
    _check_listing(auction, db, now, r)
    _check_bidding(auction, db, r)
    _check_complaints(auction, db, r)

    score = max(0, min(100, BASE_SCORE + r.total))

    if r.critical or score < MEDIUM_AT:
        level, label = "high", "High risk"
    elif score < LOW_AT:
        level, label = "medium", "Medium risk"
    else:
        level, label = "low", "Low risk"

    reasons = sorted(r.items, key=lambda i: i["points"])   # worst first

    return {
        "auction_id": auction.id,
        "score": score,
        "level": level,
        "label": label,
        "critical": r.critical,
        "reasons": reasons,
    }


# =====================================================
# ROUTES
# =====================================================

@router.get("/auctions/trust-scores")
def get_trust_scores(
    status: str = Query("pending"),
    db: Session = Depends(get_db),
):
    status = status.strip().lower()
    if status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid auction status.")

    query = db.query(Auction).filter(Auction.status != "draft")
    if status != "all":
        query = query.filter(Auction.status == status)

    auctions = query.order_by(Auction.created_at.desc()).limit(500).all()
    now = datetime.utcnow()

    return {
        "count": len(auctions),
        "scores": {str(a.id): calculate_trust_score(a, db, now) for a in auctions},
    }


@router.get("/auctions/{auction_id}/trust-score")
def get_trust_score(auction_id: int, db: Session = Depends(get_db)):
    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found.")
    return calculate_trust_score(auction, db)
