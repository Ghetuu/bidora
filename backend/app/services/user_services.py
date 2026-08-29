from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.core.security import hash_password


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
        # CREATE USER
        # ==========================================

        user = User(

            fullname=data.fullname.strip(),

            username=data.username.strip(),

            email=str(
                data.email
            ).lower().strip(),

            mobile=data.mobile.strip(),

            password=hashed_password,

            address=data.address.strip(),

            # Email was verified through OTP
            email_verified=True,

            # No admin approval required
            account_status="APPROVED",

            admin_remark=None
        )

        # ==========================================
        # SAVE
        # ==========================================

        repo = UserRepository()

        return repo.create(
            db,
            user
        )