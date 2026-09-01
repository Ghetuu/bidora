import os
import uuid
from pathlib import Path

from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.models.auction import Auction
from app.repositories.auction_repository import AuctionRepository
from app.schemas.auction import AuctionCreate
from app.models.auction_image import AuctionImage


BASE_DIR = Path(__file__).resolve().parents[2]

UPLOAD_DIR = BASE_DIR / "uploads"

AUCTION_IMAGE_DIR = (
    UPLOAD_DIR / "auctions"
)

PURCHASE_PROOF_DIR = (
    UPLOAD_DIR / "purchase_proofs"
)

SELLER_PROOF_DIR = (
    UPLOAD_DIR / "seller_proofs"
)


AUCTION_IMAGE_DIR.mkdir(
    parents=True,
    exist_ok=True
)

PURCHASE_PROOF_DIR.mkdir(
    parents=True,
    exist_ok=True
)

SELLER_PROOF_DIR.mkdir(
    parents=True,
    exist_ok=True
)


ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp"
}

MAX_IMAGE_SIZE = 5 * 1024 * 1024

ALLOWED_PROOF_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"
}

MAX_PROOF_SIZE = 10 * 1024 * 1024


class AuctionService:

    def __init__(
        self,
        repository: AuctionRepository
    ):

        self.repository = repository

    async def _save_file(
        self,
        file: UploadFile,
        directory: Path,
        allowed_types: set,
        max_size: int
    ):

        if not file:
            raise HTTPException(
                status_code=400,
                detail="Required file is missing."
            )

        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Invalid file type for "
                    f"{file.filename}."
                )
            )

        content = await file.read()

        if len(content) > max_size:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"{file.filename} exceeds "
                    f"the allowed file size."
                )
            )

        extension = ""

        if file.filename and "." in file.filename:
            extension = (
                "." +
                file.filename.rsplit(
                    ".",
                    1
                )[1].lower()
            )

        filename = (
            f"{uuid.uuid4().hex}"
            f"{extension}"
        )

        file_path = directory / filename

        with open(
            file_path,
            "wb"
        ) as output_file:

            output_file.write(content)

        return str(
            file_path.relative_to(BASE_DIR)
        ).replace("\\", "/")

    async def create_auction(
        self,
        db: Session,
        user_id: int,
        auction_data: AuctionCreate,
        images: list[UploadFile],
        purchase_proof: UploadFile,
        seller_proof: UploadFile
    ):

        # ==========================================
        # IMAGE VALIDATION
        # ==========================================

        if not images:
            raise HTTPException(
                status_code=400,
                detail="At least 3 product images are required."
            )

        if len(images) < 3:
            raise HTTPException(
                status_code=400,
                detail="At least 3 product images are required."
            )

        if len(images) > 12:
            raise HTTPException(
                status_code=400,
                detail="Maximum 12 product images are allowed."
            )

        # ==========================================
        # PRICE VALIDATION
        # ==========================================

        if (
            auction_data.starting_price
            > auction_data.purchase_price
        ):
            # This is NOT necessarily invalid for auctions,
            # so do not reject it.
            pass

        # ==========================================
        # SHIPPING VALIDATION
        # ==========================================

        if (
            auction_data.shipping_type == "paid"
            and auction_data.shipping_charges <= 0
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Shipping charges must be greater "
                    "than 0 when shipping is paid."
                )
            )

        if (
            auction_data.shipping_type == "free"
        ):

            auction_data.shipping_charges = 0

            auction_data.shipping_paid_by = None

        # ==========================================
        # SAVE PROOF FILES FIRST
        # ==========================================

        purchase_proof_path = await self._save_file(
            purchase_proof,
            PURCHASE_PROOF_DIR,
            ALLOWED_PROOF_TYPES,
            MAX_PROOF_SIZE
        )

        seller_proof_path = await self._save_file(
            seller_proof,
            SELLER_PROOF_DIR,
            ALLOWED_PROOF_TYPES,
            MAX_PROOF_SIZE
        )

        saved_image_paths = []

        try:

            # ==========================================
            # CREATE AUCTION
            # ==========================================

            auction = Auction(
                user_id=user_id,

                product_title=auction_data.product_title,

                brand_model=auction_data.brand_model,

                category=auction_data.category,

                description=auction_data.description,

                product_condition=(
                    auction_data.product_condition
                ),

                purchase_date=(
                    auction_data.purchase_date
                ),

                purchased_by=(
                    auction_data.purchased_by
                ),

                purchase_price=(
                    auction_data.purchase_price
                ),

                starting_price=(
                    auction_data.starting_price
                ),

                auction_start=(
                    auction_data.auction_start
                ),

                auction_end=(
                    auction_data.auction_end
                ),

                location_area=(
                    auction_data.location_area
                ),

                location_city=(
                    auction_data.location_city
                ),

                location_state=(
                    auction_data.location_state
                ),

                location_country=(
                    auction_data.location_country
                ),

                location_pincode=(
                    auction_data.location_pincode
                ),

                delivery_type=(
                    auction_data.delivery_type
                ),

                shipping_type=(
                    auction_data.shipping_type
                ),

                shipping_charges=(
                    auction_data.shipping_charges
                ),

                shipping_paid_by=(
                    auction_data.shipping_paid_by
                ),

                warranty_status=(
                    auction_data.warranty_status
                ),

                payment_method=(
                    auction_data.payment_method
                ),

                product_terms=(
                    auction_data.product_terms
                ),

                terms_accepted=(
                    auction_data.terms_accepted
                ),

                seller_name=(
                    auction_data.seller_name
                ),

                seller_email=(
                    auction_data.seller_email
                ),

                seller_contact=(
                    auction_data.seller_contact
                ),

                status="pending",

                purchase_proof_path=(
                    purchase_proof_path
                ),

                seller_proof_path=(
                    seller_proof_path
                )
            )

            self.repository.create_auction(
                db,
                auction
            )

            # ==========================================
            # SAVE PRODUCT IMAGES
            # ==========================================

            for index, image in enumerate(images, start=1):

                image_path = await self._save_file(
                    image,
                    AUCTION_IMAGE_DIR,
                    ALLOWED_IMAGE_TYPES,
                    MAX_IMAGE_SIZE
                )

                saved_image_paths.append(image_path)

                auction_image = AuctionImage(
                    auction_id=auction.id,
                    image_path=image_path,
                    display_order=index
                )

                self.repository.add_image(
                    db=db,
                    auction_image=auction_image
                )

            # ==========================================
            # COMMIT EVERYTHING
            # ==========================================

            self.repository.commit(db)

            return auction

        except Exception as error:

            self.repository.rollback(db)

            raise HTTPException(
                status_code=500,
                detail=(
                    "Auction could not be saved: "
                    f"{str(error)}"
                )
            )
