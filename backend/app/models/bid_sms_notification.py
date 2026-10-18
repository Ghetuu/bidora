from datetime import datetime

from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    String,
    Text,
    Numeric,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Index
)

from app.database import Base


class BidSMSNotification(Base):

    __tablename__ = "bid_sms_notifications"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    # Auction associated with this notification.
    auction_id = Column(
        BigInteger,
        ForeignKey(
            "auctions.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    # Seller who should receive the notification.
    seller_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    # Snapshot of the seller's registered mobile number.
    # This comes from users.mobile, not buyer input.
    recipient_mobile = Column(
        String(15),
        nullable=False
    )

    # Examples:
    # FIRST_BID, SIGNIFICANT_BID, BID_SUMMARY,
    # AUCTION_ENDING, REVIEW_ALERT
    notification_type = Column(
        String(30),
        nullable=False
    )

    # PENDING, PROCESSING, SENT, FAILED
    status = Column(
        String(20),
        nullable=False,
        default="PENDING",
        index=True
    )

    # Number of ordinary bids included in a summary.
    pending_bid_count = Column(
        Integer,
        nullable=False,
        default=1
    )

    # Highest confirmed bid amount at the time
    # the notification was prepared.
    latest_highest_bid = Column(
        Numeric(12, 2),
        nullable=True
    )

    # Actual message to send.
    message = Column(
        Text,
        nullable=False
    )

    # When the notification becomes eligible for processing.
    scheduled_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True
    )

    # When the notification was successfully processed.
    sent_at = Column(
        DateTime,
        nullable=True
    )

    # Used to help prevent duplicate event notifications.
    dedupe_key = Column(
        String(150),
        nullable=True,
        unique=True
    )

    # Retry and error tracking.
    attempt_count = Column(
        Integer,
        nullable=False,
        default=0
    )

    last_error = Column(
        String(500),
        nullable=True
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    __table_args__ = (
        Index(
            "ix_bid_sms_status_scheduled",
            "status",
            "scheduled_at"
        ),
    )