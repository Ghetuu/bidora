import React, { useEffect, useMemo, useState, useRef } from "react";

const API_URL = "http://127.0.0.1:8000";

// =====================================================
// INLINE CUSTOM DROPDOWN COMPONENT
// =====================================================
const CustomSelect = ({ label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="custom-select-container" ref={dropdownRef}>
      {label && <label className="custom-select-label">{label}</label>}

      <div
        className={`custom-select-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption?.label}</span>
        <span className="custom-select-arrow">▼</span>
      </div>

      {isOpen && (
        <div className="custom-select-dropdown">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                className={`custom-select-option ${isSelected ? "selected" : ""}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span>{option.label}</span>
                {isSelected && <span className="custom-select-checkmark">✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [replying, setReplying] = useState(false);

  // =====================================================
  // SEARCH / FILTER STATES
  // =====================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [topicFilter, setTopicFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [deleting, setDeleting] = useState(false);

  // =====================================================
  // HELP TOPICS
  // =====================================================

  const helpTopics = [
    "Bidding & Auction Rules",
    "Payment & Invoicing",
    "Shipping & Delivery",
    "Selling / Consignment",
    "Report an Issue / Fraud",
    "Account Support & Login",
    "Other",
  ];

  // =====================================================
  // FETCH CONTACT MESSAGES
  // =====================================================

  const fetchMessages = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/admin/contact-messages`);

      if (!response.ok) {
        throw new Error("Failed to fetch contact messages");
      }

      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching contact messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // =====================================================
  // SEARCH + FILTER LOGIC
  // =====================================================

  const filteredMessages = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const now = new Date();

    return messages.filter((message) => {
      // SEARCH
      const searchableText = [
        message.id,
        message.first_name,
        message.last_name,
        `${message.first_name || ""} ${message.last_name || ""}`,
        message.email,
        message.phone,
        message.help_topic,
        message.other_topic,
        message.auction_id,
        message.message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);

      // STATUS
      const matchesStatus =
        statusFilter === "ALL" || message.status === statusFilter;

      // TOPIC
      const matchesTopic =
        topicFilter === "ALL" || message.help_topic === topicFilter;

      // DATE
      let matchesDate = true;

      if (message.created_at && dateFilter !== "ALL") {
        const messageDate = new Date(message.created_at);

        if (!Number.isNaN(messageDate.getTime())) {
          const startOfToday = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );

          if (dateFilter === "TODAY") {
            matchesDate = messageDate >= startOfToday;
          }

          if (dateFilter === "YESTERDAY") {
            const startOfYesterday = new Date(startOfToday);
            startOfYesterday.setDate(startOfYesterday.getDate() - 1);

            matchesDate =
              messageDate >= startOfYesterday && messageDate < startOfToday;
          }

          if (dateFilter === "LAST_7_DAYS") {
            const sevenDaysAgo = new Date(startOfToday);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

            matchesDate = messageDate >= sevenDaysAgo;
          }

          if (dateFilter === "LAST_30_DAYS") {
            const thirtyDaysAgo = new Date(startOfToday);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

            matchesDate = messageDate >= thirtyDaysAgo;
          }
        }
      }

      return (
        matchesSearch && matchesStatus && matchesTopic && matchesDate
      );
    });
  }, [messages, searchTerm, statusFilter, topicFilter, dateFilter]);

  // =====================================================
  // RESET FILTERS
  // =====================================================

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setTopicFilter("ALL");
    setDateFilter("ALL");
    setSelectedIds([]);
  };

  // =====================================================
  // SELECT / UNSELECT SINGLE MESSAGE
  // =====================================================

  const handleSelectMessage = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((selectedId) => selectedId !== id);
      }

      return [...prev, id];
    });
  };

  // =====================================================
  // SELECT ALL FILTERED MESSAGES
  // =====================================================

  const handleSelectAll = () => {
    const filteredIds = filteredMessages.map((message) => message.id);

    const allFilteredSelected =
      filteredIds.length > 0 &&
      filteredIds.every((id) => selectedIds.includes(id));

    if (allFilteredSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !filteredIds.includes(id))
      );
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...filteredIds])]);
    }
  };

  // =====================================================
  // DELETE SINGLE MESSAGE
  // =====================================================

  const deleteMessage = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this contact message?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        `${API_URL}/admin/contact-messages/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to delete contact message.");
      }

      setMessages((prev) => prev.filter((message) => message.id !== id));
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));

      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }

      alert("Contact message deleted successfully.");
    } catch (error) {
      console.error("Delete contact message error:", error);
      alert(error.message);
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // DELETE SELECTED
  // =====================================================

  const deleteSelected = async () => {
    if (selectedIds.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} selected message${
        selectedIds.length > 1 ? "s" : ""
      }? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        `${API_URL}/admin/contact-messages/bulk-delete`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ids: selectedIds,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to delete selected messages."
        );
      }

      setMessages((prev) =>
        prev.filter((message) => !selectedIds.includes(message.id))
      );

      if (selectedMessage && selectedIds.includes(selectedMessage.id)) {
        setSelectedMessage(null);
      }

      setSelectedIds([]);

      alert(
        data.message || "Selected messages deleted successfully."
      );
    } catch (error) {
      console.error("Delete selected messages error:", error);
      alert(error.message);
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // DELETE ALL
  // =====================================================

  const deleteAllMessages = async () => {
    if (messages.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to DELETE ALL contact messages?\n\nThis action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        `${API_URL}/admin/contact-messages/delete-all`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to delete all messages.");
      }

      setMessages([]);
      setSelectedIds([]);
      setSelectedMessage(null);

      alert(
        data.message || "All contact messages deleted successfully."
      );
    } catch (error) {
      console.error("Delete all messages error:", error);
      alert(error.message);
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // MARK AS READ
  // =====================================================

  const markAsRead = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/admin/contact-messages/${id}/read`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark message as read");
      }

      await fetchMessages();

      if (selectedMessage?.id === id) {
        setSelectedMessage((prev) => ({
          ...prev,
          is_read: true,
        }));
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  // =====================================================
  // UPDATE STATUS
  // =====================================================

  const updateStatus = async (id, status) => {
    try {
      const response = await fetch(
        `${API_URL}/admin/contact-messages/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update status");
      }

      await fetchMessages();

      if (selectedMessage?.id === id) {
        setSelectedMessage((prev) => ({
          ...prev,
          status: status,
          is_read: status !== "OPEN" ? true : prev.is_read,
        }));
      }
    } catch (error) {
      console.error("Error updating contact status:", error);
      alert(error.message);
    }
  };

  // =====================================================
  // OPEN REPLY MODAL
  // =====================================================

  const openReply = (message) => {
    setSelectedMessage(message);
    setReplyMessage("");
  };

  // =====================================================
  // SEND REPLY
  // =====================================================

  const handleReply = async () => {
    if (!selectedMessage) {
      return;
    }

    if (!replyMessage.trim()) {
      alert("Please enter a reply message.");
      return;
    }

    try {
      setReplying(true);

      const response = await fetch(
        `${API_URL}/admin/contact-messages/${selectedMessage.id}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reply: replyMessage.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to send reply.");
      }

      alert("Reply sent successfully to " + selectedMessage.email);

      setReplyMessage("");
      setSelectedMessage(null);

      await fetchMessages();
    } catch (error) {
      console.error("Reply error:", error);
      alert(error.message);
    } finally {
      setReplying(false);
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass = (status) => {
    switch (status) {
      case "OPEN":
        return "cm-status-open";

      case "IN_PROGRESS":
        return "cm-status-progress";

      case "RESOLVED":
        return "cm-status-resolved";

      default:
        return "";
    }
  };

  // =====================================================
  // CHECK ALL FILTERED
  // =====================================================

  const allFilteredSelected =
    filteredMessages.length > 0 &&
    filteredMessages.every((message) => selectedIds.includes(message.id));

  // =====================================================
  // ACTIVE FILTER CHECK
  // =====================================================

  const hasActiveFilters =
    searchTerm ||
    statusFilter !== "ALL" ||
    topicFilter !== "ALL" ||
    dateFilter !== "ALL";

  return (
    <>
      <div className="cm-page">
        {/* HEADER */}
        <div className="cm-header">
          <div>
            <h1>Contact Messages</h1>
            <p>Manage messages received from Bidora users.</p>
          </div>

          <button
            className="cm-refresh-btn"
            onClick={fetchMessages}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>

        {/* STATISTICS */}
        <div className="cm-stats">
          <div className="cm-stat-card">
            <div className="cm-stat-number">{messages.length}</div>
            <div className="cm-stat-label">Total Messages</div>
          </div>

          <div className="cm-stat-card">
            <div className="cm-stat-number">
              {messages.filter((message) => !message.is_read).length}
            </div>
            <div className="cm-stat-label">Unread</div>
          </div>

          <div className="cm-stat-card">
            <div className="cm-stat-number">
              {
                messages.filter((message) => message.status === "OPEN")
                  .length
              }
            </div>
            <div className="cm-stat-label">Open</div>
          </div>

          <div className="cm-stat-card">
            <div className="cm-stat-number">
              {
                messages.filter(
                  (message) => message.status === "RESOLVED"
                ).length
              }
            </div>
            <div className="cm-stat-label">Resolved</div>
          </div>
        </div>

        {/* FILTER CARD */}
        <div className="cm-filter-card">
          <div className="cm-filter-header">
            <div>
              <h3>Search & Filters</h3>
              <span>
                {filteredMessages.length} of {messages.length} messages
              </span>
            </div>

            {hasActiveFilters && (
              <button className="cm-reset-btn" onClick={resetFilters}>
                Reset Filters
              </button>
            )}
          </div>

          <div className="cm-filter-grid">
            {/* SEARCH */}
            <div className="cm-search-box">
              <span className="cm-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search name, email, topic, auction ID or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="cm-clear-search"
                  onClick={() => setSearchTerm("")}
                  type="button"
                >
                  ×
                </button>
              )}
            </div>

            {/* STATUS CUSTOM DROPDOWN */}
            <CustomSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: "All Status", value: "ALL" },
                { label: "Open", value: "OPEN" },
                { label: "In Progress", value: "IN_PROGRESS" },
                { label: "Resolved", value: "RESOLVED" },
              ]}
            />

            {/* TOPIC CUSTOM DROPDOWN */}
            <CustomSelect
              label="Help Topic"
              value={topicFilter}
              onChange={setTopicFilter}
              options={[
                { label: "All Topics", value: "ALL" },
                ...helpTopics.map((topic) => ({
                  label: topic,
                  value: topic,
                })),
              ]}
            />

            {/* DATE CUSTOM DROPDOWN */}
            <CustomSelect
              label="Date"
              value={dateFilter}
              onChange={setDateFilter}
              options={[
                { label: "All Dates", value: "ALL" },
                { label: "Today", value: "TODAY" },
                { label: "Yesterday", value: "YESTERDAY" },
                { label: "Last 7 Days", value: "LAST_7_DAYS" },
                { label: "Last 30 Days", value: "LAST_30_DAYS" },
              ]}
            />
          </div>
        </div>

        {/* BULK ACTION BAR */}
        <div className="cm-bulk-bar">
          <div className="cm-bulk-left">
            <label className="cm-select-all-label">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={handleSelectAll}
                disabled={filteredMessages.length === 0}
              />
              <span>Select All</span>
            </label>

            <span className="cm-result-count">
              {filteredMessages.length} result
              {filteredMessages.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="cm-bulk-actions">
            {selectedIds.length > 0 && (
              <>
                <span className="cm-selected-count">
                  {selectedIds.length} selected
                </span>

                <button
                  className="cm-delete-selected-btn"
                  onClick={deleteSelected}
                  disabled={deleting}
                >
                  🗑 Delete Selected
                </button>
              </>
            )}

            <button
              className="cm-delete-all-btn"
              onClick={deleteAllMessages}
              disabled={deleting || messages.length === 0}
            >
              🗑 Delete All
            </button>
          </div>
        </div>

        {/* SELECTION BAR */}
        {selectedIds.length > 0 && (
          <div className="cm-selection-bar">
            <span>
              {selectedIds.length} message
              {selectedIds.length > 1 ? "s" : ""} selected
            </span>

            <button onClick={() => setSelectedIds([])}>
              Clear Selection
            </button>
          </div>
        )}

        {/* TABLE */}
        <div className="cm-card">
          {loading ? (
            <div className="cm-empty">
              <div className="cm-loading-spinner">⟳</div>
              Loading contact messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="cm-empty">
              <div className="cm-empty-icon">✉</div>
              <h3>No Contact Messages</h3>
              <p>Messages submitted by users will appear here.</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="cm-empty">
              <div className="cm-empty-icon">🔍</div>
              <h3>No Matching Messages</h3>
              <p>Try changing your search or filter options.</p>
              <button className="cm-empty-reset" onClick={resetFilters}>
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="cm-table-wrapper">
              <table className="cm-table">
                <thead>
                  <tr>
                    <th className="cm-checkbox-column">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>ID</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Help Topic</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMessages.map((message) => (
                    <tr
                      key={message.id}
                      className={!message.is_read ? "cm-unread-row" : ""}
                    >
                      <td className="cm-checkbox-column">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(message.id)}
                          onChange={() => handleSelectMessage(message.id)}
                        />
                      </td>

                      <td>
                        <span className="cm-id">#{message.id}</span>
                      </td>

                      <td>
                        <div className="cm-user">
                          <div className="cm-avatar">
                            {message.first_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <strong>
                              {message.first_name} {message.last_name}
                            </strong>
                            {!message.is_read && (
                              <span className="cm-new">NEW</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="cm-email">{message.email}</span>
                      </td>

                      <td>
                        <span className="cm-topic">
                          {message.help_topic}
                        </span>
                        {message.help_topic === "Other" &&
                          message.other_topic && (
                            <div className="cm-other-topic">
                              {message.other_topic}
                            </div>
                          )}
                      </td>

                      <td>
                        <div className="cm-message-preview">
                          {message.message}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`cm-status ${getStatusClass(
                            message.status
                          )}`}
                        >
                          {message.status === "IN_PROGRESS"
                            ? "In Progress"
                            : message.status}
                        </span>
                      </td>

                      <td>{formatDate(message.created_at)}</td>

                      <td>
                        <div className="cm-actions">
                          <button
                            className="cm-reply-btn"
                            onClick={() => openReply(message)}
                          >
                            Reply
                          </button>

                          <button
                            className="cm-view-btn"
                            onClick={() => {
                              setSelectedMessage(message);
                              if (!message.is_read) {
                                markAsRead(message.id);
                              }
                            }}
                          >
                            View
                          </button>

                          <button
                            className="cm-row-delete-btn"
                            onClick={() => deleteMessage(message.id)}
                            disabled={deleting}
                            title="Delete message"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* VIEW / REPLY MODAL */}
        {selectedMessage && (
          <div
            className="cm-modal-overlay"
            onClick={() => setSelectedMessage(null)}
          >
            <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="cm-modal-header">
                <div>
                  <h2>Contact Message</h2>
                  <span>Ticket #{selectedMessage.id}</span>
                </div>

                <button
                  className="cm-close"
                  onClick={() => setSelectedMessage(null)}
                >
                  ×
                </button>
              </div>

              <div className="cm-details">
                <div className="cm-detail">
                  <label>Name</label>
                  <p>
                    {selectedMessage.first_name} {selectedMessage.last_name}
                  </p>
                </div>

                <div className="cm-detail">
                  <label>Email</label>
                  <p>{selectedMessage.email}</p>
                </div>

                <div className="cm-detail">
                  <label>Phone</label>
                  <p>{selectedMessage.phone || "-"}</p>
                </div>

                <div className="cm-detail">
                  <label>Help Topic</label>
                  <p>{selectedMessage.help_topic}</p>
                  {selectedMessage.help_topic === "Other" &&
                    selectedMessage.other_topic && (
                      <small className="cm-modal-other-topic">
                        {selectedMessage.other_topic}
                      </small>
                    )}
                </div>

                {selectedMessage.auction_id && (
                  <div className="cm-detail">
                    <label>Auction ID</label>
                    <p>{selectedMessage.auction_id}</p>
                  </div>
                )}

                <div className="cm-detail">
                  <label>Submitted</label>
                  <p>{formatDate(selectedMessage.created_at)}</p>
                </div>

                <div className="cm-detail cm-detail-full">
                  <label>User Message</label>
                  <div className="cm-full-message">
                    {selectedMessage.message}
                  </div>
                </div>

                <div className="cm-detail">
                  <label>Status</label>
                  <select
                    value={selectedMessage.status}
                    onChange={(e) =>
                      updateStatus(selectedMessage.id, e.target.value)
                    }
                    className="cm-status-select"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>
                </div>

                <div className="cm-reply-section">
                  <label>Reply to User</label>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Write your reply to the user..."
                    rows="6"
                  />
                  <small>
                    Reply will be sent to:{" "}
                    <strong>{selectedMessage.email}</strong>
                  </small>
                </div>
              </div>

              <div className="cm-modal-footer">
                {!selectedMessage.is_read && (
                  <button
                    className="cm-read-btn"
                    onClick={() => markAsRead(selectedMessage.id)}
                  >
                    Mark as Read
                  </button>
                )}

                <button
                  className="cm-delete-modal-btn"
                  onClick={() => deleteMessage(selectedMessage.id)}
                  disabled={deleting}
                >
                  🗑 Delete
                </button>

                <button
                  className="cm-reply-modal-btn"
                  onClick={handleReply}
                  disabled={replying}
                >
                  {replying ? "Sending..." : "Send Reply"}
                </button>

                <button
                  className="cm-close-btn"
                  onClick={() => setSelectedMessage(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* PAGE */
        .cm-page {
          width: 100%;
          min-height: 100%;
          padding: 30px;
          box-sizing: border-box;
          background: radial-gradient(
              circle at 100% 0%,
              rgba(104, 66, 232, 0.06),
              transparent 30%
            ),
            #f7f8fc;
        }

        /* HEADER */
        .cm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .cm-header h1 {
          margin: 0;
          color: #17233c;
          font-size: 28px;
          font-weight: 750;
          letter-spacing: -0.4px;
        }

        .cm-header p {
          margin: 7px 0 0;
          color: #7b8499;
          font-size: 13px;
        }

        .cm-refresh-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid #dcd7f8;
          background: #ffffff;
          color: #6842e8;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          transition: all 0.2s ease;
        }

        .cm-refresh-btn:hover {
          background: #f5f2ff;
          border-color: #c9c0f5;
          transform: translateY(-1px);
        }

        .cm-refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* STATISTICS */
        .cm-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .cm-stat-card {
          position: relative;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e7eaf2;
          border-radius: 12px;
          padding: 18px 20px;
          box-shadow: 0 4px 18px rgba(15, 23, 42, 0.035);
        }

        .cm-stat-card::after {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          width: 3px;
          height: 100%;
          background: #6842e8;
        }

        .cm-stat-number {
          color: #18243c;
          font-size: 25px;
          font-weight: 750;
          line-height: 1.2;
        }

        .cm-stat-label {
          margin-top: 5px;
          color: #81899b;
          font-size: 12px;
          font-weight: 500;
        }

        /* FILTER CARD */
        .cm-filter-card {
          background: #ffffff;
          border: 1px solid #e7eaf2;
          border-radius: 12px;
          padding: 18px;
          margin-bottom: 16px;
          box-shadow: 0 4px 18px rgba(15, 23, 42, 0.035);
        }

        .cm-filter-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 15px;
        }

        .cm-filter-header h3 {
          margin: 0;
          color: #26344d;
          font-size: 14px;
          font-weight: 700;
        }

        .cm-filter-header span {
          display: block;
          margin-top: 3px;
          color: #9199a9;
          font-size: 11px;
        }

        .cm-reset-btn {
          border: none;
          background: transparent;
          color: #6842e8;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .cm-reset-btn:hover {
          color: #4d2cc4;
          text-decoration: underline;
        }

        .cm-filter-grid {
          display: grid;
          grid-template-columns:
            minmax(250px, 1.8fr)
            minmax(150px, 1fr)
            minmax(180px, 1.2fr)
            minmax(150px, 1fr);
          gap: 12px;
          align-items: end;
        }

        /* SEARCH */
        .cm-search-box {
          position: relative;
          width: 100%;
        }

        .cm-search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 13px;
          pointer-events: none;
          opacity: 0.7;
        }

        .cm-search-box input {
          width: 100%;
          height: 42px;
          box-sizing: border-box;
          padding: 0 38px 0 38px;
          border: 1px solid #dfe3eb;
          border-radius: 8px;
          outline: none;
          background: #ffffff;
          color: #26344d;
          font-family: inherit;
          font-size: 12px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .cm-search-box input::placeholder {
          color: #9ba3b2;
        }

        .cm-search-box input:focus {
          border-color: #6842e8;
          box-shadow: 0 0 0 3px rgba(104, 66, 232, 0.08);
        }

        .cm-clear-search {
          position: absolute;
          right: 9px;
          top: 50%;
          transform: translateY(-50%);
          width: 23px;
          height: 23px;
          border: none;
          border-radius: 50%;
          background: #f0f1f5;
          color: #737c8d;
          cursor: pointer;
          font-size: 16px;
          line-height: 20px;
        }

        .cm-clear-search:hover {
          background: #e6e7ec;
        }

        /* =====================================================
           NEW CUSTOM FLOATING DROPDOWN STYLES
        ===================================================== */
        .custom-select-container {
          position: relative;
          width: 100%;
        }

        .custom-select-label {
          display: block;
          margin-bottom: 6px;
          color: #68738a;
          font-size: 11px;
          font-weight: 700;
        }

        .custom-select-trigger {
          width: 100%;
          height: 42px;
          box-sizing: border-box;
          padding: 0 14px;
          border: 1px solid #dfe3eb;
          border-radius: 8px;
          background: #ffffff;
          color: #37435a;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          user-select: none;
          transition: all 0.2s ease;
        }

        .custom-select-trigger:hover,
        .custom-select-trigger.open {
          border-color: #6842e8;
          box-shadow: 0 0 0 3px rgba(104, 66, 232, 0.08);
        }

        .custom-select-arrow {
          font-size: 9px;
          color: #8991a3;
          transition: transform 0.2s ease;
        }

        .custom-select-trigger.open .custom-select-arrow {
          transform: rotate(180deg);
        }

        .custom-select-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          width: 100%;
          max-height: 210px;
          overflow-y: auto;
          background: #ffffff;
          border-radius: 12px;
          padding: 6px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.15);
          border: 1px solid #edf0f5;
          z-index: 100;
        }

        .custom-select-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 12px;
          color: #37435a;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .custom-select-option:hover {
          background: #f4f2ff;
          color: #6842e8;
        }

        .custom-select-option.selected {
          background: #eee9ff;
          color: #6842e8;
          font-weight: 600;
        }

        .custom-select-checkmark {
          font-size: 12px;
          color: #6842e8;
          font-weight: bold;
        }

        .custom-select-dropdown::-webkit-scrollbar {
          width: 6px;
        }

        .custom-select-dropdown::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-select-dropdown::-webkit-scrollbar-thumb {
          background: #dcd7f8;
          border-radius: 10px;
        }

        .custom-select-dropdown::-webkit-scrollbar-thumb:hover {
          background: #b5a8f5;
        }

        /* BULK BAR */
        .cm-bulk-bar {
          min-height: 52px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 9px 13px;
          margin-bottom: 12px;
          background: #ffffff;
          border: 1px solid #e7eaf2;
          border-radius: 10px;
        }

        .cm-bulk-left,
        .cm-bulk-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .cm-select-all-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #465168;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
        }

        .cm-select-all-label input {
          width: 15px;
          height: 15px;
          cursor: pointer;
          accent-color: #6842e8;
        }

        .cm-result-count {
          color: #939baa;
          font-size: 11px;
        }

        .cm-selected-count {
          color: #6842e8;
          font-size: 11px;
          font-weight: 700;
        }

        .cm-delete-selected-btn,
        .cm-delete-all-btn {
          border-radius: 7px;
          padding: 8px 12px;
          cursor: pointer;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          transition: all 0.2s ease;
        }

        .cm-delete-selected-btn {
          border: 1px solid #ffd3d3;
          background: #fff5f5;
          color: #dc3545;
        }

        .cm-delete-selected-btn:hover {
          background: #dc3545;
          color: #ffffff;
        }

        .cm-delete-all-btn {
          border: 1px solid #dc3545;
          background: #ffffff;
          color: #dc3545;
        }

        .cm-delete-all-btn:hover {
          background: #dc3545;
          color: #ffffff;
        }

        .cm-delete-selected-btn:disabled,
        .cm-delete-all-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* SELECTION BAR */
        .cm-selection-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          background: #eee9ff;
          border: 1px solid #dcd3ff;
          color: #6842e8;
          padding: 10px 14px;
          border-radius: 8px;
          margin-bottom: 12px;
          font-size: 12px;
          font-weight: 700;
        }

        .cm-selection-bar button {
          border: none;
          background: transparent;
          color: #6842e8;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        .cm-selection-bar button:hover {
          text-decoration: underline;
        }

        /* TABLE CARD */
        .cm-card {
          background: #ffffff;
          border: 1px solid #e7eaf2;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 18px rgba(15, 23, 42, 0.035);
        }

        .cm-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .cm-table {
          width: 100%;
          min-width: 1400px;
          border-collapse: collapse;
        }

        .cm-table th {
          background: #fafbfe;
          color: #68738a;
          font-size: 11px;
          font-weight: 700;
          text-align: left;
          padding: 14px 15px;
          border-bottom: 1px solid #e7eaf2;
          white-space: nowrap;
        }

        .cm-table td {
          padding: 15px;
          border-bottom: 1px solid #edf0f5;
          color: #4d586e;
          font-size: 12px;
          vertical-align: middle;
        }

        .cm-table tbody tr {
          transition: background 0.15s ease;
        }

        .cm-table tbody tr:hover {
          background: #fafaff;
        }

        .cm-checkbox-column {
          width: 45px;
          text-align: center !important;
        }

        .cm-checkbox-column input {
          width: 15px;
          height: 15px;
          cursor: pointer;
          accent-color: #6842e8;
        }

        .cm-id {
          color: #6842e8;
          font-weight: 750;
          white-space: nowrap;
        }

        .cm-unread-row {
          background: #fbfaff;
        }

        /* USER */
        .cm-user {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 160px;
        }

        .cm-avatar {
          width: 35px;
          height: 35px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #eee7ff;
          color: #6842e8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 750;
        }

        .cm-user strong {
          display: block;
          color: #1b2942;
          white-space: nowrap;
          font-size: 12px;
        }

        .cm-new {
          display: inline-block;
          margin-top: 4px;
          padding: 2px 6px;
          background: #eee7ff;
          color: #6842e8;
          border-radius: 4px;
          font-size: 8px;
          font-weight: 750;
        }

        .cm-email {
          color: #59647a;
          white-space: nowrap;
        }

        /* TOPIC */
        .cm-topic {
          color: #4c3bbd;
          font-weight: 650;
          white-space: nowrap;
        }

        .cm-other-topic {
          margin-top: 4px;
          color: #8a91a1;
          font-size: 10px;
        }

        /* MESSAGE */
        .cm-message-preview {
          max-width: 230px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #5e687b;
        }

        /* STATUS */
        .cm-status {
          display: inline-block;
          padding: 6px 9px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 750;
          white-space: nowrap;
        }

        .cm-status-open {
          background: #fff1f1;
          color: #e14c59;
        }

        .cm-status-progress {
          background: #fff5df;
          color: #d28b00;
        }

        .cm-status-resolved {
          background: #e8f8f1;
          color: #18a36d;
        }

        /* ACTIONS */
        .cm-actions {
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
        }

        .cm-view-btn,
        .cm-reply-btn,
        .cm-row-delete-btn {
          min-height: 30px;
          padding: 6px 9px;
          border-radius: 6px;
          cursor: pointer;
          font-family: inherit;
          font-size: 10px;
          font-weight: 700;
          transition: all 0.18s ease;
        }

        .cm-view-btn {
          border: 1px solid #ddd8f8;
          background: #f7f5ff;
          color: #6842e8;
        }

        .cm-view-btn:hover {
          background: #6842e8;
          color: #ffffff;
        }

        .cm-reply-btn {
          border: 1px solid #d5f0e5;
          background: #effaf5;
          color: #159765;
        }

        .cm-reply-btn:hover {
          background: #159765;
          color: #ffffff;
        }

        .cm-row-delete-btn {
          width: 31px;
          padding: 0;
          border: 1px solid #ffd4d4;
          background: #fff6f6;
          color: #dc3545;
        }

        .cm-row-delete-btn:hover {
          background: #dc3545;
          color: #ffffff;
        }

        .cm-row-delete-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* EMPTY */
        .cm-empty {
          padding: 75px 20px;
          text-align: center;
          color: #7c8597;
        }

        .cm-empty-icon {
          font-size: 40px;
          margin-bottom: 10px;
        }

        .cm-loading-spinner {
          margin-bottom: 10px;
          font-size: 28px;
          color: #6842e8;
          animation: cm-spin 1s linear infinite;
        }

        @keyframes cm-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .cm-empty h3 {
          color: #27344d;
          margin: 5px 0;
          font-size: 16px;
        }

        .cm-empty p {
          margin: 5px 0 15px;
          font-size: 12px;
        }

        .cm-empty-reset {
          border: none;
          background: #6842e8;
          color: #ffffff;
          padding: 8px 13px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        /* MODAL */
        .cm-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .cm-modal {
          width: 700px;
          max-width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          background: #ffffff;
          border-radius: 14px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .cm-modal-header {
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #edf0f5;
        }

        .cm-modal-header h2 {
          margin: 0;
          color: #17233c;
          font-size: 19px;
        }

        .cm-modal-header span {
          display: block;
          margin-top: 5px;
          color: #8a92a3;
          font-size: 11px;
        }

        .cm-close {
          border: none;
          background: transparent;
          font-size: 27px;
          color: #7c8496;
          cursor: pointer;
          line-height: 1;
        }

        .cm-close:hover {
          color: #dc3545;
        }

        /* DETAILS */
        .cm-details {
          padding: 24px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .cm-detail label,
        .cm-reply-section label {
          display: block;
          color: #8991a3;
          font-size: 11px;
          font-weight: 650;
          margin-bottom: 6px;
        }

        .cm-detail p {
          margin: 0;
          color: #26344d;
          font-size: 13px;
          font-weight: 500;
          word-break: break-word;
        }

        .cm-modal-other-topic {
          display: block;
          margin-top: 4px;
          color: #8a92a3;
          font-size: 11px;
        }

        .cm-detail-full {
          grid-column: 1 / -1;
        }

        .cm-full-message {
          background: #f8f9fc;
          border: 1px solid #e8ebf1;
          border-radius: 8px;
          padding: 14px;
          line-height: 1.6;
          color: #465168;
          white-space: pre-wrap;
          font-size: 13px;
        }

        /* REPLY */
        .cm-reply-section {
          grid-column: 1 / -1;
          padding-top: 5px;
        }

        .cm-reply-section textarea {
          width: 100%;
          box-sizing: border-box;
          resize: vertical;
          min-height: 130px;
          padding: 13px;
          border: 1px solid #dfe3eb;
          border-radius: 8px;
          outline: none;
          font-family: inherit;
          font-size: 13px;
          color: #26344d;
        }

        .cm-reply-section textarea:focus {
          border-color: #6842e8;
          box-shadow: 0 0 0 3px rgba(104, 66, 232, 0.08);
        }

        .cm-reply-section small {
          display: block;
          margin-top: 7px;
          color: #8a92a3;
          font-size: 10px;
        }

        /* STATUS SELECT */
        .cm-status-select {
          width: 180px;
          padding: 9px 11px;
          border: 1px solid #dfe3eb;
          border-radius: 7px;
          background: #ffffff;
          color: #37435a;
          outline: none;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
        }

        .cm-status-select:focus {
          border-color: #6842e8;
        }

        /* MODAL FOOTER */
        .cm-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #edf0f5;
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          flex-wrap: wrap;
        }

        .cm-read-btn,
        .cm-delete-modal-btn,
        .cm-reply-modal-btn,
        .cm-close-btn {
          padding: 9px 14px;
          border-radius: 7px;
          cursor: pointer;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
        }

        .cm-read-btn {
          border: none;
          background: #6842e8;
          color: #ffffff;
        }

        .cm-read-btn:hover {
          background: #5733ce;
        }

        .cm-delete-modal-btn {
          border: 1px solid #ffd1d1;
          background: #fff5f5;
          color: #dc3545;
        }

        .cm-delete-modal-btn:hover {
          background: #dc3545;
          color: #ffffff;
        }

        .cm-delete-modal-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .cm-reply-modal-btn {
          border: none;
          background: #159765;
          color: #ffffff;
        }

        .cm-reply-modal-btn:hover {
          background: #117e55;
        }

        .cm-reply-modal-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cm-close-btn {
          border: 1px solid #dfe3eb;
          background: #ffffff;
          color: #59647a;
        }

        .cm-close-btn:hover {
          background: #f5f6f8;
        }

        /* RESPONSIVE */
        @media (max-width: 1100px) {
          .cm-filter-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 900px) {
          .cm-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .cm-bulk-bar {
            align-items: flex-start;
            flex-direction: column;
          }

          .cm-bulk-actions {
            width: 100%;
          }
        }

        @media (max-width: 650px) {
          .cm-page {
            padding: 18px;
          }

          .cm-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .cm-refresh-btn {
            width: 100%;
          }

          .cm-stats {
            grid-template-columns: 1fr;
          }

          .cm-filter-grid {
            grid-template-columns: 1fr;
          }

          .cm-filter-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .cm-reset-btn {
            padding: 0;
          }

          .cm-selection-bar {
            align-items: flex-start;
            flex-direction: column;
          }

          .cm-bulk-actions {
            width: 100%;
          }

          .cm-delete-selected-btn,
          .cm-delete-all-btn {
            flex: 1;
          }

          .cm-details {
            grid-template-columns: 1fr;
            padding: 18px;
          }

          .cm-detail-full,
          .cm-reply-section {
            grid-column: auto;
          }

          .cm-modal-footer {
            padding: 14px 18px;
          }

          .cm-modal-footer button {
            flex: 1;
          }
        }
      `}</style>
    </>
  );
};

export default ContactMessages;