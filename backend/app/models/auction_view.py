from datetime import datetime

from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    DateTime,
    ForeignKey
)

from app.database import Base


class AuctionView(Base):

    __tablename__ = "auction_views"

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

    auction_id = Column(
        BigInteger,
        ForeignKey(
            "auctions.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    viewed_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )