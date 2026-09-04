import React, { useEffect, useState } from "react";

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedMessage, setSelectedMessage] =
    useState(null);

  const [selectedIds, setSelectedIds] = useState([]);

  const [replyMessage, setReplyMessage] = useState("");

  const [replying, setReplying] = useState(false);

  // =====================================================
  // FETCH CONTACT MESSAGES
  // =====================================================

  const fetchMessages = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "http://127.0.0.1:8000/admin/contact-messages"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch contact messages"
        );
      }

      const data = await response.json();

      setMessages(data);

    } catch (error) {

      console.error(
        "Error fetching contact messages:",
        error
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // =====================================================
  // SELECT / UNSELECT SINGLE MESSAGE
  // =====================================================

  const handleSelectMessage = (id) => {

    setSelectedIds((prev) => {

      if (prev.includes(id)) {

        return prev.filter(
          (selectedId) => selectedId !== id
        );

      }

      return [...prev, id];

    });

  };

  // =====================================================
  // SELECT ALL
  // =====================================================

  const handleSelectAll = () => {

    if (
      selectedIds.length === messages.length &&
      messages.length > 0
    ) {

      setSelectedIds([]);

    } else {

      setSelectedIds(
        messages.map((message) => message.id)
      );

    }

  };

  // =====================================================
  // MARK AS READ
  // =====================================================

  const markAsRead = async (id) => {

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/admin/contact-messages/${id}/read`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to mark message as read"
        );
      }

      await fetchMessages();

      if (selectedMessage?.id === id) {

        setSelectedMessage((prev) => ({
          ...prev,
          is_read: true,
        }));

      }

    } catch (error) {

      console.error(
        "Error marking message as read:",
        error
      );

    }

  };

  // =====================================================
  // UPDATE STATUS
  // =====================================================

  const updateStatus = async (id, status) => {

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/admin/contact-messages/${id}/status`,
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

        throw new Error(
          data.detail ||
          "Failed to update status"
        );

      }

      await fetchMessages();

      if (selectedMessage?.id === id) {

        setSelectedMessage((prev) => ({
          ...prev,
          status: status,

          is_read:
            status !== "OPEN"
              ? true
              : prev.is_read,
        }));

      }

    } catch (error) {

      console.error(
        "Error updating contact status:",
        error
      );

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
        `http://127.0.0.1:8000/admin/contact-messages/${selectedMessage.id}/reply`,
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

        throw new Error(
          data.detail ||
          "Failed to send reply."
        );

      }

      alert(
        "Reply sent successfully to " +
        selectedMessage.email
      );

      setReplyMessage("");

      setSelectedMessage(null);

      await fetchMessages();

    } catch (error) {

      console.error(
        "Reply error:",
        error
      );

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

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );

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
  // CHECK ALL
  // =====================================================

  const allSelected =
    messages.length > 0 &&
    selectedIds.length === messages.length;

  return (
    <>
      <div className="cm-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="cm-header">

          <div>

            <h1>
              Contact Messages
            </h1>

            <p>
              Manage messages received from
              Bidora users.
            </p>

          </div>

          <button
            className="cm-refresh-btn"
            onClick={fetchMessages}
          >
            ↻ Refresh
          </button>

        </div>


        {/* =================================================
            SELECTED COUNT
        ================================================= */}

        {selectedIds.length > 0 && (

          <div className="cm-selection-bar">

            <span>
              {selectedIds.length} message
              {selectedIds.length > 1
                ? "s"
                : ""} selected
            </span>

            <button
              onClick={() =>
                setSelectedIds([])
              }
            >
              Clear Selection
            </button>

          </div>

        )}


        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="cm-stats">

          <div className="cm-stat-card">

            <div className="cm-stat-number">
              {messages.length}
            </div>

            <div className="cm-stat-label">
              Total Messages
            </div>

          </div>


          <div className="cm-stat-card">

            <div className="cm-stat-number">

              {
                messages.filter(
                  (message) =>
                    !message.is_read
                ).length
              }

            </div>

            <div className="cm-stat-label">
              Unread
            </div>

          </div>


          <div className="cm-stat-card">

            <div className="cm-stat-number">

              {
                messages.filter(
                  (message) =>
                    message.status ===
                    "OPEN"
                ).length
              }

            </div>

            <div className="cm-stat-label">
              Open
            </div>

          </div>


          <div className="cm-stat-card">

            <div className="cm-stat-number">

              {
                messages.filter(
                  (message) =>
                    message.status ===
                    "RESOLVED"
                ).length
              }

            </div>

            <div className="cm-stat-label">
              Resolved
            </div>

          </div>

        </div>


        {/* =================================================
            TABLE
        ================================================= */}

        <div className="cm-card">

          {loading ? (

            <div className="cm-empty">

              Loading contact messages...

            </div>

          ) : messages.length === 0 ? (

            <div className="cm-empty">

              <div className="cm-empty-icon">
                ✉
              </div>

              <h3>
                No Contact Messages
              </h3>

              <p>
                Messages submitted by users
                will appear here.
              </p>

            </div>

          ) : (

            <div className="cm-table-wrapper">

              <table className="cm-table">

                <thead>

                  <tr>

                    {/* CHECKBOX */}

                    <th className="cm-checkbox-column">

                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={
                          handleSelectAll
                        }
                      />

                    </th>


                    {/* ID */}

                    <th>
                      ID
                    </th>


                    <th>
                      User
                    </th>

                    <th>
                      Email
                    </th>

                    <th>
                      Help Topic
                    </th>

                    <th>
                      Message
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {messages.map(
                    (message, index) => (

                    <tr
                      key={message.id}
                      className={
                        !message.is_read
                          ? "cm-unread-row"
                          : ""
                      }
                    >

                      {/* CHECKBOX */}

                      <td className="cm-checkbox-column">

                        <input
                          type="checkbox"
                          checked={selectedIds.includes(
                            message.id
                          )}
                          onChange={() =>
                            handleSelectMessage(
                              message.id
                            )
                          }
                        />

                      </td>


                      {/* ID */}

                      <td>

                        <span className="cm-id">

                          {message.id}

                        </span>

                      </td>


                      {/* USER */}

                      <td>

                        <div className="cm-user">

                          <div className="cm-avatar">

                            {message.first_name
                              ?.charAt(0)
                              ?.toUpperCase()}

                          </div>

                          <div>

                            <strong>

                              {message.first_name}{" "}
                              {message.last_name}

                            </strong>

                            {!message.is_read && (

                              <span className="cm-new">
                                NEW
                              </span>

                            )}

                          </div>

                        </div>

                      </td>


                      {/* EMAIL */}

                      <td>
                        {message.email}
                      </td>


                      {/* TOPIC */}

                      <td>

                        <span className="cm-topic">

                          {message.help_topic}

                        </span>

                        {message.help_topic ===
                          "Other" &&
                          message.other_topic && (

                          <div className="cm-other-topic">

                            {message.other_topic}

                          </div>

                        )}

                      </td>


                      {/* MESSAGE */}

                      <td>

                        <div className="cm-message-preview">

                          {message.message}

                        </div>

                      </td>


                      {/* STATUS */}

                      <td>

                        <span
                          className={`cm-status ${getStatusClass(
                            message.status
                          )}`}
                        >

                          {message.status ===
                          "IN_PROGRESS"
                            ? "In Progress"
                            : message.status}

                        </span>

                      </td>


                      {/* DATE */}

                      <td>

                        {formatDate(
                          message.created_at
                        )}

                      </td>


                      {/* ACTION */}

                      <td>

                        <div className="cm-actions">

                          <button
                            className="cm-reply-btn"
                            onClick={() =>
                              openReply(
                                message
                              )
                            }
                          >
                            Reply
                          </button>


                          <button
                            className="cm-view-btn"
                            onClick={() => {

                              setSelectedMessage(
                                message
                              );

                              if (
                                !message.is_read
                              ) {

                                markAsRead(
                                  message.id
                                );

                              }

                            }}
                          >
                            View
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


        {/* =================================================
            VIEW / REPLY MODAL
        ================================================= */}

        {selectedMessage && (

          <div
            className="cm-modal-overlay"
            onClick={() =>
              setSelectedMessage(null)
            }
          >

            <div
              className="cm-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="cm-modal-header">

                <div>

                  <h2>
                    Contact Message
                  </h2>

                  <span>
                    Ticket #
                    {selectedMessage.id}
                  </span>

                </div>

                <button
                  className="cm-close"
                  onClick={() =>
                    setSelectedMessage(null)
                  }
                >
                  ×
                </button>

              </div>


              <div className="cm-details">

                {/* NAME */}

                <div className="cm-detail">

                  <label>
                    Name
                  </label>

                  <p>
                    {selectedMessage.first_name}{" "}
                    {selectedMessage.last_name}
                  </p>

                </div>


                {/* EMAIL */}

                <div className="cm-detail">

                  <label>
                    Email
                  </label>

                  <p>
                    {selectedMessage.email}
                  </p>

                </div>


                {/* PHONE */}

                <div className="cm-detail">

                  <label>
                    Phone
                  </label>

                  <p>
                    {selectedMessage.phone ||
                      "-"}
                  </p>

                </div>


                {/* TOPIC */}

                <div className="cm-detail">

                  <label>
                    Help Topic
                  </label>

                  <p>
                    {selectedMessage.help_topic}
                  </p>

                </div>


                {/* AUCTION */}

                {selectedMessage.auction_id && (

                  <div className="cm-detail">

                    <label>
                      Auction ID
                    </label>

                    <p>
                      {selectedMessage.auction_id}
                    </p>

                  </div>

                )}


                {/* DATE */}

                <div className="cm-detail">

                  <label>
                    Submitted
                  </label>

                  <p>
                    {formatDate(
                      selectedMessage.created_at
                    )}
                  </p>

                </div>


                {/* MESSAGE */}

                <div className="cm-detail">

                  <label>
                    User Message
                  </label>

                  <div className="cm-full-message">

                    {selectedMessage.message}

                  </div>

                </div>


                {/* STATUS */}

                <div className="cm-detail">

                  <label>
                    Status
                  </label>

                  <select
                    value={
                      selectedMessage.status
                    }
                    onChange={(e) =>
                      updateStatus(
                        selectedMessage.id,
                        e.target.value
                      )
                    }
                    className="cm-status-select"
                  >

                    <option value="OPEN">
                      OPEN
                    </option>

                    <option value="IN_PROGRESS">
                      IN PROGRESS
                    </option>

                    <option value="RESOLVED">
                      RESOLVED
                    </option>

                  </select>

                </div>


                {/* =================================================
                    REPLY BOX
                ================================================= */}

                <div className="cm-reply-section">

                  <label>
                    Reply to User
                  </label>

                  <textarea
                    value={replyMessage}
                    onChange={(e) =>
                      setReplyMessage(
                        e.target.value
                      )
                    }
                    placeholder="Write your reply to the user..."
                    rows="6"
                  />

                  <small>
                    Reply will be sent to:
                    {" "}
                    <strong>
                      {selectedMessage.email}
                    </strong>
                  </small>

                </div>

              </div>


              {/* =================================================
                  FOOTER
              ================================================= */}

              <div className="cm-modal-footer">

                {!selectedMessage.is_read && (

                  <button
                    className="cm-read-btn"
                    onClick={() =>
                      markAsRead(
                        selectedMessage.id
                      )
                    }
                  >
                    Mark as Read
                  </button>

                )}


                <button
                  className="cm-reply-modal-btn"
                  onClick={handleReply}
                  disabled={replying}
                >

                  {replying
                    ? "Sending..."
                    : "Send Reply"}

                </button>


                <button
                  className="cm-close-btn"
                  onClick={() =>
                    setSelectedMessage(null)
                  }
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        )}

      </div>


      {/* =====================================================
          CSS
      ====================================================== */}

      <style>{`

        .cm-page {
          padding: 30px;
          min-height: 100%;
          background: #f7f8fc;
        }

        .cm-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .cm-header h1 {
          margin: 0;
          font-size: 28px;
          color: #17233c;
        }

        .cm-header p {
          margin: 7px 0 0;
          color: #7b8499;
        }

        .cm-refresh-btn {
          border: none;
          background: #6842e8;
          color: white;
          padding: 11px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .cm-refresh-btn:hover {
          background: #5733ce;
        }

        .cm-selection-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #eee9ff;
          border: 1px solid #dcd3ff;
          color: #6842e8;
          padding: 11px 15px;
          border-radius: 8px;
          margin-bottom: 18px;
          font-size: 13px;
          font-weight: 600;
        }

        .cm-selection-bar button {
          border: none;
          background: transparent;
          color: #6842e8;
          cursor: pointer;
          font-weight: 600;
        }

        .cm-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          margin-bottom: 22px;
        }

        .cm-stat-card {
          background: white;
          border: 1px solid #e7eaf2;
          border-radius: 12px;
          padding: 20px;
        }

        .cm-stat-number {
          font-size: 26px;
          font-weight: 700;
          color: #18243c;
        }

        .cm-stat-label {
          margin-top: 5px;
          color: #81899b;
          font-size: 14px;
        }

        .cm-card {
          background: white;
          border: 1px solid #e7eaf2;
          border-radius: 12px;
          overflow: hidden;
        }

        .cm-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .cm-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1250px;
        }

        .cm-table th {
          background: #fafbfe;
          color: #68738a;
          font-size: 13px;
          font-weight: 600;
          text-align: left;
          padding: 16px;
          border-bottom: 1px solid #e7eaf2;
          white-space: nowrap;
        }

        .cm-table td {
          padding: 17px 16px;
          border-bottom: 1px solid #edf0f5;
          color: #4d586e;
          font-size: 13px;
          vertical-align: middle;
        }

        .cm-checkbox-column {
          width: 45px;
          text-align: center !important;
        }

        .cm-checkbox-column input {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #6842e8;
        }

        .cm-id {
          color: #6842e8;
          font-weight: 700;
        }

        .cm-unread-row {
          background: #fbfaff;
        }

        .cm-user {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .cm-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #eee7ff;
          color: #6842e8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .cm-user strong {
          display: block;
          color: #1b2942;
          white-space: nowrap;
        }

        .cm-new {
          display: inline-block;
          margin-top: 4px;
          padding: 2px 6px;
          background: #eee7ff;
          color: #6842e8;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 700;
        }

        .cm-topic {
          color: #4c3bbd;
          font-weight: 600;
          white-space: nowrap;
        }

        .cm-other-topic {
          margin-top: 4px;
          color: #8a91a1;
          font-size: 11px;
        }

        .cm-message-preview {
          max-width: 230px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cm-status {
          display: inline-block;
          padding: 6px 9px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
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

        .cm-actions {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .cm-view-btn,
        .cm-reply-btn {
          padding: 7px 11px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 12px;
        }

        .cm-view-btn {
          border: 1px solid #ddd8f8;
          background: #f7f5ff;
          color: #6842e8;
        }

        .cm-view-btn:hover {
          background: #6842e8;
          color: white;
        }

        .cm-reply-btn {
          border: 1px solid #d5f0e5;
          background: #effaf5;
          color: #159765;
        }

        .cm-reply-btn:hover {
          background: #159765;
          color: white;
        }

        .cm-empty {
          padding: 70px 20px;
          text-align: center;
          color: #7c8597;
        }

        .cm-empty-icon {
          font-size: 42px;
          margin-bottom: 10px;
        }

        .cm-empty h3 {
          color: #27344d;
          margin: 5px 0;
        }

        .cm-empty p {
          margin: 5px 0;
        }

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
          background: white;
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
        }

        .cm-modal-header span {
          display: block;
          margin-top: 5px;
          color: #8a92a3;
          font-size: 12px;
        }

        .cm-close {
          border: none;
          background: transparent;
          font-size: 28px;
          color: #7c8496;
          cursor: pointer;
        }

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
          font-size: 12px;
          margin-bottom: 6px;
        }

        .cm-detail p {
          margin: 0;
          color: #26344d;
          font-size: 14px;
          font-weight: 500;
          word-break: break-word;
        }

        .cm-full-message {
          background: #f8f9fc;
          border: 1px solid #e8ebf1;
          border-radius: 8px;
          padding: 14px;
          line-height: 1.6;
          color: #465168;
          white-space: pre-wrap;
        }

        .cm-detail:nth-last-child(2) {
          grid-column: 1 / -1;
        }

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
          font-size: 14px;
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
        }

        .cm-status-select {
          width: 180px;
          padding: 9px 11px;
          border: 1px solid #dfe3eb;
          border-radius: 7px;
          background: white;
          color: #37435a;
        }

        .cm-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #edf0f5;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .cm-read-btn {
          border: none;
          background: #6842e8;
          color: white;
          padding: 9px 15px;
          border-radius: 7px;
          cursor: pointer;
          font-weight: 600;
        }

        .cm-reply-modal-btn {
          border: none;
          background: #159765;
          color: white;
          padding: 9px 16px;
          border-radius: 7px;
          cursor: pointer;
          font-weight: 600;
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
          background: white;
          color: #59647a;
          padding: 9px 15px;
          border-radius: 7px;
          cursor: pointer;
        }

        @media (max-width: 900px) {

          .cm-stats {
            grid-template-columns: repeat(2, 1fr);
          }

        }

        @media (max-width: 600px) {

          .cm-page {
            padding: 18px;
          }

          .cm-header {
            align-items: flex-start;
            gap: 15px;
          }

          .cm-stats {
            grid-template-columns: 1fr;
          }

          .cm-details {
            grid-template-columns: 1fr;
          }

          .cm-reply-section {
            grid-column: auto;
          }

        }

      `}</style>
    </>
  );
};

export default ContactMessages;