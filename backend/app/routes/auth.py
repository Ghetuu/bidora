import random

from datetime import (
    datetime,
    timedelta
)

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from pydantic import (
    BaseModel,
    EmailStr
)

from fastapi_mail import (
    FastMail,
    MessageSchema,
    MessageType
)

from app.database import SessionLocal

from app.models.user import User

from app.models.email_otp import EmailOTP

from app.schemas.user import UserCreate

from app.schemas.login import (
    LoginRequest,
    LoginOTPVerifyRequest
)

from app.services.user_services import (
    UserService
)

from app.core.security import (
    verify_password,
    create_access_token
)

from app.core.email import mail_config


router = APIRouter()


# =========================================================
# DATABASE
# =========================================================

def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()


# =========================================================
# OTP VERIFY SCHEMA
# =========================================================

class OTPVerifyRequest(BaseModel):

    email: EmailStr

    otp: str


# =========================================================
# SEND REGISTRATION OTP
# =========================================================

@router.post("/send-otp")
async def send_otp(

    request: UserCreate,

    db: Session = Depends(
        get_db
    )

):

    # Pydantic/UserCreate has already
    # validated ALL fields here.

    email = str(
        request.email
    ).lower().strip()

    username = (
        request.username
        .strip()
    )

    mobile = (
        request.mobile
        .strip()
    )

    # =====================================================
    # CHECK EMAIL
    # =====================================================

    existing_email = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if existing_email:

        raise HTTPException(

            status_code=400,

            detail=(
                "Email is already registered."
            )
        )

    # =====================================================
    # CHECK USERNAME
    # =====================================================

    existing_username = (
        db.query(User)
        .filter(
            User.username == username
        )
        .first()
    )

    if existing_username:

        raise HTTPException(

            status_code=400,

            detail=(
                "Username is already taken."
            )
        )

    # =====================================================
    # CHECK MOBILE
    # =====================================================

    existing_mobile = (
        db.query(User)
        .filter(
            User.mobile == mobile
        )
        .first()
    )

    if existing_mobile:

        raise HTTPException(

            status_code=400,

            detail=(
                "Mobile number is already registered."
            )
        )

    # =====================================================
    # GENERATE OTP
    # =====================================================

    otp = str(
        random.randint(
            100000,
            999999
        )
    )

    expires_at = (
        datetime.utcnow()
        + timedelta(
            minutes=3,
            seconds=40
        )
    )

    # =====================================================
    # DELETE OLD REGISTRATION OTP
    # =====================================================

    db.query(EmailOTP).filter(

        EmailOTP.email == email,

        EmailOTP.purpose == "registration"

    ).delete(

        synchronize_session=False

    )

    # =====================================================
    # CREATE REGISTRATION OTP
    # =====================================================

    otp_record = EmailOTP(

        email=email,

        otp=otp,

        expires_at=expires_at,

        is_verified=False,

        purpose="registration"

    )

    db.add(otp_record)

    db.commit()

    # =====================================================
    # EMAIL
    # =====================================================

    message = MessageSchema(

        subject=(
            "Bidora - Email Verification OTP"
        ),

        recipients=[email],

        body=f"""
        <html>
            <body>

                <h2>
                    Bidora Email Verification
                </h2>

                <p>
                    Hello {request.fullname},
                </p>

                <p>
                    Your OTP for Bidora registration is:
                </p>

                <h1>{otp}</h1>

                <p>
                    This OTP is valid for
                    <b>3 minutes 40 seconds</b>.
                </p>

                <p>
                    If you did not request this OTP,
                    please ignore this email.
                </p>

                <br>

                <p>
                    Regards,<br>
                    <b>Bidora Team</b>
                </p>

            </body>
        </html>
        """,

        subtype=MessageType.html
    )

    try:

        fm = FastMail(
            mail_config
        )

        await fm.send_message(
            message
        )

    except Exception as e:

        db.delete(
            otp_record
        )

        db.commit()

        print(
            "EMAIL ERROR:",
            str(e)
        )

        raise HTTPException(

            status_code=500,

            detail=(
                "Unable to send OTP email."
            )
        )

    # Don't print OTP in production.

    return {

        "message":
            "OTP sent successfully to your email."

    }


# =========================================================
# VERIFY REGISTRATION OTP
# =========================================================

@router.post("/verify-otp")
async def verify_otp(

    request: OTPVerifyRequest,

    db: Session = Depends(
        get_db
    )

):

    email = str(
        request.email
    ).lower().strip()

    otp = request.otp.strip()

    # =====================================================
    # FIND REGISTRATION OTP
    # =====================================================

    otp_record = (
        db.query(EmailOTP)
        .filter(

            EmailOTP.email == email,

            EmailOTP.purpose == "registration"

        )
        .first()
    )

    if not otp_record:

        raise HTTPException(

            status_code=400,

            detail=(
                "OTP not found. "
                "Please request a new OTP."
            )
        )

    # =====================================================
    # CHECK EXPIRY
    # =====================================================

    if datetime.utcnow() > otp_record.expires_at:

        db.delete(
            otp_record
        )

        db.commit()

        raise HTTPException(

            status_code=400,

            detail=(
                "OTP has expired. "
                "Please request a new OTP."
            )
        )

    # =====================================================
    # CHECK OTP
    # =====================================================

    if otp_record.otp != otp:

        raise HTTPException(

            status_code=400,

            detail="Invalid OTP."
        )

    # =====================================================
    # MARK VERIFIED
    # =====================================================

    otp_record.is_verified = True

    db.commit()

    return {

        "message":
            "Email verified successfully."

    }


# =========================================================
# REGISTER
# =========================================================

@router.post("/register")
async def register(

    user_data: UserCreate,

    db: Session = Depends(
        get_db
    )

):

    email = str(
        user_data.email
    ).lower().strip()

    username = (
        user_data.username
        .strip()
    )

    mobile = (
        user_data.mobile
        .strip()
    )

    # =====================================================
    # CHECK VERIFIED REGISTRATION OTP
    # =====================================================

    otp_record = (
        db.query(EmailOTP)
        .filter(

            EmailOTP.email == email,

            EmailOTP.purpose == "registration",

            EmailOTP.is_verified == True

        )
        .first()
    )

    if not otp_record:

        raise HTTPException(

            status_code=400,

            detail=(
                "Please verify your email "
                "with OTP first."
            )
        )

    # =====================================================
    # CHECK EMAIL
    # =====================================================

    existing_email = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if existing_email:

        raise HTTPException(

            status_code=400,

            detail=(
                "Email is already registered."
            )
        )

    # =====================================================
    # CHECK USERNAME
    # =====================================================

    existing_username = (
        db.query(User)
        .filter(
            User.username == username
        )
        .first()
    )

    if existing_username:

        raise HTTPException(

            status_code=400,

            detail=(
                "Username is already taken."
            )
        )

    # =====================================================
    # CHECK MOBILE
    # =====================================================

    existing_mobile = (
        db.query(User)
        .filter(
            User.mobile == mobile
        )
        .first()
    )

    if existing_mobile:

        raise HTTPException(

            status_code=400,

            detail=(
                "Mobile number is already registered."
            )
        )

    # =====================================================
    # CREATE USER
    # =====================================================

    service = UserService()

    try:

        user = service.register(

            db,

            user_data

        )

        db.commit()

        db.refresh(user)

    except Exception as e:

        db.rollback()

        print(
            "REGISTER ERROR:",
            str(e)
        )

        raise HTTPException(

            status_code=500,

            detail="Registration failed."
        )

    # =====================================================
    # DELETE USED OTP
    # =====================================================

    db.delete(
        otp_record
    )

    db.commit()

    return {

        "message":
            "Registration successful. "
            "You can now login."

    }


# =========================================================
# LOGIN
# =========================================================

@router.post("/login")
async def login(

    request: LoginRequest,

    db: Session = Depends(
        get_db
    )

):

    email = str(
        request.email
    ).lower().strip()

    password = request.password

    # =====================================================
    # FIND USER
    # =====================================================

    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if not user:

        raise HTTPException(

            status_code=401,

            detail=(
                "Invalid email or password."
            )
        )

    # =====================================================
    # CHECK PASSWORD
    # =====================================================

    if not verify_password(

        password,

        user.password

    ):

        raise HTTPException(

            status_code=401,

            detail=(
                "Invalid email or password."
            )
        )

    # =====================================================
    # CHECK EMAIL VERIFIED
    # =====================================================

    if not user.email_verified:

        raise HTTPException(

            status_code=403,

            detail=(
                "Please verify your email first."
            )
        )

    # =====================================================
    # GENERATE LOGIN OTP
    # =====================================================

    otp = str(
        random.randint(
            100000,
            999999
        )
    )

    expires_at = (
        datetime.utcnow()
        + timedelta(
            minutes=3,
            seconds=40
        )
    )

    # =====================================================
    # DELETE OLD LOGIN OTP
    # =====================================================

    db.query(EmailOTP).filter(

        EmailOTP.email == email,

        EmailOTP.purpose == "login"

    ).delete(

        synchronize_session=False

    )

    # =====================================================
    # SAVE LOGIN OTP
    # =====================================================

    otp_record = EmailOTP(

        email=email,

        otp=otp,

        expires_at=expires_at,

        is_verified=False,

        purpose="login"

    )

    db.add(otp_record)

    db.commit()

    # =====================================================
    # SEND LOGIN OTP
    # =====================================================

    message = MessageSchema(

        subject="Bidora - Login OTP",

        recipients=[email],

        body=f"""
        <html>
            <body>

                <h2>
                    Bidora Login Verification
                </h2>

                <p>
                    Hello {user.fullname},
                </p>

                <p>
                    Your OTP for Bidora login is:
                </p>

                <h1>{otp}</h1>

                <p>
                    This OTP is valid for
                    <b>3 minutes 40 seconds</b>.
                </p>

                <p>
                    If you did not try to login,
                    please ignore this email.
                </p>

                <br>

                <p>
                    Regards,<br>
                    <b>Bidora Team</b>
                </p>

            </body>
        </html>
        """,

        subtype=MessageType.html
    )

    try:

        fm = FastMail(
            mail_config
        )

        await fm.send_message(
            message
        )

    except Exception as e:

        db.delete(
            otp_record
        )

        db.commit()

        print(
            "LOGIN EMAIL ERROR:",
            str(e)
        )

        raise HTTPException(

            status_code=500,

            detail=(
                "Unable to send login OTP."
            )
        )

    return {

        "message":
            "Login OTP sent successfully."

    }


# =========================================================
# VERIFY LOGIN OTP
# =========================================================

@router.post("/verify-login-otp")
async def verify_login_otp(

    request: LoginOTPVerifyRequest,

    db: Session = Depends(
        get_db
    )

):

    email = str(
        request.email
    ).lower().strip()

    otp = request.otp.strip()

    # =====================================================
    # FIND LOGIN OTP
    # =====================================================

    otp_record = (
        db.query(EmailOTP)
        .filter(

            EmailOTP.email == email,

            EmailOTP.purpose == "login"

        )
        .first()
    )

    if not otp_record:

        raise HTTPException(

            status_code=400,

            detail=(
                "OTP not found. "
                "Please login again."
            )
        )

    # =====================================================
    # CHECK EXPIRY
    # =====================================================

    if datetime.utcnow() > otp_record.expires_at:

        db.delete(
            otp_record
        )

        db.commit()

        raise HTTPException(

            status_code=400,

            detail=(
                "OTP has expired. "
                "Please login again."
            )
        )

    # =====================================================
    # CHECK OTP
    # =====================================================

    if otp_record.otp != otp:

        raise HTTPException(

            status_code=400,

            detail="Invalid OTP."
        )

    # =====================================================
    # FIND USER
    # =====================================================

    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if not user:

        raise HTTPException(

            status_code=404,

            detail="User not found."
        )

    # =====================================================
    # CREATE JWT
    # =====================================================

    access_token = create_access_token(

        data={

            "sub": str(user.id),

            "email": user.email

        }

    )

    # =====================================================
    # DELETE OTP
    # =====================================================

    db.delete(
        otp_record
    )

    db.commit()

    # =====================================================
    # LOGIN SUCCESS
    # =====================================================

    return {

        "message":
            "Login successful.",

        "access_token":
            access_token,

        "token_type":
            "bearer",

        "user": {

            "id":
                user.id,

            "fullname":
                user.fullname,

            "username":
                user.username,

            "email":
                user.email

        }

    }