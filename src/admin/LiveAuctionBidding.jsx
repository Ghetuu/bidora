import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaChartLine,
  FaUser,
  FaClock,
  FaGavel,
  FaTrophy,
} from "react-icons/fa";

import "../styles/liveauctionbidding.css";

const API_URL = "http://127.0.0.1:8000";

function LiveAuctionBidding() {
  const location = useLocation();
  const navigate = useNavigate();

  const auction = location.state?.auction;

  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================================================
     FETCH BIDS
  ========================================================= */

  useEffect(() => {
    if (!auction?.id) {
      setLoading(false);
      return;
    }

    fetchBids();

    const interval = setInterval(() => {
      fetchBids();
    }, 5000);

    return () => clearInterval(interval);
  }, [auction?.id]);

  const fetchBids = async () => {
    try {
      const response = await fetch(
        `${API_URL}/admin/auctions/${auction.id}/bids`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch bids");
      }

      const data = await response.json();

      const bidData = Array.isArray(data)
        ? data
        : data.bids || [];

      setBids(
        [...bidData].sort(
          (a, b) =>
            Number(b.bid_amount || b.amount || 0) -
            Number(a.bid_amount || a.amount || 0)
        )
      );
    } catch (error) {
      console.error("Bid fetch error:", error);

      /*
       * Keep page working even if bid API
       * has not been created yet.
       */
      setBids([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     HIGHEST BID
  ========================================================= */

  const highestBid = useMemo(() => {
    if (!bids.length) {
      return Number(
        auction?.starting_price || 0
      );
    }

    return Math.max(
      ...bids.map((bid) =>
        Number(
          bid.bid_amount ||
          bid.amount ||
          0
        )
      )
    );
  }, [bids, auction]);

  /* =========================================================
     GRAPH DATA
  ========================================================= */

  const graphBids = useMemo(() => {
    return [...bids]
      .reverse()
      .map((bid, index) => ({
        index: index + 1,
        amount: Number(
          bid.bid_amount ||
          bid.amount ||
          0
        ),
      }));
  }, [bids]);

  /* =========================================================
     FORMAT
  ========================================================= */

  const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString(
      "en-IN"
    )}`;
  };

  const formatTime = (date) => {
    if (!date) {
      return "N/A";
    }

    const parsed = new Date(date);

    if (isNaN(parsed.getTime())) {
      return "N/A";
    }

    return parsed.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  /* =========================================================
     NO AUCTION
  ========================================================= */

  if (!auction) {
    return (
      <div className="live-bidding-page">

        <div className="live-bidding-empty">
          <h2>Auction Not Found</h2>

          <button
            type="button"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>

      </div>
    );
  }

  return (
    <div className="live-bidding-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="live-bidding-header">

        <div>
          <button
            type="button"
            className="live-back-btn"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft />
            Back
          </button>

          <h1>
            Live Auction Bidding
          </h1>

          <p>
            Monitor live bids and bidder activity.
          </p>
        </div>

        <span className="live-page-status">
          LIVE
        </span>

      </div>


      {/* =====================================================
          PRODUCT SUMMARY
      ===================================================== */}

      <div className="live-product-card">

        <div className="live-product-image">

          {auction.images?.length > 0 ? (
            <img
              src={
                auction.images[0].image_path?.startsWith(
                  "http"
                )
                  ? auction.images[0].image_path
                  : `${API_URL}/${String(
                      auction.images[0].image_path || ""
                    ).replace(/^\/+/, "")}`
              }
              alt={auction.product_title}
            />
          ) : (
            <FaGavel />
          )}

        </div>

        <div className="live-product-info">

          <span className="live-product-label">
            LIVE AUCTION
          </span>

          <h2>
            {auction.product_title ||
              "Untitled Product"}
          </h2>

          <p>
            {auction.brand_model || "No brand/model"}
          </p>

          <div className="live-product-meta">

            <span>
              Category:{" "}
              <strong>
                {auction.category || "N/A"}
              </strong>
            </span>

            <span>
              Seller:{" "}
              <strong>
                {auction.created_by_user?.fullname ||
                  auction.seller_name ||
                  "Unknown"}
              </strong>
            </span>

          </div>

        </div>

        <div className="live-highest-bid">

          <span>
            Current Highest Bid
          </span>

          <strong>
            {formatAmount(highestBid)}
          </strong>

        </div>

      </div>


      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <div className="live-stats-grid">

        <div className="live-stat-card">

          <div className="live-stat-icon">
            <FaTrophy />
          </div>

          <div>
            <span>
              Highest Bid
            </span>

            <strong>
              {formatAmount(highestBid)}
            </strong>
          </div>

        </div>


        <div className="live-stat-card">

          <div className="live-stat-icon">
            <FaGavel />
          </div>

          <div>
            <span>
              Total Bids
            </span>

            <strong>
              {bids.length}
            </strong>
          </div>

        </div>


        <div className="live-stat-card">

          <div className="live-stat-icon">
            <FaUser />
          </div>

          <div>
            <span>
              Bidders
            </span>

            <strong>
              {
                new Set(
                  bids.map(
                    (bid) =>
                      bid.user_id ||
                      bid.bidder_id ||
                      bid.bidder_name
                  )
                ).size
              }
            </strong>
          </div>

        </div>


        <div className="live-stat-card">

          <div className="live-stat-icon">
            <FaClock />
          </div>

          <div>
            <span>
              Last Bid
            </span>

            <strong>
              {bids.length
                ? formatTime(
                    bids[0].created_at ||
                      bids[0].bid_time ||
                      bids[0].createdAt
                  )
                : "No bids"}
            </strong>
          </div>

        </div>

      </div>


      {/* =====================================================
          GRAPH + BIDDERS
      ===================================================== */}

      <div className="live-content-grid">

        {/* GRAPH */}

        <div className="live-chart-card">

          <div className="live-section-header">

            <div>
              <h3>
                Bid Trend
              </h3>

              <p>
                Product price vs bidding activity
              </p>
            </div>

            <FaChartLine />

          </div>


          <div className="live-chart">

            {graphBids.length === 0 ? (

              <div className="no-bids-message">
                <FaChartLine />

                <span>
                  No bids available yet.
                </span>
              </div>

            ) : (

              <div className="simple-bid-chart">

                {graphBids.map(
                  (bid) => {

                    const maxAmount =
                      Math.max(
                        ...graphBids.map(
                          (item) =>
                            item.amount
                        )
                      );

                    const height =
                      maxAmount > 0
                        ? Math.max(
                            10,
                            (bid.amount /
                              maxAmount) *
                              100
                          )
                        : 10;

                    return (
                      <div
                        className="chart-bar-wrapper"
                        key={bid.index}
                      >

                        <div
                          className="chart-bar"
                          style={{
                            height: `${height}%`,
                          }}
                          title={formatAmount(
                            bid.amount
                          )}
                        ></div>

                        <span>
                          {bid.index}
                        </span>

                      </div>
                    );
                  }
                )}

              </div>

            )}

          </div>

        </div>


        {/* BIDDERS */}

        <div className="live-bidders-card">

          <div className="live-section-header">

            <div>
              <h3>
                Bidders
              </h3>

              <p>
                Highest to lowest bid
              </p>
            </div>

            <FaUser />

          </div>


          <div className="live-bidders-list">

            {loading ? (

              <div className="live-loading">
                Loading bids...
              </div>

            ) : bids.length === 0 ? (

              <div className="live-no-bids">
                No bids have been placed yet.
              </div>

            ) : (

              bids.map(
                (bid, index) => {

                  const amount =
                    Number(
                      bid.bid_amount ||
                        bid.amount ||
                        0
                    );

                  const bidderName =
                    bid.bidder_name ||
                    bid.user_name ||
                    bid.username ||
                    bid.created_by_user?.fullname ||
                    "Unknown Bidder";

                  return (
                    <div
                      className={`bidder-row ${
                        index === 0
                          ? "highest-bidder"
                          : ""
                      }`}
                      key={
                        bid.id ||
                        `${bidderName}-${index}`
                      }
                    >

                      <div className="bidder-rank">
                        #{index + 1}
                      </div>

                      <div className="bidder-avatar">
                        <FaUser />
                      </div>

                      <div className="bidder-details">

                        <strong>
                          {bidderName}
                        </strong>

                        <span>
                          {formatTime(
                            bid.created_at ||
                              bid.bid_time ||
                              bid.createdAt
                          )}
                        </span>

                      </div>

                      <div className="bidder-amount">
                        {formatAmount(amount)}
                      </div>

                    </div>
                  );
                }
              )

            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default LiveAuctionBidding;