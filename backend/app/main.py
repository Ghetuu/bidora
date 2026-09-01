from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# IMPORTANT:
# Import models before starting the application
# so SQLAlchemy knows about all tables.

from app.models import (
    User,
    Auction,
    AuctionImage
)

from app.routes.user_route import (
    router as user_router
)

from app.routes.admin_routes import (
    router as admin_router
)

from app.routes.auction_routes import (
    router as auction_router
)


app = FastAPI(
    title="Bidora API",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(
    user_router,
    tags=["Users"]
)

app.include_router(
    admin_router,
    tags=["Admin"]
)

app.include_router(
    auction_router
)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "message": "Bidora API is running"
    }
