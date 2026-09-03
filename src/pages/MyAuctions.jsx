import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEye,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaGavel,
  FaCalendarAlt,
  FaBoxOpen,
  FaExclamationCircle,
  FaRedo,
  FaTimes,
} from "react-icons/fa";
import "../styles/mmyauctions.css";

const API_URL = "http://127.0.0.1:8000";

function MyAuctions() {
  const navigate = useNavigate();

  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Image popup
  const [selectedImage, setSelectedImage] = useState(null);

  // ---------------------------------------------------------
  // FETCH MY AUCTIONS
  // ---------------------------------------------------------

  useEffect(() => {
    fetchMyAuctions();
  }, []);

  const fetchMyAuctions = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      console.log("MY AUCTIONS TOKEN EXISTS:", !!token);

      if (!token) {
        setError("You are not logged in. Please login again.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_URL}/api/auctions/my-auctions`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      let data;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      console.log("MY AUCTIONS RESPONSE:", response.status, data);

      if (!response.ok) {
        if (response.status === 401) {
          setError(
            "Your login session is invalid or expired. Please login again."
          );
        } else if (response.status === 500) {
          setError(
            data?.detail ||
              "Server error while loading your auctions. Please try again."
          );
        } else {
          setError(
            data?.detail ||
              "Failed to load your auctions."
          );
        }

        setAuctions([]);
        return;
      }

      if (Array.isArray(data)) {
        setAuctions(data);
      } else {
        console.warn(
          "MY AUCTIONS: Backend returned non-array response:",
          data
        );

        setAuctions([]);
      }
    } catch (err) {
      console.error("MY AUCTIONS ERROR:", err);

      setError(
        err?.message ||
          "Something went wrong while loading your auctions."
      );

      setAuctions([]);
    } finally {
      setLoading(false);
    }
  };

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

    return `${API_URL}/${imagePath.replace(/^\/+/, "")}`;
  };

  // ---------------------------------------------------------
  // GET FIRST AUCTION IMAGE
  // ---------------------------------------------------------

  const getFirstAuctionImage = (auction) => {
    if (
      !auction ||
      !Array.isArray(auction.images) ||
      auction.images.length === 0
    ) {
      return null;
    }

    const sortedImages = [...auction.images].sort(
      (a, b) =>
        Number(a?.display_order ?? 0) -
        Number(b?.display_order ?? 0)
    );

    return getImageUrl(sortedImages[0]);
  };

  // ---------------------------------------------------------
  // OPEN IMAGE POPUP
  // ---------------------------------------------------------

  const handleImageClick = (imageUrl) => {
    if (!imageUrl) {
      return;
    }

    setSelectedImage(imageUrl);
  };

  // ---------------------------------------------------------
  // CLOSE IMAGE POPUP
  // ---------------------------------------------------------

  const closeImagePopup = () => {
    setSelectedImage(null);
  };

  // ---------------------------------------------------------
  // CLOSE POPUP WITH ESC KEY
  // ---------------------------------------------------------

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

  // ---------------------------------------------------------
  // STATUS HELPERS
  // ---------------------------------------------------------

  const getStatus = (status) => {
    return String(status || "pending").toLowerCase();
  };

  const getStatusLabel = (status) => {
    const normalizedStatus = getStatus(status);

    switch (normalizedStatus) {
      case "approved":
        return "Approved";

      case "pending":
        return "Pending";

      case "rejected":
        return "Rejected";

      case "live":
        return "Live";

      case "ended":
        return "Ended";

      default:
        return (
          normalizedStatus.charAt(0).toUpperCase() +
          normalizedStatus.slice(1)
        );
    }
  };

  const getStatusIcon = (status) => {
    const normalizedStatus = getStatus(status);

    switch (normalizedStatus) {
      case "approved":
        return <FaCheckCircle />;

      case "rejected":
        return <FaTimesCircle />;

      case "live":
        return <FaGavel />;

      case "ended":
        return <FaCalendarAlt />;

      case "pending":
      default:
        return <FaClock />;
    }
  };

  // ---------------------------------------------------------
  // VIEW AUCTION
  // ---------------------------------------------------------

  const canViewAuction = (status) => {
    const normalizedStatus = getStatus(status);

    return (
      normalizedStatus === "approved" ||
      normalizedStatus === "live" ||
      normalizedStatus === "ended"
    );
  };

  const handleViewAuction = (auction) => {
    console.log("AUCTION DATA:", auction);
    console.log("AUCTION IMAGES:", auction?.images);

    navigate(`/dashboard/auction/${auction.id}`, {
      state: {
        auction,
      },
    });
  };

  // ---------------------------------------------------------
  // DATE FORMAT
  // ---------------------------------------------------------

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Not available";
    }

    try {
      const date = new Date(dateValue);

      if (Number.isNaN(date.getTime())) {
        return "Not available";
      }

      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Not available";
    }
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) {
      return "Not available";
    }

    try {
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
    } catch {
      return "Not available";
    }
  };

  // ---------------------------------------------------------
  // PRICE FORMAT
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

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="my-auctions-page">
        <div className="my-auctions-header">
          <div>
            <h1>My Auctions</h1>
            <p>Manage and track all your auctions</p>
          </div>
        </div>

        <div className="my-auctions-loading">
          <div className="my-auctions-spinner"></div>
          <p>Loading your auctions...</p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // ERROR
  // ---------------------------------------------------------

  if (error) {
    return (
      <div className="my-auctions-page">
        <div className="my-auctions-header">
          <div>
            <h1>My Auctions</h1>
            <p>Manage and track all your auctions</p>
          </div>
        </div>

        <div className="my-auctions-error">
          <FaExclamationCircle className="error-icon" />

          <h2>Unable to load auctions</h2>

          <p>{error}</p>

          <button
            type="button"
            className="my-auctions-retry-btn"
            onClick={fetchMyAuctions}
          >
            <FaRedo />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // EMPTY
  // ---------------------------------------------------------

  if (auctions.length === 0) {
    return (
      <div className="my-auctions-page">
        <div className="my-auctions-header">
          <div>
            <h1>My Auctions</h1>
            <p>Manage and track all your auctions</p>
          </div>
        </div>

        <div className="my-auctions-empty">
          <div className="empty-icon-wrapper">
            <FaBoxOpen />
          </div>

          <h2>No Auctions Yet</h2>

          <p>
            You haven't created any auctions yet. Create your first
            auction to get started.
          </p>

          <button
            type="button"
            className="create-auction-btn"
            onClick={() => navigate("/dashboard/create-auction")}
          >
            Create Auction
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // MAIN PAGE
  // ---------------------------------------------------------

  return (
    <div className="my-auctions-page">

      {/* PAGE HEADER */}
      <div className="my-auctions-header">
        <div>
          <h1>My Auctions</h1>

          <p>
            Manage and track all your auctions
          </p>
        </div>

        <div className="auction-total-badge">
          <FaGavel />

          <span>
            {auctions.length}{" "}
            {auctions.length === 1
              ? "Auction"
              : "Auctions"}
          </span>
        </div>
      </div>

      {/* AUCTION CARDS */}
      <div className="my-auctions-grid">
        {auctions.map((auction) => {
          const status = getStatus(auction?.status);
          const statusLabel = getStatusLabel(auction?.status);

          const firstImage =
            getFirstAuctionImage(auction);

          return (
            <div
              className={`my-auction-card status-${status}`}
              key={auction.id}
            >

              {/* CARD TOP */}
              <div className="my-auction-card-top">
                <div className="my-auction-number">
                  Auction #{auction.id}
                </div>

                <div
                  className={`auction-status ${status}`}
                >
                  {getStatusIcon(status)}

                  <span>
                    {statusLabel}
                  </span>
                </div>
              </div>

              {/* PRODUCT */}
              <div className="my-auction-product">

                {/* FIRST PRODUCT IMAGE */}
                <div
                  className={`auction-product-icon ${
                    firstImage
                      ? "auction-product-image-clickable"
                      : ""
                  }`}
                  onClick={() =>
                    handleImageClick(firstImage)
                  }
                  role={
                    firstImage
                      ? "button"
                      : undefined
                  }
                  tabIndex={
                    firstImage
                      ? 0
                      : undefined
                  }
                  onKeyDown={(event) => {
                    if (
                      firstImage &&
                      (event.key === "Enter" ||
                        event.key === " ")
                    ) {
                      event.preventDefault();
                      handleImageClick(firstImage);
                    }
                  }}
                  title={
                    firstImage
                      ? "Click to view image"
                      : ""
                  }
                >
                  {firstImage ? (
                    <img
                      src={firstImage}
                      alt={
                        auction.product_title ||
                        "Auction product"
                      }
                      onError={(e) => {
                        e.currentTarget.style.display =
                          "none";

                        const fallback =
                          e.currentTarget.parentElement?.querySelector(
                            ".auction-image-fallback"
                          );

                        if (fallback) {
                          fallback.style.display =
                            "flex";
                        }
                      }}
                    />
                  ) : null}

                  <div
                    className="auction-image-fallback"
                    style={{
                      display: firstImage
                        ? "none"
                        : "flex",
                    }}
                  >
                    <FaBoxOpen />
                  </div>
                </div>

                <div className="auction-product-info">
                  <h2>
                    {auction.product_title ||
                      "Untitled Auction"}
                  </h2>

                  {auction.brand_model && (
                    <p className="auction-brand">
                      {auction.brand_model}
                    </p>
                  )}

                  {auction.category && (
                    <span className="auction-category">
                      {auction.category}
                    </span>
                  )}
                </div>
              </div>

              {/* DESCRIPTION */}
              {auction.description && (
                <p className="auction-description">
                  {auction.description.length > 120
                    ? `${auction.description.substring(
                        0,
                        120
                      )}...`
                    : auction.description}
                </p>
              )}

              {/* AUCTION INFORMATION */}
              <div className="auction-info-grid">

                <div className="auction-info-item">
                  <span className="info-label">
                    Starting Price
                  </span>

                  <strong className="info-value price">
                    {formatPrice(
                      auction.starting_price
                    )}
                  </strong>
                </div>

                <div className="auction-info-item">
                  <span className="info-label">
                    Condition
                  </span>

                  <strong className="info-value">
                    {auction.product_condition ||
                      "N/A"}
                  </strong>
                </div>

                <div className="auction-info-item">
                  <span className="info-label">
                    Auction Start
                  </span>

                  <strong className="info-value">
                    {formatDateTime(
                      auction.auction_start
                    )}
                  </strong>
                </div>

                <div className="auction-info-item">
                  <span className="info-label">
                    Auction End
                  </span>

                  <strong className="info-value">
                    {formatDateTime(
                      auction.auction_end
                    )}
                  </strong>
                </div>

              </div>

              {/* LOCATION */}
              {(auction.location_city ||
                auction.location_state) && (
                <div className="auction-location">
                  <span>Location:</span>

                  <strong>
                    {[
                      auction.location_city,
                      auction.location_state,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </strong>
                </div>
              )}

              {/* CREATED DATE */}
              <div className="auction-created">
                Created on{" "}
                {formatDate(
                  auction.created_at
                )}
              </div>

              {/* CARD FOOTER */}
              <div className="my-auction-card-footer">

                {canViewAuction(status) ? (
                  <button
                    type="button"
                    className="view-auction-btn"
                    onClick={() =>
                      handleViewAuction(auction)
                    }
                  >
                    <FaEye />
                    View Auction
                  </button>
                ) : status === "pending" ? (
                  <div className="auction-status-message pending-message">
                    <FaClock />
                    Waiting for admin approval
                  </div>
                ) : status === "rejected" ? (
                  <div className="auction-status-message rejected-message">
                    <FaTimesCircle />
                    Auction rejected by admin
                  </div>
                ) : (
                  <div className="auction-status-message">
                    {statusLabel}
                  </div>
                )}

              </div>

            </div>
          );
        })}
      </div>

      {/* =====================================================
          IMAGE PREVIEW POPUP
          ===================================================== */}

      {selectedImage && (
        <div
          className="auction-image-modal"
          onClick={closeImagePopup}
        >
          <div
            className="auction-image-modal-content"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="auction-image-modal-close"
              onClick={closeImagePopup}
              aria-label="Close image preview"
            >
              <FaTimes />
            </button>

            <img
              src={selectedImage}
              alt="Auction product preview"
              className="auction-image-modal-img"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MyAuctions;