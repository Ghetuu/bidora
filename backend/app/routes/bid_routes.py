from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.auth import get_current_user

from app.models.user import User
from app.models.bids import Bid
from app.models.auction import Auction


router = APIRouter(
    prefix="/api/bid-history",
    tags=["Bid History"]
)


# =========================================================
# HELPER - AUCTION TIME STATUS
# =========================================================

def get_time_status(auction):
    """
    Returns:
        upcoming
        live
        ended
    """

    if not auction.auction_start or not auction.auction_end:
        return "unknown"

    now = datetime.now(timezone.utc)

    start_time = auction.auction_start
    end_time = auction.auction_end

    # Database datetime may be timezone-naive
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)

    if end_time.tzinfo is None:
        end_time = end_time.replace(tzinfo=timezone.utc)

    if now < start_time:
        return "upcoming"

    if start_time <= now <= end_time:
        return "live"

    return "ended"


# =========================================================
# HELPER - TIME LEFT
# =========================================================

def get_time_left(auction):
    """
    Creates a simple display value for the frontend.
    """

    status = get_time_status(auction)

    if status == "upcoming":
        return "Upcoming"

    if status == "ended":
        return "Ended"

    now = datetime.now(timezone.utc)

    end_time = auction.auction_end

    if end_time.tzinfo is None:
        end_time = end_time.replace(tzinfo=timezone.utc)

    remaining = end_time - now

    total_seconds = int(remaining.total_seconds())

    if total_seconds <= 0:
        return "Ended"

    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60

    if hours > 0:
        return f"{hours}h {minutes}m"

    return f"{minutes}m"


# =========================================================
# GET BID HISTORY
# =========================================================

@router.get("")
def get_bid_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    try:

        # =====================================================
        # 1. BIDS PLACED BY CURRENT USER
        # =====================================================

        my_bids = (
            db.query(Bid, Auction)
            .join(
                Auction,
                Bid.auction_id == Auction.id
            )
            .filter(
                Bid.user_id == current_user.id
            )
            .order_by(
                Bid.created_at.desc()
            )
            .all()
        )


        # =====================================================
        # GROUP USER BIDS BY AUCTION
        # =====================================================

        auction_bid_map = {}

        for bid, auction in my_bids:

            if auction.id not in auction_bid_map:
                auction_bid_map[auction.id] = {
                    "auction": auction,
                    "bids": []
                }

            auction_bid_map[auction.id]["bids"].append(bid)


        my_bids_result = []

        for auction_id, data in auction_bid_map.items():

            auction = data["auction"]
            bids = data["bids"]

            # Highest amount placed by current user
            my_highest_bid = max(
                Decimal(str(bid.amount))
                for bid in bids
            )

            # Get highest bid in entire auction
            highest_bid = (
                db.query(Bid)
                .filter(
                    Bid.auction_id == auction.id
                )
                .order_by(
                    Bid.amount.desc()
                )
                .first()
            )

            current_high = (
                Decimal(str(highest_bid.amount))
                if highest_bid
                else Decimal("0")
            )

            # =================================================
            # DETERMINE USER BID STATUS
            # =================================================

            auction_time_status = get_time_status(auction)

            if (
                auction_time_status == "ended"
                and highest_bid
                and highest_bid.user_id == current_user.id
            ):
                bid_status = "Won Auction"

            elif current_high > my_highest_bid:
                bid_status = "Outbid"

            else:
                bid_status = "Highest Bidder"


            # =================================================
            # IMAGE
            # =================================================

            sorted_images = sorted(
                auction.images or [],
                key=lambda image: (
                    image.display_order
                    if image.display_order is not None
                    else 0
                )
            )

            image_path = None

            if sorted_images:
                image_path = sorted_images[0].image_path


            my_bids_result.append({

                "id": auction.id,

                "auction_id": auction.id,

                "title": auction.product_title,

                "category": auction.category,

                "image": image_path,

                "seller": auction.seller_name,

                "current_high": float(current_high),

                "my_max_bid": float(my_highest_bid),

                "time_left": get_time_left(auction),

                "auction_status": auction_time_status,

                "status": bid_status,

                "my_bid_count": len(bids),

                "last_bid_at": (
                    bids[0].created_at.isoformat()
                    if bids
                    else None
                )
            })


        # =====================================================
        # 2. BIDS RECEIVED ON CURRENT USER'S AUCTIONS
        # =====================================================

        received_rows = (
            db.query(Bid, Auction)
            .join(
                Auction,
                Bid.auction_id == Auction.id
            )
            .filter(
                Auction.user_id == current_user.id
            )
            .order_by(
                Bid.created_at.desc()
            )
            .all()
        )


        bids_received_result = []

        for bid, auction in received_rows:

            # -----------------------------------------------
            # IMAGE
            # -----------------------------------------------

            sorted_images = sorted(
                auction.images or [],
                key=lambda image: (
                    image.display_order
                    if image.display_order is not None
                    else 0
                )
            )

            image_path = None

            if sorted_images:
                image_path = sorted_images[0].image_path


            # -----------------------------------------------
            # HIGHEST BID
            # -----------------------------------------------

            highest_bid = (
                db.query(Bid)
                .filter(
                    Bid.auction_id == auction.id
                )
                .order_by(
                    Bid.amount.desc()
                )
                .first()
            )


            is_highest = (
                highest_bid is not None
                and highest_bid.id == bid.id
            )


            bids_received_result.append({

                "bid_id": bid.id,

                "auction_id": auction.id,

                "title": auction.product_title,

                "category": auction.category,

                "image": image_path,

                "bidder": bid.bidder_name,

                "bidder_id": bid.user_id,

                "bid_amount": float(bid.amount),

                "created_at": (
                    bid.created_at.isoformat()
                    if bid.created_at
                    else None
                ),

                "auction_status": get_time_status(
                    auction
                ),

                "is_highest": is_highest
            })


        # =====================================================
        # 3. SUMMARY
        # =====================================================

        total_bids_placed = (
            db.query(Bid)
            .filter(
                Bid.user_id == current_user.id
            )
            .count()
        )


        active_my_bids = sum(
            1
            for item in my_bids_result
            if item["auction_status"] in [
                "live",
                "upcoming"
            ]
        )


        outbid_items = sum(
            1
            for item in my_bids_result
            if item["status"] == "Outbid"
        )


        total_bids_received = len(
            bids_received_result
        )


        listing_ids = set(
            item["auction_id"]
            for item in bids_received_result
        )


        highest_incoming_offer = Decimal("0")


        if bids_received_result:

            highest_incoming_offer = max(
                Decimal(
                    str(item["bid_amount"])
                )
                for item in bids_received_result
            )


        # =====================================================
        # 4. RESPONSE
        # =====================================================

        return {

            "success": True,

            "summary": {

                "bids_placed": total_bids_placed,

                "active_bids": active_my_bids,

                "outbid_items": outbid_items,

                "bids_received": total_bids_received,

                "listings_with_bids": len(
                    listing_ids
                ),

                "highest_incoming_offer": float(
                    highest_incoming_offer
                )
            },

            "my_bids": my_bids_result,

            "bids_received": bids_received_result,

            "activity": []

        }


    except Exception as e:

        print(
            "GET BID HISTORY ERROR:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to load bid history."
        )