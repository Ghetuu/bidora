// ============================================================ 
// BIDORA ADMIN - WINNERS MANAGEMENT 
// File: src/admin/AdminWinners.jsx 
// ============================================================ 

import React, { useEffect, useMemo, useRef, useState } from "react"; 
import { 
  FaTrophy, 
  FaGavel, 
  FaRupeeSign, 
  FaSearch, 
  FaSyncAlt, 
  FaTimes, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaExclamationCircle, 
  FaChevronRight, 
  FaFilter, 
  FaTrashAlt, 
  FaBoxOpen, 
  FaUser, 
  FaEdit, 
  FaEye, 
  FaPlus, 
  FaFileDownload, 
  FaMobileAlt, 
  FaCreditCard, 
  FaUniversity, 
  FaWallet, 
  FaArrowUp, 
  FaArrowDown, 
  FaClock, 
  FaCheck, 
  FaChevronDown, 
} from "react-icons/fa"; 

import adminApi from "../api/adminApi"; 
import "../styles/adminwinners.css"; 

// Number of rows shown per page 
const PAGE_SIZE = 5; 

const formatCurrency = (value) => { 
  return new Intl.NumberFormat("en-IN", { 
    style: "currency", 
    currency: "INR", 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 2, 
  }).format(Number(value) || 0); 
}; 

const formatDate = (value) => { 
  if (!value) return "—"; 

  const date = new Date(value); 

  if (Number.isNaN(date.getTime())) return "—"; 

  return date.toLocaleDateString("en-IN", { 
    day: "2-digit", 
    month: "short", 
    year: "numeric", 
  }); 
}; 

const formatTime = (value) => { 
  if (!value) return ""; 

  const date = new Date(value); 

  if (Number.isNaN(date.getTime())) return ""; 

  return date 
    .toLocaleTimeString("en-IN", { 
      hour: "2-digit", 
      minute: "2-digit", 
      hour12: true, 
    }) 
    .toUpperCase(); 
}; 

const normalize = (value, fallback = "") => 
  String(value || fallback).toLowerCase(); 

const getInitials = (name) => 
  String(name || "W") 
    .split(" ") 
    .filter(Boolean) 
    .slice(0, 2) 
    .map((part) => part[0]) 
    .join("") 
    .toUpperCase(); 

const getRowKey = (winner) => `${winner.auction_id}-${winner.winner_id}`; 

// ========================================================== 
// FIELD HELPERS (fallbacks for optional backend fields) 
// ========================================================== 

const getPaymentStatus = (winner) => { 
  const raw = normalize(winner.payment_status || winner.payout_status); 

  if ( 
    ["paid", "disbursed", "completed", "success", "successful"].includes(raw) 
  ) { 
    return "paid"; 
  } 

  if (["failed", "failure", "declined", "rejected"].includes(raw)) { 
    return "failed"; 
  } 

  return "pending"; 
}; 

const PAYMENT_STATUS_META = { 
  paid: { label: "Paid", className: "aw-pay-paid" }, 
  pending: { label: "Pending", className: "aw-pay-pending" }, 
  failed: { label: "Failed", className: "aw-pay-failed" }, 
}; 

const getPaymentMethodMeta = (winner) => { 
  const method = String(winner.payment_method || "").trim(); 
  const key = method.toLowerCase(); 

  if (!method) return { label: "—", icon: null }; 
  if (key.includes("upi")) return { label: method, icon: <FaMobileAlt /> }; 
  if (key.includes("card")) return { label: method, icon: <FaCreditCard /> }; 
  if (key.includes("bank")) return { label: method, icon: <FaUniversity /> }; 

  return { label: method, icon: <FaWallet /> }; 
}; 

const getCategory = (winner) => 
  winner.category || winner.auction_category || "General"; 

const getProductImage = (winner) => 
  winner.product_image || winner.auction_image || winner.image_url || ""; 

const getWinnerAvatar = (winner) => 
  winner.winner_avatar || winner.avatar_url || winner.winner_image || ""; 

const getWinnerPhone = (winner) => 
  winner.winner_phone || winner.phone || winner.winner_mobile || ""; 

// ========================================================== 
// DATE HELPERS 
// ========================================================== 

const isInDateRange = (value, range) => { 
  if (range === "all") return true; 

  const date = new Date(value); 

  if (Number.isNaN(date.getTime())) return false; 

  const now = new Date(); 
  const DAY = 24 * 60 * 60 * 1000; 

  if (range === "today") return date.toDateString() === now.toDateString(); 
  if (range === "7d") return now - date >= 0 && now - date <= 7 * DAY; 
  if (range === "30d") return now - date >= 0 && now - date <= 30 * DAY; 

  if (range === "month") { 
    return ( 
      date.getMonth() === now.getMonth() && 
      date.getFullYear() === now.getFullYear() 
    ); 
  } 

  if (range === "year") return date.getFullYear() === now.getFullYear(); 

  return true; 
}; 

const DATE_OPTIONS = [ 
  { value: "all", label: "All Auction Dates" }, 
  { value: "today", label: "Today" }, 
  { value: "7d", label: "Last 7 Days" }, 
  { value: "30d", label: "Last 30 Days" }, 
  { value: "month", label: "This Month" }, 
  { value: "year", label: "This Year" }, 
]; 

const PAYMENT_OPTIONS = [ 
  { value: "all", label: "All Payment Statuses" }, 
  { value: "paid", label: "Paid" }, 
  { value: "pending", label: "Pending" }, 
  { value: "failed", label: "Failed" }, 
]; 

const SORT_OPTIONS = [ 
  { value: "latest", label: "Latest First" }, 
  { value: "oldest", label: "Oldest First" }, 
  { value: "highest", label: "Highest Bid" }, 
  { value: "lowest", label: "Lowest Bid" }, 
]; 

// ========================================================== 
// CUSTOM DROPDOWN (styled replacement for native <select>) 
// ========================================================== 

function FilterSelect({ value, options, onChange }) { 
  const [open, setOpen] = useState(false); 
  const wrapperRef = useRef(null); 

  const selected = options.find((option) => option.value === value) || options[0]; 

  useEffect(() => { 
    if (!open) return undefined; 

    const handlePointer = (event) => { 
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) { 
        setOpen(false); 
      } 
    }; 

    const handleKey = (event) => { 
      if (event.key === "Escape") setOpen(false); 
    }; 

    document.addEventListener("mousedown", handlePointer); 
    document.addEventListener("keydown", handleKey); 

    return () => { 
      document.removeEventListener("mousedown", handlePointer); 
      document.removeEventListener("keydown", handleKey); 
    }; 
  }, [open]); 

  return ( 
    <div className={`aw-dropdown ${open ? "open" : ""}`} ref={wrapperRef}> 
      <button 
        type="button" 
        className="aw-dropdown-trigger" 
        aria-haspopup="listbox" 
        aria-expanded={open} 
        onClick={() => setOpen((current) => !current)} 
      > 
        <span>{selected?.label}</span> 
        <FaChevronDown /> 
      </button> 

      {open && ( 
        <ul className="aw-dropdown-menu" role="listbox"> 
          {options.map((option) => { 
            const isSelected = option.value === value; 

            return ( 
              <li key={option.value} role="option" aria-selected={isSelected}> 
                <button 
                  type="button" 
                  className={`aw-dropdown-option ${isSelected ? "selected" : ""}`} 
                  onClick={() => { 
                    onChange(option.value); 
                    setOpen(false); 
                  }} 
                > 
                  <span>{option.label}</span> 
                  {isSelected && <FaCheck />} 
                </button> 
              </li> 
            ); 
          })} 
        </ul> 
      )} 
    </div> 
  ); 
} 

function AdminWinners() { 
  const [winners, setWinners] = useState([]); 
  const [activeAuctions, setActiveAuctions] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(""); 
  const [notice, setNotice] = useState(""); 

  const [search, setSearch] = useState(""); 
  const [paymentFilter, setPaymentFilter] = useState("all"); 
  const [dateFilter, setDateFilter] = useState("all"); 
  const [categoryFilter, setCategoryFilter] = useState("all"); 
  const [sortBy, setSortBy] = useState("latest"); 
  const [minBid, setMinBid] = useState(""); 
  const [maxBid, setMaxBid] = useState(""); 

  const [page, setPage] = useState(1); 
  const [selectedKeys, setSelectedKeys] = useState([]); 

  const [selectedWinner, setSelectedWinner] = useState(null); 
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [modalTitle, setModalTitle] = useState("Winner Details");
  const [modalMode, setModalMode] = useState("winner");
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [savingWinner, setSavingWinner] = useState(false);
  const [editDraft, setEditDraft] = useState({
    fullname: "",
    email: "",
    mobile: "",
    product_title: "",
    category: "",
    description: "",
  }); 

  // ========================================================== 
  // FETCH WINNER RECORDS 
  // ========================================================== 

  const fetchWinners = async () => { 
    setLoading(true); 
    setError(""); 

    try { 
      const response = await adminApi.get("/admin/winners"); 

      const data = response.data; 

      setWinners(Array.isArray(data) ? data : data.winners || []); 

      if (!Array.isArray(data) && data.active_auctions !== undefined) { 
        setActiveAuctions(data.active_auctions); 
      } 
    } catch (err) { 
      console.error("Failed to load winners:", err); 

      setError( 
        err.response?.data?.detail || 
          "Unable to load winner records. Please try again." 
      ); 
    } finally { 
      setLoading(false); 
    } 
  }; 

  useEffect(() => { 
    fetchWinners(); 
  }, []); 

  // ========================================================== 
  // FILTER + SORT WINNERS 
  // ========================================================== 

  const categories = useMemo(() => { 
    const set = new Set(winners.map((winner) => getCategory(winner))); 
    return Array.from(set).sort(); 
  }, [winners]); 

  const filteredWinners = useMemo(() => { 
    const query = search.trim().toLowerCase(); 
    const min = minBid === "" ? null : Number(minBid); 
    const max = maxBid === "" ? null : Number(maxBid); 

    const result = winners.filter((winner) => { 
      const searchableText = [ 
        winner.winner_name, 
        winner.winner_email, 
        winner.winner_id, 
        winner.auction_title, 
        winner.auction_id, 
        getCategory(winner), 
      ] 
        .filter(Boolean) 
        .join(" ") 
        .toLowerCase(); 

      const bid = Number(winner.winning_bid || 0); 

      return ( 
        searchableText.includes(query) && 
        (paymentFilter === "all" || 
          getPaymentStatus(winner) === paymentFilter) && 
        (categoryFilter === "all" || getCategory(winner) === categoryFilter) && 
        isInDateRange(winner.claim_date, dateFilter) && 
        (min === null || bid >= min) && 
        (max === null || bid <= max) 
      ); 
    }); 

    const time = (winner) => new Date(winner.claim_date).getTime() || 0; 
    const bidOf = (winner) => Number(winner.winning_bid || 0); 

    return [...result].sort((a, b) => { 
      if (sortBy === "oldest") return time(a) - time(b); 
      if (sortBy === "highest") return bidOf(b) - bidOf(a); 
      if (sortBy === "lowest") return bidOf(a) - bidOf(b); 
      return time(b) - time(a); 
    }); 
  }, [ 
    winners, 
    search, 
    paymentFilter, 
    dateFilter, 
    categoryFilter, 
    sortBy, 
    minBid, 
    maxBid, 
  ]); 

  const hasActiveFilters = 
    search || 
    paymentFilter !== "all" || 
    dateFilter !== "all" || 
    categoryFilter !== "all" || 
    sortBy !== "latest" || 
    minBid !== "" || 
    maxBid !== ""; 

  const clearFilters = () => { 
    setSearch(""); 
    setPaymentFilter("all"); 
    setDateFilter("all"); 
    setCategoryFilter("all"); 
    setSortBy("latest"); 
    setMinBid(""); 
    setMaxBid(""); 
  }; 

  // ========================================================== 
  // PAGINATION 
  // ========================================================== 

  const totalPages = Math.max(1, Math.ceil(filteredWinners.length / PAGE_SIZE)); 

  useEffect(() => { 
    setPage(1); 
  }, [ 
    search, 
    paymentFilter, 
    dateFilter, 
    categoryFilter, 
    sortBy, 
    minBid, 
    maxBid, 
  ]); 

  useEffect(() => { 
    if (page > totalPages) setPage(totalPages); 
  }, [page, totalPages]); 

  const pageStart = (page - 1) * PAGE_SIZE; 

  const pageWinners = filteredWinners.slice(pageStart, pageStart + PAGE_SIZE); 

  const pageNumbers = useMemo(() => { 
    const start = Math.max(1, Math.min(page - 2, totalPages - 4)); 
    const end = Math.min(totalPages, start + 4); 
    const numbers = []; 

    for (let number = start; number <= end; number += 1) numbers.push(number); 

    return numbers; 
  }, [page, totalPages]); 

  // ========================================================== 
  // SELECTION 
  // ========================================================== 

  const pageKeys = pageWinners.map(getRowKey); 

  const allPageSelected = 
    pageKeys.length > 0 && pageKeys.every((key) => selectedKeys.includes(key)); 

  const toggleRow = (key) => { 
    setSelectedKeys((current) => 
      current.includes(key) 
        ? current.filter((item) => item !== key) 
        : [...current, key] 
    ); 
  }; 

  const togglePage = () => { 
    setSelectedKeys((current) => 
      allPageSelected 
        ? current.filter((key) => !pageKeys.includes(key)) 
        : Array.from(new Set([...current, ...pageKeys])) 
    ); 
  }; 

  // ========================================================== 
  // STATISTICS 
  // ========================================================== 

  const totalWinners = winners.length; 

  const completedAuctions = new Set( 
    winners.map((winner) => winner.auction_id).filter(Boolean) 
  ).size; 

  const paidCount = winners.filter( 
    (winner) => getPaymentStatus(winner) === "paid" 
  ).length; 

  const paymentPending = winners.filter( 
    (winner) => getPaymentStatus(winner) === "pending" 
  ).length; 

  const fulfillmentRate = 
    totalWinners > 0 ? (paidCount / totalWinners) * 100 : 0; 

  const totalWinningValue = winners.reduce( 
    (total, winner) => total + Number(winner.winning_bid || 0), 
    0 
  ); 

  // Month-over-month change in winners 
  const monthlyTrend = useMemo(() => { 
    const now = new Date(); 
    let current = 0; 
    let previous = 0; 

    winners.forEach((winner) => { 
      const date = new Date(winner.claim_date); 

      if (Number.isNaN(date.getTime())) return; 

      const monthDiff = 
        (now.getFullYear() - date.getFullYear()) * 12 + 
        (now.getMonth() - date.getMonth()); 

      if (monthDiff === 0) current += 1; 
      else if (monthDiff === 1) previous += 1; 
    }); 

    if (previous > 0) { 
      return { 
        hasBase: true, 
        value: Math.round(((current - previous) / previous) * 100), 
        current, 
      }; 
    } 

    return { hasBase: false, value: 0, current }; 
  }, [winners]); 

  // Year-over-year change in winning value 
  const yearlyTrend = useMemo(() => { 
    const year = new Date().getFullYear(); 
    let current = 0; 
    let previous = 0; 

    winners.forEach((winner) => { 
      const date = new Date(winner.claim_date); 

      if (Number.isNaN(date.getTime())) return; 

      if (date.getFullYear() === year) { 
        current += Number(winner.winning_bid || 0); 
      } else if (date.getFullYear() === year - 1) { 
        previous += Number(winner.winning_bid || 0); 
      } 
    }); 

    if (previous > 0) { 
      return { 
        hasBase: true, 
        value: Number((((current - previous) / previous) * 100).toFixed(1)), 
      }; 
    } 

    return { hasBase: false, value: 0 }; 
  }, [winners]); 

  // ========================================================== 
  // ACTIONS 
  // ========================================================== 

  const openDetails = async (winner, title, mode = "winner") => {
    setModalTitle(title);
    setModalMode(mode);
    setSelectedWinner(winner);
    setSelectedAuction(null);
    setDetailsLoading(true);

    try {
      const response = await adminApi.get(
        `/admin/winners/${winner.auction_id}/details`
      );
      const data = response.data || {};
      const winnerDetails = data.winner || {};
      const auctionDetails = data.auction || {};
      const winningBid = data.winning_bid || {};

      const combinedWinner = {
        ...winner,
        winner_id: winnerDetails.id ?? winner.winner_id,
        winner_name: winnerDetails.fullname || winnerDetails.username || winner.winner_name,
        winner_email: winnerDetails.email || winner.winner_email,
        winner_phone: winnerDetails.mobile || winner.winner_phone || winner.phone || "",
        winner_mobile: winnerDetails.mobile || winner.winner_mobile || winner.mobile || "",
        winner_address: winnerDetails.address || "",
        auction_id: auctionDetails.id ?? winner.auction_id,
        auction_title: auctionDetails.product_title || winner.auction_title,
        category: auctionDetails.category || winner.category,
        winning_bid: winningBid.amount ?? winner.winning_bid,
        claim_date: winningBid.created_at || winner.claim_date,
        payment_method: auctionDetails.payment_method || winner.payment_method,
      };

      setSelectedWinner({ ...combinedWinner, ...auctionDetails });
      setSelectedAuction(auctionDetails);
      setEditDraft({
        fullname: winnerDetails.fullname || winnerDetails.username || "",
        email: winnerDetails.email || "",
        mobile: winnerDetails.mobile || "",
        product_title: auctionDetails.product_title || "",
        category: auctionDetails.category || "",
        description: auctionDetails.description || "",
      });
    } catch (err) {
      console.error("Failed to fetch complete winner details:", err);
      setNotice(
        err.response?.data?.detail ||
          "Could not load complete details. Showing available winner information."
      );
      setSelectedWinner(winner);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSaveWinnerChanges = async (event) => {
    if (event) event.preventDefault();
    if (!selectedWinner) return;

    setSavingWinner(true);
    try {
      await adminApi.put(`/admin/winners/${selectedWinner.auction_id}`, {
        winner: {
          fullname: editDraft.fullname.trim(),
          email: editDraft.email.trim(),
          mobile: editDraft.mobile.trim(),
        },
        auction: {
          product_title: editDraft.product_title.trim(),
          category: editDraft.category.trim(),
          description: editDraft.description,
        },
      });

      setNotice("Winner and product details updated successfully.");
      await fetchWinners();
      await openDetails(
        { ...selectedWinner, winner_name: editDraft.fullname, winner_email: editDraft.email, winner_phone: editDraft.mobile, auction_title: editDraft.product_title, category: editDraft.category },
        "Winner Details",
        "winner"
      );
    } catch (err) {
      console.error("Failed to update winner record:", err);
      setNotice(
        err.response?.data?.detail ||
          "Unable to save changes. Please check the backend response."
      );
    } finally {
      setSavingWinner(false);
    }
  }; 

  const handleExport = () => { 
    if (filteredWinners.length === 0) { 
      setNotice("There are no winner records to export."); 
      return; 
    } 

    const escapeCell = (value) => 
      `"${String(value ?? "").replace(/"/g, '""')}"`; 

    const header = [ 
      "Winner ID", 
      "Winner Name", 
      "Email", 
      "Phone", 
      "Auction ID", 
      "Auction Item", 
      "Category", 
      "Winning Bid", 
      "Claim Date", 
      "Payment Method", 
      "Payment Status", 
    ]; 

    const rows = filteredWinners.map((winner) => [ 
      winner.winner_id, 
      winner.winner_name, 
      winner.winner_email, 
      getWinnerPhone(winner), 
      winner.auction_id, 
      winner.auction_title, 
      getCategory(winner), 
      winner.winning_bid, 
      formatDate(winner.claim_date), 
      winner.payment_method, 
      PAYMENT_STATUS_META[getPaymentStatus(winner)].label, 
    ]); 

    const csv = [header, ...rows] 
      .map((row) => row.map(escapeCell).join(",")) 
      .join("\n"); 

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" }); 
    const url = URL.createObjectURL(blob); 
    const link = document.createElement("a"); 

    link.href = url; 
    link.download = "winners-report.csv"; 
    link.click(); 

    URL.revokeObjectURL(url); 
  }; 

  const deleteWinners = async (targets, successMessage) => { 
    try { 
      // NOTE: adjust this endpoint to match your backend delete route. 
      await Promise.all( 
        targets.map((winner) => 
          adminApi.delete(`/admin/winners/${winner.id ?? winner.auction_id}`) 
        ) 
      ); 

      const removedKeys = targets.map(getRowKey); 

      setSelectedKeys((current) => 
        current.filter((key) => !removedKeys.includes(key)) 
      ); 
      setNotice(successMessage); 
      await fetchWinners(); 
    } catch (err) { 
      console.error("Failed to delete winners:", err); 

      setNotice( 
        err.response?.data?.detail || 
          "Unable to delete the selected winner records." 
      ); 
    } 
  }; 

  const handleDeleteSelected = async () => { 
    if (selectedKeys.length === 0) return; 

    const confirmed = window.confirm( 
      `Delete ${selectedKeys.length} selected winner record${ 
        selectedKeys.length !== 1 ? "s" : "" 
      }? This cannot be undone.` 
    ); 

    if (!confirmed) return; 

    const targets = winners.filter((winner) => 
      selectedKeys.includes(getRowKey(winner)) 
    ); 

    await deleteWinners(targets, "Selected winner records were deleted."); 
  }; 

  const handleDeleteOne = async (winner) => { 
    const confirmed = window.confirm( 
      `Delete the winner record for ${ 
        winner.winner_name || "this winner" 
      }? This cannot be undone.` 
    ); 

    if (!confirmed) return; 

    await deleteWinners([winner], "Winner record was deleted."); 
  }; 


  const handleDeleteAll = async () => {
    if (winners.length === 0) return;

    const confirmed = window.confirm(
      `Remove all ${winners.length} winner records from this page? Auction and bid history will be kept.`
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      await adminApi.delete("/admin/winners");
      setSelectedKeys([]);
      setNotice("All winner records were removed from the Winners page.");
      await fetchWinners();
    } catch (err) {
      console.error("Failed to delete all winners:", err);
      setNotice(
        err.response?.data?.detail ||
          "Unable to delete all winner records. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================================== 
  // RENDER 
  // ========================================================== 

  return ( 
    <div className="aw-page"> 
      {/* HEADER */} 

      <div className="aw-header"> 
        <div> 
          <nav className="aw-breadcrumb" aria-label="Breadcrumb"> 
            <span>Admin</span> 
            <FaChevronRight /> 
            <strong>Winners</strong> 
          </nav> 

          <h1>Auction Winners Management</h1> 

          <p> 
            Manage winners, winning bids, fulfillment statuses, and payment 
            verifications. 
          </p> 
        </div> 

        <div className="aw-header-actions"> 
          <button 
            type="button" 
            className="aw-btn aw-btn-outline" 
            onClick={fetchWinners} 
            disabled={loading} 
          > 
            <FaSyncAlt className={loading ? "aw-spin" : ""} /> 
            Refresh 
          </button> 

          <button 
            type="button" 
            className="aw-btn aw-btn-outline" 
            onClick={handleExport} 
          > 
            <FaFileDownload /> 
            Export Report 
          </button> 

          <button 
            type="button" 
            className="aw-btn aw-btn-primary" 
            onClick={() => 
              setNotice( 
                "Adding winners manually is not connected to a backend endpoint yet." 
              ) 
            } 
          > 
            <FaPlus /> 
            Add New Winner 
          </button> 
        </div> 
      </div> 

      {notice && ( 
        <div className="aw-notice" role="status"> 
          <FaExclamationCircle /> 
          <span>{notice}</span> 

          <button 
            type="button" 
            onClick={() => setNotice("")} 
            aria-label="Dismiss message" 
          > 
            <FaTimes /> 
          </button> 
        </div> 
      )} 

      {/* STATISTICS */} 

      <section className="aw-stats-grid"> 
        <div className="aw-stat-card"> 
          <div className="aw-stat-content"> 
            <span className="aw-stat-label">TOTAL WINNERS</span> 
            <h2>{totalWinners.toLocaleString("en-IN")}</h2> 

            <p className="aw-stat-note aw-note-teal"> 
              {monthlyTrend.hasBase ? ( 
                <> 
                  {monthlyTrend.value >= 0 ? <FaArrowUp /> : <FaArrowDown />} 
                  {monthlyTrend.value >= 0 ? "+" : ""} 
                  {monthlyTrend.value}% this month 
                </> 
              ) : ( 
                <> 
                  <FaArrowUp /> 
                  {monthlyTrend.current} new this month 
                </> 
              )} 
            </p> 
          </div> 

          <div className="aw-stat-icon aw-icon-yellow"> 
            <FaTrophy /> 
          </div> 
        </div> 

        <div className="aw-stat-card"> 
          <div className="aw-stat-content"> 
            <span className="aw-stat-label">COMPLETED AUCTIONS</span> 
            <h2>{completedAuctions.toLocaleString("en-IN")}</h2> 

            <p className="aw-stat-note aw-note-green"> 
              <FaCheckCircle /> 
              {fulfillmentRate.toFixed(1)}% fulfillment 
            </p> 
          </div> 

          <div className="aw-stat-icon aw-icon-blue"> 
            <FaGavel /> 
          </div> 
        </div> 

        <div className="aw-stat-card"> 
          <div className="aw-stat-content"> 
            <span className="aw-stat-label">TOTAL WINNING VALUE</span> 
            <h2>{formatCurrency(totalWinningValue)}</h2> 

            <p className="aw-stat-note aw-note-teal"> 
              {yearlyTrend.hasBase ? ( 
                <> 
                  {yearlyTrend.value >= 0 ? <FaArrowUp /> : <FaArrowDown />} 
                  {yearlyTrend.value >= 0 ? "+" : ""} 
                  {yearlyTrend.value}% YoY 
                </> 
              ) : ( 
                <> 
                  <FaArrowUp /> 
                  {activeAuctions !== null 
                    ? `Active auctions: ${activeAuctions}` 
                    : "All recorded winners"} 
                </> 
              )} 
            </p> 
          </div> 

          <div className="aw-stat-icon aw-icon-green"> 
            <FaRupeeSign /> 
          </div> 
        </div> 

        <div className="aw-stat-card"> 
          <div className="aw-stat-content"> 
            <span className="aw-stat-label">PAYMENT PENDING</span> 
            <h2 className="aw-stat-orange-value"> 
              {paymentPending.toLocaleString("en-IN")} 
            </h2> 

            <p className="aw-stat-note aw-note-orange"> 
              <FaClock /> 
              Requires follow-up 
            </p> 
          </div> 

          <div className="aw-stat-icon aw-icon-orange"> 
            <FaClock /> 
          </div> 
        </div> 
      </section> 

      {/* SEARCH AND FILTERS */} 

      <section className="aw-filter-panel"> 
        <div className="aw-filter-heading"> 
          <h2> 
            <FaFilter /> 
            Filter Winners 
          </h2> 

          <button 
            type="button" 
            className="aw-clear-filters" 
            onClick={clearFilters} 
            disabled={!hasActiveFilters} 
          > 
            <FaTimes /> 
            Clear Filters 
          </button> 
        </div> 

        <div className="aw-filter-grid"> 
          <div className="aw-search-box aw-span-2"> 
            <FaSearch /> 

            <input 
              type="text" 
              placeholder="Search winner name, email, product..." 
              value={search} 
              onChange={(event) => setSearch(event.target.value)} 
            /> 

            {search && ( 
              <button 
                type="button" 
                className="aw-clear-search" 
                onClick={() => setSearch("")} 
                aria-label="Clear search" 
              > 
                <FaTimes /> 
              </button> 
            )} 
          </div> 

          <FilterSelect 
            value={paymentFilter} 
            options={PAYMENT_OPTIONS} 
            onChange={setPaymentFilter} 
          /> 

          <FilterSelect 
            value={dateFilter} 
            options={DATE_OPTIONS} 
            onChange={setDateFilter} 
          /> 

          <FilterSelect 
            value={categoryFilter} 
            options={[ 
              { value: "all", label: "All Categories" }, 
              ...categories.map((category) => ({ 
                value: category, 
                label: category, 
              })), 
            ]} 
            onChange={setCategoryFilter} 
          /> 

          <FilterSelect 
            value={sortBy} 
            options={SORT_OPTIONS} 
            onChange={setSortBy} 
          /> 

          <input 
            type="number" 
            min="0" 
            className="aw-input" 
            placeholder="Min Bid ₹" 
            value={minBid} 
            onChange={(event) => setMinBid(event.target.value)} 
          /> 

          <input 
            type="number" 
            min="0" 
            className="aw-input" 
            placeholder="Max Bid ₹" 
            value={maxBid} 
            onChange={(event) => setMaxBid(event.target.value)} 
          /> 
        </div> 
      </section> 

      {/* TABLE */} 

      <section className="aw-table-card"> 
        <div className="aw-table-heading"> 
          <div className="aw-table-title"> 
            <h2>Winners List</h2> 

            <span className="aw-record-pill"> 
              {filteredWinners.length.toLocaleString("en-IN")} Record 
              {filteredWinners.length !== 1 ? "s" : ""} 
            </span> 
          </div> 

          <button 
            type="button" 
            className="aw-btn aw-btn-danger" 
            onClick={handleDeleteSelected} 
            disabled={selectedKeys.length === 0} 
          > 
            <FaTrashAlt /> 
            Delete Selected 
            {selectedKeys.length > 0 && ` (${selectedKeys.length})`} 
          </button> 
          <button
            type="button"
            className="aw-btn aw-btn-danger"
            onClick={handleDeleteAll}
            disabled={winners.length === 0 || loading}
          >
            <FaTrashAlt />
            Delete All
          </button>
        </div> 

        {loading ? ( 
          <div className="aw-state-message"> 
            <FaSyncAlt className="aw-spin" /> 
            <p>Loading winner records...</p> 
          </div> 
        ) : error ? ( 
          <div className="aw-state-message aw-error-state"> 
            <FaExclamationTriangle /> 
            <p>{error}</p> 

            <button type="button" onClick={fetchWinners}> 
              Try Again 
            </button> 
          </div> 
        ) : filteredWinners.length === 0 ? ( 
          <div className="aw-state-message"> 
            <FaTrophy /> 

            <h3>No winner records found</h3> 

            <p> 
              Winner records will appear here when completed auctions have 
              been processed by the backend. 
            </p> 
          </div> 
        ) : ( 
          <> 
            <div className="aw-table-wrapper"> 
              <table className="aw-table"> 
                <thead> 
                  <tr> 
                    <th className="aw-col-check"> 
                      <input 
                        type="checkbox" 
                        checked={allPageSelected} 
                        onChange={togglePage} 
                        aria-label="Select all winners on this page" 
                      /> 
                    </th> 
                    <th className="aw-col-id">ID</th> 
                    <th>PRODUCT</th> 
                    <th>WINNER NAME</th> 
                    <th>EMAIL</th> 
                    <th>HIGHEST BID</th> 
                    <th>DATE &amp; TIME</th> 
                    <th>PAYMENT METHOD</th> 
                    <th>PAYMENT STATUS</th> 
                    <th className="aw-col-actions">ACTIONS</th> 
                  </tr> 
                </thead> 

                <tbody> 
                  {pageWinners.map((winner, index) => { 
                    const rowKey = getRowKey(winner); 
                    const paymentStatus = 
                      PAYMENT_STATUS_META[getPaymentStatus(winner)]; 
                    const method = getPaymentMethodMeta(winner); 
                    const productImage = getProductImage(winner); 
                    const avatar = getWinnerAvatar(winner); 
                    const phone = getWinnerPhone(winner); 

                    return ( 
                      <tr key={rowKey}> 
                        <td className="aw-col-check"> 
                          <input 
                            type="checkbox" 
                            checked={selectedKeys.includes(rowKey)} 
                            onChange={() => toggleRow(rowKey)} 
                            aria-label={`Select winner ${ 
                              winner.winner_name || "" 
                            }`} 
                          /> 
                        </td> 

                        <td className="aw-id-cell aw-col-id"> 
                          #{winner.id ?? pageStart + index + 1} 
                        </td> 

                        <td> 
                          <div className="aw-product-cell"> 
                            <div className="aw-product-thumb"> 
                              <FaBoxOpen /> 

                              {productImage && ( 
                                <img 
                                  src={productImage} 
                                  alt={winner.auction_title || "Product"} 
                                  onError={(event) => { 
                                    event.currentTarget.style.display = "none"; 
                                  }} 
                                /> 
                              )} 
                            </div> 

                            <div className="aw-product-details"> 
                              <strong> 
                                {winner.auction_title || "Auction item"} 
                              </strong> 

                              <span>{getCategory(winner)}</span> 

                              <button 
                                type="button" 
                                className="aw-chip-button aw-chip-blue" 
                                onClick={() => 
                                  openDetails(winner, "Product Details", "product") 
                                } 
                              > 
                                <FaBoxOpen /> 
                                View Product Details 
                              </button> 
                            </div> 
                          </div> 
                        </td> 

                        <td> 
                          <div className="aw-winner-cell"> 
                            <div className="aw-avatar"> 
                              {getInitials(winner.winner_name)} 

                              {avatar && ( 
                                <img 
                                  src={avatar} 
                                  alt={winner.winner_name || "Winner"} 
                                  onError={(event) => { 
                                    event.currentTarget.style.display = "none"; 
                                  }} 
                                /> 
                              )} 
                            </div> 

                            <div className="aw-winner-details"> 
                              <strong> 
                                {winner.winner_name || "Unknown Winner"} 
                              </strong> 

                              <span>{phone || `ID: ${winner.winner_id ?? "—"}`}</span> 

                              <button 
                                type="button" 
                                className="aw-chip-button aw-chip-purple" 
                                onClick={() => 
                                  openDetails(winner, "Winner Details", "winner") 
                                } 
                              > 
                                <FaUser /> 
                                View Winner Details 
                              </button> 
                            </div> 
                          </div> 
                        </td> 

                        <td className="aw-email-cell"> 
                          {winner.winner_email || "Email unavailable"} 
                        </td> 

                        <td className="aw-winning-bid"> 
                          {formatCurrency(winner.winning_bid)} 
                        </td> 

                        <td> 
                          <div className="aw-date-cell"> 
                            <strong>{formatDate(winner.claim_date)}</strong> 
                            <span>{formatTime(winner.claim_date)}</span> 
                          </div> 
                        </td> 

                        <td> 
                          <span className="aw-method-chip"> 
                            {method.icon} 
                            {method.label} 
                          </span> 
                        </td> 

                        <td> 
                          <span 
                            className={`aw-pay-status ${paymentStatus.className}`} 
                          > 
                            <i /> 
                            {paymentStatus.label} 
                          </span> 
                        </td> 

                        <td className="aw-col-actions"> 
                          <div className="aw-action-group"> 
                            <button 
                              type="button" 
                              className="aw-icon-button aw-icon-view" 
                              title="View details" 
                              aria-label="View details" 
                              onClick={() => 
                                openDetails(winner, "Winner Details", "winner") 
                              } 
                            > 
                              <FaEye /> 
                            </button> 

                            <button 
                              type="button" 
                              className="aw-icon-button aw-icon-edit" 
                              title="View / Update" 
                              aria-label="View or update winner record" 
                              onClick={() => 
                                openDetails(winner, "Update Winner Record", "edit") 
                              } 
                            > 
                              <FaEdit /> 
                            </button> 

                            <button 
                              type="button" 
                              className="aw-icon-button aw-icon-delete" 
                              title="Delete winner" 
                              aria-label="Delete winner record" 
                              onClick={() => handleDeleteOne(winner)} 
                            > 
                              <FaTrashAlt /> 
                            </button> 
                          </div> 
                        </td> 
                      </tr> 
                    ); 
                  })} 
                </tbody> 
              </table> 
            </div> 

            <div className="aw-table-footer"> 
              <p> 
                Showing{" "} 
                <strong> 
                  {pageStart + 1} – {pageStart + pageWinners.length} 
                </strong>{" "} 
                of <strong>{filteredWinners.length.toLocaleString("en-IN")}</strong>{" "} 
                winners 
              </p> 

              <div className="aw-pagination"> 
                <button 
                  type="button" 
                  className="aw-page-button aw-page-wide" 
                  onClick={() => setPage((current) => Math.max(1, current - 1))} 
                  disabled={page === 1} 
                > 
                  Previous 
                </button> 

                {pageNumbers.map((number) => ( 
                  <button 
                    type="button" 
                    key={number} 
                    className={`aw-page-button ${ 
                      number === page ? "active" : "" 
                    }`} 
                    onClick={() => setPage(number)} 
                  > 
                    {number} 
                  </button> 
                ))} 

                <button 
                  type="button" 
                  className="aw-page-button aw-page-wide" 
                  onClick={() => 
                    setPage((current) => Math.min(totalPages, current + 1)) 
                  } 
                  disabled={page === totalPages} 
                > 
                  Next 
                </button> 
              </div> 
            </div> 
          </> 
        )} 
      </section> 

      {/* WINNER DETAILS MODAL */} 

      {selectedWinner && ( 
        <div 
          className="aw-modal-overlay" 
          onClick={() => setSelectedWinner(null)} 
        > 
          <div 
            className="aw-modal" 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="aw-modal-title" 
            onClick={(event) => event.stopPropagation()} 
          > 
            <div className="aw-modal-header"> 
              <div> 
                <span className="aw-modal-eyebrow">BIDORA ADMIN</span> 
                <h2 id="aw-modal-title">{modalTitle}</h2> 
              </div> 

              <button 
                type="button" 
                className="aw-modal-close" 
                onClick={() => setSelectedWinner(null)} 
                aria-label="Close details" 
              > 
                <FaTimes /> 
              </button> 
            </div> 

            <div className="aw-modal-body">
              {detailsLoading ? (
                <div className="aw-state-message"><p>Loading complete details...</p></div>
              ) : modalMode === "product" ? (
                <>
                  <div className="aw-modal-winner">
                    <div className="aw-product-thumb" style={{ width: 76, height: 76, flexShrink: 0 }}>
                      <FaBoxOpen />
                      {(selectedAuction?.images || []).length > 0 && (() => {
                        const firstImage = selectedAuction.images[0];
                        const path = firstImage.image_path || firstImage.image_url || firstImage.path || firstImage.url || "";
                        const imageUrl = path.startsWith("http") ? path : `http://127.0.0.1:8000/${path.replace(/^\/+/, "")}`;
                        return path ? <img src={imageUrl} alt={selectedAuction?.product_title || "Product"} onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null;
                      })()}
                    </div>
                    <div>
                      <h3>{selectedAuction?.product_title || selectedWinner?.auction_title || "Auction item"}</h3>
                      <p>{selectedAuction?.category || getCategory(selectedWinner || {})}</p>
                    </div>
                  </div>

                  <h3>Product Information</h3>
                  <div className="aw-detail-grid">
                    {[
                      ["Auction ID", selectedAuction?.id ?? selectedWinner?.auction_id],
                      ["Product Title", selectedAuction?.product_title],
                      ["Brand / Model", selectedAuction?.brand_model],
                      ["Category", selectedAuction?.category],
                      ["Condition", selectedAuction?.product_condition],
                      ["Purchase Date", formatDate(selectedAuction?.purchase_date)],
                      ["Purchased By", selectedAuction?.purchased_by],
                      ["Purchase Price", selectedAuction?.purchase_price != null ? formatCurrency(selectedAuction.purchase_price) : "—"],
                      ["Starting Price", selectedAuction?.starting_price != null ? formatCurrency(selectedAuction.starting_price) : "—"],
                      ["Winning Bid", formatCurrency(selectedWinner?.winning_bid)],
                      ["Auction Start", selectedAuction?.auction_start ? `${formatDate(selectedAuction.auction_start)} ${formatTime(selectedAuction.auction_start)}` : "—"],
                      ["Auction End", selectedAuction?.auction_end ? `${formatDate(selectedAuction.auction_end)} ${formatTime(selectedAuction.auction_end)}` : "—"],
                      ["Auction Status", selectedAuction?.status],
                      ["Location Area", selectedAuction?.location_area],
                      ["City", selectedAuction?.location_city],
                      ["State", selectedAuction?.location_state],
                      ["Country", selectedAuction?.location_country],
                      ["Pincode", selectedAuction?.location_pincode],
                      ["Delivery Type", selectedAuction?.delivery_type],
                      ["Shipping Type", selectedAuction?.shipping_type],
                      ["Shipping Charges", selectedAuction?.shipping_charges != null ? formatCurrency(selectedAuction.shipping_charges) : "—"],
                      ["Shipping Paid By", selectedAuction?.shipping_paid_by],
                      ["Warranty", selectedAuction?.warranty_status],
                      ["Payment Method", selectedAuction?.payment_method],
                      ["Seller Name", selectedAuction?.seller_name],
                      ["Seller Email", selectedAuction?.seller_email],
                      ["Seller Contact", selectedAuction?.seller_contact],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <span>{label}</span>
                        <strong style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                          {value === undefined || value === null || value === "" ? "—" : value}
                        </strong>
                      </div>
                    ))}
                  </div>

                  <h3>Description</h3>
                  <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{selectedAuction?.description || "No product description available."}</p>
                  <h3>Product Terms</h3>
                  <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{selectedAuction?.product_terms || "No additional terms available."}</p>

                  <h3>Product Images</h3>
                  <div className="aw-detail-grid">
                    {(selectedAuction?.images || []).length ? selectedAuction.images.map((image, index) => {
                      const path = image.image_path || image.image_url || image.path || image.url || "";
                      if (!path) return null;
                      const imageUrl = path.startsWith("http") ? path : `http://127.0.0.1:8000/${path.replace(/^\/+/, "")}`;
                      return <div key={image.id ?? index}><img src={imageUrl} alt={`Product ${index + 1}`} style={{ width: "100%", maxWidth: 220, height: 160, objectFit: "contain", borderRadius: 8 }} onError={(event) => { event.currentTarget.style.display = "none"; }} /></div>;
                    }) : <p>No product images were returned by the backend.</p>}
                  </div>
                </>
              ) : modalMode === "edit" ? (
                <form id="aw-edit-winner-form" onSubmit={handleSaveWinnerChanges}>
                  <div className="aw-modal-winner">
                    <div className="aw-avatar aw-avatar-large">{getInitials(selectedWinner?.winner_name)}</div>
                    <div><h3>Edit Winner and Product Details</h3><p>Update fields shown in the Winners table and associated records.</p></div>
                  </div>
                  <h3>Winner Information</h3>
                  <div className="aw-detail-grid">
                    <label>Winner Name<input className="aw-input" value={editDraft.fullname} onChange={(e) => setEditDraft((p) => ({ ...p, fullname: e.target.value }))} required /></label>
                    <label>Email<input className="aw-input" type="email" value={editDraft.email} onChange={(e) => setEditDraft((p) => ({ ...p, email: e.target.value }))} required /></label>
                    <label>Contact Number<input className="aw-input" value={editDraft.mobile} onChange={(e) => setEditDraft((p) => ({ ...p, mobile: e.target.value }))} required /></label>
                  </div>
                  <h3>Product Information</h3>
                  <div className="aw-detail-grid">
                    <label>Product Title<input className="aw-input" value={editDraft.product_title} onChange={(e) => setEditDraft((p) => ({ ...p, product_title: e.target.value }))} required /></label>
                    <label>Category<input className="aw-input" value={editDraft.category} onChange={(e) => setEditDraft((p) => ({ ...p, category: e.target.value }))} required /></label>
                    <label style={{ gridColumn: "1 / -1" }}>Description<textarea className="aw-input" rows={4} value={editDraft.description} onChange={(e) => setEditDraft((p) => ({ ...p, description: e.target.value }))} /></label>
                  </div>
                  <div className="aw-modal-note"><FaExclamationTriangle /><p>Changes are saved to the existing winner update endpoint. Payment fields are not edited here.</p></div>
                </form>
              ) : (
                <>
                  <div className="aw-modal-winner">
                    <div className="aw-avatar aw-avatar-large">
                      {getInitials(selectedWinner?.winner_name)}
                      {getWinnerAvatar(selectedWinner || {}) && <img src={getWinnerAvatar(selectedWinner || {})} alt={selectedWinner?.winner_name || "Winner"} onError={(event) => { event.currentTarget.style.display = "none"; }} />}
                    </div>
                    <div>
                      <h3>{selectedWinner?.winner_name || "Unknown Winner"}</h3>
                      <p>{selectedWinner?.winner_email || "Email unavailable"}</p>
                      <p>Contact Number: {selectedWinner?.winner_phone || selectedWinner?.winner_mobile || selectedWinner?.mobile || "Contact number unavailable"}</p>
                    </div>
                  </div>
                  <div className="aw-detail-grid">
                    {[
                      ["Winner ID", selectedWinner?.winner_id],
                      ["Winner Name", selectedWinner?.winner_name],
                      ["Email", selectedWinner?.winner_email],
                      ["Phone", selectedWinner?.winner_phone || selectedWinner?.winner_mobile || selectedWinner?.mobile],
                      ["Address", selectedWinner?.winner_address],
                      ["Auction ID", selectedWinner?.auction_id],
                      ["Auction Item", selectedWinner?.auction_title],
                      ["Category", getCategory(selectedWinner || {})],
                      ["Winning Bid", formatCurrency(selectedWinner?.winning_bid)],
                      ["Winning Bid Date", `${formatDate(selectedWinner?.claim_date)} ${formatTime(selectedWinner?.claim_date)}`.trim()],
                      ["Payment Method", selectedWinner?.payment_method],
                      ["Payment Status", PAYMENT_STATUS_META[getPaymentStatus(selectedWinner || {})].label],
                      ["Verification Status", selectedWinner?.verification_status || "Pending"],
                      ["Payout Status", selectedWinner?.payout_status || "Not recorded"],
                      ["Total Bids", selectedWinner?.total_bids],
                    ].map(([label, value]) => <div key={label}><span>{label}</span><strong style={{ overflowWrap: "anywhere" }}>{value === undefined || value === null || value === "" ? "—" : value}</strong></div>)}
                  </div>
                  <div className="aw-modal-note"><FaExclamationTriangle /><p>Winner contact details come from the user record associated with the highest bid. Payment and verification values are displayed as currently returned by the backend.</p></div>
                </>
              )}
            </div>
            <div className="aw-modal-footer">
              {modalMode === "edit" && (
                <button type="submit" form="aw-edit-winner-form" className="aw-btn aw-btn-primary" disabled={savingWinner}>
                  <FaCheck /> {savingWinner ? "Saving..." : "Save Changes"}
                </button>
              )}
              <button type="button" className="aw-close-button" onClick={() => setSelectedWinner(null)}>
                Close
              </button>
            </div> 
          </div> 
        </div> 
      )} 
    </div> 
  ); 
} 

export default AdminWinners;