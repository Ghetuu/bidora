import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  FaHandHoldingUsd,
  FaExclamationTriangle,
  FaReceipt,
  FaChartLine,
  FaSearch,
  FaRedo,
  FaExternalLinkAlt,
  FaClock,
  FaArrowDown,
  FaTrophy,
  FaChevronDown,
  FaCheck,
  FaFilter,
  FaTimes
} from "react-icons/fa";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/bidhistory.css";
// Reuse the same filter-card design as the Auction History page
import "../styles/AuctionHistory.css";


const API_URL = "http://127.0.0.1:8000";


// =========================================================
// FILTER HELPERS
// =========================================================

const inAmountRange = (amount, min, max) => {

  const value = Number(amount || 0);

  if (min !== "" && value < Number(min)) return false;
  if (max !== "" && value > Number(max)) return false;

  return true;
};

const inDateRange = (dateValue, from, to) => {

  if (!from && !to) return true;

  if (!dateValue) return false;

  const parsed = new Date(dateValue);

  if (Number.isNaN(parsed.getTime())) return false;

  const dateOnly = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate()
  );

  if (from && dateOnly < new Date(`${from}T00:00:00`)) return false;
  if (to && dateOnly > new Date(`${to}T23:59:59`)) return false;

  return true;
};


// =========================================================
// CUSTOM DROPDOWN COMPONENT (same as Auction History)
// =========================================================

const CustomDropdown = ({ label, options, value, onChange }) => {

  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useRef(null);

  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {

    const handleClickOutside = (event) => {

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }

    };

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);

  }, []);

  return (
    <div className="custom-dropdown-container" ref={dropdownRef}>

      {label && (
        <label className="auction-history-filter-label">
          {label}
        </label>
      )}

      <div
        className={`custom-dropdown-header ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>
          {selectedOption ? selectedOption.label : "Select..."}
        </span>

        <FaChevronDown
          className={`custom-dropdown-arrow ${isOpen ? "rotated" : ""}`}
        />
      </div>

      {isOpen && (
        <div className="custom-dropdown-menu">

          {options.map((option) => {

            const isSelected = option.value === value;

            return (
              <div
                key={option.value}
                className={`custom-dropdown-item ${
                  isSelected ? "selected" : ""
                }`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span className="item-label">{option.label}</span>

                {isSelected && <FaCheck className="item-check" />}
              </div>
            );

          })}

        </div>
      )}

    </div>
  );
};


const BidHistory = () => {

  // =========================================================
  // STATE
  // =========================================================

  const [activeTab, setActiveTab] = useState("my-bids");

  // ---------- FILTER STATES ----------
  const [searchQuery, setSearchQuery] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [resultFilter, setResultFilter] = useState("all");

  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [bidHistory, setBidHistory] = useState({
    summary: {
      bids_placed: 0,
      active_bids: 0,
      outbid_items: 0,
      bids_received: 0,
      listings_with_bids: 0,
      highest_incoming_offer: 0
    },
    my_bids: [],
    bids_received: [],
    activity: []
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // =========================================================
  // STATUS OPTIONS (AUCTION TIME STATUS)
  // =========================================================

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "live", label: "Live Now" },
    { value: "upcoming", label: "Upcoming" },
    { value: "ended", label: "Ended" }
  ];


  // =========================================================
  // RESULT FILTER OPTIONS (CHANGES WITH THE ACTIVE TAB)
  // =========================================================

  const resultConfig = useMemo(() => {

    if (activeTab === "my-bids") {
      return {
        label: "Bid Result",
        options: [
          { value: "all", label: "All Results" },
          { value: "Highest Bidder", label: "Highest Bidder" },
          { value: "Outbid", label: "Outbid" },
          { value: "Won Auction", label: "Won Auction" }
        ]
      };
    }

    if (activeTab === "bids-received") {
      return {
        label: "Offer Type",
        options: [
          { value: "all", label: "All Offers" },
          { value: "highest", label: "Highest Offer" },
          { value: "other", label: "Other Offers" }
        ]
      };
    }

    return {
      label: "Activity Type",
      options: [
        { value: "all", label: "All Activity" },
        { value: "bid_placed", label: "Bids Placed" },
        { value: "bid_received", label: "Bids Received" }
      ]
    };

  }, [activeTab]);


  // =========================================================
  // TAB CHANGE (RESETS THE TAB-SPECIFIC FILTER)
  // =========================================================

  const handleTabChange = (tab) => {

    setActiveTab(tab);

    setResultFilter("all");

  };


  // =========================================================
  // FETCH BID HISTORY
  // =========================================================

  const fetchBidHistory = async () => {

    try {

      setLoading(true);
      setError("");

      const token = sessionStorage.getItem("access_token");

      if (!token) {

        setError("Please login again to view your bid history.");

        setLoading(false);

        return;
      }


      const response = await axios.get(
        `${API_URL}/api/bid-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );


      if (response.data?.success) {

        setBidHistory({
          summary: response.data.summary || {
            bids_placed: 0,
            active_bids: 0,
            outbid_items: 0,
            bids_received: 0,
            listings_with_bids: 0,
            highest_incoming_offer: 0
          },

          my_bids: response.data.my_bids || [],

          bids_received: response.data.bids_received || [],

          activity: response.data.activity || []
        });

      } else {

        setError(
          response.data?.message ||
          "Unable to load bid history."
        );

      }

    } catch (err) {

      console.error(
        "Bid history error:",
        err
      );

      if (err.response?.status === 401) {

        setError(
          "Your session has expired. Please login again."
        );

      } else {

        setError(
          err.response?.data?.detail ||
          "Failed to load bid history."
        );
      }

    } finally {

      setLoading(false);

    }
  };


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {

    fetchBidHistory();

  }, []);


  // =========================================================
  // IMAGE URL HELPER
  // =========================================================

  const getImageUrl = (imagePath) => {

    if (!imagePath) {
      return null;
    }

    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      return imagePath;
    }

    if (imagePath.startsWith("/")) {
      return `${API_URL}${imagePath}`;
    }

    return `${API_URL}/${imagePath}`;
  };


  // =========================================================
  // FORMAT MONEY
  // =========================================================

  const formatAmount = (amount) => {

    if (
      amount === null ||
      amount === undefined ||
      amount === ""
    ) {
      return "₹0.00";
    }

    const number = Number(amount);

    if (Number.isNaN(number)) {
      return "₹0.00";
    }

    return `₹${number.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };


  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDateTime = (dateValue) => {

    if (!dateValue) {
      return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  };


  // =========================================================
  // TIME LEFT
  // =========================================================

  const getTimeLeft = (item) => {

    if (item.time_left) {
      return item.time_left;
    }

    if (item.auction_status === "ended") {
      return "Ended";
    }

    if (item.auction_status === "upcoming") {

      if (item.auction_start) {

        const start = new Date(item.auction_start);

        if (!Number.isNaN(start.getTime())) {

          const diff = start.getTime() - Date.now();

          if (diff <= 0) {
            return "Starting soon";
          }

          const totalMinutes =
            Math.floor(diff / (1000 * 60));

          const days =
            Math.floor(totalMinutes / 1440);

          const hours =
            Math.floor(
              (totalMinutes % 1440) / 60
            );

          const minutes =
            totalMinutes % 60;

          if (days > 0) {
            return `${days}d ${hours}h`;
          }

          if (hours > 0) {
            return `${hours}h ${minutes}m`;
          }

          return `${minutes}m`;
        }
      }

      return "Upcoming";
    }


    if (item.auction_end) {

      const end = new Date(item.auction_end);

      if (!Number.isNaN(end.getTime())) {

        const diff = end.getTime() - Date.now();

        if (diff <= 0) {
          return "Ended";
        }

        const totalMinutes =
          Math.floor(diff / (1000 * 60));

        const days =
          Math.floor(totalMinutes / 1440);

        const hours =
          Math.floor(
            (totalMinutes % 1440) / 60
          );

        const minutes =
          totalMinutes % 60;

        if (days > 0) {
          return `${days}d ${hours}h`;
        }

        if (hours > 0) {
          return `${hours}h ${minutes}m`;
        }

        return `${minutes}m`;
      }
    }

    return "—";
  };


  // =========================================================
  // GET IMAGE
  // =========================================================

  const getItemImage = (item) => {

    if (item.image) {
      return getImageUrl(item.image);
    }

    if (item.image_path) {
      return getImageUrl(item.image_path);
    }

    if (
      item.images &&
      Array.isArray(item.images) &&
      item.images.length > 0
    ) {

      const firstImage =
        typeof item.images[0] === "string"
          ? item.images[0]
          : item.images[0]?.image_path;

      return getImageUrl(firstImage);
    }

    return null;
  };


  // =========================================================
  // NORMALIZE MY BIDS
  // =========================================================

  const normalizedMyBids = useMemo(() => {

    return bidHistory.my_bids.map((item) => {

      return {
        ...item,

        id:
          item.id ??
          item.auction_id,

        title:
          item.title ||
          item.product_title ||
          "Unknown Auction",

        category:
          item.category ||
          "—",

        image:
          getItemImage(item),

        seller:
          item.seller ||
          item.seller_name ||
          "Unknown Seller",

        currentHigh:
          item.current_high ??
          item.current_highest_bid ??
          item.highest_bid ??
          0,

        myMaxBid:
          item.my_max_bid ??
          item.my_highest_bid ??
          item.user_highest_bid ??
          0,

        timeLeft:
          getTimeLeft(item),

        status:
          item.status ||
          "Highest Bidder",

        auction_status:
          item.auction_status ||
          "ended"
      };

    });

  }, [bidHistory.my_bids]);


  // =========================================================
  // NORMALIZE RECEIVED BIDS
  // =========================================================

  const normalizedReceivedBids = useMemo(() => {

    return bidHistory.bids_received.map((item) => {

      return {
        ...item,

        id:
          item.id ??
          `${item.auction_id}-${item.bid_id}`,

        auction_id:
          item.auction_id,

        title:
          item.title ||
          item.product_title ||
          "Unknown Auction",

        category:
          item.category ||
          "—",

        image:
          getItemImage(item),

        bidder:
          item.bidder_name ||
          item.bidder ||
          "Unknown Bidder",

        amount:
          item.amount ??
          item.bid_amount ??
          0,

        currentHigh:
          item.current_high ??
          item.highest_bid ??
          item.amount ??
          0,

        timeLeft:
          getTimeLeft(item),

        status:
          item.status ||
          (
            item.is_highest
              ? "Highest Offer"
              : "Received Bid"
          ),

        auction_status:
          item.auction_status ||
          "ended",

        created_at:
          item.created_at
      };

    });

  }, [bidHistory.bids_received]);


  // =========================================================
  // FILTER MY BIDS
  // =========================================================

  const filteredMyBids = useMemo(() => {

    return normalizedMyBids.filter((item) => {

      const search =
        searchQuery.trim().toLowerCase();

      const matchesSearch =
        !search ||
        String(item.id)
          .toLowerCase()
          .includes(search) ||
        String(item.auction_id || "")
          .toLowerCase()
          .includes(search) ||
        String(item.title)
          .toLowerCase()
          .includes(search) ||
        String(item.category)
          .toLowerCase()
          .includes(search) ||
        String(item.seller)
          .toLowerCase()
          .includes(search);


      const matchesStatus =
        statusFilter === "all" ||
        item.auction_status === statusFilter;


      const matchesResult =
        resultFilter === "all" ||
        item.status === resultFilter;


      const matchesAmount =
        inAmountRange(
          item.myMaxBid,
          amountMin,
          amountMax
        );


      const matchesDate =
        inDateRange(
          item.last_bid_at,
          fromDate,
          toDate
        );


      return (
        matchesSearch &&
        matchesStatus &&
        matchesResult &&
        matchesAmount &&
        matchesDate
      );

    });

  }, [
    normalizedMyBids,
    searchQuery,
    statusFilter,
    resultFilter,
    amountMin,
    amountMax,
    fromDate,
    toDate
  ]);


  // =========================================================
  // FILTER RECEIVED BIDS
  // =========================================================

  const filteredReceivedBids = useMemo(() => {

    return normalizedReceivedBids.filter((item) => {

      const search =
        searchQuery.trim().toLowerCase();

      const matchesSearch =
        !search ||
        String(item.id)
          .toLowerCase()
          .includes(search) ||
        String(item.auction_id || "")
          .toLowerCase()
          .includes(search) ||
        String(item.title)
          .toLowerCase()
          .includes(search) ||
        String(item.bidder)
          .toLowerCase()
          .includes(search) ||
        String(item.category)
          .toLowerCase()
          .includes(search);


      const matchesStatus =
        statusFilter === "all" ||
        item.auction_status === statusFilter;


      const matchesResult =
        resultFilter === "all" ||
        (resultFilter === "highest" &&
          item.is_highest === true) ||
        (resultFilter === "other" &&
          item.is_highest !== true);


      const matchesAmount =
        inAmountRange(
          item.amount,
          amountMin,
          amountMax
        );


      const matchesDate =
        inDateRange(
          item.created_at,
          fromDate,
          toDate
        );


      return (
        matchesSearch &&
        matchesStatus &&
        matchesResult &&
        matchesAmount &&
        matchesDate
      );

    });

  }, [
    normalizedReceivedBids,
    searchQuery,
    statusFilter,
    resultFilter,
    amountMin,
    amountMax,
    fromDate,
    toDate
  ]);


  // =========================================================
  // ACTIVITY FEED
  // =========================================================

  const activityData = useMemo(() => {

    // If backend already supplies activity,
    // use it directly.

    if (
      bidHistory.activity &&
      bidHistory.activity.length > 0
    ) {

      return bidHistory.activity.map((item, index) => {

        return {
          ...item,

          id:
            item.id ??
            `activity-${index}`,

          title:
            item.title ||
            item.product_title ||
            "Auction",

          category:
            item.category ||
            "—",

          image:
            getItemImage(item),

          auction_status:
            item.auction_status ||
            "ended",

          created_at:
            item.created_at
        };

      });

    }


    // Otherwise build a unified activity feed
    // from placed + received bids.

    const placedActivities =
      normalizedMyBids.map((item) => {

        return {
          id:
            `placed-${item.id}`,

          auction_id:
            item.auction_id ||
            item.id,

          title:
            item.title,

          category:
            item.category,

          image:
            item.image,

          type:
            "bid_placed",

          message:
            `You placed a bid of ${formatAmount(
              item.myMaxBid
            )}`,

          amount:
            item.myMaxBid,

          auction_status:
            item.auction_status,

          created_at:
            item.last_bid_at ||
            item.created_at ||
            item.auction_start
        };

      });


    const receivedActivities =
      normalizedReceivedBids.map((item) => {

        return {
          id:
            `received-${item.id}`,

          auction_id:
            item.auction_id,

          title:
            item.title,

          category:
            item.category,

          image:
            item.image,

          type:
            "bid_received",

          message:
            `${item.bidder} placed a bid of ${formatAmount(
              item.amount
            )}`,

          amount:
            item.amount,

          auction_status:
            item.auction_status,

          created_at:
            item.created_at
        };

      });


    return [
      ...placedActivities,
      ...receivedActivities
    ].sort((a, b) => {

      const dateA =
        new Date(a.created_at || 0).getTime();

      const dateB =
        new Date(b.created_at || 0).getTime();

      return dateB - dateA;

    });

  }, [
    bidHistory.activity,
    normalizedMyBids,
    normalizedReceivedBids
  ]);


  // =========================================================
  // FILTER ACTIVITY
  // =========================================================

  const filteredActivity = useMemo(() => {

    return activityData.filter((item) => {

      const search =
        searchQuery.trim().toLowerCase();

      const matchesSearch =
        !search ||
        String(item.auction_id || "")
          .toLowerCase()
          .includes(search) ||
        String(item.title || "")
          .toLowerCase()
          .includes(search) ||
        String(item.category || "")
          .toLowerCase()
          .includes(search) ||
        String(item.message || "")
          .toLowerCase()
          .includes(search);


      const matchesStatus =
        statusFilter === "all" ||
        item.auction_status === statusFilter;


      const matchesResult =
        resultFilter === "all" ||
        item.type === resultFilter;


      const matchesAmount =
        inAmountRange(
          item.amount,
          amountMin,
          amountMax
        );


      const matchesDate =
        inDateRange(
          item.created_at,
          fromDate,
          toDate
        );


      return (
        matchesSearch &&
        matchesStatus &&
        matchesResult &&
        matchesAmount &&
        matchesDate
      );

    });

  }, [
    activityData,
    searchQuery,
    statusFilter,
    resultFilter,
    amountMin,
    amountMax,
    fromDate,
    toDate
  ]);


  // =========================================================
  // RESET FILTERS
  // =========================================================

  const hasActiveFilters =
    searchQuery ||
    statusFilter !== "all" ||
    resultFilter !== "all" ||
    amountMin !== "" ||
    amountMax !== "" ||
    fromDate ||
    toDate;

  const handleResetFilters = () => {

    setSearchQuery("");

    setStatusFilter("all");

    setResultFilter("all");

    setAmountMin("");
    setAmountMax("");

    setFromDate("");
    setToDate("");

  };


  // =========================================================
  // GET ACTIVE DATA
  // =========================================================

  const activeData =
    activeTab === "my-bids"
      ? filteredMyBids
      : activeTab === "bids-received"
        ? filteredReceivedBids
        : filteredActivity;

  const totalForTab =
    activeTab === "my-bids"
      ? normalizedMyBids.length
      : activeTab === "bids-received"
        ? normalizedReceivedBids.length
        : activityData.length;

  const resultsNoun =
    activeTab === "activity-feed"
      ? "activities"
      : "bids";


  // =========================================================
  // RENDER STATUS
  // =========================================================

  const renderMyBidStatus = (status) => {

    if (status === "Highest Bidder") {

      return (
        <span className="bh-status-pill bh-status-highest">
          <span className="bh-dot-green"></span>
          <span>Highest Bidder</span>
        </span>
      );

    }


    if (status === "Outbid") {

      return (
        <span className="bh-status-pill bh-status-outbid">
          <FaArrowDown
            style={{ fontSize: "0.625rem" }}
          />
          <span>Outbid</span>
        </span>
      );

    }


    if (status === "Won Auction") {

      return (
        <span className="bh-status-pill bh-status-won">
          <FaTrophy
            style={{ fontSize: "0.75rem" }}
          />
          <span>Won Auction</span>
        </span>
      );

    }


    return (
      <span className="bh-status-pill bh-status-highest">
        <span className="bh-dot-green"></span>
        <span>{status || "Active"}</span>
      </span>
    );

  };


  // =========================================================
  // RENDER RECEIVED STATUS
  // =========================================================

  const renderReceivedStatus = (item) => {

    if (
      item.is_highest === true ||
      item.status === "Highest Offer"
    ) {

      return (
        <span className="bh-status-pill bh-status-highest">
          <span className="bh-dot-green"></span>
          <span>Highest Offer</span>
        </span>
      );

    }


    return (
      <span className="bh-status-pill bh-status-highest">
        <span className="bh-dot-green"></span>
        <span>
          {item.status || "Received Bid"}
        </span>
      </span>
    );

  };


  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loading) {

    return (
      <div className="bh-wrapper">

        <div className="bh-container">

          <div
            style={{
              padding: "50px",
              textAlign: "center"
            }}
          >
            <FaRedo
              className="bh-loading-icon"
            />

            <p>
              Loading bid history...
            </p>

          </div>

        </div>

      </div>
    );

  }


  // =========================================================
  // MAIN UI
  // =========================================================

  return (

    <div className="bh-wrapper">

      {/* =====================================================
          DARK FILTER CARD (same design as Auction History)
      ===================================================== */}

      <div className="auction-history-filter-card">

        {/* HEADER */}

        <div className="auction-history-filter-header">

          <div className="auction-history-title-group">

            <div className="auction-history-title-icon">
              <FaFilter />
            </div>

            <div>
              <h1>Filter Bid History</h1>
              <p>Find the bids you want faster</p>
            </div>

          </div>

          <div className="auction-history-header-actions">

            {hasActiveFilters && (
              <button
                type="button"
                className="auction-history-clear-btn"
                onClick={handleResetFilters}
              >
                <FaTimes />
                Clear Filters
              </button>
            )}

          </div>

        </div>


        {/* FILTER CONTROLS */}

        <div
          className="auction-history-filter-grid"
          style={{
            gridTemplateColumns:
              "repeat(auto-fit, minmax(230px, 1fr))"
          }}
        >

          {/* SEARCH */}

          <div className="auction-history-filter-group auction-history-search-group">

            <label className="auction-history-filter-label">
              Search
            </label>

            <div className="auction-history-search">

              <FaSearch />

              <input
                type="text"
                placeholder="Search item, category, bidder or ID..."
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
              />

            </div>

          </div>


          {/* AUCTION STATUS */}

          <CustomDropdown
            label="Auction Status"
            options={statusOptions}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
          />


          {/* TAB-SPECIFIC FILTER */}

          <CustomDropdown
            label={resultConfig.label}
            options={resultConfig.options}
            value={resultFilter}
            onChange={(val) => setResultFilter(val)}
          />


          {/* BID AMOUNT RANGE */}

          <div className="auction-history-filter-group">

            <label className="auction-history-filter-label">
              Bid Amount
            </label>

            <div className="auction-history-price-filter">

              <input
                type="number"
                min="0"
                placeholder="Min"
                value={amountMin}
                onChange={(e) =>
                  setAmountMin(e.target.value)
                }
                className="auction-history-price-input"
              />

              <span>-</span>

              <input
                type="number"
                min="0"
                placeholder="Max"
                value={amountMax}
                onChange={(e) =>
                  setAmountMax(e.target.value)
                }
                className="auction-history-price-input"
              />

            </div>

          </div>


          {/* BID DATE RANGE */}

          <div
            className="auction-history-filter-group auction-history-date-group"
            style={{ gridColumn: "span 2" }}
          >

            <label className="auction-history-filter-label">
              Bid Date
            </label>

            <div className="auction-history-date-filter">

              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) =>
                  setFromDate(e.target.value)
                }
                className="auction-history-date-input"
              />

              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) =>
                  setToDate(e.target.value)
                }
                className="auction-history-date-input"
              />

            </div>

          </div>

        </div>


        {/* FOOTER */}

        <div className="auction-history-filter-footer">

          <div className="auction-history-results-count">
            Showing <strong>{activeData.length}</strong> of{" "}
            <strong>{totalForTab}</strong> {resultsNoun}
          </div>

          <button
            type="button"
            className="auction-history-apply-btn"
          >
            <FaFilter /> Apply Filters
          </button>

        </div>

      </div>


      {/* =====================================================
          TOP METRIC CARDS
      ===================================================== */}

      <div className="bh-metrics-grid">

        {/* Card 1 */}

        <div className="bh-metric-card">

          <div>

            <p className="bh-metric-label">
              Bids Placed (Buying)
            </p>

            <div className="bh-metric-value-box">

              <span className="bh-metric-number">
                {bidHistory.summary.bids_placed || 0}
              </span>

              <span className="bh-metric-subtext-success">
                ↑ {bidHistory.summary.active_bids || 0} active
              </span>

            </div>

          </div>

          <div className="bh-metric-icon bh-icon-blue">
            <FaHandHoldingUsd />
          </div>

        </div>


        {/* Card 2 */}

        <div className="bh-metric-card bh-warning">

          <div>

            <p className="bh-metric-label">
              Outbid Items
            </p>

            <div className="bh-metric-value-box">

              <span className="bh-metric-number">
                {bidHistory.summary.outbid_items || 0}
              </span>

              <span className="bh-metric-subtext-warning">
                Needs action
              </span>

            </div>

          </div>

          <div className="bh-metric-icon bh-icon-amber">
            <FaExclamationTriangle />
          </div>

        </div>


        {/* Card 3 */}

        <div className="bh-metric-card">

          <div>

            <p className="bh-metric-label">
              Bids Received (Selling)
            </p>

            <div className="bh-metric-value-box">

              <span className="bh-metric-number">
                {bidHistory.summary.bids_received || 0}
              </span>

              <span className="bh-metric-subtext-success">
                Across{" "}
                {bidHistory.summary.listings_with_bids || 0}{" "}
                listings
              </span>

            </div>

          </div>

          <div className="bh-metric-icon bh-icon-purple">
            <FaReceipt />
          </div>

        </div>


        {/* Card 4 */}

        <div className="bh-metric-card">

          <div>

            <p className="bh-metric-label">
              Highest Incoming Offer
            </p>

            <div className="bh-metric-value-box">

              <span
                className="bh-metric-number"
                style={{ color: "#16a34a" }}
              >
                {formatAmount(
                  bidHistory.summary.highest_incoming_offer
                )}
              </span>

            </div>

          </div>

          <div className="bh-metric-icon bh-icon-green">
            <FaChartLine />
          </div>

        </div>

      </div>


      {/* =====================================================
          MAIN CONTAINER
      ===================================================== */}

      <div className="bh-container">


        {/* ===================================================
            TABS BAR
        =================================================== */}

        <div className="bh-controls-bar">

          <div className="bh-tabs-group">


            {/* My Bids */}

            <button
              onClick={() => handleTabChange("my-bids")}
              className={`bh-tab-btn ${
                activeTab === "my-bids"
                  ? "bh-active"
                  : ""
              }`}
            >

              <FaExternalLinkAlt
                style={{
                  fontSize: "0.75rem"
                }}
              />

              <span>
                My Bids Placed
              </span>

              <span
                className={
                  activeTab === "my-bids"
                    ? "bh-badge-active"
                    : "bh-badge-inactive"
                }
              >
                {bidHistory.summary.bids_placed || 0}
              </span>

            </button>


            {/* Bids Received */}

            <button
              onClick={() => handleTabChange("bids-received")}
              className={`bh-tab-btn ${
                activeTab === "bids-received"
                  ? "bh-active"
                  : ""
              }`}
            >

              <span>
                Bids Received
              </span>

              <span
                className={
                  activeTab === "bids-received"
                    ? "bh-badge-active"
                    : "bh-badge-inactive"
                }
              >
                {bidHistory.summary.bids_received || 0}
              </span>

            </button>


            {/* Activity Feed */}

            <button
              onClick={() => handleTabChange("activity-feed")}
              className={`bh-tab-btn ${
                activeTab === "activity-feed"
                  ? "bh-active"
                  : ""
              }`}
            >

              <span>
                Unified Activity Feed
              </span>

            </button>

          </div>

        </div>


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (

          <div
            style={{
              padding: "15px 20px",
              color: "#dc2626",
              textAlign: "center"
            }}
          >
            {error}
          </div>

        )}


        {/* ===================================================
            TABLE
        =================================================== */}

        <div className="bh-table-responsive">

          <table className="bh-table">

            <thead>

              <tr>

                <th>
                  Auction Item
                </th>


                {activeTab === "my-bids" && (
                  <>
                    <th>Seller</th>
                    <th>Current High</th>
                    <th>My Max Bid</th>
                    <th>Time Left</th>
                    <th>Status</th>
                  </>
                )}


                {activeTab === "bids-received" && (
                  <>
                    <th>Bidder</th>
                    <th>Bid Amount</th>
                    <th>Current High</th>
                    <th>Time</th>
                    <th>Status</th>
                  </>
                )}


                {activeTab === "activity-feed" && (
                  <>
                    <th>Activity</th>
                    <th>Amount</th>
                    <th>Time</th>
                    <th>Status</th>
                  </>
                )}


                <th
                  style={{
                    textAlign: "right"
                  }}
                >
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>


              {/* =================================================
                  EMPTY STATE
              ================================================= */}

              {activeData.length === 0 && (

                <tr>

                  <td
                    colSpan={
                      activeTab === "my-bids"
                        ? 7
                        : activeTab === "bids-received"
                          ? 7
                          : 6
                    }
                  >

                    <div
                      style={{
                        padding: "45px 20px",
                        textAlign: "center"
                      }}
                    >

                      <FaReceipt
                        style={{
                          fontSize: "2rem",
                          opacity: 0.4,
                          marginBottom: "10px"
                        }}
                      />

                      <p>
                        No bid history found.
                      </p>

                    </div>

                  </td>

                </tr>

              )}


              {/* =================================================
                  MY BIDS
              ================================================= */}

              {activeTab === "my-bids" &&
                filteredMyBids.map((item) => (

                  <tr key={item.id}>


                    {/* Auction Item */}

                    <td>

                      <div className="bh-item-cell">

                        {item.image ? (

                          <img
                            src={item.image}
                            alt={item.title}
                            className="bh-item-img"
                          />

                        ) : (

                          <div
                            className="bh-item-img"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <FaReceipt />
                          </div>

                        )}


                        <div>

                          <p className="bh-item-title">
                            {item.title}
                          </p>

                          <p className="bh-item-category">
                            {item.category}
                          </p>

                        </div>

                      </div>

                    </td>


                    {/* Seller */}

                    <td className="bh-seller-name">
                      {item.seller}
                    </td>


                    {/* Current High */}

                    <td className="bh-amount-highlight">
                      {formatAmount(
                        item.currentHigh
                      )}
                    </td>


                    {/* My Max Bid */}

                    <td className="bh-amount-subtle">
                      {formatAmount(
                        item.myMaxBid
                      )}
                    </td>


                    {/* Time Left */}

                    <td>

                      <div className="bh-time-cell">

                        <FaClock
                          style={{
                            fontSize: "0.75rem"
                          }}
                        />

                        <span>
                          {item.timeLeft}
                        </span>

                      </div>

                    </td>


                    {/* Status */}

                    <td>
                      {renderMyBidStatus(
                        item.status
                      )}
                    </td>


                    {/* Actions */}

                    <td
                      style={{
                        textAlign: "right"
                      }}
                    >

                      {item.status === "Outbid" &&
                      item.auction_status === "live" ? (

                        <Link
                          to={`/dashboard/live-auction/${item.id}`}
                          className="bh-action-btn-raise"
                        >
                          Raise Bid
                        </Link>

                      ) : (

                        <Link
                          to={`/dashboard/auction/${item.id}`}
                          className="bh-action-btn-view"
                        >
                          View
                        </Link>

                      )}

                    </td>

                  </tr>

                ))}


              {/* =================================================
                  BIDS RECEIVED
              ================================================= */}

              {activeTab === "bids-received" &&
                filteredReceivedBids.map((item) => (

                  <tr key={item.id}>


                    {/* Auction Item */}

                    <td>

                      <div className="bh-item-cell">

                        {item.image ? (

                          <img
                            src={item.image}
                            alt={item.title}
                            className="bh-item-img"
                          />

                        ) : (

                          <div
                            className="bh-item-img"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <FaReceipt />
                          </div>

                        )}


                        <div>

                          <p className="bh-item-title">
                            {item.title}
                          </p>

                          <p className="bh-item-category">
                            {item.category}
                          </p>

                        </div>

                      </div>

                    </td>


                    {/* Bidder */}

                    <td className="bh-seller-name">
                      {item.bidder}
                    </td>


                    {/* Bid Amount */}

                    <td className="bh-amount-highlight">
                      {formatAmount(
                        item.amount
                      )}
                    </td>


                    {/* Current High */}

                    <td className="bh-amount-subtle">
                      {formatAmount(
                        item.currentHigh
                      )}
                    </td>


                    {/* Time */}

                    <td>

                      <div className="bh-time-cell">

                        <FaClock
                          style={{
                            fontSize: "0.75rem"
                          }}
                        />

                        <span>
                          {formatDateTime(
                            item.created_at
                          )}
                        </span>

                      </div>

                    </td>


                    {/* Status */}

                    <td>
                      {renderReceivedStatus(
                        item
                      )}
                    </td>


                    {/* Action */}

                    <td
                      style={{
                        textAlign: "right"
                      }}
                    >

                      <Link
                        to={`/dashboard/auction/${item.auction_id}`}
                        className="bh-action-btn-view"
                      >
                        View
                      </Link>

                    </td>

                  </tr>

                ))}


              {/* =================================================
                  UNIFIED ACTIVITY
              ================================================= */}

              {activeTab === "activity-feed" &&
                filteredActivity.map((item) => (

                  <tr key={item.id}>


                    {/* Auction */}

                    <td>

                      <div className="bh-item-cell">

                        {item.image ? (

                          <img
                            src={item.image}
                            alt={item.title}
                            className="bh-item-img"
                          />

                        ) : (

                          <div
                            className="bh-item-img"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <FaReceipt />
                          </div>

                        )}


                        <div>

                          <p className="bh-item-title">
                            {item.title}
                          </p>

                          <p className="bh-item-category">
                            {item.category}
                          </p>

                        </div>

                      </div>

                    </td>


                    {/* Activity */}

                    <td className="bh-seller-name">
                      {item.message ||
                        (
                          item.type === "bid_received"
                            ? "Bid received"
                            : "Bid placed"
                        )}
                    </td>


                    {/* Amount */}

                    <td className="bh-amount-highlight">
                      {formatAmount(
                        item.amount
                      )}
                    </td>


                    {/* Time */}

                    <td>

                      <div className="bh-time-cell">

                        <FaClock
                          style={{
                            fontSize: "0.75rem"
                          }}
                        />

                        <span>
                          {formatDateTime(
                            item.created_at
                          )}
                        </span>

                      </div>

                    </td>


                    {/* Status */}

                    <td>

                      {item.type === "bid_received" ? (

                        <span className="bh-status-pill bh-status-highest">

                          <span className="bh-dot-green"></span>

                          <span>
                            Bid Received
                          </span>

                        </span>

                      ) : (

                        renderMyBidStatus(
                          item.status ||
                          "Highest Bidder"
                        )

                      )}

                    </td>


                    {/* Action */}

                    <td
                      style={{
                        textAlign: "right"
                      }}
                    >

                      <Link
                        to={`/dashboard/auction/${item.auction_id}`}
                        className="bh-action-btn-view"
                      >
                        View
                      </Link>

                    </td>

                  </tr>

                ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

};


export default BidHistory;
