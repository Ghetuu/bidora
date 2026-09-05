import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaEye,
  FaGavel,
  FaBoxOpen,
  FaExclamationCircle,
  FaRedo,
  FaTimes,
  FaMapMarkerAlt,
  FaTag,
  FaCheckCircle,
  FaClock,
  FaUser,
  FaStar,
  FaSearch,
  FaFilter,
  FaChevronDown,
  FaSlidersH,
} from "react-icons/fa";

import "../styles/liveauction.css";

const API_URL = "http://127.0.0.1:8000";

const CustomDropdown = ({
  value,
  options,
  onChange,
  icon,
  className = "",
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest(".live-custom-dropdown")) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setOpen(false);
  };

  return (
    <div className={`live-custom-dropdown ${className}`}>
      <button
        type="button"
        className={`live-custom-dropdown-button ${
          open ? "open" : ""
        }`}
        onClick={() => setOpen((previous) => !previous)}
      >
        <span className="live-custom-dropdown-left">
          {icon && (
            <span className="live-custom-dropdown-icon">
              {icon}
            </span>
          )}

          <span className="live-custom-dropdown-value">
            {value}
          </span>
        </span>

        <FaChevronDown
          className={`live-custom-dropdown-chevron ${
            open ? "rotate" : ""
          }`}
        />
      </button>

      {open && (
        <div className="live-custom-dropdown-menu">
          {options.map((option) => (
            <button
              type="button"
              key={option}
              className={`live-custom-dropdown-option ${
                value === option ? "selected" : ""
              }`}
              onClick={() => handleSelect(option)}
            >
              <span>{option}</span>

              {value === option && (
                <FaCheckCircle className="live-dropdown-check" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

function LiveAuctions() {
  const navigate = useNavigate();

  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedImage, setSelectedImage] = useState(null);

  // =========================================================
  // SEARCH / FILTER STATE
  // =========================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedCondition, setSelectedCondition] = useState("All Conditions");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [sortBy, setSortBy] = useState("newest");

  const [showFilters, setShowFilters] = useState(false);

  // =========================================================
  // FETCH LIVE AUCTIONS
  // =========================================================

  useEffect(() => {
    fetchLiveAuctions();
  }, []);

  const fetchLiveAuctions = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      console.log("LIVE AUCTIONS TOKEN EXISTS:", !!token);

      if (!token) {
        setError("You are not logged in. Please login again.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/auctions/live`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      let data;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      console.log(
        "LIVE AUCTIONS RESPONSE:",
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
            data?.detail || "Failed to load live auctions."
          );
        }

        setAuctions([]);
        return;
      }

      if (Array.isArray(data)) {
        setAuctions(data);
      } else {
        console.warn(
          "LIVE AUCTIONS: Backend returned non-array response:",
          data
        );

        setAuctions([]);
      }
    } catch (err) {
      console.error("LIVE AUCTIONS ERROR:", err);

      setError(
        err?.message ||
          "Something went wrong while loading live auctions."
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

    const sortedImages = [...auction.images].sort(
      (a, b) =>
        Number(a?.display_order ?? 0) -
        Number(b?.display_order ?? 0)
    );

    return getImageUrl(sortedImages[0]);
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
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
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

  // =========================================================
  // SHORT DATE
  // =========================================================

  const formatShortDate = (dateValue) => {
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
        hour: "2-digit",
        minute: "2-digit",
      });
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
  // CATEGORY LIST
  // =========================================================

  const categories = useMemo(() => {
    const categorySet = new Set();

    auctions.forEach((auction) => {
      if (auction.category) {
        categorySet.add(String(auction.category).trim());
      }
    });

    return [
      "All Categories",
      ...Array.from(categorySet).sort((a, b) =>
        a.localeCompare(b)
      ),
    ];
  }, [auctions]);

  // =========================================================
  // CONDITION LIST
  // =========================================================

  const conditions = useMemo(() => {
    const conditionSet = new Set();

    auctions.forEach((auction) => {
      if (auction.product_condition) {
        conditionSet.add(
          String(auction.product_condition).trim()
        );
      }
    });

    return [
      "All Conditions",
      ...Array.from(conditionSet).sort((a, b) =>
        a.localeCompare(b)
      ),
    ];
  }, [auctions]);

  // =========================================================
  // FILTER + SEARCH + SORT
  // =========================================================

  const filteredAuctions = useMemo(() => {
    let result = [...auctions];

    // SEARCH
    const search = searchTerm.trim().toLowerCase();

    if (search) {
      result = result.filter((auction) => {
        const searchableText = [
          auction.product_title,
          auction.brand_model,
          auction.description,
          auction.category,
          auction.product_condition,
          auction.location_city,
          auction.location_state,
          auction.seller_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(search);
      });
    }

    // CATEGORY
    if (selectedCategory !== "All Categories") {
      result = result.filter(
        (auction) =>
          String(auction.category || "").toLowerCase() ===
          selectedCategory.toLowerCase()
      );
    }

    // CONDITION
    if (selectedCondition !== "All Conditions") {
      result = result.filter(
        (auction) =>
          String(auction.product_condition || "").toLowerCase() ===
          selectedCondition.toLowerCase()
      );
    }

    // MIN PRICE
    if (minPrice !== "") {
      result = result.filter(
        (auction) =>
          Number(auction.starting_price || 0) >=
          Number(minPrice)
      );
    }

    // MAX PRICE
    if (maxPrice !== "") {
      result = result.filter(
        (auction) =>
          Number(auction.starting_price || 0) <=
          Number(maxPrice)
      );
    }

    // SORT
    if (sortBy === "price-low") {
      result.sort(
        (a, b) =>
          Number(a.starting_price || 0) -
          Number(b.starting_price || 0)
      );
    }

    if (sortBy === "price-high") {
      result.sort(
        (a, b) =>
          Number(b.starting_price || 0) -
          Number(a.starting_price || 0)
      );
    }

    if (sortBy === "ending-soon") {
      result.sort(
        (a, b) =>
          new Date(a.auction_end) -
          new Date(b.auction_end)
      );
    }

    if (sortBy === "newest") {
      result.sort((a, b) => {
        const dateA = new Date(
          a.auction_start || a.created_at || 0
        );

        const dateB = new Date(
          b.auction_start || b.created_at || 0
        );

        return dateB - dateA;
      });
    }

    return result;
  }, [
    auctions,
    searchTerm,
    selectedCategory,
    selectedCondition,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  // =========================================================
  // RESET FILTERS
  // =========================================================

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All Categories");
    setSelectedCondition("All Conditions");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
  };

  // =========================================================
  // VIEW AUCTION
  // =========================================================

  const handleViewAuction = (auction) => {
  console.log("VIEW LIVE AUCTION:", auction);

  navigate(`/dashboard/live-auction/${auction.id}`, {
    state: {
      auction,
      from: "live-auctions",
    },
  });
};

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="live-auctions-page">
        <div className="live-auctions-heading">
          <div>
            <div className="live-title-row">
              <span className="live-title-dot"></span>

              <h1>
                Live <span>Auctions</span>
              </h1>
            </div>

            <p>
              Discover exciting items and place your bid
              in real time
            </p>
          </div>
        </div>

        <div className="live-auctions-loading">
          <div className="live-auctions-spinner"></div>

          <p>Loading live auctions...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="live-auctions-page">
        <div className="live-auctions-heading">
          <div>
            <div className="live-title-row">
              <span className="live-title-dot"></span>

              <h1>
                Live <span>Auctions</span>
              </h1>
            </div>

            <p>
              Discover exciting items and place your bid
              in real time
            </p>
          </div>
        </div>

        <div className="live-auctions-error">
          <div className="live-state-icon error-state-icon">
            <FaExclamationCircle />
          </div>

          <h2>Unable to load live auctions</h2>

          <p>{error}</p>

          <button
            type="button"
            className="live-retry-btn"
            onClick={fetchLiveAuctions}
          >
            <FaRedo />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <div className="live-auctions-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="live-auctions-heading">
        <div>
          <div className="live-title-row">
            <span className="live-title-dot"></span>

            <h1>
              Live <span>Auctions</span>
            </h1>
          </div>

          <p>
            Discover exciting items and place your bid
            in real time
          </p>
        </div>

        <div className="live-auction-count">
          <span className="count-live-dot"></span>

          <FaGavel />

          <span>
            {auctions.length}{" "}
            {auctions.length === 1
              ? "Live Auction"
              : "Live Auctions"}
          </span>
        </div>
      </div>

      {/* =====================================================
    SEARCH + FILTER TOOLBAR
===================================================== */}

<div className="live-search-filter-wrapper">

  <div className="live-search-row">

    {/* =================================================
        SEARCH
    ================================================= */}
    <div className="live-search-box">
      <FaSearch />

      <input
        type="text"
        placeholder="Search auctions, products, brands..."
        value={searchTerm}
        onChange={(event) =>
          setSearchTerm(event.target.value)
        }
      />

      {searchTerm && (
        <button
          type="button"
          className="live-search-clear"
          onClick={() => setSearchTerm("")}
          aria-label="Clear search"
        >
          <FaTimes />
        </button>
      )}
    </div>


    {/* =================================================
        CATEGORY - CUSTOM DROPDOWN
    ================================================= */}
    <CustomDropdown
      value={selectedCategory}
      options={categories}
      onChange={setSelectedCategory}
      icon={<FaTag />}
      className="live-category-dropdown"
    />


    {/* =================================================
        FILTER BUTTON
    ================================================= */}
    <button
      type="button"
      className={`live-filter-button ${
        showFilters ? "active" : ""
      }`}
      onClick={() =>
        setShowFilters((previous) => !previous)
      }
    >
      <FaSlidersH />

      <span>Filters</span>

      <FaChevronDown
        className={`filter-chevron ${
          showFilters ? "rotate" : ""
        }`}
      />
    </button>


    {/* =================================================
        SORT - CUSTOM DROPDOWN
    ================================================= */}
    <CustomDropdown
      value={
        sortBy === "newest"
          ? "Newest"
          : sortBy === "ending-soon"
          ? "Ending Soon"
          : sortBy === "price-low"
          ? "Price: Low to High"
          : "Price: High to Low"
      }
      options={[
        "Newest",
        "Ending Soon",
        "Price: Low to High",
        "Price: High to Low",
      ]}
      onChange={(value) => {
        const sortValueMap = {
          Newest: "newest",
          "Ending Soon": "ending-soon",
          "Price: Low to High": "price-low",
          "Price: High to Low": "price-high",
        };

        setSortBy(sortValueMap[value]);
      }}
      className="live-sort-dropdown"
    />

  </div>


  {/* ===================================================
      ADVANCED FILTER PANEL
  =================================================== */}

  {showFilters && (
    <div className="live-filter-panel">

      {/* =================================================
          CONDITION - CUSTOM DROPDOWN
      ================================================= */}

      <div className="live-filter-field">

        <label>Condition</label>

        <CustomDropdown
          value={selectedCondition}
          options={conditions}
          onChange={setSelectedCondition}
          className="live-condition-dropdown"
        />

      </div>


      {/* =================================================
          MINIMUM PRICE
      ================================================= */}

      <div className="live-filter-field">

        <label>Minimum Price</label>

        <div className="live-price-input">

          <span>₹</span>

          <input
            type="number"
            min="0"
            placeholder="Min price"
            value={minPrice}
            onChange={(event) =>
              setMinPrice(event.target.value)
            }
          />

        </div>

      </div>


      {/* =================================================
          MAXIMUM PRICE
      ================================================= */}

      <div className="live-filter-field">

        <label>Maximum Price</label>

        <div className="live-price-input">

          <span>₹</span>

          <input
            type="number"
            min="0"
            placeholder="Max price"
            value={maxPrice}
            onChange={(event) =>
              setMaxPrice(event.target.value)
            }
          />

        </div>

      </div>


      {/* =================================================
          RESET FILTERS
      ================================================= */}

      <button
        type="button"
        className="live-reset-filter"
        onClick={resetFilters}
      >
        <FaRedo />
        Reset Filters
      </button>

    </div>
  )}


  {/* ===================================================
      FILTER RESULT INFORMATION
  =================================================== */}

  <div className="live-filter-result">

    <span>
      Showing{" "}
      <strong>
        {filteredAuctions.length}
      </strong>{" "}
      of{" "}
      <strong>
        {auctions.length}
      </strong>{" "}
      live auctions
    </span>

    {(searchTerm ||
      selectedCategory !== "All Categories" ||
      selectedCondition !== "All Conditions" ||
      minPrice ||
      maxPrice) && (

      <button
        type="button"
        onClick={resetFilters}
      >
        Clear all filters
      </button>

    )}

  </div>

</div>

      {/* =====================================================
          NO RESULTS AFTER FILTER
      ===================================================== */}

      {filteredAuctions.length === 0 && (
        <div className="live-no-results">

          <div className="live-no-results-icon">
            <FaSearch />
          </div>

          <h2>No Auctions Found</h2>

          <p>
            We couldn't find any live auctions matching
            your search or filters.
          </p>

          <button
            type="button"
            onClick={resetFilters}
          >
            <FaRedo />
            Clear Filters
          </button>

        </div>
      )}

   
      {/* =====================================================
          SECTION TITLE
      ===================================================== */}

      {filteredAuctions.length > 0 && (
        <div className="live-section-header">

          <div>
            <h2>All Live Auctions</h2>

            <p>
              Browse all auctions currently accepting bids
            </p>
          </div>

          <div className="live-section-total">
            {filteredAuctions.length} Items
          </div>

        </div>
      )}

      {/* =====================================================
          AUCTION GRID
      ===================================================== */}

      {filteredAuctions.length > 0 && (
        <div className="live-auctions-grid">

          {filteredAuctions.map((auction) => {

            const firstImage =
              getFirstAuctionImage(auction);

            return (
              <div
                className="live-auction-card"
                key={auction.id}
              >

                {/* IMAGE */}

                <div
                  className={`live-card-image ${
                    firstImage
                      ? "live-card-image-clickable"
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

                      handleImageClick(
                        firstImage
                      );
                    }
                  }}
                >

                  <div className="live-card-badge">
                    <span></span>
                    LIVE
                  </div>

                  <div className="live-card-number">
                    #{auction.id}
                  </div>

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
                            ".live-card-image-fallback"
                          );

                        if (fallback) {
                          fallback.style.display =
                            "flex";
                        }
                      }}
                    />
                  ) : null}

                  <div
                    className="live-card-image-fallback"
                    style={{
                      display: firstImage
                        ? "none"
                        : "flex",
                    }}
                  >
                    <FaBoxOpen />
                  </div>

                </div>

                {/* CONTENT */}

                <div className="live-card-content">

                  {/* CATEGORY */}

                  {auction.category && (
                    <span className="live-card-category">
                      <FaTag />
                      {auction.category}
                    </span>
                  )}

                  {/* TITLE */}

                  <h2>
                    {auction.product_title ||
                      "Untitled Auction"}
                  </h2>

                  {/* BRAND */}

                  {auction.brand_model && (
                    <p className="live-card-brand">
                      {auction.brand_model}
                    </p>
                  )}

                  {/* DESCRIPTION */}

                  {auction.description && (
                    <p className="live-card-description">
                      {auction.description.length > 90
                        ? `${auction.description.substring(
                            0,
                            90
                          )}...`
                        : auction.description}
                    </p>
                  )}

                  {/* PRICE */}

                  <div className="live-card-price-row">

                    <div>
                      <span>
                        Starting Price
                      </span>

                      <strong>
                        {formatPrice(
                          auction.starting_price
                        )}
                      </strong>
                    </div>

                    <div className="live-card-live-price">
                      <FaCheckCircle />
                      LIVE
                    </div>

                  </div>

                  {/* INFORMATION */}

                  <div className="live-card-info">

                    <div className="live-card-info-item">

                      <FaClock />

                      <div>
                        <span>
                          Auction Ends
                        </span>

                        <strong>
                          {formatShortDate(
                            auction.auction_end
                          )}
                        </strong>
                      </div>

                    </div>

                    {auction.product_condition && (
                      <div className="live-card-info-item">

                        <FaCheckCircle />

                        <div>
                          <span>
                            Condition
                          </span>

                          <strong>
                            {
                              auction.product_condition
                            }
                          </strong>
                        </div>

                      </div>
                    )}

                  </div>

                  {/* LOCATION */}

                  {(auction.location_city ||
                    auction.location_state) && (
                    <div className="live-card-location">

                      <FaMapMarkerAlt />

                      <span>
                        {[
                          auction.location_city,
                          auction.location_state,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>

                    </div>
                  )}

                  {/* SELLER */}

                  {auction.seller_name && (
                    <div className="live-card-seller">

                      <div className="seller-avatar">
                        <FaUser />
                      </div>

                      <div>
                        <span>
                          Seller
                        </span>

                        <strong>
                          {auction.seller_name}
                        </strong>
                      </div>

                    </div>
                  )}

                  {/* BUTTON */}

                 <button
  type="button"
  className="live-card-button"
  onClick={() => handleViewAuction(auction)}
>
  <FaEye />
  View Auction
</button>


                </div>
              </div>
            );
          })}

        </div>
      )}

      {/* =====================================================
          IMAGE PREVIEW POPUP
      ===================================================== */}

      {selectedImage && (
        <div
          className="live-image-modal"
          onClick={closeImagePopup}
        >

          <div
            className="live-image-modal-content"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="live-image-modal-close"
              onClick={closeImagePopup}
              aria-label="Close image preview"
            >
              <FaTimes />
            </button>

            <img
              src={selectedImage}
              alt="Auction product preview"
              className="live-image-modal-img"
            />

          </div>
        </div>
      )}

    </div>
  );
}

export default LiveAuctions;