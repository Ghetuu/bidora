
from pathlib import Path
from uuid import uuid4

from fastapi import (
    UploadFile,
    HTTPException
)


# =========================================================
# UPLOAD DIRECTORIES
# =========================================================

BASE_UPLOAD_DIR = Path("uploads")

AUCTION_IMAGE_DIR = (
    BASE_UPLOAD_DIR / "auctions"
)

PURCHASE_PROOF_DIR = (
    BASE_UPLOAD_DIR / "purchase_proofs"
)

SELLER_PROOF_DIR = (
    BASE_UPLOAD_DIR / "seller_proofs"
)


# =========================================================
# ALLOWED FILE TYPES
# =========================================================

ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

ALLOWED_PROOF_TYPES = {
    "image/jpeg",
    "image/png",
    "application/pdf",
}


# =========================================================
# FILE SIZE LIMITS
# =========================================================

MAX_IMAGE_SIZE = 5 * 1024 * 1024

MAX_PROOF_SIZE = 10 * 1024 * 1024


# =========================================================
# CREATE DIRECTORIES
# =========================================================

def create_directories():

    AUCTION_IMAGE_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    PURCHASE_PROOF_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    SELLER_PROOF_DIR.mkdir(
        parents=True,
        exist_ok=True
    )


# =========================================================
# SAVE UPLOAD
# =========================================================

async def save_upload(
    file: UploadFile,
    directory: Path,
    allowed_types: set,
    max_size: int
):

    if not file:
        raise HTTPException(
            status_code=400,
            detail="File is required"
        )

    if file.content_type not in allowed_types:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid file type: "
                f"{file.filename}"
            )
        )

    content = await file.read()

    if len(content) == 0:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Empty file: "
                f"{file.filename}"
            )
        )

    if len(content) > max_size:

        raise HTTPException(
            status_code=400,
            detail=(
                f"File too large: "
                f"{file.filename}"
            )
        )

    extension = Path(
        file.filename or ""
    ).suffix.lower()

    if not extension:

        raise HTTPException(
            status_code=400,
            detail="File extension is missing"
        )

    filename = (
        f"{uuid4().hex}"
        f"{extension}"
    )

    directory.mkdir(
        parents=True,
        exist_ok=True
    )

    file_path = directory / filename

    file_path.write_bytes(content)

    return str(
        file_path
    ).replace("\\", "/")
