import os
import re
from datetime import datetime, date
from decimal import Decimal

from app.models.user import User
from app.models.auction_image import AuctionImage


# =========================================================
# CONFIGURATION
# =========================================================

ALLOWED_IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp"
}

ALLOWED_DOCUMENT_EXTENSIONS = {
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp"
}

MIN_DESCRIPTION_LENGTH = 20


# =========================================================
# TEXT NORMALIZATION
# =========================================================

def normalize_text(value):
    if value is None:
        return ""

    value = str(value).strip().lower()

    # Remove extra spaces
    value = re.sub(r"\s+", " ", value)

    return value


def normalize_email(value):
    return normalize_text(value)


def normalize_phone(value):
    if not value:
        return ""

    digits = re.sub(r"\D", "", str(value))

    # Compare last 10 digits
    if len(digits) >= 10:
        return digits[-10:]

    return digits


# =========================================================
# FILE HELPERS
# =========================================================

def resolve_file_path(file_path):
    """
    Database normally stores something such as:

        uploads/auctions/example.jpg

    Convert it into an absolute filesystem path.
    """

    if not file_path:
        return None

    path = str(file_path).strip()

    # Remove leading slash
    path = path.lstrip("/\\")

    return os.path.abspath(path)


def validate_file(
    file_path,
    allowed_extensions,
    label
):
    errors = []

    if not file_path:
        errors.append(
            f"{label} is missing."
        )
        return errors

    extension = os.path.splitext(
        str(file_path)
    )[1].lower()

    if extension not in allowed_extensions:
        errors.append(
            f"{label} has an unsupported file type."
        )
        return errors

    absolute_path = resolve_file_path(file_path)

    if not absolute_path:
        errors.append(
            f"{label} path is invalid."
        )
        return errors

    if not os.path.isfile(absolute_path):
        errors.append(
            f"{label} file does not exist on the server."
        )
        return errors

    try:
        file_size = os.path.getsize(absolute_path)

        if file_size <= 0:
            errors.append(
                f"{label} file is empty or corrupted."
            )

    except OSError:
        errors.append(
            f"{label} file cannot be read."
        )

    return errors


# =========================================================
# IMAGE VALIDATION
# =========================================================

def validate_auction_images(images):
    errors = []

    if not images:
        errors.append(
            "At least one product image is required."
        )
        return errors

    for index, image in enumerate(images, start=1):

        image_path = getattr(
            image,
            "image_path",
            None
        )

        image_errors = validate_file(
            image_path,
            ALLOWED_IMAGE_EXTENSIONS,
            f"Product image #{index}"
        )

        errors.extend(image_errors)

    return errors


# =========================================================
# MAIN VALIDATION
# =========================================================

def validate_auction(
    auction,
    user=None,
    images=None,
    db=None
):
    """
    Complete automatic screening of an auction.

    IMPORTANT:
    This performs rule-based verification.
    It does NOT claim to prove document authenticity
    or visually identify the product.
    """

    errors = []

    now = datetime.now()

    # =====================================================
    # SELLER ACCOUNT
    # =====================================================

    if not user:
        errors.append(
            "The seller account associated with this auction does not exist."
        )

    else:

        if str(user.account_status).upper() != "APPROVED":
            errors.append(
                "The seller account is not approved."
            )

        # -------------------------------------------------
        # SELLER NAME MATCH
        # -------------------------------------------------

        auction_seller_name = normalize_text(
            auction.seller_name
        )

        registered_name = normalize_text(
            user.fullname
        )

        registered_username = normalize_text(
            user.username
        )

        if not auction_seller_name:
            errors.append(
                "Seller name is missing."
            )

        elif auction_seller_name not in {
            registered_name,
            registered_username
        }:
            errors.append(
                "Seller name does not match the registered user name."
            )
        # -------------------------------------------------
        # SELLER EMAIL MATCH
        # -------------------------------------------------

        auction_email = normalize_email(
            auction.seller_email
        )

        registered_email = normalize_email(
            user.email
        )

        if not auction_email:
            errors.append(
                "Seller email is missing."
            )

        elif auction_email != registered_email:
            errors.append(
                "Seller email does not match the registered user email."
            )

        # -------------------------------------------------
        # SELLER CONTACT MATCH
        # -------------------------------------------------

        auction_phone = normalize_phone(
            auction.seller_contact
        )

        registered_phone = normalize_phone(
            user.mobile
        )

        if not auction_phone:
            errors.append(
                "Seller contact number is missing."
            )

        elif not registered_phone:
            errors.append(
                "Registered user mobile number is missing."
            )

        elif auction_phone != registered_phone:
            errors.append(
                "Seller contact number does not match the registered user mobile number."
            )

    # =====================================================
    # PRODUCT INFORMATION
    # =====================================================

    product_title = normalize_text(
        auction.product_title
    )

    brand_model = normalize_text(
        auction.brand_model
    )

    category = normalize_text(
        auction.category
    )

    description = normalize_text(
        auction.description
    )

    condition = normalize_text(
        auction.product_condition
    )

    if not product_title:
        errors.append(
            "Product title is missing."
        )

    elif len(product_title) < 3:
        errors.append(
            "Product title is too short or invalid."
        )

    if not brand_model:
        errors.append(
            "Brand/model information is missing."
        )

    elif len(brand_model) < 2:
        errors.append(
            "Brand/model information is invalid."
        )

    if not category:
        errors.append(
            "Product category is missing."
        )

    if not description:
        errors.append(
            "Product description is missing."
        )

    elif len(description) < MIN_DESCRIPTION_LENGTH:
        errors.append(
            "Product description is too short to properly identify the auction item."
        )

    if not condition:
        errors.append(
            "Product condition is missing."
        )

    # =====================================================
    # PURCHASE INFORMATION
    # =====================================================

    if not auction.purchase_date:
        errors.append(
            "Purchase date is missing."
        )

    else:

        purchase_date = auction.purchase_date

        if isinstance(purchase_date, datetime):
            purchase_date = purchase_date.date()

        if isinstance(purchase_date, date):

            if purchase_date > now.date():
                errors.append(
                    "Purchase date cannot be in the future."
                )

    if not normalize_text(auction.purchased_by):
        errors.append(
            "Purchased-by information is missing."
        )

    # =====================================================
    # PRICE VALIDATION
    # =====================================================

    try:
        purchase_price = Decimal(
            str(auction.purchase_price)
        )

        if purchase_price <= 0:
            errors.append(
                "Purchase price must be greater than zero."
            )

    except Exception:
        errors.append(
            "Purchase price is invalid."
        )

    try:
        starting_price = Decimal(
            str(auction.starting_price)
        )

        if starting_price <= 0:
            errors.append(
                "Starting price must be greater than zero."
            )

    except Exception:
        errors.append(
            "Starting price is invalid."
        )

    # IMPORTANT:
    # We do NOT reject a starting price higher than the
    # purchase price because an item may have appreciated.

    # =====================================================
    # AUCTION TIMING
    # =====================================================

    auction_start = auction.auction_start
    auction_end = auction.auction_end

    if not auction_start:
        errors.append(
            "Auction start time is missing."
        )

    if not auction_end:
        errors.append(
            "Auction end time is missing."
        )

    if auction_start and auction_end:

        if auction_start <= now:
            errors.append(
                "Auction start time must be in the future."
            )

        if auction_end <= auction_start:
            errors.append(
                "Auction end time must be after auction start time."
            )

    # =====================================================
    # LOCATION
    # =====================================================

    location_fields = {
        "Location area": auction.location_area,
        "Location city": auction.location_city,
        "Location state": auction.location_state,
        "Location country": auction.location_country,
        "Location pincode": auction.location_pincode,
    }

    for label, value in location_fields.items():

        if not normalize_text(value):
            errors.append(
                f"{label} is missing."
            )

    # Pincode validation
    pincode = normalize_text(
        auction.location_pincode
    )

    if pincode and not re.fullmatch(
        r"\d{6}",
        pincode
    ):
        errors.append(
            "Location pincode must contain exactly 6 digits."
        )

    # =====================================================
    # DELIVERY / SHIPPING
    # =====================================================

    delivery_type = normalize_text(
        auction.delivery_type
    )

    shipping_type = normalize_text(
        auction.shipping_type
    )

    shipping_paid_by = normalize_text(
        auction.shipping_paid_by
    )

    valid_delivery_types = {
        "pickup",
        "delivery",
        "both"
    }

    valid_shipping_types = {
        "free",
        "paid"
    }

    if delivery_type not in valid_delivery_types:
        errors.append(
            "Delivery type is invalid."
        )

    if shipping_type not in valid_shipping_types:
        errors.append(
            "Shipping type is invalid."
        )

    try:

        shipping_charges = Decimal(
            str(
                auction.shipping_charges
                if auction.shipping_charges is not None
                else 0
            )
        )

        if shipping_charges < 0:
            errors.append(
                "Shipping charges cannot be negative."
            )

        if shipping_type == "free" and shipping_charges != 0:
            errors.append(
                "Free shipping cannot have shipping charges."
            )

        if shipping_type == "paid":

            if shipping_charges <= 0:
                errors.append(
                    "Paid shipping must have valid shipping charges."
                )

            if shipping_paid_by not in {
                "buyer",
                "seller"
            }:
                errors.append(
                    "Shipping paid-by information is invalid."
                )

    except Exception:
        errors.append(
            "Shipping charges are invalid."
        )

    # =====================================================
    # PAYMENT
    # =====================================================

    if not normalize_text(
        auction.payment_method
    ):
        errors.append(
            "Payment method is missing."
        )

    # =====================================================
    # TERMS
    # =====================================================

    if not normalize_text(
        auction.product_terms
    ):
        errors.append(
            "Product terms and conditions are missing."
        )

    if auction.terms_accepted is not True:
        errors.append(
            "Auction terms have not been accepted."
        )

    # =====================================================
    # PROOF DOCUMENTS
    # =====================================================

    purchase_proof_errors = validate_file(
        auction.purchase_proof_path,
        ALLOWED_DOCUMENT_EXTENSIONS,
        "Purchase proof"
    )

    errors.extend(
        purchase_proof_errors
    )

    seller_proof_errors = validate_file(
        auction.seller_proof_path,
        ALLOWED_DOCUMENT_EXTENSIONS,
        "Seller verification proof"
    )

    errors.extend(
        seller_proof_errors
    )

    # =====================================================
    # PRODUCT IMAGES
    # =====================================================

    image_errors = validate_auction_images(
        images
    )

    errors.extend(
        image_errors
    )

    # =====================================================
    # DUPLICATE AUCTION CHECK
    # =====================================================

    if db and auction.user_id:

        duplicate_query = (
            db.query(auction.__class__)
            .filter(
                auction.__class__.user_id == auction.user_id,
                auction.__class__.id != auction.id,
                auction.__class__.status.in_(
                    [
                        "pending",
                        "approved",
                        "live"
                    ]
                )
            )
        )

        possible_duplicates = duplicate_query.all()

        current_title = normalize_text(
            auction.product_title
        )

        current_brand = normalize_text(
            auction.brand_model
        )

        for existing in possible_duplicates:

            existing_title = normalize_text(
                existing.product_title
            )

            existing_brand = normalize_text(
                existing.brand_model
            )

            title_match = (
                current_title == existing_title
            )

            brand_match = (
                current_brand == existing_brand
            )

            if (
                title_match
                and brand_match
                and auction.auction_start
                and auction.auction_end
                and existing.auction_start
                and existing.auction_end
            ):

                overlapping = (
                    auction.auction_start < existing.auction_end
                    and auction.auction_end > existing.auction_start
                )

                if overlapping:

                    errors.append(
                        "A similar auction from the same seller already exists with overlapping auction timing."
                    )

                    break

    # =====================================================
    # FINAL RESULT
    # =====================================================

    if errors:

        return {
            "valid": False,
            "reason": " ".join(
                f"{index}. {error}"
                for index, error in enumerate(
                    errors,
                    start=1
                )
            ),
            "errors": errors
        }

    return {
        "valid": True,
        "reason": None,
        "errors": []
    }