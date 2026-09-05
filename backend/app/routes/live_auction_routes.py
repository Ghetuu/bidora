from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.auction import Auction
from app.models.user import User
from app.core.auth import get_current_user

router = APIRouter(
    prefix="/api/live-auctions",
    tags=["Live Auctions"]
)


# =========================================================
# GET ALL LIVE AUCTIONS
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

                # Seller
                "seller_name": auction.seller_name,
                "seller_email": auction.seller_email,
                "seller_contact": auction.seller_contact,

                # Location
                "location_area": auction.location_area,
                "location_city": auction.location_city,
                "location_state": auction.location_state,
                "location_country": auction.location_country,
                "location_pincode": auction.location_pincode,

                # Shipping
                "delivery_type": auction.delivery_type,
                "shipping_type": auction.shipping_type,
                "shipping_paid_by": auction.shipping_paid_by,

                "shipping_charges": (
                    float(auction.shipping_charges)
                    if auction.shipping_charges is not None
                    else 0
                ),

                # Images
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

        return {
            "success": True,

            "auction": {
                "id": auction.id,
                "user_id": auction.user_id,

                # Product
                "product_title": auction.product_title,
                "brand_model": auction.brand_model,
                "category": auction.category,
                "description": auction.description,
                "product_condition": auction.product_condition,

                # Purchase
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

                # Auction
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

                # Warranty / Payment
                "warranty_status": auction.warranty_status,
                "payment_method": auction.payment_method,
                "product_terms": auction.product_terms,
                "terms_accepted": auction.terms_accepted,

                # Seller
                "seller_name": auction.seller_name,
                "seller_email": auction.seller_email,
                "seller_contact": auction.seller_contact,

                # Location
                "location_area": auction.location_area,
                "location_city": auction.location_city,
                "location_state": auction.location_state,
                "location_country": auction.location_country,
                "location_pincode": auction.location_pincode,

                # Shipping
                "delivery_type": auction.delivery_type,
                "shipping_type": auction.shipping_type,
                "shipping_paid_by": auction.shipping_paid_by,

                "shipping_charges": (
                    float(auction.shipping_charges)
                    if auction.shipping_charges is not None
                    else 0
                ),

                # Images
                "images": [
                    {
                        "id": image.id,
                        "image_path": image.image_path,
                        "display_order": image.display_order
                    }
                    for image in images
                ]
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