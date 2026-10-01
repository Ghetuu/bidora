"""
=============================================================
BIDORA - ML FINAL AUCTION PRICE PREDICTION
=============================================================

Random Forest model for PRE-AUCTION price prediction.

The seller does not have bids yet, so the Create Auction
prediction uses only information available before the auction:

    - category
    - condition
    - purchase price
    - starting price
    - brand / model

Target:

    final_price = highest bid of an ended auction

NOTE:
This is currently configured for temporary testing with
a minimum of 3 completed auctions.

For the final MSc project, use substantially more historical
completed auctions.
=============================================================
"""

import os
import pickle
from datetime import datetime

import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


# ============================================================
# MODEL LOCATION
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "ml_models"
)

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "bidora_pre_auction_price_model.pkl"
)


# ============================================================
# FEATURES
# ============================================================

FEATURE_COLUMNS = [
    "category",
    "condition",
    "brand_model",
    "purchase_price",
    "starting_price",
]


TARGET_COLUMN = "final_price"


# ============================================================
# CREATE TRAINING DATA
# ============================================================

def create_training_dataframe(db):
    """
    Creates the training dataset from completed auctions.

    Each ended auction with at least one bid becomes one
    training record.

    IMPORTANT:
    Bid count and bidder information are NOT used as
    prediction features because they are unavailable when
    the seller creates a new auction.
    """

    from sqlalchemy import func

    from app.models.auction import Auction
    from app.models.bids import Bid

    rows = (
        db.query(
            Auction.id,
            Auction.category,
            Auction.product_condition,
            Auction.brand_model,
            Auction.purchase_price,
            Auction.starting_price,
            func.max(Bid.amount).label("final_price"),
        )
        .join(
            Bid,
            Bid.auction_id == Auction.id
        )
        .filter(
            Auction.status == "ended",
            Auction.purchase_price > 0,
        )
        .group_by(
            Auction.id,
            Auction.category,
            Auction.product_condition,
            Auction.brand_model,
            Auction.purchase_price,
            Auction.starting_price,
        )
        .all()
    )

    data = []

    for row in rows:

        if not row.final_price:
            continue

        data.append({
            "category": str(
                row.category or "other"
            ).strip().lower(),

            "condition": str(
                row.product_condition or "used"
            ).strip().lower(),

            "brand_model": str(
                row.brand_model or "unknown"
            ).strip().lower(),

            "purchase_price": float(
                row.purchase_price or 0
            ),

            "starting_price": float(
                row.starting_price or 0
            ),

            "final_price": float(
                row.final_price
            ),
        })

    return pd.DataFrame(data)


# ============================================================
# TRAIN MODEL
# ============================================================

def train_price_prediction_model(db):

    df = create_training_dataframe(db)

    if df.empty:
        raise ValueError(
            "No completed auctions with bids are available "
            "for ML training."
        )

    # Temporary testing requirement
    if len(df) < 3:
        raise ValueError(
            f"Only {len(df)} completed auctions with bids "
            "are available. At least 3 are required "
            "for temporary ML testing."
        )

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    # --------------------------------------------------------
    # CATEGORICAL FEATURES
    # --------------------------------------------------------

    categorical_features = [
        "category",
        "condition",
        "brand_model",
    ]

    # --------------------------------------------------------
    # NUMERIC FEATURES
    # --------------------------------------------------------

    numeric_features = [
        "purchase_price",
        "starting_price",
    ]

    # --------------------------------------------------------
    # PREPROCESSOR
    # --------------------------------------------------------

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "categorical",
                OneHotEncoder(
                    handle_unknown="ignore"
                ),
                categorical_features,
            ),
            (
                "numeric",
                "passthrough",
                numeric_features,
            ),
        ]
    )

    # --------------------------------------------------------
    # RANDOM FOREST
    # --------------------------------------------------------

    model = RandomForestRegressor(
        n_estimators=300,
        random_state=42,
        max_depth=None,
        min_samples_split=2,
        min_samples_leaf=1,
        n_jobs=-1,
    )

    pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                preprocessor
            ),
            (
                "model",
                model
            ),
        ]
    )

    # --------------------------------------------------------
    # TRAIN / TEST SPLIT
    # --------------------------------------------------------

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=1,
        random_state=42,
    )

    pipeline.fit(
        X_train,
        y_train
    )

    # --------------------------------------------------------
    # PREDICTION
    # --------------------------------------------------------

    predictions = pipeline.predict(
        X_test
    )

    # --------------------------------------------------------
    # METRICS
    # --------------------------------------------------------

    mae = mean_absolute_error(
        y_test,
        predictions
    )

    rmse = mean_squared_error(
        y_test,
        predictions
    ) ** 0.5

    # Only one test record currently exists.
    # R² is not meaningful with one test sample.
    if len(y_test) < 2:
        r2 = 0.0
    else:
        r2 = r2_score(
            y_test,
            predictions
        )

    # --------------------------------------------------------
    # SAVE MODEL
    # --------------------------------------------------------

    os.makedirs(
        MODEL_DIR,
        exist_ok=True
    )

    model_data = {
        "model": pipeline,

        "features": FEATURE_COLUMNS,

        "trained_at": datetime.utcnow().isoformat(),

        "training_samples": len(df),

        "mae": float(mae),

        "rmse": float(rmse),

        "r2": float(r2),
    }

    with open(
        MODEL_PATH,
        "wb"
    ) as file:

        pickle.dump(
            model_data,
            file
        )

    return {
        "success": True,

        "training_samples": len(df),

        "mae": round(
            float(mae),
            2
        ),

        "rmse": round(
            float(rmse),
            2
        ),

        "r2": round(
            float(r2),
            4
        ),

        "model_path": MODEL_PATH,
    }


# ============================================================
# LOAD MODEL
# ============================================================

def load_price_prediction_model():

    if not os.path.exists(
        MODEL_PATH
    ):
        return None

    with open(
        MODEL_PATH,
        "rb"
    ) as file:

        return pickle.load(file)


# ============================================================
# PREDICT FINAL PRICE
# ============================================================

def predict_final_price(
    category,
    condition,
    purchase_price,
    starting_price,
    brand_model="",
):
    """
    Predict final auction price BEFORE the auction starts.

    Only seller-known information is used.
    """

    model_data = load_price_prediction_model()

    if not model_data:
        raise ValueError(
            "Price prediction model has not been trained yet."
        )

    input_data = pd.DataFrame([
        {
            "category": str(
                category or "other"
            ).strip().lower(),

            "condition": str(
                condition or "used"
            ).strip().lower(),

            "brand_model": str(
                brand_model or "unknown"
            ).strip().lower(),

            "purchase_price": float(
                purchase_price
            ),

            "starting_price": float(
                starting_price
            ),
        }
    ])

    prediction = model_data["model"].predict(
        input_data
    )[0]

    prediction = max(
        float(prediction),
        float(starting_price)
    )

    # --------------------------------------------------------
    # ESTIMATED RANGE
    # --------------------------------------------------------

    mae = float(
        model_data.get(
            "mae",
            0
        )
    )

    low_price = max(
        float(starting_price),
        prediction - mae
    )

    high_price = (
        prediction + mae
    )

    # --------------------------------------------------------
    # CONFIDENCE
    # --------------------------------------------------------

    training_samples = int(
        model_data.get(
            "training_samples",
            0
        )
    )

    if training_samples < 10:
        confidence = "Low confidence"
    elif training_samples < 30:
        confidence = "Medium confidence"
    else:
        confidence = "High confidence"

    return {
        "predicted_price": round(
            prediction,
            2
        ),

        "low_price": round(
            low_price,
            2
        ),

        "high_price": round(
            high_price,
            2
        ),

        "model": "Random Forest",

        "confidence": confidence,

        "mae": round(
            mae,
            2
        ),

        "rmse": round(
            float(
                model_data.get(
                    "rmse",
                    0
                )
            ),
            2
        ),

        "r2": round(
            float(
                model_data.get(
                    "r2",
                    0
                )
            ),
            4
        ),

        "training_samples": training_samples,
    }