from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime
)

from sqlalchemy.sql import func

from app.database import Base


class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    fullname = Column(
        String(100),
        nullable=False
    )

    username = Column(
        String(50),
        unique=True,
        nullable=False
    )

    email = Column(
        String(100),
        unique=True,
        nullable=False
    )

    mobile = Column(
        String(15),
        unique=True,
        nullable=False
    )

    password = Column(
        String(255),
        nullable=False
    )

    address = Column(
        Text,
        nullable=False
    )

    # ==========================================
    # EMAIL VERIFICATION
    # ==========================================

    email_verified = Column(
        Boolean,
        nullable=False,
        default=False
    )

    # ==========================================
    # ACCOUNT STATUS
    # ==========================================

    account_status = Column(
        String(20),
        nullable=False,
        default="APPROVED"
    )

    # ==========================================
    # ADMIN REMARK
    # ==========================================

    admin_remark = Column(
        Text,
        nullable=True
    )

    # ==========================================
    # REGISTRATION DATE
    # ==========================================

    registration_date = Column(
        DateTime,
        server_default=func.now()
    )