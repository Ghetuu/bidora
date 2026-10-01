from collections import Counter
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.auction import Auction
from app.models.bids import Bid
from app.models.auction_view import AuctionView


# =========================================================
# RECOMMENDATION SERVICE
# =========================================================
#
# Content-based recommendation system.
#
# Uses:
#   1. Auctions viewed by the user
#   2. Auctions where the user placed bids
#   3. Category
#   4. Brand
#   5. Price
#
# Score:
#   Category match       = 40 points
#   Brand match          = 30 points
#   Price similarity     = 20 points
#   Condition match      = 10 points
#
# Bid history is given more importance than just views.
# =========================================================


def get_user_preferences(
    db: Session,
    user_id: int
):
    """
    Create a simple preference profile for the user.

    Returns:
        {
            "categories": Counter,
            "brands": Counter,
            "conditions": Counter,
            "prices": list
        }
    """

    categories = Counter()
    brands = Counter()
    conditions = Counter()
    prices = []

    # =====================================================
    # 1. AUCTIONS VIEWED BY USER
    # =====================================================

    viewed_rows = (
        db.query(AuctionView, Auction)
        .join(
            Auction,
            AuctionView.auction_id == Auction.id
        )
        .filter(
            AuctionView.user_id == user_id
        )
        .all()
    )

    for view, auction in viewed_rows:

        if auction.category:
            categories[
                auction.category.strip().lower()
            ] += 1

        if auction.brand_model:
            brands[
                auction.brand_model.strip().lower()
            ] += 1

        if auction.product_condition:
            conditions[
                auction.product_condition.strip().lower()
            ] += 1

        if auction.starting_price is not None:
            prices.append(
                Decimal(str(auction.starting_price))
            )

    # =====================================================
    # 2. AUCTIONS WHERE USER PLACED BIDS
    # =====================================================

    bid_rows = (
        db.query(Bid, Auction)
        .join(
            Auction,
            Bid.auction_id == Auction.id
        )
        .filter(
            Bid.user_id == user_id
        )
        .all()
    )

    for bid, auction in bid_rows:

        # A bid is stronger evidence than a simple view.
        # Therefore add it 3 times.

        if auction.category:
            categories[
                auction.category.strip().lower()
            ] += 3

        if auction.brand_model:
            brands[
                auction.brand_model.strip().lower()
            ] += 3

        if auction.product_condition:
            conditions[
                auction.product_condition.strip().lower()
            ] += 3

        if auction.starting_price is not None:
            prices.extend(
                [
                    Decimal(str(auction.starting_price)),
                    Decimal(str(auction.starting_price)),
                    Decimal(str(auction.starting_price))
                ]
            )

    return {
        "categories": categories,
        "brands": brands,
        "conditions": conditions,
        "prices": prices
    }


# =========================================================
# PRICE SIMILARITY
# =========================================================

def calculate_price_score(
    auction_price,
    preferred_prices
):
    """
    Returns a score from 0 to 20.

    The closer the auction price is to the user's
    previous price range, the higher the score.
    """

    if (
        auction_price is None
        or not preferred_prices
    ):
        return 0

    auction_price = Decimal(
        str(auction_price)
    )

    average_price = (
        sum(preferred_prices)
        / len(preferred_prices)
    )

    if average_price <= 0:
        return 0

    difference = abs(
        auction_price - average_price
    )

    percentage_difference = (
        difference / average_price
    )

    # Very close price
    if percentage_difference <= Decimal("0.10"):
        return 20

    # Within 25%
    if percentage_difference <= Decimal("0.25"):
        return 15

    # Within 40%
    if percentage_difference <= Decimal("0.40"):
        return 10

    # Within 60%
    if percentage_difference <= Decimal("0.60"):
        return 5

    return 0


# =========================================================
# CALCULATE AUCTION SCORE
# =========================================================

def calculate_auction_score(
    auction,
    preferences
):
    """
    Calculate how suitable an auction is for the user.
    """

    score = 0

    # -----------------------------------------------------
    # CATEGORY
    # -----------------------------------------------------

    category = (
        auction.category.strip().lower()
        if auction.category
        else ""
    )

    if category in preferences["categories"]:
        score += 40

    # -----------------------------------------------------
    # BRAND
    # -----------------------------------------------------

    brand = (
        auction.brand_model.strip().lower()
        if auction.brand_model
        else ""
    )

    if brand in preferences["brands"]:
        score += 30

    # -----------------------------------------------------
    # CONDITION
    # -----------------------------------------------------

    condition = (
        auction.product_condition.strip().lower()
        if auction.product_condition
        else ""
    )

    if condition in preferences["conditions"]:
        score += 10

    # -----------------------------------------------------
    # PRICE
    # -----------------------------------------------------

    score += calculate_price_score(
        auction.starting_price,
        preferences["prices"]
    )

    return score


# =========================================================
# RECOMMEND AUCTIONS
# =========================================================

def get_recommendations(
    db: Session,
    user_id: int,
    limit: int = 6
):
    """
    Return personalized auction recommendations.
    """

    preferences = get_user_preferences(
        db,
        user_id
    )

    # =====================================================
    # AUCTIONS ALREADY VIEWED
    # =====================================================

    viewed_auction_ids = {
        row.auction_id
        for row in (
            db.query(AuctionView)
            .filter(
                AuctionView.user_id == user_id
            )
            .all()
        )
    }

    # =====================================================
    # AUCTIONS ALREADY BID ON
    # =====================================================

    bid_auction_ids = {
        row.auction_id
        for row in (
            db.query(Bid)
            .filter(
                Bid.user_id == user_id
            )
            .all()
        )
    }

    # =====================================================
    # GET AVAILABLE AUCTIONS
    # =====================================================
    #
    # We only recommend:
    #   status = live
    #
    # Also exclude:
    #   - user's own auctions
    #   - already viewed auctions
    #   - already bid auctions
    #
    # =====================================================

    auctions = (
        db.query(Auction)
        .filter(
            Auction.status == "live",
            Auction.user_id != user_id
        )
        .order_by(
            Auction.created_at.desc()
        )
        .all()
    )

    recommendations = []

    for auction in auctions:

        # Don't repeatedly recommend something
        # the user already interacted with.
        #if auction.id in viewed_auction_ids:
         #   continue

       # if auction.id in bid_auction_ids:
        #    continue

        score = calculate_auction_score(
            auction,
            preferences
        )

        # -------------------------------------------------
        # RECOMMENDATION REASON
        # -------------------------------------------------

        reasons = []

        category = (
            auction.category.strip().lower()
            if auction.category
            else ""
        )

        brand = (
            auction.brand_model.strip().lower()
            if auction.brand_model
            else ""
        )

        condition = (
            auction.product_condition.strip().lower()
            if auction.product_condition
            else ""
        )

        if category in preferences["categories"]:
            reasons.append(
                f"similar {auction.category} items"
            )

        if brand in preferences["brands"]:
            reasons.append(
                f"brand you viewed"
            )

        if condition in preferences["conditions"]:
            reasons.append(
                "similar condition"
            )

        if (
            auction.starting_price is not None
            and preferences["prices"]
        ):
            price_score = calculate_price_score(
                auction.starting_price,
                preferences["prices"]
            )

            if price_score >= 15:
                reasons.append(
                    "similar price range"
                )

        if reasons:
            reason = (
                "Because you viewed "
                + ", ".join(reasons[:2])
            )
        else:
            reason = "Based on your activity"

        # -------------------------------------------------
        # IMAGE
        # -------------------------------------------------

        sorted_images = sorted(
            auction.images or [],
            key=lambda image: (
                image.display_order
                if image.display_order is not None
                else 0
            )
        )

        first_image = (
            sorted_images[0].image_path
            if sorted_images
            else None
        )

        # -------------------------------------------------
        # RESULT
        # -------------------------------------------------

        recommendations.append({
            "id": auction.id,
            "user_id": auction.user_id,

            "product_title": auction.product_title,
            "brand_model": auction.brand_model,
            "category": auction.category,

            "description": auction.description,

            "product_condition":
                auction.product_condition,

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

            "location_city": auction.location_city,
            "location_state": auction.location_state,

            "seller_name": auction.seller_name,

            "image": first_image,

            "score": score,

            "reason": reason
        })

    # =====================================================
    # SORT BY RECOMMENDATION SCORE
    # =====================================================

    recommendations.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    # =====================================================
    # COLD START
    # =====================================================
    #
    # If the user has no views/bids, all scores will be
    # 0. In that case return newest live auctions.
    #
    # =====================================================

    if not preferences["categories"] and not preferences["brands"]:

        return recommendations[:limit]

    return recommendations[:limit]

