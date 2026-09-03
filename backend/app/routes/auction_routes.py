from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    UploadFile,
    HTTPException
)

from pydantic import ValidationError

from sqlalchemy.orm import Session

from app.database import get_db

from app.core.auth import get_current_user

from app.models.user import User
from app.models.auction import Auction
from app.models.auction_image import AuctionImage
from app.repositories.auction_repository import (
    AuctionRepository
)

from app.schemas.auction import AuctionCreate

from app.services.auction_services import (
    AuctionService
)


router = APIRouter(
    prefix="/api/auctions",
    tags=["Auctions"]
)


repository = AuctionRepository()

service = AuctionService(
    repository
)


@router.post("")
async def create_auction(

    product_title: str = Form(...),
    brand_model: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    product_condition: str = Form(...),
    purchase_date: date = Form(...),
    purchased_by: str = Form(...),
    purchase_price: Decimal = Form(...),
    starting_price: Decimal = Form(...),
    auction_start: datetime = Form(...),
    auction_end: datetime = Form(...),
    location_area: str = Form(...),
    location_city: str = Form(...),
    location_state: str = Form(...),
    location_country: str = Form(...),
    location_pincode: str = Form(...),
    delivery_type: str = Form(...),
    shipping_type: str = Form(...),
    shipping_charges: Decimal = Form(Decimal("0")),
    shipping_paid_by: Optional[str] = Form(None),
    warranty_status: Optional[str] = Form(None),
    payment_method: str = Form(...),
    product_terms: str = Form(...),
    terms_accepted: bool = Form(...),
    seller_name: str = Form(...),
    seller_email: str = Form(...),
    seller_contact: str = Form(...),

    images: List[UploadFile] = File(...),
    purchase_proof: UploadFile = File(...),
    seller_proof: UploadFile = File(...),

    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # ==========================================
    # BUILD VALIDATED DATA
    # ==========================================
    #
    # Wrapped in try/except so Pydantic validation
    # errors return a clean 422 JSON response instead
    # of an unhandled 500 that the browser blocks
    # as a CORS/network failure.
    #

    try:
        auction_data = AuctionCreate(

            product_title=product_title,
            brand_model=brand_model,
            category=category,
            description=description,
            product_condition=product_condition,
            purchase_date=purchase_date,
            purchased_by=purchased_by,
            purchase_price=purchase_price,
            starting_price=starting_price,
            auction_start=auction_start,
            auction_end=auction_end,
            location_area=location_area,
            location_city=location_city,
            location_state=location_state,
            location_country=location_country,
            location_pincode=location_pincode,
            delivery_type=delivery_type,
            shipping_type=shipping_type,
            shipping_charges=shipping_charges,
            shipping_paid_by=shipping_paid_by,
            warranty_status=warranty_status,
            payment_method=payment_method,
            product_terms=product_terms,
            terms_accepted=terms_accepted,
            seller_name=seller_name,
            seller_email=seller_email,
            seller_contact=seller_contact
        )

    except ValidationError as e:

        raise HTTPException(
            status_code=422,
            detail=[
                {
                    "loc": list(err["loc"]),
                    "msg": err["msg"]
                }
                for err in e.errors()
            ]
        )

    # ==========================================
    # CREATE AUCTION
    # ==========================================

    try:
        auction = await service.create_auction(

            db=db,
            user_id=current_user.id,
            auction_data=auction_data,
            images=images,
            purchase_proof=purchase_proof,
            seller_proof=seller_proof
        )

    except Exception as e:

        print("CREATE AUCTION SERVICE ERROR:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Unable to create auction. Please try again."
        )

    return {

        "success": True,

        "message": (
            "Auction submitted successfully "
            "and is waiting for admin approval."
        ),

        "auction_id": auction.id,

        "status": auction.status
    }

# =========================================================
# GET MY AUCTIONS
# =========================================================

@router.get("/my-auctions")
def get_my_auctions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:

        auctions = (
            db.query(Auction)
            .filter(
                Auction.user_id == current_user.id
            )
            .order_by(
                Auction.created_at.desc()
            )
            .all()
        )

        result = []

        for auction in auctions:

            # ==========================================
            # PRODUCT IMAGES
            # ==========================================

            auction_images = sorted(
                auction.images,
                key=lambda image: image.display_order
            )

            # ==========================================
            # BUILD RESPONSE
            # ==========================================

            result.append({

                # ======================================
                # BASIC
                # ======================================

                "id": auction.id,
                "user_id": auction.user_id,

                # ======================================
                # PRODUCT INFORMATION
                # ======================================

                "product_title": auction.product_title,
                "brand_model": auction.brand_model,
                "category": auction.category,
                "description": auction.description,
                "product_condition": auction.product_condition,

                # ======================================
                # PURCHASE INFORMATION
                # ======================================

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

                # ======================================
                # AUCTION INFORMATION
                # ======================================

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

                # ======================================
                # LOCATION
                # ======================================

                "location_area": auction.location_area,
                "location_city": auction.location_city,
                "location_state": auction.location_state,
                "location_country": auction.location_country,
                "location_pincode": auction.location_pincode,

                # ======================================
                # DELIVERY & SHIPPING
                # ======================================

                "delivery_type": auction.delivery_type,
                "shipping_type": auction.shipping_type,

                "shipping_charges": (
                    float(auction.shipping_charges)
                    if auction.shipping_charges is not None
                    else 0
                ),

                "shipping_paid_by": auction.shipping_paid_by,

                # ======================================
                # ADDITIONAL INFORMATION
                # ======================================

                "warranty_status": auction.warranty_status,
                "payment_method": auction.payment_method,

                "product_terms": auction.product_terms,
                "terms_accepted": auction.terms_accepted,

                # ======================================
                # SELLER INFORMATION
                # ======================================

                "seller_name": auction.seller_name,
                "seller_email": auction.seller_email,
                "seller_contact": auction.seller_contact,

                # ======================================
                # PRODUCT IMAGES
                # ======================================

                "images": [
                    {
                        "id": image.id,
                        "image_path": image.image_path,
                        "display_order": image.display_order
                    }
                    for image in auction_images
                ],

                # ======================================
                # DOCUMENTS
                # ======================================

                "purchase_proof_path": auction.purchase_proof_path,

                "seller_proof_path": auction.seller_proof_path,

                # ======================================
                # RECORD INFORMATION
                # ======================================

                "created_at": (
                    auction.created_at.isoformat()
                    if auction.created_at
                    else None
                ),

                "updated_at": (
                    auction.updated_at.isoformat()
                    if auction.updated_at
                    else None
                )
            })

        return result

    except Exception as e:

        print("GET MY AUCTIONS ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail="Unable to load your auctions."
        )