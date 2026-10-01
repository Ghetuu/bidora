"""
=====================================================================
AUCTION PRICE PREDICTION ROUTES  (user side)

GET /api/price-prediction
    ?category=mobile&condition=good&purchase_price=80000
    &brand_model=Samsung Galaxy S23&purchase_date=2024-10-01
    -> seller create-auction form: estimate BEFORE the auction exists

GET /api/price-prediction/auction/{auction_id}
    -> bidder / auction details page: estimate for an existing auction
       (never lower than the current highest bid)

POST /api/price-prediction/train
    -> trains the ML price prediction model using completed auctions

Read-only GET routes do not change the database.
The POST training route creates/updates the ML model file.
=====================================================================
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.auth import get_current_user

from app.models.user import User
from app.models.auction import Auction
from app.models.bids import Bid

from app.services.price_prediction_service import (
    estimate_final_price,
    load_comparables,
)

# ============================================================
# ML PRICE PREDICTION SERVICE
# ============================================================

from app.services.ml_price_prediction_service import (
    train_price_prediction_model,
    predict_final_price,
)


router = APIRouter(
    prefix="/api/price-prediction",
    tags=["Price Prediction"]
)


# ============================================================
# TRAIN MACHINE LEARNING MODEL
# ============================================================

@router.post("/train")
def train_price_prediction(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Train the Random Forest price prediction model
    using completed Bidora auctions.

    Training data:
        - Category
        - Condition
        - Purchase price
        - Starting price
        - Auction duration
        - Number of bids
        - Unique bidders
        - Bid frequency

    Target:
        - Final auction price
    """

    try:
        result = train_price_prediction_model(db)

        return {
            "success": True,
            "message": "Price prediction model trained successfully.",
            "training_samples": result["training_samples"],
            "mae": result["mae"],
            "rmse": result["rmse"],
            "r2": result["r2"],
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:
        print("ML TRAINING ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail="Failed to train price prediction model.",
        )


# =====================================================
# BEFORE CREATING AN AUCTION
# =====================================================

@router.get("")
def predict_for_new_auction(
    category: str = Query(..., min_length=1),
    condition: str = Query(..., min_length=1),
    purchase_price: float = Query(..., gt=0),
    brand_model: str = Query(""),
    purchase_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        comps = load_comparables(db, category)

        return estimate_final_price(
            category=category,
            condition=condition,
            purchase_price=purchase_price,
            brand_model=brand_model,
            purchase_date=purchase_date,
            comps=comps,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:
        print("PRICE PREDICTION ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail="Unable to estimate the price right now.",
        )


# =====================================================
# FOR AN EXISTING AUCTION
# =====================================================

@router.get("/auction/{auction_id}")
def predict_for_auction(
    auction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    auction = (
        db.query(Auction)
        .filter(Auction.id == auction_id)
        .first()
    )

    if not auction:
        raise HTTPException(
            status_code=404,
            detail="Auction not found.",
        )

    try:
        current_bid = (
            db.query(func.max(Bid.amount))
            .filter(Bid.auction_id == auction.id)
            .scalar()
        ) or 0

        comps = load_comparables(
            db,
            auction.category,
            exclude_auction_id=auction.id,
        )

        result = estimate_final_price(
            category=auction.category,
            condition=auction.product_condition,
            purchase_price=auction.purchase_price,
            brand_model=auction.brand_model,
            purchase_date=auction.purchase_date,
            comps=comps,
            current_bid=current_bid,
        )

        result["current_bid"] = float(current_bid)
        result["starting_price"] = float(
            auction.starting_price or 0
        )

        return result

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:
        print("PRICE PREDICTION ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail="Unable to estimate the price right now.",
        )


@router.get("")
def predict_for_new_auction(
    category: str = Query(..., min_length=1),
    condition: str = Query(..., min_length=1),
    purchase_price: float = Query(..., gt=0),
    brand_model: str = Query(""),
    purchase_date: Optional[str] = Query(None),
    starting_price: float = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Predict final auction price BEFORE the auction starts.

    Uses the trained Random Forest model.
    """

    try:

        # ----------------------------------------------------
        # TEMPORARY FALLBACK
        #
        # Your current PricePrediction.jsx does not yet send
        # starting_price.
        #
        # Therefore, when it is missing, use 60% of purchase
        # price as a temporary starting-price input.
        #
        # Later we can pass the real Starting Bid from JSX.
        # ----------------------------------------------------

        if starting_price <= 0:
            starting_price = float(
                purchase_price
            ) * 0.60

        result = predict_final_price(
            category=category,

            condition=condition,

            purchase_price=purchase_price,

            starting_price=starting_price,

            brand_model=brand_model,
        )

        # ----------------------------------------------------
        # ADAPT ML RESPONSE TO EXISTING PRICEPREDICTION JSX
        # ----------------------------------------------------

        predicted_price = float(
            result["predicted_price"]
        )

        return {
            "expected_price": predicted_price,

            "low_price": float(
                result["low_price"]
            ),

            "high_price": float(
                result["high_price"]
            ),

            "suggested_start": round(
                predicted_price * 0.40,
                2
            ),

            "confidence": result["confidence"],

            "notes": (
                "This estimate is generated by Bidora's "
                "Random Forest ML model using historical "
                "completed auction data."
            ),

            "model": result["model"],

            "mae": result["mae"],

            "rmse": result["rmse"],

            "r2": result["r2"],

            "training_samples": result[
                "training_samples"
            ],
        }

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:

        print(
            "ML PRICE PREDICTION ERROR:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to predict the auction price right now.",
        )