import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/recommendedauctions.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

// The login token may be stored in sessionStorage or localStorage
// (the dashboard page already checks both).
function getAccessToken() {
  return (
    sessionStorage.getItem("access_token") ||
    localStorage.getItem("access_token")
  );
}

function RecommendedAuctions({ limit = 6, compact = false }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const sectionClass = compact
    ? "recommended-section recommended-compact"
    : "recommended-section";

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const token = getAccessToken();

        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/recommendations?limit=${limit}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Recommendation API failed: ${response.status}`
          );
        }

        const data = await response.json();

        console.log(
          "Recommendation API response:",
          data
        );

        const recommendationList =
          Array.isArray(data)
            ? data
            : data.recommendations || [];

        console.log(
          "Recommendations:",
          recommendationList
        );

        setRecommendations(recommendationList);
      } catch (error) {
        console.error(
          "Recommendation error:",
          error
        );

        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [limit]);

  // =====================================================
  // OPEN AUCTION
  // =====================================================

  const handleAuctionClick = async (auction) => {
    const token = getAccessToken();

    // Record view
    if (token) {
      try {
        await fetch(
          `${API_BASE_URL}/api/recommendations/view/${auction.id}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (error) {
        console.error(
          "View tracking error:",
          error
        );
      }
    }

    // LIVE AUCTION
if (auction.status === "live") {
  navigate(
    `/dashboard/live-auction/${auction.id}`,
    {
      state: {
        auction,
        from: "recommendations",
      },
    }
  );
  return;
}

// APPROVED AUCTION
if (auction.status === "approved") {
  navigate(
    `/dashboard/auction/${auction.id}`,
    {
      state: {
        auction,
        from: "recommendations",
      },
    }
  );
  return;
}

// OTHER STATUS
navigate(
  `/dashboard/auction/${auction.id}`,
  {
    state: {
      auction,
      from: "recommendations",
    },
  }
);
  }
  // =====================================================
  // IMAGE URL
  // =====================================================

  const getImageUrl = (image) => {
    if (!image) return null;

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    const normalizedPath = image.replace(/\\/g, "/");

    return `${API_BASE_URL.replace(/\/$/, "")}/${
      normalizedPath.startsWith("/")
        ? normalizedPath.slice(1)
        : normalizedPath
    }`;
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <section className={sectionClass}>
        <div className="recommended-header">
          <div>
            <h2>For You</h2>
            <p>Finding auctions for you...</p>
          </div>
        </div>
      </section>
    );
  }

  // =====================================================
  // NO RECOMMENDATIONS
  // =====================================================
  //
  // Previously this returned null, which made the whole
  // section disappear. Now the section stays visible with
  // a short message, so it is clear it is there.

  if (recommendations.length === 0) {
    return (
      <section className={sectionClass}>
        <div className="recommended-header">
          <div>
            <h2>For You</h2>
            <p>No recommendations available right now.</p>
          </div>
        </div>
      </section>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <section className={sectionClass}>

      {/* HEADER */}

      <div className="recommended-header">

        <div>
          <h2>For You</h2>

          <p>
            Auctions selected based on your activity
          </p>
        </div>

        <button
          className="recommended-see-all"
          onClick={() =>
            navigate("/dashboard/all-auctions")
          }
        >
          See All
        </button>

      </div>

      {/* CARDS */}

      <div className="recommended-grid">

        {recommendations.map((auction) => {

          const imageUrl =
            getImageUrl(auction.image);

          return (
            <div
              key={auction.id}
              className="recommended-card"
              onClick={() =>
                handleAuctionClick(auction)
              }
            >

              {/* IMAGE */}

              <div className="recommended-image">

                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={
                      auction.product_title ||
                      "Auction"
                    }
                  />
                ) : (
                  <div className="no-image">
                    No Image
                  </div>
                )}

                {/* LIVE BADGE */}

                {auction.status === "live" && (
                  <span className="recommended-live-badge">
                    LIVE
                  </span>
                )}

                {/* APPROVED BADGE */}

                {auction.status === "approved" && (
                  <span className="recommended-approved-badge">
                    APPROVED
                  </span>
                )}

                {/* HEART */}

                <button
                  className="recommended-heart"
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  ♡
                </button>

              </div>

              {/* CONTENT */}

              <div className="recommended-content">

                <h3>
                  {auction.product_title ||
                    "Auction"}
                </h3>

                {auction.brand_model && (
                  <p className="recommended-brand">
                    {auction.brand_model}
                  </p>
                )}

                {auction.category && (
                  <span className="recommended-category">
                    {auction.category}
                  </span>
                )}

                <div className="recommended-bottom">

                  <strong className="recommended-price">
                    ₹
                    {Number(
                      auction.starting_price || 0
                    ).toLocaleString("en-IN")}
                  </strong>

                  <span className="recommended-status">
                    {auction.status === "live"
                      ? "🔴 Live"
                      : auction.status === "approved"
                      ? "🟢 Approved"
                      : auction.status}
                  </span>

                </div>

              </div>

            </div>
          );
        })}

      </div>

    </section>
  );
}

export default RecommendedAuctions;