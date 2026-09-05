from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# IMPORTANT:
# Import models before starting the application
# so SQLAlchemy knows about all tables.
from app.models.admin_notification import AdminNotification
from app.models.contact_message import ContactMessage
from app.routes.live_auction_routes import router as live_auction_router

from app.models import (
    User,
    Auction,
    AuctionImage,
    ContactMessage
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
# STATIC FILES
# =========================================================
# Makes uploaded auction images/documents accessible
#
# Example:
# http://127.0.0.1:8000/uploads/auctions/image.jpg
# =========================================================

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
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

app.include_router(live_auction_router)

# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "message": "Bidora API is running"
    }