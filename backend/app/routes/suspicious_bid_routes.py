from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.admin_auth import get_current_admin
from app.models.auction import Auction
from app.models.bids import Bid
from app.services.suspicious_bid_detector import (
    analyze_suspicious_bidding,
)


router = APIRouter(
    prefix="/admin/suspicious-bids",
    tags=["Admin Suspicious Bidding"],
    dependencies=[Depends(get_current_admin)],
)


ALLOWED_STATUSES = {
    "pending",
    "approved",
    "rejected",
    "live",
    "ended",
    "all",
}


# =========================================================
# LIST AUCTIONS WITH SUSPICIOUS BIDDING ANALYSIS
# =========================================================

@router.get("")
def get_suspicious_bidding_reports(
    status: str = Query("all"),
    min_risk: int = Query(0, ge=0, le=100),
    db: Session = Depends(get_db),
):
    status = status.strip().lower()

    if status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Invalid auction status.",
        )

    query = db.query(Auction)

    if status != "all":
        query = query.filter(
            Auction.status == status
        )

    auctions = (
        query
        .order_by(Auction.created_at.desc())
        .limit(500)
        .all()
    )

    reports = []

    for auction in auctions:
        bids = (
            db.query(Bid)
            .filter(Bid.auction_id == auction.id)
            .order_by(Bid.created_at.asc(), Bid.id.asc())
            .all()
        )

        report = analyze_suspicious_bidding(
            auction,
            bids,
        )

        if report["risk_score"] >= min_risk:
            reports.append(report)

    reports.sort(
        key=lambda item: item["risk_score"],
        reverse=True,
    )

    return {
        "count": len(reports),
        "filters": {
            "status": status,
            "min_risk": min_risk,
        },
        "summary": {
            "high_risk": sum(
                1 for report in reports
                if report["risk_level"] == "high"
            ),
            "medium_risk": sum(
                1 for report in reports
                if report["risk_level"] == "medium"
            ),
            "low_risk": sum(
                1 for report in reports
                if report["risk_level"] == "low"
            ),
            "critical_signals": sum(
                1 for report in reports
                if report.get("critical_signal", False)
            ),
        },
        "reports": reports,
    }


# =========================================================
# ANALYZE ONE AUCTION
# =========================================================

@router.get("/{auction_id}")
def get_suspicious_bidding_report(
    auction_id: int,
    db: Session = Depends(get_db),
):
    auction = (
        db.query(Auction)
        .filter(Auction.id == auction_id)
        .first()
    )

    if not auction:
        raise HTTPException(
            status_code=404,
            detail="Auction not found.",
        )

    bids = (
        db.query(Bid)
        .filter(Bid.auction_id == auction_id)
        .order_by(Bid.created_at.asc(), Bid.id.asc())
        .all()
    )

    return analyze_suspicious_bidding(
        auction,
        bids,
    )