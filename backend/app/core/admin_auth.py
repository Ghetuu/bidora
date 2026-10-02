from datetime import datetime, timedelta, timezone

import jwt

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


# =========================================================
# JWT CONFIGURATION
# =========================================================

SECRET_KEY = "588ee73afae1d68c45dad1979650b261c1320e5f01d0b0e5bbe0bc23bce7ab13"
ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


security = HTTPBearer()


# =========================================================
# CREATE ADMIN TOKEN
# =========================================================

def create_admin_token():

    expire = (
        datetime.now(timezone.utc)
        + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    payload = {
        "sub": "admin",
        "role": "admin",
        "exp": expire
    }

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token


# =========================================================
# VERIFY ADMIN TOKEN
# =========================================================

def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    print("\n================ ADMIN AUTH DEBUG ================")
    print("TOKEN RECEIVED:", token)

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        print("JWT PAYLOAD:", payload)

        username = payload.get("sub")
        role = payload.get("role")

        print("USERNAME:", username)
        print("ROLE:", role)

        if username != "admin" or role != "admin":
            print("❌ ADMIN ROLE CHECK FAILED")

            raise HTTPException(
                status_code=403,
                detail="Admin access required."
            )

        print("✅ ADMIN AUTH SUCCESS")
        print("=================================================\n")

        return {
            "username": username,
            "role": role
        }

    except jwt.ExpiredSignatureError:
        print("❌ TOKEN EXPIRED")

        raise HTTPException(
            status_code=401,
            detail="Admin session expired. Please login again."
        )

    except jwt.InvalidTokenError as e:
        print("❌ INVALID TOKEN:", str(e))

        raise HTTPException(
            status_code=401,
            detail="Invalid admin authentication token."
        )