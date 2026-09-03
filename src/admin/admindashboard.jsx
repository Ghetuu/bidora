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

import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";


function AdminDashboard() {

  const navigate = useNavigate();
  const location = useLocation();

  const [userMenu, setUserMenu] = useState(false);
  const [auctionMenu, setAuctionMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  /* =====================================================
     NOTIFICATIONS
  ===================================================== */

  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationPopup, setNotificationPopup] = useState(false);


  /* =====================================================
     FETCH NOTIFICATIONS
  ===================================================== */

  useEffect(() => {

    const fetchNotifications = async () => {

      try {

        const response = await fetch(
          "http://127.0.0.1:8000/admin/notifications"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch notifications");
        }

        const data = await response.json();

        setNotifications(data);

        const unreadCount = data.filter(
          (notification) => !notification.is_read
        ).length;

        setNotificationCount(unreadCount);

      } catch (error) {

        console.error(
          "Notification error:",
          error
        );

      }

    };

    fetchNotifications();

  }, []);


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


  /* =====================================================
     OPEN NOTIFICATION
  ===================================================== */

  const handleNotificationClick = async (notification) => {

    try {

      /*
       * Mark notification as read
       */

      if (!notification.is_read) {

        const response = await fetch(
          `http://127.0.0.1:8000/admin/notifications/${notification.id}/read`,
          {
            method: "PUT",
          }
        );

        if (response.ok) {

          setNotifications((prevNotifications) =>
            prevNotifications.map((item) =>
              item.id === notification.id
                ? {
                    ...item,
                    is_read: true,
                  }
                : item
            )
          );

          setNotificationCount((prevCount) =>
            prevCount > 0
              ? prevCount - 1
              : 0
          );

        }

      }


      /*
       * If this is an auction request,
       * open Pending Auctions
       */

      if (
        notification.notification_type ===
        "auction_request"
      ) {

        navigate(
          "/admin/dashboard/auctions/pending"
        );

        setNotificationPopup(false);

      }

    } catch (error) {

      console.error(
        "Notification click error:",
        error
      );

    }

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
            className={`dropdown ${
              userMenu ? "dropdown-open" : ""
            }`}
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

                    goTo(
                      "/admin/dashboard/users"
                    );

                  }}
                >
                  All Users
                </li>


                <li
                  onClick={(e) => {

                    e.stopPropagation();

                    goTo(
                      "/admin/users/pending"
                    );

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
            className={`dropdown ${
              auctionMenu ? "dropdown-open" : ""
            }`}
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

                    goTo(
                      "/admin/dashboard/auctions"
                    );

                  }}
                >
                  All Auctions
                </li>


                <li
                  onClick={(e) => {

                    e.stopPropagation();

                    goTo(
                      "/admin/dashboard/auctions/live"
                    );

                  }}
                >
                  Live Auctions
                </li>


                <li
                  onClick={(e) => {

                    e.stopPropagation();

                    goTo(
                      "/admin/dashboard/auctions/pending"
                    );

                  }}
                >
                  Pending Auctions
                </li>


                <li
                  onClick={(e) => {

                    e.stopPropagation();

                    goTo(
                      "/admin/dashboard/auctions/completed"
                    );

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


            {/* =================================================
                NOTIFICATION
            ================================================= */}

            <div className="notification-wrapper">

              {/* BELL */}

              <div
                className="notification"

                onClick={() =>
                  setNotificationPopup(
                    !notificationPopup
                  )
                }
              >

                <FaBell />

                {notificationCount > 0 && (

                  <span className="notification-count">

                    {notificationCount}

                  </span>

                )}

              </div>


              {/* =================================================
                  NOTIFICATION POPUP
              ================================================= */}

              {notificationPopup && (

                <div className="notification-popup">


                  {/* HEADER */}

                  <div className="notification-popup-header">

                    <h3>
                      Notifications
                    </h3>

                    {notificationCount > 0 && (

                      <span>
                        {notificationCount} unread
                      </span>

                    )}

                  </div>


                  {/* NOTIFICATION LIST */}

                  <div className="notification-list">

                    {notifications.length === 0 ? (

                      <div className="no-notifications">

                        <FaBell />

                        <p>
                          No notifications
                        </p>

                      </div>

                    ) : (

                      notifications.map(
                        (notification) => (

                          <div
                            key={notification.id}

                            className={`notification-item ${
                              !notification.is_read
                                ? "unread"
                                : ""
                            }`}

                            onClick={() =>
                              handleNotificationClick(
                                notification
                              )
                            }
                          >

                            {/* ICON */}

                            <div className="notification-item-icon">

                              <FaGavel />

                            </div>


                            {/* CONTENT */}

                            <div className="notification-item-content">

                              <h4>
                                {notification.title}
                              </h4>

                              <p>
                                {notification.message}
                              </p>

                              <small>

                                {notification.created_at
                                  ? new Date(
                                      notification.created_at
                                    ).toLocaleString()
                                  : ""}

                              </small>

                            </div>

                          </div>

                        )
                      )

                    )}

                  </div>

                </div>

              )}

            </div>


            {/* =================================================
                ADMIN PROFILE
            ================================================= */}

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