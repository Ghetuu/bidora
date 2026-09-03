import React, { useEffect, useState } from "react";
import "../styles/pendingauction.css";

const API_BASE_URL = "http://127.0.0.1:8000";

const PendingAuction = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // =====================================================
  // FETCH PENDING AUCTIONS
  // =====================================================

  const fetchPendingAuctions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/auctions/pending`
      );

      if (!response.ok) {
        throw new Error("Unable to load pending auctions.");
      }

      const data = await response.json();

      setAuctions(data);
    } catch (err) {
      console.error("Pending auction error:", err);

      setError(
        err.message || "Unable to load pending auctions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingAuctions();
  }, []);

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // =====================================================
  // FORMAT DATE ONLY
  // =====================================================

  const formatDateOnly = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // CURRENCY
  // =====================================================

  const formatCurrency = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "₹0";
    }

    return `₹${Number(value).toLocaleString("en-IN")}`;
  };

  // =====================================================
  // FILE URL
  // =====================================================

  const getFileUrl = (path) => {
    if (!path) {
      return null;
    }

    if (path.startsWith("http")) {
      return path;
    }

    const cleanPath = path.replace(/^\/+/, "");

    return `${API_BASE_URL}/${cleanPath}`;
  };

  // =====================================================
  // APPROVE
  // =====================================================

  const handleApprove = async (auctionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to approve this auction?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(auctionId);

      const response = await fetch(
        `${API_BASE_URL}/admin/auctions/${auctionId}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to approve auction."
        );
      }

      alert("Auction approved successfully.");

      setSelectedAuction(null);

      await fetchPendingAuctions();
    } catch (err) {
      console.error(err);

      alert(
        err.message || "Unable to approve auction."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // =====================================================
  // REJECT
  // =====================================================

  const handleReject = async (auctionId) => {
    const remark = window.prompt(
      "Enter rejection reason (optional):"
    );

    if (remark === null) {
      return;
    }

    try {
      setProcessingId(auctionId);

      const response = await fetch(
        `${API_BASE_URL}/admin/auctions/${auctionId}/reject`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            remark,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to reject auction."
        );
      }

      alert("Auction rejected successfully.");

      setSelectedAuction(null);

      await fetchPendingAuctions();
    } catch (err) {
      console.error(err);

      alert(
        err.message || "Unable to reject auction."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="pa-page">
        <div className="pa-loading">
          <div className="pa-spinner"></div>

          <p>
            Loading pending auctions...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="pa-page">
        <div className="pa-page-header">
          <div>
            <span className="pa-eyebrow">
              AUCTION MANAGEMENT
            </span>

            <h1>
              Pending Auctions
            </h1>

            <p>
              Review auctions submitted by sellers.
            </p>
          </div>
        </div>

        <div className="pa-error">
          <div className="pa-error-icon">
            !
          </div>

          <h3>
            Unable to load auctions
          </h3>

          <p>
            {error}
          </p>

          <button
            className="pa-retry-btn"
            onClick={fetchPendingAuctions}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN PAGE
  // =====================================================

  return (
    <div className="pa-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="pa-page-header">
        <div>
          <span className="pa-eyebrow">
            AUCTION MANAGEMENT
          </span>

          <h1>
            Pending Auctions
          </h1>

          <p>
            Review complete auction information before
            approving or rejecting a seller submission.
          </p>
        </div>

        <div className="pa-header-count">
          <strong>
            {auctions.length}
          </strong>

          <span>
            Pending
          </span>
        </div>
      </div>

      {/* =====================================================
          EMPTY
      ===================================================== */}

      {auctions.length === 0 ? (
        <div className="pa-empty">
          <div className="pa-empty-icon">
            ✓
          </div>

          <h2>
            No Pending Auctions
          </h2>

          <p>
            There are currently no auctions waiting
            for admin approval.
          </p>
        </div>
      ) : (
        <div className="pa-auction-list">

          {auctions.map((auction) => (
            <div
              className="pa-auction-card"
              key={auction.id}
            >

              {/* =================================================
                  CARD TOP
              ================================================= */}

              <div className="pa-card-top">
                <div className="pa-card-title-area">
                  <span className="pa-pending-badge">
                    PENDING
                  </span>

                  <h2>
                    {auction.product_title ||
                      "Untitled Auction"}
                  </h2>

                  <p>
                    Auction #{auction.id}
                    {" · "}
                    Submitted{" "}
                    {formatDate(
                      auction.created_at
                    )}
                  </p>
                </div>

                <div className="pa-card-actions">
                  <button
                    className="pa-view-btn"
                    onClick={() =>
                      setSelectedAuction(
                        auction
                      )
                    }
                  >
                    View Full Details
                  </button>
                </div>
              </div>

              {/* =================================================
                  SUMMARY
              ================================================= */}

              <div className="pa-summary">

                <div className="pa-summary-item">
                  <span>
                    Category
                  </span>

                  <strong>
                    {auction.category || "—"}
                  </strong>
                </div>

                <div className="pa-summary-item">
                  <span>
                    Condition
                  </span>

                  <strong>
                    {auction.product_condition ||
                      "—"}
                  </strong>
                </div>

                <div className="pa-summary-item">
                  <span>
                    Starting Price
                  </span>

                  <strong>
                    {formatCurrency(
                      auction.starting_price
                    )}
                  </strong>
                </div>

                <div className="pa-summary-item">
                  <span>
                    Auction End
                  </span>

                  <strong>
                    {formatDate(
                      auction.auction_end
                    )}
                  </strong>
                </div>

                <div className="pa-summary-item">
                  <span>
                    Seller
                  </span>

                  <strong>
                    {auction.seller_name || "—"}
                  </strong>
                </div>

              </div>

              {/* =================================================
                  QUICK IMAGES
              ================================================= */}

              {auction.images &&
                auction.images.length > 0 && (
                  <div className="pa-card-images">

                    {auction.images
                      .slice(0, 5)
                      .map((image) => (
                        <img
                          key={image.id}
                          src={getFileUrl(
                            image.image_path
                          )}
                          alt={
                            auction.product_title
                          }
                          className="pa-thumbnail"
                        />
                      ))}

                    {auction.images.length > 5 && (
                      <div className="pa-more-images">
                        +{auction.images.length - 5}
                      </div>
                    )}

                  </div>
                )}

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <div className="pa-bottom-actions">

                <button
                  className="pa-reject-btn"
                  disabled={
                    processingId === auction.id
                  }
                  onClick={() =>
                    handleReject(auction.id)
                  }
                >
                  {processingId === auction.id
                    ? "Processing..."
                    : "Reject"}
                </button>

                <button
                  className="pa-approve-btn"
                  disabled={
                    processingId === auction.id
                  }
                  onClick={() =>
                    handleApprove(auction.id)
                  }
                >
                  {processingId === auction.id
                    ? "Processing..."
                    : "Approve Auction"}
                </button>

              </div>

            </div>
          ))}

        </div>
      )}

      {/* =====================================================
          FULL DETAILS MODAL
      ===================================================== */}

      {selectedAuction && (
        <div
          className="pa-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedAuction(null);
            }
          }}
        >

          <div className="pa-modal">

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="pa-modal-header">

              <div>
                <span className="pa-eyebrow">
                  PENDING AUCTION #{selectedAuction.id}
                </span>

                <h2>
                  {selectedAuction.product_title}
                </h2>
              </div>

              <button
                className="pa-close-btn"
                onClick={() =>
                  setSelectedAuction(null)
                }
              >
                ×
              </button>

            </div>

            <div className="pa-modal-body">

              {/* =================================================
                  01 PRODUCT INFORMATION
              ================================================= */}

              <section className="pa-detail-section">

                <div className="pa-section-heading">
                  <span>
                    01
                  </span>

                  <h3>
                    Product Information
                  </h3>
                </div>

                <div className="pa-detail-grid">

                  <Detail
                    label="Product Title"
                    value={
                      selectedAuction.product_title
                    }
                  />

                  <Detail
                    label="Brand / Model"
                    value={
                      selectedAuction.brand_model
                    }
                  />

                  <Detail
                    label="Category"
                    value={
                      selectedAuction.category
                    }
                  />

                  <Detail
                    label="Condition"
                    value={
                      selectedAuction.product_condition
                    }
                  />

                </div>

                <div className="pa-description">

                  <span>
                    Product Description
                  </span>

                  <p>
                    {selectedAuction.description ||
                      "—"}
                  </p>

                </div>

              </section>

              {/* =================================================
                  00 AUCTION CREATED BY
              ================================================= */}

              <section className="pa-detail-section">

                <div className="pa-section-heading">
                  <span>
                    00
                  </span>

                  <h3>
                    Auction Created By
                  </h3>
                </div>

                {selectedAuction.created_by_user ? (
                  <div className="pa-user-card">

                    <Detail
                      label="User ID"
                      value={
                        selectedAuction
                          .created_by_user.id
                      }
                    />

                    <Detail
                      label="Username"
                      value={
                        selectedAuction
                          .created_by_user.username
                      }
                    />

                    <Detail
                      label="Email"
                      value={
                        selectedAuction
                          .created_by_user.email
                      }
                    />

                  </div>
                ) : (
                  <div className="pa-no-file">
                    User information is not available.
                  </div>
                )}

              </section>

              {/* =================================================
                  02 PURCHASE
              ================================================= */}

              <section className="pa-detail-section">

                <div className="pa-section-heading">
                  <span>
                    02
                  </span>

                  <h3>
                    Purchase & Proof Details
                  </h3>
                </div>

                <div className="pa-detail-grid">

                  <Detail
                    label="Date of Product Buy"
                    value={formatDateOnly(
                      selectedAuction.purchase_date
                    )}
                  />

                  <Detail
                    label="Who Purchased"
                    value={
                      selectedAuction.purchased_by
                    }
                  />

                  <Detail
                    label="Original Purchase Price"
                    value={formatCurrency(
                      selectedAuction.purchase_price
                    )}
                  />

                </div>

                <div className="pa-proof-row">

                  <ProofButton
                    label="Purchase Proof"
                    path={
                      selectedAuction.purchase_proof_path
                    }
                  />

                </div>

              </section>

              {/* =================================================
                  03 SELLER
              ================================================= */}

              <section className="pa-detail-section">

                <div className="pa-section-heading">
                  <span>
                    03
                  </span>

                  <h3>
                    Seller Details
                  </h3>
                </div>

                <div className="pa-detail-grid">

                  <Detail
                    label="Seller Name"
                    value={
                      selectedAuction.seller_name
                    }
                  />

                  <Detail
                    label="Seller Email"
                    value={
                      selectedAuction.seller_email
                    }
                  />

                  <Detail
                    label="Contact Number"
                    value={
                      selectedAuction.seller_contact
                    }
                  />

                  <Detail
                    label="Area / Street"
                    value={
                      selectedAuction.location_area
                    }
                  />

                  <Detail
                    label="City"
                    value={
                      selectedAuction.location_city
                    }
                  />

                  <Detail
                    label="State"
                    value={
                      selectedAuction.location_state
                    }
                  />

                  <Detail
                    label="Country"
                    value={
                      selectedAuction.location_country
                    }
                  />

                  <Detail
                    label="Pincode"
                    value={
                      selectedAuction.location_pincode
                    }
                  />

                </div>

                <div className="pa-proof-row">

                  <ProofButton
                    label="Seller Verification Proof"
                    path={
                      selectedAuction.seller_proof_path
                    }
                  />

                </div>

              </section>

              {/* =================================================
                  04 PRODUCT IMAGES
              ================================================= */}

              <section className="pa-detail-section">

                <div className="pa-section-heading">
                  <span>
                    04
                  </span>

                  <h3>
                    Product Images
                  </h3>
                </div>

                {selectedAuction.images &&
                selectedAuction.images.length > 0 ? (
                  <div className="pa-full-image-grid">

                    {selectedAuction.images.map(
                      (image, index) => (
                        <div
                          className="pa-full-image-item"
                          key={image.id}
                        >

                          <img
                            src={getFileUrl(
                              image.image_path
                            )}
                            alt={`Product ${
                              index + 1
                            }`}
                          />

                          {index === 0 && (
                            <span className="pa-cover-label">
                              Cover
                            </span>
                          )}

                        </div>
                      )
                    )}

                  </div>
                ) : (
                  <div className="pa-no-file">
                    No product images available.
                  </div>
                )}

              </section>

              {/* =================================================
                  05 AUCTION DETAILS
              ================================================= */}

              <section className="pa-detail-section">

                <div className="pa-section-heading">
                  <span>
                    05
                  </span>

                  <h3>
                    Auction Details
                  </h3>
                </div>

                <div className="pa-detail-grid">

                  <Detail
                    label="Starting Price"
                    value={formatCurrency(
                      selectedAuction.starting_price
                    )}
                  />

                  <Detail
                    label="Starting Date & Time"
                    value={formatDate(
                      selectedAuction.auction_start
                    )}
                  />

                  <Detail
                    label="Ending Date & Time"
                    value={formatDate(
                      selectedAuction.auction_end
                    )}
                  />

                </div>

              </section>

              {/* =================================================
                  06 LOCATION & DELIVERY
              ================================================= */}

              <section className="pa-detail-section">

                <div className="pa-section-heading">
                  <span>
                    06
                  </span>

                  <h3>
                    Location & Delivery
                  </h3>
                </div>

                <div className="pa-detail-grid">

                  <Detail
                    label="Product Location"
                    value={
                      selectedAuction.location_area
                        ? `${selectedAuction.location_area}, ${selectedAuction.location_city}, ${selectedAuction.location_state}`
                        : "—"
                    }
                  />

                  <Detail
                    label="Delivery / Pickup"
                    value={
                      selectedAuction.delivery_type
                    }
                  />

                  <Detail
                    label="Shipping Type"
                    value={
                      selectedAuction.shipping_type
                    }
                  />

                  <Detail
                    label="Shipping Charges"
                    value={formatCurrency(
                      selectedAuction.shipping_charges
                    )}
                  />

                  <Detail
                    label="Shipping Paid By"
                    value={
                      selectedAuction.shipping_paid_by
                    }
                  />

                </div>

              </section>

              {/* =================================================
                  07 WARRANTY
              ================================================= */}

              <section className="pa-detail-section">

                <div className="pa-section-heading">
                  <span>
                    07
                  </span>

                  <h3>
                    Warranty
                  </h3>
                </div>

                <div className="pa-detail-grid">

                  <Detail
                    label="Warranty Status"
                    value={
                      selectedAuction.warranty_status
                    }
                  />

                </div>

              </section>

              {/* =================================================
                  08 PAYMENT
              ================================================= */}

              <section className="pa-detail-section">

                <div className="pa-section-heading">
                  <span>
                    08
                  </span>

                  <h3>
                    Payment Method
                  </h3>
                </div>

                <div className="pa-detail-grid">

                  <Detail
                    label="Payment Method"
                    value={
                      selectedAuction.payment_method
                    }
                  />

                </div>

              </section>

              {/* =================================================
                  09 TERMS
              ================================================= */}

              <section className="pa-detail-section">

                <div className="pa-section-heading">
                  <span>
                    09
                  </span>

                  <h3>
                    Product Terms
                  </h3>
                </div>

                <div className="pa-description">

                  <span>
                    Terms & Conditions
                  </span>

                  <p>
                    {selectedAuction.product_terms ||
                      "—"}
                  </p>

                </div>

                <div className="pa-terms-status">

                  <span
                    className={
                      selectedAuction.terms_accepted
                        ? "pa-terms-accepted"
                        : "pa-terms-not-accepted"
                    }
                  >
                    {selectedAuction.terms_accepted
                      ? "✓ Terms Accepted"
                      : "✕ Terms Not Accepted"}
                  </span>

                </div>

              </section>

            </div>

            {/* =================================================
                MODAL FOOTER
            ================================================= */}

            <div className="pa-modal-footer">

              <button
                className="pa-modal-reject"
                disabled={
                  processingId ===
                  selectedAuction.id
                }
                onClick={() =>
                  handleReject(
                    selectedAuction.id
                  )
                }
              >
                Reject Auction
              </button>

              <button
                className="pa-modal-approve"
                disabled={
                  processingId ===
                  selectedAuction.id
                }
                onClick={() =>
                  handleApprove(
                    selectedAuction.id
                  )
                }
              >
                Approve Auction
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

// =====================================================
// DETAIL COMPONENT
// =====================================================

const Detail = ({
  label,
  value,
}) => {
  return (
    <div className="pa-detail-item">

      <span>
        {label}
      </span>

      <strong>
        {value || "—"}
      </strong>

    </div>
  );
};

// =====================================================
// PROOF BUTTON
// =====================================================

const ProofButton = ({
  label,
  path,
}) => {
  const url = path
    ? (
        path.startsWith("http")
          ? path
          : `${API_BASE_URL}/${path.replace(/^\/+/, "")}`
      )
    : null;

  if (!url) {
    return (
      <div className="pa-proof-missing">
        {label}: Not available
      </div>
    );
  }

  return (
    <a
      className="pa-proof-btn"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>
        ↗
      </span>

      {label}
    </a>
  );
};

export default PendingAuction;