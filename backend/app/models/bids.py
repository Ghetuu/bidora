from datetime import datetime

from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    String,
    Numeric,
    DateTime,
    ForeignKey
)

from sqlalchemy.orm import relationship

from app.database import Base


class Bid(Base):

    __tablename__ = "bids"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    auction_id = Column(
        BigInteger,
        ForeignKey("auctions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Snapshot of bidder name at bid time, so the row still
    # displays correctly even if the user later edits their name.
    bidder_name = Column(
        String(100),
        nullable=False
    )

    amount = Column(
        Numeric(12, 2),
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )

    auction = relationship(
        "Auction",
        back_populates="bids"
    )