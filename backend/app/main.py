import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# =========================================================
# MODELS
# =========================================================
# IMPORTANT:
# Import models before starting the application
# so SQLAlchemy knows about all tables.
# =========================================================

from app.models.admin_notification import AdminNotification
from app.models.contact_message import ContactMessage

from app.models import (
    User,
    Auction,
    AuctionImage,
    ContactMessage
)

# =========================================================
# ROUTES
# =========================================================

from app.routes.user_route import (
    router as user_router
)

from app.routes.admin_routes import (
    router as admin_router
)

from app.routes.auction_routes import (
    router as auction_router
)

from app.routes.live_auction_routes import (
    router as live_auction_router
)

from app.routes.websocket_routes import (
    router as websocket_router
)

from app.routes.bid_routes import (
    router as bid_router
)

from app.routes.admin_report_routes import (
    router as admin_report_router
)

from app.routes.admin_trust_routes import (
    router as admin_trust_router
)



# =========================================================
# SERVICES
# =========================================================

from app.services.auction_scheduler import (
    auction_scheduler_loop
)

from app.routes.price_prediction_routes import (
    router as price_prediction_router
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

app.include_router(
    bid_router
)
app.include_router(
    live_auction_router
)

app.include_router(
    admin_report_router,
    tags=["Admin Reports"]
)




app.include_router(price_prediction_router)
app.include_router(
    admin_trust_router,
    tags=["Admin Trust Score"]
)


# =========================================================
# GLOBAL REALTIME WEBSOCKET
# =========================================================

app.include_router(
    websocket_router
)


# =========================================================
# AUTOMATIC AUCTION SCHEDULER
# =========================================================

@app.on_event("startup")
async def start_auction_scheduler():

    asyncio.create_task(
        auction_scheduler_loop()
    )


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "message": "Bidora API is running",
        "realtime": "WebSocket enabled"
    }