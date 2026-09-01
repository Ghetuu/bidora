
from datetime import datetime

from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Integer,
    DateTime,
    ForeignKey
)

from sqlalchemy.orm import relationship

from app.database import Base


class AuctionImage(Base):

    __tablename__ = "auction_images"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    auction_id = Column(
        BigInteger,
        ForeignKey(
            "auctions.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    image_path = Column(
        String(500),
        nullable=False
    )

    display_order = Column(
        Integer,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    auction = relationship(
        "Auction",
        back_populates="images"
    )
