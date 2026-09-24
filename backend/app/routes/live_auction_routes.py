from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from decimal import Decimal

from app.database import get_db
from app.models.auction import Auction
from app.models.bids import Bid
from app.models.user import User
from app.core.auth import get_current_user

router = APIRouter(
    prefix="/api/live-auctions",
    tags=["Live Auctions"]
)


# =========================================================
# GET ALL LIVE AUCTIONS
# (unchanged)
# =========================================================

@router.get("/")
def get_live_auctions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        auctions = (
            db.query(Auction)
            .filter(Auction.status == "LIVE")
            .order_by(Auction.auction_end.asc())
            .all()
        )

        result = []

        for auction in auctions:

            images = sorted(
                auction.images or [],
                key=lambda image: (
                    image.display_order
                    if image.display_order is not None
                    else 0
                )
            )

            result.append({
                "id": auction.id,
                "product_title": auction.product_title,
                "brand_model": auction.brand_model,
                "category": auction.category,
                "description": auction.description,
                "product_condition": auction.product_condition,

                "starting_price": (
                    float(auction.starting_price)
                    if auction.starting_price is not None
                    else 0
                ),

                "auction_start": (
                    auction.auction_start.isoformat()
                    if auction.auction_start
                    else None
                ),

                "auction_end": (
                    auction.auction_end.isoformat()
                    if auction.auction_end
                    else None
                ),

                "status": auction.status,

                "warranty_status": auction.warranty_status,
                "payment_method": auction.payment_method,
                "product_terms": auction.product_terms,
                "terms_accepted": auction.terms_accepted,

                "seller_name": auction.seller_name,
                "seller_email": auction.seller_email,
                "seller_contact": auction.seller_contact,

                "location_area": auction.location_area,
                "location_city": auction.location_city,
                "location_state": auction.location_state,
                "location_country": auction.location_country,
                "location_pincode": auction.location_pincode,

                "delivery_type": auction.delivery_type,
                "shipping_type": auction.shipping_type,
                "shipping_paid_by": auction.shipping_paid_by,

                "shipping_charges": (
                    float(auction.shipping_charges)
                    if auction.shipping_charges is not None
                    else 0
                ),

                "images": [
                    {
                        "id": image.id,
                        "image_path": image.image_path,
                        "display_order": image.display_order
                    }
                    for image in images
                ]
            })

        return {
            "success": True,
            "count": len(result),
            "auctions": result
        }

    except Exception as e:
        print("LIVE AUCTIONS ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail="Failed to load live auctions."
        )


# =========================================================
# GET SINGLE LIVE AUCTION
# ADDED: bids list, sorted highest -> lowest
# =========================================================

@router.get("/{auction_id}")
def get_live_auction(
    auction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:

        auction = (
            db.query(Auction)
            .filter(
                Auction.id == auction_id,
                Auction.status == "LIVE"
            )
            .first()
        )

        if not auction:
            raise HTTPException(
                status_code=404,
                detail="Live auction not found."
            )

        images = sorted(
            auction.images or [],
            key=lambda image: (
                image.display_order
                if image.display_order is not None
                else 0
            )
        )

        # =========================================================
        # BIDS (highest first) — powers the trend chart,
        # Bid History card, and All Bids table on the frontend.
        # =========================================================

        sorted_bids = sorted(
            auction.bids or [],
            key=lambda bid: bid.amount,
            reverse=True
        )

        return {
            "success": True,

            "auction": {
                "id": auction.id,
                "user_id": auction.user_id,

                "product_title": auction.product_title,
                "brand_model": auction.brand_model,
                "category": auction.category,
                "description": auction.description,
                "product_condition": auction.product_condition,

                "purchase_date": (
                    auction.purchase_date.isoformat()
                    if auction.purchase_date
                    else None
                ),

                "purchased_by": auction.purchased_by,

                "purchase_price": (
                    float(auction.purchase_price)
                    if auction.purchase_price is not None
                    else 0
                ),

                "purchase_proof_path": auction.purchase_proof_path,
                "seller_proof_path": auction.seller_proof_path,

                "starting_price": (
                    float(auction.starting_price)
                    if auction.starting_price is not None
                    else 0
                ),

                "auction_start": (
                    auction.auction_start.isoformat()
                    if auction.auction_start
                    else None
                ),

                "auction_end": (
                    auction.auction_end.isoformat()
                    if auction.auction_end
                    else None
                ),

                "status": auction.status,

                "warranty_status": auction.warranty_status,
                "payment_method": auction.payment_method,
                "product_terms": auction.product_terms,
                "terms_accepted": auction.terms_accepted,

                "seller_name": auction.seller_name,
                "seller_email": auction.seller_email,
                "seller_contact": auction.seller_contact,

                "location_area": auction.location_area,
                "location_city": auction.location_city,
                "location_state": auction.location_state,
                "location_country": auction.location_country,
                "location_pincode": auction.location_pincode,

                "delivery_type": auction.delivery_type,
                "shipping_type": auction.shipping_type,
                "shipping_paid_by": auction.shipping_paid_by,

                "shipping_charges": (
                    float(auction.shipping_charges)
                    if auction.shipping_charges is not None
                    else 0
                ),

                "images": [
                    {
                        "id": image.id,
                        "image_path": image.image_path,
                        "display_order": image.display_order
                    }
                    for image in images
                ],

                # ---------------------------------------------
                # BIDS
                # ---------------------------------------------

                "bids": [
                    {
                        "id": bid.id,
                        "user_id": bid.user_id,
                        "bidder_name": bid.bidder_name,
                        "amount": float(bid.amount),
                        "bid_time": bid.created_at.isoformat()
                        if bid.created_at
                        else None
                    }
                    for bid in sorted_bids
                ],

                "total_bids": len(sorted_bids),

                "current_bid": (
                    float(sorted_bids[0].amount)
                    if sorted_bids
                    else None
                )
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        print("SINGLE LIVE AUCTION ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail="Failed to load live auction."
        )


# =========================================================
# PLACE A BID  (NEW)
# So the "Place a Bid" button on the frontend can persist
# a real bid instead of just showing an alert().
# =========================================================
# =========================================================
# PLACE A BID
# =========================================================

class PlaceBidRequest(BaseModel):
    amount: Decimal


@router.post("/{auction_id}/bid")
def place_bid(
    auction_id: int,
    payload: PlaceBidRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:

        # -------------------------------------------------
        # FIND LIVE AUCTION
        # -------------------------------------------------

        auction = (
            db.query(Auction)
            .filter(
                Auction.id == auction_id,
                Auction.status == "LIVE"
            )
            .first()
        )

        if not auction:
            raise HTTPException(
                status_code=404,
                detail="Live auction not found."
            )

        # -------------------------------------------------
        # SELLER CANNOT BID ON OWN AUCTION
        # -------------------------------------------------

        if str(current_user.id) == str(auction.user_id):
            raise HTTPException(
                status_code=403,
                detail="Sellers cannot bid on their own auction."
            )

        # -------------------------------------------------
        # VALIDATE BID AMOUNT
        # -------------------------------------------------

        if payload.amount <= 0:
            raise HTTPException(
                status_code=400,
                detail="Bid amount must be greater than zero."
            )

        # -------------------------------------------------
        # GET CURRENT HIGHEST BID
        # -------------------------------------------------

        highest = (
            db.query(Bid)
            .filter(
                Bid.auction_id == auction.id
            )
            .order_by(
                Bid.amount.desc()
            )
            .first()
        )

        # If no previous bid exists,
        # starting price becomes the minimum.
        floor_price = (
            highest.amount
            if highest
            else auction.starting_price
        )

        # -------------------------------------------------
        # BID MUST BE HIGHER
        # -------------------------------------------------

        if floor_price is not None:
            if payload.amount <= floor_price:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Your bid must be higher than "
                        f"₹{floor_price}."
                    )
                )

        # -------------------------------------------------
        # GET BIDDER NAME
        # -------------------------------------------------

        bidder_name = (
            getattr(current_user, "fullname", None)
            or getattr(current_user, "full_name", None)
            or getattr(current_user, "username", None)
            or getattr(current_user, "email", None)
            or "Bidder"
        )

        # -------------------------------------------------
        # CREATE BID
        # -------------------------------------------------

        new_bid = Bid(
            auction_id=auction.id,
            user_id=current_user.id,
            bidder_name=bidder_name,
            amount=payload.amount
        )

        db.add(new_bid)

        # -------------------------------------------------
        # SAVE TO DATABASE
        # -------------------------------------------------

        db.commit()
        db.refresh(new_bid)

        print("========================================")
        print("BID SAVED SUCCESSFULLY")
        print("Bid ID:", new_bid.id)
        print("Auction ID:", new_bid.auction_id)
        print("User ID:", new_bid.user_id)
        print("Bidder:", new_bid.bidder_name)
        print("Amount:", new_bid.amount)
        print("========================================")

        return {
            "success": True,
            "message": "Bid placed successfully.",
            "bid": {
                "id": new_bid.id,
                "auction_id": new_bid.auction_id,
                "user_id": new_bid.user_id,
                "bidder_name": new_bid.bidder_name,
                "amount": float(new_bid.amount),
                "bid_time": (
                    new_bid.created_at.isoformat()
                    if new_bid.created_at
                    else None
                )
            }
        }

    except HTTPException:
        raise

    except Exception as e:

        db.rollback()

        print("========================================")
        print("PLACE BID ERROR")
        print(repr(e))
        print("========================================")

        raise HTTPException(
            status_code=500,
            detail="Unable to place bid."
        )

# =========================================================
# GET BUYER DETAILS FOR A BIDDER
#
# Used by the seller from the "All Bids" table.
#
# This endpoint:
# - Verifies the auction exists
# - Verifies the buyer actually bid on this auction
# - Verifies the logged-in user owns the auction
# - Returns registration + bidding + auction activity
# =========================================================

@router.get("/{auction_id}/bidders/{buyer_id}/details")
def get_buyer_details(
    auction_id: int,
    buyer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:

        # -------------------------------------------------
        # FIND AUCTION
        # -------------------------------------------------

        auction = (
            db.query(Auction)
            .filter(
                Auction.id == auction_id
            )
            .first()
        )

        if not auction:
            raise HTTPException(
                status_code=404,
                detail="Auction not found."
            )

        # -------------------------------------------------
        # ONLY THE AUCTION SELLER CAN VIEW BIDDER DETAILS
        # -------------------------------------------------

        if current_user.id != auction.user_id:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Only the seller of this auction "
                    "can view bidder details."
                )
            )

        # -------------------------------------------------
        # FIND BUYER
        # -------------------------------------------------

        buyer = (
            db.query(User)
            .filter(
                User.id == buyer_id
            )
            .first()
        )

        if not buyer:
            raise HTTPException(
                status_code=404,
                detail="Buyer not found."
            )

        # -------------------------------------------------
        # VERIFY THAT THIS USER ACTUALLY BID ON AUCTION
        # -------------------------------------------------

        auction_bid = (
            db.query(Bid)
            .filter(
                Bid.auction_id == auction_id,
                Bid.user_id == buyer_id
            )
            .first()
        )

        if not auction_bid:
            raise HTTPException(
                status_code=404,
                detail="This user has not bid on this auction."
            )

        # =================================================
        # ALL BIDS MADE BY THIS USER
        # =================================================

        buyer_bids = (
            db.query(Bid)
            .filter(
                Bid.user_id == buyer_id
            )
            .order_by(
                Bid.created_at.desc()
            )
            .all()
        )

        # -------------------------------------------------
        # TOTAL BIDS
        # -------------------------------------------------

        total_bids = len(buyer_bids)

        # -------------------------------------------------
        # TOTAL BID VALUE
        # -------------------------------------------------

        total_bid_value = sum(
            Decimal(str(bid.amount))
            for bid in buyer_bids
            if bid.amount is not None
        )

        # -------------------------------------------------
        # HIGHEST BID
        # -------------------------------------------------

        highest_bid = max(
            (
                Decimal(str(bid.amount))
                for bid in buyer_bids
                if bid.amount is not None
            ),
            default=Decimal("0")
        )

        # =================================================
        # AUCTIONS PARTICIPATED IN
        # =================================================

        participated_auction_ids = {
            bid.auction_id
            for bid in buyer_bids
        }

        auctions_participated = len(
            participated_auction_ids
        )

        # =================================================
        # AUCTIONS CREATED BY THIS USER
        # =================================================

        created_auctions = (
            db.query(Auction)
            .filter(
                Auction.user_id == buyer_id
            )
            .all()
        )

        auctions_created = len(created_auctions)

        # -------------------------------------------------
        # ACTIVE AUCTIONS CREATED
        # -------------------------------------------------

        active_auctions_created = sum(
            1
            for item in created_auctions
            if str(item.status).lower() == "live"
        )

        # -------------------------------------------------
        # COMPLETED AUCTIONS CREATED
        # -------------------------------------------------

        completed_auctions_created = sum(
            1
            for item in created_auctions
            if str(item.status).lower() == "ended"
        )

        # =================================================
        # AUCTIONS WON
        #
        # Your Auction model does not have a winner_id
        # column.
        #
        # Therefore, for an ended auction, the winner is
        # determined by the highest bid.
        # =================================================

        auctions_won = 0

        ended_auctions = (
            db.query(Auction)
            .filter(
                Auction.status == "ended"
            )
            .all()
        )

        for ended_auction in ended_auctions:

            ended_bids = (
                db.query(Bid)
                .filter(
                    Bid.auction_id == ended_auction.id
                )
                .order_by(
                    Bid.amount.desc()
                )
                .all()
            )

            if not ended_bids:
                continue

            highest_ended_bid = ended_bids[0]

            if highest_ended_bid.user_id == buyer_id:
                auctions_won += 1

        # =================================================
        # CURRENT AUCTION BID ACTIVITY
        # =================================================

        current_auction_bids = [
            bid
            for bid in buyer_bids
            if bid.auction_id == auction_id
        ]

        current_auction_highest_bid = max(
            (
                Decimal(str(bid.amount))
                for bid in current_auction_bids
                if bid.amount is not None
            ),
            default=Decimal("0")
        )

        # =================================================
        # REGISTRATION DATE
        # =================================================

        registration_date = (
            buyer.registration_date.isoformat()
            if buyer.registration_date
            else None
        )

        # =================================================
        # PROFILE IMAGE
        # =================================================

        profile_image = buyer.profile_image

        # =================================================
        # RESPONSE
        # =================================================

        return {
            "success": True,

            "buyer": {
                "id": buyer.id,
                "fullname": buyer.fullname,
                "username": buyer.username,
                "email": buyer.email,
                "mobile": buyer.mobile,
                "address": buyer.address,
                "profile_image": profile_image,
                "email_verified": buyer.email_verified,
                "account_status": buyer.account_status,
                "registration_date": registration_date
            },

            "current_auction": {
                "auction_id": auction.id,
                "bid_count": len(current_auction_bids),
                "highest_bid": float(
                    current_auction_highest_bid
                )
            },

            "bidding_stats": {
                "total_bids": total_bids,
                "auctions_participated": auctions_participated,
                "total_bid_value": float(
                    total_bid_value
                ),
                "highest_bid": float(
                    highest_bid
                )
            },

            "auction_stats": {
                "auctions_created": auctions_created,
                "auctions_won": auctions_won,
                "active_auctions_created": (
                    active_auctions_created
                ),
                "completed_auctions_created": (
                    completed_auctions_created
                )
            },

            "recent_bids": [
                {
                    "auction_id": bid.auction_id,
                    "amount": float(bid.amount),
                    "bid_time": (
                        bid.created_at.isoformat()
                        if bid.created_at
                        else None
                    )
                }
                for bid in buyer_bids[:10]
            ]
        }

    except HTTPException:
        raise

    except Exception as e:

        print("========================================")
        print("BUYER DETAILS ERROR")
        print(repr(e))
        print("========================================")

        raise HTTPException(
            status_code=500,
            detail="Failed to load buyer details."
        )