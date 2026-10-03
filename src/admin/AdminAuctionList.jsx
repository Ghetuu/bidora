import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaEye,
  FaEdit,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaBoxOpen,
  FaFilter,
  FaTimes,
  FaChevronDown,   // add
  FaCheck,
  FaShieldAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import adminApi from "../api/adminApi";
import "../styles/adminauctionlist.css";

const API_URL = "http://127.0.0.1:8000";

function CustomSelect({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((opt) => opt.value === value);

  return (
    <div className="filter-field">
      {label && <label>{label}</label>}
      <div className={`custom-select ${open ? "open" : ""}`} ref={ref}>
        <div className="custom-select-trigger" onClick={() => setOpen((p) => !p)}>
          <span>{selected ? selected.label : "Select"}</span>
          <FaChevronDown className="chevron" />
        </div>
        {open && (
          <div className="custom-select-dropdown">
            {options.map((opt) => (
              <div
                key={opt.value}
                className={`custom-select-option ${opt.value === value ? "selected" : ""}`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <span>{opt.label}</span>
                {opt.value === value && <FaCheck className="check-icon" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminAuctionList({ status = "all", title = "All Auctions" }) {
  const navigate = useNavigate();

  const [auctions, setAuctions] = useState([]);
  const [filteredAuctions, setFilteredAuctions] = useState([]);
  const [selectedRejectionReason, setSelectedRejectionReason] =
  useState(null);
  const [trustScores, setTrustScores] = useState({});
  const [trustModal, setTrustModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     IMAGE POPUP
  ========================================================= */

  const [selectedImage, setSelectedImage] = useState(null);

  /* =========================================================
     CHECKBOX SELECTION
  ========================================================= */

  const [selectedAuctions, setSelectedAuctions] = useState([]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  /* =========================================================
     FILTERS
  ========================================================= */

  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sellerFilter, setSellerFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  // Pending page: date range instead of Condition
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");

  // Bid amount search (row 1)
  const [bidMinFilter, setBidMinFilter] = useState("");
  const [bidMaxFilter, setBidMaxFilter] = useState("");

  // Name searches (row 3)
  const [sellerBidderFilter, setSellerBidderFilter] = useState("");
  const [winnerFilter, setWinnerFilter] = useState("");
   const isApprovedPage = status.toLowerCase() === "approved";
  const isRejectedPage = status.toLowerCase() === "rejected";
  const isLivePage = status.toLowerCase() === "live";
  const isPendingPage = status.toLowerCase() === "pending";
  const isCompletedPage =
  ["completed", "ended"].includes(status.toLowerCase());
  // Approved / Rejected / Live pages use "Seller Name" + "Date" filters
  // instead of "Condition" + "Location"
  const usesUserNameAndDateFilters =
    isApprovedPage || isRejectedPage || isLivePage;


  const priceRanges = [
    { label: "All Prices", value: "all" },
    { label: "Under ₹5,000", value: "0-5000" },
    { label: "₹5,000 - ₹20,000", value: "5000-20000" },
    { label: "₹20,000 - ₹50,000", value: "20000-50000" },
    { label: "Above ₹50,000", value: "50000-999999999" },
  ];

  const uniqueCategories = [
    ...new Set(auctions.map((a) => a.category).filter(Boolean)),
  ];

  const uniqueLocations = [
    ...new Set(
      auctions
        .map((a) => a.location_city || a.city)
        .filter(Boolean)
    ),
  ];

  const uniqueSellers = [
    ...new Set(
      auctions
        .map((a) => a.created_by_user?.fullname || a.seller_name)
        .filter(Boolean)
    ),
  ];
    const uniqueConditions = [
    ...new Set(auctions.map((a) => a.condition).filter(Boolean)),
  ];

  const activeFilterCount = [
    statusFilter !== "all",
    categoryFilter !== "all",
    usesUserNameAndDateFilters
      ? sellerFilter !== "all"
      : conditionFilter !== "all",
    priceFilter !== "all",
    usesUserNameAndDateFilters ? dateFilter !== "" : locationFilter !== "all",
  ].filter(Boolean).length;

 const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setConditionFilter("all");
    setPriceFilter("all");
    setLocationFilter("all");
    setSellerFilter("all");
    setDateFilter("");
    setDateFromFilter("");
    setDateToFilter("");
    setBidMinFilter("");
    setBidMaxFilter("");
    setSellerBidderFilter("");
    setWinnerFilter("");
  };

  /* =========================================================
     FETCH AUCTIONS
  ========================================================= */

 useEffect(() => {
  fetchAuctions();
  if (status.toLowerCase() === "pending") fetchTrustScores();
}, [status]);

const fetchTrustScores = async () => {
  try {
    const res = await adminApi.get(
      "/admin/auctions/trust-scores?status=pending"
    );

    console.log("Trust Score API Response:", res.data);

    setTrustScores(res.data?.scores || {});
  } catch (err) {
    console.error("Trust score error:", err);
    console.error("Trust score response:", err.response?.data);
    setTrustScores({});
  }
};
const getTrust = (auction) => trustScores[String(auction.id)];

  const fetchAuctions = async () => {
  try {
    setLoading(true);
    setError("");

    let url = "/admin/auctions/all";

    if (
      status !== "all" &&
      status.toLowerCase() !== "approved"
    ) {
      url = `/admin/auctions/status/${status}`;
    }

    const response = await adminApi.get(url);

    let auctionData = Array.isArray(response.data)
      ? response.data
      : response.data.auctions || [];

    if (status.toLowerCase() === "approved") {
      auctionData = auctionData.filter((auction) => {
        const currentStatus = (auction.status || "").toLowerCase();

        const hasApprovalInfo =
          auction.approved_by_name ||
          auction.approved_by ||
          auction.approver_name ||
          auction.approvedBy ||
          auction.approved_at ||
          auction.approval_date ||
          auction.approval_datetime ||
          auction.approval_date_time;

        return (
          hasApprovalInfo ||
          ["approved", "live", "ended", "completed", "closed"].includes(
            currentStatus
          )
        );
      });
    }

    setAuctions(auctionData);
    setFilteredAuctions(auctionData);
    setSelectedAuctions([]);
    setCurrentPage(1);

  } catch (err) {
    console.error("Auction fetch error:", err);
    console.error("Response:", err.response?.data);

    setError(
      err.response?.data?.detail ||
      "Unable to load auctions."
    );
  } finally {
    setLoading(false);
  }
};

  /* =========================================================
     SEARCH + FILTERS
  ========================================================= */

  useEffect(() => {
    const search = searchTerm.trim().toLowerCase();

    const filtered = auctions.filter((auction) => {
      const product = auction.product_title || "";
      const brand = auction.brand_model || "";
      const category = auction.category || "";

      const seller =
        auction.created_by_user?.fullname ||
        auction.seller_name ||
        "";

      const city =
        auction.location_city ||
        auction.city ||
        "";

      const approvedBy =
        auction.approved_by_name ||
        auction.approved_by ||
        "";

      const rejectedBy =
        auction.rejected_by_name ||
        auction.rejected_by ||
        "";

      const rejectionReason =
        auction.rejection_reason ||
        auction.reject_reason ||
        "";

      const matchesSearch =
        !search ||
        product.toLowerCase().includes(search) ||
        brand.toLowerCase().includes(search) ||
        category.toLowerCase().includes(search) ||
        seller.toLowerCase().includes(search) ||
        city.toLowerCase().includes(search) ||
        String(approvedBy).toLowerCase().includes(search) ||
        String(rejectedBy).toLowerCase().includes(search) ||
        rejectionReason.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all" ||
        (auction.status || "").toLowerCase() ===
          statusFilter.toLowerCase();

      const matchesCategory =
        categoryFilter === "all" || category === categoryFilter;

      const bidderName =
        auction.highest_bidder_name ||
        auction.bidder_name ||
        auction.current_bidder_name ||
        "";

      const winnerName =
        auction.winner_name || auction.winning_bidder_name || "";

      const highestBid = Number(
        auction.highest_bid ||
        auction.current_bid ||
        auction.current_highest_bid ||
        0
      );

      const matchesCondition = usesUserNameAndDateFilters
        ? sellerFilter === "all" || seller === sellerFilter
        : isPendingPage
        ? true // Condition dropdown is replaced by date range on Pending
        : conditionFilter === "all" || auction.condition === conditionFilter;

      let matchesDateRange = true;

      if (isPendingPage && (dateFromFilter || dateToFilter)) {
        const auctionDate = auction.auction_start
          ? new Date(auction.auction_start)
          : null;

        if (!auctionDate || isNaN(auctionDate.getTime())) {
          matchesDateRange = false;
        } else {
          const dateOnly = auctionDate.toISOString().split("T")[0];
          if (dateFromFilter && dateOnly < dateFromFilter) matchesDateRange = false;
          if (dateToFilter && dateOnly > dateToFilter) matchesDateRange = false;
        }
      }

      let matchesBid = true;

      if (bidMinFilter || bidMaxFilter) {
        const min = bidMinFilter ? Number(bidMinFilter) : -Infinity;
        const max = bidMaxFilter ? Number(bidMaxFilter) : Infinity;
        matchesBid = highestBid >= min && highestBid <= max;
      }

      const nameQuery = sellerBidderFilter.trim().toLowerCase();
      const matchesSellerBidder =
        !nameQuery ||
        seller.toLowerCase().includes(nameQuery) ||
        bidderName.toLowerCase().includes(nameQuery);

      const winnerQuery = winnerFilter.trim().toLowerCase();
      const matchesWinner =
        !winnerQuery || winnerName.toLowerCase().includes(winnerQuery);

      let matchesLocation = true;

      if (usesUserNameAndDateFilters) {
        if (dateFilter) {
          const relevantRawDate = isRejectedPage
            ? getRejectedAt(auction)
            : getApprovedAt(auction);

          const parsedDate = relevantRawDate
            ? new Date(relevantRawDate)
            : null;

          matchesLocation =
            !!parsedDate &&
            !isNaN(parsedDate.getTime()) &&
            parsedDate.toISOString().split("T")[0] === dateFilter;
        }
      } else {
        matchesLocation =
          locationFilter === "all" || city === locationFilter;
      }

      let matchesPrice = true;

      if (priceFilter !== "all") {
        const [min, max] = priceFilter.split("-").map(Number);
        const price = Number(
          auction.starting_price || auction.price || 0
        );
        matchesPrice = price >= min && price <= max;
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesCondition &&
        matchesLocation &&
        matchesPrice &&
        matchesDateRange &&
        matchesBid &&
        matchesSellerBidder &&
        matchesWinner
      );
    });

    setFilteredAuctions(filtered);
    setCurrentPage(1);
  }, [
    searchTerm,
    auctions,
    statusFilter,
    categoryFilter,
    conditionFilter,
    locationFilter,
    priceFilter,
    sellerFilter,
    dateFilter,
    usesUserNameAndDateFilters,
    isRejectedPage,
     isPendingPage,
    dateFromFilter,
    dateToFilter,
    bidMinFilter,
    bidMaxFilter,
    sellerBidderFilter,
    winnerFilter,
  ]);

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const handleView = (auction) => {
    navigate(`/admin/dashboard/auctions/${auction.id}`, {
      state: { auction },
    });
  };

  const handleViewLiveBidding = (auction) => {
  navigate(`/admin/dashboard/auctions/${auction.id}/live-bidding`, {
    state: { auction },
  });
};


    /* =========================================================
     APPROVE AUCTION
  ========================================================= */

  const handleApprove = (auction) => {
  const trust = getTrust(auction);

  // high risk -> show the risk report and ask again
  if (trust && trust.level === "high") {
    setTrustModal({ auction, mode: "approve" });
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to approve "${auction.product_title}"?`
  );
  if (!confirmed) return;

  approveAuction(auction);
};

const approveAuction = async (auction) => {
  try {
    const response = await adminApi.put(
  `/admin/auctions/${auction.id}/approve`
);
    if (!response.ok) throw new Error("Failed to approve auction");

    alert("Auction approved successfully.");
    fetchAuctions();
  } catch (err) {
    console.error("Approve auction error:", err);
    alert("Unable to approve auction.");
  }
};


  /* =========================================================
     REJECT AUCTION
  ========================================================= */

  const handleReject = async (auction) => {
    const reason = window.prompt(
      `Enter rejection reason for "${auction.product_title}":`
    );

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }

    try {
     const response = await adminApi.put(
  `/admin/auctions/${auction.id}/reject`,
  {
    rejection_reason: reason.trim(),
  }
);

      if (!response.ok) {
        throw new Error("Failed to reject auction");
      }

      alert("Auction rejected successfully.");

      fetchAuctions();
    } catch (err) {
      console.error("Reject auction error:", err);
      alert("Unable to reject auction.");
    }
  };

  /* =========================================================
     UPDATE AUCTION
  ========================================================= */

  const handleUpdate = (auction) => {
    navigate(
      `/admin/dashboard/auctions/${auction.id}/update`,
      {
        state: { auction },
      }
    );
  };

  /* =========================================================
     DELETE AUCTION
  ========================================================= */

  const handleDelete = async (auction) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${
        auction.product_title || "this auction"
      }"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await adminApi.delete(
  `/admin/auctions/${auction.id}`
);

      if (!response.ok) {
        throw new Error("Failed to delete auction");
      }

      setAuctions((prev) =>
        prev.filter((item) => item.id !== auction.id)
      );

      setFilteredAuctions((prev) =>
        prev.filter((item) => item.id !== auction.id)
      );

      setSelectedAuctions((prev) =>
        prev.filter((id) => id !== auction.id)
      );

      alert("Auction deleted successfully.");
    } catch (err) {
      console.error("Delete auction error:", err);

      alert(
        "Unable to delete auction. Please check your backend API."
      );
    }
  };

  /* =========================================================
     CHECKBOX SELECTION
  ========================================================= */

  const handleSelectAuction = (auctionId) => {
    setSelectedAuctions((prev) => {
      if (prev.includes(auctionId)) {
        return prev.filter((id) => id !== auctionId);
      }

      return [...prev, auctionId];
    });
  };

  /* =========================================================
     SELECT / DESELECT ALL CURRENT PAGE
  ========================================================= */

  const handleSelectAll = () => {
    const currentIds = currentAuctions
      .map((auction) => auction.id)
      .filter(Boolean);

    const allSelected =
      currentIds.length > 0 &&
      currentIds.every((id) =>
        selectedAuctions.includes(id)
      );

    if (allSelected) {
      setSelectedAuctions((prev) =>
        prev.filter((id) => !currentIds.includes(id))
      );
    } else {
      setSelectedAuctions((prev) => [
        ...new Set([...prev, ...currentIds]),
      ]);
    }
  };

  /* =========================================================
     DATE FORMAT
  ========================================================= */

  const formatAuctionDate = (date) => {
    if (!date) {
      return "N/A";
    }

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAuctionTime = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* =========================================================
     APPROVAL / REJECTION HELPERS
  ========================================================= */

  const getApprovedBy = (auction) => {
  const approvedBy =
    auction.approved_by_name ||
    auction.approved_by ||
    auction.approver_name ||
    auction.approvedBy ||
    "";

  const value = String(approvedBy).toLowerCase().trim();

  // Admin approval
  if (
    value === "admin" ||
    value === "administrator" ||
    value.includes("admin")
  ) {
    return "Admin";
  }

  // Automatic/System approval
  if (
    value === "automatic" ||
    value === "auto" ||
    value === "system" ||
    value === "automatic approval"
  ) {
    return "System";
  }

  // No approval source received from backend
  return "N/A";
};

  const getApprovedAt = (auction) => {
    return (
      auction.approved_at ||
      auction.approval_date ||
      auction.approval_datetime ||
      auction.approval_date_time ||
      null
    );
  };

  const getRejectedBy = (auction) => {
    return (
      auction.rejected_by_name ||
      auction.rejected_by ||
      auction.rejector_name ||
      auction.rejectedBy ||
      "Automatic"
    );
  };

  const getRejectedAt = (auction) => {
  return (
    auction.rejected_at ||
    auction.rejection_date ||
    auction.rejection_datetime ||
    auction.rejection_date_time ||
    auction.rejectedAt ||
    auction.rejected_date ||
    auction.rejected_datetime ||
    null
  );
};

  const getRejectionReason = (auction) => {
    return (
      auction.rejection_reason ||
      auction.reject_reason ||
      auction.reason ||
      "No reason provided"
    );
  };

  const getHighestBid = (auction) => {
    const bid =
      auction.highest_bid ||
      auction.current_bid ||
      auction.current_highest_bid ||
      0;

    return `₹${Number(bid).toLocaleString("en-IN")}`;
  };

  const getBidderName = (auction) => {
    return (
      auction.highest_bidder_name ||
      auction.bidder_name ||
      auction.current_bidder_name ||
      "No bids yet"
    );
  };

  const getWinnerName = (auction) => {
    return (
      auction.winner_name ||
      auction.winning_bidder_name ||
      "Not decided yet"
    );
  }

  const getPaymentStatus = (auction) => {
    return (
      auction.payment_status ||
      auction.paymentStatus ||
      "Pending"
    );
  };

  const getPaymentType = (auction) => {
    return (
      auction.payment_type ||
      auction.paymentType ||
      auction.payment_method ||
      "N/A"
    );
  };

  /* =========================================================
     AUCTION IMAGE
  ========================================================= */

  const getAuctionImage = (auction) => {
    if (
      auction.images &&
      auction.images.length > 0 &&
      auction.images[0]?.image_path
    ) {
      const imagePath = auction.images[0].image_path;

      if (imagePath.startsWith("http")) {
        return imagePath;
      }

      if (imagePath.startsWith("/")) {
        return `${API_URL}${imagePath}`;
      }

      return `${API_URL}/${imagePath}`;
    }

    return null;
  };

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.ceil(
    filteredAuctions.length / rowsPerPage
  );

  const startIndex =
    (currentPage - 1) * rowsPerPage;

  const currentAuctions = filteredAuctions.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) {
      return;
    }

    setCurrentPage(page);
  };

  /* =========================================================
     STATUS CHECKS
  ========================================================= */


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="admin-auction-page">
        <div className="auction-page-header">
          <div className="auction-heading">
            <h1>{title}</h1>
            <p>
              Manage and monitor all submitted auctions.
            </p>
          </div>
        </div>

        <div className="auction-table-card">
          <div className="auction-loading">
            <div className="auction-spinner"></div>
            <span>Loading auctions...</span>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <div className="admin-auction-page">
        <div className="auction-page-header">
          <div className="auction-heading">
            <h1>{title}</h1>
            <p>
              Manage and monitor all submitted auctions.
            </p>
          </div>
        </div>

        <div className="auction-table-card">
          <div className="auction-error">
            <FaBoxOpen />

            <h3>Unable to Load Auctions</h3>

            <p>{error}</p>

            <button
              className="auction-retry-btn"
              onClick={fetchAuctions}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN PAGE
  ========================================================= */

  return (
    <div className="admin-auction-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="auction-page-header">
        <div className="auction-heading">
          <h1>{title}</h1>

          <p>
            Manage and monitor all submitted auctions.
          </p>
        </div>
      </div>

      {/* =====================================================
          FILTER PANEL
      ===================================================== */}

      <div className="auction-filter-panel">

        <div className="filter-panel-header">

          <div className="filter-panel-title">
            <span className="filter-panel-icon">
              <FaFilter />
            </span>

            <div>
              <h2>Find Your Auction</h2>
              <p>
                Refine auctions by status, category, condition,
                price or location
              </p>
            </div>
          </div>

          <span className="active-filter-badge">
            <span className="active-filter-dot"></span>
            {activeFilterCount} Active Filter
            {activeFilterCount !== 1 ? "s" : ""}
          </span>

        </div>

        <div className="filter-panel-row">

          <div className="filter-field filter-search-field">
            <label>Search</label>

            <div className="auction-search">
              <FaSearch />

              <input
                type="text"
                placeholder="Search title, brand or seller..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
              />
            </div>
          </div>

          {status.toLowerCase() === "all" && (
            <CustomSelect
              label="Auction Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: "All Status", value: "all" },
                { label: "Pending", value: "pending" },
                { label: "Approved", value: "approved" },
                { label: "Rejected", value: "rejected" },
                { label: "Live", value: "live" },
              ]}
            />
          )}

          <CustomSelect
            label="Category"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { label: "All Categories", value: "all" },
              ...uniqueCategories.map((c) => ({ label: c, value: c })),
            ]}
          />

          {isLivePage && (
            <div className="filter-field">
              <label>Bid Amount</label>
              <div className="filter-range-inputs">
                <input
                  type="number"
                  className="filter-date-input"
                  placeholder="Min"
                  value={bidMinFilter}
                  onChange={(e) => setBidMinFilter(e.target.value)}
                />
                <span>to</span>
                <input
                  type="number"
                  className="filter-date-input"
                  placeholder="Max"
                  value={bidMaxFilter}
                  onChange={(e) => setBidMaxFilter(e.target.value)}
                />
              </div>
            </div>
          )}

        </div>

        {isLivePage && (
          <div className="filter-panel-row">

            <div className="filter-field">
              <label>Seller / Bidder Name</label>
              <input
                type="text"
                className="filter-date-input"
                placeholder="Search seller or bidder..."
                value={sellerBidderFilter}
                onChange={(e) => setSellerBidderFilter(e.target.value)}
              />
            </div>

            <div className="filter-field">
              <label>Winner Name</label>
              <input
                type="text"
                className="filter-date-input"
                placeholder="Search winner..."
                value={winnerFilter}
                onChange={(e) => setWinnerFilter(e.target.value)}
              />
            </div>

          </div>
        )}

        <div className="filter-panel-row">

          {usesUserNameAndDateFilters ? (
              <CustomSelect
                label="Seller Name"
                value={sellerFilter}
                onChange={setSellerFilter}
                options={[
                  { label: "All Sellers", value: "all" },
                  ...uniqueSellers.map((s) => ({ label: s, value: s })),
                ]}
              />
            ) : isPendingPage ? (
              <div className="filter-field">
                <label>Auction Date Range</label>
                <div className="filter-range-inputs">
                  <input
                    type="date"
                    className="filter-date-input"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                  />
                  <span>to</span>
                  <input
                    type="date"
                    className="filter-date-input"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <CustomSelect
                label="Condition"
                value={conditionFilter}
                onChange={setConditionFilter}
                options={[
                  { label: "All Conditions", value: "all" },
                  ...uniqueConditions.map((c) => ({ label: c, value: c })),
                ]}
              />
            )}

          <CustomSelect
            label="Price Range"
            value={priceFilter}
            onChange={setPriceFilter}
            options={priceRanges}
          />

          {usesUserNameAndDateFilters ? (
              <div className="filter-field">
                <label>
                  {isRejectedPage ? "Rejection Date" : "Approval Date"}
                </label>
                <input
                  type="date"
                  className="filter-date-input"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
            ) : (
              <CustomSelect
                label="Location"
                value={locationFilter}
                onChange={setLocationFilter}
                options={[
                  { label: "All Locations", value: "all" },
                  ...uniqueLocations.map((l) => ({ label: l, value: l })),
                ]}
              />
            )}

        </div>

        <div className="filter-panel-footer">

          <span className="filter-showing-count">
            Showing <strong>{filteredAuctions.length}</strong> of{" "}
            <strong>{auctions.length}</strong> auctions
          </span>

          <div className="filter-panel-actions">
            <button
              type="button"
              className="clear-filters-btn"
              onClick={clearFilters}
            >
              <FaTimes /> Clear Filters
            </button>
          </div>

        </div>

      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="auction-table-card">

        <div className="auction-table-wrapper">

          <table
  className={`auction-table ${
    isApprovedPage
      ? "approved-auction-table"
      : isRejectedPage
      ? "rejected-auction-table"
      : isPendingPage
      ? "pending-auction-table"
      : ""
  }`}
>

            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead>
              <tr>

                <th className="col-checkbox">
                  <input
                    type="checkbox"
                    className="auction-checkbox"
                    checked={
                      currentAuctions.length > 0 &&
                      currentAuctions.every(
                        (auction) =>
                          selectedAuctions.includes(
                            auction.id
                          )
                      )
                    }
                    onChange={handleSelectAll}
                    aria-label="Select all auctions"
                  />
                </th>

                <th className="col-id">
                  ID
                </th>

                <th className="col-image">
                  Image
                </th>

                <th className="col-product">
                  Auction Product
                </th>

                <th className="col-seller">
                  Seller
                </th>

                <th className="col-category">
                  Category
                </th>
                {isPendingPage && <th className="col-trust">Trust Score</th>}

                {isLivePage && (
                  <>
                    <th className="col-highest-bid">Highest Bid</th>
                    <th className="col-bidder-name">Bidder Name</th>
                    <th className="col-winner-name">Winner Name</th>
                  </>
                )}

                {isCompletedPage && (
  <>
    <th className="col-winner-name">Winner Name</th>
    <th className="col-payment-status">Payment Status</th>
    <th className="col-payment-type">Payment Type</th>
  </>
)}
                <th className="col-date">
                  Date & Time
                </th>
                   
                {/* =============================================
                    APPROVED COLUMNS
                ============================================= */}

                {isApprovedPage && (
                  <>
                    <th className="col-approved-by">
                      Approved By
                    </th>

                    <th className="col-approved-date">
                      Approval Date & Time
                    </th>
                  </>
                )}

                {/* =============================================
                    REJECTED COLUMNS
                ============================================= */}

                {isRejectedPage && (
                  <>
                    <th className="col-rejected-by">
                      Rejected By
                    </th>

                    <th className="col-rejected-date">
                      Rejection Date & Time
                    </th>

                    <th className="col-rejection-reason">
                      Rejection Reason
                    </th>
                  </>
                )}

                <th className="col-action">
                  Actions
                </th>
                {isLivePage && (
  <th className="col-live-bidding">
    Live Bidding
  </th>
)}

                {status.toLowerCase() === "pending" && (
                  <th className="col-approval-actions">
                    Approval
                  </th>
                )}

                

              </tr>
            </thead>

            {/* =================================================
                TABLE BODY
            ================================================= */}

            <tbody>

              {currentAuctions.length === 0 ? (

                <tr>
                  <td
                    colSpan={
  isApprovedPage
    ? 10
    : isRejectedPage
    ? 11
    : isPendingPage
    ? 10
    : isLivePage
    ? 12
    : isCompletedPage
    ? 11
    : 8
}
                    className="auction-empty"
                  >
                    <FaBoxOpen />

                    <span>
                      No auctions found.
                    </span>
                  </td>
                </tr>

              ) : (

                currentAuctions.map((auction, index) => {

                  const sellerName =
                    auction.created_by_user?.fullname ||
                    auction.seller_name ||
                    "Unknown Seller";

                  const imageUrl =
                    getAuctionImage(auction);

                  return (
                    <tr key={auction.id}>

                      {/* CHECKBOX */}

                      <td>
                        <input
                          type="checkbox"
                          className="auction-checkbox"
                          checked={selectedAuctions.includes(
                            auction.id
                          )}
                          onChange={() =>
                            handleSelectAuction(
                              auction.id
                            )
                          }
                          aria-label={`Select auction ${auction.id}`}
                        />
                      </td>

                      {/* ID */}

                      <td className="auction-id">
                        {startIndex + index + 1}
                      </td>

                      {/* IMAGE */}

                      <td className="auction-image-cell">

                        <div className="auction-product-icon">

                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={
                                auction.product_title ||
                                "Product"
                              }
                              onClick={() =>
                                setSelectedImage(
                                  imageUrl
                                )
                              }
                              onError={(e) => {
                                e.currentTarget.style.display =
                                  "none";

                                if (
                                  e.currentTarget
                                    .nextElementSibling
                                ) {
                                  e.currentTarget.nextElementSibling.style.display =
                                    "flex";
                                }
                              }}
                            />
                          ) : null}

                          <div
                            className="auction-product-fallback"
                            style={{
                              display: imageUrl
                                ? "none"
                                : "flex",
                            }}
                          >
                            <FaBoxOpen />
                          </div>

                        </div>
                      </td>

                      {/* PRODUCT */}

                      <td className="auction-product-cell">

                        <div className="auction-product-info">

                          <div className="auction-product-text">

                            <div className="auction-product-title">
                              {auction.product_title ||
                                "Untitled Product"}
                            </div>

                            {auction.brand_model && (
                              <div className="auction-product-brand">
                                {auction.brand_model}
                              </div>
                            )}

                          </div>

                        </div>
                      </td>

                      {/* SELLER */}

                      <td>
                        <span className="auction-seller">
                          {sellerName}
                        </span>
                      </td>

                      {/* CATEGORY */}

                      <td>
                        <span className="auction-category">
                          {auction.category || "N/A"}
                        </span>
                      </td>

                      {isPendingPage && (
  <td>
    {(() => {
      const t = getTrust(auction);
      if (!t) return <span className="trust-badge trust-na">N/A</span>;
      return (
        <button
          type="button"
          className={`trust-badge trust-${t.level}`}
          onClick={() => setTrustModal({ auction, mode: "view" })}
          title="View risk details"
        >
          <FaShieldAlt /> {t.score} · {t.label}
        </button>
      );
    })()}
  </td>
)}

                      {/* HIGHEST BID / BIDDER NAME (Live page only) */}

                      {isLivePage && (
  <>
    <td className="auction-price">
      {getHighestBid(auction)}
    </td>

    <td>
      {getBidderName(auction)}
    </td>

    <td>
      {getWinnerName(auction)}
    </td>
  </>
)}

                      {isCompletedPage && (
                        <>
                          <td>{getWinnerName(auction)}</td>
                          <td>
                            <span
                              className={`payment-status-badge payment-status-${getPaymentStatus(
                                auction
                              )
                                .toLowerCase()
                                .replace(/\s+/g, "-")}`}
                            >
                              {getPaymentStatus(auction)}
                            </span>
                          </td>
                          <td>{getPaymentType(auction)}</td>
                        </>
                      )}

                      {/* AUCTION START DATE */}

                      <td className="auction-date-time">

                        <div className="auction-date">
                          {formatAuctionDate(
                            auction.auction_start
                          )}
                        </div>

                        <div className="auction-time">
                          {formatAuctionTime(
                            auction.auction_start
                          )}
                        </div>

                      </td>

                      {/* =================================================
                          APPROVED BY
                      ================================================= */}

                      {isApprovedPage && (
                        <td className="auction-approval-info">

                          <span className="approval-by">
                            {getApprovedBy(auction)}
                          </span>

                        </td>
                      )}

                      {/* =================================================
                          APPROVAL DATE & TIME
                      ================================================= */}

                      {isApprovedPage && (
                        <td className="auction-date-time approval-date-time">

                          <div className="auction-date">
                            {formatAuctionDate(
                              getApprovedAt(auction)
                            )}
                          </div>

                          <div className="auction-time">
                            {formatAuctionTime(
                              getApprovedAt(auction)
                            )}
                          </div>

                        </td>
                      )}

                      {/* =================================================
                          REJECTED BY
                      ================================================= */}

                      {isRejectedPage && (
                        <td className="auction-rejection-info">

                          <span className="rejection-by">
                            {getRejectedBy(auction)}
                          </span>

                        </td>
                      )}

                      {/* =================================================
                          REJECTION DATE & TIME
                      ================================================= */}

                      {isRejectedPage && (
                        <td className="auction-date-time rejection-date-time">

                          <div className="auction-date">
                            {formatAuctionDate(
                              getRejectedAt(auction)
                            )}
                          </div>

                          <div className="auction-time">
                            {formatAuctionTime(
                              getRejectedAt(auction)
                            )}
                          </div>

                        </td>
                      )}

                      {/* =================================================
                          REJECTION REASON
                      ================================================= */}

                      {isRejectedPage && (
                        <td className="auction-rejection-reason">

  <button
    type="button"
    className="view-rejection-reason-btn"
    onClick={() =>
      setSelectedRejectionReason(
        getRejectionReason(auction)
      )
    }
  >
    View Reason
  </button>

</td>
                      )}

                      {/* =================================================
                          ACTIONS
                      ================================================= */}

                      {/* ACTIONS */}
<td>
  <div className="auction-action-buttons">

    <button
      className="auction-action-btn auction-view-action"
      onClick={() => handleView(auction)}
      title="View Auction"
      type="button"
    >
      <FaEye />
    </button>

    <button
      className="auction-action-btn auction-update-action"
      onClick={() => handleUpdate(auction)}
      title="Update Auction"
      type="button"
    >
      <FaEdit />
    </button>

    <button
      className="auction-action-btn auction-delete-action"
      onClick={() => handleDelete(auction)}
      title="Delete Auction"
      type="button"
    >
      <FaTrash />
    </button>

  </div>
  {/* =================================================
    LIVE BIDDING ACTION
================================================= */}

</td>
{status.toLowerCase() === "live" && (
  <td className="live-bidding-action-cell">
    <button
      type="button"
      className="view-live-bidding-btn"
      onClick={() => handleViewLiveBidding(auction)}
      title="View Live Bidding"
    >
      <FaEye />
      <span>View Live Bidding</span>
    </button>
  </td>
)} 

 


{/* APPROVE / REJECT */}
{status.toLowerCase() === "pending" && (
  <td className="approval-actions-cell">
    <div className="approval-action-buttons">

      <button
        type="button"
        className="approve-auction-btn"
        onClick={() => handleApprove(auction)}
      >
        Approve
      </button>

      <button
        type="button"
        className="reject-auction-btn"
        onClick={() => handleReject(auction)}
      >
        Reject
      </button>

    </div>
  </td>
)}

                    </tr>
                  );
                })
              )}

            </tbody>

          </table>

        </div>

        {/* =====================================================
            PAGINATION
        ===================================================== */}

        {totalPages > 0 && (
          <div className="auction-pagination">

            <button
              className="pagination-arrow"
              disabled={currentPage === 1}
              onClick={() =>
                goToPage(currentPage - 1)
              }
              type="button"
            >
              <FaChevronLeft />
            </button>

            {Array.from(
              { length: totalPages },
              (_, i) => i + 1
            ).map((page) => (
              <button
                key={page}
                className={`pagination-number ${
                  currentPage === page
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  goToPage(page)
                }
                type="button"
              >
                {page}
              </button>
            ))}

            <button
              className="pagination-arrow"
              disabled={
                currentPage === totalPages
              }
              onClick={() =>
                goToPage(currentPage + 1)
              }
              type="button"
            >
              <FaChevronRight />
            </button>

          </div>
        )}

      </div>

      {/* =====================================================
          IMAGE POPUP
      ===================================================== */}

      {selectedImage && (
        <div
          className="auction-image-modal"
          onClick={() =>
            setSelectedImage(null)
          }
        >
          <div
            className="auction-image-modal-content"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="auction-image-modal-close"
              onClick={() =>
                setSelectedImage(null)
              }
              aria-label="Close image"
              type="button"
            >
              ×
            </button>

            <img
              src={selectedImage}
              alt="Auction Product"
              className="auction-image-modal-img"
            />
          </div>
        </div>
      )}

      {/* =========================================================
    REJECTION REASON MODAL
========================================================= */}

{selectedRejectionReason && (
  <div
    className="rejection-reason-modal"
    onClick={() => setSelectedRejectionReason(null)}
  >

    <div
      className="rejection-reason-modal-content"
      onClick={(e) => e.stopPropagation()}
    >

      <button
        type="button"
        className="rejection-reason-modal-close"
        onClick={() =>
          setSelectedRejectionReason(null)
        }
        aria-label="Close rejection reason"
      >
        ×
      </button>

      <div className="rejection-reason-modal-header">
        <h3>Rejection Reason</h3>
      </div>

      <div className="rejection-reason-modal-body">
        <p>
          {selectedRejectionReason}
        </p>
      </div>

      <div className="rejection-reason-modal-footer">
        <button
          type="button"
          className="rejection-reason-modal-btn"
          onClick={() =>
            setSelectedRejectionReason(null)
          }
        >
          Close
        </button>
      </div>

    </div>

  </div>
)}
{trustModal && (() => {
  const t = getTrust(trustModal.auction);
  if (!t) return null;
  const isApprove = trustModal.mode === "approve";

  return (
    <div className="trust-modal" onClick={() => setTrustModal(null)}>
      <div className="trust-modal-content" onClick={(e) => e.stopPropagation()}>

        <div className="trust-modal-header">
          <h3>Trust &amp; Risk Report</h3>
          <p>{trustModal.auction.product_title}</p>
        </div>

        <div className={`trust-score-summary trust-${t.level}`}>
          <strong>{t.score}</strong>
          <span>/ 100</span>
          <em>{t.label}</em>
        </div>

        {isApprove && (
          <p className="trust-warning">
            <FaExclamationTriangle /> This auction is flagged as high risk.
            Review the reasons below before approving.
          </p>
        )}

        <ul className="trust-reasons">
          {t.reasons.map((r, i) => (
            <li key={i} className={`trust-reason ${r.type}`}>
              <span>{r.label}</span>
              <strong>{r.points > 0 ? "+" : ""}{r.points}</strong>
            </li>
          ))}
        </ul>

        <div className="trust-modal-footer">
          <button type="button" className="trust-btn-secondary" onClick={() => setTrustModal(null)}>
            {isApprove ? "Cancel" : "Close"}
          </button>
          {isApprove && (
            <button
              type="button"
              className="trust-btn-danger"
              onClick={() => {
                const a = trustModal.auction;
                setTrustModal(null);
                approveAuction(a);
              }}
            >
              Approve anyway
            </button>
          )}
        </div>

      </div>
    </div>
  );
})()}
    </div>
  );
}

export default AdminAuctionList;
