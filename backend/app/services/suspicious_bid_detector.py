from collections import Counter, defaultdict
from datetime import timedelta
from decimal import Decimal, InvalidOperation


# =========================================================
# SUSPICIOUS BIDDING DETECTION CONFIGURATION
# =========================================================

RISK_LOW_MAX = 29
RISK_MEDIUM_MAX = 59

# A bid exceeding this multiple of the reference price
# triggers an unusually high bid signal.
HIGH_BID_MULTIPLIER = Decimal("3")

# An increase of at least 50% triggers a large-increase signal.
LARGE_INCREASE_PERCENT = Decimal("50")

# An increase of at least 200% triggers an extreme-increase signal.
EXTREME_INCREASE_PERCENT = Decimal("200")

# A high-value bid is evaluated against both prices when available.
# The higher reference price is used to avoid overreacting to
# a bid that is high relative to the starting price alone.


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def _amount(value):
    """Safely convert a value to Decimal."""
    try:
        if value is None:
            return Decimal("0")

        result = Decimal(str(value))

        if not result.is_finite():
            return Decimal("0")

        return result

    except (TypeError, ValueError, InvalidOperation):
        return Decimal("0")


def _risk_level(score):
    """Map the calculated risk score to a risk category."""
    if score <= RISK_LOW_MAX:
        return "low"

    if score <= RISK_MEDIUM_MAX:
        return "medium"

    return "high"


def _add_signal(signals, label, points, details):
    """Add an explainable risk signal."""
    signals.append({
        "label": label,
        "points": points,
        "details": details,
    })


def _money(value):
    """Format a Decimal amount for signal descriptions."""
    return f"₹{value:,.2f}"


# =========================================================
# MAIN SUSPICIOUS BIDDING ANALYSIS
# =========================================================

def analyze_suspicious_bidding(auction, bids):
    """
    Analyze one auction's bidding history.

    Detection includes:
    - Seller self-bidding
    - Rapid bid bursts
    - Unusually high bidding frequency
    - Alternating bidder patterns
    - Large bid increases
    - Extreme bid increases
    - Bids unusually high relative to reference prices
    - Bid concentration

    This is a rule-based review tool, not proof of fraud.

    It does not modify auction records or block users.
    """

    # -----------------------------------------------------
    # 1. SORT BIDS CHRONOLOGICALLY
    # -----------------------------------------------------

    bids = sorted(
        bids,
        key=lambda bid: (
            bid.created_at is None,
            bid.created_at.timestamp()
            if bid.created_at is not None
            else 0,
            bid.id,
        ),
    )

    signals = []
    bidder_bids = defaultdict(list)

    for bid in bids:
        bidder_bids[bid.user_id].append(bid)

    bid_count = len(bids)
    bidder_count = len(bidder_bids)

    # -----------------------------------------------------
    # 2. HANDLE AUCTIONS WITHOUT BIDS
    # -----------------------------------------------------

    if bid_count == 0:
        return {
            "auction_id": auction.id,
            "product_title": auction.product_title,
            "risk_score": 0,
            "risk_level": "low",
            "status": "insufficient_data",
            "bid_count": 0,
            "bidder_count": 0,
            "flagged_bidders": [],
            "signals": [],
            "critical_signal": False,
            "notice": (
                "No bids are available for analysis. "
                "This does not mean the auction is risk-free."
            ),
        }

    # -----------------------------------------------------
    # 3. SELLER SELF-BIDDING
    # -----------------------------------------------------

    seller_bids = [
        bid for bid in bids
        if bid.user_id == auction.user_id
    ]

    if seller_bids:
        _add_signal(
            signals,
            "Seller self-bidding",
            60,
            (
                f"The seller's account placed "
                f"{len(seller_bids)} bid(s) on this auction."
            ),
        )

    # -----------------------------------------------------
    # 4. RAPID BID BURSTS BY ONE BIDDER
    # -----------------------------------------------------

    rapid_bidders = []

    for bidder_id, user_bids in bidder_bids.items():
        valid_user_bids = sorted(
            [
                bid for bid in user_bids
                if bid.created_at is not None
            ],
            key=lambda bid: (bid.created_at, bid.id),
        )

        rapid_found = False

        for index in range(len(valid_user_bids) - 2):
            first = valid_user_bids[index].created_at
            third = valid_user_bids[index + 2].created_at

            if third - first <= timedelta(seconds=10):
                rapid_found = True
                break

        if rapid_found:
            rapid_bidders.append(bidder_id)

    if rapid_bidders:
        _add_signal(
            signals,
            "Rapid bid burst",
            20,
            (
                f"{len(rapid_bidders)} bidder account(s) placed "
                "at least three bids within a 10-second window."
            ),
        )

    # -----------------------------------------------------
    # 5. HIGH BIDDING FREQUENCY
    # -----------------------------------------------------

    valid_bids = sorted(
        [
            bid for bid in bids
            if bid.created_at is not None
        ],
        key=lambda bid: (bid.created_at, bid.id),
    )

    frequent_window = False

    for index in range(len(valid_bids) - 4):
        first = valid_bids[index].created_at
        fifth = valid_bids[index + 4].created_at

        if fifth - first <= timedelta(seconds=60):
            frequent_window = True
            break

    if frequent_window:
        _add_signal(
            signals,
            "Unusually high bidding frequency",
            15,
            "At least five bids occurred within a 60-second window.",
        )

    # -----------------------------------------------------
    # 6. ALTERNATING BIDDERS
    # -----------------------------------------------------

    alternating_found = False

    for index in range(len(valid_bids) - 3):
        window = valid_bids[index:index + 4]

        bidder_sequence = [
            bid.user_id for bid in window
        ]

        a, b, c, d = bidder_sequence

        if (
            a != b
            and a == c
            and b == d
            and (
                window[-1].created_at
                - window[0].created_at
            ) <= timedelta(minutes=5)
        ):
            alternating_found = True
            break

    if alternating_found:
        _add_signal(
            signals,
            "Alternating bidder pattern",
            20,
            (
                "Two different bidder accounts alternated "
                "four consecutive bids within five minutes."
            ),
        )

    # -----------------------------------------------------
    # 7. REFERENCE PRICE CALCULATION
    # -----------------------------------------------------

    starting_price = _amount(
        getattr(auction, "starting_price", None)
    )

    purchase_price = _amount(
        getattr(auction, "purchase_price", None)
    )

    # Use the higher available reference price.
    # This reduces false positives when the starting price
    # is much lower than the purchase price.

    valid_reference_prices = [
        price
        for price in (starting_price, purchase_price)
        if price > 0
    ]

    reference_price = (
        max(valid_reference_prices)
        if valid_reference_prices
        else Decimal("0")
    )

    # -----------------------------------------------------
    # 8. UNUSUALLY HIGH BID AMOUNT
    # -----------------------------------------------------

    high_value_bids = []

    if reference_price > 0:
        for bid in bids:
            current_amount = _amount(bid.amount)

            if current_amount <= 0:
                continue

            ratio = current_amount / reference_price

            if ratio >= HIGH_BID_MULTIPLIER:
                high_value_bids.append({
                    "bid_id": bid.id,
                    "user_id": bid.user_id,
                    "amount": current_amount,
                    "reference_price": reference_price,
                    "ratio": ratio,
                })

    if high_value_bids:
        highest_flagged_bid = max(
            high_value_bids,
            key=lambda item: item["amount"],
        )

        ratio = highest_flagged_bid["ratio"]

        _add_signal(
            signals,
            "Unusually high bid amount",
            40,
            (
                f"Bid #{highest_flagged_bid['bid_id']} was "
                f"{ratio:.2f}x the reference price. "
                f"Bid: {_money(highest_flagged_bid['amount'])}; "
                f"reference price: "
                f"{_money(highest_flagged_bid['reference_price'])}. "
                "This may warrant manual review."
            ),
        )

    # -----------------------------------------------------
    # 9. LARGE AND EXTREME BID INCREASES
    # -----------------------------------------------------

    large_increases = []
    extreme_increases = []

    for previous, current in zip(bids, bids[1:]):
        previous_amount = _amount(previous.amount)
        current_amount = _amount(current.amount)

        if previous_amount <= 0:
            continue

        increase_percent = (
            (current_amount - previous_amount)
            / previous_amount
        ) * Decimal("100")

        if increase_percent >= LARGE_INCREASE_PERCENT:
            large_increases.append({
                "bid_id": current.id,
                "user_id": current.user_id,
                "previous_amount": previous_amount,
                "new_amount": current_amount,
                "increase_percent": increase_percent,
            })

        if increase_percent >= EXTREME_INCREASE_PERCENT:
            extreme_increases.append({
                "bid_id": current.id,
                "user_id": current.user_id,
                "previous_amount": previous_amount,
                "new_amount": current_amount,
                "increase_percent": increase_percent,
            })

    if large_increases:
        largest_increase = max(
            large_increases,
            key=lambda item: item["increase_percent"],
        )

        _add_signal(
            signals,
            "Large bid increase",
            10,
            (
                f"{len(large_increases)} bid(s) increased the "
                "previous bid by at least 50%. "
                f"Largest increase: "
                f"{largest_increase['increase_percent']:.2f}% "
                f"from {_money(largest_increase['previous_amount'])} "
                f"to {_money(largest_increase['new_amount'])}."
            ),
        )

    if extreme_increases:
        largest_extreme = max(
            extreme_increases,
            key=lambda item: item["increase_percent"],
        )

        _add_signal(
            signals,
            "Extreme bid increase",
            20,
            (
                f"{len(extreme_increases)} bid(s) increased the "
                "previous bid by at least 200%. "
                f"Largest increase: "
                f"{largest_extreme['increase_percent']:.2f}%."
            ),
        )

    # -----------------------------------------------------
    # 10. BID CONCENTRATION
    # -----------------------------------------------------

    bidder_counts = Counter(
        bid.user_id for bid in bids
    )

    concentrated_bidders = []

    if bid_count >= 6 and bidder_counts:
        top_bidder_id, top_bidder_count = (
            bidder_counts.most_common(1)[0]
        )

        share = top_bidder_count / bid_count

        if bidder_count == 1:
            concentrated_bidders.append(top_bidder_id)

            _add_signal(
                signals,
                "Single-bidder concentration",
                10,
                (
                    f"All {bid_count} bids came from one "
                    "bidder account."
                ),
            )

        elif share >= 0.70:
            concentrated_bidders.append(top_bidder_id)

            _add_signal(
                signals,
                "High bidder concentration",
                10,
                (
                    f"One bidder placed "
                    f"{round(share * 100)}% of all bids."
                ),
            )

    # -----------------------------------------------------
    # 11. CALCULATE RISK SCORE
    # -----------------------------------------------------

    raw_score = sum(
        signal["points"]
        for signal in signals
    )

    risk_score = min(100, raw_score)
    risk_level = _risk_level(risk_score)

    # Seller self-bidding remains the critical signal.
    critical_signal = bool(seller_bids)

    # -----------------------------------------------------
    # 12. IDENTIFY ACCOUNTS REQUIRING REVIEW
    # -----------------------------------------------------

    flagged_bidders = []

    high_value_bidder_ids = {
        item["user_id"]
        for item in high_value_bids
    }

    extreme_increase_bidder_ids = {
        item["user_id"]
        for item in extreme_increases
    }

    for bidder_id, user_bids in bidder_bids.items():
        reasons = []

        if bidder_id == auction.user_id:
            reasons.append("Seller account placed bids")

        if bidder_id in rapid_bidders:
            reasons.append("Rapid bid burst detected")

        if bidder_id in high_value_bidder_ids:
            reasons.append("Unusually high bid amount")

        if bidder_id in extreme_increase_bidder_ids:
            reasons.append("Extreme bid increase")

        if bidder_id in concentrated_bidders:
            reasons.append("High share of auction bids")

        if reasons:
            flagged_bidders.append({
                "user_id": bidder_id,
                "bid_count": len(user_bids),
                "reasons": reasons,
            })

    flagged_bidders.sort(
        key=lambda item: item["bid_count"],
        reverse=True,
    )

    # -----------------------------------------------------
    # 13. FINAL REPORT
    # -----------------------------------------------------

    if risk_score > RISK_MEDIUM_MAX:
        report_status = "requires_review"
    elif signals:
        report_status = "signals_detected"
    else:
        report_status = "no_signals_detected"

    return {
        "auction_id": auction.id,
        "product_title": auction.product_title,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "status": report_status,
        "critical_signal": critical_signal,
        "bid_count": bid_count,
        "bidder_count": bidder_count,
        "flagged_bidders": flagged_bidders,
        "signals": signals,
        "notice": (
            "Risk indicators require human review. "
            "They are not proof of manipulation."
        ),
    }