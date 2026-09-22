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
  FaFilter,
  FaSearch,
} from "react-icons/fa";

import "../styles/mmyauctions.css";

const API_URL = "http://127.0.0.1:8000";


/* =========================================================
   CUSTOM FILTER DROPDOWN
   ========================================================= */

const FilterDropdown = ({
  label,
  value,
  options,
  onChange,
}) => {
  const [open, setOpen] = useState(false);

  const selectedOption =
    options.find((option) => option.value === value) ||
    options[0];

  return (
    <div className="custom-filter-field">
      <label>{label}</label>

      <div className="custom-filter-dropdown">

        <button
          type="button"
          className={`custom-filter-trigger ${
            open ? "active" : ""
          }`}
          onClick={() => setOpen((previous) => !previous)}
        >
          <span>
            {selectedOption?.label || ""}
          </span>

          <span
            className={`filter-chevron ${
              open ? "rotate" : ""
            }`}
          >
            ▾
          </span>
        </button>

        {open && (
          <>
            <div
              className="filter-dropdown-overlay"
              onClick={() => setOpen(false)}
            />

            <div className="custom-filter-options">

              {options.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={`custom-filter-option ${
                    value === option.value
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span>
                    {option.label}
                  </span>

                  {value === option.value && (
                    <span className="filter-check">
                      ✓
                    </span>
                  )}
                </button>
              ))}

            </div>
          </>
        )}

      </div>
    </div>
  );
};


/* =========================================================
   MY AUCTIONS
   ========================================================= */

function MyAuctions() {

  const navigate = useNavigate();

  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
     IMAGE POPUP
     ======================================================= */

  const [selectedImage, setSelectedImage] = useState(null);


  /* =======================================================
     FILTERS
     ======================================================= */

  const defaultFilters = {
    search: "",
    status: "all",
    category: "all",
    condition: "all",
    price: "all",
    location: "all",
  };

  const [draftFilters, setDraftFilters] =
    useState(defaultFilters);

  const [appliedFilters, setAppliedFilters] =
    useState(defaultFilters);


  /* =======================================================
     FETCH MY AUCTIONS
     ======================================================= */

  useEffect(() => {
    fetchMyAuctions();
  }, []);


  const fetchMyAuctions = async () => {

    setLoading(true);
    setError("");

    try {

      const token =
        sessionStorage.getItem("access_token");

      console.log(
        "MY AUCTIONS TOKEN EXISTS:",
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

      console.log(
        "MY AUCTIONS RESPONSE:",
        response.status,
        data
      );

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

      console.error(
        "MY AUCTIONS ERROR:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong while loading your auctions."
      );

      setAuctions([]);

    } finally {

      setLoading(false);
    }
  };


  /* =======================================================
     IMAGE URL
     ======================================================= */

  const getImageUrl = (image) => {

    if (!image) {
      return null;
    }

    let imagePath = null;


    /*
     * Image can directly be a string:
     *
     * "/uploads/auction/car.jpg"
     *
     * or
     *
     * "uploads/auction/car.jpg"
     */

    if (typeof image === "string") {

      imagePath = image;

    }


    /*
     * Image can also be an object:
     *
     * {
     *   image_url: "/uploads/..."
     * }
     */

    if (
      typeof image === "object" &&
      image !== null
    ) {

      imagePath =
        image.image_path ||
        image.image_url ||
        image.imageUrl ||
        image.url ||
        image.path ||
        image.file_path ||
        image.filePath ||
        image.filename ||
        image.file_name;
    }


    if (
      !imagePath ||
      typeof imagePath !== "string"
    ) {

      return null;
    }


    imagePath = imagePath.trim();


    if (!imagePath) {
      return null;
    }


    /*
     * If backend already returns full URL,
     * don't add API_URL again.
     */

    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://") ||
      imagePath.startsWith("data:image/")
    ) {

      return imagePath;
    }


    /*
     * Convert Windows path:
     *
     * uploads\auctions\car.jpg
     *
     * to:
     *
     * uploads/auctions/car.jpg
     */

    imagePath =
      imagePath.replace(/\\/g, "/");


    /*
     * Remove leading slash.
     */

    imagePath =
      imagePath.replace(/^\/+/, "");


    return `${API_URL}/${imagePath}`;
  };


  /* =======================================================
     GET FIRST AUCTION IMAGE
     ======================================================= */

  const getFirstAuctionImage = (auction) => {

    if (!auction) {
      return null;
    }


    let images = auction.images;


    /*
     * If backend returns JSON string:
     *
     * "[{\"image_url\":\"...\"}]"
     */

    if (typeof images === "string") {

      try {

        images = JSON.parse(images);

      } catch {

        /*
         * If it is simply a path string,
         * treat it as one image.
         */

        images = [images];
      }
    }


    /*
     * If there is no images array,
     * check single-image fields.
     */

    if (
      !Array.isArray(images) ||
      images.length === 0
    ) {

      const singleImage =
        auction.image_url ||
        auction.imageUrl ||
        auction.image_path ||
        auction.imagePath ||
        auction.product_image ||
        auction.productImage ||
        auction.image;


      if (singleImage) {

        images = Array.isArray(singleImage)
          ? singleImage
          : [singleImage];
      }
    }


    if (
      !Array.isArray(images) ||
      images.length === 0
    ) {

      return null;
    }


    /*
     * Keep image display order.
     */

    const sortedImages = [...images].sort(
      (a, b) =>
        Number(
          a?.display_order ??
          a?.displayOrder ??
          0
        ) -
        Number(
          b?.display_order ??
          b?.displayOrder ??
          0
        )
    );


    /*
     * Find the first valid image.
     */

    for (const image of sortedImages) {

      const imageUrl =
        getImageUrl(image);

      if (imageUrl) {
        return imageUrl;
      }
    }


    return null;
  };


  /* =======================================================
     IMAGE POPUP
     ======================================================= */

  const handleImageClick = (imageUrl) => {

    if (!imageUrl) {
      return;
    }

    setSelectedImage(imageUrl);
  };


  const closeImagePopup = () => {
    setSelectedImage(null);
  };


  /* =======================================================
     CLOSE IMAGE POPUP WITH ESC
     ======================================================= */

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


  /* =======================================================
     STATUS
     ======================================================= */

  const getStatus = (status) => {

    return String(
      status || "pending"
    ).toLowerCase();
  };


  const getAuctionDisplayStatus = (auction) => {

    const databaseStatus =
      getStatus(auction?.status);


    if (
      databaseStatus === "pending" ||
      databaseStatus === "rejected"
    ) {

      return databaseStatus;
    }


    const now = new Date();


    const start =
      auction?.auction_start
        ? new Date(auction.auction_start)
        : null;


    const end =
      auction?.auction_end
        ? new Date(auction.auction_end)
        : null;


    const validStart =
      start &&
      !Number.isNaN(start.getTime());


    const validEnd =
      end &&
      !Number.isNaN(end.getTime());


    if (
      validStart &&
      now < start
    ) {

      return "upcoming";
    }


    if (
      validEnd &&
      now > end
    ) {

      return "ended";
    }


    if (
      validStart &&
      validEnd &&
      now >= start &&
      now <= end
    ) {

      return "live";
    }


    return databaseStatus;
  };


  const getStatusLabel = (status) => {

    const normalizedStatus =
      getStatus(status);


    switch (normalizedStatus) {

      case "approved":
        return "Approved";

      case "pending":
        return "Pending";

      case "rejected":
        return "Rejected";

      case "live":
        return "Live";

      case "upcoming":
        return "Upcoming";

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

    const normalizedStatus =
      getStatus(status);


    switch (normalizedStatus) {

      case "approved":
        return <FaCheckCircle />;

      case "rejected":
        return <FaTimesCircle />;

      case "live":
        return <FaGavel />;

      case "upcoming":
        return <FaClock />;

      case "ended":
        return <FaCalendarAlt />;

      case "pending":
      default:
        return <FaClock />;
    }
  };


  /* =======================================================
     VIEW AUCTION
     ======================================================= */

  const canViewAuction = (status) => {

    const normalizedStatus =
      getStatus(status);


    return (
      normalizedStatus === "approved" ||
      normalizedStatus === "live" ||
      normalizedStatus === "upcoming" ||
      normalizedStatus === "ended"
    );
  };


  const handleViewAuction = (auction) => {

    console.log(
      "AUCTION DATA:",
      auction
    );

    console.log(
      "AUCTION IMAGES:",
      auction?.images
    );


    navigate(
      `/dashboard/auction/${auction.id}`,
      {
        state: {
          auction,
        },
      }
    );
  };


  /* =======================================================
     DATE FORMAT
     ======================================================= */

  const formatDate = (dateValue) => {

    if (!dateValue) {
      return "Not available";
    }


    try {

      const date =
        new Date(dateValue);


      if (
        Number.isNaN(date.getTime())
      ) {

        return "Not available";
      }


      return date.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );

    } catch {

      return "Not available";
    }
  };


  const formatDateTime = (dateValue) => {

    if (!dateValue) {
      return "Not available";
    }


    try {

      const date =
        new Date(dateValue);


      if (
        Number.isNaN(date.getTime())
      ) {

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
          hour12: true,
        }
      );

    } catch {

      return "Not available";
    }
  };


  /* =======================================================
     PRICE
     ======================================================= */

  const formatPrice = (price) => {

    if (
      price === null ||
      price === undefined ||
      price === "" ||
      Number.isNaN(Number(price))
    ) {

      return "₹0";
    }


    return `₹${Number(
      price
    ).toLocaleString("en-IN")}`;
  };


  /* =======================================================
     FILTER OPTIONS
     ======================================================= */

  const categoryOptions = [
    ...new Set(
      auctions
        .map(
          (auction) =>
            auction?.category
        )
        .filter(Boolean)
        .map(
          (value) =>
            String(value).trim()
        )
    ),
  ].sort();


  const conditionOptions = [
    ...new Set(
      auctions
        .map(
          (auction) =>
            auction?.product_condition
        )
        .filter(Boolean)
        .map(
          (value) =>
            String(value).trim()
        )
    ),
  ].sort();


  const locationOptions = [
    ...new Set(
      auctions
        .map(
          (auction) =>
            auction?.location_city
        )
        .filter(Boolean)
        .map(
          (value) =>
            String(value).trim()
        )
    ),
  ].sort();


  /* =======================================================
     FILTER AUCTIONS
     ======================================================= */

  const filteredAuctions =
    auctions.filter((auction) => {

      const searchText =
        appliedFilters.search
          .trim()
          .toLowerCase();


      const title =
        String(
          auction?.product_title || ""
        ).toLowerCase();


      const brand =
        String(
          auction?.brand_model || ""
        ).toLowerCase();


      const seller =
        String(
          auction?.seller_name || ""
        ).toLowerCase();


      const category =
        String(
          auction?.category || ""
        ).toLowerCase();


      const condition =
        String(
          auction?.product_condition || ""
        ).toLowerCase();


      const location =
        String(
          auction?.location_city || ""
        ).toLowerCase();


      const auctionStatus =
        getAuctionDisplayStatus(
          auction
        );


      const price =
        Number(
          auction?.starting_price
        ) || 0;


      const matchesSearch =
        !searchText ||
        title.includes(searchText) ||
        brand.includes(searchText) ||
        seller.includes(searchText) ||
        category.includes(searchText);


      const matchesStatus =
        appliedFilters.status === "all" ||
        auctionStatus ===
          appliedFilters.status;


      const matchesCategory =
        appliedFilters.category === "all" ||
        category ===
          appliedFilters.category.toLowerCase();


      const matchesCondition =
        appliedFilters.condition === "all" ||
        condition ===
          appliedFilters.condition.toLowerCase();


      const matchesLocation =
        appliedFilters.location === "all" ||
        location ===
          appliedFilters.location.toLowerCase();


      let matchesPrice = true;


      switch (
        appliedFilters.price
      ) {

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
    });


  /* =======================================================
     FILTER HANDLERS
     ======================================================= */

  const handleFilterChange = (
    field,
    value
  ) => {

    setDraftFilters(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  };


  const handleApplyFilters = () => {

    setAppliedFilters({
      ...draftFilters,
    });
  };


  const handleClearFilters = () => {

    setDraftFilters(
      defaultFilters
    );

    setAppliedFilters(
      defaultFilters
    );
  };


  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {

    return (
      <div className="my-auctions-page">

        <div className="my-auctions-header">

          <div>

            <h1>
              My Auctions
            </h1>

            <p>
              Manage and track all your auctions
            </p>

          </div>

        </div>


        <div className="my-auctions-loading">

          <div className="my-auctions-spinner"></div>

          <p>
            Loading your auctions...
          </p>

        </div>

      </div>
    );
  }


  /* =======================================================
     ERROR
     ======================================================= */

  if (error) {

    return (
      <div className="my-auctions-page">

        <div className="my-auctions-header">

          <div>

            <h1>
              My Auctions
            </h1>

            <p>
              Manage and track all your auctions
            </p>

          </div>

        </div>


        <div className="my-auctions-error">

          <FaExclamationCircle
            className="error-icon"
          />

          <h2>
            Unable to load auctions
          </h2>

          <p>
            {error}
          </p>

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


  /* =======================================================
     NO AUCTIONS
     ======================================================= */

  if (auctions.length === 0) {

    return (
      <div className="my-auctions-page">

        <div className="my-auctions-header">

          <div>

            <h1>
              My Auctions
            </h1>

            <p>
              Manage and track all your auctions
            </p>

          </div>

        </div>


        <div className="my-auctions-empty">

          <div className="empty-icon-wrapper">
            <FaBoxOpen />
          </div>

          <h2>
            No Auctions Yet
          </h2>

          <p>
            You haven't created any auctions yet.
            Create your first auction to get started.
          </p>

          <button
            type="button"
            className="create-auction-btn"
            onClick={() =>
              navigate(
                "/dashboard/create-auction"
              )
            }
          >
            Create Auction
          </button>

        </div>

      </div>
    );
  }


  /* =======================================================
     MAIN PAGE
     ======================================================= */

  return (
    <div className="my-auctions-page">


      {/* ===================================================
          HEADER
          =================================================== */}

      <div className="my-auctions-header">

        <div>

          <h1>
            My Auctions
          </h1>

          <p>
            Manage and track all your auctions
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


      {/* ===================================================
          FILTER PANEL
          =================================================== */}

      <div className="my-auctions-filter-panel">


        <div className="filter-panel-heading">

          <div className="filter-title">

            <div className="filter-title-icon">
              <FaFilter />
            </div>

            <div>

              <h2>
                Filter Auctions
              </h2>

              <p>
                Find the auctions you want faster
              </p>

            </div>

          </div>


          <button
            type="button"
            className="clear-filters-btn"
            onClick={handleClearFilters}
          >
            <FaTimes />
            Clear Filters
          </button>

        </div>


        <div className="filter-grid">


          {/* SEARCH */}

          <div className="filter-field filter-search-field">

            <label htmlFor="auction-search">

              <FaSearch />

              Search

            </label>


            <input
              id="auction-search"
              type="text"
              placeholder="Search by title, brand, seller..."
              value={draftFilters.search}
              onChange={(event) =>
                handleFilterChange(
                  "search",
                  event.target.value
                )
              }
            />

          </div>


          {/* STATUS */}

          <FilterDropdown
            label="Status"
            value={draftFilters.status}
            onChange={(value) =>
              handleFilterChange(
                "status",
                value
              )
            }
            options={[
              {
                value: "all",
                label: "All Status",
              },
              {
                value: "live",
                label: "Live",
              },
              {
                value: "upcoming",
                label: "Upcoming",
              },
              {
                value: "ended",
                label: "Ended",
              },
              {
                value: "approved",
                label: "Approved",
              },
              {
                value: "pending",
                label: "Pending",
              },
              {
                value: "rejected",
                label: "Rejected",
              },
            ]}
          />


          {/* CATEGORY */}

          <FilterDropdown
            label="Category"
            value={draftFilters.category}
            onChange={(value) =>
              handleFilterChange(
                "category",
                value
              )
            }
            options={[
              {
                value: "all",
                label: "All Categories",
              },

              ...categoryOptions.map(
                (category) => ({
                  value: category,
                  label: category,
                })
              ),
            ]}
          />


          {/* CONDITION */}

          <FilterDropdown
            label="Condition"
            value={draftFilters.condition}
            onChange={(value) =>
              handleFilterChange(
                "condition",
                value
              )
            }
            options={[
              {
                value: "all",
                label: "All Conditions",
              },

              ...conditionOptions.map(
                (condition) => ({
                  value: condition,
                  label: condition,
                })
              ),
            ]}
          />


          {/* PRICE */}

          <FilterDropdown
            label="Price Range"
            value={draftFilters.price}
            onChange={(value) =>
              handleFilterChange(
                "price",
                value
              )
            }
            options={[
              {
                value: "all",
                label: "Any Price",
              },
              {
                value: "under-10000",
                label: "Under ₹10,000",
              },
              {
                value: "10000-50000",
                label: "₹10,000 – ₹50,000",
              },
              {
                value: "50000-100000",
                label: "₹50,000 – ₹1,00,000",
              },
              {
                value: "above-100000",
                label: "Above ₹100,000",
              },
            ]}
          />


          {/* LOCATION */}

          <FilterDropdown
            label="Location"
            value={draftFilters.location}
            onChange={(value) =>
              handleFilterChange(
                "location",
                value
              )
            }
            options={[
              {
                value: "all",
                label: "All Locations",
              },

              ...locationOptions.map(
                (location) => ({
                  value: location,
                  label: location,
                })
              ),
            ]}
          />

        </div>


        {/* FILTER FOOTER */}

        <div className="filter-panel-footer">

          <span>

            Showing{" "}

            <strong>
              {filteredAuctions.length}
            </strong>{" "}

            of{" "}

            <strong>
              {auctions.length}
            </strong>{" "}

            auctions

          </span>


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


      {/* ===================================================
          AUCTION CARDS
          =================================================== */}

      <div className="my-auctions-grid">

        {filteredAuctions.length === 0 ? (

          <div className="my-auctions-filter-empty">

            <FaSearch />

            <h3>
              No auctions found
            </h3>

            <p>
              Try changing your filters or
              search keyword.
            </p>

            <button
              type="button"
              className="filter-empty-clear-btn"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>

          </div>

        ) : (

          filteredAuctions.map(
            (auction) => {

              const status =
                getAuctionDisplayStatus(
                  auction
                );

              const statusLabel =
                getStatusLabel(status);

              const firstImage =
                getFirstAuctionImage(
                  auction
                );


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

                      {getStatusIcon(
                        status
                      )}

                      <span>
                        {statusLabel}
                      </span>

                    </div>

                  </div>


                  {/* PRODUCT */}

                  <div className="my-auction-product">


                    <div
                      className={`auction-product-icon ${
                        firstImage
                          ? "auction-product-image-clickable"
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
                            event.key ===
                              "Enter" ||
                            event.key ===
                              " "
                          )
                        ) {

                          event.preventDefault();

                          handleImageClick(
                            firstImage
                          );
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
                          onError={(event) => {

                            console.error(
                              "Auction image failed:",
                              firstImage
                            );

                            event.currentTarget.style.display =
                              "none";


                            const fallback =
                              event.currentTarget
                                .parentElement
                                ?.querySelector(
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
                          display:
                            firstImage
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

                  {(
                    auction.location_city ||
                    auction.location_state
                  ) && (

                    <div className="auction-location">

                      <span>
                        Location:
                      </span>

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


                    {canViewAuction(
                      status
                    ) ? (

                      <button
                        type="button"
                        className="view-auction-btn"
                        onClick={() =>
                          handleViewAuction(
                            auction
                          )
                        }
                      >

                        <FaEye />

                        View Auction

                      </button>

                    ) : status ===
                      "pending" ? (

                      <div className="auction-status-message pending-message">

                        <FaClock />

                        Waiting for admin approval

                      </div>

                    ) : status ===
                      "rejected" ? (

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
            }
          )
        )}

      </div>


      {/* ===================================================
          IMAGE PREVIEW POPUP
          =================================================== */}

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