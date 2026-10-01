import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/recommendedauctions.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const RecommendedAuctions = () => {

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {

    const fetchRecommendations = async () => {

      try {

        const token =
          sessionStorage.getItem("access_token");

        // User is not logged in
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/recommendations?limit=6`,
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
            "Failed to load recommendations"
          );
        }

        const data = await response.json();

        setRecommendations(
          data.recommendations || []
        );

      } catch (err) {

        console.error(
          "Recommendation error:",
          err
        );

        setError(
          "Unable to load recommendations."
        );

      } finally {

        setLoading(false);

      }

    };

    fetchRecommendations();

  }, []);


  // =====================================================
  // OPEN AUCTION
  // =====================================================

  const handleAuctionClick = (auction) => {

    navigate(
      `/auction/${auction.id}`,
      {
        state: {
          auction: auction
        }
      }
    );

  };


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (
      <section className="recommended-section">

        <h2>🤖 Recommended For You</h2>

        <p>Finding auctions for you...</p>

      </section>
    );

  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error) {

    return null;

  }


  // =====================================================
  // NO RECOMMENDATIONS
  // =====================================================

  if (!recommendations || recommendations.length === 0) {
    return (
      <section className="recommended-section">
        <h2>🤖 Recommended For You</h2>
        <p>No recommendations available yet.</p>
      </section>
    );
}


  // =====================================================
  // DISPLAY
  // =====================================================

  return (

    <section className="recommended-section">

      <div className="recommended-header">

        <div>

          <h2>
            🤖 Recommended For You
          </h2>

          <p>
            Based on auctions you viewed and
            bid on
          </p>

        </div>

      </div>


      <div className="recommended-grid">

        {recommendations.map((auction) => (

          <div
            key={auction.id}
            className="recommended-card"
            onClick={() =>
              handleAuctionClick(auction)
            }
          >

            {/* =========================================
                IMAGE
            ========================================== */}

            <div className="recommended-image">

              {auction.image ? (

                <img
                  src={`${API_BASE_URL}/${auction.image}`}
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

            </div>


            {/* =========================================
                CONTENT
            ========================================== */}

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


              {/* PRICE */}

              <div className="recommended-price">

                ₹
                {Number(
                  auction.starting_price || 0
                ).toLocaleString("en-IN")}

              </div>


              {/* REASON */}

              <p className="recommended-reason">

                ✨ {auction.reason}

              </p>

            </div>

          </div>

        ))}

      </div>

    </section>

  );

};


export default RecommendedAuctions;