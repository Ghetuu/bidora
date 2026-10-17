import csv
from pathlib import Path

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel


from sqlalchemy.orm import Session

from app.routes.user_route import get_db
from app.models.user import User
from app.routes.user_route import create_kyc_identifier_hash

router = APIRouter(prefix="/api/kyc", tags=["Demo KYC"])

BASE_DIR = Path(__file__).resolve().parents[2]
AADHAAR_CSV = BASE_DIR / "data" / "aadhar.csv"


class AadhaarKYCRequest(BaseModel):
    aadhaar_number: str


def normalize_number(value: str) -> str:
    """Keep only digits when comparing synthetic test identifiers."""
    return "".join(character for character in str(value) if character.isdigit())


@router.post("/verify")
def verify_aadhaar(
    request: AadhaarKYCRequest,
    db: Session = Depends(get_db)
):
    print("\n--- KYC VERIFICATION STARTED ---")
    print("CSV path:", AADHAAR_CSV)
    print("CSV exists:", AADHAAR_CSV.exists())

    if not AADHAAR_CSV.exists():
        raise HTTPException(
            status_code=500,
            detail="KYC demo CSV file not found."
        )

    submitted_number = normalize_number(request.aadhaar_number)
    print("Submitted number:", repr(submitted_number))

    if len(submitted_number) != 12:
        return {
            "success": False,
            "message": "Enter a 12-digit demo identifier."
        }

    try:
        with open(
            AADHAAR_CSV,
            "r",
            newline="",
            encoding="utf-8-sig"
        ) as file:
            reader = csv.DictReader(file)

            print("CSV columns:", reader.fieldnames)

            if not reader.fieldnames or "aadhaar_number" not in reader.fieldnames:
                raise HTTPException(
                    status_code=500,
                    detail="CSV must contain an aadhaar_number column."
                )

            for record in reader:
                csv_number = normalize_number(
                    record.get("aadhaar_number", "")
                )

                print(
                    "Record:",
                    record.get("id"),
                    repr(csv_number)
                )

                if csv_number == submitted_number:
                    print("KYC MATCH FOUND")

                    # Generate the same hash used during registration
                    identifier_hash = create_kyc_identifier_hash(submitted_number)

                    # Check whether this identifier already exists in MySQL
                    existing_kyc = (
                        db.query(User)
                        .filter(User.kyc_identifier_hash == identifier_hash)
                        .first()
                    )

                    if existing_kyc:
                        print("KYC IDENTIFIER ALREADY USED")

                        return {
                            "success": False,
                            "message": "This demo identifier has already been used for another account."
                        }

                    return {
                        "success": True,
                        "message": "Demo KYC verification successful."
                    }

    except (OSError, csv.Error) as error:
        print("CSV ERROR:", str(error))
        raise HTTPException(
            status_code=500,
            detail="Unable to read KYC demo CSV."
        )

    print("NO MATCH FOUND")
    return {
        "success": False,
        "message": "Demo identifier not found in the CSV."
    }