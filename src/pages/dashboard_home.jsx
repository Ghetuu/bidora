import {
  FaGavel,
  FaTag,
  FaTrophy,
  FaWallet,
  FaArrowUp,
  FaArrowDown,
  FaBell,
  FaShieldAlt,
  FaUserCheck,
  FaHeadset,
  FaUndo,
  FaSearch,
  FaRegHeart,
  FaRegClock,
  FaRegUser,
  FaChevronRight,
  FaRegCalendarAlt,
  FaArrowRight,
  FaChartBar,
  FaChartPie,
} from "react-icons/fa";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import RecommendedAuctions from "../components/RecommendedAuctions";
import "../styles/dashboard_home.css";
import AuroraChatbot from "../components/AuroraChatbot";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const STATIC_SPENDING = 4982.50;

// Auction detail page: live auctions open the live bidding page,
// everything else opens the normal auction details page.
// (Same rule that RecommendedAuctions uses.)
function getAuctionPath(auction) {
  return auction.auction_status === "live"
    ? `/dashboard/live-auction/${auction.id}`
    : `/dashboard/auction/${auction.id}`;
}

// Quick action shortcuts (paths match the routes in App.jsx)
const QUICK_ACTIONS = [
  {
    key: "browse",
    title: "Browse Auctions",
    subtitle: "Explore latest auctions",
    path: "/dashboard/all-auctions",
    icon: FaSearch,
    tone: "indigo",
  },
  {
    key: "watchlist",
    title: "Create Watchlist",
    subtitle: "Save your favorite items",
    // There is no watchlist route in App.jsx yet, so this opens
    // All Auctions for now. Change it when a watchlist page exists.
    path: "/dashboard/all-auctions",
    icon: FaRegHeart,
    tone: "pink",
  },
  {
    key: "history",
    title: "View Bid History",
    subtitle: "Track your bidding activity",
    path: "/dashboard/history/bid",
    icon: FaRegClock,
    tone: "blue",
  },
  {
    key: "profile",
    title: "Update Profile",
    subtitle: "Manage your account",
    path: "/dashboard/manage-profile",
    icon: FaRegUser,
    tone: "green",
  },
];

function getStoredUser() {
  try {
    const storedUser =
      localStorage.getItem("user") ||
      sessionStorage.getItem("user");

    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

function getAccessToken() {
  return (
    sessionStorage.getItem("access_token") ||
    localStorage.getItem("access_token")
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatPercentage(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return `${number > 0 ? "+" : ""}${number}%`;
}

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getImageUrl(imagePath) {
  if (!imagePath) {
    return null;
  }

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("data:")
  ) {
    return imagePath;
  }

  const normalizedPath = imagePath.replace(/\\/g, "/");

  return `${API_BASE_URL.replace(/\/$/, "")}/${
    normalizedPath.startsWith("/")
      ? normalizedPath.slice(1)
      : normalizedPath
  }`;
}

function getAuctionIcon(category = "") {
  const normalized = category.toLowerCase();

  if (
    normalized.includes("vehicle") ||
    normalized.includes("car") ||
    normalized.includes("automobile")
  ) {
    return "🚗";
  }

  if (
    normalized.includes("watch") ||
    normalized.includes("jewelry")
  ) {
    return "⌚";
  }

  if (
    normalized.includes("art") ||
    normalized.includes("collectible")
  ) {
    return "🖼️";
  }

  if (
    normalized.includes("fashion") ||
    normalized.includes("bag")
  ) {
    return "👜";
  }

  if (
    normalized.includes("electronic") ||
    normalized.includes("camera")
  ) {
    return "📷";
  }

  if (
    normalized.includes("diamond") ||
    normalized.includes("gem")
  ) {
    return "💎";
  }

  return "🏷️";
}

function DashboardHome() {
  const navigate = useNavigate();

  const [user, setUser] = useState(getStoredUser);

  const [dashboardData, setDashboardData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [activityPeriod, setActivityPeriod] = useState("30");

  // -----------------------------------------------------
  // FETCH AUTHENTICATED USER DASHBOARD
  // -----------------------------------------------------

  const fetchDashboard = useCallback(async () => {
    const token = getAccessToken();

    if (!token) {
      setError(
        "Your login session could not be found. Please log in again."
      );

      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/user-dashboard`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Your session has expired or is not authorized. Please log in again."
        );
      }

      if (!response.ok) {
        throw new Error(
          `Unable to load dashboard data (${response.status}).`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error("The server did not return dashboard data.");
      }

      setDashboardData(data);

      if (data.user) {
        setUser((previousUser) => {
          const updatedUser = {
            ...(previousUser || {}),
            ...data.user,
          };

          localStorage.setItem("user", JSON.stringify(updatedUser));

          return updatedUser;
        });
      }
    } catch (fetchError) {
      console.error("Dashboard fetch error:", fetchError);

      setError(
        fetchError.message ||
          "Unable to load dashboard data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // -----------------------------------------------------
  // DASHBOARD DATA
  // -----------------------------------------------------

  const summary = dashboardData?.summary || {};

  const totalBids = Number(summary.total_bids || 0);

  const activeAuctions = Number(summary.active_auctions || 0);

  const wonAuctions = Number(summary.won_auctions || 0);

  // Spending stays static until payment records are implemented.
  const totalSpending = STATIC_SPENDING;

  const biddingData = useMemo(() => {
    const allActivity = dashboardData?.bidding_activity || [];

    const period = Number(activityPeriod);

    return allActivity.slice(-period);
  }, [dashboardData, activityPeriod]);

  const recentAuctions = dashboardData?.recent_auctions || [];

  const liveAuctions = dashboardData?.upcoming_auctions || [];

  const winningBids = Number(summary.winning_bids || 0);

  const outbidBids = Number(summary.outbid_bids || 0);

  const lostBids = Number(summary.lost_bids || 0);

  const cancelledBids = Number(summary.cancelled_bids || 0);

  const overviewTotal =
    winningBids + outbidBids + lostBids + cancelledBids;

  const winningPercentage =
    overviewTotal > 0
      ? Math.round((winningBids / overviewTotal) * 100)
      : 0;

  const outbidPercentage =
    overviewTotal > 0
      ? Math.round((outbidBids / overviewTotal) * 100)
      : 0;

  const lostPercentage =
    overviewTotal > 0
      ? Math.round((lostBids / overviewTotal) * 100)
      : 0;

  const cancelledPercentage =
    overviewTotal > 0
      ? Math.round((cancelledBids / overviewTotal) * 100)
      : 0;

  // -----------------------------------------------------
  // RECENT ACTIVITY (built only from data the API already returns)
  // -----------------------------------------------------

  const activityItems = useMemo(() => {
    const items = [];

    if (wonAuctions > 0) {
      items.push({
        key: "won",
        tone: "green",
        icon: FaTrophy,
        title: "You won an auction!",
        subtitle: `${wonAuctions} won so far`,
        path: "/dashboard/history/bid",
      });
    }

    if (totalBids > 0) {
      items.push({
        key: "bids",
        tone: "blue",
        icon: FaGavel,
        title: "New bid placed",
        subtitle: `${totalBids.toLocaleString()} total bids placed`,
        path: "/dashboard/history/bid",
      });
    }

    if (liveAuctions[0]) {
      items.push({
        key: "live",
        tone: "purple",
        icon: FaBell,
        title:
          liveAuctions[0].auction_status === "live"
            ? "Auction is live"
            : "Auction starting soon",
        subtitle: liveAuctions[0].title,
        meta: liveAuctions[0].time_left,
        path: getAuctionPath(liveAuctions[0]),
      });
    }

    if (outbidBids > 0) {
      items.push({
        key: "outbid",
        tone: "orange",
        icon: FaTag,
        title: "Outbid",
        subtitle: `${outbidBids} of your bids were outbid`,
        path: "/dashboard/history/bid",
      });
    }

    if (recentAuctions[0]) {
      items.push({
        key: "recent",
        tone: "red",
        icon: FaGavel,
        title: "New auction listed",
        subtitle: recentAuctions[0].title,
        meta: recentAuctions[0].time_left,
        path: getAuctionPath(recentAuctions[0]),
      });
    }

    return items.slice(0, 5);
  }, [
    wonAuctions,
    totalBids,
    outbidBids,
    liveAuctions,
    recentAuctions,
  ]);

  // -----------------------------------------------------
  // BUILD CHART PATH FROM REAL ACTIVITY
  // -----------------------------------------------------

  const chartGeometry = useMemo(() => {
    if (!biddingData.length) {
      return {
        linePath: "",
        areaPath: "",
        points: [],
        maxValue: 5,
      };
    }

    const width = 900;
    const height = 280;

    const values = biddingData.map((item) =>
      Number(item.value || 0)
    );

    const maxValue = Math.max(5, ...values);

    const points = values.map((value, index) => {
      const x =
        biddingData.length === 1
          ? width / 2
          : (index / (biddingData.length - 1)) * width;

      const y = height - (value / maxValue) * (height - 20);

      return { x, y, value };
    });

    const linePath = points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
      )
      .join(" ");

    const areaPath = [
      `M ${points[0].x} ${height}`,
      ...points.map(
        (point) => `L ${point.x} ${point.y}`
      ),
      `L ${points[points.length - 1].x} ${height}`,
      "Z",
    ].join(" ");

    return {
      linePath,
      areaPath,
      points,
      maxValue,
    };
  }, [biddingData]);

  // Client-side navigation (no full page reload)
  const goTo = (path) => {
    navigate(path);
  };

  // -----------------------------------------------------
  // RENDER
  // -----------------------------------------------------

  return (
    <div className="dashboard-home">
      <div className="dashboard-layout">
        {/* ===================================================
            MAIN COLUMN
        =================================================== */}

        <div className="dashboard-main-column">
          {/* WELCOME BANNER */}

          <section className="dashboard-welcome-banner">
            <div className="welcome-text">
              <h1>
                Welcome back,{" "}
                {user?.fullname || user?.username || "User"}!{" "}
                <span>👋</span>
              </h1>

              <p>Here's what's happening with your auctions today.</p>

              <div className="welcome-date">
                <FaRegCalendarAlt />
                <span>{formatToday()}</span>
              </div>
            </div>

            <div className="welcome-explore">
              <div className="welcome-explore-text">
                <h3>Explore New Auctions</h3>

                <p>Discover amazing items and start bidding today!</p>

                <button
                  type="button"
                  className="welcome-explore-btn"
                  onClick={() => goTo("/dashboard/all-auctions")}
                >
                  Browse Auctions
                  <FaArrowRight />
                </button>
              </div>

              <div className="welcome-explore-art" aria-hidden="true">
                <span>⌚</span>
                <span>📱</span>
                <span>👜</span>
              </div>
            </div>
          </section>

          {/* ERROR MESSAGE */}

          {error && (
            <div role="alert" className="dashboard-error">
              {error}

              <button type="button" onClick={fetchDashboard}>
                Retry
              </button>
            </div>
          )}

          {/* LOADING MESSAGE */}

          {loading && !dashboardData && (
            <div className="dashboard-loading">
              Loading your dashboard data...
            </div>
          )}

          {/* STAT CARDS */}

          <section className="dashboard-stat-grid">
            {/* TOTAL BIDS */}

            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon blue">
                <FaGavel />
              </div>

              <div className="dashboard-stat-content">
                <span>Total Bids</span>

                <h2>
                  {loading && !dashboardData
                    ? "—"
                    : totalBids.toLocaleString()}
                </h2>

                {summary.bids_change_available ? (
                  <p
                    className={
                      Number(summary.bids_change_percent || 0) >= 0
                        ? "stat-positive"
                        : "stat-negative"
                    }
                  >
                    {Number(summary.bids_change_percent || 0) >= 0 ? (
                      <FaArrowUp />
                    ) : (
                      <FaArrowDown />
                    )}

                    <b>{formatPercentage(summary.bids_change_percent)}</b>

                    <span>vs last 30 days</span>
                  </p>
                ) : (
                  <p className="stat-positive">
                    <FaGavel />
                    <span>Historical comparison unavailable</span>
                  </p>
                )}
              </div>
            </div>

            {/* ACTIVE AUCTIONS */}

            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon orange">
                <FaTag />
              </div>

              <div className="dashboard-stat-content">
                <span>Active Auctions</span>

                <h2>
                  {loading && !dashboardData
                    ? "—"
                    : activeAuctions.toLocaleString()}
                </h2>

                <p className="stat-positive">
                  <FaTag />
                  <span>Your auctions with active bids</span>
                </p>
              </div>
            </div>

            {/* WON AUCTIONS */}

            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon green">
                <FaTrophy />
              </div>

              <div className="dashboard-stat-content">
                <span>Won Auctions</span>

                <h2>
                  {loading && !dashboardData
                    ? "—"
                    : wonAuctions.toLocaleString()}
                </h2>

                <p className="stat-positive">
                  <FaTrophy />
                  <span>Provisional highest-bid results</span>
                </p>
              </div>
            </div>

            {/* TOTAL SPENDING */}

            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon purple">
                <FaWallet />
              </div>

              <div className="dashboard-stat-content">
                <span>Total Spending</span>

                <h2>{formatCurrency(totalSpending)}</h2>

                <p className="stat-negative">
                  <FaWallet />
                  <span>Static until payments are implemented</span>
                </p>
              </div>
            </div>
          </section>

          {/* GRAPH SECTION */}

          <section className="dashboard-analytics-grid">
            {/* BIDDING ACTIVITY */}

            <div className="dashboard-panel bidding-panel">
              <div className="dashboard-panel-header">
                <div className="panel-title-with-icon">
                  <i className="panel-title-icon">
                    <FaChartBar />
                  </i>

                  <h3>
                    Bidding Activity
                    <span>
                      {" "}
                      (
                      {activityPeriod === "7"
                        ? "Last 7 Days"
                        : activityPeriod === "30"
                        ? "Last 30 Days"
                        : "Last 3 Months"}
                      )
                    </span>
                  </h3>
                </div>

                <select
                  value={activityPeriod}
                  onChange={(event) =>
                    setActivityPeriod(event.target.value)
                  }
                >
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 3 Months</option>
                </select>
              </div>

              <div className="line-chart-container">
                <div className="chart-y-values">
                  {[5, 4, 3, 2, 1, 0].map((step) => (
                    <span key={step}>
                      {Math.ceil((chartGeometry.maxValue * step) / 5)}
                    </span>
                  ))}
                </div>

                <div className="line-chart">
                  <div className="chart-grid chart-grid-1"></div>
                  <div className="chart-grid chart-grid-2"></div>
                  <div className="chart-grid chart-grid-3"></div>
                  <div className="chart-grid chart-grid-4"></div>
                  <div className="chart-grid chart-grid-5"></div>
                  <div className="chart-grid chart-grid-6"></div>

                  <svg
                    viewBox="0 0 900 320"
                    preserveAspectRatio="none"
                    className="bidding-svg"
                  >
                    <defs>
                      <linearGradient
                        id="bidAreaGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#2166f3"
                          stopOpacity="0.20"
                        />

                        <stop
                          offset="100%"
                          stopColor="#2166f3"
                          stopOpacity="0.01"
                        />
                      </linearGradient>
                    </defs>

                    {chartGeometry.areaPath && (
                      <path
                        className="chart-area-fill"
                        d={chartGeometry.areaPath}
                        fill="url(#bidAreaGradient)"
                      />
                    )}

                    {chartGeometry.linePath && (
                      <path
                        className="chart-main-line"
                        d={chartGeometry.linePath}
                        fill="none"
                      />
                    )}

                    {chartGeometry.points.map((point, index) => (
                      <circle
                        key={`${point.x}-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r={
                          index === chartGeometry.points.length - 1
                            ? 5
                            : 2.5
                        }
                        className="chart-current-point"
                      >
                        <title>
                          {biddingData[index]?.date}: {point.value} bids
                        </title>
                      </circle>
                    ))}
                  </svg>

                  <div className="chart-x-values">
                    {biddingData
                      .filter((_, index) => {
                        const interval =
                          activityPeriod === "7"
                            ? 1
                            : activityPeriod === "30"
                            ? 5
                            : 15;

                        return index % interval === 0;
                      })
                      .map((item) => (
                        <span key={item.date}>{item.day}</span>
                      ))}
                  </div>
                </div>
              </div>

              {!loading && biddingData.every((item) => !item.value) && (
                <p className="panel-empty-note">
                  Your bidding activity will appear here when you place
                  bids.
                </p>
              )}
            </div>

            {/* BIDS OVERVIEW */}

            <div className="dashboard-panel bids-overview-panel">
              <div className="dashboard-panel-header">
                <div className="panel-title-with-icon">
                  <i className="panel-title-icon">
                    <FaChartPie />
                  </i>

                  <h3>Bids Overview</h3>
                </div>
              </div>

              <div className="donut-wrapper">
                <div
                  className="donut-chart"
                  style={{
                    background:
                      overviewTotal > 0
                        ? `conic-gradient(
                            #2166f3 0% ${winningPercentage}%,
                            #f59e0b ${winningPercentage}% ${
                              winningPercentage + outbidPercentage
                            }%,
                            #ef4444 ${
                              winningPercentage + outbidPercentage
                            }% ${
                              winningPercentage +
                              outbidPercentage +
                              lostPercentage
                            }%,
                            #22c55e ${
                              winningPercentage +
                              outbidPercentage +
                              lostPercentage
                            }% 100%
                          )`
                        : "conic-gradient(#e5e7eb 0% 100%)",
                  }}
                >
                  <div className="donut-center">
                    <strong>{totalBids.toLocaleString()}</strong>
                    <span>Total Bids</span>
                  </div>
                </div>

                <div className="donut-legend">
                  <div className="legend-row">
                    <div>
                      <i className="legend-blue"></i>
                      <span>Winning / Leading</span>
                    </div>

                    <strong>
                      {winningPercentage}% ({winningBids})
                    </strong>
                  </div>

                  <div className="legend-row">
                    <div>
                      <i className="legend-orange"></i>
                      <span>Outbid</span>
                    </div>

                    <strong>
                      {outbidPercentage}% ({outbidBids})
                    </strong>
                  </div>

                  <div className="legend-row">
                    <div>
                      <i className="legend-red"></i>
                      <span>Lost</span>
                    </div>

                    <strong>
                      {lostPercentage}% ({lostBids})
                    </strong>
                  </div>

                  <div className="legend-row">
                    <div>
                      <i className="legend-green"></i>
                      <span>Cancelled</span>
                    </div>

                    <strong>
                      {cancelledPercentage}% ({cancelledBids})
                    </strong>
                  </div>
                </div>
              </div>

              <p className="panel-footnote">
                Leading and winning counts are estimates based on current
                bid records. Cancelled bids are not recorded separately
                yet.
              </p>
            </div>
          </section>

          {/* RECENT AUCTIONS */}

          <section className="dashboard-panel recent-auctions-panel">
            <div className="dashboard-panel-header">
              <div className="panel-title-with-icon">
                <i className="panel-title-icon round">
                  <FaGavel />
                </i>

                <h3>Recent Auctions</h3>
              </div>

              <button
                type="button"
                className="view-all-btn"
                onClick={() => goTo("/dashboard/all-auctions")}
              >
                View All <FaArrowRight />
              </button>
            </div>

            <div className="recent-auction-grid">
              {recentAuctions.map((auction) => {
                const imageUrl = getImageUrl(auction.image);

                return (
                  <div
                    className="recent-auction-card"
                    key={auction.id}
                  >
                    <div
                      className={`auction-image-placeholder ${
                        auction.category || "general"
                      }`}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={auction.title}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span>{getAuctionIcon(auction.category)}</span>
                      )}

                      {auction.auction_status === "live" && (
                        <b className="auction-live-tag">Live</b>
                      )}

                      {auction.auction_status === "upcoming" && (
                        <b className="auction-live-tag upcoming">
                          Upcoming
                        </b>
                      )}
                    </div>

                    <div className="recent-auction-info">
                      <h4>{auction.title}</h4>

                      <span className="auction-category">
                        {auction.category}
                      </span>

                      <strong>{formatCurrency(auction.current_bid)}</strong>

                      <em>
                        <FaRegClock />
                        {auction.time_left}
                      </em>
                    </div>
                  </div>
                );
              })}
            </div>

            {!loading && recentAuctions.length === 0 && (
              <p className="panel-empty-note">
                No auctions are available yet.
              </p>
            )}
          </section>

          {/* UPCOMING / LIVE AUCTIONS */}

          <section className="dashboard-panel upcoming-panel">
            <div className="dashboard-panel-header">
              <div className="panel-title-with-icon">
                <i className="panel-title-icon round purple">
                  <FaBell />
                </i>

                <h3>Upcoming Live Auctions</h3>
              </div>

              <button
                type="button"
                className="view-all-btn"
                onClick={() => goTo("/dashboard/all-auctions")}
              >
                View All <FaArrowRight />
              </button>
            </div>

            <div className="live-auction-list">
              {liveAuctions.map((auction) => {
                const imageUrl = getImageUrl(auction.image);

                return (
                  <div className="live-auction-row" key={auction.id}>
                    <div className="live-auction-image">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={auction.title}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span>{getAuctionIcon(auction.category)}</span>
                      )}
                    </div>

                    <div className="live-auction-details">
                      <div className="live-title">
                        <span className="live-badge">
                          {auction.auction_status === "live"
                            ? "LIVE"
                            : "UPCOMING"}
                        </span>

                        <strong>{auction.title}</strong>
                      </div>

                      <div className="live-time">
                        <FaRegClock />
                        <small>
                          {auction.auction_status === "live"
                            ? "Ends in"
                            : "Starts in"}
                        </small>
                        <b>{auction.time_left}</b>
                      </div>

                      <div className="live-price">
                        <strong>
                          {formatCurrency(auction.current_bid)}
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="remind-btn"
                        onClick={() => goTo(getAuctionPath(auction))}
                      >
                        <FaBell />
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {!loading && liveAuctions.length === 0 && (
              <p className="panel-empty-note">
                There are no upcoming or live auctions right now.
              </p>
            )}
          </section>
        </div>

        {/* ===================================================
            SIDE COLUMN
        =================================================== */}

        <aside className="dashboard-side-column">
          {/* QUICK ACTIONS */}

          <section className="dashboard-panel quick-actions-panel">
            <div className="dashboard-panel-header">
              <h3 className="side-title">Quick Actions</h3>
            </div>

            <div className="quick-action-list">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    type="button"
                    key={action.key}
                    className="quick-action-item"
                    onClick={() => goTo(action.path)}
                  >
                    <span className={`quick-action-icon ${action.tone}`}>
                      <Icon />
                    </span>

                    <span className="quick-action-text">
                      <strong>{action.title}</strong>
                      <small>{action.subtitle}</small>
                    </span>

                    <FaChevronRight className="quick-action-arrow" />
                  </button>
                );
              })}
            </div>
          </section>

          {/* RECENT ACTIVITY */}

          <section className="dashboard-panel recent-activity-panel">
            <div className="dashboard-panel-header">
              <h3 className="side-title">Recent Activity</h3>

              <button
                type="button"
                className="view-all-btn"
                onClick={() => goTo("/dashboard/history/bid")}
              >
                View All <FaArrowRight />
              </button>
            </div>

            <div className="activity-list">
              {activityItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    type="button"
                    key={item.key}
                    className="activity-item"
                    onClick={() => goTo(item.path)}
                  >
                    <span className={`activity-icon ${item.tone}`}>
                      <Icon />
                    </span>

                    <span className="activity-text">
                      <strong>{item.title}</strong>
                      <small>{item.subtitle}</small>
                      {item.meta && <em>{item.meta}</em>}
                    </span>

                    <FaChevronRight className="quick-action-arrow" />
                  </button>
                );
              })}
            </div>

            {!loading && activityItems.length === 0 && (
              <p className="panel-empty-note">
                Your recent activity will appear here.
              </p>
            )}
          </section>

          {/* NEED HELP */}

          <section className="dashboard-help-card">
            <div className="help-text">
              <h3>Need Help?</h3>

              <p>
                Our support team is here for you 24/7. Get instant help
                with any questions.
              </p>

              <button
                type="button"
                onClick={() => goTo("/contact")}
              >
                Contact Support
                <FaArrowRight />
              </button>
            </div>

            <div className="help-icon">
              <FaHeadset />
            </div>
          </section>

          {/* RECOMMENDED AUCTIONS */}

          <div className="dashboard-recommended">
            <RecommendedAuctions limit={3} compact />
          </div>
        </aside>
      </div>

      {/* TRUST / FEATURE STRIP */}

      <section className="dashboard-feature-strip">
        <div className="dashboard-feature">
          <div className="feature-icon secure">
            <FaShieldAlt />
          </div>

          <div>
            <strong>Secure Payments</strong>
            <span>100% secure payment gateway</span>
          </div>
        </div>

        <div className="dashboard-feature">
          <div className="feature-icon verified">
            <FaUserCheck />
          </div>

          <div>
            <strong>Verified Sellers</strong>
            <span>Trusted and verified sellers only</span>
          </div>
        </div>

        <div className="dashboard-feature">
          <div className="feature-icon support">
            <FaHeadset />
          </div>

          <div>
            <strong>24/7 Support</strong>
            <span>We are here to help you</span>
          </div>
        </div>

        <div className="dashboard-feature">
          <div className="feature-icon returns">
            <FaUndo />
          </div>

          <div>
            <strong>Easy Returns</strong>
            <span>Hassle free returns policy</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="dashboard-footer">
        <span>© {new Date().getFullYear()} Bidora. All rights reserved.</span>
        <span>Smart Bidding • Valuable Finds • A Better Tomorrow</span>
      </footer>

      {/* AURORA CHATBOT */}

      <AuroraChatbot />
    </div>
  );
}

export default DashboardHome;
