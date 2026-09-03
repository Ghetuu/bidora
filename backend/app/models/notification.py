from sqlalchemy import Column, BigInteger, Integer, String, Text, Boolean, DateTime, Enum
from datetime import datetime

from app.database import Base


class Notification(Base):

    __tablename__ = "notifications"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    recipient_type = Column(
        Enum("admin", "user"),
        nullable=False,
        default="user"
    )

    user_id = Column(
        Integer,
        nullable=True,
        index=True
    )

    auction_id = Column(
        BigInteger,
        nullable=True,
        index=True
    )

    notif_type = Column(
        String(40),
        nullable=False
    )

    title = Column(
        String(150),
        nullable=False
    )

    message = Column(
        Text,
        nullable=False
    )

    is_read = Column(
        Boolean,
        nullable=False,
        default=False
    )

    created_at = Column(
        DateTime,
        nullable=True,
        default=datetime.utcnow
    )