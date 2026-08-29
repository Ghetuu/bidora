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
  FaClock,
} from "react-icons/fa";
import { useState } from "react";

import "../styles/dashboard_home.css";

function DashboardHome() {

    const [user, setUser] = useState(() => {
  const storedUser = localStorage.getItem("user");
  return storedUser ? JSON.parse(storedUser) : null;
});

  // ==========================================
  // GRAPH DATA
  // ==========================================

  const biddingData = [
    { day: "May 5", value: 25 },
    { day: "May 7", value: 38 },
    { day: "May 10", value: 125 },
    { day: "May 12", value: 105 },
    { day: "May 14", value: 190 },
    { day: "May 16", value: 155 },
    { day: "May 19", value: 95 },
    { day: "May 22", value: 140 },
    { day: "May 25", value: 90 },
    { day: "May 27", value: 180 },
    { day: "May 30", value: 165 },
    { day: "Jun 1", value: 175 },
    { day: "Jun 2", value: 150 },
    { day: "Jun 3", value: 220 },
    { day: "Jun 4", value: 145 },
  ];

  // ==========================================
  // RECENT AUCTIONS
  // ==========================================

  const recentAuctions = [
    {
      name: "Rolex Submariner",
      category: "Luxury Watches",
      price: "$8,750",
      time: "2h 15m left",
      icon: "⌚",
      type: "watch",
    },
    {
      name: "Vintage Oil Painting",
      category: "Art & Collectibles",
      price: "$1,250",
      time: "5h 40m left",
      icon: "🖼️",
      type: "art",
    },
    {
      name: "Louis Vuitton Neverfull",
      category: "Fashion",
      price: "$620",
      time: "1d 3h left",
      icon: "👜",
      type: "bag",
    },
    {
      name: "Canon EOS R5",
      category: "Electronics",
      price: "$2,150",
      time: "2d 6h left",
      icon: "📷",
      type: "camera",
    },
  ];

  // ==========================================
  // UPCOMING LIVE AUCTIONS
  // ==========================================

  const liveAuctions = [
    {
      name: "2021 Tesla Model S Plaid",
      starts: "00h 45m 30s",
      price: "$80,000 - $90,000",
      icon: "🚗",
    },
    {
      name: "2.5ct Diamond Ring",
      starts: "01h 30m 10s",
      price: "$12,000 - $15,000",
      icon: "💎",
    },
    {
      name: "1907 Gold Saint-Gaudens $20",
      starts: "03h 15m 45s",
      price: "$2,500 - $3,500",
      icon: "🪙",
    },
  ];

  return (
    <div className="dashboard-home">

      {/* ==================================================
          WELCOME HEADER
      ================================================== */}

      <section className="dashboard-home-header">

        <div>
          <h1>
            Welcome back, {user?.fullname || "User"}! <span>👋</span>
          </h1>

          <p>
            Here's what's happening with your auctions today.
          </p>
        </div>

      </section>


      {/* ==================================================
          STAT CARDS
      ================================================== */}

      <section className="dashboard-stat-grid">

        {/* TOTAL BIDS */}

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon blue">
            <FaGavel />
          </div>

          <div className="dashboard-stat-content">

            <span>Total Bids</span>

            <h2>1,248</h2>

            <p className="stat-positive">
              <FaArrowUp />
              18.6%
              <span>vs last 30 days</span>
            </p>

          </div>

        </div>


        {/* ACTIVE AUCTIONS */}

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon orange">
            <FaTag />
          </div>

          <div className="dashboard-stat-content">

            <span>Active Auctions</span>

            <h2>12</h2>

            <p className="stat-positive">
              <FaArrowUp />
              9.1%
              <span>vs last 30 days</span>
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

            <h2>7</h2>

            <p className="stat-positive">
              <FaArrowUp />
              16.7%
              <span>vs last 30 days</span>
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

            <h2>$4,982.50</h2>

            <p className="stat-negative">
              <FaArrowDown />
              6.3%
              <span>vs last 30 days</span>
            </p>

          </div>

        </div>

      </section>


      {/* ==================================================
          GRAPH SECTION
      ================================================== */}

      <section className="dashboard-analytics-grid">

        {/* ================================================
            BIDDING ACTIVITY
        ================================================= */}

        <div className="dashboard-panel bidding-panel">

          <div className="dashboard-panel-header">

            <div>
              <h3>
                Bidding Activity
                <span> (Last 30 Days)</span>
              </h3>
            </div>

            <select defaultValue="30">
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 3 Months</option>
            </select>

          </div>


          <div className="line-chart-container">

            <div className="chart-y-values">
              <span>250</span>
              <span>200</span>
              <span>150</span>
              <span>100</span>
              <span>50</span>
              <span>0</span>
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


                {/* AREA */}

                <path
                  className="chart-area-fill"
                  d="
                    M 0 285
                    C 25 275, 35 270, 55 250
                    C 80 225, 95 150, 130 170
                    C 160 188, 175 190, 200 190
                    C 225 188, 245 75, 280 105
                    C 315 125, 335 140, 365 190
                    C 390 225, 420 150, 450 145
                    C 480 140, 505 215, 530 220
                    C 560 230, 575 95, 615 80
                    C 650 70, 670 115, 700 105
                    C 730 95, 745 120, 765 95
                    C 790 65, 810 175, 830 35
                    C 850 110, 875 90, 900 95
                    L 900 320
                    L 0 320
                    Z
                  "
                />


                {/* LINE */}

                <path
                  className="chart-main-line"
                  d="
                    M 0 285
                    C 25 275, 35 270, 55 250
                    C 80 225, 95 150, 130 170
                    C 160 188, 175 190, 200 190
                    C 225 188, 245 75, 280 105
                    C 315 125, 335 140, 365 190
                    C 390 225, 420 150, 450 145
                    C 480 140, 505 215, 530 220
                    C 560 230, 575 95, 615 80
                    C 650 70, 670 115, 700 105
                    C 730 95, 745 120, 765 95
                    C 790 65, 810 175, 830 35
                    C 850 110, 875 90, 900 95
                  "
                />


                {/* POINTS */}

                <circle
                  cx="830"
                  cy="35"
                  r="7"
                  className="chart-current-point"
                />

              </svg>


              <div className="chart-x-values">

                {biddingData
                  .filter((_, index) => index % 2 === 0)
                  .map((item) => (
                    <span key={item.day}>
                      {item.day}
                    </span>
                  ))}

              </div>

            </div>

          </div>

        </div>


        {/* ================================================
            BIDS OVERVIEW
        ================================================= */}

        <div className="dashboard-panel bids-overview-panel">

          <div className="dashboard-panel-header">

            <div>
              <h3>Bids Overview</h3>
            </div>

          </div>


          <div className="donut-wrapper">

            <div className="donut-chart">

              <div className="donut-center">

                <strong>1,248</strong>

                <span>Total Bids</span>

              </div>

            </div>


            <div className="donut-legend">

              <div className="legend-row">

                <div>
                  <i className="legend-blue"></i>
                  <span>Winning Bids</span>
                </div>

                <strong>32% (399)</strong>

              </div>


              <div className="legend-row">

                <div>
                  <i className="legend-orange"></i>
                  <span>Outbid</span>
                </div>

                <strong>45% (561)</strong>

              </div>


              <div className="legend-row">

                <div>
                  <i className="legend-red"></i>
                  <span>Lost</span>
                </div>

                <strong>18% (224)</strong>

              </div>


              <div className="legend-row">

                <div>
                  <i className="legend-green"></i>
                  <span>Cancelled</span>
                </div>

                <strong>5% (64)</strong>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ==================================================
          RECENT + UPCOMING
      ================================================== */}

      <section className="dashboard-bottom-grid">


        {/* ================================================
            RECENT AUCTIONS
        ================================================= */}

        <div className="dashboard-panel recent-auctions-panel">

          <div className="dashboard-panel-header">

            <h3>Recent Auctions</h3>

            <button className="view-all-btn">
              View All
            </button>

          </div>


          <div className="recent-auction-grid">

            {recentAuctions.map((auction) => (

              <div
                className="recent-auction-card"
                key={auction.name}
              >

                <div
                  className={`auction-image-placeholder ${auction.type}`}
                >
                  <span>{auction.icon}</span>
                </div>


                <div className="recent-auction-info">

                  <h4>{auction.name}</h4>

                  <span className="auction-category">
                    {auction.category}
                  </span>

                  <small>
                    Current Bid
                  </small>

                  <strong>
                    {auction.price}
                  </strong>

                  <em>
                    {auction.time}
                  </em>

                </div>

              </div>

            ))}

          </div>

        </div>


        {/* ================================================
            UPCOMING LIVE AUCTIONS
        ================================================= */}

        <div className="dashboard-panel upcoming-panel">

          <div className="dashboard-panel-header">

            <h3>Upcoming Live Auctions</h3>

            <button className="view-all-btn">
              View All
            </button>

          </div>


          <div className="live-auction-list">

            {liveAuctions.map((auction) => (

              <div
                className="live-auction-row"
                key={auction.name}
              >

                <div className="live-auction-image">
                  <span>{auction.icon}</span>
                </div>


                <div className="live-auction-details">

                  <div className="live-title">

                    <span className="live-badge">
                      LIVE
                    </span>

                    <strong>
                      {auction.name}
                    </strong>

                  </div>

                  <small>
                    Starts in
                  </small>

                  <b>
                    {auction.starts}
                  </b>

                </div>


                <div className="live-price">

                  <small>
                    Est. Price
                  </small>

                  <strong>
                    {auction.price}
                  </strong>

                </div>


                <button className="remind-btn">

                  <FaBell />

                  Remind Me

                </button>

              </div>

            ))}

          </div>

        </div>

      </section>


      {/* ==================================================
          TRUST / FEATURE STRIP
      ================================================== */}

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

    </div>
  );
}

export default DashboardHome;