from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# =====================================================
# DATABASE
# =====================================================

def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# =====================================================
# ADMIN LOGIN
# =====================================================

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Admin@123"


class AdminLogin(BaseModel):

    username: str
    password: str


@router.post("/login")
def admin_login(data: AdminLogin):

    if (
        data.username == ADMIN_USERNAME
        and data.password == ADMIN_PASSWORD
    ):

        return {
            "success": True,
            "message": "Login Successful"
        }

    raise HTTPException(
        status_code=401,
        detail="Invalid Username or Password"
    )


# =====================================================
# GET ALL USERS
# =====================================================

@router.get("/users/")
def get_all_users(
    db: Session = Depends(get_db)
):

    users = (
        db.query(User)
        .order_by(User.id.asc())
        .all()
    )

    return [

        {
            "id": user.id,
            "fullname": user.fullname,
            "username": user.username,
            "email": user.email,
            "mobile": user.mobile,
            "address": user.address,
            "email_verified": user.email_verified,
            "account_status": user.account_status,
            "admin_remark": user.admin_remark,
            "registration_date": user.registration_date,
        }

        for user in users

    ]


# =====================================================
# GET SINGLE USER
# =====================================================

@router.get("/users/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    return {

        "id": user.id,
        "fullname": user.fullname,
        "username": user.username,
        "email": user.email,
        "mobile": user.mobile,
        "address": user.address,
        "email_verified": user.email_verified,
        "account_status": user.account_status,
        "admin_remark": user.admin_remark,

    }


# =====================================================
# UPDATE USER
# =====================================================

class UserUpdate(BaseModel):

    fullname: str
    username: str
    email: str
    mobile: str
    address: str
    account_status: str


@router.put("/users/{user_id}")
def update_user(

    user_id: int,

    data: UserUpdate,

    db: Session = Depends(get_db)

):

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    # Check duplicate username
    existing_username = (
        db.query(User)
        .filter(
            User.username == data.username,
            User.id != user_id
        )
        .first()
    )

    if existing_username:

        raise HTTPException(
            status_code=400,
            detail="Username is already taken."
        )

    # Check duplicate email
    existing_email = (
        db.query(User)
        .filter(
            User.email == data.email,
            User.id != user_id
        )
        .first()
    )

    if existing_email:

        raise HTTPException(
            status_code=400,
            detail="Email is already registered."
        )

    # Check duplicate mobile
    existing_mobile = (
        db.query(User)
        .filter(
            User.mobile == data.mobile,
            User.id != user_id
        )
        .first()
    )

    if existing_mobile:

        raise HTTPException(
            status_code=400,
            detail="Mobile number is already registered."
        )

    # Update fields

    user.fullname = data.fullname
    user.username = data.username
    user.email = data.email
    user.mobile = data.mobile
    user.address = data.address
    user.account_status = data.account_status

    db.commit()

    db.refresh(user)

    return {

        "success": True,

        "message": "User updated successfully.",

        "user": {

            "id": user.id,
            "fullname": user.fullname,
            "username": user.username,
            "email": user.email,
            "mobile": user.mobile,
            "address": user.address,
            "email_verified": user.email_verified,
            "account_status": user.account_status,
            "admin_remark": user.admin_remark,

        }

    }


# =====================================================
# DELETE USER
# =====================================================

@router.delete("/users/{user_id}")
def delete_user(

    user_id: int,

    db: Session = Depends(get_db)

):

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    db.delete(user)

    db.commit()

    return {

        "success": True,

        "message": "User deleted successfully."

    }