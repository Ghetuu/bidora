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
} from "react-icons/fa";

import "../styles/auctiondetails.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function AuctionDetails() {
  const location = useLocation();
  const navigate = useNavigate();

  const auction = location.state?.auction;

  // ---------------------------------------------------------
  // IMAGE POPUP
  // ---------------------------------------------------------

  const [selectedImage, setSelectedImage] = useState(null);

  // ---------------------------------------------------------
  // AUCTION NOT FOUND
  // ---------------------------------------------------------

  if (!auction) {
    return (
      <div className="auction-details-page">
        <div className="auction-details-not-found">
          <FaBoxOpen />

          <h2>Auction Details Not Available</h2>

          <p>
            This auction information is not available. Please return to
            My Auctions and try again.
          </p>

          <button
            type="button"
            onClick={() => navigate("/dashboard/my-auctions")}
          >
            <FaArrowLeft />
            Back to My Auctions
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------

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

  // ---------------------------------------------------------
  // STATUS
  // ---------------------------------------------------------

  const status = String(
    auction.status || "pending"
  ).toLowerCase();

  // ---------------------------------------------------------
  // IMAGE URL
  // ---------------------------------------------------------

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

  // ---------------------------------------------------------
  // AUCTION IMAGES
  // ---------------------------------------------------------

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

  // ---------------------------------------------------------
  // IMAGE LABEL
  // ---------------------------------------------------------

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

  // ---------------------------------------------------------
  // OPEN IMAGE POPUP
  // ---------------------------------------------------------

  const openImagePopup = (image, index) => {
    if (!image?.url) {
      return;
    }

    setSelectedImage({
      url: image.url,
      index,
    });
  };

  // ---------------------------------------------------------
  // CLOSE IMAGE POPUP
  // ---------------------------------------------------------

  const closeImagePopup = () => {
    setSelectedImage(null);
  };

  // ---------------------------------------------------------
  // ESC KEY
  // ---------------------------------------------------------

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedImage(null);
      }
    };

    if (selectedImage) {
      document.addEventListener(
        "keydown",
        handleEscape
      );
    }

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [selectedImage]);

  // ---------------------------------------------------------
  // DOCUMENT URL
  // ---------------------------------------------------------

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

    return `${API_BASE_URL}/${documentPath.replace(
      /^\/+/,
      ""
    )}`;
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

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <div className="auction-details-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="auction-details-header">
        <button
          type="button"
          className="auction-back-btn"
          onClick={() =>
            navigate("/dashboard/my-auctions")
          }
        >
          <FaArrowLeft />
          Back to My Auctions
        </button>

        <div
          className={`auction-details-status ${status}`}
        >
          <span></span>
          {formatLabel(status)}
        </div>
      </div>

      {/* =====================================================
          MAIN CARD
      ===================================================== */}

      <div className="auction-details-card">

        {/* =================================================
            PRODUCT HEADER
        ================================================= */}

        <div className="auction-details-product-header">

          <div className="auction-details-icon">
            <FaGavel />
          </div>

          <div>
            <span className="auction-details-number">
              Auction #{formatValue(auction.id)}
            </span>

            <h1>
              {formatValue(
                auction.product_title,
                "Untitled Auction"
              )}
            </h1>

            {auction.brand_model && (
              <p>
                {auction.brand_model}
              </p>
            )}
          </div>
        </div>

        {/* =================================================
            CATEGORY
        ================================================= */}

        {auction.category && (
          <div className="auction-detail-category">
            <FaTag />
            {formatLabel(auction.category)}
          </div>
        )}

        {/* =================================================
            PRODUCT IMAGES
        ================================================= */}

        {auctionImages.length > 0 && (
          <section className="auction-detail-section auction-images-section">

            <div className="auction-images-section-header">
              <div>
                <h2>
                  <FaImage />
                  Product Images
                </h2>

                <p className="auction-images-subtitle">
                  Images uploaded with this auction
                </p>
              </div>

              <span className="auction-image-count">
                {auctionImages.length}{" "}
                {auctionImages.length === 1
                  ? "Image"
                  : "Images"}
              </span>
            </div>

            <div className="auction-details-image-grid">

              {auctionImages.map(
                (image, index) => (
                  <div
                    className={`auction-details-image-card ${
                      index === 0
                        ? "auction-cover-image-card"
                        : ""
                    }`}
                    key={`${image.url}-${index}`}
                  >

                    {/* IMAGE */}
                    <button
                      type="button"
                      className="auction-details-image"
                      onClick={() =>
                        openImagePopup(
                          image,
                          index
                        )
                      }
                      aria-label={`View ${getImageLabel(
                        index
                      )}`}
                    >
                      <img
                        src={image.url}
                        alt={`${getImageLabel(
                          index
                        )} - ${
                          auction.product_title ||
                          "Auction product"
                        }`}
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";

                          const fallback =
                            event.currentTarget.parentElement?.querySelector(
                              ".auction-image-error"
                            );

                          if (fallback) {
                            fallback.style.display =
                              "flex";
                          }
                        }}
                      />

                      <div className="auction-image-error">
                        <FaImage />
                        <span>
                          Image unavailable
                        </span>
                      </div>

                      <div className="auction-image-overlay">
                        <FaExpand />
                        <span>
                          Click to preview
                        </span>
                      </div>

                      {/* COVER BADGE */}
                      {index === 0 && (
                        <span className="auction-cover-badge">
                          COVER IMAGE
                        </span>
                      )}
                    </button>

                    {/* IMAGE INFORMATION */}
                    <div className="auction-image-info">

                      <div>
                        <strong>
                          {getImageLabel(index)}
                        </strong>

                        <span>
                          {getImageDescription(
                            index
                          )}
                        </span>
                      </div>

                      <span className="auction-image-number">
                        {index + 1}/
                        {auctionImages.length}
                      </span>

                    </div>
                  </div>
                )
              )}

            </div>
          </section>
        )}

        {/* =================================================
            PRODUCT INFORMATION
        ================================================= */}

        <section className="auction-detail-section">
          <h2>
            <FaBoxOpen />
            Product Information
          </h2>

          <div className="auction-details-grid">

            <div className="auction-detail-item">
              <span>Auction Title</span>

              <strong>
                {formatValue(
                  auction.product_title,
                  "Untitled Auction"
                )}
              </strong>
            </div>

            <div className="auction-detail-item">
              <span>Brand / Model</span>

              <strong>
                {formatValue(
                  auction.brand_model
                )}
              </strong>
            </div>

            <div className="auction-detail-item">
              <span>Category</span>

              <strong>
                {formatLabel(
                  auction.category
                )}
              </strong>
            </div>

            <div className="auction-detail-item">
              <span>Condition</span>

              <strong>
                {formatLabel(
                  auction.product_condition
                )}
              </strong>
            </div>

            <div className="auction-detail-item">
              <span>Warranty Status</span>

              <strong>
                {formatLabel(
                  auction.warranty_status
                )}
              </strong>
            </div>

          </div>
        </section>

        {/* =================================================
            DESCRIPTION
        ================================================= */}

        <section className="auction-detail-section">
          <h2>
            <FaFileAlt />
            Product Description
          </h2>

          <div className="auction-detail-description">
            <p>
              {formatValue(
                auction.description,
                "No description available."
              )}
            </p>
          </div>
        </section>

        {/* =================================================
            AUCTION INFORMATION
        ================================================= */}

        <section className="auction-detail-section">
          <h2>
            <FaGavel />
            Auction Information
          </h2>

          <div className="auction-details-grid">

            <div className="auction-detail-item">
              <span>Starting Bid</span>

              <strong className="auction-price">
                {formatPrice(
                  auction.starting_price
                )}
              </strong>
            </div>

            <div className="auction-detail-item">
              <span>Original Purchase Price</span>

              <strong>
                {formatPrice(
                  auction.purchase_price
                )}
              </strong>
            </div>

            <div className="auction-detail-item">
              <span>Auction Start</span>

              <strong>
                {formatDateTime(
                  auction.auction_start
                )}
              </strong>
            </div>

            <div className="auction-detail-item">
              <span>Auction End</span>

              <strong>
                {formatDateTime(
                  auction.auction_end
                )}
              </strong>
            </div>

            <div className="auction-detail-item">
              <span>Status</span>

              <strong
                className={`detail-status ${status}`}
              >
                {formatLabel(status)}
              </strong>
            </div>

          </div>
        </section>

        {/* =================================================
            PURCHASE INFORMATION
        ================================================= */}

        <section className="auction-detail-section">

          <h2>
            <FaFileInvoice />
            Purchase Information
          </h2>

          <div className="auction-details-grid">

            <div className="auction-detail-item">
              <span>Date of Product Buy</span>

              <strong>
                {formatDate(
                  auction.purchase_date
                )}
              </strong>
            </div>

            <div className="auction-detail-item">
              <span>Purchased By</span>

              <strong>
                {formatValue(
                  auction.purchased_by
                )}
              </strong>
            </div>

            <div className="auction-detail-item">
              <span>Original Purchase Price</span>

              <strong className="auction-price">
                {formatPrice(
                  auction.purchase_price
                )}
              </strong>
            </div>

          </div>

          {/* PURCHASE PROOF */}

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

        {/* =================================================
            LOCATION
        ================================================= */}

        <section className="auction-detail-section">

          <h2>
            <FaMapMarkerAlt />
            Location
          </h2>

          <div className="auction-location-details">

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

        {/* =================================================
            DELIVERY & SHIPPING
        ================================================= */}

        <section className="auction-detail-section">

          <h2>
            <FaTruck />
            Delivery & Shipping
          </h2>

          <div className="auction-details-grid">

            <div className="auction-detail-item">
              <span>Delivery / Pickup</span>

              <strong>
                {formatLabel(
                  auction.delivery_type
                )}
              </strong>
            </div>

            <div className="auction-detail-item">
              <span>Shipping Type</span>

              <strong>
                {formatLabel(
                  auction.shipping_type
                )}
              </strong>
            </div>

            <div className="auction-detail-item">
              <span>Shipping Charges</span>

              <strong>
                {formatPrice(
                  auction.shipping_charges
                )}
              </strong>
            </div>

            <div className="auction-detail-item">
              <span>Shipping Paid By</span>

              <strong>
                {formatLabel(
                  auction.shipping_paid_by
                )}
              </strong>
            </div>

          </div>

        </section>

        {/* =================================================
            ADDITIONAL INFORMATION
        ================================================= */}

        <section className="auction-detail-section">

          <h2>
            <FaShieldAlt />
            Additional Information
          </h2>

          <div className="auction-details-grid">

            <div className="auction-detail-item">
              <span>Warranty Status</span>

              <strong>
                {formatLabel(
                  auction.warranty_status
                )}
              </strong>
            </div>

            <div className="auction-detail-item">
              <span>Payment Method</span>

              <strong>
                {formatValue(
                  auction.payment_method
                )}
              </strong>
            </div>

            <div className="auction-detail-item">
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

        {/* =================================================
            SELLER INFORMATION
        ================================================= */}

        <section className="auction-detail-section">

          <h2>
            <FaUser />
            Seller Information
          </h2>

          <div className="auction-details-grid">

            <div className="auction-detail-item">
              <span>Seller Name</span>

              <strong>
                {formatValue(
                  auction.seller_name
                )}
              </strong>
            </div>

            <div className="auction-detail-item">
              <span>Email Address</span>

              <strong>
                {formatValue(
                  auction.seller_email
                )}
              </strong>
            </div>

            <div className="auction-detail-item">
              <span>Contact Number</span>

              <strong>
                {formatValue(
                  auction.seller_contact
                )}
              </strong>
            </div>

          </div>

          {/* SELLER VERIFICATION PROOF */}

          {sellerProofUrl && (
            <div className="auction-document-view">

              <div className="auction-document-info">

                <div className="auction-document-icon">
                  <FaUser />
                </div>

                <div>
                  <strong>
                    Seller Verification Proof
                  </strong>

                  <span>
                    Seller identity / ownership
                    verification
                  </span>
                </div>

              </div>

              <a
                href={sellerProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="auction-document-btn"
              >
                View Document
              </a>

            </div>
          )}

        </section>

        {/* =================================================
            SELLER TERMS & CONDITIONS
        ================================================= */}

        <section className="auction-detail-section">

          <h2>
            Seller Terms & Conditions
          </h2>

          <div className="auction-terms-box">
            <p>
              {formatValue(
                auction.product_terms,
                "No Seller Terms & Conditions provided."
              )}
            </p>
          </div>

        </section>

        {/* =================================================
            AUCTION RECORD
        ================================================= */}

        <section className="auction-detail-section">

          <h2>
            <FaCalendarAlt />
            Auction Record
          </h2>

          <div className="auction-details-grid">

            <div className="auction-detail-item">
              <span>Auction ID</span>

              <strong>
                #{formatValue(auction.id)}
              </strong>
            </div>

            <div className="auction-detail-item">
              <span>Created On</span>

              <strong>
                {formatDateTime(
                  auction.created_at
                )}
              </strong>
            </div>

            {auction.updated_at && (
              <div className="auction-detail-item">
                <span>Last Updated</span>

                <strong>
                  {formatDateTime(
                    auction.updated_at
                  )}
                </strong>
              </div>
            )}

          </div>

        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

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
            onClick={() =>
              navigate("/dashboard/my-auctions")
            }
          >
            <FaArrowLeft />
            Back to My Auctions
          </button>

        </div>

      </div>

      {/* =====================================================
          IMAGE PREVIEW POPUP
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

            {/* CLOSE BUTTON */}

            <button
              type="button"
              className="auction-image-preview-close"
              onClick={closeImagePopup}
              aria-label="Close image preview"
            >
              <FaTimes />
            </button>

            {/* IMAGE LABEL */}

            <div className="auction-image-preview-label">
              <FaImage />

              <span>
                {getImageLabel(
                  selectedImage.index
                )}
              </span>
            </div>

            {/* LARGE IMAGE */}

            <img
              src={selectedImage.url}
              alt={`${getImageLabel(
                selectedImage.index
              )} preview`}
              className="auction-image-preview-img"
            />

            {/* IMAGE COUNTER */}

            <div className="auction-image-preview-counter">
              Image{" "}
              {selectedImage.index + 1} of{" "}
              {auctionImages.length}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default AuctionDetails;