from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi_mail import FastMail, MessageSchema, MessageType
from app.core.email import mail_config
from app.models.notification import Notification
from app.database import SessionLocal
from app.models.admin_notification import AdminNotification
from app.models.user import User
from app.models.auction import Auction
from app.models.auction_image import AuctionImage
from app.models.contact_message import ContactMessage


class AuctionReject(BaseModel):
    remark: str | None = None

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


# =====================================================
# GET PENDING AUCTIONS
# =====================================================

@router.get("/auctions/pending")
def get_pending_auctions(
    db: Session = Depends(get_db)
):

    # =================================================
    # GET ALL PENDING AUCTIONS
    # =================================================

    auctions = (
        db.query(Auction)
        .filter(
            Auction.status == "pending"
        )
        .order_by(
            Auction.created_at.desc()
        )
        .all()
    )

    result = []

    for auction in auctions:

        # ==========================================
        # GET USER WHO CREATED THE AUCTION
        # ==========================================

        user = (
            db.query(User)
            .filter(
                User.id == auction.user_id
            )
            .first()
        )

        # ==========================================
        # GET AUCTION IMAGES
        # ==========================================

        images = (
            db.query(AuctionImage)
            .filter(
                AuctionImage.auction_id == auction.id
            )
            .order_by(
                AuctionImage.display_order.asc()
            )
            .all()
        )

        result.append({

            # ==========================================
            # BASIC
            # ==========================================

            "id": auction.id,

            "user_id": auction.user_id,

            # ==========================================
            # AUCTION CREATED BY USER
            # ==========================================

            "created_by_user": {

                "id": user.id if user else None,

                "fullname": (
                    user.fullname
                    if user
                    else None
                ),

                "username": (
                    user.username
                    if user
                    else None
                ),

                "email": (
                    user.email
                    if user
                    else None
                ),

                "mobile": (
                    user.mobile
                    if user
                    else None
                ),

                "address": (
                    user.address
                    if user
                    else None
                ),

                "email_verified": (
                    user.email_verified
                    if user
                    else None
                ),

                "account_status": (
                    user.account_status
                    if user
                    else None
                ),

                "admin_remark": (
                    user.admin_remark
                    if user
                    else None
                ),

                "registration_date": (
                    user.registration_date.isoformat()
                    if user and user.registration_date
                    else None
                ),
            },

            # ==========================================
            # PRODUCT
            # ==========================================

            "product_title": auction.product_title,

            "brand_model": auction.brand_model,

            "category": auction.category,

            "description": auction.description,

            "product_condition": auction.product_condition,

            # ==========================================
            # PURCHASE
            # ==========================================

            "purchase_date": (
                auction.purchase_date.isoformat()
                if auction.purchase_date
                else None
            ),

            "purchased_by": auction.purchased_by,

            "purchase_price": (
                float(auction.purchase_price)
                if auction.purchase_price is not None
                else 0
            ),

            # ==========================================
            # AUCTION
            # ==========================================

            "starting_price": (
                float(auction.starting_price)
                if auction.starting_price is not None
                else 0
            ),

            "auction_start": (
                auction.auction_start.isoformat()
                if auction.auction_start
                else None
            ),

            "auction_end": (
                auction.auction_end.isoformat()
                if auction.auction_end
                else None
            ),

            # ==========================================
            # LOCATION
            # ==========================================

            "location_area": auction.location_area,

            "location_city": auction.location_city,

            "location_state": auction.location_state,

            "location_country": auction.location_country,

            "location_pincode": auction.location_pincode,

            # ==========================================
            # DELIVERY
            # ==========================================

            "delivery_type": auction.delivery_type,

            "shipping_type": auction.shipping_type,

            "shipping_charges": (
                float(auction.shipping_charges)
                if auction.shipping_charges is not None
                else 0
            ),

            "shipping_paid_by": auction.shipping_paid_by,

            # ==========================================
            # WARRANTY
            # ==========================================

            "warranty_status": auction.warranty_status,

            # ==========================================
            # PAYMENT
            # ==========================================

            "payment_method": auction.payment_method,

            # ==========================================
            # TERMS
            # ==========================================

            "product_terms": auction.product_terms,

            "terms_accepted": auction.terms_accepted,

            # ==========================================
            # SELLER
            # ==========================================

            "seller_name": auction.seller_name,

            "seller_email": auction.seller_email,

            "seller_contact": auction.seller_contact,

            # ==========================================
            # FILES
            # ==========================================

            "purchase_proof_path": (
                auction.purchase_proof_path
            ),

            "seller_proof_path": (
                auction.seller_proof_path
            ),

            # ==========================================
            # PRODUCT IMAGES
            # ==========================================

            "images": [

                {
                    "id": image.id,

                    "image_path": image.image_path,

                    "display_order": image.display_order
                }

                for image in images

            ],

            # ==========================================
            # STATUS / DATES
            # ==========================================

            "status": auction.status,

            "created_at": (
                auction.created_at.isoformat()
                if auction.created_at
                else None
            ),

            "updated_at": (
                auction.updated_at.isoformat()
                if auction.updated_at
                else None
            )

        })

    return result

# =====================================================
# APPROVE AUCTION
# =====================================================

# =====================================================
# APPROVE AUCTION
# =====================================================

@router.put("/auctions/{auction_id}/approve")
async def approve_auction(

    auction_id: int,

    db: Session = Depends(get_db)

):

    # =================================================
    # FIND AUCTION
    # =================================================

    auction = (
        db.query(Auction)
        .filter(
            Auction.id == auction_id
        )
        .first()
    )

    if not auction:

        raise HTTPException(
            status_code=404,
            detail="Auction not found."
        )

    # =================================================
    # CHECK STATUS
    # =================================================

    if auction.status != "pending":

        raise HTTPException(
            status_code=400,
            detail=(
                "Only pending auctions "
                "can be approved."
            )
        )

    # =================================================
    # FIND USER WHO CREATED AUCTION
    # =================================================

    user = (
        db.query(User)
        .filter(
            User.id == auction.user_id
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="Auction creator user not found."
        )

    # =================================================
    # UPDATE AUCTION STATUS
    # =================================================

    auction.status = "approved"

    # =================================================
    # CREATE USER WEB NOTIFICATION
    # =================================================

    notification = Notification(

        recipient_type="user",

        user_id=user.id,

        auction_id=auction.id,

        notif_type="auction_approved",

        title="Auction Approved",

        message=(
            f'Your auction "{auction.product_title}" '
            f'has been approved by the admin.'
        ),

        is_read=False

    )

    db.add(notification)

    # =================================================
    # SAVE AUCTION + NOTIFICATION
    # =================================================

    db.commit()

    db.refresh(auction)

    # =================================================
    # SEND APPROVAL EMAIL
    # =================================================

    email_sent = True

    try:

        message = MessageSchema(

            subject="Bidora - Auction Approved",

            recipients=[user.email],

            body=f"""
            <html>
                <body>

                    <h2>Bidora - Auction Approved</h2>

                    <p>
                        Hello <b>{user.fullname}</b>,
                    </p>

                    <p>
                        Your auction request has been
                        <b>approved by the admin</b>.
                    </p>

                    <p>
                        <b>Auction:</b>
                        {auction.product_title}
                    </p>

                    <p>
                        Your auction is now approved
                        and will be available according
                        to its scheduled auction time.
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

        fm = FastMail(mail_config)

        await fm.send_message(message)

    except Exception as e:

        email_sent = False

        print(
            "AUCTION APPROVAL EMAIL ERROR:",
            str(e)
        )

    # =================================================
    # RESPONSE
    # =================================================

    return {

        "success": True,

        "message": (
            "Auction approved successfully."
        ),

        "auction_id": auction.id,

        "status": auction.status,

        "notification_created": True,

        "email_sent": email_sent

    }


# =====================================================
# REJECT AUCTION
# =====================================================

@router.put("/auctions/{auction_id}/reject")
async def reject_auction(

    auction_id: int,

    data: AuctionReject,

    db: Session = Depends(get_db)

):

    # =================================================
    # FIND AUCTION
    # =================================================

    auction = (
        db.query(Auction)
        .filter(
            Auction.id == auction_id
        )
        .first()
    )

    if not auction:

        raise HTTPException(
            status_code=404,
            detail="Auction not found."
        )

    # =================================================
    # CHECK STATUS
    # =================================================

    if auction.status != "pending":

        raise HTTPException(
            status_code=400,
            detail=(
                "Only pending auctions "
                "can be rejected."
            )
        )

    # =================================================
    # FIND USER WHO CREATED AUCTION
    # =================================================

    user = (
        db.query(User)
        .filter(
            User.id == auction.user_id
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="Auction creator user not found."
        )

    # =================================================
    # REJECTION REMARK
    # =================================================

    remark = (
        data.remark.strip()
        if data.remark
        else "No rejection reason was provided."
    )

    # =================================================
    # UPDATE AUCTION STATUS
    # =================================================

    auction.status = "rejected"

    # =================================================
    # CREATE USER WEB NOTIFICATION
    # =================================================

    notification = Notification(

        recipient_type="user",

        user_id=user.id,

        auction_id=auction.id,

        notif_type="auction_rejected",

        title="Auction Rejected",

        message=(
            f'Your auction "{auction.product_title}" '
            f'has been rejected by the admin. '
            f'Reason: {remark}'
        ),

        is_read=False

    )

    db.add(notification)

    # =================================================
    # SAVE DATABASE CHANGES
    # =================================================

    db.commit()

    db.refresh(auction)

    # =================================================
    # SEND REJECTION EMAIL
    # =================================================

    email_sent = True

    try:

        message = MessageSchema(

            subject="Bidora - Auction Rejected",

            recipients=[user.email],

            body=f"""
            <html>
                <body>

                    <h2>Bidora - Auction Rejected</h2>

                    <p>
                        Hello <b>{user.fullname}</b>,
                    </p>

                    <p>
                        Your auction request has been
                        <b>rejected by the admin</b>.
                    </p>

                    <p>
                        <b>Auction:</b>
                        {auction.product_title}
                    </p>

                    <p>
                        <b>Reason for rejection:</b>
                    </p>

                    <p>
                        {remark}
                    </p>

                    <p>
                        Please review the reason and
                        make the necessary changes before
                        submitting your auction again.
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

        fm = FastMail(mail_config)

        await fm.send_message(message)

    except Exception as e:

        email_sent = False

        print(
            "AUCTION REJECTION EMAIL ERROR:",
            str(e)
        )

    # =================================================
    # RESPONSE
    # =================================================

    return {

        "success": True,

        "message": (
            "Auction rejected successfully."
        ),

        "auction_id": auction.id,

        "status": auction.status,

        "remark": remark,

        "notification_created": True,

        "email_sent": email_sent

    }

# =====================================================
# ADMIN NOTIFICATIONS
# =====================================================

@router.get("/notifications")
def get_admin_notifications(
    db: Session = Depends(get_db)
):
    notifications = (
        db.query(AdminNotification)
        .order_by(
            AdminNotification.created_at.desc()
        )
        .all()
    )

    return [
        {
            "id": notification.id,
            "notification_type": notification.notification_type,
            "auction_id": notification.auction_id,
            "user_id": notification.user_id,
            "title": notification.title,
            "message": notification.message,
            "is_read": notification.is_read,
            "created_at": (
                notification.created_at.isoformat()
                if notification.created_at
                else None
            )
        }
        for notification in notifications
    ]


@router.get("/notifications/unread-count")
def get_unread_notification_count(
    db: Session = Depends(get_db)
):
    count = (
        db.query(AdminNotification)
        .filter(
            AdminNotification.is_read == False
        )
        .count()
    )

    return {
        "count": count
    }


@router.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db)
):
    notification = (
        db.query(AdminNotification)
        .filter(
            AdminNotification.id == notification_id
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found."
        )

    notification.is_read = True

    db.commit()

    return {
        "success": True,
        "message": "Notification marked as read."
    }

# =========================================================
# CONTACT MESSAGE APIs
# =========================================================

class ContactMessageCreate(BaseModel):
    firstName: str
    lastName: str
    email: str
    phone: str | None = None
    helpTopic: str
    otherTopic: str | None = None
    auctionId: str | None = None
    message: str
    privacy: bool


class ContactStatusUpdate(BaseModel):
    status: str

class ContactReplyCreate(BaseModel):

    reply: str

# =========================================================
# CREATE CONTACT MESSAGE
# POST /admin/contact
# =========================================================

@router.post("/contact")
def create_contact_message(
    data: ContactMessageCreate,
    db: Session = Depends(get_db)
):

    # Check privacy agreement
    if not data.privacy:
        raise HTTPException(
            status_code=400,
            detail="Please agree to the Privacy Policy."
        )

    # Clean input values
    first_name = data.firstName.strip()
    last_name = data.lastName.strip()
    email = data.email.strip().lower()

    phone = (
        data.phone.strip()
        if data.phone
        else None
    )

    help_topic = data.helpTopic.strip()

    other_topic = (
        data.otherTopic.strip()
        if data.otherTopic
        else None
    )

    auction_id = (
        data.auctionId.strip()
        if data.auctionId
        else None
    )

    message = data.message.strip()

    # Validation
    if not first_name:
        raise HTTPException(
            status_code=400,
            detail="First name is required."
        )

    if not last_name:
        raise HTTPException(
            status_code=400,
            detail="Last name is required."
        )

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email is required."
        )

    if not help_topic:
        raise HTTPException(
            status_code=400,
            detail="Please select a help topic."
        )

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Message is required."
        )

    if help_topic == "Other" and not other_topic:
        raise HTTPException(
            status_code=400,
            detail="Please specify your topic."
        )

    try:

        # Create database record
        contact = ContactMessage(

            first_name=first_name,

            last_name=last_name,

            email=email,

            phone=phone,

            help_topic=help_topic,

            other_topic=(
                other_topic
                if help_topic == "Other"
                else None
            ),

            auction_id=auction_id,

            message=message,

            is_read=False,

            status="OPEN"
        )

        db.add(contact)

        db.commit()

        db.refresh(contact)

        print(
            f"CONTACT MESSAGE SAVED - ID: {contact.id}"
        )

        return {
            "success": True,
            "message": "Contact message submitted successfully.",
            "ticket_id": contact.id
        }

    except Exception as e:

        db.rollback()

        print(
            "CONTACT MESSAGE DATABASE ERROR:",
            str(e)
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to save contact message."
        )


# =========================================================
# GET ALL CONTACT MESSAGES
# GET /admin/contact-messages
# =========================================================

@router.get("/contact-messages")
def get_contact_messages(
    db: Session = Depends(get_db)
):

    contacts = (
        db.query(ContactMessage)
        .order_by(
            ContactMessage.created_at.desc()
        )
        .all()
    )

    return [
        {
            "id": contact.id,

            "first_name":
                contact.first_name,

            "last_name":
                contact.last_name,

            "email":
                contact.email,

            "phone":
                contact.phone,

            "help_topic":
                contact.help_topic,

            "other_topic":
                contact.other_topic,

            "auction_id":
                contact.auction_id,

            "message":
                contact.message,

            "is_read":
                contact.is_read,

            "status":
                contact.status,

            "created_at":
                (
                    contact.created_at.isoformat()
                    if contact.created_at
                    else None
                )
        }

        for contact in contacts
    ]


# =========================================================
# MARK CONTACT MESSAGE AS READ
# PUT /admin/contact-messages/{message_id}/read
# =========================================================

@router.put("/contact-messages/{message_id}/read")
def mark_contact_message_read(
    message_id: int,
    db: Session = Depends(get_db)
):

    contact = (
        db.query(ContactMessage)
        .filter(
            ContactMessage.id == message_id
        )
        .first()
    )

    if not contact:

        raise HTTPException(
            status_code=404,
            detail="Contact message not found."
        )

    contact.is_read = True

    db.commit()

    return {
        "success": True,
        "message": "Contact message marked as read."
    }


# =========================================================
# UPDATE CONTACT MESSAGE STATUS
# PUT /admin/contact-messages/{message_id}/status
# =========================================================

@router.put("/contact-messages/{message_id}/status")
def update_contact_message_status(
    message_id: int,
    data: ContactStatusUpdate,
    db: Session = Depends(get_db)
):

    allowed_statuses = [
        "OPEN",
        "IN_PROGRESS",
        "RESOLVED"
    ]

    status = data.status.strip().upper()

    if status not in allowed_statuses:

        raise HTTPException(
            status_code=400,
            detail="Invalid contact message status."
        )

    contact = (
        db.query(ContactMessage)
        .filter(
            ContactMessage.id == message_id
        )
        .first()
    )

    if not contact:

        raise HTTPException(
            status_code=404,
            detail="Contact message not found."
        )

    contact.status = status

    # If admin moves it from OPEN,
    # automatically consider it read
    if status != "OPEN":
        contact.is_read = True

    db.commit()

    return {
        "success": True,
        "message": "Contact message status updated successfully.",
        "status": contact.status
    }

# =========================================================
# REPLY TO CONTACT MESSAGE
# POST /admin/contact-messages/{message_id}/reply
# =========================================================

@router.post("/contact-messages/{message_id}/reply")
async def reply_to_contact_message(
    message_id: int,
    data: ContactReplyCreate,
    db: Session = Depends(get_db)
):

    # =====================================================
    # FIND CONTACT MESSAGE
    # =====================================================

    contact = (
        db.query(ContactMessage)
        .filter(
            ContactMessage.id == message_id
        )
        .first()
    )

    if not contact:

        raise HTTPException(
            status_code=404,
            detail="Contact message not found."
        )

    # =====================================================
    # CLEAN REPLY
    # =====================================================

    reply = data.reply.strip()

    if not reply:

        raise HTTPException(
            status_code=400,
            detail="Reply message is required."
        )

    # =====================================================
    # SEND REPLY EMAIL
    # =====================================================

    try:

        message = MessageSchema(

            subject=(
                f"Bidora Support - "
                f"Ticket #{contact.id}"
            ),

            recipients=[
                contact.email
            ],

            body=f"""
Hello {contact.first_name},

Thank you for contacting Bidora Support.

Regarding your query:

{contact.message}

----------------------------------------

Admin Response:

{reply}

----------------------------------------

If you have any further questions,
please contact Bidora Support again.

Regards,
Bidora Support Team
Bidora
""",

            subtype=MessageType.plain

        )

        # IMPORTANT:
        # Use the existing email configuration
        # from app.core.email

        fm = FastMail(mail_config)

        await fm.send_message(message)

        # =================================================
        # UPDATE CONTACT MESSAGE
        # =================================================

        contact.status = "IN_PROGRESS"

        contact.is_read = True

        db.commit()

        db.refresh(contact)

        # =================================================
        # SUCCESS RESPONSE
        # =================================================

        return {

            "success": True,

            "message": (
                "Reply sent successfully."
            ),

            "email": contact.email,

            "ticket_id": contact.id,

            "status": contact.status

        }

    # =====================================================
    # EMAIL / DATABASE ERROR
    # =====================================================

    except Exception as e:

        db.rollback()

        print(
            "========================================"
        )

        print(
            "CONTACT REPLY ERROR:",
            str(e)
        )

        print(
            "========================================"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to send reply."
        )