import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import {
  FaGavel,
  FaHome,
  FaPlusCircle,
  FaClipboardList,
  FaThLarge,
  FaBroadcastTower,
  FaUserCircle,
  FaHistory,
  FaChevronDown,
  FaChevronRight,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaBell,
  FaSearch,
} from "react-icons/fa";

import "../styles/dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationPopup, setNotificationPopup] = useState(false);
  const [allNotificationsPopup, setAllNotificationsPopup] = useState(false);

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // =========================================================
// REFRESH USER AFTER PROFILE UPDATE
// =========================================================

useEffect(() => {

  const handleProfileUpdated = () => {

    try {

      const storedUser =
        localStorage.getItem("user");

      if (storedUser) {

        setUser(
          JSON.parse(storedUser)
        );

      }

    } catch (error) {

      console.error(
        "Unable to refresh user profile:",
        error
      );

    }

  };

  window.addEventListener(
    "profileUpdated",
    handleProfileUpdated
  );

  return () => {

    window.removeEventListener(
      "profileUpdated",
      handleProfileUpdated
    );

  };

}, []);

  // =========================================================
  // FETCH USER NOTIFICATIONS
  // =========================================================

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        return;
      }

      const response = await fetch(
        "http://127.0.0.1:8000/api/users/notifications",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to fetch notifications.");
      }

      const data = await response.json();

      setNotifications(data);

      const unreadCount = data.filter(
        (notification) => !notification.is_read
      ).length;

      setNotificationCount(unreadCount);
    } catch (error) {
      console.error("User notification error:", error);
    }
  };

  // =========================================================
// MARK ALL NOTIFICATIONS AS READ
// =========================================================

const handleMarkAllAsRead = async () => {
  try {
    const token = localStorage.getItem("access_token");

    if (!token || notificationCount === 0) {
      return;
    }

    const unreadNotifications = notifications.filter(
      (notification) => !notification.is_read
    );

    await Promise.all(
      unreadNotifications.map((notification) =>
        fetch(
          `http://127.0.0.1:8000/api/users/notifications/${notification.id}/read`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      )
    );

    setNotifications((previousNotifications) =>
      previousNotifications.map((notification) => ({
        ...notification,
        is_read: true,
      }))
    );

    setNotificationCount(0);
  } catch (error) {
    console.error("Mark all notifications error:", error);
  }
};
  // =========================================================
  // LOAD NOTIFICATIONS
  // =========================================================

  useEffect(() => {
    fetchNotifications();
  }, []);

  // =========================================================
  // HANDLE NOTIFICATION CLICK
  // =========================================================

  const handleNotificationClick = async (notification) => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        return;
      }

      // =====================================================
      // MARK NOTIFICATION AS READ
      // =====================================================

      if (!notification.is_read) {
        const response = await fetch(
          `http://127.0.0.1:8000/api/users/notifications/${notification.id}/read`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          setNotifications((previousNotifications) =>
            previousNotifications.map((item) =>
              item.id === notification.id
                ? {
                    ...item,
                    is_read: true,
                  }
                : item
            )
          );

          setNotificationCount((previousCount) =>
            previousCount > 0 ? previousCount - 1 : 0
          );
        }
      }

      // =====================================================
      // CLOSE NOTIFICATION POPUP
      // =====================================================

      setNotificationPopup(false);

      // =====================================================
      // AUCTION REJECTED
      // OPEN GMAIL
      // =====================================================

      // =========================================================
// AUCTION REJECTED
// OPEN GMAIL
// =========================================================

if (notification.notif_type === "auction_rejected") {

  const searchQuery = encodeURIComponent(
    `"Bidora - Auction Rejected"`
  );

  window.open(
    `https://mail.google.com/mail/u/0/#search/${searchQuery}`,
    "_blank"
  );

  return;
}

// =========================================================
// AUCTION APPROVED
// OPEN MY AUCTIONS
// =========================================================

if (notification.notif_type === "auction_approved") {

  const searchQuery = encodeURIComponent(
    `"Bidora - Auction Approve"`
  );

  window.open(
    `https://mail.google.com/mail/u/0/#search/${searchQuery}`,
    "_blank"
  );

  return;
}

      // =====================================================
      // OTHER NOTIFICATIONS
      // =====================================================
      // Keep user on the dashboard for other notification types.
      // You can add specific navigation later if required.

    } catch (error) {
      console.error("Notification click error:", error);
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");

    navigate("/login");
  };

  // =========================================================
  // NAV LINK
  // =========================================================

  const navClass = ({ isActive }) =>
    `dashboard-nav-link ${isActive ? "active" : ""}`;

  return (
    <div
      className={`bidora-dashboard ${
        sidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"
      }`}
    >
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="dashboard-sidebar">

        {/* ================= LOGO ================= */}

        <div className="dashboard-logo">

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >

            <div className="dashboard-logo-icon">
              <FaGavel />
            </div>

            {sidebarOpen && (
              <div className="dashboard-logo-text">
                <h2>Bidora</h2>
                <span>Online Auctions</span>
              </div>
            )}

          </div>

          {/* =================================================
              SIDEBAR OPEN / CLOSE BUTTON
          ================================================= */}

          {sidebarOpen ? (

            /* CLOSE BUTTON */

            <button
              type="button"
              className="sidebar-close-btn"
              onClick={() => setSidebarOpen(false)}
              title="Close Sidebar"
              aria-label="Close Sidebar"
            >
              <FaTimes />
            </button>

          ) : (

            /* OPEN BUTTON */

            <button
              type="button"
              className="sidebar-open-btn"
              onClick={() => setSidebarOpen(true)}
              title="Open Sidebar"
              aria-label="Open Sidebar"
            >
              <FaBars />
            </button>

          )}

        </div>

        {/* =====================================================
            SIDEBAR USER
        ===================================================== */}

        {sidebarOpen && (
          <div className="sidebar-user-profile">

            <div className="sidebar-user-avatar">

  {user?.profile_image ? (

    <img
      src={
        user.profile_image.startsWith("http")
          ? user.profile_image
          : `http://127.0.0.1:8000${user.profile_image}`
      }
      alt="Profile"
    />

  ) : (

    <FaUserCircle />

  )}

</div>

            <div className="sidebar-user-info">
              <strong>{user?.fullname || "User"}</strong>
              <span>User</span>
            </div>

          </div>
        )}

        {/* ================= NAVIGATION ================= */}

        <div className="sidebar-navigation">

          {sidebarOpen && (
            <p className="sidebar-heading">
              MAIN MENU
            </p>
          )}

          {/* DASHBOARD */}

          <NavLink
            to="/dashboard"
            end
            className={navClass}
            title="Dashboard Home"
          >
            <FaHome />

            {sidebarOpen && (
              <span>Dashboard Home</span>
            )}
          </NavLink>

          {/* CREATE AUCTION */}

          <NavLink
            to="/dashboard/create-auction"
            className={navClass}
            title="Create Auction"
          >
            <FaPlusCircle />

            {sidebarOpen && (
              <span>Create Auction</span>
            )}
          </NavLink>

          {/* MY AUCTIONS */}

          <NavLink
            to="/dashboard/my-auctions"
            className={navClass}
            title="My Auctions"
          >
            <FaClipboardList />

            {sidebarOpen && (
              <span>My Auctions</span>
            )}
          </NavLink>

          {/* ALL AUCTIONS */}

          <NavLink
            to="/dashboard/all-auctions"
            className={navClass}
            title="All Auctions"
          >
            <FaThLarge />

            {sidebarOpen && (
              <span>All Auctions</span>
            )}
          </NavLink>

          {/* LIVE AUCTIONS */}

          <NavLink
            to="/dashboard/live-auctions"
            className={navClass}
            title="Live Auctions"
          >
            <FaBroadcastTower />

            {sidebarOpen && (
              <span>Live Auctions</span>
            )}

            {sidebarOpen && (
              <span className="live-dot"></span>
            )}
          </NavLink>

          {/* CATEGORIES */}

          <NavLink
            to="/dashboard/categories"
            className={navClass}
            title="Categories"
          >
            <FaThLarge />

            {sidebarOpen && (
              <span>Categories</span>
            )}
          </NavLink>

          {/* ================= HISTORY ================= */}

          <button
            type="button"
            className={`history-toggle ${
              historyOpen ? "history-active" : ""
            }`}
            onClick={() => setHistoryOpen(!historyOpen)}
            title="History"
          >

            <div className="history-toggle-left">

              <FaHistory />

              {sidebarOpen && (
                <span>History</span>
              )}

            </div>

            {sidebarOpen && (
              historyOpen
                ? <FaChevronDown />
                : <FaChevronRight />
            )}

          </button>

          {/* HISTORY SUBMENU */}

          {sidebarOpen && historyOpen && (
            <div className="history-submenu">

              <NavLink
  to="/dashboard/history/auction"
  className={navClass}
>
  <FaHistory />
  <span>Auction History</span>
</NavLink>
              <NavLink
                to="/dashboard/history/bid"
                className={navClass}
              >
                <FaHistory />
                <span>Bid History</span>
              </NavLink>

              <NavLink
                to="/dashboard/history/payment"
                className={navClass}
              >
                <FaHistory />
                <span>Payment History</span>
              </NavLink>

            </div>
          )}

          {/* MANAGE PROFILE */}

          {/* MANAGE PROFILE */}

<NavLink
  to="/dashboard/manage-profile"
  className={navClass}
  title="Manage Profile"
>
  <FaUserCircle />

  {sidebarOpen && (
    <span>Manage Profile</span>
  )}
</NavLink>

        </div>

        {/* ================= SIDEBAR BOTTOM ================= */}

        <div className="sidebar-bottom">

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            title="Logout"
          >

            <FaSignOutAlt />

            {sidebarOpen && (
              <span>Logout</span>
            )}

          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN AREA
      ===================================================== */}

      <div className="dashboard-main">

        {/* ================= NAVBAR ================= */}

        <header className="dashboard-navbar">

          <div className="navbar-left">

            {/* SEARCH */}

            <div className="navbar-search">

              <FaSearch />

              <input
                type="text"
                placeholder="Search auctions, categories, items..."
              />

            </div>

          </div>

          {/* ================= NAVBAR RIGHT ================= */}

          <div className="navbar-right">

            {/* =====================================================
                USER NOTIFICATIONS
            ===================================================== */}

            <div className="user-notification-wrapper">

              <button
                type="button"
                className="notification-button"
                onClick={() =>
                  setNotificationPopup(
                    !notificationPopup
                  )
                }
              >

                <FaBell />

                {notificationCount > 0 && (
  <span className="notification-badge">
    {notificationCount > 5
      ? "5+"
      : notificationCount}
  </span>
)}

              </button>

              {/* ===================================================
                  NOTIFICATION POPUP
              =================================================== */}

              {notificationPopup && (

  <div className="user-notification-popup">

    {/* ===================================================
        NOTIFICATION HEADER
    =================================================== */}

    <div className="user-notification-header">

      <div className="notification-header-title">

        <h3>
          Notifications
        </h3>

        {notificationCount > 0 && (
          <span>
            {notificationCount > 5
              ? "5+ unread"
              : `${notificationCount} unread`}
          </span>
        )}

      </div>

      {notificationCount > 0 && (
        <button
          type="button"
          className="mark-all-notifications-btn"
          onClick={handleMarkAllAsRead}
        >
          Mark all
        </button>
      )}

    </div>


    {/* ===================================================
        LATEST 5 NOTIFICATIONS
    =================================================== */}

    <div className="user-notification-list">

      {notifications.length === 0 ? (

        <div className="user-no-notifications">

          <FaBell />

          <p>
            No notifications
          </p>

        </div>

      ) : (

        notifications
          .slice(0, 5)
          .map((notification) => (

            <div
              key={notification.id}
              className={
                `user-notification-item ${
                  !notification.is_read
                    ? "unread"
                    : ""
                }`
              }
              onClick={() =>
                handleNotificationClick(notification)
              }
            >

              <div className="user-notification-icon">

                <FaGavel />

              </div>

              <div className="user-notification-content">

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
                      ).toLocaleString("en-IN")
                    : ""}
                </small>

              </div>

            </div>

          ))

      )}

    </div>


    {/* ===================================================
        VIEW ALL
    =================================================== */}

    {notifications.length > 5 && (

  <div className="view-all-notifications-wrapper">
    <button
      type="button"
      className="view-all-notifications-btn"
      onClick={() => {
        setNotificationPopup(false);
        setAllNotificationsPopup(true);
      }}
    >
      View All Notifications
    </button>
  </div>

    )}

  </div>

)}

                

            </div>

            {/* NAVBAR USER PROFILE */}

            <div className="navbar-profile">

              <div className="profile-avatar">

  {user?.profile_image ? (

    <img
      src={
        user.profile_image.startsWith("http")
          ? user.profile_image
          : `http://127.0.0.1:8000${user.profile_image}`
      }
      alt="Profile"
    />

  ) : (

    <FaUserCircle />

  )}

</div>

              <div className="profile-info">

                <strong>
                  {user?.fullname || "User"}
                </strong>

                <small>
                  User
                </small>

              </div>

              <FaChevronDown className="profile-arrow" />

            </div>

          </div>

        </header>

        {/* =====================================================
    ALL NOTIFICATIONS MODAL
===================================================== */}

{allNotificationsPopup && (

  <div
    className="all-notifications-overlay"
    onClick={() =>
      setAllNotificationsPopup(false)
    }
  >

    <div
      className="all-notifications-modal"
      onClick={(event) =>
        event.stopPropagation()
      }
    >

      {/* =================================================
          MODAL HEADER
      ================================================= */}

      <div className="all-notifications-modal-header">

        <div>

          <h2>
            Notifications
          </h2>

          <p>
            {notifications.length} total notifications
          </p>

        </div>

        <div className="all-notifications-header-actions">

          {notificationCount > 0 && (
            <button
              type="button"
              className="modal-mark-all-btn"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </button>
          )}

          <button
            type="button"
            className="notification-modal-close"
            onClick={() =>
              setAllNotificationsPopup(false)
            }
            aria-label="Close notifications"
          >
            <FaTimes />
          </button>

        </div>

      </div>


      {/* =================================================
          MODAL BODY
      ================================================= */}

      <div className="all-notifications-modal-body">

        {notifications.length === 0 ? (

          <div className="user-no-notifications modal-empty">

            <FaBell />

            <p>
              No notifications
            </p>

          </div>

        ) : (

          notifications.map((notification) => (

            <div
              key={notification.id}
              className={
                `all-notification-item ${
                  !notification.is_read
                    ? "unread"
                    : ""
                }`
              }
              onClick={() =>
                handleNotificationClick(notification)
              }
            >

              <div className="all-notification-icon">

                <FaGavel />

              </div>

              <div className="all-notification-content">

                <div className="all-notification-title-row">

                  <h4>
                    {notification.title}
                  </h4>

                  {!notification.is_read && (
                    <span className="unread-dot"></span>
                  )}

                </div>

                <p>
                  {notification.message}
                </p>

                <small>
                  {notification.created_at
                    ? new Date(
                        notification.created_at
                      ).toLocaleString("en-IN")
                    : ""}
                </small>

              </div>

            </div>

          ))

        )}

      </div>

    </div>

  </div>

)}

        {/* ================= PAGE CONTENT ================= */}

        <main className="dashboard-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default Dashboard;