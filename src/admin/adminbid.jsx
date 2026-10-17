import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import adminApi from "../api/adminApi";
import "../styles/adminbid.css";

import {
  FaGavel,
  FaUsers,
  FaChartLine,
  FaRupeeSign,
  FaSearch,
  FaSyncAlt,
  FaDownload,
  FaEye,
  FaTimes,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaHistory,
  FaUser,
  FaCar,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

const PAGE_SIZE = 10;

// Backend base URL for resolving relative image paths.
const API_BASE_URL = "http://127.0.0.1:8000";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
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

const getBidId = (bid) =>
  bid.bid_id ?? bid.id ?? bid.bidId ?? "—";

const getAuctionTitle = (bid) =>
  bid.auction_title ??
  bid.auction?.productTitle ??
  bid.auction?.title ??
  bid.product_title ??
  "Auction";

const getBidderName = (bid) =>
  bid.bidder_name ??
  bid.bidder?.fullname ??
  bid.bidder?.username ??
  bid.bidder ??
  "Unknown bidder";

const getBidAmount = (bid) =>
  Number(bid.bid_amount ?? bid.amount ?? 0);

const getBidDate = (bid) =>
  bid.created_at ?? bid.bid_date ?? bid.bid_time ?? null;

const getAuctionId = (bid) =>
  bid.auction_id ?? bid.auction?.id ?? "—";

// =====================================================
// GET AUCTION IMAGE
// Supports the AuctionImage model's image_path field.
// =====================================================


const getAuctionImage = (bid) => {
  if (!bid) return null;

  const auction = bid.auction ?? {};

  // Images may be returned directly or inside the auction object.
  const images =
    auction.images ??
    bid.auction_images ??
    bid.images ??
    [];

  // Prefer the first auction image, ordered by display_order
  // if the backend already returns images in that order.
  const firstImage = Array.isArray(images)
    ? images[0]
    : null;

  const imagePath =
    firstImage?.image_path ??
    firstImage?.url ??
    firstImage?.image_url ??
    bid.image_path ??
    bid.image_url ??
    bid.product_image ??
    bid.auction_image ??
    auction.image_path ??
    auction.image_url ??
    auction.product_image ??
    auction.image ??
    null;

  if (!imagePath || typeof imagePath !== "string") {
    return null;
  }

  const path = imagePath.trim();

  if (!path) return null;

  // Full URLs and data URLs should be used as they are.
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }

  // Normalize Windows path separators.
  const normalizedPath = path.replace(/\\/g, "/");

  // Avoid duplicating the backend URL.
  return `${API_BASE_URL}/${normalizedPath.replace(/^\/+/, "")}`;
};

const getStatus = (bid) => {
  const status = String(
    bid.status ?? bid.bid_status ?? ""
  ).toLowerCase();

  if (status === "rejected") return "Rejected";

  if (
    status === "winning" ||
    status === "won" ||
    status === "won auction"
  ) {
    return "Winning";
  }

  if (
    status === "outbid" ||
    status === "replaced"
  ) {
    return "Outbid";
  }

  if (
    status === "ended" ||
    status === "auction ended"
  ) {
    return "Auction Ended";
  }

  if (
    status === "active" ||
    status === "leading" ||
    bid.is_highest === true
  ) {
    return "Leading";
  }

  if (bid.auction_status === "ended") {
    return "Auction Ended";
  }

  return "Active";
};

const getRisk = (bid) => {
  if (bid.risk_level) {
    return String(bid.risk_level);
  }

  if (bid.is_suspicious === true) {
    return "Review Required";
  }

  return "Normal";
};

// =====================================================
// FILTER DROPDOWN (styled popup with highlighted
// selected option and checkmark)
// =====================================================

function FilterSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", close);

    return () => document.removeEventListener("mousedown", close);
  }, []);

  const selected = options.find(
    (o) => String(o.value) === String(value)
  );

  return (
    <div
      className={`abf-select${open ? " open" : ""}`}
      ref={wrapRef}
    >
      <button
        type="button"
        className="abf-trigger"
        onClick={() => setOpen((o) => !o)}
      >
        <span>{selected ? selected.label : ""}</span>

        <svg
          width="11"
          height="7"
          viewBox="0 0 11 7"
          fill="none"
        >
          <path
            d="M1 1L5.5 5.5L10 1"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="abf-menu">
          {options.map((o) => {
            const isSelected =
              String(o.value) === String(value);

            return (
              <div
                key={o.value}
                className={`abf-option${
                  isSelected ? " selected" : ""
                }`}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                <span>{o.label}</span>

                {isSelected && (
                  <svg
                    width="13"
                    height="10"
                    viewBox="0 0 13 10"
                    fill="none"
                  >
                    <path
                      d="M1 5L4.5 8.5L12 1"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminBids() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [auctionFilter, setAuctionFilter] = useState("all");
  const [bidderFilter, setBidderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBid, setSelectedBid] = useState(null);

  // Tracks images that failed to load so the fallback can be shown.
  const [failedImages, setFailedImages] = useState({});

  // =====================================================
  // FETCH BIDS FROM BACKEND
  // Expected endpoint: GET /admin/bids
  // =====================================================

  const fetchBids = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await adminApi.get("/admin/bids");

      const responseData = response.data;

      // Support either an array or a paginated response.
      const records = Array.isArray(responseData)
        ? responseData
        : responseData?.bids ??
          responseData?.items ??
          responseData?.data ??
          [];

      if (!Array.isArray(records)) {
        throw new Error(
          "The backend returned an invalid bids response."
        );
      }

      setBids(records);

      // Reset image failures when fresh records are loaded.
      setFailedImages({});
    } catch (err) {
      console.error("FETCH ADMIN BIDS ERROR:", err);

      setError(
        err.response?.data?.detail ||
          err.message ||
          "Unable to load bids. Please check the backend API."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  // =====================================================
  // FILTER OPTIONS
  // =====================================================

  const auctionOptions = useMemo(() => {
    const options = new Map();

    bids.forEach((bid) => {
      const id = getAuctionId(bid);

      if (id !== "—") {
        options.set(String(id), getAuctionTitle(bid));
      }
    });

    return Array.from(options, ([id, title]) => ({
      id,
      title,
    }));
  }, [bids]);

  const bidderOptions = useMemo(() => {
    const options = new Map();

    bids.forEach((bid) => {
      const id =
        bid.bidder_id ??
        bid.bidder?.id ??
        getBidderName(bid);

      options.set(String(id), getBidderName(bid));
    });

    return Array.from(options, ([id, name]) => ({
      id,
      name,
    }));
  }, [bids]);

  // =====================================================
  // FILTER AND SORT BIDS
  // =====================================================

  const filteredBids = useMemo(() => {
    let result = [...bids];

    const searchValue = search.trim().toLowerCase();

    if (searchValue) {
      result = result.filter((bid) => {
        const searchableValues = [
          getBidId(bid),
          getAuctionTitle(bid),
          getBidderName(bid),
          getAuctionId(bid),
          bid.bidder_id,
        ];

        return searchableValues.some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(searchValue)
        );
      });
    }

    if (auctionFilter !== "all") {
      result = result.filter(
        (bid) =>
          String(getAuctionId(bid)) === auctionFilter
      );
    }

    if (bidderFilter !== "all") {
      result = result.filter((bid) => {
        const bidderId =
          bid.bidder_id ??
          bid.bidder?.id ??
          getBidderName(bid);

        return String(bidderId) === bidderFilter;
      });
    }

    if (statusFilter !== "all") {
      result = result.filter(
        (bid) =>
          getStatus(bid).toLowerCase() === statusFilter
      );
    }

    result.sort((a, b) => {
      if (sortBy === "highest") {
        return getBidAmount(b) - getBidAmount(a);
      }

      if (sortBy === "lowest") {
        return getBidAmount(a) - getBidAmount(b);
      }

      const dateA = new Date(getBidDate(a) || 0).getTime();
      const dateB = new Date(getBidDate(b) || 0).getTime();

      return sortBy === "oldest"
        ? dateA - dateB
        : dateB - dateA;
    });

    return result;
  }, [
    bids,
    search,
    auctionFilter,
    bidderFilter,
    statusFilter,
    sortBy,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    auctionFilter,
    bidderFilter,
    statusFilter,
    sortBy,
  ]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const statistics = useMemo(() => {
    const uniqueBidders = new Set(
      bids.map(
        (bid) =>
          bid.bidder_id ??
          bid.bidder?.id ??
          getBidderName(bid)
      )
    );

    const activeAuctions = new Set(
      bids
        .filter(
          (bid) =>
            !["ended", "completed", "rejected"].includes(
              String(bid.auction_status ?? "").toLowerCase()
            )
        )
        .map(getAuctionId)
        .filter((id) => id !== "—")
    );

    const totalBidValue = bids.reduce(
      (total, bid) => total + getBidAmount(bid),
      0
    );

    return {
      totalBids: bids.length,
      activeAuctions: activeAuctions.size,
      uniqueBidders: uniqueBidders.size,
      totalBidValue,
    };
  }, [bids]);

  // =====================================================
  // PAGINATION
  // =====================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBids.length / PAGE_SIZE)
  );

  const safePage = Math.min(currentPage, totalPages);

  const paginatedBids = filteredBids.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // =====================================================
  // EXPORT CSV
  // =====================================================

  const exportCSV = () => {
    const headers = [
      "Bid ID",
      "Auction",
      "Auction ID",
      "Bidder",
      "Bidder ID",
      "Bid Amount",
      "Date & Time",
      "Status",
      "Risk",
    ];

    const rows = filteredBids.map((bid) => [
      getBidId(bid),
      getAuctionTitle(bid),
      getAuctionId(bid),
      getBidderName(bid),
      bid.bidder_id ?? "",
      getBidAmount(bid),
      getBidDate(bid) ?? "",
      getStatus(bid),
      getRisk(bid),
    ]);

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "bidora-bids.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="admin-bids-page">

      <div className="ab-page-header">
        <div>
          <h1>
            <FaGavel />
            Bids Management
          </h1>

          <p>
            Monitor and manage all bidding activities
            across auctions.
          </p>
        </div>

        <div className="ab-header-actions">
          <button
            className="ab-button ab-button-light"
            onClick={fetchBids}
            disabled={loading}
          >
            <FaSyncAlt />
            Refresh
          </button>

          <button
            className="ab-button ab-button-primary"
            onClick={exportCSV}
            disabled={!filteredBids.length}
          >
            <FaDownload />
            Export CSV
          </button>
        </div>
      </div>

      {/* STATISTICS */}

      <section className="ab-stats-grid">

        <div className="ab-stat-card">
          <div className="ab-stat-icon blue">
            <FaGavel />
          </div>

          <div>
            <p>Total Bids</p>
            <h2>
              {statistics.totalBids.toLocaleString("en-IN")}
            </h2>
          </div>
        </div>

        <div className="ab-stat-card">
          <div className="ab-stat-icon green">
            <FaChartLine />
          </div>

          <div>
            <p>Active Auctions</p>
            <h2>{statistics.activeAuctions}</h2>
          </div>
        </div>

        <div className="ab-stat-card">
          <div className="ab-stat-icon purple">
            <FaUsers />
          </div>

          <div>
            <p>Unique Bidders</p>
            <h2>
              {statistics.uniqueBidders.toLocaleString("en-IN")}
            </h2>
          </div>
        </div>

        <div className="ab-stat-card">
          <div className="ab-stat-icon orange">
            <FaRupeeSign />
          </div>

          <div>
            <p>Total Bid Value</p>
            <h2>
              {formatCurrency(statistics.totalBidValue)}
            </h2>
          </div>
        </div>

      </section>

      {/* SEARCH AND FILTERS */}

      <section className="ab-filter-card">

        <div className="ab-search">
          <FaSearch />

          <input
            type="text"
            placeholder="Search bid ID, auction title or bidder..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <FilterSelect
          value={auctionFilter}
          onChange={setAuctionFilter}
          options={[
            { value: "all", label: "All Auctions" },
            ...auctionOptions.map((auction) => ({
              value: auction.id,
              label: auction.title,
            })),
          ]}
        />

        <FilterSelect
          value={bidderFilter}
          onChange={setBidderFilter}
          options={[
            { value: "all", label: "All Bidders" },
            ...bidderOptions.map((bidder) => ({
              value: bidder.id,
              label: bidder.name,
            })),
          ]}
        />

        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "All Statuses" },
            { value: "leading", label: "Leading" },
            { value: "active", label: "Active" },
            { value: "outbid", label: "Outbid" },
            { value: "winning", label: "Winning" },
            { value: "rejected", label: "Rejected" },
            { value: "auction ended", label: "Auction Ended" },
          ]}
        />

        <FilterSelect
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: "newest", label: "Newest First" },
            { value: "oldest", label: "Oldest First" },
            { value: "highest", label: "Highest Bid" },
            { value: "lowest", label: "Lowest Bid" },
          ]}
        />

        <button
          className="ab-clear-button"
          onClick={() => {
            setSearch("");
            setAuctionFilter("all");
            setBidderFilter("all");
            setStatusFilter("all");
            setSortBy("newest");
          }}
        >
          Clear
        </button>

      </section>

      {/* MAIN CONTENT */}

      <div
        className={`ab-content-layout ${
          selectedBid ? "with-details" : ""
        }`}
      >

        <section className="ab-table-card">

          <div className="ab-table-header">
            <h2>
              All Bids
              <span>{filteredBids.length}</span>
            </h2>
          </div>

          {error && (
            <div className="ab-error">
              <FaExclamationTriangle />

              <div>
                <strong>Unable to load bids</strong>
                <p>{error}</p>

                <button onClick={fetchBids}>
                  Try Again
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="ab-state">
              <FaSyncAlt className="ab-spinner" />
              <p>Loading bids...</p>
            </div>
          ) : !error && paginatedBids.length === 0 ? (
            <div className="ab-state">
              <FaGavel />
              <h3>No bids found</h3>
              <p>
                Try changing your search or filters.
              </p>
            </div>
          ) : !error ? (
            <>
              <div className="ab-table-wrapper">

                <table className="ab-bids-table">

                  <thead>
                    <tr>
                      <th>Bid ID</th>
                      <th>Auction</th>
                      <th>Bidder</th>
                      <th>Bid Amount</th>
                      <th>Date & Time</th>
                      <th>Status</th>
                      <th>Risk</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedBids.map((bid, index) => {
                      const status = getStatus(bid);
                      const risk = getRisk(bid);
                      const bidKey = String(getBidId(bid));
                      const auctionImage = getAuctionImage(bid);

                      return (
                        <tr key={`${getBidId(bid)}-${index}`}>

                          <td>
                            <strong>
                              #{getBidId(bid)}
                            </strong>
                          </td>

                          {/* AUCTION WITH PRODUCT IMAGE */}

                          <td>
                            <div className="ab-auction-cell">
                              <div className="ab-auction-icon ab-product-image">
                                {auctionImage &&
                                !failedImages[bidKey] ? (
                                  <img
                                    src={auctionImage}
                                    alt={getAuctionTitle(bid)}
                                    loading="lazy"
                                    onError={() =>
                                      setFailedImages((previous) => ({
                                        ...previous,
                                        [bidKey]: true,
                                      }))
                                    }
                                  />
                                ) : (
                                  <FaCar />
                                )}
                              </div>

                              <div>
                                <strong>
                                  {getAuctionTitle(bid)}
                                </strong>

                                <small>
                                  Auction #{getAuctionId(bid)}
                                </small>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="ab-bidder-cell">
                              <div className="ab-avatar">
                                <FaUser />
                              </div>

                              <div>
                                <strong>
                                  {getBidderName(bid)}
                                </strong>

                                <small>
                                  ID: {bid.bidder_id ?? "—"}
                                </small>
                              </div>
                            </div>
                          </td>

                          <td className="ab-amount">
                            {formatCurrency(getBidAmount(bid))}
                          </td>

                          <td>
                            {formatDate(getBidDate(bid))}
                          </td>

                          <td>
                            <span
                              className={`ab-status ${status
                                .toLowerCase()
                                .replace(/\s+/g, "-")}`}
                            >
                              {status}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`ab-risk ${
                                risk.toLowerCase() === "normal"
                                  ? "normal"
                                  : "review"
                              }`}
                            >
                              {risk.toLowerCase() !== "normal" && (
                                <FaExclamationTriangle />
                              )}

                              {risk}
                            </span>
                          </td>

                          <td>
                            <button
                              className="ab-view-button"
                              onClick={() => setSelectedBid(bid)}
                            >
                              <FaEye />
                              View
                            </button>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>

                </table>

              </div>

              {/* PAGINATION */}

              <div className="ab-pagination">

                <span>
                  Showing{" "}
                  {filteredBids.length
                    ? (safePage - 1) * PAGE_SIZE + 1
                    : 0}
                  {" "}–{" "}
                  {Math.min(
                    safePage * PAGE_SIZE,
                    filteredBids.length
                  )}
                  {" "}of {filteredBids.length} bids
                </span>

                <div>
                  <button
                    disabled={safePage === 1}
                    onClick={() =>
                      setCurrentPage((page) => page - 1)
                    }
                    aria-label="Previous page"
                  >
                    <FaChevronLeft />
                  </button>

                  <span>
                    Page {safePage} of {totalPages}
                  </span>

                  <button
                    disabled={safePage >= totalPages}
                    onClick={() =>
                      setCurrentPage((page) => page + 1)
                    }
                    aria-label="Next page"
                  >
                    <FaChevronRight />
                  </button>
                </div>

              </div>
            </>
          ) : null}

        </section>

        {/* BID DETAILS PANEL */}

        {selectedBid && (
          <aside className="ab-details-panel">

            <div className="ab-details-header">
              <h2>Bid Details</h2>

              <button
                onClick={() => setSelectedBid(null)}
                aria-label="Close bid details"
              >
                <FaTimes />
              </button>
            </div>

            <div className="ab-selected-bid">
              <strong>
                #{getBidId(selectedBid)}
              </strong>

              <span
                className={`ab-status ${getStatus(selectedBid)
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                {getStatus(selectedBid)}
              </span>

              <p>
                Placed on {formatDate(getBidDate(selectedBid))}
              </p>
            </div>

            <div className="ab-detail-section">
              <h3>Auction Information</h3>

              {/* PRODUCT IMAGE IN DETAILS PANEL */}

              {getAuctionImage(selectedBid) &&
              !failedImages[`details-${getBidId(selectedBid)}`] ? (
                <img
                  className="ab-detail-product-image"
                  src={getAuctionImage(selectedBid)}
                  alt={getAuctionTitle(selectedBid)}
                  onError={() =>
                    setFailedImages((previous) => ({
                      ...previous,
                      [`details-${getBidId(selectedBid)}`]: true,
                    }))
                  }
                />
              ) : (
                <div className="ab-detail-image-placeholder">
                  <FaCar />
                  <span>Product image unavailable</span>
                </div>
              )}

              <p>
                <span>Auction Title</span>
                <strong>{getAuctionTitle(selectedBid)}</strong>
              </p>

              <p>
                <span>Auction ID</span>
                <strong>#{getAuctionId(selectedBid)}</strong>
              </p>

              <p>
                <span>Current Bid</span>
                <strong>
                  {formatCurrency(getBidAmount(selectedBid))}
                </strong>
              </p>

              <p>
                <span>Auction Status</span>
                <strong>
                  {selectedBid.auction_status ?? "—"}
                </strong>
              </p>
            </div>

            <div className="ab-detail-section">
              <h3>Bid Information</h3>

              <p>
                <span>Bid ID</span>
                <strong>#{getBidId(selectedBid)}</strong>
              </p>

              <p>
                <span>Bid Amount</span>
                <strong>
                  {formatCurrency(getBidAmount(selectedBid))}
                </strong>
              </p>

              <p>
                <span>Date & Time</span>
                <strong>
                  {formatDate(getBidDate(selectedBid))}
                </strong>
              </p>

              <p>
                <span>Risk Indicator</span>
                <strong>{getRisk(selectedBid)}</strong>
              </p>
            </div>

            <div className="ab-detail-section">
              <h3>Bidder Information</h3>

              <div className="ab-profile">
                <div className="ab-profile-icon">
                  <FaUser />
                </div>

                <div>
                  <strong>
                    {getBidderName(selectedBid)}
                  </strong>

                  <small>
                    Bidder ID: {selectedBid.bidder_id ?? "—"}
                  </small>
                </div>
              </div>

              <p>
                <span>Email</span>
                <strong>
                  {selectedBid.bidder_email ??
                    selectedBid.bidder?.email ??
                    "Not available"}
                </strong>
              </p>

              <p>
                <span>Account Status</span>
                <strong>
                  {selectedBid.bidder_status ??
                    selectedBid.bidder?.account_status ??
                    "Not available"}
                </strong>
              </p>
            </div>

            <div className="ab-detail-actions">
              <button
                onClick={() => {
                  alert(
                    "Connect this action to your auction details route."
                  );
                }}
              >
                <FaGavel />
                View Auction
              </button>

              <button
                onClick={() => {
                  alert(
                    "Connect this action to your bidder profile route."
                  );
                }}
              >
                <FaUsers />
                View Bidder
              </button>

              <button
                onClick={() => {
                  alert(
                    "Connect this action to your bid history API."
                  );
                }}
              >
                <FaHistory />
                Bid History
              </button>
            </div>

          </aside>
        )}

      </div>

    </div>
  );
}
