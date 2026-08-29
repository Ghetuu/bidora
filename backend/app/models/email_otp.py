from sqlalchemy import Column, Integer, String, DateTime, Boolean
from app.database import Base


class EmailOTP(Base):

    __tablename__ = "email_otps"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    email = Column(
        String(100),
        nullable=False,
        index=True
    )

    otp = Column(
        String(6),
        nullable=False
    )

    expires_at = Column(
        DateTime,
        nullable=False
    )

    is_verified = Column(
        Boolean,
        default=False,
        nullable=False
    )