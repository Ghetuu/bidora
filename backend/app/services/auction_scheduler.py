import asyncio

from fastapi_mail import FastMail, MessageSchema, MessageType
from app.core.email import mail_config

from datetime import datetime, timedelta

from app.database import SessionLocal

from app.models.auction import Auction
from app.models.user import User
from app.models.notification import Notification
from app.models.auction_image import AuctionImage

from app.services.auction_validation_service import (
    validate_auction
)


# =========================================================
# NOTIFY ALL USERS
# =========================================================
def notify_all_users(
    db,
    auction,
    notif_type,
    title,
    message
):
    try:

        users = db.query(User).all()

        for user in users:

            notification = Notification(
                recipient_type="user",
                user_id=user.id,
                auction_id=auction.id,
                notif_type=notif_type,
                title=title,
                message=message,
                is_read=False
            )

            db.add(notification)

        print(
            f"[NOTIFICATION CREATED] "
            f"Auction {auction.id} -> {notif_type}"
        )

    except Exception as e:

        print(
            f"[NOTIFICATION ERROR] "
            f"{notif_type}: {str(e)}"
        )

# =========================================================
# NOTIFY SELLER
# =========================================================

def notify_seller(
    db,
    auction,
    notif_type,
    title,
    message
):
    try:

        notification = Notification(
            recipient_type="user",
            user_id=auction.user_id,
            auction_id=auction.id,
            notif_type=notif_type,
            title=title,
            message=message,
            is_read=False
        )

        db.add(notification)

        print(
            f"[SELLER NOTIFICATION CREATED] "
            f"Auction {auction.id} -> User {auction.user_id}"
        )

    except Exception as e:

        print(
            f"[SELLER NOTIFICATION ERROR] "
            f"Auction {auction.id}: {str(e)}"
        )

# =========================================================
# AUTOMATIC APPROVAL EMAIL
# =========================================================

async def send_automatic_approval_email(
    user,
    auction
):

    try:

        message = MessageSchema(
            subject="Bidora - Auction Automatically Approved",

            recipients=[user.email],

            body=f"""
Hello {user.fullname},

Your auction "{auction.product_title}" has been automatically approved.

The auction passed all required validation checks and is now approved.

Auction Details:
Product: {auction.product_title}
Auction ID: {auction.id}

Thank you for using Bidora.

Regards,
Bidora Team
""",

            subtype=MessageType.plain
        )

        fm = FastMail(mail_config)

        await fm.send_message(message)

        print(
            f"[AUTO APPROVAL EMAIL SENT] "
            f"Auction {auction.id} -> {user.email}"
        )

    except Exception as e:

        print(
            f"[AUTO APPROVAL EMAIL ERROR] "
            f"Auction {auction.id}: {str(e)}"
        )


# =========================================================
# AUTOMATIC REJECTION EMAIL
# =========================================================

async def send_automatic_rejection_email(
    user,
    auction,
    reason
):

    try:

        message = MessageSchema(
            subject="Bidora - Auction Automatically Rejected",

            recipients=[user.email],

            body=f"""
Hello {user.fullname},

Your auction "{auction.product_title}" has been automatically rejected.

The auction did not pass the required validation checks.

Auction Details:
Product: {auction.product_title}
Auction ID: {auction.id}

Rejection Reason:
{reason}

Please review the above reason and make the necessary corrections before submitting the auction again.

Regards,
Bidora Team
""",

            subtype=MessageType.plain
        )

        fm = FastMail(mail_config)

        await fm.send_message(message)

        print(
            f"[AUTO REJECTION EMAIL SENT] "
            f"Auction {auction.id} -> {user.email}"
        )

    except Exception as e:

        print(
            f"[AUTO REJECTION EMAIL ERROR] "
            f"Auction {auction.id}: {str(e)}"
        )


# =========================================================
# PROCESS PENDING AUCTIONS
# AUTOMATIC VALIDATION 1 HOUR BEFORE START
# =========================================================

async def process_pending_auctions(db):

    now = datetime.now()
    print(
    f"[SCHEDULER CHECK] "
    f"Now: {now} | "
    f"Automatic check time: {now + timedelta(hours=1)}"
)

    automatic_start = now + timedelta(hours=1)

    automatic_end = automatic_start + timedelta(seconds=15)

    auctions = (
        db.query(Auction)
        .filter(
            Auction.status == "pending",
            Auction.auction_start <= automatic_end,
            Auction.auction_start > now
        )
        .all()
    )

    for auction in auctions:

        if auction.status != "pending":
            continue

        try:

            # =================================================
            # GET SELLER
            # =================================================

            user = (
                db.query(User)
                .filter(User.id == auction.user_id)
                .first()
            )

            # =================================================
            # GET AUCTION IMAGES
            # =================================================

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

            # =================================================
            # VALIDATE AUCTION
            # =================================================

            result = validate_auction(
                auction=auction,
                user=user,
                images=images,
                db=db
            )

            # =================================================
            # AUTOMATIC REJECTION
            # =================================================

            if not result["valid"]:

                if auction.status != "pending":
                    continue

                auction.status = "rejected"

                auction.rejected_by = "Automatic"
                auction.rejected_at = datetime.now()
                auction.rejection_reason = result["reason"]

                # ---------------------------------------------
                # WEB / IN-APP SELLER NOTIFICATION
                # ---------------------------------------------

                notify_seller(
                    db=db,
                    auction=auction,
                    notif_type="automatic_auction_rejected",
                    title="Auction Automatically Rejected",
                    message=(
                        f'Your auction '
                        f'"{auction.product_title}" '
                        f'was automatically rejected '
                        f'because it did not pass the required '
                        f'validation checks. '
                        f'Reason: {result["reason"]}'
                    )
                )

                # ---------------------------------------------
                # AUTOMATIC EMAIL TO SELLER
                # ---------------------------------------------

                await send_automatic_rejection_email(
                    user=user,
                    auction=auction,
                    reason=result["reason"]
                )

                print(
                    f"[AUTO REJECTED] "
                    f"Auction {auction.id}: "
                    f"{result['reason']}"
                )

            # =================================================
            # AUTOMATIC APPROVAL
            # =================================================

            else:

                if auction.status != "pending":
                    continue

                auction.status = "approved"

                # ---------------------------------------------
                # APPROVAL TRACKING
                # ---------------------------------------------

                auction.approved_by = "system"
                auction.approved_at = datetime.now()

                # Clear any previous rejection information
                auction.rejected_by = None
                auction.rejected_at = None
                auction.rejection_reason = None


                # ---------------------------------------------
                # WEB / IN-APP SELLER NOTIFICATION
                # ---------------------------------------------

                notify_seller(
                    db=db,
                    auction=auction,
                    notif_type="automatic_auction_approved",
                    title="Auction Automatically Approved",
                    message=(
                        f'Your auction '
                        f'"{auction.product_title}" '
                        f'was automatically approved '
                        f'because it passed all required '
                        f'validation checks.'
                    )
                )

                # ---------------------------------------------
                # AUTOMATIC EMAIL TO SELLER
                # ---------------------------------------------

                await send_automatic_approval_email(
                    user=user,
                    auction=auction
                )

                print(
                    f"[AUTO APPROVED] "
                    f"Auction {auction.id}"
                )

        except Exception as e:

            print(
                f"[AUTO VALIDATION ERROR] "
                f"Auction {auction.id}: {str(e)}"
            )


# =========================================================
# PROCESS AUCTION TIME NOTIFICATIONS
# =========================================================

# =========================================================
# PROCESS AUCTION TIME NOTIFICATIONS
# =========================================================

def process_auction_notifications(db):

    now = datetime.now()

    # =========================================================
    # GET APPROVED / LIVE AUCTIONS
    # =========================================================

    auctions = (
        db.query(Auction)
        .filter(
            Auction.status.in_([
                "approved",
                "live",
                "ended"
            ])
        )
        .all()
    )

    for auction in auctions:

        try:

            # =================================================
            # 30 MINUTES BEFORE AUCTION
            # =================================================

            if (
                auction.status == "approved"
                and auction.auction_start is not None
            ):

                diff = (
                    auction.auction_start - now
                ).total_seconds()

                if 0 <= diff <= 1800:

                    notify_all_users(
                        db=db,
                        auction=auction,
                        notif_type="auction_starting_30_minutes",
                        title="Auction Starting in 30 Minutes",
                        message=(
                            f'Auction '
                            f'"{auction.product_title}" '
                            f'will start in approximately '
                            f'30 minutes.'
                        )
                    )

                    print(
                        f"[30 MIN NOTIFICATION] "
                        f"Auction {auction.id}"
                    )

            # =================================================
            # 15 MINUTES BEFORE AUCTION
            # =================================================

            if (
                auction.status == "approved"
                and auction.auction_start is not None
            ):

                diff = (
                    auction.auction_start - now
                ).total_seconds()

                if 0 <= diff <= 900:

                    notify_all_users(
                        db=db,
                        auction=auction,
                        notif_type="auction_starting_15_minutes",
                        title="Auction Starting in 15 Minutes",
                        message=(
                            f'Auction '
                            f'"{auction.product_title}" '
                            f'will start in approximately '
                            f'15 minutes.'
                        )
                    )

                    print(
                        f"[15 MIN NOTIFICATION] "
                        f"Auction {auction.id}"
                    )

            # =================================================
            # 5 MINUTES BEFORE AUCTION
            # =================================================

            if (
                auction.status == "approved"
                and auction.auction_start is not None
            ):

                diff = (
                    auction.auction_start - now
                ).total_seconds()

                if 0 <= diff <= 300:

                    notify_all_users(
                        db=db,
                        auction=auction,
                        notif_type="auction_starting_5_minutes",
                        title="Auction Starting Soon",
                        message=(
                            f'Auction '
                            f'"{auction.product_title}" '
                            f'will start in approximately '
                            f'5 minutes.'
                        )
                    )

                    print(
                        f"[5 MIN NOTIFICATION] "
                        f"Auction {auction.id}"
                    )

            # =================================================
            # AUCTION START
            # =================================================

            if (
                auction.status == "approved"
                and auction.auction_start is not None
                and now >= auction.auction_start
            ):

                auction.status = "live"

                notify_all_users(
                    db=db,
                    auction=auction,
                    notif_type="auction_started",
                    title="Auction Started",
                    message=(
                        f'Auction '
                        f'"{auction.product_title}" '
                        f'is now live.'
                    )
                )

                print(
                    f"[AUCTION LIVE] "
                    f"Auction {auction.id}"
                )

            # =================================================
            # 5 MINUTES AFTER START
            # =================================================

            if (
                auction.status == "live"
                and auction.auction_start is not None
            ):

                diff = (
                    now - auction.auction_start
                ).total_seconds()

                if 300 <= diff <= 315:

                    notify_all_users(
                        db=db,
                        auction=auction,
                        notif_type="auction_started_5_minutes",
                        title="Auction Is Live",
                        message=(
                            f'Auction '
                            f'"{auction.product_title}" '
                            f'has been live for 5 minutes.'
                        )
                    )

                    print(
                        f"[5 MIN AFTER START] "
                        f"Auction {auction.id}"
                    )

            # =================================================
            # AUCTION END
            # =================================================

            if (
                auction.status == "live"
                and auction.auction_end is not None
                and now >= auction.auction_end
            ):

                auction.status = "ended"

                notify_all_users(
                    db=db,
                    auction=auction,
                    notif_type="auction_ended",
                    title="Auction Ended",
                    message=(
                        f'Auction '
                        f'"{auction.product_title}" '
                        f'has ended.'
                    )
                )

                print(
                    f"[AUCTION ENDED] "
                    f"Auction {auction.id}"
                )

        except Exception as e:

            print(
                f"[AUCTION NOTIFICATION ERROR] "
                f"Auction {auction.id}: {str(e)}"
            )

# =========================================================
# MAIN AUCTION SCHEDULER
# =========================================================

async def auction_scheduler_loop():

    print("==============================================")
    print("BIDORA AUCTION AUTOMATIC SCHEDULER STARTED")
    print("==============================================")

    while True:

        db = SessionLocal()

        try:

            # =================================================
            # AUTOMATIC APPROVAL / REJECTION
            # =================================================

            await process_pending_auctions(db)

            # =================================================
            # AUCTION START / END NOTIFICATIONS
            # =================================================

            process_auction_notifications(db)

            # =================================================
            # SAVE DATABASE CHANGES
            # =================================================

            db.commit()

        except Exception as e:

            db.rollback()

            print(
                "AUCTION SCHEDULER ERROR:",
                str(e)
            )

        finally:

            db.close()

        # =====================================================
        # RUN EVERY 15 SECONDS
        # =====================================================

        await asyncio.sleep(15)