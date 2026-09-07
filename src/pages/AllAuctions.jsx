import React, { useEffect, useState, useRef } from "react";
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
  FaFilter,
  FaSearch,
  FaChevronDown,
  FaClock,
  FaShieldAlt,
  FaRupeeSign,
} from "react-icons/fa";

import "../styles/allauctions.css";

const API_URL = "http://127.0.0.1:8000";


// =========================================================
// CUSTOM DROPDOWN
// =========================================================

function FilterDropdown({
  label,
  icon,
  value,
  options,
  onChange,
  placeholder,
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
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

  const selectedOption =
    options.find((option) => option.value === value) ||
    options[0];

  return (
    <div className="auction-filter-field" ref={dropdownRef}>

      <label className="auction-filter-label">
        {label}
      </label>

      <button
        type="button"
        className={`auction-filter-dropdown ${
          open ? "dropdown-open" : ""
        }`}
        onClick={() => setOpen(!open)}
      >

        <div className="auction-filter-dropdown-left">

          <span className="auction-filter-dropdown-icon">
            {icon}
          </span>

          <span className="auction-filter-dropdown-text">

            {selectedOption?.label || placeholder}

          </span>

        </div>

        <FaChevronDown
          className={`auction-filter-chevron ${
            open ? "rotate" : ""
          }`}
        />

      </button>


      {open && (

        <div className="auction-filter-menu">

          {options.map((option) => (

            <button
              type="button"
              key={option.value}
              className={`auction-filter-option ${
                value === option.value
                  ? "selected"
                  : ""
              }`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >

              <span className="auction-option-dot">
                {value === option.value ? "✓" : ""}
              </span>

              <span>
                {option.label}
              </span>

            </button>

          ))}

        </div>

      )}

    </div>
  );
}


// =========================================================
// MAIN COMPONENT
// =========================================================

function AllAuctions() {

  const navigate = useNavigate();

  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Image popup
  const [selectedImage, setSelectedImage] = useState(null);


  // =========================================================
  // FILTERS
  // =========================================================

  const defaultFilters = {
    search: "",
    status: "all",
    category: "all",
    condition: "all",
    price: "all",
    location: "all",
  };


  const [filterValues, setFilterValues] =
    useState(defaultFilters);

  const [appliedFilters, setAppliedFilters] =
    useState(defaultFilters);


  // =========================================================
  // FETCH ALL APPROVED AUCTIONS
  // =========================================================

  useEffect(() => {

    fetchAllAuctions();

    const interval = setInterval(() => {
      fetchAllAuctions();
    }, 30000);

    return () => {
      clearInterval(interval);
    };

  }, []);


  const fetchAllAuctions = async () => {

    setLoading(true);
    setError("");

    try {

      const token =
        localStorage.getItem("access_token");

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
  // GET DYNAMIC FILTER OPTIONS
  // =========================================================

  const categories = [
    ...new Set(
      auctions
        .map((auction) => auction.category)
        .filter(Boolean)
    ),
  ].sort();


  const conditions = [
    ...new Set(
      auctions
        .map((auction) => auction.product_condition)
        .filter(Boolean)
    ),
  ].sort();


  const locations = [
    ...new Set(
      auctions
        .map((auction) => auction.location_city)
        .filter(Boolean)
    ),
  ].sort();


  // =========================================================
  // STATUS OPTIONS
  // =========================================================

  const statusOptions = [
    {
      value: "all",
      label: "All Status",
    },
    {
      value: "live",
      label: "Live Now",
    },
    {
      value: "upcoming",
      label: "Upcoming",
    },
    {
      value: "ended",
      label: "Ended",
    },
  ];


  // =========================================================
  // CATEGORY OPTIONS
  // =========================================================

  const categoryOptions = [
    {
      value: "all",
      label: "All Categories",
    },

    ...categories.map((category) => ({
      value: String(category).toLowerCase(),
      label: category,
    })),
  ];


  // =========================================================
  // CONDITION OPTIONS
  // =========================================================

  const conditionOptions = [
    {
      value: "all",
      label: "All Conditions",
    },

    ...conditions.map((condition) => ({
      value: String(condition).toLowerCase(),
      label: condition,
    })),
  ];


  // =========================================================
  // LOCATION OPTIONS
  // =========================================================

  const locationOptions = [
    {
      value: "all",
      label: "All Locations",
    },

    ...locations.map((location) => ({
      value: String(location).toLowerCase(),
      label: location,
    })),
  ];


  // =========================================================
  // PRICE OPTIONS
  // =========================================================

  const priceOptions = [
    {
      value: "all",
      label: "All Prices",
    },
    {
      value: "under-10000",
      label: "Under ₹10,000",
    },
    {
      value: "10000-50000",
      label: "₹10,000 - ₹50,000",
    },
    {
      value: "50000-100000",
      label: "₹50,000 - ₹1,00,000",
    },
    {
      value: "above-100000",
      label: "Above ₹1,00,000",
    },
  ];


  // =========================================================
  // GET AUCTION STATUS
  // =========================================================

  const getAuctionStatus = (auction) => {

    const status = String(
      auction?.auction_status ||
      auction?.status ||
      ""
    ).toLowerCase();


    if (status === "live") {
      return "live";
    }

    if (status === "upcoming") {
      return "upcoming";
    }

    if (status === "ended") {
      return "ended";
    }


    return status;

  };


  // =========================================================
  // FILTER AUCTIONS
  // =========================================================

  const filteredAuctions = auctions.filter(
    (auction) => {

      const title =
        String(
          auction.product_title || ""
        ).toLowerCase();

      const brand =
        String(
          auction.brand_model || ""
        ).toLowerCase();

      const seller =
        String(
          auction.seller_name || ""
        ).toLowerCase();


      const search =
        appliedFilters.search
          .trim()
          .toLowerCase();


      // Search
      const matchesSearch =
        !search ||
        title.includes(search) ||
        brand.includes(search) ||
        seller.includes(search);


      // Status
      const auctionStatus =
        getAuctionStatus(auction);


      const matchesStatus =
        appliedFilters.status === "all" ||
        auctionStatus === appliedFilters.status;


      // Category
      const auctionCategory =
        String(
          auction.category || ""
        ).toLowerCase();


      const matchesCategory =
        appliedFilters.category === "all" ||
        auctionCategory ===
          appliedFilters.category;


      // Condition
      const auctionCondition =
        String(
          auction.product_condition || ""
        ).toLowerCase();


      const matchesCondition =
        appliedFilters.condition === "all" ||
        auctionCondition ===
          appliedFilters.condition;


      // Location
      const auctionLocation =
        String(
          auction.location_city || ""
        ).toLowerCase();


      const matchesLocation =
        appliedFilters.location === "all" ||
        auctionLocation ===
          appliedFilters.location;


      // Price
      const price =
        Number(
          auction.starting_price
        ) || 0;


      let matchesPrice = true;


      switch (appliedFilters.price) {

        case "under-10000":

          matchesPrice =
            price < 10000;

          break;


        case "10000-50000":

          matchesPrice =
            price >= 10000 &&
            price <= 50000;

          break;


        case "50000-100000":

          matchesPrice =
            price > 50000 &&
            price <= 100000;

          break;


        case "above-100000":

          matchesPrice =
            price > 100000;

          break;


        default:

          matchesPrice = true;

      }


      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesCondition &&
        matchesLocation &&
        matchesPrice
      );

    }
  );


  // =========================================================
  // ACTIVE FILTER COUNT
  // =========================================================

  const activeFilterCount = Object.entries(
    appliedFilters
  ).filter(
    ([key, value]) =>
      key !== "search" &&
      value !== "all"
  ).length +
    (appliedFilters.search.trim()
      ? 1
      : 0);


  // =========================================================
  // HANDLE FILTER CHANGE
  // =========================================================

  const handleFilterChange = (
    name,
    value
  ) => {

    setFilterValues((previous) => ({
      ...previous,
      [name]: value,
    }));

  };


  // =========================================================
  // APPLY FILTERS
  // =========================================================

  const handleApplyFilters = () => {

    setAppliedFilters({
      ...filterValues,
    });

  };


  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const handleClearFilters = () => {

    setFilterValues({
      ...defaultFilters,
    });

    setAppliedFilters({
      ...defaultFilters,
    });

  };


  // =========================================================
  // VIEW AUCTION
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
          from: "all-auctions",
        },
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

            {filteredAuctions.length}{" "}

            {filteredAuctions.length === 1
              ? "Auction"
              : "Auctions"}

          </span>

        </div>

      </div>


      {/* =====================================================
          FILTER PANEL
      ===================================================== */}

      <div className="auction-filter-panel">


        {/* FILTER HEADER */}

        <div className="auction-filter-header">

          <div className="auction-filter-title-section">

            <div className="auction-filter-main-icon">

              <FaFilter />

            </div>


            <div>

              <h2>
                Find Your Auction
              </h2>

              <p>
                Refine auctions by status, category,
                condition, price or location
              </p>

            </div>

          </div>


          <div className="active-filter-badge">

            <span className="active-filter-dot"></span>

            {activeFilterCount} Active Filter
            {activeFilterCount !== 1 ? "s" : ""}

          </div>

        </div>


        {/* FILTER GRID */}

        <div className="auction-filter-grid">


          {/* SEARCH */}

          <div className="auction-filter-field">

            <label className="auction-filter-label">
              Search
            </label>


            <div className="auction-search-wrapper">

              <FaSearch className="auction-search-icon" />

              <input
                type="text"
                value={filterValues.search}
                onChange={(event) =>
                  handleFilterChange(
                    "search",
                    event.target.value
                  )
                }
                placeholder="Search title, brand or seller..."
                className="auction-search-input"
              />

            </div>

          </div>


          {/* STATUS */}

          <FilterDropdown
            label="Auction Status"
            icon={<FaClock />}
            value={filterValues.status}
            options={statusOptions}
            onChange={(value) =>
              handleFilterChange(
                "status",
                value
              )
            }
            placeholder="All Status"
          />


          {/* CATEGORY */}

          <FilterDropdown
            label="Category"
            icon={<FaTag />}
            value={filterValues.category}
            options={categoryOptions}
            onChange={(value) =>
              handleFilterChange(
                "category",
                value
              )
            }
            placeholder="All Categories"
          />


          {/* CONDITION */}

          <FilterDropdown
            label="Condition"
            icon={<FaShieldAlt />}
            value={filterValues.condition}
            options={conditionOptions}
            onChange={(value) =>
              handleFilterChange(
                "condition",
                value
              )
            }
            placeholder="All Conditions"
          />


          {/* PRICE */}

          <FilterDropdown
            label="Price Range"
            icon={<FaRupeeSign />}
            value={filterValues.price}
            options={priceOptions}
            onChange={(value) =>
              handleFilterChange(
                "price",
                value
              )
            }
            placeholder="All Prices"
          />


          {/* LOCATION */}

          <FilterDropdown
            label="Location"
            icon={<FaMapMarkerAlt />}
            value={filterValues.location}
            options={locationOptions}
            onChange={(value) =>
              handleFilterChange(
                "location",
                value
              )
            }
            placeholder="All Locations"
          />

        </div>


        {/* FILTER FOOTER */}

        <div className="auction-filter-footer">

          <div className="filter-result-text">

            Showing{" "}

            <strong>
              {filteredAuctions.length}
            </strong>{" "}

            of{" "}

            <strong>
              {auctions.length}
            </strong>{" "}

            auctions

          </div>


          <div className="auction-filter-actions">

            <button
              type="button"
              className="clear-filters-btn"
              onClick={handleClearFilters}
            >

              <FaTimes />

              Clear Filters

            </button>


            <button
              type="button"
              className="apply-filters-btn"
              onClick={handleApplyFilters}
            >

              <FaFilter />

              Apply Filters

            </button>

          </div>

        </div>

      </div>


      {/* =====================================================
          FILTERED EMPTY STATE
      ===================================================== */}

      {filteredAuctions.length === 0 && (

        <div className="all-auctions-filter-empty">

          <div className="filter-empty-icon">

            <FaSearch />

          </div>


          <h2>
            No Auctions Found
          </h2>


          <p>
            No auctions match your selected filters.
            Try changing or clearing your filters.
          </p>


          <button
            type="button"
            className="filter-empty-clear-btn"
            onClick={handleClearFilters}
          >

            <FaRedo />

            Clear Filters

          </button>

        </div>

      )}


      {/* =====================================================
          AUCTION GRID
      ===================================================== */}

      {filteredAuctions.length > 0 && (

        <div className="all-auctions-grid">

          {filteredAuctions.map((auction) => {

            const firstImage =
              getFirstAuctionImage(
                auction
              );


            return (

              <div
                className="all-auction-card"
                key={auction.id}
              >


                {/* CARD TOP */}

                <div className="all-auction-card-top">

                  <div className="all-auction-number">

                    Auction #{auction.id}

                  </div>


                  <div className="auction-status-wrapper">

                    <div className="auction-approved-status">

                      <FaCheckCircle />

                      <span>
                        Approved
                      </span>

                    </div>


                    {auction.auction_status === "live" && (

                      <div className="auction-live-status">

                        <span className="live-dot"></span>

                        <span>
                          Live Now
                        </span>

                      </div>

                    )}


                    {auction.auction_status === "upcoming" && (

                      <div className="auction-upcoming-status">

                        <span>
                          Upcoming
                        </span>

                      </div>

                    )}


                    {auction.auction_status === "ended" && (

                      <div className="auction-ended-status">

                        <FaCheckCircle />

                        <span>
                          Ended
                        </span>

                      </div>

                    )}

                  </div>

                </div>


                {/* PRODUCT IMAGE */}

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


                {/* PRODUCT INFORMATION */}

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


                {/* DESCRIPTION */}

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


                {/* AUCTION INFORMATION */}

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


                {/* LOCATION */}

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


                {/* SELLER */}

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


                {/* FOOTER */}

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

      )}


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