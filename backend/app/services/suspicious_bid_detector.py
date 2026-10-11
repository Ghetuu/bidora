from collections import Counter, defaultdict
from datetime import timedelta
from decimal import Decimal


# =========================================================
# SUSPICIOUS BIDDING DETECTION
# =========================================================

RISK_LOW_MAX = 29
RISK_MEDIUM_MAX = 59


def _amount(value):
    """Safely convert a bid amount into Decimal."""
    try:
        return Decimal(str(value))
    except (TypeError, ValueError, ArithmeticError):
        return Decimal("0")


def _risk_level(score):
    if score <= RISK_LOW_MAX:
        return "low"

    if score <= RISK_MEDIUM_MAX:
        return "medium"

    return "high"


def _add_signal(signals, label, points, details):
    signals.append({
        "label": label,
        "points": points,
        "details": details,
    })


def analyze_suspicious_bidding(auction, bids):
    """
    Analyze bidding activity for one auction.

    This is an explainable, rule-based detector.
    It does not automatically prove fraud or manipulation.

    It does not change the database.
    """

    bids = sorted(
        bids,
        key=lambda bid: (
            bid.created_at is None,
            bid.created_at or 0,
            bid.id,
        ),
    )

    signals = []
    bidder_bids = defaultdict(list)

    for bid in bids:
        bidder_bids[bid.user_id].append(bid)

    bid_count = len(bids)
    bidder_count = len(bidder_bids)

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
            "notice": (
                "No bids are available for analysis. "
                "This does not mean the auction is risk-free."
            ),
        }

    # -----------------------------------------------------
    # 1. SELLER SELF-BIDDING
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
    # 2. RAPID BID BURSTS BY ONE BIDDER
    # -----------------------------------------------------

    rapid_bidders = []

    for bidder_id, user_bids in bidder_bids.items():
        valid_bids = [
            bid for bid in user_bids
            if bid.created_at is not None
        ]

        valid_bids.sort(key=lambda bid: bid.created_at)

        rapid_found = False

        for index in range(len(valid_bids) - 2):
            first = valid_bids[index].created_at
            third = valid_bids[index + 2].created_at

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
    # 3. HIGH BIDDING FREQUENCY
    # -----------------------------------------------------

    valid_bids = [
        bid for bid in bids
        if bid.created_at is not None
    ]

    valid_bids.sort(key=lambda bid: bid.created_at)

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
    # 4. ALTERNATING BIDDERS
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
            and window[-1].created_at - window[0].created_at
            <= timedelta(minutes=5)
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
    # 5. UNUSUALLY LARGE BID INCREASES
    # -----------------------------------------------------

    large_increases = []

    for previous, current in zip(bids, bids[1:]):
        previous_amount = _amount(previous.amount)
        current_amount = _amount(current.amount)

        if previous_amount <= 0:
            continue

        increase_percent = (
            (current_amount - previous_amount)
            / previous_amount
        ) * Decimal("100")

        if increase_percent >= Decimal("50"):
            large_increases.append({
                "bid_id": current.id,
                "previous_amount": float(previous_amount),
                "new_amount": float(current_amount),
                "increase_percent": round(
                    float(increase_percent), 2
                ),
            })

    if large_increases:
        _add_signal(
            signals,
            "Large bid increase",
            10,
            (
                f"{len(large_increases)} bid(s) increased the "
                "previous bid by at least 50%."
            ),
        )

    # -----------------------------------------------------
    # 6. BID CONCENTRATION
    # -----------------------------------------------------

    bidder_counts = Counter(
        bid.user_id for bid in bids
    )

    if bid_count >= 6 and bidder_counts:
        top_bidder_id, top_bidder_count = (
            bidder_counts.most_common(1)[0]
        )

        share = top_bidder_count / bid_count

        if bidder_count == 1:
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
    # 7. CALCULATE RISK SCORE
    # -----------------------------------------------------

    # Signals are combined with a cap so repeated similar
    # signals do not make the score grow without limit.
    raw_score = sum(
        signal["points"] for signal in signals
    )

    risk_score = min(100, raw_score)
    risk_level = _risk_level(risk_score)

    # Seller self-bidding is a critical signal that needs
    # manual investigation.
    critical_signal = bool(seller_bids)

    # -----------------------------------------------------
    # 8. IDENTIFY ACCOUNTS REQUIRING REVIEW
    # -----------------------------------------------------

    flagged_bidders = []

    for bidder_id, user_bids in bidder_bids.items():
        reasons = []

        if bidder_id == auction.user_id:
            reasons.append("Seller account placed bids")

        if bidder_id in rapid_bidders:
            reasons.append("Rapid bid burst detected")

        total = len(user_bids)

        if bid_count >= 6 and total / bid_count >= 0.70:
            reasons.append("High share of auction bids")

        if reasons:
            flagged_bidders.append({
                "user_id": bidder_id,
                "bid_count": total,
                "reasons": reasons,
            })

    flagged_bidders.sort(
        key=lambda item: item["bid_count"],
        reverse=True,
    )

    # -----------------------------------------------------
    # RESULT
    # -----------------------------------------------------

    return {
        "auction_id": auction.id,
        "product_title": auction.product_title,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "status": (
            "requires_review"
            if risk_score > RISK_MEDIUM_MAX
            else "signals_detected"
            if signals
            else "no_signals_detected"
        ),
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