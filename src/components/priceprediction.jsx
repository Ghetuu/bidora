import React, { useEffect, useState } from "react";
import { FaChartLine, FaChevronDown } from "react-icons/fa";

import "../styles/priceprediction.css";

const API_URL = "http://127.0.0.1:8000";

/* =========================================================
   TOKEN (same lookup the create-auction form uses)
========================================================= */

const getAccessToken = () => {
  let user = null;
  try {
    const storedUser =
      sessionStorage.getItem("user") || localStorage.getItem("user");
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  return (
    sessionStorage.getItem("access_token") ||
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    user?.access_token ||
    user?.accessToken ||
    user?.token ||
    null
  );
};

const rupees = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const CONFIDENCE_LABEL = {
  low: "Low confidence",
  medium: "Medium confidence",
  high: "High confidence",
};

/* =========================================================
   PRICE PREDICTION CARD

   Two ways to use it:

   1) Seller form (auction does not exist yet)
      <PricePrediction
        category={formData.category}
        condition={formData.condition}
        purchasePrice={formData.purchasePrice}
        brandModel={formData.brandModel}
        purchaseDate={formData.purchaseDate}
        onUseStartingPrice={(v) => ...}
      />

   2) Auction details page (auction already exists)
      <PricePrediction auctionId={auction.id} />
========================================================= */

function PricePrediction({
  auctionId,
  category,
  condition,
  purchasePrice,
  brandModel,
  purchaseDate,
  onUseStartingPrice,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showWhy, setShowWhy] = useState(false);

  useEffect(() => {
    let url;

    if (auctionId) {
      url = `${API_URL}/api/price-prediction/auction/${auctionId}`;
    } else {
      const price = Number(purchasePrice);

      if (!category || !condition || !(price > 0)) {
        setData(null);
        setError("");
        return undefined;
      }

      const params = new URLSearchParams({
        category,
        condition,
        purchase_price: String(price),
      });
      if (brandModel && String(brandModel).trim()) {
        params.set("brand_model", String(brandModel).trim());
      }
      if (purchaseDate) {
        params.set("purchase_date", String(purchaseDate));
      }
      url = `${API_URL}/api/price-prediction?${params.toString()}`;
    }

    const controller = new AbortController();

    // wait while the seller is still typing
    const timer = setTimeout(
      async () => {
        const token = getAccessToken();
        if (!token) {
          setError("Login required to see the price estimate.");
          return;
        }

        try {
          setLoading(true);
          setError("");

          const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error("Request failed");
          }

          setData(await response.json());
        } catch (err) {
          if (err.name === "AbortError") return;
          console.error("Price prediction error:", err);
          setData(null);
          setError("Price estimate is not available right now.");
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      },
      auctionId ? 0 : 600
    );

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [auctionId, category, condition, purchasePrice, brandModel, purchaseDate]);

  /* ---------- nothing to show yet (seller has not filled the form) ---------- */

  if (!data && !loading && !error) {
    if (auctionId) return null;
    return (
      <div className="pp-card pp-card-empty">
        <FaChartLine />
        <span>
          Select a category and condition and enter the purchase price to see
          the expected final price.
        </span>
      </div>
    );
  }

  return (
    <div className="pp-card">
      <div className="pp-header">
        <span className="pp-icon">
          <FaChartLine />
        </span>
        <div>
          <h4>AI Price Prediction</h4>
          <p>Estimated final auction price</p>
        </div>

        {data && (
          <span className={`pp-confidence pp-${data.confidence}`}>
            {CONFIDENCE_LABEL[data.confidence] || data.confidence}
          </span>
        )}
      </div>

      {loading && !data && <div className="pp-loading">Estimating…</div>}

      {error && <div className="pp-error">{error}</div>}

      {data && (
        <div className={loading ? "pp-body pp-body-refreshing" : "pp-body"}>
          <div className="pp-main">
            <span className="pp-expected">{rupees(data.expected_price)}</span>
            <span className="pp-range">
              Likely range {rupees(data.low_price)} – {rupees(data.high_price)}
            </span>
          </div>

          {auctionId && data.current_bid > 0 && (
            <div className="pp-row">
              <span>Current highest bid</span>
              <strong>{rupees(data.current_bid)}</strong>
            </div>
          )}

          {!auctionId && onUseStartingPrice && (
            <div className="pp-row">
              <span>
                Suggested starting bid <strong>{rupees(data.suggested_start)}</strong>
              </span>
              <button
                type="button"
                className="pp-use-btn"
                onClick={() => onUseStartingPrice(data.suggested_start)}
              >
                Use this
              </button>
            </div>
          )}

          <button
            type="button"
            className={`pp-why-toggle ${showWhy ? "open" : ""}`}
            onClick={() => setShowWhy((p) => !p)}
          >
            Why this estimate? <FaChevronDown />
          </button>

          {showWhy && (
            <ul className="pp-notes">
              {data.notes.map((n, i) => (
                <li key={i} className={`pp-note ${n.type}`}>
                  {n.label}
                </li>
              ))}
            </ul>
          )}

          <p className="pp-disclaimer">
            This is an estimate based on similar completed auctions and typical
            resale values. Actual prices depend on bidders.
          </p>
        </div>
      )}
    </div>
  );
}

export default PricePrediction;
