from datetime import datetime, timedelta
from collections import Counter, defaultdict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.database import get_db
from app.core.admin_auth import get_current_admin

from app.models.user import User
from app.models.auction import Auction
from app.models.bids import Bid
from app.models.auction_image import AuctionImage


router = APIRouter(
    prefix="/admin/dashboard",
    tags=["Admin Dashboard"]
)


# =========================================================
# HELPERS
# =========================================================

def safe_text(value, default="N/A"):
    if value is None:
        return default

    value = str(value).strip()
    return value if value else default


def safe_number(value):
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def format_amount(value):
    """
    Return a JSON-safe monetary value.
    """
    return round(safe_number(value), 2)


def get_image_url(image_path):
    """
    Convert stored upload paths into frontend-compatible paths.
    """
    if not image_path:
        return None

    path = str(image_path).replace("\\", "/").strip()

    if path.startswith(("http://", "https://")):
        return path

    if path.startswith("/"):
        return path

    if path.startswith("uploads/"):
        return f"/{path}"

    return f"/uploads/{path}"


def get_auction_image(auction):
    """
    Get the first available auction image.
    """
    images = getattr(auction, "images", None) or []

    if not images:
        return None

    images = sorted(
        images,
        key=lambda item: getattr(item, "display_order", 0)
    )

    return get_image_url(
        getattr(images[0], "image_path", None)
    )


def get_auction_status(auction):
    status = getattr(auction, "status", "")

    if hasattr(status, "value"):
        status = status.value

    return str(status or "").lower()


def get_bidder_name(bid):
    """
    Prefer the bidder name saved with the bid.
    Fall back to the associated user when available.
    """
    bidder_name = safe_text(
        getattr(bid, "bidder_name", None),
        ""
    )

    if bidder_name:
        return bidder_name

    user = getattr(bid, "user", None)

    if user:
        return safe_text(
            getattr(user, "fullname", None),
            "Unknown bidder"
        )

    return "Unknown bidder"


def get_user_display_name(user):
    return safe_text(
        getattr(user, "fullname", None),
        safe_text(
            getattr(user, "username", None),
            "Unknown user"
        )
    )


def get_date_value(value):
    if not value:
        return None

    if isinstance(value, datetime):
        return value

    return None

# =========================================================
# ADDITIONAL ADMIN DASHBOARD ANALYTICS
# =========================================================

def get_datetime_sort_key(value):
    """
    Convert a datetime into a safe sorting key.
    Supports missing and timezone-aware datetime values.
    """
    if not isinstance(value, datetime):
        return 0

    try:
        return value.timestamp()
    except (ValueError, OSError, OverflowError):
        return 0


def build_additional_dashboard_data(
    users,
    auctions,
    bids,
    users_by_id,
    bids_by_auction,
    now
):
    """
    Build four additional dashboard sections using actual
    database records.

    Suspicious patterns are review signals, not proof of fraud.
    """

    today = now.date()
    seven_days_ago = today - timedelta(days=6)

    # -----------------------------------------------------
    # 1. SUSPICIOUS BIDDING ACTIVITY
    # -----------------------------------------------------

    suspicious_bids = []

    for auction_id, auction_bids in bids_by_auction.items():

        auction_bids_sorted = sorted(
            auction_bids,
            key=lambda bid: get_datetime_sort_key(
                getattr(bid, "created_at", None)
            )
        )

        # Track consecutive bids and recent bids per bidder.
        bidder_recent_times = defaultdict(list)

        previous_bid = None

        for bid in auction_bids_sorted:

            created_at = get_date_value(
                getattr(bid, "created_at", None)
            )

            amount = safe_number(
                getattr(bid, "amount", 0)
            )

            bidder_id = getattr(bid, "user_id", None)

            bidder_name = get_bidder_name(bid)

            reasons = []

            # Signal A:
            # A bid more than doubles the immediately preceding
            # positive bid on the same auction.
            if previous_bid is not None:

                previous_amount = safe_number(
                    getattr(previous_bid, "amount", 0)
                )

                if (
                    previous_amount > 0
                    and amount > previous_amount * 2
                ):
                    reasons.append(
                        "Bid amount is more than double "
                        "the preceding bid."
                    )

            # Signal B:
            # Three or more bids by the same user on the same
            # auction within a rolling two-minute window.
            if created_at and bidder_id is not None:

                recent_times = bidder_recent_times[bidder_id]

                recent_times[:] = [
                    bid_time
                    for bid_time in recent_times
                    if 0 <= (
                        created_at - bid_time
                    ).total_seconds() <= 120
                ]

                if len(recent_times) >= 2:
                    reasons.append(
                        "Repeated bidding within a "
                        "two-minute period."
                    )

                recent_times.append(created_at)

            if reasons:

                auction = next(
                    (
                        item
                        for item in auctions
                        if item.id == auction_id
                    ),
                    None
                )

                user = users_by_id.get(bidder_id)

                suspicious_bids.append({
                    "bid_id": getattr(bid, "id", None),
                    "auction_id": auction_id,
                    "product_title": safe_text(
                        getattr(auction, "product_title", None),
                        "Auction unavailable"
                    ),
                    "bidder_name": (
                        get_user_display_name(user)
                        if user
                        else bidder_name
                    ),
                    "amount": format_amount(amount),
                    "created_at": (
                        created_at.isoformat()
                        if created_at
                        else None
                    ),
                    "risk_level": (
                        "Review"
                    ),
                    "reason": " ".join(reasons),
                    "review_required": True
                })

            previous_bid = bid

    suspicious_bids.sort(
        key=lambda item: item.get("created_at") or "",
        reverse=True
    )

    suspicious_bids = suspicious_bids[:10]

    # -----------------------------------------------------
    # 2. AUCTION PERFORMANCE OVERVIEW
    # -----------------------------------------------------

    auction_performance = []

    no_bid_auctions = []

    ending_soon_auctions = []

    for auction in auctions:

        auction_id = auction.id

        auction_status = get_auction_status(auction)

        auction_bids = bids_by_auction.get(
            auction_id,
            []
        )

        amounts = [
            safe_number(getattr(bid, "amount", 0))
            for bid in auction_bids
        ]

        highest_bid = max(amounts, default=0)

        auction_end = get_date_value(
            getattr(auction, "auction_end", None)
        )

        performance_item = {
            "auction_id": auction_id,
            "product_title": safe_text(
                getattr(auction, "product_title", None),
                "Untitled auction"
            ),
            "product_image": get_auction_image(auction),
            "category": safe_text(
                getattr(auction, "category", None),
                "Uncategorized"
            ),
            "status": auction_status,
            "total_bids": len(auction_bids),
            "highest_bid": format_amount(highest_bid),
            "auction_end": (
                auction_end.isoformat()
                if auction_end
                else None
            )
        }

        auction_performance.append(performance_item)

        if not auction_bids and auction_status not in (
            "ended",
            "rejected",
            "draft"
        ):
            no_bid_auctions.append(performance_item)

        if (
            auction_status in ("live", "approved")
            and auction_end
            and auction_end > now
            and auction_end <= now + timedelta(hours=24)
        ):
            ending_soon_auctions.append(performance_item)

    auction_performance.sort(
        key=lambda item: (
            item["total_bids"],
            item["highest_bid"]
        ),
        reverse=True
    )

    no_bid_auctions.sort(
        key=lambda item: item.get("auction_end") or "9999"
    )

    ending_soon_auctions.sort(
        key=lambda item: item.get("auction_end") or "9999"
    )

    auction_performance = auction_performance[:8]
    no_bid_auctions = no_bid_auctions[:5]
    ending_soon_auctions = ending_soon_auctions[:5]

    # -----------------------------------------------------
    # 3. RECENTLY REGISTERED USERS
    # -----------------------------------------------------

    recent_users = sorted(
        users,
        key=lambda user: get_datetime_sort_key(
            getattr(user, "registration_date", None)
        ),
        reverse=True
    )[:8]

    recent_users_data = []

    for user in recent_users:

        registration_date = get_date_value(
            getattr(user, "registration_date", None)
        )

        role_id = getattr(user, "role_id", None)

        if role_id == 1:
            role_name = "Admin"
        elif role_id == 2:
            role_name = "Seller"
        elif role_id == 3:
            role_name = "Buyer"
        else:
            role_name = "Other"

        recent_users_data.append({
            "id": user.id,
            "name": get_user_display_name(user),
            "username": safe_text(
                getattr(user, "username", None),
                ""
            ),
            "email": safe_text(
                getattr(user, "email", None),
                "N/A"
            ),
            "profile_image": get_image_url(
                getattr(user, "profile_image", None)
            ),
            "role": role_name,
            "account_status": safe_text(
                getattr(user, "account_status", None),
                "UNKNOWN"
            ),
            "email_verified": bool(
                getattr(user, "email_verified", False)
            ),
            "registration_date": (
                registration_date.isoformat()
                if registration_date
                else None
            )
        })

        # -----------------------------------------------------
    # 4. BIDDING TRENDS & INSIGHTS
    # -----------------------------------------------------

    bids_today = 0
    bids_last_7_days = 0

    for bid in bids:
        created_at = get_date_value(
            getattr(bid, "created_at", None)
        )

        if not created_at:
            continue

        bid_date = created_at.date()

        if bid_date == today:
            bids_today += 1

        if seven_days_ago <= bid_date <= today:
            bids_last_7_days += 1

    # Count auctions with at least one bid.
    auctions_with_bids = sum(
        1
        for auction in auctions
        if bids_by_auction.get(auction.id)
    )

    # Calculate the actual total number of bids.
    total_auction_bids = sum(
        len(bids_by_auction.get(auction.id, []))
        for auction in auctions
    )

    # Average bids per auction that has received bids.
    average_bids_per_auction = (
        round(
            total_auction_bids / auctions_with_bids,
            2
        )
        if auctions_with_bids > 0
        else 0
    )

    # Count bids by auction category.
    category_bid_counts = Counter()

    for auction in auctions:
        category = safe_text(
            getattr(auction, "category", None),
            "Uncategorized"
        )

        category_bid_counts[category] += len(
            bids_by_auction.get(auction.id, [])
        )

    # Find the category receiving the most bids.
    most_active_category = None

    if category_bid_counts:
        category_name, category_bid_count = (
            category_bid_counts.most_common(1)[0]
        )

        if category_bid_count > 0:
            most_active_category = {
                "name": category_name,
                "bid_count": category_bid_count
            }

    # Count auctions without bids.
    auctions_without_bids = sum(
        1
        for auction in auctions
        if not bids_by_auction.get(auction.id)
    )

    insights = {
        "bids_today": bids_today,
        "bids_last_7_days": bids_last_7_days,
        "average_bids_per_auction": average_bids_per_auction,
        "auctions_without_bids": auctions_without_bids,
        "auctions_with_bids": auctions_with_bids,
        "most_active_category": most_active_category
    }
    
    return {
        "suspicious_bids": suspicious_bids,
        "auction_performance": auction_performance,
        "no_bid_auctions": no_bid_auctions,
        "ending_soon_auctions": ending_soon_auctions,
        "recent_users": recent_users_data,
        "insights": insights
    }
# =========================================================
# ADMIN DASHBOARD STATS
# =========================================================

@router.get("/stats")
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    """
    Return real dashboard statistics and recent activity.

    Protected by the existing admin JWT authentication.
    """

    try:
        now = datetime.now()
        today = now.date()
        seven_days_ago = today - timedelta(days=6)

        # -------------------------------------------------
        # LOAD DATABASE RECORDS
        # -------------------------------------------------

        users = db.query(User).all()

        auctions = (
            db.query(Auction)
            .options(joinedload(Auction.images))
            .all()
        )

        bids = (
            db.query(Bid)
            .options(joinedload(Bid.auction))
            .order_by(Bid.created_at.desc())
            .all()
        )

        users_by_id = {
            user.id: user
            for user in users
        }

        # -------------------------------------------------
        # AUCTION STATUS
        # -------------------------------------------------

        status_counts = Counter(
            get_auction_status(auction)
            for auction in auctions
        )

        total_users = len(users)
        total_auctions = len(auctions)
        total_bids = len(bids)

        live_auctions = status_counts.get("live", 0)

        ended_auctions = [
            auction
            for auction in auctions
            if get_auction_status(auction) == "ended"
        ]

        pending_auctions = status_counts.get("pending", 0)
        approved_auctions = status_counts.get("approved", 0)
        rejected_auctions = status_counts.get("rejected", 0)
        draft_auctions = status_counts.get("draft", 0)

        # -------------------------------------------------
        # BIDS BY AUCTION
        # -------------------------------------------------

        bids_by_auction = defaultdict(list)

        for bid in bids:
            bids_by_auction[bid.auction_id].append(bid)

        # -------------------------------------------------
        # CATEGORY DISTRIBUTION
        # -------------------------------------------------

        category_counts = Counter()

        for auction in auctions:
            category = safe_text(
                getattr(auction, "category", None),
                "Uncategorized"
            )

            category_counts[category] += 1

        categories = [
            {
                "name": category,
                "count": count
            }
            for category, count in category_counts.most_common(5)
        ]

        # -------------------------------------------------
        # AUCTION STATUS CHART
        # -------------------------------------------------

        auction_status_chart = [
            {
                "name": "Live",
                "count": live_auctions
            },
            {
                "name": "Upcoming",
                "count": approved_auctions
            },
            {
                "name": "Pending",
                "count": pending_auctions
            },
            {
                "name": "Ended",
                "count": len(ended_auctions)
            },
            {
                "name": "Rejected",
                "count": rejected_auctions
            },
            {
                "name": "Draft",
                "count": draft_auctions
            }
        ]

        # -------------------------------------------------
        # BID ACTIVITY: LAST SEVEN DAYS
        # -------------------------------------------------

        daily_bid_counts = Counter()

        for bid in bids:
            created_at = get_date_value(
                getattr(bid, "created_at", None)
            )

            if created_at and seven_days_ago <= created_at.date() <= today:
                daily_bid_counts[created_at.date()] += 1

        bid_activity = []

        for day_offset in range(7):
            day = seven_days_ago + timedelta(days=day_offset)

            bid_activity.append({
                "date": day.isoformat(),
                "label": day.strftime("%a"),
                "count": daily_bid_counts.get(day, 0)
            })

        # -------------------------------------------------
        # TOP SELLERS
        # -------------------------------------------------

        seller_stats = defaultdict(
            lambda: {
                "auction_count": 0,
                "live_count": 0,
                "ended_count": 0
            }
        )

        for auction in auctions:
            seller_id = getattr(auction, "user_id", None)

            if seller_id is None:
                continue

            seller_stats[seller_id]["auction_count"] += 1

            auction_status = get_auction_status(auction)

            if auction_status == "live":
                seller_stats[seller_id]["live_count"] += 1

            if auction_status == "ended":
                seller_stats[seller_id]["ended_count"] += 1

        top_sellers = []

        for seller_id, stats in sorted(
            seller_stats.items(),
            key=lambda item: (
                item[1]["auction_count"],
                item[1]["ended_count"]
            ),
            reverse=True
        )[:5]:

            seller = users_by_id.get(seller_id)

            if not seller:
                continue

            top_sellers.append({
                "user_id": seller.id,
                "name": get_user_display_name(seller),
                "username": safe_text(
                    getattr(seller, "username", None),
                    ""
                ),
                "profile_image": get_image_url(
                    getattr(seller, "profile_image", None)
                ),
                "auction_count": stats["auction_count"],
                "live_count": stats["live_count"],
                "ended_count": stats["ended_count"]
            })

        # -------------------------------------------------
        # RECENT WINNERS
        # -------------------------------------------------

        recent_winners = []

        for auction in sorted(
            ended_auctions,
            key=lambda item: (
                getattr(item, "auction_end", None)
                or getattr(item, "updated_at", None)
                or getattr(item, "created_at", None)
                or datetime.min
            ),
            reverse=True
        ):

            auction_bids = bids_by_auction.get(auction.id, [])

            if not auction_bids:
                continue

            winning_bid = max(
                auction_bids,
                key=lambda bid: safe_number(
                    getattr(bid, "amount", 0)
                )
            )

            winner = users_by_id.get(
                getattr(winning_bid, "user_id", None)
            )

            winner_name = (
                get_user_display_name(winner)
                if winner
                else get_bidder_name(winning_bid)
            )

            recent_winners.append({
                "auction_id": auction.id,
                "product_title": safe_text(
                    getattr(auction, "product_title", None),
                    "Untitled auction"
                ),
                "product_image": get_auction_image(auction),
                "winner_name": winner_name,
                "winning_bid": format_amount(
                    getattr(winning_bid, "amount", 0)
                ),
                "auction_end": (
                    auction.auction_end.isoformat()
                    if getattr(auction, "auction_end", None)
                    else None
                )
            })

            if len(recent_winners) >= 5:
                break

        # -------------------------------------------------
        # LATEST BIDS
        # -------------------------------------------------

        latest_bids = []

        for bid in bids[:10]:

            auction = getattr(bid, "auction", None)

            user = users_by_id.get(
                getattr(bid, "user_id", None)
            )

            bidder_name = (
                get_user_display_name(user)
                if user
                else get_bidder_name(bid)
            )

            auction_bids = bids_by_auction.get(
                getattr(bid, "auction_id", None),
                []
            )

            highest_amount = max(
                (
                    safe_number(getattr(item, "amount", 0))
                    for item in auction_bids
                ),
                default=0
            )

            bid_amount = safe_number(
                getattr(bid, "amount", 0)
            )

            if bid_amount >= highest_amount:
                bid_status = "Highest"
            else:
                bid_status = "Outbid"

            latest_bids.append({
                "id": bid.id,
                "auction_id": bid.auction_id,
                "product_title": (
                    safe_text(
                        getattr(auction, "product_title", None),
                        "Auction unavailable"
                    )
                    if auction
                    else "Auction unavailable"
                ),
                "bidder_name": bidder_name,
                "amount": format_amount(bid_amount),
                "status": bid_status,
                "created_at": (
                    bid.created_at.isoformat()
                    if getattr(bid, "created_at", None)
                    else None
                )
            })

                # -------------------------------------------------
        # WINNING BID VALUE / PAYMENT DATA
        # -------------------------------------------------
        #
        # Bidora currently has no payment transaction model.
        # Therefore, calculate the winning bid value from
        # actual ended auctions and their highest bids.
        #
        # This is NOT confirmed collected revenue.
        # -------------------------------------------------

        monthly_totals = defaultdict(float)

        total_winning_bid_value = 0.0
        ended_auctions_with_bids = 0

        for auction in ended_auctions:

            auction_bids = bids_by_auction.get(
                auction.id,
                []
            )

            # Ignore ended auctions without bids.
            if not auction_bids:
                continue

            # Select the highest actual bid.
            winning_bid = max(
                auction_bids,
                key=lambda bid: safe_number(
                    getattr(bid, "amount", 0)
                )
            )

            winning_amount = safe_number(
                getattr(winning_bid, "amount", 0)
            )

            # Ignore invalid or non-positive amounts.
            if winning_amount <= 0:
                continue

            total_winning_bid_value += winning_amount
            ended_auctions_with_bids += 1

            # Use the auction end date for monthly grouping.
            auction_date = (
                get_date_value(
                    getattr(auction, "auction_end", None)
                )
                or get_date_value(
                    getattr(auction, "updated_at", None)
                )
                or get_date_value(
                    getattr(auction, "created_at", None)
                )
            )

            if auction_date:
                month_key = auction_date.strftime("%Y-%m")
                monthly_totals[month_key] += winning_amount

        # Prepare the last six calendar months.
        monthly_revenue = []

        current_month = now.replace(
            day=1,
            hour=0,
            minute=0,
            second=0,
            microsecond=0
        )

        for offset in range(5, -1, -1):

            month_date = (
                current_month.replace(day=1)
            )

            # Move backwards by the required number of months.
            month_index = (
                month_date.year * 12
                + month_date.month - 1
                - offset
            )

            year = month_index // 12
            month = month_index % 12 + 1

            month_key = f"{year:04d}-{month:02d}"

            month_label = datetime(
                year,
                month,
                1
            ).strftime("%b")

            monthly_revenue.append({
                "month": month_key,
                "label": month_label,
                "amount": format_amount(
                    monthly_totals.get(month_key, 0)
                )
            })

        payment_data = {
            "available": True,
            "payment_tracking_enabled": False,

            "message": (
                "Values represent winning bids on ended auctions. "
                "Actual payment collection is not tracked."
            ),

            "total_revenue": format_amount(
                total_winning_bid_value
            ),

            "paid_count": 0,

            "pending_count": 0,

            "failed_count": 0,

            "winning_auction_count": (
                ended_auctions_with_bids
            ),

            "monthly_revenue": monthly_revenue
        }

        # -------------------------------------------------
        # USER COUNTS
        # -------------------------------------------------

        seller_count = sum(
            1
            for user in users
            if getattr(user, "role_id", None) == 2
        )

        buyer_count = sum(
            1
            for user in users
            if getattr(user, "role_id", None) == 3
        )

                # -------------------------------------------------
        # ADDITIONAL DASHBOARD ANALYTICS
        # -------------------------------------------------

        additional_data = build_additional_dashboard_data(
            users=users,
            auctions=auctions,
            bids=bids,
            users_by_id=users_by_id,
            bids_by_auction=bids_by_auction,
            now=now
        )

        # -------------------------------------------------
        # RESPONSE
        # -------------------------------------------------

        return {
            "success": True,
            "generated_at": now.isoformat(),

            "stats": {
                "total_users": total_users,
                "total_auctions": total_auctions,
                "live_auctions": live_auctions,
                "total_bids": total_bids,
                "ended_auctions": len(ended_auctions),
                "pending_auctions": pending_auctions,
                "seller_count": seller_count,
                "buyer_count": buyer_count
            },

            "bid_activity": bid_activity,

            "auction_status": auction_status_chart,

            "categories": categories,

            "top_sellers": top_sellers,

            "recent_winners": recent_winners,

            "latest_bids": latest_bids,

            "payments": payment_data,

            # Additional dashboard sections
            "suspicious_bids": additional_data["suspicious_bids"],

            "auction_performance": additional_data[
                "auction_performance"
            ],

            "no_bid_auctions": additional_data[
                "no_bid_auctions"
            ],

            "ending_soon_auctions": additional_data[
                "ending_soon_auctions"
            ],

            "recent_users": additional_data["recent_users"],

            "insights": additional_data["insights"]
        }

    except HTTPException:
        raise

    except Exception as exc:
        print(
            "Admin dashboard statistics error:",
            str(exc)
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to load admin dashboard statistics."
        )