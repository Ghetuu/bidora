import "../styles/adminhome.css";

import {
  FaUsers,
  FaGavel,
  FaTrophy,
  FaRupeeSign,
  FaArrowUp,
  FaCalendarAlt,
} from "react-icons/fa";

function AdminHome() {

  return (
    <div className="admin-home">

      {/* ================= HEADER ================= */}

      <div className="dashboard-header">

        <div>

          <h1>Dashboard</h1>

          <p>
            Welcome back, Admin! Here's what's happening
            with Bidora today.
          </p>

        </div>

        <button className="date-button">
          <FaCalendarAlt />
          May 20, 2024
          <span>▼</span>
        </button>

      </div>


      {/* ================= STAT CARDS ================= */}

      <div className="stats-grid">

        {/* Users */}

        <div className="stat-card purple">

          <div className="stat-icon">
            <FaUsers />
          </div>

          <div className="stat-details">

            <span>Total Users</span>

            <h2>2,540</h2>

            <p>
              <FaArrowUp />
              12.5% this month
            </p>

          </div>

        </div>


        {/* Auctions */}

        <div className="stat-card blue">

          <div className="stat-icon">
            <FaGavel />
          </div>

          <div className="stat-details">

            <span>Active Auctions</span>

            <h2>126</h2>

            <p>
              <FaArrowUp />
              8.2% this month
            </p>

          </div>

        </div>


        {/* Bids */}

        <div className="stat-card orange">

          <div className="stat-icon">
            <FaGavel />
          </div>

          <div className="stat-details">

            <span>Total Bids</span>

            <h2>18,420</h2>

            <p>
              <FaArrowUp />
              15.3% this month
            </p>

          </div>

        </div>


        {/* Winners */}

        <div className="stat-card green">

          <div className="stat-icon">
            <FaTrophy />
          </div>

          <div className="stat-details">

            <span>Total Winners</span>

            <h2>842</h2>

            <p>
              <FaArrowUp />
              10.7% this month
            </p>

          </div>

        </div>


        {/* Revenue */}

        <div className="stat-card pink">

          <div className="stat-icon">
            <FaRupeeSign />
          </div>

          <div className="stat-details">

            <span>Total Revenue</span>

            <h2>₹24,68,500</h2>

            <p>
              <FaArrowUp />
              16.8% this month
            </p>

          </div>

        </div>

      </div>


      {/* ================= CHART ROW ================= */}

      <div className="dashboard-grid">


        {/* Bid Activity */}

        <div className="dashboard-card bid-chart">

          <div className="card-header">

            <div>

              <h3>Bid Activity</h3>

              <span>This Month</span>

            </div>

            <select>
              <option>This Month</option>
              <option>Last Month</option>
              <option>This Year</option>
            </select>

          </div>


          <div className="line-chart">

            <div className="y-labels">
              <span>4K</span>
              <span>3K</span>
              <span>2K</span>
              <span>1K</span>
              <span>0</span>
            </div>

            <div className="chart-area">

              <div className="grid-line line1"></div>
              <div className="grid-line line2"></div>
              <div className="grid-line line3"></div>
              <div className="grid-line line4"></div>

              <svg
                viewBox="0 0 500 200"
                preserveAspectRatio="none"
              >

                <polyline
                  points="
                    10,150
                    55,140
                    100,135
                    145,120
                    190,90
                    235,75
                    280,45
                    325,80
                    370,50
                    415,72
                    460,115
                    495,100
                  "
                  fill="none"
                  stroke="#6d4aff"
                  strokeWidth="4"
                />

              </svg>

              <div className="x-labels">
                <span>May 1</span>
                <span>May 6</span>
                <span>May 11</span>
                <span>May 16</span>
                <span>May 20</span>
              </div>

            </div>

          </div>

        </div>


        {/* Revenue */}

        <div className="dashboard-card revenue-chart">

          <div className="card-header">

            <div>

              <h3>Revenue Overview</h3>

              <h2>₹24,68,500</h2>

              <span>Total Auction Revenue</span>

            </div>

            <select>
              <option>This Month</option>
              <option>Last Month</option>
            </select>

          </div>


          <div className="bar-chart">

            <div className="bars">

              <div style={{ height: "35%" }}></div>
              <div style={{ height: "48%" }}></div>
              <div style={{ height: "30%" }}></div>
              <div style={{ height: "65%" }}></div>
              <div style={{ height: "42%" }}></div>
              <div style={{ height: "72%" }}></div>
              <div style={{ height: "52%" }}></div>
              <div style={{ height: "80%" }}></div>
              <div style={{ height: "44%" }}></div>
              <div style={{ height: "68%" }}></div>

            </div>

            <div className="bar-labels">
              <span>May 1</span>
              <span>May 6</span>
              <span>May 11</span>
              <span>May 16</span>
              <span>May 20</span>
            </div>

          </div>

        </div>


        {/* Auction Status */}

        <div className="dashboard-card">

          <div className="card-header">

            <h3>Auction Status</h3>

          </div>

          <div className="donut-container">

            <div className="donut">

              <div className="donut-center">
                <strong>1,037</strong>
                <span>Total</span>
              </div>

            </div>

            <div className="legend">

              <p>
                <i className="green-dot"></i>
                Active
                <b>126 (36%)</b>
              </p>

              <p>
                <i className="blue-dot"></i>
                Upcoming
                <b>48 (14%)</b>
              </p>

              <p>
                <i className="purple-dot"></i>
                Completed
                <b>842 (48%)</b>
              </p>

              <p>
                <i className="red-dot"></i>
                Cancelled
                <b>21 (6%)</b>
              </p>

            </div>

          </div>

        </div>

      </div>


      {/* ================= SECOND ROW ================= */}

      <div className="dashboard-grid second-row">


        {/* Categories */}

        <div className="dashboard-card">

          <div className="card-header">
            <h3>Top Categories by Auction</h3>
          </div>

          <div className="category-content">

            <div className="category-donut"></div>

            <div className="category-list">

              <p>
                <i className="purple-dot"></i>
                Electronics
                <b>412 (39%)</b>
              </p>

              <p>
                <i className="blue-dot"></i>
                Vehicles
                <b>256 (24%)</b>
              </p>

              <p>
                <i className="orange-dot"></i>
                Watches
                <b>198 (19%)</b>
              </p>

              <p>
                <i className="green-dot"></i>
                Art & Collectibles
                <b>112 (11%)</b>
              </p>

              <p>
                <i className="red-dot"></i>
                Others
                <b>59 (7%)</b>
              </p>

            </div>

          </div>

        </div>


        {/* Top Sellers */}

        <div className="dashboard-card">

          <div className="card-header">

            <h3>Top Sellers</h3>

            <button>View All</button>

          </div>

          <div className="seller-list">

            <div className="seller">

              <span className="rank">1</span>

              <img
                src="https://i.pravatar.cc/50?img=12"
                alt=""
              />

              <div>
                <strong>Rahul Sharma</strong>
                <small>47 Auctions</small>
              </div>

              <b>₹8,45,000</b>

            </div>


            <div className="seller">

              <span className="rank">2</span>

              <img
                src="https://i.pravatar.cc/50?img=47"
                alt=""
              />

              <div>
                <strong>Priya Verma</strong>
                <small>35 Auctions</small>
              </div>

              <b>₹6,32,000</b>

            </div>


            <div className="seller">

              <span className="rank">3</span>

              <img
                src="https://i.pravatar.cc/50?img=11"
                alt=""
              />

              <div>
                <strong>Amit Patel</strong>
                <small>29 Auctions</small>
              </div>

              <b>₹5,21,000</b>

            </div>

          </div>

        </div>


        {/* Winners */}

        <div className="dashboard-card">

          <div className="card-header">

            <h3>Recent Winners</h3>

            <button>View All</button>

          </div>

          <div className="winner-list">

            <div className="winner">

              <div className="product-placeholder">
                📱
              </div>

              <div>
                <strong>Rahul Sharma</strong>
                <small>iPhone 15 Pro Max</small>
              </div>

              <b>₹72,000</b>

            </div>


            <div className="winner">

              <div className="product-placeholder">
                💻
              </div>

              <div>
                <strong>Priya Verma</strong>
                <small>MacBook Air M2</small>
              </div>

              <b>₹91,500</b>

            </div>


            <div className="winner">

              <div className="product-placeholder">
                ⌚
              </div>

              <div>
                <strong>Amit Patel</strong>
                <small>Rolex Submariner</small>
              </div>

              <b>₹45,000</b>

            </div>

          </div>

        </div>

      </div>


      {/* ================= TABLES ================= */}

      <div className="tables-grid">


        {/* Latest Bids */}

        <div className="dashboard-card table-card">

          <div className="card-header">

            <h3>Latest Bids</h3>

            <button>View All</button>

          </div>

          <div className="table-wrapper">

            <table>

              <thead>

                <tr>
                  <th>Bidder</th>
                  <th>Auction</th>
                  <th>Bid Amount</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>

              </thead>

              <tbody>

                <tr>
                  <td>Rahul Sharma</td>
                  <td>iPhone 15 Pro Max</td>
                  <td>₹72,000</td>
                  <td>10:42 AM</td>
                  <td>
                    <span className="status highest">
                      Highest
                    </span>
                  </td>
                </tr>

                <tr>
                  <td>Priya Verma</td>
                  <td>MacBook Air M2</td>
                  <td>₹91,500</td>
                  <td>10:35 AM</td>
                  <td>
                    <span className="status highest">
                      Highest
                    </span>
                  </td>
                </tr>

                <tr>
                  <td>Amit Patel</td>
                  <td>Rolex Submariner</td>
                  <td>₹45,000</td>
                  <td>10:28 AM</td>
                  <td>
                    <span className="status outbid">
                      Outbid
                    </span>
                  </td>
                </tr>

                <tr>
                  <td>Neha Singh</td>
                  <td>Sony Camera A7 IV</td>
                  <td>₹68,000</td>
                  <td>10:15 AM</td>
                  <td>
                    <span className="status outbid">
                      Outbid
                    </span>
                  </td>
                </tr>

                <tr>
                  <td>Vikram Rao</td>
                  <td>Gaming Laptop</td>
                  <td>₹55,000</td>
                  <td>10:05 AM</td>
                  <td>
                    <span className="status outbid">
                      Outbid
                    </span>
                  </td>
                </tr>

              </tbody>

            </table>

          </div>

        </div>


        {/* Payments */}

        <div className="dashboard-card table-card">

          <div className="card-header">

            <h3>Recent Payments</h3>

            <button>View All</button>

          </div>

          <div className="table-wrapper">

            <table>

              <thead>

                <tr>
                  <th>Winner</th>
                  <th>Auction</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>

              </thead>

              <tbody>

                <tr>
                  <td>Rahul Sharma</td>
                  <td>iPhone 15 Pro Max</td>
                  <td>₹72,000</td>
                  <td>
                    <span className="status paid">
                      Paid
                    </span>
                  </td>
                  <td>20 May, 10:45</td>
                </tr>

                <tr>
                  <td>Priya Verma</td>
                  <td>MacBook Air M2</td>
                  <td>₹91,500</td>
                  <td>
                    <span className="status pending">
                      Pending
                    </span>
                  </td>
                  <td>20 May, 10:36</td>
                </tr>

                <tr>
                  <td>Amit Patel</td>
                  <td>Rolex Submariner</td>
                  <td>₹45,000</td>
                  <td>
                    <span className="status paid">
                      Paid
                    </span>
                  </td>
                  <td>20 May, 10:30</td>
                </tr>

                <tr>
                  <td>Neha Singh</td>
                  <td>Sony Camera A7 IV</td>
                  <td>₹68,000</td>
                  <td>
                    <span className="status failed">
                      Failed
                    </span>
                  </td>
                  <td>20 May, 10:18</td>
                </tr>

                <tr>
                  <td>Vikram Rao</td>
                  <td>Gaming Laptop</td>
                  <td>₹55,000</td>
                  <td>
                    <span className="status pending">
                      Pending
                    </span>
                  </td>
                  <td>20 May, 10:08</td>
                </tr>

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>
  );
}

export default AdminHome;