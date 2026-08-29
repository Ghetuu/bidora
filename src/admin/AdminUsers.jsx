import "../styles/adminuser.css";

import {
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaCalendarAlt,
  FaSearch,
  FaEye,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSave,
} from "react-icons/fa";

import { useEffect, useState } from "react";
import axios from "axios";


function AdminUsers() {

  // =====================================================
  // STATES
  // =====================================================

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 6;


  // =====================================================
  // GET ALL USERS
  // =====================================================

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        "http://127.0.0.1:8000/admin/users/"
      );

      console.log("USERS FROM BACKEND:", response.data);

      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);


  // =====================================================
  // SEARCH + FILTER
  // =====================================================

  const filteredUsers = users.filter((user) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      user.username?.toLowerCase().includes(searchText) ||
      user.email?.toLowerCase().includes(searchText) ||
      user.fullname?.toLowerCase().includes(searchText) ||
      user.mobile?.includes(searchText);

    const matchesStatus =
      statusFilter === "all" ||
      user.account_status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });


  // =====================================================
  // PAGINATION
  // =====================================================

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const displayedUsers = filteredUsers.slice(
    startIndex,
    startIndex + usersPerPage
  );


  // =====================================================
  // VIEW USER
  // =====================================================

  const handleView = (user) => {
    setSelectedUser(user);
  };


  // =====================================================
  // UPDATE USER
  // =====================================================

  const handleUpdateOpen = (user) => {
    setEditingUser({ ...user });
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;

    setEditingUser((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      await axios.put(
        `http://127.0.0.1:8000/admin/users/${editingUser.id}`,
        {
          ...editingUser,
          account_status: editingUser.account_status, // unchanged, not editable here
        }
      );

      alert("User updated successfully.");

      setEditingUser(null);

      fetchUsers();
    } catch (error) {
      console.error("Update error:", error);

      alert(
        error.response?.data?.detail ||
        "Unable to update user."
      );
    }
  };


  // =====================================================
  // DELETE USER
  // =====================================================

  const handleDeleteOpen = (user) => {
    // Only ACTIVE users can be deleted
    if (user.account_status?.toLowerCase() !== "active") {
      alert("Inactive users cannot be deleted.");
      return;
    }

    setDeletingUser(user);
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    try {
      await axios.delete(
        `http://127.0.0.1:8000/admin/users/${deletingUser.id}`
      );

      alert("User deleted successfully.");

      setDeletingUser(null);

      fetchUsers();
    } catch (error) {
      console.error("Delete error:", error);

      alert(
        error.response?.data?.detail ||
        "Unable to delete user."
      );
    }
  };


  // =====================================================
  // STATISTICS
  // =====================================================

  const totalUsers = users.length;

  const activeUsers = users.filter(
    (user) => user.account_status?.toLowerCase() === "active"
  ).length;

  const inactiveUsers = users.filter(
    (user) => user.account_status?.toLowerCase() === "inactive"
  ).length;

  const currentMonth = new Date().getMonth();

  const newThisMonth = users.filter((user) => {
    if (!user.registration_date) return false;

    const date = new Date(user.registration_date);

    return date.getMonth() === currentMonth;
  }).length;


  // =====================================================
  // RESET PAGE WHEN SEARCH CHANGES
  // =====================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);


  // =====================================================
  // JSX
  // =====================================================

  return (
    <div className="admin-users-page">

      {/* PAGE HEADER */}
      <div className="users-page-header">
        <div>
          <h1>All Registered Users</h1>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="users-stats-grid">

        <div className="user-stat-card">
          <div className="user-stat-icon blue-icon">
            <FaUsers />
          </div>
          <div>
            <span>Total Users</span>
            <h2>{totalUsers}</h2>
            <p>All Registered Users</p>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon green-icon">
            <FaUserCheck />
          </div>
          <div>
            <span>Active Users</span>
            <h2>{activeUsers}</h2>
            <p>Currently Active</p>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon red-icon">
            <FaUserTimes />
          </div>
          <div>
            <span>Inactive Users</span>
            <h2>{inactiveUsers}</h2>
            <p>Not Active</p>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon purple-icon">
            <FaCalendarAlt />
          </div>
          <div>
            <span>New This Month</span>
            <h2>{newThisMonth}</h2>
            <p>New Registrations</p>
          </div>
        </div>

      </div>

      {/* USERS TABLE CARD */}
      <div className="users-table-card">

        <div className="users-toolbar">

          <div className="user-search">
            <FaSearch />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">-- All Status --</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button className="search-btn">
            <FaSearch />
            Search
          </button>

          <button className="add-user-btn">+ Add User</button>

          <button className="export-btn">↓ Export</button>

        </div>

        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Registration Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="table-message">
                    Loading users...
                  </td>
                </tr>
              ) : displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="table-message">
                    No users found.
                  </td>
                </tr>
              ) : (
                displayedUsers.map((user) => (
                  <tr key={user.id}>

                    <td>{user.id}</td>

                    <td>
                      <div className="username-cell">
                        <div className="user-avatar">
                          {user.fullname?.charAt(0)?.toUpperCase()}
                        </div>
                        <span>{user.fullname || user.username}</span>
                      </div>
                    </td>

                    <td>{user.email}</td>

                    <td>{user.mobile || "-"}</td>

                    
                    <td>
                      {user.registration_date
                        ? new Date(user.registration_date).toLocaleDateString()
                        : "-"}
                    </td>

                    

                    <td>
                      <span
                        className={
                          user.account_status?.toLowerCase() === "active"
                            ? "status-badge active"
                            : "status-badge inactive"
                        }
                      >
                        <span className="status-dot"></span>
                        {user.account_status || "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="action-buttons">

                        <button
                          className="view-btn"
                          title="View User"
                          onClick={() => handleView(user)}
                        >
                          <FaEye />
                        </button>

                        <button
                          className="update-btn"
                          title="Update User"
                          onClick={() => handleUpdateOpen(user)}
                        >
                          <FaEdit />
                        </button>

                        <button
                          className={
                            user.account_status?.toLowerCase() === "active"
                              ? "delete-btn"
                              : "delete-btn disabled"
                          }
                          title={
                            user.account_status?.toLowerCase() === "active"
                              ? "Delete User"
                              : "Inactive user cannot be deleted"
                          }
                          disabled={
                            user.account_status?.toLowerCase() !== "active"
                          }
                          onClick={() => handleDeleteOpen(user)}
                        >
                          <FaTrash />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="users-pagination">

          <span>
            Showing{" "}
            {filteredUsers.length === 0 ? 0 : startIndex + 1}{" "}
            to{" "}
            {Math.min(startIndex + usersPerPage, filteredUsers.length)}{" "}
            of{" "}
            {filteredUsers.length} entries
          </span>

          <div className="pagination-buttons">

            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .slice(0, 5)
              .map((page) => (
                <button
                  key={page}
                  className={currentPage === page ? "current-page" : ""}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              ›
            </button>

          </div>

        </div>

      </div>

      {/* VIEW USER POPUP */}
      {selectedUser && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="user-modal view-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="modal-header">
              <h2>User Details</h2>
              <button onClick={() => setSelectedUser(null)}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">

              <div className="modal-user-header">
                <div className="large-avatar">
                  {selectedUser.fullname?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h3>{selectedUser.fullname}</h3>
                  <p>@{selectedUser.username}</p>
                </div>
              </div>

              <div className="detail-row">
                <span>Full Name</span>
                <strong>{selectedUser.fullname}</strong>
              </div>

              <div className="detail-row">
                <span>Username</span>
                <strong>{selectedUser.username}</strong>
              </div>

              <div className="detail-row">
                <span>Email</span>
                <strong>{selectedUser.email}</strong>
              </div>

              <div className="detail-row">
                <span>Mobile</span>
                <strong>{selectedUser.mobile || "-"}</strong>
              </div>

              <div className="detail-row">
                <span>Address</span>
                <strong>{selectedUser.address || "-"}</strong>
              </div>

              <div className="detail-row">
                <span>Registration Date</span>
                <strong>
                  {selectedUser.registration_date
                    ? new Date(selectedUser.registration_date).toLocaleString()
                    : "-"}
                </strong>
              </div>

              <div className="detail-row">
                <span>Email Verified</span>
                <strong>{selectedUser.email_verified ? "Yes" : "No"}</strong>
              </div>

              <div className="detail-row">
                <span>Admin Remark</span>
                <strong>{selectedUser.admin_remark || "-"}</strong>
              </div>

              <div className="detail-row">
                <span>Status</span>
                <strong>
                  <span
                    className={
                      selectedUser.account_status?.toLowerCase() === "active"
                        ? "status-badge active"
                        : "status-badge inactive"
                    }
                  >
                    {selectedUser.account_status}
                  </span>
                </strong>
              </div>

            </div>

            <div className="modal-footer">
              <button
                className="modal-close-btn"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* UPDATE USER POPUP */}
      {editingUser && (
        <div
          className="modal-overlay"
          onClick={() => setEditingUser(null)}
        >
          <div
            className="user-modal update-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="modal-header">
              <h2>Update User</h2>
              <button onClick={() => setEditingUser(null)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="update-form">

              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="fullname"
                  value={editingUser.fullname || ""}
                  onChange={handleUpdateChange}
                />
              </div>

              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={editingUser.username || ""}
                  onChange={handleUpdateChange}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={editingUser.email || ""}
                  onChange={handleUpdateChange}
                />
              </div>

              <div className="form-group">
                <label>Mobile</label>
                <input
                  type="text"
                  name="mobile"
                  maxLength="10"
                  value={editingUser.mobile || ""}
                  onChange={handleUpdateChange}
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  rows="3"
                  value={editingUser.address || ""}
                  onChange={handleUpdateChange}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>

                <button type="submit" className="save-user-btn">
                  <FaSave />
                  Update User
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION POPUP */}
      {deletingUser && (
        <div
          className="modal-overlay"
          onClick={() => setDeletingUser(null)}
        >
          <div
            className="delete-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="delete-icon">
              <FaTrash />
            </div>

            <h2>Delete User</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>{deletingUser.fullname}</strong>?
            </p>

            <p className="warning-text">
              This action cannot be undone.
            </p>

            <div className="delete-modal-buttons">
              <button
                className="cancel-delete"
                onClick={() => setDeletingUser(null)}
              >
                Cancel
              </button>

              <button
                className="confirm-delete"
                onClick={handleDelete}
              >
                <FaTrash />
                Yes, Delete
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default AdminUsers;