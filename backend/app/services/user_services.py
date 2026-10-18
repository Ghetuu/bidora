import hashlib
import hmac

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.core.security import hash_password, SECRET_KEY

class UserService:


    def register(
        self,
        db: Session,
        data
    ):
        # ==========================================
        # HASH PASSWORD
        # ==========================================

        hashed_password = hash_password(
            data.password
        )

        # ==========================================
        # CREATE KYC IDENTIFIER FINGERPRINT
        # The registration endpoint must validate
        # the identifier against the demo CSV first.
        # ==========================================

        aadhaar_number = getattr(
            data,
            "aadhaar_number",
            None
        )

        if not aadhaar_number:
            raise ValueError(
                "KYC verification is required."
            )

        normalized_number = "".join(
            character
            for character in str(aadhaar_number)
            if character.isdigit()
        )

        if len(normalized_number) != 12:
            raise ValueError(
                "Invalid demo KYC identifier."
            )

        identifier_hash = hmac.new(
            SECRET_KEY.encode("utf-8"),
            normalized_number.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        # ==========================================
        # CREATE USER
        # ==========================================

        user = User(
            fullname=data.fullname.strip(),
            username=data.username.strip(),
            email=str(data.email).lower().strip(),
            mobile=data.mobile.strip(),
            password=hashed_password,
            address=data.address.strip(),

            # ROLE
            role_id=2,

            # EMAIL VERIFICATION
            email_verified=True,

            # ACCOUNT STATUS
            account_status="APPROVED",

            # KYC
            kyc_status="verified",
            kyc_identifier_hash=identifier_hash
        )

        # ==========================================
        # SAVE USER
        # ==========================================

        repo = UserRepository()

        return repo.create(
            db,
            user
        )

