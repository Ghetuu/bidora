import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  FaArrowLeft,
  FaGavel,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaTag,
  FaBoxOpen,
  FaUser,
  FaTruck,
  FaFileInvoice,
  FaShieldAlt,
  FaImage,
  FaTimes,
  FaExpand,
  FaFileAlt,
  FaCheckCircle,
  FaClock,
  FaStopCircle,
  FaEye,
  FaHeart,
  FaLink,
} from "react-icons/fa";

import "../styles/auctiondetails.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function AuctionDetails() {
  const location = useLocation();
  const navigate = useNavigate();

  // =========================================================
  // AUCTION DATA
  // =========================================================

  const auction = location.state?.auction;

  // =========================================================
  // SOURCE PAGE
  // =========================================================

  const from = location.state?.from || "my-auctions";

  const isAllAuctions = from === "all-auctions";

  const backPath = isAllAuctions
    ? "/dashboard/all-auctions"
    : "/dashboard/my-auctions";

  const backLabel = isAllAuctions
    ? "Back to All Auctions"
    : "Back to My Auctions";

  // =========================================================
  // IMAGE POPUP
  // =========================================================

  const [selectedImage, setSelectedImage] = useState(null);

  // =========================================================
  // AUCTION NOT FOUND
  // =========================================================

  if (!auction) {
    return (
      <div className="auction-details-page">
        <div className="auction-details-not-found">
          <FaBoxOpen />

          <h2>Auction Details Not Available</h2>

          <p>
            This auction information is not available. Please return to{" "}
            {isAllAuctions ? "All Auctions" : "My Auctions"} and try again.
          </p>

          <button
            type="button"
            onClick={() => navigate(backPath)}
          >
            <FaArrowLeft />
            {backLabel}
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // HELPERS
  // =========================================================

  const formatPrice = (price) => {
    if (
      price === null ||
      price === undefined ||
      price === "" ||
      Number.isNaN(Number(price))
    ) {
      return "₹0";
    }

    return `₹${Number(price).toLocaleString("en-IN")}`;
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) {
      return "Not available";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Not available";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatValue = (value, fallback = "N/A") => {
    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    ) {
      return fallback;
    }

    return String(value);
  };

  const formatLabel = (value) => {
    if (!value) {
      return "N/A";
    }

    return String(value)
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // =========================================================
  // AUCTION STATUS
  // =========================================================
  // Priority:
  // 1. If auction has already ended -> ENDED
  // 2. If start time is in future -> UPCOMING
  // 3. If currently between start and end -> LIVE
  // 4. Otherwise use backend status
  // =========================================================

  const getAuctionStatus = () => {
    const now = new Date();

    const start = auction.auction_start
      ? new Date(auction.auction_start)
      : null;

    const end = auction.auction_end
      ? new Date(auction.auction_end)
      : null;

    if (
      end &&
      !Number.isNaN(end.getTime()) &&
      now > end
    ) {
      return "ended";
    }

    if (
      start &&
      !Number.isNaN(start.getTime()) &&
      now < start
    ) {
      return "upcoming";
    }

    if (
      start &&
      end &&
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      now >= start &&
      now <= end
    ) {
      return "live";
    }

    return String(
      auction.auction_status ||
      auction.status ||
      "approved"
    ).toLowerCase();
  };

  const status = getAuctionStatus();

  const getStatusLabel = () => {
    switch (status) {
      case "live":
        return "Live Auction";

      case "upcoming":
        return "Upcoming Auction";

      case "ended":
        return "Ended Auction";

      case "approved":
        return "Approved";

      case "pending":
        return "Pending Approval";

      case "rejected":
        return "Rejected";

      default:
        return formatLabel(status);
    }
  };

  // =========================================================
  // STATUS ICON
  // =========================================================

  const getStatusIcon = () => {
    switch (status) {
      case "live":
        return <span className="status-live-dot"></span>;

      case "upcoming":
        return <FaClock />;

      case "ended":
        return <FaStopCircle />;

      case "approved":
        return <FaCheckCircle />;

      default:
        return <span className="status-default-dot"></span>;
    }
  };

  // =========================================================
  // IMAGE URL
  // =========================================================

  const getImageUrl = (image) => {
    if (!image) {
      return null;
    }

    const imagePath =
      typeof image === "string"
        ? image
        : image.image_path ||
          image.image_url ||
          image.url ||
          image.path;

    if (!imagePath) {
      return null;
    }

    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      return imagePath;
    }

    return `${API_BASE_URL}/${imagePath.replace(/^\/+/, "")}`;
  };

  // =========================================================
  // AUCTION IMAGES
  // =========================================================

  const auctionImages = Array.isArray(auction.images)
    ? [...auction.images]
        .sort(
          (a, b) =>
            Number(a?.display_order || 0) -
            Number(b?.display_order || 0)
        )
        .map((image, index) => ({
          original: image,
          url: getImageUrl(image),
          index,
        }))
        .filter((image) => image.url)
    : [];

  // =========================================================
  // IMAGE LABEL
  // =========================================================

  const getImageLabel = (index) => {
    if (index === 0) {
      return "Cover Image";
    }

    return `Product Image ${index + 1}`;
  };

  const getImageDescription = (index) => {
    if (index === 0) {
      return "Main auction product image";
    }

    return `Additional product image ${index + 1}`;
  };

  // =========================================================
  // OPEN IMAGE POPUP
  // =========================================================

  const openImagePopup = (image, index) => {
    if (!image?.url) {
      return;
    }

    setSelectedImage({
      url: image.url,
      index,
    });
  };

  // =========================================================
  // CLOSE IMAGE POPUP
  // =========================================================

  const closeImagePopup = () => {
    setSelectedImage(null);
  };

  // =========================================================
  // ESC KEY
  // =========================================================

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedImage(null);
      }
    };

    if (selectedImage) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [selectedImage]);

  // =========================================================
  // DOCUMENT URL
  // =========================================================

  const getDocumentUrl = (documentPath) => {
    if (!documentPath) {
      return null;
    }

    if (
      documentPath.startsWith("http://") ||
      documentPath.startsWith("https://")
    ) {
      return documentPath;
    }

    return `${API_BASE_URL}/${documentPath.replace(/^\/+/, "")}`;
  };

  const purchaseProofUrl = getDocumentUrl(
    auction.purchase_proof_path ||
      auction.purchase_proof_url ||
      auction.purchase_proof
  );

  const sellerProofUrl = getDocumentUrl(
    auction.seller_proof_path ||
      auction.seller_proof_url ||
      auction.seller_proof
  );

  // =========================================================
  // MAIN IMAGE
  // =========================================================

  const coverImage =
    auctionImages.length > 0
      ? auctionImages[0]
      : null;

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="auction-details-page">

      {/* =====================================================
          TOP HEADER
      ===================================================== */}

      <div className="auction-details-header">

        <button
          type="button"
          className="auction-back-btn"
          onClick={() => navigate(backPath)}
        >
          <FaArrowLeft />
          {backLabel}
        </button>

        <div
          className={`auction-details-status ${status}`}
        >
          {getStatusIcon()}
          <span>{getStatusLabel()}</span>
        </div>

      </div>

      {/* =====================================================
          MAIN PRODUCT HERO
      ===================================================== */}

      <div className="auction-details-hero">

        {/* LEFT IMAGE AREA */}

        <div className="auction-hero-image-area">

          <div
            className={`auction-hero-main-image ${
              coverImage ? "clickable" : ""
            }`}
            onClick={() =>
              coverImage &&
              openImagePopup(
                coverImage,
                0
              )
            }
          >

            {coverImage ? (
              <img
                src={coverImage.url}
                alt={
                  auction.product_title ||
                  "Auction product"
                }
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";

                  const fallback =
                    event.currentTarget.parentElement?.querySelector(
                      ".auction-hero-image-fallback"
                    );

                  if (fallback) {
                    fallback.style.display =
                      "flex";
                  }
                }}
              />
            ) : null}

            <div
              className="auction-hero-image-fallback"
              style={{
                display: coverImage
                  ? "none"
                  : "flex",
              }}
            >
              <FaBoxOpen />
              <span>No Image Available</span>
            </div>

            {coverImage && (
              <div className="hero-image-expand">
                <FaExpand />
              </div>
            )}

          </div>

          {/* THUMBNAILS */}

          {auctionImages.length > 1 && (
            <div className="auction-hero-thumbnails">

              {auctionImages
                .slice(0, 5)
                .map((image, index) => (
                  <button
                    key={`${image.url}-${index}`}
                    type="button"
                    className={`auction-thumbnail ${
                      index === 0
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      openImagePopup(
                        image,
                        index
                      )
                    }
                  >
                    <img
                      src={image.url}
                      alt={getImageLabel(index)}
                    />
                  </button>
                ))}

              {auctionImages.length > 5 && (
                <button
                  type="button"
                  className="auction-more-images"
                  onClick={() =>
                    openImagePopup(
                      auctionImages[5],
                      5
                    )
                  }
                >
                  +{auctionImages.length - 5}
                </button>
              )}

            </div>
          )}

        </div>

        {/* MIDDLE PRODUCT INFORMATION */}

        <div className="auction-hero-product">

          <span className="auction-details-number">
            AUCTION #{formatValue(auction.id)}
          </span>

          <h1>
            {formatValue(
              auction.product_title,
              "Untitled Auction"
            )}
          </h1>

          {auction.brand_model && (
            <p className="hero-brand-model">
              {auction.brand_model}
            </p>
          )}

          <div className="hero-category-row">

            {auction.category && (
              <span className="hero-category">
                <FaTag />
                {formatLabel(
                  auction.category
                )}
              </span>
            )}

            {auction.product_condition && (
              <span className="hero-condition">
                {formatLabel(
                  auction.product_condition
                )}
              </span>
            )}

          </div>

          <p className="hero-description">
            {formatValue(
              auction.description,
              "No description available."
            )}
          </p>

          <div className="hero-mini-info">

            <div>
              <FaUser />
              <span>Seller</span>
              <strong>
                {formatValue(
                  auction.seller_name
                )}
              </strong>
            </div>

            <div>
              <FaShieldAlt />
              <span>Warranty</span>
              <strong>
                {formatLabel(
                  auction.warranty_status
                )}
              </strong>
            </div>

            <div>
              <FaCalendarAlt />
              <span>Ends</span>
              <strong>
                {formatDate(
                  auction.auction_end
                )}
              </strong>
            </div>

          </div>

        </div>

        {/* RIGHT BID CARD */}

        <div className="auction-bid-card">

          <span className="bid-card-label">
            Starting Price
          </span>

          <strong className="bid-card-price">
            {formatPrice(
              auction.starting_price
            )}
          </strong>

          <div className="bid-card-divider"></div>

          <span className="bid-card-label">
            Auction Status
          </span>

          <div
            className={`bid-status-small ${status}`}
          >
            {getStatusIcon()}
            {getStatusLabel()}
          </div>

          <div className="bid-card-end">

            <span>Ends On</span>

            <strong>
              {formatDateTime(
                auction.auction_end
              )}
            </strong>

          </div>

          <button
            type="button"
            className="place-bid-btn"
            onClick={() =>
              handleViewAuction?.(auction)
            }
            disabled={
              status === "ended" ||
              status === "upcoming"
            }
          >
            <FaGavel />
            {status === "ended"
              ? "Auction Ended"
              : status === "upcoming"
              ? "Auction Not Started"
              : "Place Your Bid"}
          </button>

          <button
            type="button"
            className="watchlist-btn"
          >
            <FaHeart />
            Add to Watchlist
          </button>

        </div>

      </div>

      {/* =====================================================
          AUCTION INFORMATION + SELLER
      ===================================================== */}

      <div className="auction-main-layout">

        <div className="auction-main-column">

          {/* AUCTION INFORMATION */}

          <section className="auction-detail-card">

            <div className="auction-card-heading">
              <div className="heading-icon">
                <FaGavel />
              </div>

              <div>
                <h2>Auction Information</h2>
                <p>
                  Important details about this auction
                </p>
              </div>
            </div>

            <div className="auction-info-grid">

              <div className="auction-info-box">
                <FaCalendarAlt />
                <div>
                  <span>Auction Start</span>
                  <strong>
                    {formatDateTime(
                      auction.auction_start
                    )}
                  </strong>
                </div>
              </div>

              <div className="auction-info-box">
                <FaCalendarAlt />
                <div>
                  <span>Auction End</span>
                  <strong>
                    {formatDateTime(
                      auction.auction_end
                    )}
                  </strong>
                </div>
              </div>

              <div className="auction-info-box">
                <FaTag />
                <div>
                  <span>Category</span>
                  <strong>
                    {formatLabel(
                      auction.category
                    )}
                  </strong>
                </div>
              </div>

              <div className="auction-info-box">
                <FaGavel />
                <div>
                  <span>Starting Price</span>
                  <strong className="info-price">
                    {formatPrice(
                      auction.starting_price
                    )}
                  </strong>
                </div>
              </div>

              <div className="auction-info-box">
                <FaGavel />
                <div>
                  <span>Bid Increment</span>
                  <strong>
                    {formatPrice(
                      auction.bid_increment
                    )}
                  </strong>
                </div>
              </div>

              <div className="auction-info-box">
                <FaCheckCircle />
                <div>
                  <span>Status</span>

                  <strong
                    className={`detail-status ${status}`}
                  >
                    {getStatusLabel()}
                  </strong>
                </div>
              </div>

            </div>

          </section>

          {/* PRODUCT DESCRIPTION */}

          <section className="auction-detail-card">

            <div className="auction-card-heading">
              <div className="heading-icon">
                <FaFileAlt />
              </div>

              <div>
                <h2>Product Description</h2>
                <p>
                  Detailed information about the product
                </p>
              </div>
            </div>

            <div className="auction-detail-description">
              <p>
                {formatValue(
                  auction.description,
                  "No description available."
                )}
              </p>
            </div>

            <div className="product-feature-grid">

              <div>
                <FaBoxOpen />
                <span>Condition</span>
                <strong>
                  {formatLabel(
                    auction.product_condition
                  )}
                </strong>
              </div>

              <div>
                <FaShieldAlt />
                <span>Warranty</span>
                <strong>
                  {formatLabel(
                    auction.warranty_status
                  )}
                </strong>
              </div>

              <div>
                <FaTag />
                <span>Category</span>
                <strong>
                  {formatLabel(
                    auction.category
                  )}
                </strong>
              </div>

              <div>
                <FaUser />
                <span>Brand / Model</span>
                <strong>
                  {formatValue(
                    auction.brand_model
                  )}
                </strong>
              </div>

            </div>

          </section>

          {/* PURCHASE INFORMATION */}

          <section className="auction-detail-card">

            <div className="auction-card-heading">
              <div className="heading-icon">
                <FaFileInvoice />
              </div>

              <div>
                <h2>Purchase Information</h2>
                <p>
                  Original product purchase details
                </p>
              </div>
            </div>

            <div className="auction-info-grid">

              <div className="auction-info-box">
                <FaCalendarAlt />
                <div>
                  <span>Date of Product Buy</span>
                  <strong>
                    {formatDate(
                      auction.purchase_date
                    )}
                  </strong>
                </div>
              </div>

              <div className="auction-info-box">
                <FaUser />
                <div>
                  <span>Purchased By</span>
                  <strong>
                    {formatValue(
                      auction.purchased_by
                    )}
                  </strong>
                </div>
              </div>

              <div className="auction-info-box">
                <FaGavel />
                <div>
                  <span>Original Purchase Price</span>
                  <strong className="info-price">
                    {formatPrice(
                      auction.purchase_price
                    )}
                  </strong>
                </div>
              </div>

            </div>

            {purchaseProofUrl && (
              <div className="auction-document-view">

                <div className="auction-document-info">

                  <div className="auction-document-icon">
                    <FaFileInvoice />
                  </div>

                  <div>
                    <strong>
                      Bill / Proof of Purchase
                    </strong>

                    <span>
                      Purchase verification document
                    </span>
                  </div>

                </div>

                <a
                  href={purchaseProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="auction-document-btn"
                >
                  View Document
                </a>

              </div>
            )}

          </section>

          {/* DELIVERY */}

          <section className="auction-detail-card">

            <div className="auction-card-heading">
              <div className="heading-icon">
                <FaTruck />
              </div>

              <div>
                <h2>Delivery & Shipping</h2>
                <p>
                  Delivery and shipping information
                </p>
              </div>
            </div>

            <div className="auction-info-grid">

              <div className="auction-info-box">
                <FaTruck />
                <div>
                  <span>Delivery / Pickup</span>
                  <strong>
                    {formatLabel(
                      auction.delivery_type
                    )}
                  </strong>
                </div>
              </div>

              <div className="auction-info-box">
                <FaTruck />
                <div>
                  <span>Shipping Type</span>
                  <strong>
                    {formatLabel(
                      auction.shipping_type
                    )}
                  </strong>
                </div>
              </div>

              <div className="auction-info-box">
                <FaTag />
                <div>
                  <span>Shipping Charges</span>
                  <strong>
                    {formatPrice(
                      auction.shipping_charges
                    )}
                  </strong>
                </div>
              </div>

              <div className="auction-info-box">
                <FaUser />
                <div>
                  <span>Shipping Paid By</span>
                  <strong>
                    {formatLabel(
                      auction.shipping_paid_by
                    )}
                  </strong>
                </div>
              </div>

            </div>

          </section>

          {/* TERMS */}

          <section className="auction-detail-card">

            <div className="auction-card-heading">
              <div className="heading-icon">
                <FaShieldAlt />
              </div>

              <div>
                <h2>Seller Terms & Conditions</h2>
                <p>
                  Terms provided by the seller
                </p>
              </div>
            </div>

            <div className="auction-terms-box">

              <p>
                {formatValue(
                  auction.product_terms,
                  "No Seller Terms & Conditions provided."
                )}
              </p>

            </div>

          </section>

          {/* AUCTION RECORD */}

          <section className="auction-detail-card">

            <div className="auction-card-heading">
              <div className="heading-icon">
                <FaCalendarAlt />
              </div>

              <div>
                <h2>Auction Record</h2>
                <p>
                  Auction creation and update information
                </p>
              </div>
            </div>

            <div className="auction-info-grid">

              <div className="auction-info-box">
                <FaLink />
                <div>
                  <span>Auction ID</span>
                  <strong>
                    #{formatValue(auction.id)}
                  </strong>
                </div>
              </div>

              <div className="auction-info-box">
                <FaCalendarAlt />
                <div>
                  <span>Created On</span>
                  <strong>
                    {formatDateTime(
                      auction.created_at
                    )}
                  </strong>
                </div>
              </div>

              {auction.updated_at && (
                <div className="auction-info-box">
                  <FaCalendarAlt />
                  <div>
                    <span>Last Updated</span>
                    <strong>
                      {formatDateTime(
                        auction.updated_at
                      )}
                    </strong>
                  </div>
                </div>
              )}

            </div>

          </section>

        </div>

        {/* =================================================
            RIGHT SIDEBAR
        ================================================= */}

        <aside className="auction-sidebar">

          {/* SELLER */}

          <section className="auction-sidebar-card">

            <div className="sidebar-heading">
              <FaUser />
              <h3>Seller Information</h3>
            </div>

            <div className="seller-profile">

              <div className="seller-avatar">
                <FaUser />
              </div>

              <div>
                <strong>
                  {formatValue(
                    auction.seller_name
                  )}
                </strong>

                <span>
                  Seller
                </span>
              </div>

            </div>

            <div className="seller-details">

              <div>
                <span>Email</span>
                <strong>
                  {formatValue(
                    auction.seller_email
                  )}
                </strong>
              </div>

              <div>
                <span>Contact</span>
                <strong>
                  {formatValue(
                    auction.seller_contact
                  )}
                </strong>
              </div>

            </div>

            {sellerProofUrl && (
              <a
                href={sellerProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sidebar-document-btn"
              >
                <FaShieldAlt />
                View Seller Verification
              </a>
            )}

          </section>

          {/* LOCATION */}

          <section className="auction-sidebar-card">

            <div className="sidebar-heading">
              <FaMapMarkerAlt />
              <h3>Location</h3>
            </div>

            <div className="sidebar-location">

              <div>
                <span>Area / Locality</span>
                <strong>
                  {formatValue(
                    auction.location_area
                  )}
                </strong>
              </div>

              <div>
                <span>City</span>
                <strong>
                  {formatValue(
                    auction.location_city
                  )}
                </strong>
              </div>

              <div>
                <span>State</span>
                <strong>
                  {formatValue(
                    auction.location_state
                  )}
                </strong>
              </div>

              <div>
                <span>Country</span>
                <strong>
                  {formatValue(
                    auction.location_country
                  )}
                </strong>
              </div>

              <div>
                <span>Pincode</span>
                <strong>
                  {formatValue(
                    auction.location_pincode
                  )}
                </strong>
              </div>

            </div>

          </section>

          {/* ADDITIONAL INFORMATION */}

          <section className="auction-sidebar-card">

            <div className="sidebar-heading">
              <FaShieldAlt />
              <h3>Additional Information</h3>
            </div>

            <div className="sidebar-list">

              <div>
                <span>Warranty</span>
                <strong>
                  {formatLabel(
                    auction.warranty_status
                  )}
                </strong>
              </div>

              <div>
                <span>Payment Method</span>
                <strong>
                  {formatValue(
                    auction.payment_method
                  )}
                </strong>
              </div>

              <div>
                <span>Terms Accepted</span>
                <strong>
                  {auction.terms_accepted === true ||
                  auction.terms_accepted === "true"
                    ? "Yes"
                    : "No"}
                </strong>
              </div>

            </div>

          </section>

        </aside>

      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="auction-details-footer">

        <div>
          <FaCalendarAlt />

          <span>
            Created on{" "}
            {formatDateTime(
              auction.created_at
            )}
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate(backPath)}
        >
          <FaArrowLeft />
          {backLabel}
        </button>

      </div>

      {/* =====================================================
          IMAGE PREVIEW MODAL
      ===================================================== */}

      {selectedImage && (
        <div
          className="auction-image-preview-modal"
          onClick={closeImagePopup}
        >

          <div
            className="auction-image-preview-content"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="auction-image-preview-close"
              onClick={closeImagePopup}
              aria-label="Close image preview"
            >
              <FaTimes />
            </button>

            <div className="auction-image-preview-label">
              <FaImage />
              <span>
                {getImageLabel(
                  selectedImage.index
                )}
              </span>
            </div>

            <img
              src={selectedImage.url}
              alt={`${getImageLabel(
                selectedImage.index
              )} preview`}
              className="auction-image-preview-img"
            />

            <div className="auction-image-preview-counter">
              Image {selectedImage.index + 1} of{" "}
              {auctionImages.length}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default AuctionDetails;