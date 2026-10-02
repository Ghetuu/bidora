from datetime import datetime, timezone, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.auction import Auction
from app.models.bids import Bid


# =========================================================
# SECURITY
# =========================================================

SENSITIVE_KEYWORDS = [
    "password",
    "passwd",
    "credential",
    "login password",
    "email",
    "e-mail",
    "phone",
    "mobile",
    "address",
    "pincode",
    "pin code",
    "seller email",
    "seller phone",
    "seller mobile",
    "seller contact",
    "contact number",
    "purchase proof",
    "seller proof",
    "proof document",
    "all users",
    "other users",
    "user database",
]


def is_sensitive_question(message: str) -> bool:

    text = message.lower().strip()

    return any(
        keyword in text
        for keyword in SENSITIVE_KEYWORDS
    )


# =========================================================
# TIME STATUS
# =========================================================

def get_auction_time_status(auction):

    if not auction.auction_start or not auction.auction_end:
        return "unknown"

    now = datetime.now(timezone.utc)

    start = auction.auction_start
    end = auction.auction_end

    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)

    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)

    if now < start:
        return "upcoming"

    if start <= now <= end:
        return "live"

    return "ended"


# =========================================================
# FORMAT PRICE
# =========================================================

def format_price(value):

    if value is None:
        return "₹0"

    try:
        amount = Decimal(str(value))

        return f"₹{amount:,.2f}"

    except Exception:
        return "₹0"


# =========================================================
# FORMAT TIME
# =========================================================

def format_datetime(value):

    if not value:
        return "Not available"

    try:

        return value.strftime(
            "%d %b %Y, %I:%M %p"
        )

    except Exception:

        return "Not available"


# =========================================================
# FIND HIGHEST BID
# =========================================================

def get_highest_bid(
    db: Session,
    auction_id
):

    return (
        db.query(Bid)
        .filter(
            Bid.auction_id == auction_id
        )
        .order_by(
            Bid.amount.desc()
        )
        .first()
    )


# =========================================================
# MY ACTIVE BIDS
# =========================================================

def get_my_active_bids(
    db: Session,
    user_id: int
):

    rows = (
        db.query(Bid, Auction)
        .join(
            Auction,
            Bid.auction_id == Auction.id
        )
        .filter(
            Bid.user_id == user_id
        )
        .order_by(
            Bid.created_at.desc()
        )
        .all()
    )

    grouped = {}

    for bid, auction in rows:

        status = get_auction_time_status(
            auction
        )

        if status == "ended":
            continue

        if auction.id not in grouped:

            grouped[auction.id] = {
                "auction": auction,
                "my_highest": Decimal("0")
            }

        amount = Decimal(
            str(bid.amount)
        )

        if amount > grouped[auction.id]["my_highest"]:

            grouped[auction.id]["my_highest"] = amount

    result = []

    for data in grouped.values():

        auction = data["auction"]

        my_highest = data["my_highest"]

        highest_bid = get_highest_bid(
            db,
            auction.id
        )

        current_high = (
            Decimal(str(highest_bid.amount))
            if highest_bid
            else Decimal("0")
        )

        if current_high > my_highest:

            bid_status = "Outbid"

        else:

            bid_status = "Highest Bidder"

        result.append({

            "title": auction.product_title,

            "category": auction.category,

            "my_bid": format_price(
                my_highest
            ),

            "current_high": format_price(
                current_high
            ),

            "status": bid_status,

            "auction_status":
                get_auction_time_status(
                    auction
                ),

            "ends":
                format_datetime(
                    auction.auction_end
                )
        })

    return result


# =========================================================
# LIVE AUCTIONS
# =========================================================

def get_live_auctions(
    db: Session
):

    auctions = (
        db.query(Auction)
        .filter(
            Auction.status == "live"
        )
        .order_by(
            Auction.auction_end.asc()
        )
        .limit(10)
        .all()
    )

    result = []

    for auction in auctions:

        highest_bid = get_highest_bid(
            db,
            auction.id
        )

        result.append({

            "title":
                auction.product_title,

            "brand":
                auction.brand_model,

            "category":
                auction.category,

            "starting_price":
                format_price(
                    auction.starting_price
                ),

            "current_bid":
                format_price(
                    highest_bid.amount
                    if highest_bid
                    else auction.starting_price
                ),

            "ends":
                format_datetime(
                    auction.auction_end
                )
        })

    return result


# =========================================================
# ENDING SOON
# =========================================================

def get_ending_soon(
    db: Session
):

    now = datetime.now(timezone.utc)

    end_limit = (
        now + timedelta(hours=24)
    )

    auctions = (
        db.query(Auction)
        .filter(
            Auction.status == "live"
        )
        .all()
    )

    result = []

    for auction in auctions:

        if not auction.auction_end:
            continue

        end = auction.auction_end

        if end.tzinfo is None:
            end = end.replace(
                tzinfo=timezone.utc
            )

        if now <= end <= end_limit:

            highest_bid = get_highest_bid(
                db,
                auction.id
            )

            result.append({

                "title":
                    auction.product_title,

                "current_bid":
                    format_price(
                        highest_bid.amount
                        if highest_bid
                        else auction.starting_price
                    ),

                "ends":
                    format_datetime(
                        auction.auction_end
                    )
            })

    result.sort(
        key=lambda item: item["ends"]
    )

    return result[:10]


# =========================================================
# MY AUCTIONS
# =========================================================

def get_my_auctions(
    db: Session,
    user_id: int
):

    auctions = (
        db.query(Auction)
        .filter(
            Auction.user_id == user_id
        )
        .order_by(
            Auction.created_at.desc()
        )
        .limit(20)
        .all()
    )

    result = []

    for auction in auctions:

        highest_bid = get_highest_bid(
            db,
            auction.id
        )

        result.append({

            "title":
                auction.product_title,

            "status":
                auction.status,

            "auction_status":
                get_auction_time_status(
                    auction
                ),

            "starting_price":
                format_price(
                    auction.starting_price
                ),

            "highest_bid":
                format_price(
                    highest_bid.amount
                    if highest_bid
                    else 0
                ),

            "ends":
                format_datetime(
                    auction.auction_end
                )
        })

    return result


# =========================================================
# SEARCH AUCTIONS
# =========================================================

def search_auctions(
    db: Session,
    search_text: str
):

    search = f"%{search_text}%"

    auctions = (
        db.query(Auction)
        .filter(
            Auction.status.in_(
                ["approved", "live"]
            )
        )
        .filter(
            (
                Auction.product_title.ilike(search)
                |
                Auction.brand_model.ilike(search)
                |
                Auction.category.ilike(search)
            )
        )
        .order_by(
            Auction.created_at.desc()
        )
        .limit(10)
        .all()
    )

    result = []

    for auction in auctions:

        highest_bid = get_highest_bid(
            db,
            auction.id
        )

        result.append({

            "title":
                auction.product_title,

            "brand":
                auction.brand_model,

            "category":
                auction.category,

            "starting_price":
                format_price(
                    auction.starting_price
                ),

            "current_bid":
                format_price(
                    highest_bid.amount
                    if highest_bid
                    else auction.starting_price
                ),

            "status":
                get_auction_time_status(
                    auction
                ),

            "ends":
                format_datetime(
                    auction.auction_end
                )
        })

    return result


# =========================================================
# MAIN AURORA PROCESSOR
# =========================================================

def process_aurora_message(
    db: Session,
    current_user: User,
    message: str
):

    text = message.lower().strip()

    # =====================================================
    # SECURITY CHECK FIRST
    # =====================================================

    if is_sensitive_question(text):

        return {
            "success": True,

            "intent": "security_block",

            "answer": (
                "🔒 I can't provide passwords, "
                "email addresses, phone numbers, "
                "addresses, private credentials, "
                "or other sensitive personal information."
            ),

            "data": []
        }

    # =====================================================
    # GREETING
    # =====================================================

    greetings = [
        "hi",
        "hello",
        "hey",
        "hii",
        "helo",
        "good morning",
        "good afternoon",
        "good evening"
    ]

    if text in greetings:

        return {
            "success": True,
            "intent": "greeting",
            "answer": (
                "Hi! 👋 I'm Aurora, your "
                "Bidora AI Auction Assistant. "
                "Ask me about your bids, auctions, "
                "live auctions, or ending-soon auctions."
            ),
            "data": []
        }

    # =====================================================
    # MY ACTIVE BIDS
    # =====================================================

    if (
        "active bid" in text
        or "my bids" in text
        or "my active bids" in text
        or "show my bids" in text
        or "what did i bid" in text
    ):

        data = get_my_active_bids(
            db,
            current_user.id
        )

        if not data:

            answer = (
                "You don't have any active bids "
                "right now."
            )

        else:

            answer = (
                f"You have {len(data)} "
                f"active auction"
                f"{'s' if len(data) != 1 else ''}."
            )

        return {
            "success": True,
            "intent": "my_active_bids",
            "answer": answer,
            "data": data
        }

    # =====================================================
    # LIVE AUCTIONS
    # =====================================================

    if (
        "live auction" in text
        or "live auctions" in text
        or "currently live" in text
        or "what is live" in text
    ):

        data = get_live_auctions(db)

        return {
            "success": True,
            "intent": "live_auctions",
            "answer": (
                f"There are {len(data)} "
                f"live auction"
                f"{'s' if len(data) != 1 else ''} "
                "available."
            ),
            "data": data
        }

    # =====================================================
    # ENDING SOON
    # =====================================================

    if (
        "ending soon" in text
        or "ends soon" in text
        or "ending today" in text
        or "finish soon" in text
    ):

        data = get_ending_soon(db)

        return {
            "success": True,
            "intent": "ending_soon",
            "answer": (
                f"I found {len(data)} auction"
                f"{'s' if len(data) != 1 else ''} "
                "ending within the next 24 hours."
            ),
            "data": data
        }

    # =====================================================
    # MY AUCTIONS
    # =====================================================

    if (
        "my auctions" in text
        or "auctions i created" in text
        or "my listed auctions" in text
    ):

        data = get_my_auctions(
            db,
            current_user.id
        )

        return {
            "success": True,
            "intent": "my_auctions",
            "answer": (
                f"You have {len(data)} "
                f"auction"
                f"{'s' if len(data) != 1 else ''}."
            ),
            "data": data
        }

    # =====================================================
    # SEARCH AUCTION
    # =====================================================

    search_triggers = [
        "find",
        "search",
        "show",
        "looking for",
        "do you have"
    ]

    if any(
        trigger in text
        for trigger in search_triggers
    ):

        words = text.split()

        ignored_words = {
            "find",
            "search",
            "show",
            "me",
            "auction",
            "auctions",
            "for",
            "a",
            "an",
            "the",
            "do",
            "you",
            "have",
            "looking"
        }

        search_terms = [
            word
            for word in words
            if word not in ignored_words
        ]

        if search_terms:

            search_text = " ".join(
                search_terms
            )

            data = search_auctions(
                db,
                search_text
            )

            if not data:

                return {
                    "success": True,
                    "intent": "auction_search",
                    "answer": (
                        "I couldn't find a matching "
                        "auction in the Bidora database."
                    ),
                    "data": []
                }

            return {
                "success": True,
                "intent": "auction_search",
                "answer": (
                    f"I found {len(data)} "
                    f"matching auction"
                    f"{'s' if len(data) != 1 else ''}."
                ),
                "data": data
            }

    # =====================================================
    # FALLBACK
    # =====================================================

    return {
        "success": True,

        "intent": "unknown",

        "answer": (
            "I can help with your Bidora database "
            "information. Try asking about your active "
            "bids, live auctions, ending-soon auctions, "
            "your auctions, or search for an auction."
        ),

        "data": []
    }