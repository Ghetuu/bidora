import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaSearch,
  FaFilter,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaTimes,
  FaGavel,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaBan,
  FaBoxOpen,
  FaTrash,
  FaCheck,
} from "react-icons/fa";

import "../styles/AuctionHistory.css";

const API_URL = "http://127.0.0.1:8000";

/* =========================================================
   CUSTOM DROPDOWN COMPONENT
========================================================= */
const CustomDropdown = ({ label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="custom-dropdown-container" ref={dropdownRef}>
      {label && <label className="auction-history-filter-label">{label}</label>}
      <div
        className={`custom-dropdown-header ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? selectedOption.label : "Select..."}</span>
        <FaChevronDown className={`custom-dropdown-arrow ${isOpen ? "rotated" : ""}`} />
      </div>

      {isOpen && (
        <div className="custom-dropdown-menu">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                className={`custom-dropdown-item ${isSelected ? "selected" : ""}`}
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

const AuctionHistory = () => {
  const navigate = useNavigate();

  /* STATE */
  const [auctionData, setAuctionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);

  /* FILTER STATES */
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [startingMin, setStartingMin] = useState("");
  const [startingMax, setStartingMax] = useState("");

  const [finalMin, setFinalMin] = useState("");
  const [finalMax, setFinalMax] = useState("");

  const [bidMin, setBidMin] = useState("");
  const [bidMax, setBidMax] = useState("");

  const [dateType, setDateType] = useState("start");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* DELETE / SELECTION STATES */
  const [selectedAuctions, setSelectedAuctions] = useState([]);
  const [deletingAuctionId, setDeletingAuctionId] = useState(null);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const rowsPerPage = 6;

  /* FETCH AUCTION HISTORY */
  useEffect(() => {
    const fetchAuctionHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("access_token");

        if (!token) {
          setError("Please login to view auction history.");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/api/auctions/my-auctions`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch auction history.");
        }

        const data = await response.json();
        const auctions = Array.isArray(data)
          ? data
          : data.auctions || data.data || [];

        const formattedData = auctions.map((auction) => {
          let imagePath = "";

          if (auction.image) {
            imagePath = auction.image;
          } else if (
            auction.images &&
            Array.isArray(auction.images) &&
            auction.images.length > 0
          ) {
            imagePath =
              typeof auction.images[0] === "string"
                ? auction.images[0]
                : auction.images[0]?.image_path ||
                  auction.images[0]?.path ||
                  auction.images[0]?.image ||
                  "";
          }

          if (
            imagePath &&
            !imagePath.startsWith("http://") &&
            !imagePath.startsWith("https://")
          ) {
            imagePath = `${API_URL}/${imagePath.replace(/^\/+/, "")}`;
          }

          const rawStatus = auction.status || "pending";
          const formattedStatus =
            rawStatus.charAt(0).toUpperCase() +
            rawStatus.slice(1).toLowerCase();

          return {
            id: auction.id,
            image: imagePath,
            product: auction.product_title || "Untitled Auction",
            category: auction.category || "—",
            startingPrice: Number(auction.starting_price || 0),
            finalPrice: Number(auction.final_price || 0),
            bidAmount: Number(
              auction.bid_amount ||
                auction.highest_bid ||
                auction.current_bid ||
                0
            ),
            bids: Number(auction.bids || 0),
            auctionStart: auction.auction_start,
            auctionEnd: auction.auction_end,
            winner: auction.winner || "—",
            status: formattedStatus,
            date:
              auction.created_at ||
              auction.auction_start ||
              auction.purchase_date,
          };
        });

        setAuctionData(formattedData);
      } catch (err) {
        console.error("Auction history error:", err);
        setError(
          err.message || "Something went wrong while loading auction history."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAuctionHistory();
  }, []);

  /* FORMATTERS */
  const formatPrice = (price) => {
    if (!price || Number(price) === 0) return "—";
    return `₹${Number(price).toLocaleString("en-IN")}`;
  };

  const formatDateTime = (date) => {
    if (!date) return "—";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "—";
    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* FILTERED DATA */
  const filteredAuctions = useMemo(() => {
    let filtered = [...auctionData];

    if (searchTerm.trim()) {
      const searchValue = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((auction) =>
        auction.product.toLowerCase().includes(searchValue)
      );
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter(
        (auction) =>
          auction.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (startingMin !== "") {
      filtered = filtered.filter(
        (auction) => auction.startingPrice >= Number(startingMin)
      );
    }

    if (startingMax !== "") {
      filtered = filtered.filter(
        (auction) => auction.startingPrice <= Number(startingMax)
      );
    }

    if (finalMin !== "") {
      filtered = filtered.filter(
        (auction) => auction.finalPrice >= Number(finalMin)
      );
    }

    if (finalMax !== "") {
      filtered = filtered.filter(
        (auction) => auction.finalPrice <= Number(finalMax)
      );
    }

    if (bidMin !== "") {
      filtered = filtered.filter(
        (auction) => auction.bidAmount >= Number(bidMin)
      );
    }

    if (bidMax !== "") {
      filtered = filtered.filter(
        (auction) => auction.bidAmount <= Number(bidMax)
      );
    }

    if (fromDate || toDate) {
      filtered = filtered.filter((auction) => {
        const selectedDate =
          dateType === "start" ? auction.auctionStart : auction.auctionEnd;

        if (!selectedDate) return false;

        const auctionDate = new Date(selectedDate);
        if (Number.isNaN(auctionDate.getTime())) return false;

        const auctionDateOnly = new Date(
          auctionDate.getFullYear(),
          auctionDate.getMonth(),
          auctionDate.getDate()
        );

        if (fromDate) {
          const from = new Date(`${fromDate}T00:00:00`);
          if (auctionDateOnly < from) return false;
        }

        if (toDate) {
          const to = new Date(`${toDate}T23:59:59`);
          if (auctionDateOnly > to) return false;
        }

        return true;
      });
    }

    return filtered;
  }, [
    auctionData,
    searchTerm,
    statusFilter,
    startingMin,
    startingMax,
    finalMin,
    finalMax,
    bidMin,
    bidMax,
    dateType,
    fromDate,
    toDate,
  ]);

  /* PAGINATION & CLEAR */
  const totalPages = Math.ceil(filteredAuctions.length / rowsPerPage);

  const paginatedAuctions = filteredAuctions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    startingMin,
    startingMax,
    finalMin,
    finalMax,
    bidMin,
    bidMax,
    dateType,
    fromDate,
    toDate,
  ]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setStartingMin("");
    setStartingMax("");
    setFinalMin("");
    setFinalMax("");
    setBidMin("");
    setBidMax("");
    setDateType("start");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  /* HANDLERS */
  const handleSearchChange = (event) => setSearchTerm(event.target.value);
  const handleViewAuction = (auctionId) => navigate(`/dashboard/auction/${auctionId}`);

  /* SINGLE DELETE */
  const handleDeleteAuction = async (auctionId) => {
    if (!window.confirm("Are you sure you want to delete this auction?")) return;

    try {
      setDeletingAuctionId(auctionId);
      const token = localStorage.getItem("access_token");

      const response = await fetch(`${API_URL}/api/auctions/${auctionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete auction.");

      setAuctionData((prev) => prev.filter((auction) => auction.id !== auctionId));
      setSelectedAuctions((prev) => prev.filter((id) => id !== auctionId));
    } catch (err) {
      console.error("Delete auction error:", err);
      alert(err.message || "Unable to delete auction. Please try again.");
    } finally {
      setDeletingAuctionId(null);
    }
  };

  /* BULK / DELETE SELECTED FUNCTION */
  const handleDeleteSelected = async () => {
    if (selectedAuctions.length === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedAuctions.length} selected auction(s)?`
      )
    ) {
      return;
    }

    try {
      setIsDeletingBulk(true);
      const token = localStorage.getItem("access_token");

      // Execute parallel delete API calls for all selected items
      await Promise.all(
        selectedAuctions.map((id) =>
          fetch(`${API_URL}/api/auctions/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );

      // Remove deleted auctions from local state
      setAuctionData((prev) =>
        prev.filter((auction) => !selectedAuctions.includes(auction.id))
      );
      setSelectedAuctions([]);
    } catch (err) {
      console.error("Bulk delete error:", err);
      alert("Failed to delete some or all selected auctions.");
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleSelectAuction = (auctionId) => {
    setSelectedAuctions((prev) =>
      prev.includes(auctionId)
        ? prev.filter((id) => id !== auctionId)
        : [...prev, auctionId]
    );
  };

  const handleSelectAll = () => {
    const currentIds = paginatedAuctions.map((auction) => auction.id);
    const allSelected = currentIds.every((id) => selectedAuctions.includes(id));

    if (allSelected) {
      setSelectedAuctions((prev) => prev.filter((id) => !currentIds.includes(id)));
    } else {
      setSelectedAuctions((prev) => [...new Set([...prev, ...currentIds])]);
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
      case "completed":
      case "ended":
        return <FaCheckCircle />;
      case "pending":
        return <FaClock />;
      case "rejected":
        return <FaBan />;
      case "live":
        return <FaChartLine />;
      default:
        return <FaGavel />;
    }
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "approved";
      case "completed":
        return "completed";
      case "ended":
        return "ended";
      case "pending":
        return "pending";
      case "rejected":
        return "rejected";
      case "live":
        return "live";
      default:
        return "pending";
    }
  };

  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages || 1));

  const totalAuctions = auctionData.length;
  const activeAuctions = auctionData.filter(
    (auction) =>
      auction.status.toLowerCase() === "live" ||
      auction.status.toLowerCase() === "approved"
  ).length;
  const completedAuctions = auctionData.filter(
    (auction) =>
      auction.status.toLowerCase() === "completed" ||
      auction.status.toLowerCase() === "ended"
  ).length;
  const rejectedAuctions = auctionData.filter(
    (auction) => auction.status.toLowerCase() === "rejected"
  ).length;

  const statusOptions = [
    { label: "All Status", value: "All" },
    { label: "Pending", value: "Pending" },
    { label: "Approved", value: "Approved" },
    { label: "Live", value: "Live" },
    { label: "Ended", value: "Ended" },
    { label: "Completed", value: "Completed" },
    { label: "Rejected", value: "Rejected" },
  ];

  const dateTypeOptions = [
    { label: "Start Date", value: "start" },
    { label: "End Date", value: "end" },
  ];

  if (loading) {
    return (
      <div className="auction-history-page">
        <div className="auction-history-loading">
          <FaGavel className="auction-history-loading-icon" />
          <p>Loading auction history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auction-history-page">
      {error && <div className="auction-history-error">{error}</div>}

      {/* DARK FILTER CARD */}
      <div className="auction-history-filter-card">
        {/* HEADER TOP BAR WITH DELETE SELECTED BUTTON */}
        <div className="auction-history-filter-header">
          <div className="auction-history-title-group">
            <div className="auction-history-title-icon">
              <FaFilter />
            </div>
            <div>
              <h1>Filter Auctions</h1>
              <p>Find the auctions you want faster</p>
            </div>
          </div>

          <div className="auction-history-header-actions">
            {/* DELETE ALL / SELECTED BUTTON */}
            {selectedAuctions.length > 0 && (
              <button
                type="button"
                className="auction-history-delete-selected-btn"
                onClick={handleDeleteSelected}
                disabled={isDeletingBulk}
              >
                <FaTrash />
                {isDeletingBulk
                  ? "Deleting..."
                  : `Delete Selected (${selectedAuctions.length})`}
              </button>
            )}

            {/* CLEAR FILTERS BUTTON */}
            {(searchTerm ||
              statusFilter !== "All" ||
              startingMin ||
              startingMax ||
              finalMin ||
              finalMax ||
              bidMin ||
              bidMax ||
              fromDate ||
              toDate) && (
              <button
                type="button"
                className="auction-history-clear-btn"
                onClick={clearFilters}
              >
                <FaTimes />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* INPUT CONTROLS GRID */}
        <div className="auction-history-filter-grid">
          {/* SEARCH */}
          <div className="auction-history-filter-group auction-history-search-group">
            <label className="auction-history-filter-label">Search</label>
            <div className="auction-history-search">
              <FaSearch />
              <input
                type="text"
                placeholder="Search by title, brand, seller..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {/* STATUS DROPDOWN */}
          <CustomDropdown
            label="Status"
            options={statusOptions}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
          />

          {/* STARTING PRICE RANGE */}
          <div className="auction-history-filter-group">
            <label className="auction-history-filter-label">Price Range</label>
            <div className="auction-history-price-filter">
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={startingMin}
                onChange={(e) => setStartingMin(e.target.value)}
                className="auction-history-price-input"
              />
              <span>-</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={startingMax}
                onChange={(e) => setStartingMax(e.target.value)}
                className="auction-history-price-input"
              />
            </div>
          </div>

          {/* DATE RANGE */}
          <div className="auction-history-filter-group auction-history-date-group">
            <label className="auction-history-filter-label">Auction Date</label>
            <div className="auction-history-date-filter">
              <CustomDropdown
                options={dateTypeOptions}
                value={dateType}
                onChange={(val) => {
                  setDateType(val);
                  setCurrentPage(1);
                }}
              />
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="auction-history-date-input"
              />
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="auction-history-date-input"
              />
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="auction-history-filter-footer">
          <div className="auction-history-results-count">
            Showing <strong>{filteredAuctions.length}</strong> of{" "}
            <strong>{auctionData.length}</strong> auctions
          </div>

          <button type="button" className="auction-history-apply-btn">
            <FaFilter /> Apply Filters
          </button>
        </div>
      </div>

      {/* STATISTICS CARDS */}
      <div className="auction-history-statistics">
        <div className="auction-history-stat-card">
          <div className="auction-history-stat-icon total">
            <FaGavel />
          </div>
          <div className="auction-history-stat-info">
            <span>Total Auctions</span>
            <strong>{totalAuctions}</strong>
          </div>
        </div>

        <div className="auction-history-stat-card">
          <div className="auction-history-stat-icon active">
            <FaChartLine />
          </div>
          <div className="auction-history-stat-info">
            <span>Active Auctions</span>
            <strong>{activeAuctions}</strong>
          </div>
        </div>

        <div className="auction-history-stat-card">
          <div className="auction-history-stat-icon completed">
            <FaCheckCircle />
          </div>
          <div className="auction-history-stat-info">
            <span>Completed</span>
            <strong>{completedAuctions}</strong>
          </div>
        </div>

        <div className="auction-history-stat-card">
          <div className="auction-history-stat-icon rejected">
            <FaBan />
          </div>
          <div className="auction-history-stat-info">
            <span>Rejected</span>
            <strong>{rejectedAuctions}</strong>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="auction-history-table-card">
        <div className="auction-history-table-header">
          <div>
            <h2>My Auctions</h2>
            <p>
              {filteredAuctions.length} auction
              {filteredAuctions.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        {paginatedAuctions.length === 0 ? (
          <div className="auction-history-empty">
            <FaBoxOpen className="auction-history-empty-icon" />
            <h3>No Auctions Found</h3>
            <p>No auctions match your current filters.</p>
            {(searchTerm ||
              statusFilter !== "All" ||
              startingMin ||
              startingMax ||
              finalMin ||
              finalMax ||
              bidMin ||
              bidMax ||
              fromDate ||
              toDate) && (
              <button type="button" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="auction-history-table-wrapper">
            <table className="auction-history-table">
              <thead>
                <tr>
                  <th className="auction-history-col-checkbox">
                    <input
                      type="checkbox"
                      checked={
                        paginatedAuctions.length > 0 &&
                        paginatedAuctions.every((auction) =>
                          selectedAuctions.includes(auction.id)
                        )
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="auction-history-col-id">ID</th>
                  <th className="auction-history-col-image">Image</th>
                  <th className="auction-history-col-product">Product</th>
                  <th>Category</th>
                  <th>Starting Price</th>
                  <th>Final Price</th>
                  <th>Auction Start</th>
                  <th>Auction End</th>
                  <th>Bids</th>
                  <th>Winner</th>
                  <th>Status</th>
                  <th className="auction-history-col-action">Action</th>
                </tr>
              </thead>

              <tbody>
                {paginatedAuctions.map((auction) => (
                  <tr key={auction.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedAuctions.includes(auction.id)}
                        onChange={() => handleSelectAuction(auction.id)}
                      />
                    </td>

                    <td>
                      <span className="auction-history-id">#{auction.id}</span>
                    </td>

                    <td>
                      {auction.image ? (
                        <button
                          type="button"
                          className="auction-history-product-image"
                          onClick={() => setSelectedImage(auction.image)}
                        >
                          <img src={auction.image} alt={auction.product} />
                        </button>
                      ) : (
                        <div className="auction-history-product-image">
                          <FaBoxOpen />
                        </div>
                      )}
                    </td>

                    <td>
                      <div className="auction-history-product">
                        <strong>{auction.product}</strong>
                      </div>
                    </td>

                    <td>
                      <span className="auction-history-category">
                        {auction.category}
                      </span>
                    </td>

                    <td>
                      <span className="auction-history-price starting">
                        {formatPrice(auction.startingPrice)}
                      </span>
                    </td>

                    <td>
                      <span className="auction-history-price final">
                        {formatPrice(auction.finalPrice)}
                      </span>
                    </td>

                    <td>
                      <div className="auction-history-auction-time">
                        <FaClock /> {formatDateTime(auction.auctionStart)}
                      </div>
                    </td>

                    <td>
                      <div className="auction-history-auction-time">
                        <FaClock /> {formatDateTime(auction.auctionEnd)}
                      </div>
                    </td>

                    <td>{auction.bids}</td>

                    <td>{auction.winner}</td>

                    <td>
                      <span
                        className={`auction-history-status auction-history-status-${getStatusClass(
                          auction.status
                        )}`}
                      >
                        {getStatusIcon(auction.status)}
                        {auction.status}
                      </span>
                    </td>

                    <td>
                      <div className="auction-history-action-buttons">
                        <button
                          type="button"
                          className="auction-history-view-btn"
                          title="View Auction"
                          onClick={() => handleViewAuction(auction.id)}
                        >
                          <FaEye />
                        </button>

                        <button
                          type="button"
                          className="auction-history-delete-btn"
                          title="Delete Auction"
                          disabled={deletingAuctionId === auction.id}
                          onClick={() => handleDeleteAuction(auction.id)}
                        >
                          {deletingAuctionId === auction.id ? "..." : <FaTrash />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {filteredAuctions.length > rowsPerPage && (
        <div className="auction-history-pagination">
          <button
            type="button"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
          >
            <FaChevronLeft />
          </button>

          <div className="auction-history-page-numbers">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  type="button"
                  key={page}
                  className={currentPage === page ? "active" : ""}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
          >
            <FaChevronRight />
          </button>
        </div>
      )}

      {/* MODAL */}
      {selectedImage && (
        <div
          className="auction-history-image-modal"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="auction-history-image-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="auction-history-image-close"
              onClick={() => setSelectedImage(null)}
            >
              <FaTimes />
            </button>
            <img src={selectedImage} alt="Auction Preview" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionHistory;