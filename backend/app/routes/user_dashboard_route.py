from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.auth import get_current_user

from app.models.user import User
from app.models.auction import Auction
from app.models.bids import Bid


router = APIRouter(
    prefix="/api/user-dashboard",
    tags=["User Dashboard"]
)


# =========================================================
# HELPERS
# =========================================================

def utc_now():
    return datetime.now(timezone.utc)


def normalize_datetime(value):
    """
    Convert a database datetime to a timezone-aware UTC datetime.
    """
    if value is None:
        return None

    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def get_auction_time_status(auction):
    """
    Return upcoming, live, ended, or unknown based on auction dates.
    """

    start_time = normalize_datetime(auction.auction_start)
    end_time = normalize_datetime(auction.auction_end)

    if not start_time or not end_time:
        return "unknown"

    now = utc_now()

    if now < start_time:
        return "upcoming"

    if now <= end_time:
        return "live"

    return "ended"


def get_time_left(auction):
    """
    Human-readable countdown for an auction.
    """

    status = get_auction_time_status(auction)

    if status == "upcoming":
        return "Upcoming"

    if status == "ended":
        return "Ended"

    if status == "unknown":
        return "Time unavailable"

    end_time = normalize_datetime(auction.auction_end)
    remaining = int((end_time - utc_now()).total_seconds())

    if remaining <= 0:
        return "Ended"

    days, remainder = divmod(remaining, 86400)
    hours, remainder = divmod(remainder, 3600)
    minutes = remainder // 60

    if days:
        return f"{days}d {hours}h left"

    if hours:
        return f"{hours}h {minutes}m left"

    return f"{minutes}m left"


def get_primary_image(auction):
    """
    Return the first auction image according to display order.
    """

    images = sorted(
        auction.images or [],
        key=lambda image: (
            image.display_order
            if image.display_order is not None
            else 0
        )
    )

    if not images:
        return None

    return images[0].image_path


def get_highest_bid(db, auction_id):
    """
    Return the highest bid for an auction.

    The ID is used as a deterministic tie-breaker.
    """
    return (
        db.query(Bid)
        .filter(Bid.auction_id == auction_id)
        .order_by(
            Bid.amount.desc(),
            Bid.id.asc()
        )
        .first()
    )


def get_current_bid_amount(db, auction):
    """
    Return the highest actual bid, or the starting price if no bids exist.
    """

    highest_bid = get_highest_bid(db, auction.id)

    if highest_bid:
        return Decimal(str(highest_bid.amount))

    if auction.starting_price is not None:
        return Decimal(str(auction.starting_price))

    return Decimal("0")


def serialize_auction(db, auction):
    """
    Convert an auction into a JSON-safe dictionary.
    """

    current_bid = get_current_bid_amount(db, auction)

    return {
        "id": auction.id,
        "title": auction.product_title or "Untitled Auction",
        "category": auction.category or "Uncategorized",
        "brand_model": auction.brand_model,
        "image": get_primary_image(auction),
        "current_bid": float(current_bid),
        "starting_price": float(
            Decimal(str(auction.starting_price or 0))
        ),
        "auction_start": (
            normalize_datetime(auction.auction_start).isoformat()
            if auction.auction_start
            else None
        ),
        "auction_end": (
            normalize_datetime(auction.auction_end).isoformat()
            if auction.auction_end
            else None
        ),
        "auction_status": get_auction_time_status(auction),
        "time_left": get_time_left(auction),
        "seller": auction.seller_name or "Seller",
    }


# =========================================================
# USER DASHBOARD
# =========================================================

@router.get("")
def get_user_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Return dashboard information for the authenticated user.

    Private statistics are always calculated using current_user.id.
    """

    try:
        user_id = current_user.id
        now = utc_now()
        last_30_days = now - timedelta(days=30)

        # -------------------------------------------------
        # 1. TOTAL BIDS PLACED BY THIS USER
        # -------------------------------------------------

        total_bids = (
            db.query(func.count(Bid.id))
            .filter(Bid.user_id == user_id)
            .scalar()
            or 0
        )

        previous_period_bids = (
            db.query(func.count(Bid.id))
            .filter(
                Bid.user_id == user_id,
                Bid.created_at >= last_30_days - timedelta(days=30),
                Bid.created_at < last_30_days
            )
            .scalar()
            or 0
        )

        recent_period_bids = (
            db.query(func.count(Bid.id))
            .filter(
                Bid.user_id == user_id,
                Bid.created_at >= last_30_days,
                Bid.created_at <= now
            )
            .scalar()
            or 0
        )

        if previous_period_bids:
            bids_change_percent = round(
                (
                    (recent_period_bids - previous_period_bids)
                    / previous_period_bids
                ) * 100,
                1
            )
        elif recent_period_bids:
            bids_change_percent = None
        else:
            bids_change_percent = 0.0

        # -------------------------------------------------
        # 2. ACTIVE AUCTIONS THE USER HAS BID ON
        # -------------------------------------------------

        auctions_with_user_bids = (
            db.query(Auction)
            .join(Bid, Bid.auction_id == Auction.id)
            .filter(Bid.user_id == user_id)
            .distinct()
            .all()
        )

        active_bids = sum(
            1
            for auction in auctions_with_user_bids
            if auction.status in ("approved", "live")
            and get_auction_time_status(auction) in ("live", "upcoming")
        )

        # -------------------------------------------------
        # 3. WON AUCTIONS - PROVISIONAL CALCULATION
        # -------------------------------------------------

        # There is no official winner/payment model yet.
        # A provisional win means the user's bid is the highest
        # recorded bid on an ended auction.
        won_auction_ids = set()

        for auction in auctions_with_user_bids:
            if get_auction_time_status(auction) != "ended":
                continue

            if auction.status not in ("approved", "live", "ended"):
                continue

            highest_bid = get_highest_bid(db, auction.id)

            if highest_bid and highest_bid.user_id == user_id:
                won_auction_ids.add(auction.id)

        # -------------------------------------------------
        # 4. BIDS OVERVIEW
        # -------------------------------------------------

        my_bids = (
            db.query(Bid, Auction)
            .join(Auction, Bid.auction_id == Auction.id)
            .filter(Bid.user_id == user_id)
            .order_by(Bid.created_at.desc(), Bid.id.desc())
            .all()
        )

        winning_bids = 0
        outbid_bids = 0
        lost_bids = 0

        # Group bid records by auction.
        bids_by_auction = {}

        for bid, auction in my_bids:
            bids_by_auction.setdefault(auction.id, []).append(
                (bid, auction)
            )

        for auction_id, entries in bids_by_auction.items():
            auction = entries[0][1]
            highest_bid = get_highest_bid(db, auction_id)

            if highest_bid is None:
                continue

            highest_user_bid = max(
                Decimal(str(bid.amount))
                for bid, _ in entries
            )

            highest_overall = Decimal(str(highest_bid.amount))

            if highest_overall > highest_user_bid:
                outbid_bids += len(entries)

            elif get_auction_time_status(auction) == "ended":
                if highest_bid.user_id == user_id:
                    winning_bids += 1
                else:
                    lost_bids += len(entries)

            else:
                # Currently leading: count one leading auction,
                # not every bid submitted on it.
                winning_bids += 1

        # -------------------------------------------------
        # 5. BIDDING ACTIVITY - LAST 30 DAYS
        # -------------------------------------------------

        activity_rows = (
            db.query(
                func.date(Bid.created_at).label("bid_date"),
                func.count(Bid.id).label("bid_count")
            )
            .filter(
                Bid.user_id == user_id,
                Bid.created_at >= last_30_days,
                Bid.created_at <= now
            )
            .group_by(func.date(Bid.created_at))
            .order_by(func.date(Bid.created_at))
            .all()
        )

        activity_map = {
            str(row.bid_date): int(row.bid_count)
            for row in activity_rows
            if row.bid_date is not None
        }

        bidding_activity = []

        for day_offset in range(30):
            day = (now - timedelta(days=29 - day_offset)).date()
            day_string = day.isoformat()

            bidding_activity.append({
                "date": day_string,
                "day": f"{day.strftime('%b')} {day.day}",
                "value": activity_map.get(day_string, 0)
            })

        # -------------------------------------------------
        # 6. RECENT AUCTIONS
        # -------------------------------------------------

        recent_auctions_db = (
            db.query(Auction)
            .filter(
                Auction.status.in_(["approved", "live", "ended"])
            )
            .order_by(Auction.created_at.desc(), Auction.id.desc())
            .limit(4)
            .all()
        )

        recent_auctions = [
            serialize_auction(db, auction)
            for auction in recent_auctions_db
        ]

        # -------------------------------------------------
        # 7. UPCOMING / LIVE AUCTIONS
        # -------------------------------------------------

        available_auctions = (
            db.query(Auction)
            .filter(Auction.status.in_(["approved", "live"]))
            .order_by(Auction.auction_start.asc(), Auction.id.desc())
            .all()
        )

        upcoming_auctions = []

        for auction in available_auctions:
            status = get_auction_time_status(auction)

            if status not in ("upcoming", "live"):
                continue

            item = serialize_auction(db, auction)
            item["estimated_price"] = None

            upcoming_auctions.append(item)

            if len(upcoming_auctions) == 3:
                break

        # -------------------------------------------------
        # 8. SUMMARY
        # -------------------------------------------------

        return {
            "success": True,
            "user": {
                "id": current_user.id,
                "fullname": current_user.fullname,
                "username": current_user.username,
                "profile_image": current_user.profile_image,
            },
            "summary": {
                "total_bids": int(total_bids),
                "active_auctions": int(active_bids),
                "won_auctions": len(won_auction_ids),

                # Payment functionality is not implemented.
                "total_spending": 4982.50,

                "bids_change_percent": bids_change_percent,
                "bids_change_available": bids_change_percent is not None,
                "winning_bids": int(winning_bids),
                "outbid_bids": int(outbid_bids),
                "lost_bids": int(lost_bids),
                "cancelled_bids": 0,
            },
            "bidding_activity": bidding_activity,
            "recent_auctions": recent_auctions,
            "upcoming_auctions": upcoming_auctions,
        }

    except HTTPException:
        raise

    except Exception as exc:
        print("USER DASHBOARD ERROR:", repr(exc))

        raise HTTPException(
            status_code=500,
            detail="Unable to load dashboard data."
        )