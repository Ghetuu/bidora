from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base


class KYCTestRecord(Base):
    __tablename__ = "kyc_test_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Synthetic demo identity information only
    demo_name = Column(String(100), nullable=False)
    demo_mobile = Column(String(15), nullable=False)
    aadhaar_last4 = Column(String(4), nullable=False, index=True)

    # Indicates whether this synthetic test record is eligible
    is_success_record = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
