import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaBoxOpen,
  FaUser,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaRupeeSign,
  FaTruck,
  FaShieldAlt,
  FaCreditCard,
  FaFileAlt,
} from "react-icons/fa";

import "../styles/adminauctiondetails.css";

const API_URL = "http://127.0.0.1:8000";

function AdminAuctionDetails() {
  const location = useLocation();
  const navigate = useNavigate();

  const auction = location.state?.auction;

  /* =========================================================
     IMAGE URL
  ========================================================= */

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    if (imagePath.startsWith("/")) {
      return `${API_URL}${imagePath}`;
    }

    return `${API_URL}/${imagePath}`;
  };

  /* =========================================================
     FORMAT HELPERS
  ========================================================= */

  const formatPrice = (price) => {
    if (
      price === null ||
      price === undefined ||
      price === ""
    ) {
      return "₹0";
    }

    return `₹${Number(price).toLocaleString("en-IN")}`;
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    const d = new Date(date);

    if (isNaN(d.getTime())) {
      return date;
    }

    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClass = (status) => {
    return `status-${status?.toLowerCase() || "pending"}`;
  };

  /* =========================================================
     NO AUCTION DATA
  ========================================================= */

  if (!auction) {
    return (
      <div className="admin-auction-details-page">
        <div className="admin-auction-not-found">
          <FaBoxOpen />

          <h2>Auction Details Not Found</h2>

          <p>
            The auction information is not available.
          </p>

          <button
            onClick={() =>
              navigate("/admin/dashboard/auctions")
            }
          >
            <FaArrowLeft />
            Back to Auctions
          </button>
        </div>
      </div>
    );
  }

  const sellerName =
    auction.created_by_user?.fullname ||
    auction.seller_name ||
    "Unknown Seller";

  const sellerEmail =
    auction.created_by_user?.email ||
    auction.seller_email ||
    "N/A";

  const sellerMobile =
    auction.created_by_user?.mobile ||
    auction.seller_mobile ||
    auction.mobile ||
    "N/A";

  const images = Array.isArray(auction.images)
    ? auction.images
    : [];

    /* =========================================================
   LOCATION DATA
========================================================= */

const locationData = auction.location || {};

const area =
  auction.area ||
  auction.location_area ||
  locationData.area ||
  "N/A";

const city =
  auction.location_city ||
  auction.city ||
  locationData.city ||
  "N/A";

const state =
  auction.location_state ||
  auction.state ||
  locationData.state ||
  "N/A";

const country =
  auction.location_country ||
  auction.country ||
  locationData.country ||
  "N/A";

const pincode =
  auction.pincode ||
  auction.location_pincode ||
  locationData.pincode ||
  "N/A";

  return (
    <div className="admin-auction-details-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="admin-details-header">

        <button
          className="admin-back-btn"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
          Back
        </button>

        <div>
          <h1>Auction Details</h1>

          <p>
            Complete information about the submitted auction.
          </p>
        </div>

        <span
          className={`admin-detail-status ${getStatusClass(
            auction.status
          )}`}
        >
          {auction.status
            ? auction.status.toUpperCase()
            : "UNKNOWN"}
        </span>

      </div>


      {/* =====================================================
          PRODUCT TOP SECTION
      ===================================================== */}

      <div className="admin-details-main-card">

        <div className="admin-product-gallery">

          {images.length > 0 ? (
            <div className="admin-gallery-grid">

              {images.map((image, index) => {
                const imageUrl = getImageUrl(
                  image.image_path
                );

                return imageUrl ? (
                  <div
                    className="admin-gallery-image"
                    key={index}
                  >
                    <img
                      src={imageUrl}
                      alt={`${auction.product_title} ${
                        index + 1
                      }`}
                    />
                  </div>
                ) : null;
              })}

            </div>
          ) : (
            <div className="admin-no-image">
              <FaBoxOpen />
              <span>No Product Images</span>
            </div>
          )}

        </div>


        <div className="admin-product-summary">

          <span className="admin-product-category">
            {auction.category || "N/A"}
          </span>

          <h2>
            {auction.product_title ||
              "Untitled Product"}
          </h2>

          {auction.brand_model && (
            <p className="admin-product-brand">
              {auction.brand_model}
            </p>
          )}

          <div className="admin-price-box">

            <div>
              <small>Starting Price</small>

              <strong>
                {formatPrice(
                  auction.starting_price
                )}
              </strong>
            </div>

            {auction.purchase_price && (
              <div>
                <small>Purchase Price</small>

                <strong>
                  {formatPrice(
                    auction.purchase_price
                  )}
                </strong>
              </div>
            )}

          </div>

        </div>

      </div>


      {/* =====================================================
          DESCRIPTION
      ===================================================== */}

      <div className="admin-detail-card">

        <div className="admin-card-title">
          <FaFileAlt />
          <h3>Product Description</h3>
        </div>

        <p className="admin-description">
          {auction.description ||
            "No description provided."}
        </p>

      </div>


      {/* =====================================================
          PRODUCT INFORMATION
      ===================================================== */}

      <div className="admin-detail-card">

        <div className="admin-card-title">
          <FaBoxOpen />
          <h3>Product Information</h3>
        </div>

        <div className="admin-details-grid">

          <DetailItem
            label="Product Title"
            value={auction.product_title}
          />

          <DetailItem
            label="Brand / Model"
            value={auction.brand_model}
          />

          <DetailItem
            label="Category"
            value={auction.category}
          />

          <DetailItem
            label="Condition"
            value={auction.product_condition}
          />

          <DetailItem
            label="Purchase Date"
            value={formatDate(
              auction.purchase_date
            )}
          />

          <DetailItem
            label="Purchased By"
            value={auction.purchased_by}
          />

          <DetailItem
            label="Purchase Price"
            value={formatPrice(
              auction.purchase_price
            )}
          />

          <DetailItem
            label="Starting Price"
            value={formatPrice(
              auction.starting_price
            )}
          />

        </div>

      </div>


      {/* =====================================================
          AUCTION SCHEDULE
      ===================================================== */}

      <div className="admin-detail-card">

        <div className="admin-card-title">
          <FaCalendarAlt />
          <h3>Auction Schedule</h3>
        </div>

        <div className="admin-details-grid">

          <DetailItem
            label="Auction Start"
            value={formatDate(
              auction.auction_start
            )}
          />

          <DetailItem
            label="Auction End"
            value={formatDate(
              auction.auction_end
            )}
          />

          <DetailItem
            label="Current Status"
            value={
              auction.status
                ? auction.status.toUpperCase()
                : "N/A"
            }
          />

          <DetailItem
            label="Created At"
            value={formatDate(
              auction.created_at
            )}
          />

          <DetailItem
            label="Updated At"
            value={formatDate(
              auction.updated_at
            )}
          />

        </div>

      </div>

\
      {/* =====================================================
    LOCATION
===================================================== */}

<div className="admin-detail-card">

  <div className="admin-card-title">
    <FaMapMarkerAlt />
    <h3>Location Details</h3>
  </div>

  <div className="admin-details-grid">

    <DetailItem
      label="Area"
      value={area}
    />

    <DetailItem
      label="City"
      value={city}
    />

    <DetailItem
      label="State"
      value={state}
    />

    <DetailItem
      label="Country"
      value={country}
    />

    <DetailItem
      label="Pincode"
      value={pincode}
    />

  </div>

</div>
      


      {/* =====================================================
          DELIVERY & SHIPPING
      ===================================================== */}

      <div className="admin-detail-card">

        <div className="admin-card-title">
          <FaTruck />
          <h3>Delivery & Shipping</h3>
        </div>

        <div className="admin-details-grid">

          <DetailItem
            label="Delivery Type"
            value={auction.delivery_type}
          />

          <DetailItem
            label="Shipping Type"
            value={auction.shipping_type}
          />

          <DetailItem
            label="Shipping Charges"
            value={formatPrice(
              auction.shipping_charges
            )}
          />

          <DetailItem
            label="Shipping Paid By"
            value={auction.shipping_paid_by}
          />

        </div>

      </div>


      {/* =====================================================
          WARRANTY & PAYMENT
      ===================================================== */}

      <div className="admin-detail-card">

        <div className="admin-card-title">
          <FaShieldAlt />
          <h3>Warranty & Payment</h3>
        </div>

        <div className="admin-details-grid">

          <DetailItem
            label="Warranty Status"
            value={auction.warranty_status}
          />

          <DetailItem
            label="Payment Method"
            value={auction.payment_method}
          />

        </div>

      </div>


      {/* =====================================================
          SELLER INFORMATION
      ===================================================== */}

      <div className="admin-detail-card">

        <div className="admin-card-title">
          <FaUser />
          <h3>Seller Information</h3>
        </div>

        <div className="admin-details-grid">

          <DetailItem
            label="Seller Name"
            value={sellerName}
          />

          <DetailItem
            label="Email"
            value={sellerEmail}
          />

          <DetailItem
            label="Mobile"
            value={sellerMobile}
          />

          <DetailItem
  label="Username"
  value={
    auction.created_by_user?.username ||
    auction.username ||
    auction.created_by_username ||
    auction.created_by_user?.fullname ||
    auction.seller_name ||
    "N/A"
  }
/>
        </div>

      </div>


      {/* =====================================================
          TERMS
      ===================================================== */}

      <div className="admin-detail-card">

        <div className="admin-card-title">
          <FaFileAlt />
          <h3>Product Terms</h3>
        </div>

        <div className="admin-terms-box">

          {auction.product_terms ||
            "No additional terms provided."}

        </div>

        <div className="admin-terms-status">

          <strong>
            Terms Accepted:
          </strong>

          <span>
            {auction.terms_accepted
              ? "Yes"
              : "No"}
          </span>

        </div>

      </div>


      {/* =====================================================
          DOCUMENTS
      ===================================================== */}

      <div className="admin-detail-card">

        <div className="admin-card-title">
          <FaFileAlt />
          <h3>Verification Documents</h3>
        </div>

        <div className="admin-document-grid">

          {auction.purchase_proof_path ? (
            <a
              href={getImageUrl(
                auction.purchase_proof_path
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-document-btn"
            >
              View Purchase Proof
            </a>
          ) : (
            <span className="admin-document-missing">
              Purchase Proof Not Available
            </span>
          )}

          {auction.seller_proof_path ? (
            <a
              href={getImageUrl(
                auction.seller_proof_path
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-document-btn"
            >
              View Seller Proof
            </a>
          ) : (
            <span className="admin-document-missing">
              Seller Proof Not Available
            </span>
          )}

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   DETAIL ITEM COMPONENT
========================================================= */

function DetailItem({ label, value }) {
  return (
    <div className="admin-detail-item">

      <span className="admin-detail-label">
        {label}
      </span>

      <span className="admin-detail-value">
        {value !== null &&
        value !== undefined &&
        value !== ""
          ? value
          : "N/A"}
      </span>

    </div>
  );
}

export default AdminAuctionDetails;