from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from datetime import datetime

from app.database import Base


class AdminNotification(Base):

    __tablename__ = "admin_notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    notification_type = Column(
        String(50),
        nullable=False
    )

    auction_id = Column(
        Integer,
        nullable=True
    )

    user_id = Column(
        Integer,
        nullable=True
    )

    title = Column(
        String(255),
        nullable=False
    )

    message = Column(
        Text,
        nullable=False
    )

    is_read = Column(
        Boolean,
        default=False,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )