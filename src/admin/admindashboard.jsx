import "../styles/admindashboard.css";

import {
  FaTachometerAlt,
  FaUsers,
  FaUserShield,
  FaGavel,
  FaMoneyCheckAlt,
  FaChartLine,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaSearch,
  FaBars,
  FaTrophy,
} from "react-icons/fa";

import { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";


function AdminDashboard() {

  const navigate = useNavigate();
  const location = useLocation();

  const [userMenu, setUserMenu] = useState(false);
  const [auctionMenu, setAuctionMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);


  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = () => {

    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (confirmLogout) {

      localStorage.removeItem("adminLoggedIn");

      navigate("/admin/login");

    }

  };


  /* =====================================================
     NAVIGATION
  ===================================================== */

  const goTo = (path) => {
    navigate(path);
  };


  /* =====================================================
     DROPDOWN HANDLERS
  ===================================================== */

  const toggleUsers = () => {
    setUserMenu(!userMenu);
    setAuctionMenu(false);
  };


  const toggleAuctions = () => {
    setAuctionMenu(!auctionMenu);
    setUserMenu(false);
  };


  return (

    <div className="admin-dashboard">


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`sidebar ${
          sidebarOpen ? "open" : "closed"
        }`}
      >


        {/* ================= LOGO ================= */}

        <div className="logo">

          <div className="logo-icon">
            ⚖
          </div>

          <div className="logo-text">

            <h2>BIDORA</h2>

            <span>Auction Admin</span>

          </div>

        </div>


        {/* ================= SIDEBAR MENU ================= */}

        <ul className="sidebar-menu">


          {/* =================================================
              DASHBOARD
          ================================================= */}

          <li
            className={
              location.pathname === "/admin/dashboard"
                ? "active"
                : ""
            }

            onClick={() =>
              goTo("/admin/dashboard")
            }
          >

            <FaTachometerAlt />

            <span>Dashboard</span>

          </li>


          {/* =================================================
              USERS
          ================================================= */}

          <li
  className={`dropdown ${userMenu ? "dropdown-open" : ""}`}
  onClick={toggleUsers}
>
  <div className="dropdown-title">

    <span className="menu-label">
      <FaUsers />
      <span>Users</span>
    </span>

    <span className="arrow">
      {userMenu ? "▲" : "▼"}
    </span>

  </div>

  {userMenu && (
    <ul className="submenu">

      <li
  onClick={(e) => {
    e.stopPropagation();
    goTo("/admin/dashboard/users");
  }}
>
  All Users
</li>

      <li
        onClick={(e) => {
          e.stopPropagation();
          goTo("/admin/users/pending");
        }}
      >
        Pending Users
      </li>

    </ul>
  )}

</li>
         


          


          {/* =================================================
              AUCTIONS
          ================================================= */}

          <li
  className={`dropdown ${auctionMenu ? "dropdown-open" : ""}`}
  onClick={toggleAuctions}
>
  <div className="dropdown-title">

    <span className="menu-label">
      <FaGavel />
      <span>Auctions</span>
    </span>

    <span className="arrow">
      {auctionMenu ? "▲" : "▼"}
    </span>

  </div>

  {auctionMenu && (
    <ul className="submenu">

      <li
        onClick={(e) => {
          e.stopPropagation();
          goTo("/admin/auctions");
        }}
      >
        All Auctions
      </li>

      <li
        onClick={(e) => {
          e.stopPropagation();
          goTo("/admin/auctions/live");
        }}
      >
        Live Auctions
      </li>

      <li
        onClick={(e) => {
          e.stopPropagation();
          goTo("/admin/auctions/pending");
        }}
      >
        Pending Auctions
      </li>

      <li
        onClick={(e) => {
          e.stopPropagation();
          goTo("/admin/auctions/completed");
        }}
      >
        Completed Auctions
      </li>

    </ul>
  )}

</li>


          {/* =================================================
              BIDS
          ================================================= */}

          <li
            onClick={() =>
              goTo("/admin/bids")
            }
          >

            <FaGavel />

            <span>Bids</span>

          </li>


          {/* =================================================
              WINNERS
          ================================================= */}

          <li
            onClick={() =>
              goTo("/admin/winners")
            }
          >

            <FaTrophy />

            <span>Winners</span>

          </li>


          {/* =================================================
              PAYMENTS
          ================================================= */}

          <li
            onClick={() =>
              goTo("/admin/payments")
            }
          >

            <FaMoneyCheckAlt />

            <span>Payments</span>

          </li>


          {/* =================================================
              REPORTS
          ================================================= */}

          <li
            onClick={() =>
              goTo("/admin/reports")
            }
          >

            <FaChartLine />

            <span>Reports & Analytics</span>

          </li>


          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          <li
            onClick={() =>
              goTo("/admin/notifications")
            }
          >

            <FaBell />

            <span>Notifications</span>

          </li>


          {/* =================================================
              SETTINGS
          ================================================= */}

          <li
            onClick={() =>
              goTo("/admin/settings")
            }
          >

            <FaCog />

            <span>Settings</span>

          </li>

        </ul>


        {/* =================================================
            LOGOUT
        ================================================= */}

        <div
          className="logout"
          onClick={handleLogout}
        >

          <FaSignOutAlt />

          <span>Logout</span>

        </div>

      </aside>


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div
        className={`main-content ${
          sidebarOpen ? "" : "expanded"
        }`}
      >


        {/* =================================================
            TOP NAVBAR
        ================================================= */}

        <header className="topbar">


          {/* LEFT */}

          <div className="topbar-left">

            <FaBars
              className="menu-icon"

              onClick={() =>
                setSidebarOpen(!sidebarOpen)
              }

            />


            {/* SEARCH */}

            <div className="search-box">

              <FaSearch />

              <input
                type="text"
                placeholder="Search anything..."
              />

            </div>

          </div>


          {/* RIGHT */}

          <div className="topbar-right">


            {/* NOTIFICATION */}

            <div className="notification">

              <FaBell />

              <span className="notification-count">
                5
              </span>

            </div>


            {/* ADMIN PROFILE */}

            <div className="profile">

              <img
                src="https://i.pravatar.cc/100?img=12"
                alt="Admin"
              />


              <div className="profile-info">

                <h4>Admin</h4>

                <p>Super Admin</p>

              </div>


              <span className="profile-arrow">
                ▼
              </span>

            </div>

          </div>

        </header>


        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <main className="page-content">

          <Outlet />

        </main>

      </div>

    </div>

  );

}


export default AdminDashboard;