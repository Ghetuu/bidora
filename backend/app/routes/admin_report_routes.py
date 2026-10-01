"""
=====================================================================
ADMIN REPORTS & ANALYTICS

GET /admin/reports?from=YYYY-MM-DD&to=YYYY-MM-DD

The endpoint is split in two parts:

  1. build_report(...)   -> pure Python calculations (no database)
  2. get_reports(...)    -> the FastAPI route that loads the rows
                            from MySQL and calls build_report()

NOTE ABOUT PAYMENTS
Bidora currently has no payments table and no "winner" field,
so paid / pending / failed amounts cannot be calculated yet.
The response says so with  payments.tracked = false  and the
React page shows "Not tracked" for those cards.
=====================================================================
"""

from collections import defaultdict
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.auction import Auction
from app.models.auction_image import AuctionImage
from app.models.bids import Bid


router = APIRouter(
    prefix="/admin",
    tags=["Admin Reports"]
)


# =====================================================
# SMALL HELPERS
# =====================================================

def _pct(part, whole):
    return round(part / whole * 100, 1) if whole else 0.0


def _avg(values):
    values = list(values)
    return sum(values) / len(values) if values else 0.0


def _change(current, previous):
    """Relative change in % versus the previous period."""
    if not previous:
        return None
    return round((current - previous) / previous * 100, 1)


def _fmt_duration(seconds):
    seconds = int(seconds or 0)
    days, rem = divmod(seconds, 86400)
    hours, rem = divmod(rem, 3600)
    minutes = rem // 60
    if days:
        return f"{days}d {hours}h"
    if hours:
        return f"{hours}h {minutes:02d}m"
    return f"{minutes}m"


def _duration_seconds(a):
    return max((a.auction_end - a.auction_start).total_seconds(), 0)


def _in_range(value, start, end):
    return value is not None and start <= value < end


# =====================================================
# KPI CALCULATION (used for current AND previous period)
# =====================================================

def _kpis(auctions, bid_stats, start, end):
    """
    ended   = auctions that ENDED inside the period
    sold    = ended auctions that received at least one bid
    started = auctions that went live/ended and STARTED in the period
    """

    def bids_of(a):
        return bid_stats.get(a.id, (0, 0.0))[0]

    def top_bid(a):
        return bid_stats.get(a.id, (0, 0.0))[1]

    ended = [
        a for a in auctions
        if a.status == "ended" and _in_range(a.auction_end, start, end)
    ]
    sold = [a for a in ended if bids_of(a) > 0]

    started = [
        a for a in auctions
        if a.status in ("live", "ended")
        and _in_range(a.auction_start, start, end)
    ]
    converted = [a for a in started if bids_of(a) > 0]

    increases = [
        (top_bid(a) - float(a.starting_price)) / float(a.starting_price) * 100
        for a in sold if float(a.starting_price) > 0
    ]

    return {
        "ended": ended,
        "sold": sold,
        "success_rate": _pct(len(sold), len(ended)),
        "conversion_rate": _pct(len(converted), len(started)),
        "avg_bids": round(_avg(bids_of(a) for a in ended), 1),
        "avg_duration_sec": _avg(_duration_seconds(a) for a in ended),
        "avg_final_price": round(_avg(top_bid(a) for a in sold), 2),
        "avg_start_price": round(_avg(float(a.starting_price) for a in sold), 2),
        "price_increase": round(_avg(increases), 1),
    }


# =====================================================
# MAIN REPORT BUILDER (pure python)
# =====================================================

def build_report(
    auctions,      # list of Auction rows
    bid_stats,     # {auction_id: (bid_count, highest_amount)}
    bid_rows,      # list of (user_id, created_at) for bids INSIDE the period
    prior_bidders, # set of user_ids who bid BEFORE the period
    users,         # list of User rows
    images,        # {auction_id: first image path}
    start,         # datetime (inclusive)
    end,           # datetime (exclusive)
):

    def bids_of(a):
        return bid_stats.get(a.id, (0, 0.0))[0]

    def top_bid(a):
        return bid_stats.get(a.id, (0, 0.0))[1]

    span = end - start
    prev_start, prev_end = start - span, start

    cur = _kpis(auctions, bid_stats, start, end)
    prev = _kpis(auctions, bid_stats, prev_start, prev_end)

    # ------------------------------------------------
    # KPI CARDS
    # ------------------------------------------------
    kpis = {
        "success_rate": {
            "value": cur["success_rate"],
            "change": _change(cur["success_rate"], prev["success_rate"]),
        },
        "conversion_rate": {
            "value": cur["conversion_rate"],
            "change": _change(cur["conversion_rate"], prev["conversion_rate"]),
        },
        "avg_bids": {
            "value": cur["avg_bids"],
            "change": _change(cur["avg_bids"], prev["avg_bids"]),
        },
        "avg_duration": {
            "value": _fmt_duration(cur["avg_duration_sec"]),
            "change": _change(cur["avg_duration_sec"], prev["avg_duration_sec"]),
        },
        "avg_final_price": {
            "value": cur["avg_final_price"],
            "change": _change(cur["avg_final_price"], prev["avg_final_price"]),
        },
        "price_increase": {
            "value": cur["price_increase"],
            "change": _change(cur["price_increase"], prev["price_increase"]),
        },
    }

    # ------------------------------------------------
    # TREND (4 equal buckets across the period)
    # ------------------------------------------------
    buckets = []
    for i in range(4):
        b_start = start + span * i / 4
        b_end = start + span * (i + 1) / 4
        buckets.append((b_start, b_end))

    trend = {
        "labels": [b[0].strftime("%d %b") for b in buckets],
        "success_rate": [],
        "conversion_rate": [],
    }
    for b_start, b_end in buckets:
        k = _kpis(auctions, bid_stats, b_start, b_end)
        trend["success_rate"].append(k["success_rate"])
        trend["conversion_rate"].append(k["conversion_rate"])

    # ------------------------------------------------
    # LIFECYCLE (auctions CREATED in the period)
    # ------------------------------------------------
    cohort = [a for a in auctions if _in_range(a.created_at, start, end)]

    lifecycle = [
        {"label": "Created", "value": len(cohort)},
        {"label": "Submitted", "value": len([a for a in cohort if a.status != "draft"])},
        {"label": "Approved", "value": len([a for a in cohort if a.status in ("approved", "live", "ended")])},
        {"label": "Received Bids", "value": len([a for a in cohort if bids_of(a) > 0])},
        {"label": "Sold", "value": len([a for a in cohort if a.status == "ended" and bids_of(a) > 0])},
    ]

    # ------------------------------------------------
    # BIDDER ENGAGEMENT
    # ------------------------------------------------
    per_user = defaultdict(int)
    for user_id, _created in bid_rows:
        per_user[user_id] += 1

    unique = len(per_user)
    returning = len([u for u in per_user if u in prior_bidders])

    bidders = {
        "unique": unique,
        "returning": returning,
        "new": unique - returning,
        "avg_bids_per_bidder": round(len(bid_rows) / unique, 1) if unique else 0,
        "highest_bids_by_user": max(per_user.values()) if per_user else 0,
    }

    # ------------------------------------------------
    # BID BEHAVIOUR (avg bids by auction duration)
    # ------------------------------------------------
    duration_groups = {"<1h": [], "1-3h": [], "3-6h": [], ">6h": []}
    for a in cur["ended"]:
        hours = _duration_seconds(a) / 3600
        if hours < 1:
            key = "<1h"
        elif hours < 3:
            key = "1-3h"
        elif hours < 6:
            key = "3-6h"
        else:
            key = ">6h"
        duration_groups[key].append(bids_of(a))

    bid_behavior = [
        {"label": label, "value": round(_avg(vals), 1), "auctions": len(vals)}
        for label, vals in duration_groups.items()
    ]

    # ------------------------------------------------
    # PRICE ANALYSIS
    # ------------------------------------------------
    top_sold = sorted(cur["sold"], key=top_bid, reverse=True)[:4]

    price = {
        "avg_start": cur["avg_start_price"],
        "avg_final": cur["avg_final_price"],
        "avg_final_change": _change(cur["avg_final_price"], prev["avg_final_price"]),
        "avg_increase": cur["price_increase"],
        "avg_increase_change": _change(cur["price_increase"], prev["price_increase"]),
        "rows": [
            {
                "name": a.product_title,
                "start": float(a.starting_price),
                "final": top_bid(a),
            }
            for a in top_sold
        ],
    }

    # ------------------------------------------------
    # CATEGORY PERFORMANCE
    # ------------------------------------------------
    by_cat = defaultdict(list)
    for a in cur["ended"]:
        by_cat[a.category].append(a)

    categories = []
    for name, items in by_cat.items():
        sold_items = [a for a in items if bids_of(a) > 0]
        categories.append({
            "name": name,
            "auctions": len(items),
            "avg_bids": round(_avg(bids_of(a) for a in items), 1),
            "avg_final_price": round(_avg(top_bid(a) for a in sold_items), 2),
            "success_rate": _pct(len(sold_items), len(items)),
        })
    categories.sort(key=lambda c: c["auctions"], reverse=True)

    # ------------------------------------------------
    # SELLER PERFORMANCE
    # ------------------------------------------------
    def seller_rows(items):
        grouped = defaultdict(list)
        for a in items:
            grouped[(a.user_id, a.seller_name)].append(a)

        rows = []
        for (_uid, name), lst in grouped.items():
            sold_items = [a for a in lst if bids_of(a) > 0]
            rows.append({
                "name": name,
                "auctions": len(lst),
                "sold": len(sold_items),
                "success_rate": _pct(len(sold_items), len(lst)),
                "avg_bids": round(_avg(bids_of(a) for a in lst), 1),
                "revenue": round(sum(top_bid(a) for a in sold_items), 2),
            })
        rows.sort(key=lambda r: r["revenue"], reverse=True)
        return rows[:10]

    sellers = {"All Categories": seller_rows(cur["ended"])}
    for cat, items in by_cat.items():
        sellers[cat] = seller_rows(items)

    # ------------------------------------------------
    # USER ACTIVITY
    # ------------------------------------------------
    approved_users = len([
        u for u in users if str(u.account_status or "").upper() == "APPROVED"
    ])
    all_sellers = {a.user_id for a in auctions}
    active_sellers = {a.user_id for a in cohort}

    activity = {
        "Buyers": [
            {"label": "Registered", "value": len(users)},
            {"label": "Active", "value": approved_users},
            {"label": "Participated", "value": unique},
            {"label": "Inactive", "value": len(users) - approved_users},
        ],
        "Sellers": [
            {"label": "Registered", "value": len(all_sellers)},
            {"label": "Active", "value": len(active_sellers)},
            {"label": "Listed Auctions", "value": len(cohort)},
            {"label": "Inactive", "value": len(all_sellers) - len(active_sellers)},
        ],
    }

    engagement = {"labels": trend["labels"], "new_users": [], "active_users": []}
    for b_start, b_end in buckets:
        engagement["new_users"].append(
            len([u for u in users if _in_range(u.registration_date, b_start, b_end)])
        )
        active_ids = {uid for uid, created in bid_rows if _in_range(created, b_start, b_end)}
        active_ids |= {a.user_id for a in cohort if _in_range(a.created_at, b_start, b_end)}
        engagement["active_users"].append(len(active_ids))

    # ------------------------------------------------
    # PAYMENTS (only what can be derived today)
    # ------------------------------------------------
    months = []
    anchor = (end - timedelta(seconds=1)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    for _ in range(4):
        m_start = anchor
        m_end = (m_start + timedelta(days=32)).replace(day=1)
        months.append((m_start, m_end))
        anchor = (m_start - timedelta(days=1)).replace(day=1)
    months.reverse()

    revenue_by_month = []
    for m_start, m_end in months:
        value = sum(
            top_bid(a) for a in auctions
            if a.status == "ended"
            and bids_of(a) > 0
            and _in_range(a.auction_end, m_start, m_end)
        )
        revenue_by_month.append({
            "month": m_start.strftime("%B"),
            "auction_value": round(value, 2),
            "paid": None,
        })

    payments = {
        "tracked": False,
        "total_winning_value": round(sum(top_bid(a) for a in cur["sold"]), 2),
        "paid": None,
        "pending": None,
        "failed": None,
        "revenue_by_month": revenue_by_month,
    }

    # ------------------------------------------------
    # APPROVAL / REJECTION
    # ------------------------------------------------
    rejected = [a for a in cohort if a.status == "rejected"]

    reason_count = defaultdict(int)
    for a in rejected:
        text = (a.rejection_reason or "No reason given").strip() or "No reason given"
        reason_count[text[:60]] += 1

    ranked = sorted(reason_count.items(), key=lambda kv: kv[1], reverse=True)
    top_reasons, rest = ranked[:5], ranked[5:]
    if rest:
        top_reasons.append(("Other", sum(c for _, c in rest)))

    approval = {
        "approved": len([a for a in cohort if a.status in ("approved", "live", "ended")]),
        "rejected": len(rejected),
        "pending": len([a for a in cohort if a.status == "pending"]),
        "reasons": [
            {"label": label, "count": count, "pct": round(_pct(count, len(rejected)))}
            for label, count in top_reasons
        ],
    }

    # ------------------------------------------------
    # AUCTION PERFORMANCE TABLE
    # ------------------------------------------------
    table_source = [
        a for a in auctions
        if a.status in ("live", "ended") and _in_range(a.auction_start, start, end)
    ]
    table_source.sort(key=lambda a: a.auction_start, reverse=True)

    table = []
    for a in table_source[:500]:
        count = bids_of(a)
        highest = top_bid(a)
        start_price = float(a.starting_price)
        has_result = a.status == "ended" and count > 0
        table.append({
            "id": a.id,
            "name": a.product_title,
            "category": a.category,
            "seller": a.seller_name,
            "start_price": start_price,
            "bids": count,
            "highest_bid": highest if count else None,
            "final_price": highest if has_result else None,
            "increase_pct": round((highest - start_price) / start_price * 100, 1)
            if count and start_price else None,
            "duration": _fmt_duration(_duration_seconds(a)),
            "status": "Completed" if a.status == "ended" else "Live",
            "image": images.get(a.id),
        })

    return {
        "period": {"from": start.date().isoformat(), "to": (end - timedelta(days=1)).date().isoformat()},
        "kpis": kpis,
        "trend": trend,
        "lifecycle": lifecycle,
        "bidders": bidders,
        "bid_behavior": bid_behavior,
        "price": price,
        "categories": categories,
        "sellers": sellers,
        "user_activity": activity,
        "engagement": engagement,
        "payments": payments,
        "approval": approval,
        "table": table,
    }


# =====================================================
# ROUTE
# =====================================================

@router.get("/reports")
def get_reports(
    date_from: date | None = Query(None, alias="from"),
    date_to: date | None = Query(None, alias="to"),
    db: Session = Depends(get_db),
):

    today = date.today()

    if date_to is None:
        date_to = today
    if date_from is None:
        date_from = date_to.replace(day=1)

    if date_from > date_to:
        raise HTTPException(
            status_code=400,
            detail="'from' date must not be after 'to' date."
        )

    if (date_to - date_from).days > 800:
        raise HTTPException(
            status_code=400,
            detail="Date range is too large."
        )

    start = datetime.combine(date_from, datetime.min.time())
    end = datetime.combine(date_to + timedelta(days=1), datetime.min.time())

    auctions = (
        db.query(Auction)
        .filter(Auction.status != "draft")
        .all()
    )

    # bid count + highest bid for every auction
    bid_stats = {
        auction_id: (int(count), float(highest or 0))
        for auction_id, count, highest in (
            db.query(Bid.auction_id, func.count(Bid.id), func.max(Bid.amount))
            .group_by(Bid.auction_id)
            .all()
        )
    }

    # bids placed inside the selected period
    bid_rows = (
        db.query(Bid.user_id, Bid.created_at)
        .filter(Bid.created_at >= start, Bid.created_at < end)
        .all()
    )

    # users who had already bid before the period (=> "returning")
    bidder_ids = {row[0] for row in bid_rows}
    prior_bidders = set()
    if bidder_ids:
        prior_bidders = {
            row[0]
            for row in (
                db.query(Bid.user_id)
                .filter(Bid.created_at < start, Bid.user_id.in_(bidder_ids))
                .distinct()
                .all()
            )
        }

    users = db.query(User).all()

    # first image of each auction shown in the table
    images = {}
    for auction_id, path in (
        db.query(AuctionImage.auction_id, AuctionImage.image_path)
        .order_by(AuctionImage.auction_id, AuctionImage.display_order)
        .all()
    ):
        images.setdefault(auction_id, path)

    return build_report(
        auctions=auctions,
        bid_stats=bid_stats,
        bid_rows=bid_rows,
        prior_bidders=prior_bidders,
        users=users,
        images=images,
        start=start,
        end=end,
    )
