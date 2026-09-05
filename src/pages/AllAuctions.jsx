import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaEye,
  FaGavel,
  FaBoxOpen,
  FaExclamationCircle,
  FaRedo,
  FaTimes,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaTag,
  FaCheckCircle,
} from "react-icons/fa";

import "../styles/allauctions.css";


const API_URL = "http://127.0.0.1:8000";


function AllAuctions() {

  const navigate = useNavigate();

  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Image popup
  const [selectedImage, setSelectedImage] = useState(null);


  // =========================================================
  // FETCH ALL APPROVED AUCTIONS
  // =========================================================

useEffect(() => {
  fetchAllAuctions();

  const interval = setInterval(() => {
    fetchAllAuctions();
  }, 30000); // 30 seconds

  return () => {
    clearInterval(interval);
  };
}, []);


  const fetchAllAuctions = async () => {

    setLoading(true);
    setError("");

    try {

      const token = localStorage.getItem("access_token");

      console.log(
        "ALL AUCTIONS TOKEN EXISTS:",
        !!token
      );


      if (!token) {

        setError(
          "You are not logged in. Please login again."
        );

        setLoading(false);

        return;
      }


      const response = await fetch(
        `${API_URL}/api/auctions/all-auctions`,
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


      console.log(
        "ALL AUCTIONS RESPONSE:",
        response.status,
        data
      );


      if (!response.ok) {

        if (response.status === 401) {

          setError(
            "Your login session is invalid or expired. Please login again."
          );

        } else {

          setError(
            data?.detail ||
            "Failed to load all auctions."
          );

        }


        setAuctions([]);

        return;
      }


      if (Array.isArray(data)) {

        setAuctions(data);

      } else {

        console.warn(
          "ALL AUCTIONS: Backend returned non-array response:",
          data
        );

        setAuctions([]);

      }


    } catch (err) {

      console.error(
        "ALL AUCTIONS ERROR:",
        err
      );

      setError(
        err?.message ||
        "Something went wrong while loading auctions."
      );

      setAuctions([]);

    } finally {

      setLoading(false);

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


    return `${API_URL}/${imagePath.replace(/^\/+/, "")}`;

  };


  // =========================================================
  // GET FIRST IMAGE
  // =========================================================

  const getFirstAuctionImage = (auction) => {

    if (
      !auction ||
      !Array.isArray(auction.images) ||
      auction.images.length === 0
    ) {

      return null;

    }


    const sortedImages = [
      ...auction.images
    ].sort(
      (a, b) =>
        Number(a?.display_order ?? 0) -
        Number(b?.display_order ?? 0)
    );


    return getImageUrl(
      sortedImages[0]
    );

  };


  // =========================================================
  // IMAGE POPUP
  // =========================================================

  const handleImageClick = (imageUrl) => {

    if (!imageUrl) {
      return;
    }

    setSelectedImage(imageUrl);

  };


  const closeImagePopup = () => {

    setSelectedImage(null);

  };


  // =========================================================
  // ESCAPE KEY
  // =========================================================

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


  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDateTime = (dateValue) => {

    if (!dateValue) {
      return "Not available";
    }


    try {

      const date = new Date(dateValue);


      if (Number.isNaN(date.getTime())) {

        return "Not available";

      }


      return date.toLocaleString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );

    } catch {

      return "Not available";

    }

  };


  // =========================================================
  // PRICE FORMAT
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


  // =========================================================
  // VIEW AUCTION
  // =========================================================
  // =========================================================
// AUCTION STATUS
// =========================================================

  const handleViewAuction = (auction) => {

    console.log(
      "VIEW AUCTION:",
      auction
    );


    navigate(
      `/dashboard/auction/${auction.id}`,
      {
        state: {
          auction,
          from: "all-auctions"
        }
      }
    );

  };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <div className="all-auctions-page">

        <div className="all-auctions-header">

          <div>

            <h1>
              All Auctions
            </h1>

            <p>
              Explore all approved auctions
            </p>

          </div>

        </div>


        <div className="all-auctions-loading">

          <div className="all-auctions-spinner"></div>

          <p>
            Loading auctions...
          </p>

        </div>

      </div>

    );

  }


  // =========================================================
  // ERROR
  // =========================================================

  if (error) {

    return (

      <div className="all-auctions-page">

        <div className="all-auctions-header">

          <div>

            <h1>
              All Auctions
            </h1>

            <p>
              Explore all approved auctions
            </p>

          </div>

        </div>


        <div className="all-auctions-error">

          <FaExclamationCircle className="error-icon" />

          <h2>
            Unable to load auctions
          </h2>

          <p>
            {error}
          </p>


          <button
            type="button"
            className="all-auctions-retry-btn"
            onClick={fetchAllAuctions}
          >

            <FaRedo />

            Try Again

          </button>

        </div>

      </div>

    );

  }


  // =========================================================
  // EMPTY
  // =========================================================

  if (auctions.length === 0) {

    return (

      <div className="all-auctions-page">

        <div className="all-auctions-header">

          <div>

            <h1>
              All Auctions
            </h1>

            <p>
              Explore all approved auctions
            </p>

          </div>

        </div>


        <div className="all-auctions-empty">

          <div className="empty-icon-wrapper">

            <FaBoxOpen />

          </div>


          <h2>
            No Approved Auctions
          </h2>


          <p>
            There are currently no approved auctions
            available.
          </p>

        </div>

      </div>

    );

  }


  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (

    <div className="all-auctions-page">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="all-auctions-header">

        <div>

          <h1>
            All Auctions
          </h1>

          <p>
            Explore auctions approved by the administrator
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



      {/* =====================================================
          AUCTION GRID
      ===================================================== */}

      <div className="all-auctions-grid">


        {auctions.map((auction) => {

          const firstImage =
            getFirstAuctionImage(
              auction
            );


          return (

            <div
              className="all-auction-card"
              key={auction.id}
            >


              {/* =================================================
                  CARD TOP
              ================================================= */}

              <div className="all-auction-card-top">

                <div className="all-auction-number">

                  Auction #{auction.id}

                </div>


               <div className="auction-status-wrapper">

  <div className="auction-approved-status">
    <FaCheckCircle />
    <span>Approved</span>
  </div>

  {auction.auction_status === "live" && (
    <div className="auction-live-status">
      <span className="live-dot"></span>
      <span>Live Now</span>
    </div>
  )}

  {auction.auction_status === "upcoming" && (
    <div className="auction-upcoming-status">
      <span>Upcoming</span>
    </div>
  )}

</div>

              </div>



              {/* =================================================
                  PRODUCT IMAGE
              ================================================= */}

              <div
                className={`all-auction-image ${
                  firstImage
                    ? "all-auction-image-clickable"
                    : ""
                }`}
                onClick={() =>
                  handleImageClick(
                    firstImage
                  )
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
                    (
                      event.key === "Enter" ||
                      event.key === " "
                    )
                  ) {

                    event.preventDefault();

                    handleImageClick(
                      firstImage
                    );

                  }

                }}
              >

                {firstImage ? (

                  <img
                    src={firstImage}
                    alt={
                      auction.product_title ||
                      "Auction product"
                    }
                    onError={(event) => {

                      event.currentTarget.style.display =
                        "none";

                      const fallback =
                        event.currentTarget.parentElement?.querySelector(
                          ".all-auction-image-fallback"
                        );


                      if (fallback) {

                        fallback.style.display =
                          "flex";

                      }

                    }}
                  />

                ) : null}


                <div
                  className="all-auction-image-fallback"
                  style={{
                    display: firstImage
                      ? "none"
                      : "flex",
                  }}
                >

                  <FaBoxOpen />

                </div>

              </div>



              {/* =================================================
                  PRODUCT INFORMATION
              ================================================= */}

              <div className="all-auction-product-info">

                <h2>

                  {auction.product_title ||
                    "Untitled Auction"}

                </h2>


                {auction.brand_model && (

                  <p className="all-auction-brand">

                    {auction.brand_model}

                  </p>

                )}


                {auction.category && (

                  <span className="all-auction-category">

                    <FaTag />

                    {auction.category}

                  </span>

                )}

              </div>



              {/* =================================================
                  DESCRIPTION
              ================================================= */}

              {auction.description && (

                <p className="all-auction-description">

                  {auction.description.length > 120
                    ? `${auction.description.substring(
                        0,
                        120
                      )}...`
                    : auction.description}

                </p>

              )}



              {/* =================================================
                  AUCTION INFORMATION
              ================================================= */}

              <div className="all-auction-info-grid">


                <div className="all-auction-info-item">

                  <span className="info-label">
                    Starting Price
                  </span>

                  <strong className="info-value price">

                    {formatPrice(
                      auction.starting_price
                    )}

                  </strong>

                </div>


                <div className="all-auction-info-item">

                  <span className="info-label">
                    Condition
                  </span>

                  <strong className="info-value">

                    {auction.product_condition ||
                      "N/A"}

                  </strong>

                </div>


                <div className="all-auction-info-item">

                  <span className="info-label">
                    Auction Start
                  </span>

                  <strong className="info-value">

                    {formatDateTime(
                      auction.auction_start
                    )}

                  </strong>

                </div>


                <div className="all-auction-info-item">

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



              {/* =================================================
                  LOCATION
              ================================================= */}

              {(auction.location_city ||
                auction.location_state) && (

                <div className="all-auction-location">

                  <FaMapMarkerAlt />

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



              {/* =================================================
                  SELLER
              ================================================= */}

              {auction.seller_name && (

                <div className="all-auction-seller">

                  <span>
                    Seller
                  </span>

                  <strong>
                    {auction.seller_name}
                  </strong>

                </div>

              )}



              {/* =================================================
                  FOOTER
              ================================================= */}

              <div className="all-auction-card-footer">

                <button
                  type="button"
                  className="view-all-auction-btn"
                  onClick={() =>
                    handleViewAuction(
                      auction
                    )
                  }
                >

                  <FaEye />

                  View Auction

                </button>

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
          className="all-auction-image-modal"
          onClick={closeImagePopup}
        >

          <div
            className="all-auction-image-modal-content"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="all-auction-image-modal-close"
              onClick={closeImagePopup}
              aria-label="Close image preview"
            >

              <FaTimes />

            </button>


            <img
              src={selectedImage}
              alt="Auction product preview"
              className="all-auction-image-modal-img"
            />

          </div>

        </div>

      )}

    </div>

  );

}


export default AllAuctions;