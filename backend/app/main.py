from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.user_route import router as user_router
from app.routes.admin_routes import router as admin_router


app = FastAPI()


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ==========================================
# ROUTERS
# ==========================================

app.include_router(
    user_router,
    tags=["Users"]
)

app.include_router(
    admin_router,
    tags=["Admin"]
)


# ==========================================
# ROOT
# ==========================================

@app.get("/")
def root():

    return {
        "message": "Bidora API is running"
    }