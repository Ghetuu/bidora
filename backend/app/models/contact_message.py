from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    Enum
)

from datetime import datetime

from app.database import Base


class ContactMessage(Base):

    __tablename__ = "contact_messages"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    first_name = Column(
        String(100),
        nullable=False
    )

    last_name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(150),
        nullable=False,
        index=True
    )

    phone = Column(
        String(30),
        nullable=True
    )

    help_topic = Column(
        String(150),
        nullable=False
    )

    other_topic = Column(
        String(255),
        nullable=True
    )

    auction_id = Column(
        String(100),
        nullable=True
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

    status = Column(
        Enum(
            "OPEN",
            "IN_PROGRESS",
            "RESOLVED"
        ),
        default="OPEN",
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )