"""
=====================================================================
AUCTION PRICE PREDICTION  (user side)

Estimates the expected FINAL price of an auction.

How it works
------------
1. Rule-based baseline
      expected = purchase_price x condition_retention x age_factor
   (works from day one, even with no auction history)

2. Learned from your own data
      Looks at ENDED auctions that received bids, in the same category.
      final_price = highest bid.  ratio = final_price / purchase_price.
      Similar auctions (same condition, matching brand/model words)
      count more.  The weighted median ratio is blended with the
      baseline: the more similar auctions exist, the more it is trusted.

Output always includes "notes" so the user can see WHY.
Read-only: nothing here changes the database.
=====================================================================
"""

from datetime import date, datetime
import re


# ---------------------------------------------------------------
# TUNING KNOBS  (adjust these once you see real results)
# ---------------------------------------------------------------

MIN_COMPS = 5            # fewer similar auctions than this -> rules only
FULL_TRUST_COMPS = 20    # this many (weighted by category) -> mostly data
START_FRACTION = 0.40    # suggested starting bid = 40% of expected price

# share of the purchase price a product typically sells for, by condition
CONDITION_RETENTION = {
    "new": 0.85,
    "like-new": 0.75,
    "excellent": 0.65,
    "good": 0.55,
    "fair": 0.42,
    "used": 0.50,
}
DEFAULT_RETENTION = 0.55

# value lost per year of age, by category
CATEGORY_YEARLY_DROP = {
    "mobile": 0.20,
    "laptop": 0.18,
    "electronics": 0.15,
    "vehicles": 0.10,
    "fashion": 0.20,
    "furniture": 0.12,
    "books": 0.15,
    "collectibles": 0.0,
    "other": 0.12,
}
DEFAULT_YEARLY_DROP = 0.12
MAX_AGE_FACTOR_YEARS = 10

RULE_SPREAD = 0.20           # +/-20% range for the rule-based estimate
MIN_RATIO, MAX_RATIO = 0.03, 1.5


# ---------------------------------------------------------------
# SMALL HELPERS
# ---------------------------------------------------------------

def _f(value):
    try:
        return float(value) if value is not None else 0.0
    except (TypeError, ValueError):
        return 0.0


def _key(text):
    """'Like New' / 'like_new' / 'like-new' -> 'like-new'"""
    return re.sub(r"[\s_]+", "-", str(text or "").strip().lower())


def _tokens(text):
    return set(re.findall(r"[a-z0-9]{2,}", str(text or "").lower()))


def _round_price(value):
    if value < 1000:
        step = 10
    elif value < 100000:
        step = 100
    else:
        step = 500
    return int(round(value / step) * step)


def _parse_date(value):
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    text = str(value).strip()[:10]
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def _weighted_quantile(pairs, q):
    """pairs = [(value, weight), ...]"""
    pairs = sorted(pairs)
    total = sum(w for _, w in pairs)
    target = q * total
    running = 0.0
    for value, weight in pairs:
        running += weight
        if running >= target:
            return value
    return pairs[-1][0]


def _clamp_ratio(r):
    return max(MIN_RATIO, min(MAX_RATIO, r))


# ---------------------------------------------------------------
# 1. RULE-BASED BASELINE
# ---------------------------------------------------------------

def rule_based_ratio(category, condition, purchase_date, today=None):
    today = today or date.today()
    cond = _key(condition)
    cat = _key(category)

    retention = CONDITION_RETENTION.get(cond, DEFAULT_RETENTION)
    drop = CATEGORY_YEARLY_DROP.get(cat, DEFAULT_YEARLY_DROP)

    age_years = 0.0
    pdate = _parse_date(purchase_date)
    if pdate:
        age_years = max(0.0, (today - pdate).days / 365.25)
        age_years = min(age_years, MAX_AGE_FACTOR_YEARS)

    age_factor = (1 - drop) ** age_years
    return _clamp_ratio(retention * age_factor), retention, age_years, drop


# ---------------------------------------------------------------
# 2. LEARN FROM ENDED AUCTIONS
# ---------------------------------------------------------------

def _comparable_weights(comps, category, condition, brand_model):
    """
    comps: list of dicts {category, condition, brand_model,
                          purchase_price, final_price}
    Returns (ratio, weight, same_condition, brand_match) per usable comp.
    """
    cat = _key(category)
    cond = _key(condition)
    wanted = _tokens(brand_model)

    out = []
    for c in comps:
        if _key(c["category"]) != cat:
            continue
        purchase = _f(c["purchase_price"])
        final = _f(c["final_price"])
        if purchase <= 0 or final <= 0:
            continue

        ratio = final / purchase
        weight = 1.0

        same_cond = _key(c["condition"]) == cond
        if same_cond:
            weight += 1.5

        brand_match = False
        if wanted:
            theirs = _tokens(c["brand_model"])
            overlap = len(wanted & theirs) / len(wanted)
            if overlap > 0:
                brand_match = True
                weight += 2.0 * overlap

        out.append((ratio, weight, same_cond, brand_match))
    return out


# ---------------------------------------------------------------
# PUBLIC FUNCTION
# ---------------------------------------------------------------

def estimate_final_price(
    category,
    condition,
    purchase_price,
    brand_model="",
    purchase_date=None,
    comps=None,
    current_bid=0,
    today=None,
):
    purchase_price = _f(purchase_price)
    if purchase_price <= 0:
        raise ValueError("purchase_price must be greater than zero")

    notes = []

    # ---- baseline ---------------------------------------------
    rule_ratio, retention, age_years, drop = rule_based_ratio(
        category, condition, purchase_date, today
    )
    rule_low = _clamp_ratio(rule_ratio * (1 - RULE_SPREAD))
    rule_high = _clamp_ratio(rule_ratio * (1 + RULE_SPREAD))

    notes.append({
        "label": f"Typical resale for '{condition}' condition is about "
                 f"{round(retention * 100)}% of purchase price",
        "type": "info",
    })
    if age_years >= 0.1 and drop > 0:
        notes.append({
            "label": f"Product is about {age_years:.1f} years old "
                     f"(this category loses ~{round(drop * 100)}% value a year)",
            "type": "risk",
        })

    # ---- learn from history -----------------------------------
    usable = _comparable_weights(comps or [], category, condition, brand_model)
    n = len(usable)
    n_same_cond = sum(1 for u in usable if u[2])
    n_brand = sum(1 for u in usable if u[3])

    if n >= MIN_COMPS:
        pairs = [(r, w) for r, w, _, _ in usable]
        data_ratio = _weighted_quantile(pairs, 0.5)
        data_low = _weighted_quantile(pairs, 0.25)
        data_high = _weighted_quantile(pairs, 0.75)

        trust = min(n / FULL_TRUST_COMPS, 1.0)
        ratio = trust * data_ratio + (1 - trust) * rule_ratio
        low = trust * data_low + (1 - trust) * rule_low
        high = trust * data_high + (1 - trust) * rule_high

        method = "similar_auctions" if trust >= 1.0 else "blended"
        confidence = "high" if n >= FULL_TRUST_COMPS else "medium"

        notes.insert(0, {
            "label": f"Based on {n} completed auctions in this category"
                     + (f" ({n_same_cond} with the same condition)" if n_same_cond else "")
                     + (f", {n_brand} with a matching brand/model" if n_brand else ""),
            "type": "trust",
        })
    else:
        ratio, low, high = rule_ratio, rule_low, rule_high
        method = "rules"
        confidence = "low"
        notes.insert(0, {
            "label": f"Only {n} similar completed auction(s) so far, "
                     f"so this is a rule-based estimate",
            "type": "info",
        })

    ratio, low, high = _clamp_ratio(ratio), _clamp_ratio(low), _clamp_ratio(high)
    if low > ratio:
        low = ratio
    if high < ratio:
        high = ratio

    expected = purchase_price * ratio
    low_p = purchase_price * low
    high_p = purchase_price * high

    # ---- a live auction can never finish below its current bid --
    current_bid = _f(current_bid)
    if current_bid > 0:
        if current_bid > expected:
            notes.append({
                "label": "Current highest bid is already above the estimate",
                "type": "trust",
            })
            expected = current_bid * 1.05
            high_p = max(high_p, expected * 1.15)
        low_p = max(low_p, current_bid)
        expected = max(expected, low_p)
        high_p = max(high_p, expected)

    return {
        "expected_price": _round_price(expected),
        "low_price": _round_price(low_p),
        "high_price": _round_price(high_p),
        "suggested_start": _round_price(expected * START_FRACTION),
        "confidence": confidence,
        "method": method,
        "sample_size": n,
        "ratio": round(ratio, 3),
        "notes": notes,
    }


# ---------------------------------------------------------------
# DATABASE LOADER
# ---------------------------------------------------------------

def load_comparables(db, category, exclude_auction_id=None, limit=500):
    """
    Ended auctions in the category that received at least one bid.
    final price = highest bid (there is no final_price column).
    Auctions that ended with no bids are unsold and are ignored.
    """
    # imported here so the pure logic above can be tested without a DB
    from sqlalchemy import func
    from app.models.auction import Auction
    from app.models.bids import Bid

    cols = (
        Auction.id,
        Auction.category,
        Auction.product_condition,
        Auction.brand_model,
        Auction.purchase_price,
    )

    query = (
        db.query(*cols, func.max(Bid.amount).label("final_price"))
        .join(Bid, Bid.auction_id == Auction.id)
        .filter(
            Auction.status == "ended",
            func.lower(Auction.category) == _key(category),
            Auction.purchase_price > 0,
        )
    )
    if exclude_auction_id is not None:
        query = query.filter(Auction.id != exclude_auction_id)

    rows = (
        query.group_by(*cols)
        .order_by(Auction.id.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "category": r.category,
            "condition": r.product_condition,
            "brand_model": r.brand_model,
            "purchase_price": r.purchase_price,
            "final_price": r.final_price,
        }
        for r in rows
    ]
