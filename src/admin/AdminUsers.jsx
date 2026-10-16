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
  FaFilter,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaEraser,
  FaSyncAlt,
} from "react-icons/fa";

import { useCallback, useEffect, useMemo, useState } from "react";
import adminApi from "../api/adminApi";

function AdminUsers() {
  // =====================================================
  // STATES
  // =====================================================

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [kycFilter, setKycFilter] = useState("all");
  const [registrationDateFilter, setRegistrationDateFilter] = useState("");

  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);

  const usersPerPage = 6;

  // =====================================================
  // FETCH USERS
  // =====================================================

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await adminApi.get("/admin/users/");

      const responseUsers = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.users)
          ? response.data.users
          : [];

      setUsers(responseUsers);

      // Remove selections for users that no longer exist.
      const existingIds = new Set(responseUsers.map((user) => user.id));

      setSelectedUserIds((previous) =>
        previous.filter((id) => existingIds.has(id))
      );
    } catch (error) {
      console.error("Error fetching users:", error);

      setErrorMessage(
        error.response?.data?.detail ||
          "Unable to load users. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // =====================================================
  // HELPERS
  // =====================================================

  const getDisplayName = (user) =>
    user?.fullname?.trim() || user?.username || "Unknown User";

  const normalizeAccountStatus = (user) =>
    String(user?.account_status ?? "")
      .trim()
      .toLowerCase();

  /*
   * This matches the account statuses shown in your API.
   * Confirm that your backend permits deletion of approved users.
   */
  const isDeletableUser = (user) =>
    ["active", "approved"].includes(normalizeAccountStatus(user));

  const getKycStatus = (user) => {
    const status = String(user?.kyc_status ?? "pending")
      .trim()
      .toLowerCase();

    if (["successful", "verified", "approved"].includes(status)) {
      return "successful";
    }

    if (["failed", "rejected"].includes(status)) {
      return "failed";
    }

    return "pending";
  };

  const getKycLabel = (user) => {
    const labels = {
      successful: "KYC Successful",
      pending: "KYC Pending",
      failed: "KYC Failed",
    };

    return labels[getKycStatus(user)];
  };

  const getRegistrationDate = (user) =>
    user?.registration_date ??
    user?.created_at ??
    user?.registered_at ??
    null;

  const formatRegistrationDate = (value) => {
    if (!value) return "Not recorded";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not recorded";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatRegistrationDateTime = (value) => {
    if (!value) return "Not recorded";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not recorded";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================================================
  // SEARCH + FILTER
  // =====================================================

  const filteredUsers = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !searchText ||
        String(user.id ?? "").includes(searchText) ||
        String(user.fullname ?? "").toLowerCase().includes(searchText) ||
        String(user.username ?? "").toLowerCase().includes(searchText) ||
        String(user.email ?? "").toLowerCase().includes(searchText) ||
        String(user.mobile ?? "").toLowerCase().includes(searchText);

      const matchesKyc =
        kycFilter === "all" || getKycStatus(user) === kycFilter;

      const matchesRegistrationDate = (() => {
        if (!registrationDateFilter) return true;

        const registrationDate = getRegistrationDate(user);

        if (!registrationDate) return false;

        const date = new Date(registrationDate);

        if (Number.isNaN(date.getTime())) return false;

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}` === registrationDateFilter;
      })();

      return (
        matchesSearch &&
        matchesKyc &&
        matchesRegistrationDate
      );
    });
  }, [users, search, kycFilter, registrationDateFilter]);

  // =====================================================
  // PAGINATION
  // =====================================================

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const startIndex = (currentPage - 1) * usersPerPage;

  const displayedUsers = filteredUsers.slice(
    startIndex,
    startIndex + usersPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, kycFilter, registrationDateFilter]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // =====================================================
  // MULTIPLE USER SELECTION
  // =====================================================

  const selectableUsers = displayedUsers.filter(isDeletableUser);

  const allDisplayedSelected =
    selectableUsers.length > 0 &&
    selectableUsers.every((user) =>
      selectedUserIds.includes(user.id)
    );

  const toggleUserSelection = (user) => {
    if (!isDeletableUser(user)) {
      alert("This user's account status does not permit deletion.");
      return;
    }

    setSelectedUserIds((previous) =>
      previous.includes(user.id)
        ? previous.filter((id) => id !== user.id)
        : [...previous, user.id]
    );
  };

  const toggleSelectAll = () => {
    const displayedIds = selectableUsers.map((user) => user.id);

    if (allDisplayedSelected) {
      setSelectedUserIds((previous) =>
        previous.filter((id) => !displayedIds.includes(id))
      );
    } else {
      setSelectedUserIds((previous) => [
        ...new Set([...previous, ...displayedIds]),
      ]);
    }
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setKycFilter("all");
    setRegistrationDateFilter("");
    setCurrentPage(1);
  };

  const activeFilterCount = [
    search.trim() !== "",
    kycFilter !== "all",
    registrationDateFilter !== "",
  ].filter(Boolean).length;

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

  const handleUpdateChange = (event) => {
    const { name, value } = event.target;

    setEditingUser((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editingUser) return;

    try {
      await adminApi.put(`/admin/users/${editingUser.id}`, {
        ...editingUser,
        account_status: editingUser.account_status,
      });

      alert("User updated successfully.");

      setEditingUser(null);
      await fetchUsers();
    } catch (error) {
      console.error("Update error:", error);

      alert(
        error.response?.data?.detail ||
          "Unable to update user."
      );
    }
  };

  // =====================================================
  // SINGLE USER DELETE
  // =====================================================

  const handleDeleteOpen = (user) => {
    if (!isDeletableUser(user)) {
      alert("This user's account status does not permit deletion.");
      return;
    }

    setDeletingUser(user);
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    try {
      await adminApi.delete(`/admin/users/${deletingUser.id}`);

      setSelectedUserIds((previous) =>
        previous.filter((id) => id !== deletingUser.id)
      );

      setDeletingUser(null);

      await fetchUsers();

      alert("User deleted successfully.");
    } catch (error) {
      console.error("Delete error:", error);

      alert(
        error.response?.data?.detail ||
          "Unable to delete user. Check the backend response."
      );
    }
  };

  // =====================================================
  // BULK DELETE
  // =====================================================

  const handleDeleteSelected = async () => {
    const usersToDelete = users.filter(
      (user) =>
        selectedUserIds.includes(user.id) &&
        isDeletableUser(user)
    );

    if (usersToDelete.length === 0) {
      alert("Please select at least one eligible user.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${usersToDelete.length} selected user(s)?`
    );

    if (!confirmed) return;

    setIsDeletingSelected(true);

    try {
      const results = await Promise.allSettled(
        usersToDelete.map((user) =>
          adminApi.delete(`/admin/users/${user.id}`)
        )
      );

      const successfulIds = usersToDelete
        .filter((_, index) => results[index].status === "fulfilled")
        .map((user) => user.id);

      const failedUsers = usersToDelete.filter(
        (_, index) => results[index].status === "rejected"
      );

      setSelectedUserIds((previous) =>
        previous.filter((id) => !successfulIds.includes(id))
      );

      await fetchUsers();

      if (failedUsers.length === 0) {
        alert(
          `${successfulIds.length} user(s) deleted successfully.`
        );
      } else {
        console.error(
          "Failed user deletions:",
          failedUsers.map((user, index) => ({
            id: user.id,
            error:
              results[usersToDelete.indexOf(user)]?.reason?.response
                ?.data?.detail ||
              results[usersToDelete.indexOf(user)]?.reason?.message,
          }))
        );

        alert(
          `${successfulIds.length} user(s) deleted successfully. ` +
            `${failedUsers.length} user(s) could not be deleted. ` +
            "Check the backend terminal for details."
        );
      }
    } catch (error) {
      console.error("Bulk delete error:", error);

      alert("Unable to complete the bulk delete operation.");
    } finally {
      setIsDeletingSelected(false);
    }
  };

  // =====================================================
  // STATISTICS
  // =====================================================

  const totalUsers = users.length;

  const activeUsers = users.filter(
    (user) => normalizeAccountStatus(user) === "active"
  ).length;

  const inactiveUsers = users.filter(
    (user) => normalizeAccountStatus(user) === "inactive"
  ).length;

  const currentDate = new Date();

  const newThisMonth = users.filter((user) => {
    const registrationDate = getRegistrationDate(user);

    if (!registrationDate) return false;

    const date = new Date(registrationDate);

    if (Number.isNaN(date.getTime())) return false;

    return (
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
    );
  }).length;

  const kycSuccessfulCount = users.filter(
    (user) => getKycStatus(user) === "successful"
  ).length;

  const kycPendingCount = users.filter(
    (user) => getKycStatus(user) === "pending"
  ).length;

  // =====================================================
  // PAGINATION BUTTONS
  // =====================================================

  const getPageNumbers = () => {
    const maxButtons = 5;

    let startPage = Math.max(
      1,
      currentPage - Math.floor(maxButtons / 2)
    );

    let endPage = Math.min(
      totalPages,
      startPage + maxButtons - 1
    );

    startPage = Math.max(1, endPage - maxButtons + 1);

    return Array.from(
      { length: Math.max(0, endPage - startPage + 1) },
      (_, index) => startPage + index
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="admin-users-page">
      {/* PAGE HEADER */}

      <div className="users-page-header">
        <div>
          <h1>All Registered Users</h1>

          <p>
            Manage registered users and monitor their KYC
            verification status.
          </p>
        </div>

        <button
          type="button"
          className="users-refresh-btn"
          onClick={fetchUsers}
          disabled={loading}
        >
          <FaSyncAlt
            className={loading ? "refresh-spinning" : ""}
          />
          Refresh
        </button>
      </div>

      {/* STATISTICS */}

      <div className="users-stats-grid">
        <div className="user-stat-card">
          <div className="user-stat-icon blue-icon">
            <FaUsers />
          </div>

          <div>
            <span>Total Users</span>
            <h2>{totalUsers}</h2>
            <p>All registered users</p>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon green-icon">
            <FaUserCheck />
          </div>

          <div>
            <span>Active Users</span>
            <h2>{activeUsers}</h2>
            <p>Currently active</p>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon red-icon">
            <FaUserTimes />
          </div>

          <div>
            <span>Inactive Users</span>
            <h2>{inactiveUsers}</h2>
            <p>Currently inactive</p>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="user-stat-icon purple-icon">
            <FaCalendarAlt />
          </div>

          <div>
            <span>New This Month</span>
            <h2>{newThisMonth}</h2>
            <p>Based on registration date</p>
          </div>
        </div>
      </div>

      {/* FILTER PANEL */}

      <section className="users-filter-panel">
        <div className="users-filter-heading">
          <div className="users-filter-title">
            <FaFilter />

            <div>
              <h2>Find Your User</h2>

              <p>
                Refine users by name, email, KYC status or
                registration date.
              </p>
            </div>
          </div>

          <div className="users-active-filter-count">
            <span className="filter-count-dot" />
            {activeFilterCount} Active{" "}
            {activeFilterCount === 1 ? "Filter" : "Filters"}
          </div>
        </div>

        <div className="users-filter-grid">
          <div className="users-filter-field users-search-field">
            <label htmlFor="userSearch">Search</label>

            <div className="users-filter-input-wrapper">
              <FaSearch />

              <input
                id="userSearch"
                type="text"
                placeholder="Search name, username, email or phone..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="users-filter-field">
            <label htmlFor="kycFilter">KYC Status</label>

            <div className="users-select-wrapper">
              <select
                id="kycFilter"
                value={kycFilter}
                onChange={(event) => setKycFilter(event.target.value)}
              >
                <option value="all">All KYC Statuses</option>
                <option value="successful">KYC Successful</option>
                <option value="pending">KYC Pending</option>
                <option value="failed">KYC Failed</option>
              </select>

              <FaChevronDown />
            </div>
          </div>

          <div className="users-filter-field">
            <label htmlFor="registrationDateFilter">
              Registration Date
            </label>

            <input
              id="registrationDateFilter"
              className="users-date-input"
              type="date"
              value={registrationDateFilter}
              onChange={(event) =>
                setRegistrationDateFilter(event.target.value)
              }
            />
          </div>
        </div>

        <div className="users-filter-footer">
          <p className="users-filter-results">
            Showing <strong>{filteredUsers.length}</strong> of{" "}
            <strong>{users.length}</strong> users
          </p>

          <button
            type="button"
            className="users-clear-filters-btn"
            onClick={clearFilters}
            disabled={activeFilterCount === 0}
          >
            <FaEraser />
            Clear Filters
          </button>
        </div>
      </section>

      {/* KYC SUMMARY */}

      <div className="users-kyc-summary">
        <div>
          <span className="kyc-summary-dot successful-dot" />
          <span>KYC Successful</span>
          <strong>{kycSuccessfulCount}</strong>
        </div>

        <div>
          <span className="kyc-summary-dot pending-dot" />
          <span>KYC Pending</span>
          <strong>{kycPendingCount}</strong>
        </div>
      </div>

      {/* USERS TABLE */}

      <section className="users-table-card">
        <div className="users-table-heading">
          <div>
            <h2>Registered Users</h2>
            <p>View and manage registered user accounts.</p>
          </div>

          <button
            type="button"
            className="confirm-delete"
            onClick={handleDeleteSelected}
            disabled={
              selectedUserIds.length === 0 || isDeletingSelected
            }
          >
            <FaTrash />
            {isDeletingSelected
              ? "Deleting..."
              : `Delete Selected (${selectedUserIds.length})`}
          </button>
        </div>

        {errorMessage && (
          <div className="users-error-message" role="alert">
            {errorMessage}
            <button type="button" onClick={fetchUsers}>
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="users-loading">Loading users...</div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Select all eligible users on this page"
                      checked={allDisplayedSelected}
                      disabled={selectableUsers.length === 0}
                      onChange={toggleSelectAll}
                    />
                  </th>

                  <th>ID</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Registration Date</th>
                  <th>KYC Status</th>
                  <th>Account Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {displayedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="users-empty">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  displayedUsers.map((user, index) => (
                    <tr key={user.id}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${getDisplayName(user)}`}
                          checked={selectedUserIds.includes(user.id)}
                          disabled={!isDeletableUser(user)}
                          onChange={() => toggleUserSelection(user)}
                        />
                      </td>

                      <td>{startIndex + index + 1}</td>

                      <td>
                        <div className="user-table-profile">
                          

                          <div>
                            <strong>{getDisplayName(user)}</strong>
                            
                          </div>
                        </div>
                      </td>

                      <td>{user.email || "-"}</td>

                      <td>{user.mobile || "-"}</td>

                      <td>
                        {formatRegistrationDate(
                          getRegistrationDate(user)
                        )}
                      </td>

                      <td>
                        <span
                          className={`kyc-badge ${getKycStatus(user)}`}
                        >
                          <span className="status-dot" />
                          {getKycLabel(user)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`account-status-badge ${normalizeAccountStatus(
                            user
                          )}`}
                        >
                          {user.account_status || "Unknown"}
                        </span>
                      </td>

                      <td>
                        <div className="users-action-buttons">
                          <button
                            type="button"
                            title="View user"
                            aria-label={`View ${getDisplayName(user)}`}
                            onClick={() => handleView(user)}
                          >
                            <FaEye />
                          </button>

                          <button
                            type="button"
                            title="Edit user"
                            aria-label={`Edit ${getDisplayName(user)}`}
                            onClick={() => handleUpdateOpen(user)}
                          >
                            <FaEdit />
                          </button>

                          <button
                            type="button"
                            title="Delete user"
                            aria-label={`Delete ${getDisplayName(user)}`}
                            disabled={!isDeletableUser(user)}
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
        )}

        {/* PAGINATION */}

        <div className="users-pagination">
          <span className="users-pagination-info">
            Showing{" "}
            <strong>
              {filteredUsers.length === 0 ? 0 : startIndex + 1}
            </strong>{" "}
            to{" "}
            <strong>
              {Math.min(
                startIndex + usersPerPage,
                filteredUsers.length
              )}
            </strong>{" "}
            of <strong>{filteredUsers.length}</strong> entries
          </span>

          <div className="pagination-buttons">
            <button
              type="button"
              className="pagination-arrow"
              title="Previous page"
              aria-label="Previous page"
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((page) => Math.max(1, page - 1))
              }
            >
              <FaChevronLeft />
            </button>

            {getPageNumbers().map((page) => (
              <button
                type="button"
                key={page}
                className={currentPage === page ? "current-page" : ""}
                aria-current={
                  currentPage === page ? "page" : undefined
                }
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="pagination-arrow"
              title="Next page"
              aria-label="Next page"
              disabled={totalPages === 0 || currentPage >= totalPages}
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(totalPages, page + 1)
                )
              }
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      </section>

      {/* VIEW USER MODAL */}

      {selectedUser && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="user-modal view-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>User Details</h2>
                <p>Registered user information</p>
              </div>

              <button
                type="button"
                aria-label="Close user details"
                onClick={() => setSelectedUser(null)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-user-header">
                <div className="large-avatar">
                  {getDisplayName(selectedUser)
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <h3>{getDisplayName(selectedUser)}</h3>
                  <p>@{selectedUser.username || "unknown"}</p>
                </div>
              </div>

              <div className="detail-row">
                <span>User ID</span>
                <strong>{selectedUser.id}</strong>
              </div>

              <div className="detail-row">
                <span>Full Name</span>
                <strong>{selectedUser.fullname || "-"}</strong>
              </div>

              <div className="detail-row">
                <span>Username</span>
                <strong>{selectedUser.username || "-"}</strong>
              </div>

              <div className="detail-row">
                <span>Email</span>
                <strong>{selectedUser.email || "-"}</strong>
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
                  {formatRegistrationDateTime(
                    getRegistrationDate(selectedUser)
                  )}
                </strong>
              </div>

              <div className="detail-row">
                <span>Email Verified</span>
                <strong>
                  {selectedUser.email_verified ? "Yes" : "No"}
                </strong>
              </div>

              <div className="detail-row">
                <span>KYC Status</span>
                <strong>
                  <span
                    className={`kyc-badge ${getKycStatus(selectedUser)}`}
                  >
                    <span className="status-dot" />
                    {getKycLabel(selectedUser)}
                  </span>
                </strong>
              </div>

              <div className="detail-row">
                <span>Account Status</span>
                <strong>
                  {selectedUser.account_status || "Unknown"}
                </strong>
              </div>

              <div className="detail-row">
                <span>Admin Remark</span>
                <strong>{selectedUser.admin_remark || "-"}</strong>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE USER MODAL */}

      {editingUser && (
        <div
          className="modal-overlay"
          onClick={() => setEditingUser(null)}
        >
          <div
            className="user-modal update-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Update User</h2>
                <p>Edit the user's profile information.</p>
              </div>

              <button
                type="button"
                aria-label="Close update form"
                onClick={() => setEditingUser(null)}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="update-form">
              <div className="form-group">
                <label htmlFor="edit-fullname">Full Name</label>
                <input
                  id="edit-fullname"
                  type="text"
                  name="fullname"
                  value={editingUser.fullname || ""}
                  onChange={handleUpdateChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-username">Username</label>
                <input
                  id="edit-username"
                  type="text"
                  name="username"
                  value={editingUser.username || ""}
                  onChange={handleUpdateChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-email">Email</label>
                <input
                  id="edit-email"
                  type="email"
                  name="email"
                  value={editingUser.email || ""}
                  onChange={handleUpdateChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-mobile">Mobile</label>
                <input
                  id="edit-mobile"
                  type="text"
                  name="mobile"
                  maxLength={10}
                  value={editingUser.mobile || ""}
                  onChange={handleUpdateChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-address">Address</label>
                <textarea
                  id="edit-address"
                  name="address"
                  rows={3}
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

      {/* DELETE CONFIRMATION MODAL */}

      {deletingUser && (
        <div
          className="modal-overlay"
          onClick={() => setDeletingUser(null)}
        >
          <div
            className="delete-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="delete-icon">
              <FaTrash />
            </div>

            <h2>Delete User</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>{getDisplayName(deletingUser)}</strong>?
            </p>

            <p className="warning-text">
              This action cannot be undone.
            </p>

            <div className="delete-modal-buttons">
              <button
                type="button"
                className="cancel-delete"
                onClick={() => setDeletingUser(null)}
              >
                Cancel
              </button>

              <button
                type="button"
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