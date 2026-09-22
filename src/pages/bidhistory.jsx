import React, { useState, useRef, useEffect } from "react";
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
  FaChevronUp,
  FaCheck
} from "react-icons/fa";
import { Link } from "react-router-dom";
import "../styles/bidhistory.css"; // Import dedicated CSS file

const BidHistory = () => {
  const [activeTab, setActiveTab] = useState("my-bids");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);

  // Custom Dropdown status options matching your design
  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "live", label: "Live Now" },
    { value: "upcoming", label: "Upcoming" },
    { value: "ended", label: "Ended" }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get currently selected option label
  const selectedLabel = statusOptions.find(opt => opt.value === statusFilter)?.label || "All Status";

  // Sample data matching UI design
  const bidsData = [
    {
      id: "1",
      title: "Vintage Rolex Submariner (1988)",
      category: "Watches",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=60",
      seller: "Chronos Vault",
      currentHigh: "$4,200",
      myMaxBid: "$4,200",
      timeLeft: "2h 15m",
      status: "Highest Bidder",
      action: "View"
    },
    {
      id: "2",
      title: "Apple Macintosh Classic 1990 (Functional)",
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=100&auto=format&fit=crop&q=60",
      seller: "RetroTech_NY",
      currentHigh: "$850",
      myMaxBid: "$780",
      timeLeft: "45m",
      status: "Outbid",
      action: "Raise Bid"
    },
    {
      id: "3",
      title: "Limited Edition Leica M6 Camera",
      category: "Photography",
      image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100&auto=format&fit=crop&q=60",
      seller: "OpticsLab",
      currentHigh: "$3,100",
      myMaxBid: "$3,100",
      timeLeft: "Ended yesterday",
      status: "Won Auction",
      action: "View"
    }
  ];

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  return (
    <div className="bh-wrapper">
      {/* Top Metric Cards */}
      <div className="bh-metrics-grid">
        
        {/* Card 1 */}
        <div className="bh-metric-card">
          <div>
            <p className="bh-metric-label">Bids Placed (Buying)</p>
            <div className="bh-metric-value-box">
              <span className="bh-metric-number">3</span>
              <span className="bh-metric-subtext-success">↑ 2 active</span>
            </div>
          </div>
          <div className="bh-metric-icon bh-icon-blue">
            <FaHandHoldingUsd />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bh-metric-card bh-warning">
          <div>
            <p className="bh-metric-label">Outbid Items</p>
            <div className="bh-metric-value-box">
              <span className="bh-metric-number">1</span>
              <span className="bh-metric-subtext-warning">Needs action</span>
            </div>
          </div>
          <div className="bh-metric-icon bh-icon-amber">
            <FaExclamationTriangle />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bh-metric-card">
          <div>
            <p className="bh-metric-label">Bids Received (Selling)</p>
            <div className="bh-metric-value-box">
              <span className="bh-metric-number">38</span>
              <span className="bh-metric-subtext-success">Across 4 listings</span>
            </div>
          </div>
          <div className="bh-metric-icon bh-icon-purple">
            <FaReceipt />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bh-metric-card">
          <div>
            <p className="bh-metric-label">Highest Incoming Offer</p>
            <div className="bh-metric-value-box">
              <span className="bh-metric-number" style={{ color: "#16a34a" }}>$3,450</span>
            </div>
          </div>
          <div className="bh-metric-icon bh-icon-green">
            <FaChartLine />
          </div>
        </div>

      </div>

      {/* Main Container */}
      <div className="bh-container">
        
        {/* Controls Bar */}
        <div className="bh-controls-bar">
          
          {/* Tabs */}
          <div className="bh-tabs-group">
            <button
              onClick={() => setActiveTab("my-bids")}
              className={`bh-tab-btn ${activeTab === "my-bids" ? "bh-active" : ""}`}
            >
              <FaExternalLinkAlt style={{ fontSize: "0.75rem" }} />
              <span>My Bids Placed</span>
              <span className={activeTab === "my-bids" ? "bh-badge-active" : "bh-badge-inactive"}>3</span>
            </button>

            <button
              onClick={() => setActiveTab("bids-received")}
              className={`bh-tab-btn ${activeTab === "bids-received" ? "bh-active" : ""}`}
            >
              <span>Bids Received</span>
              <span className={activeTab === "bids-received" ? "bh-badge-active" : "bh-badge-inactive"}>3</span>
            </button>

            <button
              onClick={() => setActiveTab("activity-feed")}
              className={`bh-tab-btn ${activeTab === "activity-feed" ? "bh-active" : ""}`}
            >
              <span>Unified Activity Feed</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="bh-filter-actions">
            <div className="bh-search-box">
              <FaSearch className="bh-search-icon" />
              <input
                type="text"
                placeholder="Search item title or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bh-input-search"
              />
            </div>

            {/* Light Theme Custom Status Dropdown */}
            <div className="bh-custom-dropdown" ref={dropdownRef}>
              <button
                type="button"
                className={`bh-dropdown-btn ${isDropdownOpen ? "bh-open" : ""}`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="bh-dropdown-selected">
                  <FaClock className="bh-dropdown-main-icon" />
                  <span>{selectedLabel}</span>
                </div>
                {isDropdownOpen ? (
                  <FaChevronUp className="bh-dropdown-arrow" />
                ) : (
                  <FaChevronDown className="bh-dropdown-arrow" />
                )}
              </button>

              {isDropdownOpen && (
                <div className="bh-dropdown-menu">
                  {statusOptions.map((option) => {
                    const isSelected = statusFilter === option.value;
                    return (
                      <div
                        key={option.value}
                        className={`bh-dropdown-item ${isSelected ? "bh-selected" : ""}`}
                        onClick={() => {
                          setStatusFilter(option.value);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <div className={`bh-radio-circle ${isSelected ? "bh-checked" : ""}`}>
                          {isSelected && <FaCheck className="bh-check-icon" />}
                        </div>
                        <span className="bh-item-label">{option.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button 
              className="bh-btn-reset"
              title="Reset Filters"
              onClick={handleResetFilters}
            >
              <FaRedo />
            </button>
          </div>

        </div>

        {/* Table View */}
        <div className="bh-table-responsive">
          <table className="bh-table">
            <thead>
              <tr>
                <th>Auction Item</th>
                <th>Seller</th>
                <th>Current High</th>
                <th>My Max Bid</th>
                <th>Time Left</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bidsData.map((item) => (
                <tr key={item.id}>
                  
                  {/* Auction Item */}
                  <td>
                    <div className="bh-item-cell">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="bh-item-img"
                      />
                      <div>
                        <p className="bh-item-title">{item.title}</p>
                        <p className="bh-item-category">{item.category}</p>
                      </div>
                    </div>
                  </td>

                  {/* Seller */}
                  <td className="bh-seller-name">
                    {item.seller}
                  </td>

                  {/* Current High */}
                  <td className="bh-amount-highlight">
                    {item.currentHigh}
                  </td>

                  {/* My Max Bid */}
                  <td className="bh-amount-subtle">
                    {item.myMaxBid}
                  </td>

                  {/* Time Left */}
                  <td>
                    <div className="bh-time-cell">
                      <FaClock style={{ fontSize: "0.75rem" }} />
                      <span>{item.timeLeft}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    {item.status === "Highest Bidder" && (
                      <span className="bh-status-pill bh-status-highest">
                        <span className="bh-dot-green"></span>
                        <span>Highest Bidder</span>
                      </span>
                    )}

                    {item.status === "Outbid" && (
                      <span className="bh-status-pill bh-status-outbid">
                        <FaArrowDown style={{ fontSize: "0.625rem" }} />
                        <span>Outbid</span>
                      </span>
                    )}

                    {item.status === "Won Auction" && (
                      <span className="bh-status-pill bh-status-won">
                        <FaTrophy style={{ fontSize: "0.75rem" }} />
                        <span>Won Auction</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: "right" }}>
                    {item.action === "Raise Bid" ? (
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
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default BidHistory;