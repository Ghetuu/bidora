import React, { useCallback, useEffect, useState } from "react";
import adminApi from "../api/adminApi";
import {
  FaUsers,
  FaGavel,
  FaTrophy,
  FaRupeeSign,
  FaArrowUp,
  FaCalendarAlt,
  FaShieldAlt,
  FaChartLine,
  FaUserPlus,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa";

import "../styles/adminhome.css";

const API_BASE_URL = "http://127.0.0.1:8000";

const EMPTY_DATA = {
  stats: {
    total_users: 0,
    total_auctions: 0,
    live_auctions: 0,
    total_bids: 0,
    ended_auctions: 0,
    pending_auctions: 0,
    seller_count: 0,
    buyer_count: 0,
  },

  bid_activity: [],
  auction_status: [],
  categories: [],
  top_sellers: [],
  recent_winners: [],
  latest_bids: [],

  suspicious_bids: [],
  auction_performance: [],
  no_bid_auctions: [],
  ending_soon_auctions: [],
  recent_users: [],

  insights: {
    bids_today: 0,
    bids_last_7_days: 0,
    average_bids_per_auction: 0,
    auctions_without_bids: 0,
    auctions_with_bids: 0,
    most_active_category: null,
  },

  payments: {
    available: false,
    message: "Payment tracking is not configured.",
    total_revenue: null,
    paid_count: null,
    pending_count: null,
    failed_count: null,
    monthly_revenue: [],
  },
};

// =========================================================
// HELPERS
// =========================================================

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "N/A";
  }

  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getImageUrl(path) {
  if (!path) {
    return "";
  }

  if (
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

function getInitials(name) {
  if (!name) {
    return "?";
  }

  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function EmptyMessage({ children }) {
  return (
    <div
      style={{
        padding: "24px 12px",
        textAlign: "center",
        color: "#9299a8",
        fontSize: "12px",
      }}
    >
      {children}
    </div>
  );
}

function displayValue(value, fallback = "N/A") {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return value;
}

// =========================================================
// COLORS FOR DYNAMIC CHARTS
// =========================================================

const CHART_COLORS = [
  "#43b99a",
  "#4386ee",
  "#7149e8",
  "#f24d5e",
  "#f3a11b",
  "#8c98aa",
];

// =========================================================
// ADMIN HOME
// =========================================================

export default function AdminHome() {
  const [dashboard, setDashboard] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // =======================================================
  // FETCH REAL DASHBOARD DATA
  // =======================================================

  const fetchDashboard = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const response = await adminApi.get("/admin/dashboard/stats");
      const result = response.data;

      if (!result || !result.success) {
        throw new Error(
          "The server did not return dashboard data."
        );
      }

      setDashboard({
        ...EMPTY_DATA,
        ...result,

        stats: {
          ...EMPTY_DATA.stats,
          ...(result.stats || {}),
        },

        payments: {
          ...EMPTY_DATA.payments,
          ...(result.payments || {}),
        },

        insights: {
          ...EMPTY_DATA.insights,
          ...(result.insights || {}),
        },

        bid_activity: Array.isArray(result.bid_activity)
          ? result.bid_activity
          : [],

        auction_status: Array.isArray(result.auction_status)
          ? result.auction_status
          : [],

        categories: Array.isArray(result.categories)
          ? result.categories
          : [],

        top_sellers: Array.isArray(result.top_sellers)
          ? result.top_sellers
          : [],

        recent_winners: Array.isArray(result.recent_winners)
          ? result.recent_winners
          : [],

        latest_bids: Array.isArray(result.latest_bids)
          ? result.latest_bids
          : [],

        suspicious_bids: Array.isArray(result.suspicious_bids)
          ? result.suspicious_bids
          : [],

        auction_performance: Array.isArray(
          result.auction_performance
        )
          ? result.auction_performance
          : [],

        no_bid_auctions: Array.isArray(result.no_bid_auctions)
          ? result.no_bid_auctions
          : [],

        ending_soon_auctions: Array.isArray(
          result.ending_soon_auctions
        )
          ? result.ending_soon_auctions
          : [],

        recent_users: Array.isArray(result.recent_users)
          ? result.recent_users
          : [],
      });

      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      console.error("Admin dashboard loading error:", err);

      const message =
        err.response?.data?.detail ||
        err.message ||
        "Unable to load dashboard data.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // =======================================================
  // INITIAL LOAD + AUTOMATIC REFRESH
  // =======================================================

  useEffect(() => {
    fetchDashboard(true);

    const interval = setInterval(() => {
      fetchDashboard(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchDashboard]);

  // =======================================================
  // DERIVED DATA
  // =======================================================

  const {
    stats,
    bid_activity,
    auction_status,
    categories,
    top_sellers,
    recent_winners,
    latest_bids,
    payments,
    suspicious_bids,
    auction_performance,
    no_bid_auctions,
    ending_soon_auctions,
    recent_users,
    insights,
  } = dashboard;

  const totalStatusCount = auction_status.reduce(
    (sum, item) => sum + Number(item.count || 0),
    0
  );

  const totalCategoryCount = categories.reduce(
    (sum, item) => sum + Number(item.count || 0),
    0
  );

  // =======================================================
  // BID ACTIVITY SVG CHART
  // =======================================================

  const chartWidth = 600;
  const chartHeight = 150;
  const chartPadding = 12;

  const maxBidCount = Math.max(
    1,
    ...bid_activity.map((item) => Number(item.count || 0))
  );

  const chartPoints = bid_activity.map((item, index) => {
    const x =
      bid_activity.length <= 1
        ? chartWidth / 2
        : (index / (bid_activity.length - 1)) * chartWidth;

    const y =
      chartHeight -
      chartPadding -
      (Number(item.count || 0) / maxBidCount) *
        (chartHeight - chartPadding * 2);

    return {
      x,
      y,
      label: item.label,
      count: Number(item.count || 0),
    };
  });

  const linePath = chartPoints
    .map((point, index) => {
      return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
    })
    .join(" ");

  // =======================================================
  // CATEGORY DONUT
  // =======================================================

  let categoryAngle = 0;

  const categoryGradient =
    totalCategoryCount > 0
      ? categories
          .map((category, index) => {
            const percentage =
              (Number(category.count || 0) / totalCategoryCount) *
              100;

            const start = categoryAngle;
            categoryAngle += percentage;

            return `${CHART_COLORS[index % CHART_COLORS.length]} ${start}% ${categoryAngle}%`;
          })
          .join(", ")
      : "#e9edf5 0% 100%";

  // =======================================================
  // AUCTION STATUS DONUT
  // =======================================================

  let statusAngle = 0;

  const statusGradient =
    totalStatusCount > 0
      ? auction_status
          .map((item, index) => {
            const percentage =
              (Number(item.count || 0) / totalStatusCount) * 100;

            const start = statusAngle;
            statusAngle += percentage;

            return `${CHART_COLORS[index % CHART_COLORS.length]} ${start}% ${statusAngle}%`;
          })
          .join(", ")
      : "#e9edf5 0% 100%";

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="admin-home">
      {/* HEADER */}

      <div className="dashboard-header">
        <div>
          <h1>Dashboard Overview</h1>

          <p>
            Welcome back! Here's what's happening with Bidora today.
          </p>

          {lastUpdated && (
            <p style={{ marginTop: "6px", fontSize: "11px" }}>
              Last updated:{" "}
              {lastUpdated.toLocaleTimeString("en-IN")}
            </p>
          )}
        </div>

        <button
          type="button"
          className="date-button"
          onClick={() => fetchDashboard(true)}
          title="Refresh dashboard data"
        >
          <FaCalendarAlt />

          <span>
            {new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>

          <span>↻</span>
        </button>
      </div>

      {/* ERROR / LOADING */}

      {error && (
        <div
          role="alert"
          style={{
            padding: "12px 16px",
            marginBottom: "18px",
            background: "#fff0f1",
            color: "#c62828",
            border: "1px solid #ffd8dc",
            borderRadius: "8px",
            fontSize: "13px",
          }}
        >
          {error}

          <button
            type="button"
            onClick={() => fetchDashboard(true)}
            style={{
              marginLeft: "12px",
              border: 0,
              background: "transparent",
              color: "#6d4aff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div
          style={{
            marginBottom: "16px",
            fontSize: "12px",
            color: "#9299a8",
          }}
        >
          Loading dashboard data...
        </div>
      )}

      {/* STAT CARDS */}

      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-icon">
            <FaUsers />
          </div>

          <div className="stat-details">
            <span>Total Users</span>
            <h2>{formatNumber(stats.total_users)}</h2>
            <p>
              <FaArrowUp />
              Registered users
            </p>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon">
            <FaGavel />
          </div>

          <div className="stat-details">
            <span>Total Auctions</span>
            <h2>{formatNumber(stats.total_auctions)}</h2>
            <p>
              <FaArrowUp />
              All auction records
            </p>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">
            <FaGavel />
          </div>

          <div className="stat-details">
            <span>Live Auctions</span>
            <h2>{formatNumber(stats.live_auctions)}</h2>
            <p>Currently live</p>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">
            <FaTrophy />
          </div>

          <div className="stat-details">
            <span>Total Bids</span>
            <h2>{formatNumber(stats.total_bids)}</h2>
            <p>Actual bid records</p>
          </div>
        </div>

        <div className="stat-card pink">
          <div className="stat-icon">
            <FaRupeeSign />
          </div>

          <div className="stat-details">
            <span>Revenue</span>

            <h2 style={{ fontSize: "17px" }}>
              {payments.available
                ? formatCurrency(payments.total_revenue)
                : "N/A"}
            </h2>

            <p style={{ color: "#9299a8" }}>
              {payments.available
                ? "Recorded payments"
                : "No payment data"}
            </p>
          </div>
        </div>
      </div>

      {/* FIRST DASHBOARD ROW */}

      <div className="dashboard-grid">
        {/* BID ACTIVITY */}

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3>Bid Activity</h3>
              <span>Actual bids during the last 7 days</span>
              <h2>{formatNumber(stats.total_bids)}</h2>
            </div>

            <span>Last 7 days</span>
          </div>

          <div className="line-chart">
            <div className="y-labels">
              <span>{maxBidCount}</span>
              <span>{Math.round(maxBidCount * 0.75)}</span>
              <span>{Math.round(maxBidCount * 0.5)}</span>
              <span>{Math.round(maxBidCount * 0.25)}</span>
            </div>

            <div className="chart-area">
              <div className="grid-line line1" />
              <div className="grid-line line2" />
              <div className="grid-line line3" />
              <div className="grid-line line4" />

              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                preserveAspectRatio="none"
                role="img"
                aria-label="Daily bid activity chart"
              >
                {chartPoints.length > 0 && (
                  <>
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#7149e8"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {chartPoints.map((point, index) => (
                      <circle
                        key={`${point.label}-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="#7149e8"
                      >
                        <title>
                          {point.label}: {point.count} bids
                        </title>
                      </circle>
                    ))}
                  </>
                )}
              </svg>

              <div className="x-labels">
                {bid_activity.map((item, index) => (
                  <span key={`${item.date}-${index}`}>
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {bid_activity.length === 0 && (
            <EmptyMessage>
              No bid activity is available yet.
            </EmptyMessage>
          )}
        </div>

        {/* REVENUE CHART */}

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3>Revenue Overview</h3>

              <span>
                {payments.available
                  ? "Revenue from recorded payments"
                  : "Payment records are not configured"}
              </span>

              <h2>
                {payments.available
                  ? formatCurrency(payments.total_revenue)
                  : "Unavailable"}
              </h2>
            </div>
          </div>

          {payments.available ? (
            <div className="bar-chart">
              <div className="bars">
                {(payments.monthly_revenue || []).map(
                  (item, index, array) => {
                    const maximum = Math.max(
                      1,
                      ...array.map((entry) =>
                        Number(entry.amount || 0)
                      )
                    );

                    const height =
                      (Number(item.amount || 0) / maximum) * 100;

                    return (
                      <div
                        key={item.month || index}
                        style={{
                          height: `${Math.max(height, 5)}%`,
                        }}
                        title={`${item.month}: ${formatCurrency(item.amount)}`}
                      />
                    );
                  }
                )}
              </div>

              <div className="bar-labels">
                {(payments.monthly_revenue || []).map(
                  (item, index) => (
                    <span key={item.month || index}>
                      {item.label || item.month}
                    </span>
                  )
                )}
              </div>
            </div>
          ) : (
            <EmptyMessage>
              Revenue cannot be calculated accurately until Bidora
              stores real payment transactions.
            </EmptyMessage>
          )}
        </div>

        {/* AUCTION STATUS */}

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3>Auction Status</h3>
              <span>Distribution of auction records</span>
            </div>
          </div>

          <div className="donut-container">
            <div
              className="donut"
              style={{
                background: `conic-gradient(${statusGradient})`,
                position: "relative",
              }}
            >
              <div className="donut-center">
                <strong>{formatNumber(stats.total_auctions)}</strong>
                <span>Auctions</span>
              </div>
            </div>

            <div className="legend">
              {auction_status.map((item, index) => (
                <p key={item.name}>
                  <i
                    style={{
                      background:
                        CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />

                  <span>{item.name}</span>
                  <b>{formatNumber(item.count)}</b>
                </p>
              ))}
            </div>
          </div>

          {totalStatusCount === 0 && (
            <EmptyMessage>No auction records found.</EmptyMessage>
          )}
        </div>
      </div>

      {/* SECOND DASHBOARD ROW */}

      <div className="dashboard-grid second-row">
        {/* CATEGORIES */}

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3>Auction Categories</h3>
              <span>Auctions grouped by category</span>
            </div>
          </div>

          <div className="category-content">
            <div
              className="category-donut"
              style={{
                background: `conic-gradient(${categoryGradient})`,
              }}
            />

            <div className="category-list">
              {categories.map((category, index) => (
                <p key={category.name}>
                  <i
                    style={{
                      background:
                        CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />

                  <span>{category.name}</span>
                  <b>{formatNumber(category.count)}</b>
                </p>
              ))}
            </div>
          </div>

          {categories.length === 0 && (
            <EmptyMessage>No auction categories found.</EmptyMessage>
          )}
        </div>

        {/* TOP SELLERS */}

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3>Top Sellers</h3>
              <span>Ranked by number of auctions</span>
            </div>
          </div>

          <div className="seller-list">
            {top_sellers.map((seller, index) => (
              <div className="seller" key={seller.user_id}>
                <span className="rank">{index + 1}</span>

                {seller.profile_image ? (
                  <img
                    src={getImageUrl(seller.profile_image)}
                    alt={seller.name}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      minWidth: "34px",
                      borderRadius: "50%",
                      background: "#eee9ff",
                      color: "#6845e8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: 700,
                    }}
                  >
                    {getInitials(seller.name)}
                  </div>
                )}

                <div>
                  <strong>{seller.name}</strong>
                  <small>
                    {formatNumber(seller.auction_count)} auctions
                  </small>
                </div>

                <b>{formatNumber(seller.live_count)} live</b>
              </div>
            ))}
          </div>

          {top_sellers.length === 0 && (
            <EmptyMessage>No seller activity is available.</EmptyMessage>
          )}
        </div>

        {/* RECENT WINNERS */}

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3>Recent Winners</h3>
              <span>Highest bidders on ended auctions</span>
            </div>
          </div>

          <div className="winner-list">
            {recent_winners.map((winner) => (
              <div className="winner" key={winner.auction_id}>
                {winner.product_image ? (
                  <img
                    src={getImageUrl(winner.product_image)}
                    alt={winner.product_title}
                    style={{
                      width: "40px",
                      height: "40px",
                      minWidth: "40px",
                      borderRadius: "7px",
                      objectFit: "cover",
                    }}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="product-placeholder">
                    <FaGavel />
                  </div>
                )}

                <div>
                  <strong>{winner.product_title}</strong>
                  <small>{winner.winner_name}</small>
                </div>

                <b>{formatCurrency(winner.winning_bid)}</b>
              </div>
            ))}
          </div>

          {recent_winners.length === 0 && (
            <EmptyMessage>
              No ended auctions with valid bids were found.
            </EmptyMessage>
          )}
        </div>
      </div>

      {/* BIDDING TRENDS & INSIGHTS */}

      <div className="dashboard-card admin-insights-card">
        <div className="card-header">
          <div>
            <h3>
              <FaChartLine className="admin-section-icon" />
              Bidding Trends &amp; Insights
            </h3>

            <span>
              Insights calculated from actual bid records
            </span>
          </div>
        </div>

        <div className="admin-insights-grid">
          <div className="admin-insight-item">
            <span>Bids Today</span>
            <strong>{formatNumber(insights.bids_today)}</strong>
          </div>

          <div className="admin-insight-item">
            <span>Bids in Last 7 Days</span>
            <strong>{formatNumber(insights.bids_last_7_days)}</strong>
          </div>

          <div className="admin-insight-item">
            <span>Average Bids per Active Auction</span>
            <strong>
              {Number(
                insights.average_bids_per_auction || 0
              ).toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </strong>
          </div>

          <div className="admin-insight-item">
            <span>Auctions Without Bids</span>
            <strong>
              {formatNumber(insights.auctions_without_bids)}
            </strong>
          </div>

          <div className="admin-insight-item">
            <span>Auctions With Bids</span>
            <strong>
              {formatNumber(insights.auctions_with_bids)}
            </strong>
          </div>

          <div className="admin-insight-item">
            <span>Most Active Category</span>

            <strong className="admin-category-insight">
              {typeof insights.most_active_category === "object" &&
              insights.most_active_category !== null
                ? displayValue(insights.most_active_category.name)
                : displayValue(insights.most_active_category)}
            </strong>

            {insights.most_active_category &&
              typeof insights.most_active_category === "object" &&
              insights.most_active_category.bid_count !== undefined && (
                <small>
                  {formatNumber(
                    insights.most_active_category.bid_count
                  )}{" "}
                  bids
                </small>
              )}
          </div>
        </div>
      </div>

      {/* SUSPICIOUS BIDDING ACTIVITY */}

      <div className="dashboard-card admin-section-card">
        <div className="card-header">
          <div>
            <h3>
              <FaShieldAlt className="admin-section-icon" />
              Suspicious Bidding Activity
            </h3>

            <span>
              Unusual patterns flagged for admin review
            </span>
          </div>

          <span className="admin-count-badge">
            {formatNumber(suspicious_bids.length)} flagged
          </span>
        </div>

        <p className="admin-review-disclaimer">
          These are rule-based alerts, not proof of fraud. Review the
          bidding history and relevant context before taking action.
        </p>

        <div className="table-wrapper">
          <table className="admin-extra-table">
            <thead>
              <tr>
                <th>Bid ID</th>
                <th>Product</th>
                <th>Bidder</th>
                <th>Bid Amount</th>
                <th>Pattern Detected</th>
                <th>Date &amp; Time</th>
                <th>Review</th>
              </tr>
            </thead>

            <tbody>
              {suspicious_bids.map((item) => (
                <tr key={item.bid_id}>
                  <td>#{item.bid_id}</td>
                  <td>{displayValue(item.product_title)}</td>
                  <td>{displayValue(item.bidder_name)}</td>
                  <td>{formatCurrency(item.amount)}</td>

                  <td className="admin-reason-cell">
                    {displayValue(item.reason)}
                  </td>

                  <td>{formatDateTime(item.created_at)}</td>

                  <td>
                    <span className="admin-review-badge">
                      <FaExclamationTriangle />
                      Review
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {suspicious_bids.length === 0 && (
          <EmptyMessage>
            No unusual bidding patterns were flagged by the current
            checks. This does not guarantee that every bid is legitimate.
          </EmptyMessage>
        )}
      </div>

      {/* AUCTION PERFORMANCE OVERVIEW */}

      <div className="dashboard-card admin-section-card">
        <div className="card-header">
          <div>
            <h3>
              <FaGavel className="admin-section-icon" />
              Auction Performance Overview
            </h3>

            <span>
              Auctions ranked by actual bid activity
            </span>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="admin-extra-table">
            <thead>
              <tr>
                <th>Auction</th>
                <th>Category</th>
                <th>Status</th>
                <th>Total Bids</th>
                <th>Highest Bid</th>
                <th>Auction Ends</th>
              </tr>
            </thead>

            <tbody>
              {auction_performance.map((item) => (
                <tr key={item.auction_id}>
                  <td>
                    <div className="admin-product-cell">
                      {item.product_image ? (
                        <img
                          src={getImageUrl(item.product_image)}
                          alt={item.product_title || "Auction product"}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="admin-product-fallback">
                          <FaGavel />
                        </span>
                      )}

                      <span>
                        {displayValue(item.product_title)}
                      </span>
                    </div>
                  </td>

                  <td>{displayValue(item.category)}</td>

                  <td>
                    <span
                      className={`admin-auction-status status-${String(
                        item.status || "unknown"
                      ).toLowerCase()}`}
                    >
                      {displayValue(item.status)}
                    </span>
                  </td>

                  <td>{formatNumber(item.total_bids)}</td>
                  <td>{formatCurrency(item.highest_bid)}</td>
                  <td>{formatDateTime(item.auction_end)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {auction_performance.length === 0 && (
          <EmptyMessage>
            No auction performance data is available.
          </EmptyMessage>
        )}
      </div>

      {/* AUCTIONS WITHOUT BIDS + ENDING SOON */}

      <div className="admin-auction-lists">
        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3>
                <FaGavel className="admin-section-icon" />
                Auctions Without Bids
              </h3>

              <span>
                Active and upcoming auctions that have no bids
              </span>
            </div>
          </div>

          <div className="admin-compact-list">
            {no_bid_auctions.map((item) => (
              <div
                className="admin-compact-item"
                key={item.auction_id}
              >
                <div className="admin-compact-icon">
                  <FaGavel />
                </div>

                <div className="admin-compact-details">
                  <strong>
                    {displayValue(item.product_title)}
                  </strong>

                  <small>
                    {displayValue(item.category)} ·{" "}
                    {displayValue(item.status)}
                  </small>
                </div>

                <span className="admin-no-bids-badge">0 bids</span>
              </div>
            ))}
          </div>

          {no_bid_auctions.length === 0 && (
            <EmptyMessage>
              No active or upcoming auctions without bids were found.
            </EmptyMessage>
          )}
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3>
                <FaClock className="admin-section-icon" />
                Ending Within 24 Hours
              </h3>

              <span>
                Live or approved auctions ending soon
              </span>
            </div>
          </div>

          <div className="admin-compact-list">
            {ending_soon_auctions.map((item) => (
              <div
                className="admin-compact-item"
                key={item.auction_id}
              >
                <div className="admin-compact-icon admin-clock-icon">
                  <FaClock />
                </div>

                <div className="admin-compact-details">
                  <strong>
                    {displayValue(item.product_title)}
                  </strong>

                  <small>
                    {formatCurrency(item.highest_bid)} ·{" "}
                    {formatNumber(item.total_bids)} bids
                  </small>
                </div>

                <span className="admin-ending-time">
                  {formatDateTime(item.auction_end)}
                </span>
              </div>
            ))}
          </div>

          {ending_soon_auctions.length === 0 && (
            <EmptyMessage>
              No live or approved auctions are ending within 24 hours.
            </EmptyMessage>
          )}
        </div>
      </div>

      {/* RECENTLY REGISTERED USERS */}

      <div className="dashboard-card admin-section-card">
        <div className="card-header">
          <div>
            <h3>
              <FaUserPlus className="admin-section-icon" />
              Recently Registered Users
            </h3>

            <span>
              Latest user accounts from the database
            </span>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="admin-extra-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Account Status</th>
                <th>Email Verification</th>
                <th>Registration Date</th>
              </tr>
            </thead>

            <tbody>
              {recent_users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="admin-user-cell">
                      {user.profile_image ? (
                        <img
                          src={getImageUrl(user.profile_image)}
                          alt={user.name || "User"}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="admin-user-avatar">
                          {getInitials(user.name)}
                        </span>
                      )}

                      <span>{displayValue(user.name)}</span>
                    </div>
                  </td>

                  <td>{displayValue(user.email)}</td>
                  <td>{displayValue(user.role)}</td>

                  <td>
                    <span
                      className={`admin-account-status status-${String(
                        user.account_status || "unknown"
                      ).toLowerCase()}`}
                    >
                      {displayValue(user.account_status)}
                    </span>
                  </td>

                  <td>
                    <span
                      className={
                        user.email_verified
                          ? "admin-verified"
                          : "admin-unverified"
                      }
                    >
                      {user.email_verified
                        ? "Verified"
                        : "Not verified"}
                    </span>
                  </td>

                  <td>{formatDateTime(user.registration_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recent_users.length === 0 && (
          <EmptyMessage>
            No registered users were found.
          </EmptyMessage>
        )}
      </div>

      {/* EXISTING TABLES */}

      <div className="tables-grid">
        {/* LATEST BIDS */}

        <div className="dashboard-card table-card">
          <div className="card-header">
            <div>
              <h3>Latest Bids</h3>
              <span>Most recent bids from the database</span>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Bidder</th>
                  <th>Product</th>
                  <th>Bid Amount</th>
                  <th>Date &amp; Time</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {latest_bids.map((bid) => (
                  <tr key={bid.id}>
                    <td>{displayValue(bid.bidder_name)}</td>
                    <td>{displayValue(bid.product_title)}</td>
                    <td>{formatCurrency(bid.amount)}</td>
                    <td>{formatDateTime(bid.created_at)}</td>

                    <td>
                      <span
                        className={`status ${
                          bid.status === "Highest"
                            ? "highest"
                            : "outbid"
                        }`}
                      >
                        {displayValue(bid.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {latest_bids.length === 0 && (
            <EmptyMessage>No bids have been placed yet.</EmptyMessage>
          )}
        </div>

        {/* PAYMENT INFORMATION */}

        <div className="dashboard-card table-card">
          <div className="card-header">
            <div>
              <h3>Payments Overview</h3>

              <span>
                {payments.available
                  ? "Recorded payment transactions"
                  : "Payment tracking is not configured"}
              </span>
            </div>
          </div>

          {payments.available ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Payment Status</th>
                    <th>Transactions</th>
                    <th>Amount</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td>
                      <span className="status paid">Paid</span>
                    </td>

                    <td>{formatNumber(payments.paid_count)}</td>

                    <td>{formatCurrency(payments.total_revenue)}</td>
                  </tr>

                  <tr>
                    <td>
                      <span className="status pending">Pending</span>
                    </td>

                    <td>{formatNumber(payments.pending_count)}</td>
                    <td>—</td>
                  </tr>

                  <tr>
                    <td>
                      <span className="status failed">Failed</span>
                    </td>

                    <td>{formatNumber(payments.failed_count)}</td>
                    <td>—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyMessage>
              {payments.message ||
                "No payment transaction records are available."}
            </EmptyMessage>
          )}
        </div>
      </div>
    </div>
  );
}
