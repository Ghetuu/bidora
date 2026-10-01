from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database import get_db
from app.core.auth import get_current_user

from app.models.user import User
from app.models.auction import Auction
from app.models.auction_view import AuctionView

from app.services.recommendation_service import (
    get_recommendations
)


router = APIRouter(
    prefix="/api/recommendations",
    tags=["Recommendations"]
)


# =========================================================
# RECORD AUCTION VIEW
# =========================================================
#
# Called when a logged-in buyer opens an auction.
#
# POST:
# /api/recommendations/view/{auction_id}
#
# =========================================================

@router.post("/view/{auction_id}")
def record_auction_view(
    auction_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db)
):

    try:

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

        if auction is None:

            raise HTTPException(
                status_code=404,
                detail="Auction not found."
            )

        # =================================================
        # DON'T RECORD SELLER VIEWING THEIR OWN AUCTION
        # =================================================

        if auction.user_id == current_user.id:

            return {
                "success": True,
                "message": "Own auction view not recorded."
            }

        # =================================================
        # RECORD VIEW
        # =================================================
        #
        # We allow multiple views.
        #
        # This is useful because repeatedly viewing a
        # product is a stronger indication of interest.
        #
        # =================================================

        auction_view = AuctionView(
            user_id=current_user.id,
            auction_id=auction.id
        )

        db.add(auction_view)

        db.commit()

        return {
            "success": True,
            "message": "Auction view recorded.",
            "auction_id": auction.id
        }

    except HTTPException:
        raise

    except Exception as e:

        db.rollback()

        print(
            "RECORD AUCTION VIEW ERROR:",
            str(e)
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to record auction view."
        )


# =========================================================
# GET PERSONALIZED RECOMMENDATIONS
# =========================================================
#
# GET:
# /api/recommendations
#
# =========================================================

@router.get("")
def get_personalized_recommendations(
    limit: int = 6,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db)
):

    try:

        # Keep limit within a safe range.
        if limit < 1:
            limit = 1

        if limit > 20:
            limit = 20

        recommendations = get_recommendations(
            db=db,
            user_id=current_user.id,
            limit=limit
        )

        return {
            "success": True,
            "count": len(recommendations),
            "recommendations": recommendations
        }

    except Exception as e:

        print(
            "RECOMMENDATION ERROR:",
            str(e)
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to generate recommendations."
        )
