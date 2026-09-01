
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    String,
    Text,
    Date,
    DateTime,
    Numeric,
    Boolean,
    Enum,
    ForeignKey
)

from sqlalchemy.orm import relationship

from app.database import Base


class Auction(Base):

    __tablename__ = "auctions"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    product_title = Column(
        String(100),
        nullable=False
    )

    brand_model = Column(
        String(100),
        nullable=False
    )

    category = Column(
        String(30),
        nullable=False
    )

    description = Column(
        String(1000),
        nullable=False
    )

    product_condition = Column(
        String(30),
        nullable=False
    )

    purchase_date = Column(
        Date,
        nullable=False
    )

    purchased_by = Column(
        String(100),
        nullable=False
    )

    purchase_price = Column(
        Numeric(12, 2),
        nullable=False
    )

    starting_price = Column(
        Numeric(12, 2),
        nullable=False
    )

    auction_start = Column(
        DateTime,
        nullable=False
    )

    auction_end = Column(
        DateTime,
        nullable=False
    )

    location_area = Column(
        String(100),
        nullable=False
    )

    location_city = Column(
        String(50),
        nullable=False
    )

    location_state = Column(
        String(50),
        nullable=False
    )

    location_country = Column(
        String(50),
        nullable=False
    )

    location_pincode = Column(
        String(6),
        nullable=False
    )

    delivery_type = Column(
        Enum(
            "pickup",
            "delivery",
            "both"
        ),
        nullable=False
    )

    shipping_type = Column(
        Enum(
            "free",
            "paid"
        ),
        nullable=False
    )

    shipping_charges = Column(
        Numeric(12, 2),
        default=0
    )

    shipping_paid_by = Column(
        Enum(
            "buyer",
            "seller"
        ),
        nullable=True
    )

    warranty_status = Column(
        String(30),
        nullable=True
    )

    payment_method = Column(
        String(50),
        nullable=False
    )

    product_terms = Column(
        Text,
        nullable=False
    )

    terms_accepted = Column(
        Boolean,
        default=False,
        nullable=False
    )

    seller_name = Column(
        String(100),
        nullable=False
    )

    seller_email = Column(
        String(255),
        nullable=False
    )

    seller_contact = Column(
        String(10),
        nullable=False
    )

    status = Column(
        Enum(
            "pending",
            "approved",
            "rejected",
            "draft",
            "live",
            "ended"
        ),
        default="pending",
        nullable=False
    )

    purchase_proof_path = Column(
        String(500),
        nullable=False
    )

    seller_proof_path = Column(
        String(500),
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    images = relationship(
        "AuctionImage",
        back_populates="auction",
        cascade="all, delete-orphan"
    )
