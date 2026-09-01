
from sqlalchemy.orm import Session

from app.models.auction import Auction
from app.models.auction_image import AuctionImage


class AuctionRepository:

    def create_auction(
        self,
        db: Session,
        auction: Auction
    ):

        db.add(auction)
        db.flush()

        return auction


    def add_image(
        self,
        db: Session,
        auction_image: AuctionImage
    ):

        db.add(auction_image)

        return auction_image


    def commit(
        self,
        db: Session
    ):

        db.commit()


    def rollback(
        self,
        db: Session
    ):

        db.rollback()


    def refresh(
        self,
        db: Session,
        auction: Auction
    ):

        db.refresh(auction)

        return auction


    def get_by_id(
        self,
        db: Session,
        auction_id: int
    ):

        return (
            db.query(Auction)
            .filter(
                Auction.id == auction_id
            )
            .first()
        )
