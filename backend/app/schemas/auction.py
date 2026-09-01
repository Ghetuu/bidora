from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict, field_validator


class AuctionCreate(BaseModel):

    model_config = ConfigDict(
        str_strip_whitespace=True
    )

    product_title: str = Field(
        ...,
        min_length=2,
        max_length=100
    )

    brand_model: str = Field(
        ...,
        min_length=1,
        max_length=100
    )

    category: str = Field(
        ...,
        min_length=1,
        max_length=30
    )

    description: str = Field(
        ...,
        min_length=10,
        max_length=1000
    )

    product_condition: str = Field(
        ...,
        min_length=1,
        max_length=30
    )

    purchase_date: date

    purchased_by: str = Field(
        ...,
        min_length=2,
        max_length=100
    )

    purchase_price: Decimal = Field(
        ...,
        gt=0,
        max_digits=12,
        decimal_places=2
    )

    starting_price: Decimal = Field(
        ...,
        gt=0,
        max_digits=12,
        decimal_places=2
    )

    auction_start: datetime

    auction_end: datetime

    location_area: str = Field(
        ...,
        min_length=2,
        max_length=100
    )

    location_city: str = Field(
        ...,
        min_length=2,
        max_length=50
    )

    location_state: str = Field(
        ...,
        min_length=2,
        max_length=50
    )

    location_country: str = Field(
        ...,
        min_length=2,
        max_length=50
    )

    location_pincode: str = Field(
        ...,
        pattern=r"^\d{6}$"
    )

    delivery_type: str

    shipping_type: str

    shipping_charges: Decimal = Field(
        default=Decimal("0"),
        ge=0
    )

    shipping_paid_by: Optional[str] = None

    warranty_status: Optional[str] = Field(
        default=None,
        max_length=30
    )

    payment_method: str = Field(
        ...,
        min_length=1,
        max_length=50
    )

    product_terms: str = Field(
        ...,
        min_length=10
    )

    terms_accepted: bool

    seller_name: str = Field(
        ...,
        min_length=2,
        max_length=100
    )

    seller_email: str = Field(
        ...,
        max_length=255
    )

    seller_contact: str = Field(
        ...,
        pattern=r"^\d{10}$"
    )

    @field_validator(
        "seller_name",
        "purchased_by"
    )
    @classmethod
    def validate_names(cls, value):

        if not all(
            character.isalpha() or character.isspace()
            for character in value
        ):
            raise ValueError(
                "Name can contain only letters and spaces."
            )

        return value

    @field_validator(
        "delivery_type"
    )
    @classmethod
    def validate_delivery(cls, value):

        if value not in {
            "pickup",
            "delivery",
            "both"
        }:
            raise ValueError(
                "Invalid delivery type."
            )

        return value

    @field_validator(
        "shipping_type"
    )
    @classmethod
    def validate_shipping_type(cls, value):

        if value not in {
            "free",
            "paid"
        }:
            raise ValueError(
                "Invalid shipping type."
            )

        return value

    @field_validator(
        "shipping_paid_by"
    )
    @classmethod
    def validate_shipping_paid_by(cls, value):

        if value is not None and value not in {
            "buyer",
            "seller"
        }:
            raise ValueError(
                "Invalid shipping paid by value."
            )

        return value

    @field_validator(
        "auction_end"
    )
    @classmethod
    def validate_auction_dates(
        cls,
        value,
        info
    ):

        start = info.data.get(
            "auction_start"
        )

        if start and value <= start:
            raise ValueError(
                "Auction end must be after auction start."
            )

        return value

    @field_validator(
        "terms_accepted"
    )
    @classmethod
    def validate_terms(cls, value):

        if value is not True:
            raise ValueError(
                "Terms and Conditions must be accepted."
            )

        return value
