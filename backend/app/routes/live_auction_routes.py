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

