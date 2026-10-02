from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database import get_db
from app.core.auth import get_current_user

from app.models.user import User

from app.schemas.aurora import (
    AuroraChatRequest
)

from app.services.aurora_service import (
    process_aurora_message
)


router = APIRouter(
    prefix="/api/aurora",
    tags=["Aurora AI"]
)


# =========================================================
# AURORA CHAT
# =========================================================

@router.post("/chat")
def aurora_chat(
    request: AuroraChatRequest,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(get_db)
):

    try:

        result = process_aurora_message(
            db=db,
            current_user=current_user,
            message=request.message
        )

        return result

    except Exception as e:

        db.rollback()

        print(
            "AURORA CHAT ERROR:",
            str(e)
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Aurora could not process "
                "your request."
            )
        )