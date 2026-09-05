import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

import {
  FaArrowLeft as ArrowLeft,
  FaShareAlt as Share2,
  FaExpand as Maximize2,
  FaChevronLeft as ChevronLeft,
  FaChevronRight as ChevronRight,
  FaTag as Tag,
  FaUser as UserRound,
  FaMapMarkerAlt as MapPin,
  FaBox as Box,
  FaHeart as Heart,
  FaEye as Eye,
  FaRupeeSign as IndianRupee,
  FaBolt as Zap,
  FaShieldAlt as ShieldCheck,
  FaClock as Clock3,
  FaChartLine as TrendingUp,
  FaUsers as Users,
  FaBoxOpen as Package,
  FaCalendarAlt as CalendarDays,
  FaLandmark as Landmark,
  FaTruck as Truck,
  FaEnvelope as Mail,
  FaPhone as Phone,
  FaStar as Star,
  FaHeadphones as Headphones,
  FaFileAlt as FileText,
  FaCheckCircle as CheckCircle2,
  FaChevronDown as ChevronDown,
  FaArrowRight as ArrowRight,
  FaShoppingBag as ShoppingBag,
  FaBuilding as Building2,
  FaGlobe as Globe2,
  FaLaptop as Laptop,
} from "react-icons/fa";

import { MdVerified as BadgeCheck } from "react-icons/md";

import "../styles/LiveAuctionDetails.css";

const API_BASE_URL = "http://127.0.0.1:8000";

const LiveAuctionDetails = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();

  const [selectedImage, setSelectedImage] = useState(0);
  const [bidAmount, setBidAmount] = useState("");
  const [watchlist, setWatchlist] = useState(false);
  const [timeRange, setTimeRange] = useState("All Time");

  // Backend auction data
  const [auction, setAuction] = useState(null);

  // Countdown
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Loading / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // GET LIVE AUCTION FROM BACKEND
  // =========================================================

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("access_token");

        console.log("========== LIVE AUCTION DEBUG ==========");
        console.log("Auction ID:", auctionId);
        console.log("Token exists:", !!token);

        if (!auctionId) {
          setError("Auction ID is missing.");
          return;
        }

        if (!token) {
          setError("Your login session has expired. Please login again.");
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/api/live-auctions/${auctionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("LIVE AUCTION API STATUS:", response.status);
        console.log("LIVE AUCTION API RESPONSE:", response.data);

        if (response.data?.auction) {
          setAuction(response.data.auction);
        } else {
          console.error(
            "Auction data not found in response:",
            response.data
          );
          setError("Auction details were not found.");
        }

        console.log("========================================");
      } catch (err) {
        console.error("========== LIVE AUCTION ERROR ==========");
        console.error("Status:", err.response?.status);
        console.error("Response:", err.response?.data);
        console.error("Message:", err.message);
        console.error("========================================");

        if (err.response?.status === 401) {
          setError("Your login session has expired. Please login again.");
        } else if (err.response?.status === 404) {
          setError("Live auction not found.");
        } else {
          setError(
            err.response?.data?.detail ||
              "Unable to load auction details."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAuction();
  }, [auctionId]);

  // =========================================================
  // COUNTDOWN
  // =========================================================

  useEffect(() => {
    if (!auction) return;

    // Support the field names that may be returned by the backend.
    const auctionEnd =
      auction.auction_end ??
      auction.auctionEnd ??
      auction.end_time ??
      auction.endTime;

    console.log("========== COUNTDOWN DEBUG ==========");
    console.log("Auction End Value:", auctionEnd);

    if (!auctionEnd) {
      console.warn("Auction end time is missing from backend response.");
      setTimeLeft({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
      return;
    }

    const parseAuctionEnd = (value) => {
      if (value instanceof Date) return value.getTime();

      const stringValue = String(value).trim();

      // Handle MySQL datetime: YYYY-MM-DD HH:mm:ss
      // as a local browser date instead of relying on browser parsing.
      const mysqlMatch = stringValue.match(
        /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/
      );

      if (mysqlMatch) {
        const [, year, month, day, hour, minute, second = "0", fraction = "0"] = mysqlMatch;
        const milliseconds = Number(`0.${fraction}`) * 1000;

        return new Date(
          Number(year),
          Number(month) - 1,
          Number(day),
          Number(hour),
          Number(minute),
          Number(second),
          Math.floor(milliseconds)
        ).getTime();
      }

      return new Date(stringValue).getTime();
    };

    const updateCountdown = () => {
      const endTime = parseAuctionEnd(auctionEnd);
      const now = Date.now();
      const difference = endTime - now;

      console.log("Countdown End Timestamp:", endTime);
      console.log("Countdown Difference:", difference);

      if (!Number.isFinite(endTime) || difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      const totalSeconds = Math.floor(difference / 1000);

      setTimeLeft({
        days: Math.floor(totalSeconds / (24 * 60 * 60)),
        hours: Math.floor(
          (totalSeconds % (24 * 60 * 60)) / (60 * 60)
        ),
        minutes: Math.floor(
          (totalSeconds % (60 * 60)) / 60
        ),
        seconds: totalSeconds % 60,
      });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [auction]);

  // =========================================================
  // FORMAT FUNCTIONS
  // =========================================================

  const formatCurrency = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      Number.isNaN(Number(value))
    ) {
      return "₹0";
    }

    return `₹${Number(value).toLocaleString("en-IN")}`;
  };

  /*
   * Used ONLY for optional bid-related values.
   * Unlike formatCurrency(), this returns an empty value
   * instead of displaying ₹0 when the backend has no data.
   */
  const formatOptionalCurrency = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      Number.isNaN(Number(value))
    ) {
      return "";
    }

    return `₹${Number(value).toLocaleString("en-IN")}`;
  };

  const getNumericValue = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const numberValue = Number(
      String(value).replace(/[₹,\s]/g, "")
    );

    return Number.isFinite(numberValue) ? numberValue : null;
  };

  const formatDate = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatRelativeTime = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    const difference = Date.now() - date.getTime();

    if (difference < 0) {
      return formatDateTime(value);
    }

    const minutes = Math.floor(difference / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
    }

    if (hours < 24) {
      return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    if (days < 7) {
      return `${days} day${days === 1 ? "" : "s"} ago`;
    }

    return formatDateTime(value);
  };

  // =========================================================
  // BACKEND IMAGE URL
  // =========================================================

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";

    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      return imagePath;
    }

    const cleanPath = imagePath.replace(/^\/+/, "");

    return `${API_BASE_URL}/${cleanPath}`;
  };

  // =========================================================
  // PRODUCT IMAGES
  // =========================================================

  const productImages =
    auction?.images?.length > 0
      ? auction.images
          .map((image) => getImageUrl(image.image_path))
          .filter(Boolean)
      : [
          "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=85",
          "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80",
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=500&q=80",
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=500&q=80",
        ];

  // =========================================================
  // REAL BID DATA FROM BACKEND
  // =========================================================
  //
  // Supports possible backend field names:
  // bids
  // bid_history
  // all_bids
  //
  // No fake/default bid data is created.
  // If backend sends no bids, all bid sections remain hidden.
  // =========================================================

  const rawBids = useMemo(() => {
    if (!auction) return [];

    const possibleBidArrays = [
      auction.bids,
      auction.bid_history,
      auction.all_bids,
    ];

    const foundArray = possibleBidArrays.find(
      (value) => Array.isArray(value) && value.length > 0
    );

    return Array.isArray(foundArray) ? foundArray : [];
  }, [auction]);

  // =========================================================
  // NORMALIZE BACKEND BID DATA
  // =========================================================

  const normalizedBids = useMemo(() => {
    if (!rawBids.length) return [];

    const normalized = rawBids
      .map((bid, index) => {
        if (Array.isArray(bid)) {
          const amount = getNumericValue(bid[2]);
          const bidderName = bid[1];
          const bidTime = bid[3];

          if (amount === null) return null;

          return {
            id: bid[0] || index + 1,
            name: bidderName || "",
            amount,
            time: bidTime || "",
          };
        }

        if (typeof bid !== "object" || bid === null) {
          return null;
        }

        const amount = getNumericValue(
          bid.amount ??
            bid.bid_amount ??
            bid.bidAmount ??
            bid.price ??
            bid.value
        );

        if (amount === null) return null;

        const bidder =
          bid.bidder ??
          bid.user ??
          bid.customer ??
          bid.seller ??
          null;

        const bidderName =
          bid.bidder_name ??
          bid.bidderName ??
          bid.user_name ??
          bid.userName ??
          bid.name ??
          bidder?.name ??
          bidder?.full_name ??
          bidder?.username ??
          "";

        const bidTime =
          bid.bid_time ??
          bid.bidTime ??
          bid.created_at ??
          bid.createdAt ??
          bid.timestamp ??
          bid.time ??
          "";

        return {
          id:
            bid.id ??
            bid.bid_id ??
            bid.bidId ??
            index + 1,
          name: bidderName,
          amount,
          time: bidTime,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.amount - a.amount);

    return normalized;
  }, [rawBids]);

  // =========================================================
  // BID HISTORY
  // =========================================================

  const bids = useMemo(() => {
    return normalizedBids.map((bid, index) => {
      const name = bid.name || "Bidder";

      return {
        ...bid,
        initials:
          name
            .trim()
            .charAt(0)
            .toUpperCase() || "B",
        className: `bidder-${index % 5}`,
        displayAmount: formatOptionalCurrency(bid.amount),
        displayTime:
          formatRelativeTime(bid.time) ||
          formatDateTime(bid.time),
      };
    });
  }, [normalizedBids]);

  // =========================================================
// CHECK LOGGED-IN USER ROLE
// =========================================================
const loggedInUser = JSON.parse(
  localStorage.getItem("user") || "null"
);

const isSeller =
  loggedInUser &&
  auction &&
  (
    String(loggedInUser.id) === String(auction.seller_id) ||
    String(loggedInUser.id) === String(auction.sellerId) ||
    String(loggedInUser.id) === String(auction.user_id) ||
    String(loggedInUser.id) === String(auction.userId)
  );

// Fix: used by the All Bids section
const allBidsAvailable = bids.length > 0;

  // =========================================================
  // CURRENT HIGHEST BID
  // =========================================================

  const backendHighestBid = getNumericValue(
    auction?.current_bid ??
      auction?.highest_bid ??
      auction?.highestBid ??
      auction?.currentBid
  );

  const highestBidFromHistory =
    normalizedBids.length > 0
      ? Math.max(...normalizedBids.map((bid) => bid.amount))
      : null;

  const currentHighestBid =
    backendHighestBid !== null
      ? backendHighestBid
      : highestBidFromHistory;

  // =========================================================
  // MINIMUM BID
  // =========================================================
  //
  // Only display it if backend provides minimum bid OR
  // a real highest bid exists.
  //
  // No hardcoded ₹1,27,500.
  // =========================================================

  const backendMinimumBid = getNumericValue(
    auction?.minimum_bid ??
      auction?.minimum_bid_amount ??
      auction?.min_bid ??
      auction?.minimumBid
  );

  const bidIncrement = getNumericValue(
    auction?.bid_increment ??
      auction?.bid_increment_amount ??
      auction?.bidIncrement
  );

  const minimumBid =
    backendMinimumBid !== null
      ? backendMinimumBid
      : currentHighestBid !== null &&
        bidIncrement !== null
      ? currentHighestBid + bidIncrement
      : null;

  // =========================================================
  // BID TREND DATA
  // =========================================================
  //
  // Graph is created ONLY from actual backend bid values.
  // If there are no valid bids, the graph section is hidden.
  // =========================================================

  const chartBids = useMemo(() => {
    return [...normalizedBids]
      .filter((bid) => bid.amount !== null)
      .sort((a, b) => {
        const dateA = new Date(a.time).getTime();
        const dateB = new Date(b.time).getTime();

        if (
          Number.isFinite(dateA) &&
          Number.isFinite(dateB)
        ) {
          return dateA - dateB;
        }

        return a.id - b.id;
      });
  }, [normalizedBids]);

  const hasChartData = chartBids.length > 0;

  const chartData = useMemo(() => {
    if (!hasChartData) return null;

    const values = chartBids.map((bid) => bid.amount);

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    const range =
      maxValue === minValue
        ? Math.max(maxValue * 0.1, 1000)
        : maxValue - minValue;

    const padding = range * 0.15;

    let chartMin = Math.max(
      0,
      Math.floor((minValue - padding) / 1000) * 1000
    );

    let chartMax =
      Math.ceil((maxValue + padding) / 1000) * 1000;

    if (chartMax <= chartMin) {
      chartMax = chartMin + 10000;
    }

    const points = chartBids.map((bid, index) => {
      const x =
        chartBids.length === 1
          ? 400
          : (index / (chartBids.length - 1)) * 800;

      const normalized =
        (bid.amount - chartMin) /
        (chartMax - chartMin);

      const y = 220 - normalized * 190;

      return {
        x,
        y: Math.max(20, Math.min(220, y)),
        amount: bid.amount,
        time: bid.time,
      };
    });

    const linePath = points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"}${point.x},${point.y}`
      )
      .join(" ");

    const areaPath =
      linePath +
      ` L800,250 L0,250 Z`;

    const step =
      (chartMax - chartMin) / 4;

    const yAxisLabels = [
      chartMax,
      chartMax - step,
      chartMax - step * 2,
      chartMax - step * 3,
      chartMin,
    ];

    const labelIndexes =
      chartBids.length <= 6
        ? chartBids.map((_, index) => index)
        : Array.from({ length: 6 }, (_, index) =>
            Math.round(
              (index / 5) *
                (chartBids.length - 1)
            )
          );

    const labels = labelIndexes.map(
      (index) => chartBids[index]?.time
    );

    return {
      linePath,
      areaPath,
      yAxisLabels,
      labels,
    };
  }, [chartBids, hasChartData]);

  // =========================================================
  // TREND STATS
  // =========================================================

  const totalBids =
    getNumericValue(
      auction?.total_bids ??
        auction?.totalBids ??
        auction?.bid_count ??
        auction?.bidCount
    ) ?? normalizedBids.length;

  const totalBiddersFromBackend = getNumericValue(
    auction?.total_bidders ??
      auction?.totalBidders ??
      auction?.bidder_count ??
      auction?.bidderCount
  );

  const totalBidders =
    totalBiddersFromBackend !== null
      ? totalBiddersFromBackend
      : normalizedBids.length > 0
      ? new Set(
          normalizedBids
            .map((bid) => bid.name)
            .filter(Boolean)
        ).size
      : null;

  const lastBid =
    chartBids.length > 0
      ? chartBids[chartBids.length - 1]
      : null;

  const backendPriceChange =
    auction?.price_change ??
    auction?.priceChange ??
    auction?.bid_price_change ??
    null;

  const numericPriceChange = getNumericValue(
    backendPriceChange
  );

  const startingPrice = getNumericValue(
    auction?.starting_price
  );

  const calculatedPriceChange =
    numericPriceChange !== null
      ? numericPriceChange
      : startingPrice !== null &&
        currentHighestBid !== null &&
        startingPrice > 0
      ? ((currentHighestBid - startingPrice) /
          startingPrice) *
        100
      : null;

  // =========================================================
  // PRODUCT DETAILS FROM BACKEND
  // =========================================================

  const productInfoRows = auction
    ? [
        [
          "Product Title",
          auction.product_title || "N/A",
          <Package size={14} />,
        ],
        [
          "Brand / Model",
          auction.brand_model || "N/A",
          <BadgeCheck size={14} />,
        ],
        [
          "Condition",
          auction.product_condition || "N/A",
          <CheckCircle2 size={14} />,
        ],
        [
          "Sold By",
          auction.seller_name || "N/A",
          <UserRound size={14} />,
        ],
        [
          "Purchase Date",
          formatDate(auction.purchase_date),
          <CalendarDays size={14} />,
        ],
        [
          "Purchase Price",
          formatCurrency(auction.purchase_price),
          <IndianRupee size={14} />,
        ],
      ]
    : [];

  const auctionDetailRows = auction
    ? [
        [
          "Starting Price",
          formatCurrency(auction.starting_price),
          <IndianRupee size={14} />,
        ],
        [
          "Auction Start",
          formatDateTime(auction.auction_start),
          <Clock3 size={14} />,
        ],
        [
          "Auction End",
          formatDateTime(auction.auction_end),
          <Clock3 size={14} />,
        ],
        [
          "Warranty Status",
          auction.warranty_status || "N/A",
          <ShieldCheck size={14} />,
        ],
        [
          "Payment Method",
          auction.payment_method || "N/A",
          <Landmark size={14} />,
        ],
        [
          "Terms Accepted",
          auction.terms_accepted ? "Yes" : "No",
          <CheckCircle2 size={14} />,
        ],
      ]
    : [];

  const locationShippingRows = auction
    ? [
        [
          "Location",
          auction.location_area || "N/A",
          <MapPin size={14} />,
        ],
        [
          "City",
          auction.location_city || "N/A",
          <Building2 size={14} />,
        ],
        [
          "State",
          auction.location_state || "N/A",
          <MapPin size={14} />,
        ],
        [
          "Country",
          auction.location_country || "N/A",
          <Globe2 size={14} />,
        ],
        [
          "Pincode",
          auction.location_pincode || "N/A",
          <Globe2 size={14} />,
        ],
        [
          "Delivery Type",
          auction.delivery_type
            ? auction.delivery_type.charAt(0).toUpperCase() +
              auction.delivery_type.slice(1)
            : "N/A",
          <Truck size={14} />,
        ],
        [
          "Shipping Type",
          auction.shipping_type
            ? auction.shipping_type.charAt(0).toUpperCase() +
              auction.shipping_type.slice(1)
            : "N/A",
          <Truck size={14} />,
        ],
        [
          "Shipping Paid By",
          auction.shipping_paid_by
            ? auction.shipping_paid_by.charAt(0).toUpperCase() +
              auction.shipping_paid_by.slice(1)
            : "N/A",
          <ShoppingBag size={14} />,
        ],
        [
          "Shipping Charges",
          formatCurrency(auction.shipping_charges),
          <Truck size={14} />,
        ],
      ]
    : [];

  const productDescription =
    auction?.description ||
    "No product description available.";

  const productTerms =
    auction?.product_terms ||
    "No product terms available.";

  // =========================================================
  // PLACE BID
  // =========================================================

  const placeBid = () => {
  if (!bidAmount) {
    alert("Please enter your bid amount.");
    return;
  }

  const enteredBid = Number(bidAmount);

  if (!Number.isFinite(enteredBid) || enteredBid <= 0) {
    alert("Please enter a valid bid amount.");
    return;
  }

  const startingPrice = getNumericValue(
    auction?.starting_price
  );

  // -------------------------------------------------
  // Check against starting price
  // -------------------------------------------------
  if (
    startingPrice !== null &&
    enteredBid < startingPrice
  ) {
    alert(
      `Your bid cannot be less than the starting bid of ${formatOptionalCurrency(
        startingPrice
      )}.`
    );
    return;
  }

  // -------------------------------------------------
  // Check against current highest bid
  // -------------------------------------------------
  if (
    currentHighestBid !== null &&
    enteredBid <= currentHighestBid
  ) {
    alert(
      `Your bid must be higher than the current highest bid of ${formatOptionalCurrency(
        currentHighestBid
      )}.`
    );
    return;
  }

  // -------------------------------------------------
  // Bid is valid
  // -------------------------------------------------
  alert(
    `Your bid of ${formatOptionalCurrency(
      enteredBid
    )} has been placed.`
  );

  setBidAmount("");
};


  // =========================================================
// STOP AUCTION - SELLER ONLY
// =========================================================
const stopAuction = () => {
  if (currentHighestBid === null) {
    alert("No bid has been placed yet.");
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to stop this auction at ${formatOptionalCurrency(
      currentHighestBid
    )}?`
  );

  if (!confirmed) return;

  alert(
    `Auction stopped successfully at ${formatOptionalCurrency(
      currentHighestBid
    )}.`
  );
};
  // =========================================================
  // OPTIONAL BACKEND VALUES
  // =========================================================

  const watchers = getNumericValue(
    auction?.watchers ??
      auction?.watcher_count ??
      auction?.watcherCount
  );

  const views = getNumericValue(
    auction?.views ??
      auction?.view_count ??
      auction?.viewCount
  );

  const sellerRating =
    auction?.seller_rating ??
    auction?.sellerRating ??
    auction?.rating ??
    null;

  const itemsSold = getNumericValue(
    auction?.items_sold ??
      auction?.itemsSold ??
      auction?.seller_items_sold
  );

  const sellerVerified =
    auction?.seller_verified ??
    auction?.sellerVerified ??
    auction?.verified_seller;

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="auction-page">
        <div className="auction-container">
          <div style={{ padding: "40px", textAlign: "center" }}>
            Loading auction details...
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error || !auction) {
    return (
      <div className="auction-page">
        <div className="auction-container">
          <div style={{ padding: "40px", textAlign: "center" }}>
            <h2>{error || "Auction not found."}</h2>

            <button
              className="back-btn"
              onClick={() => navigate("/LiveAuctions")}
            >
              <ArrowLeft size={17} />
              Back to Live Auctions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auction-page">
      <div className="auction-container">

        {/* HEADER */}

        <div className="auction-header">
          <button
            className="back-btn"
            onClick={() => navigate("/LiveAuctions")}
          >
            <ArrowLeft size={17} />
            Back to Live Auctions
          </button>

          <button className="share-btn">
            <Share2 size={15} />
            Share Auction
          </button>
        </div>

        <div className="auction-layout">

          {/* LEFT CONTENT */}

          <main className="auction-main">

            {/* PRODUCT */}

            <section className="card product-card">
              <div className="product-gallery">

                <div className="live-tag">
                  <span className="live-dot"></span>
                  LIVE
                </div>

                <button className="expand-btn">
                  <Maximize2 size={16} />
                </button>

                <div className="main-image">
                  <img
                    src={productImages[selectedImage]}
                    alt={auction.product_title || "Product"}
                  />
                </div>

                <div className="thumbnails">
                  <button className="gallery-arrow">
                    <ChevronLeft size={18} />
                  </button>

                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      className={`thumbnail ${
                        selectedImage === index
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedImage(index)
                      }
                    >
                      <img
                        src={image}
                        alt={`Product ${index + 1}`}
                      />
                    </button>
                  ))}

                  <button className="gallery-arrow">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="product-info">

                <div className="auction-status">
                  <span className="auction-id">
                    #AU-{auction.id}
                  </span>

                  <span className="status-live">
                    <span></span>
                    Live Auction
                  </span>
                </div>

                <h1>
                  {auction.product_title || "Product"}

                  <span>
                    {auction.brand_model || ""}
                  </span>
                </h1>

                <div className="product-badges">
                  <span>
                    <Tag size={15} />
                    {auction.category || "Category"}
                  </span>

                  <i>•</i>

                  <span>
                    <BadgeCheck size={15} />
                    {auction.product_condition || "N/A"}
                  </span>
                </div>

                <p className="product-description">
                  {auction.description ||
                    "No product description available."}
                </p>

                <div className="quick-info">

                  <div>
                    <UserRound size={18} />
                    <span>Seller</span>

                    <strong>
                      {auction.seller_name || "N/A"}{" "}
                      <BadgeCheck size={13} />
                    </strong>
                  </div>

                  <div>
                    <MapPin size={18} />
                    <span>Location</span>

                    <strong>
                      {auction.location_city || "N/A"},{" "}
                      {auction.location_state || ""}
                    </strong>
                  </div>

                  <div>
                    <Box size={18} />
                    <span>Item ID</span>

                    <strong>
                      AU-{auction.id}
                    </strong>
                  </div>

                  {watchers !== null && (
                    <div>
                      <Heart size={18} />
                      <span>Watchers</span>

                      <strong>
                        {watchers.toLocaleString("en-IN")}
                      </strong>
                    </div>
                  )}

                  {views !== null && (
                    <div>
                      <Eye size={18} />
                      <span>Views</span>

                      <strong>
                        {views.toLocaleString("en-IN")}
                      </strong>
                    </div>
                  )}

                </div>
              </div>
            </section>

            {/* BIDDING TREND
                ONLY DISPLAY WHEN REAL BID DATA EXISTS */}

            {hasChartData && chartData && (
              <section className="card trend-card">

                <div className="section-title-row">
                  <h2>
                    <TrendingUp size={18} />
                    Current Bidding Trend
                  </h2>

                  <button className="range-select">
                    {timeRange}
                    <ChevronDown size={16} />
                  </button>
                </div>

                <div className="chart-wrapper">

                  <div className="chart-y-axis">
                    {chartData.yAxisLabels.map(
                      (value, index) => (
                        <span key={index}>
                          {formatCurrency(value)}
                        </span>
                      )
                    )}
                  </div>

                  <div className="chart-area">

                    <div className="grid-line"></div>
                    <div className="grid-line"></div>
                    <div className="grid-line"></div>
                    <div className="grid-line"></div>
                    <div className="grid-line"></div>

                    <svg
                      viewBox="0 0 800 250"
                      preserveAspectRatio="none"
                      className="trend-svg"
                    >

                      <defs>
                        <linearGradient
                          id="chartGradient"
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#5b35d5"
                            stopOpacity="0.24"
                          />

                          <stop
                            offset="100%"
                            stopColor="#5b35d5"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>

                      <path
                        className="area-path"
                        d={chartData.areaPath}
                        fill="url(#chartGradient)"
                      />

                      <path
                        className="line-path"
                        d={chartData.linePath}
                      />

                    </svg>
                  </div>
                </div>

                <div className="chart-labels">
                  {chartData.labels.map(
                    (value, index) => (
                      <span key={index}>
                        {formatDateTime(value)}
                      </span>
                    )
                  )}
                </div>

                <div className="trend-stats">

                  {totalBids !== null && (
                    <div>
                      <IndianRupee size={19} />
                      <span>Total Bids</span>
                      <strong>{totalBids}</strong>
                    </div>
                  )}

                  {totalBidders !== null && (
                    <div>
                      <Users size={19} />
                      <span>Total Bidders</span>
                      <strong>{totalBidders}</strong>
                    </div>
                  )}

                  {lastBid && (
                    <div>
                      <Clock3 size={19} />
                      <span>Last Bid</span>
                      <strong>
                        {formatRelativeTime(lastBid.time)}
                      </strong>
                    </div>
                  )}

                  {calculatedPriceChange !== null && (
                    <div>
                      <ShieldCheck size={19} />
                      <span>Price Change</span>

                      <strong className="green">
                        {calculatedPriceChange >= 0
                          ? "+"
                          : ""}
                        {calculatedPriceChange.toFixed(2)}
                        %
                      </strong>
                    </div>
                  )}

                </div>
              </section>
            )}

            {/* ITEM DETAILS */}

            <section className="card item-details-card">

              <div className="item-details-header">

                <div className="item-details-header-left">

                  <div className="item-details-icon-box">
                    <Laptop size={22} />
                  </div>

                  <div className="item-details-title-group">

                    <h3>
                      {auction.product_title || "Product"}

                      <span className="item-details-category-badge">
                        {auction.category || "Category"}
                      </span>
                    </h3>

                    <p>
                      {auction.brand_model || "N/A"}
                    </p>

                  </div>
                </div>

                <div className="item-details-price-box">
                  <span>Starting Price</span>

                  <strong>
                    {formatCurrency(
                      auction.starting_price
                    )}
                  </strong>
                </div>

              </div>

              <div className="item-details-body">

                <div className="item-details-columns">

                  <div className="item-details-column">

                    <h4 className="item-details-column-title">
                      Product Info
                    </h4>

                    {productInfoRows.map(
                      ([label, value, icon]) => (
                        <div
                          className="item-detail-row"
                          key={label}
                        >
                          <span className="item-detail-label">
                            {icon}
                            {label}
                          </span>

                          <strong>{value}</strong>
                        </div>
                      )
                    )}

                  </div>

                  <div className="item-details-column">

                    <h4 className="item-details-column-title">
                      Auction Details
                    </h4>

                    {auctionDetailRows.map(
                      ([label, value, icon]) => (
                        <div
                          className="item-detail-row"
                          key={label}
                        >
                          <span className="item-detail-label">
                            {icon}
                            {label}
                          </span>

                          <strong
                            className={
                              label ===
                              "Terms Accepted"
                                ? "accepted"
                                : ""
                            }
                          >
                            {value}
                          </strong>
                        </div>
                      )
                    )}

                  </div>

                  <div className="item-details-column">

                    <h4 className="item-details-column-title">
                      Location &amp; Shipping
                    </h4>

                    {locationShippingRows.map(
                      ([label, value, icon]) => (
                        <div
                          className="item-detail-row"
                          key={label}
                        >
                          <span className="item-detail-label">
                            {icon}
                            {label}
                          </span>

                          <strong>{value}</strong>
                        </div>
                      )
                    )}

                  </div>

                </div>

                <div className="item-details-footer">

                  <div className="item-details-footer-box">

                    <h5>
                      <FileText size={13} />
                      Description
                    </h5>

                    <p>{productDescription}</p>

                  </div>

                  <div className="item-details-footer-box">

                    <h5>
                      <ShieldCheck size={13} />
                      Product Terms
                    </h5>

                    <p>{productTerms}</p>

                  </div>

                </div>

              </div>
            </section>

            {/* ALL BIDS
                HIDDEN WHEN THERE ARE NO REAL BIDS */}

            {bids.length > 0 && (
              <section className="card all-bids-card">

                <h2 className="section-heading">
                  <FileText size={18} />
                  All Bids{" "}
                  <span>(Highest to Lowest)</span>
                </h2>

                <div className="bids-table-wrapper">

                  <table className="bids-table">

                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Bidder</th>
                        <th>Bid Amount</th>
                        <th>Bid Time</th>
                      </tr>
                    </thead>

                    <tbody>

                      {bids.map((bid, index) => (
                        <tr
                          key={`${bid.id}-${index}`}
                        >

                          <td>
                            <span
                              className={`rank rank-${
                                index + 1
                              }`}
                            >
                              {index + 1}
                            </span>
                          </td>

                          <td>
                            {bid.name || "Bidder"}
                          </td>

                          <td>
                            {bid.displayAmount}
                          </td>

                          <td>
                            {bid.time
                              ? formatDateTime(
                                  bid.time
                                )
                              : ""}
                          </td>

                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>

                <button className="view-all-btn">
                  View All Bids
                  <ArrowRight size={17} />
                </button>

              </section>
            )}

          </main>

          {/* RIGHT SIDEBAR */}

          <aside className="auction-sidebar">

            {/* BID CARD */}

            <section className="card bid-card">

              {currentHighestBid !== null && (
                <>
                  <p className="side-label">
                    Current Highest Bid
                  </p>

                  <h2 className="highest-bid">
                    {formatOptionalCurrency(
                      currentHighestBid
                    )}
                  </h2>

                  <div className="divider"></div>
                </>
              )}

              <div className="starting-bid">
                <span>Starting Bid</span>

                <strong>
                  {formatCurrency(
                    auction.starting_price
                  )}
                </strong>
              </div>

              <div className="divider"></div>

              <p className="ends-label">
                Auction Ends In
              </p>

              <div className="countdown">

                <div>
                  <strong>
                    {String(timeLeft.days).padStart(2, "0")}
                  </strong>
                  <span>Days</span>
                </div>

                <div>
                  <strong>
                    {String(timeLeft.hours).padStart(2, "0")}
                  </strong>
                  <span>Hours</span>
                </div>

                <div>
                  <strong>
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </strong>
                  <span>Mins</span>
                </div>

                <div>
                  <strong>
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </strong>
                  <span>Secs</span>
                </div>

              </div>

              <div className="divider"></div>

              {isSeller ? (
  // =====================================================
  // SELLER VIEW
  // =====================================================
  <button
    className="place-bid-btn"
    onClick={stopAuction}
  >
    <Zap size={18} />
    Stop Auction
  </button>
) : (
  // =====================================================
  // BUYER VIEW
  // =====================================================
  <>
    <label className="bid-label">
      Your Bid
    </label>

    <div className="bid-input">
      <span>₹</span>

      <input
        type="number"
        placeholder="Enter your bid amount"
        value={bidAmount}
        onChange={(e) =>
          setBidAmount(e.target.value)
        }
      />
    </div>

    {minimumBid !== null && (
      <small>
        Minimum bid:{" "}
        {formatOptionalCurrency(minimumBid)}
      </small>
    )}

    <button
      className="place-bid-btn"
      onClick={placeBid}
    >
      <Zap size={18} />
      Place a Bid
    </button>
  </>
)}

              <button
                className={`watchlist-btn ${
                  watchlist ? "selected" : ""
                }`}
                onClick={() =>
                  setWatchlist(!watchlist)
                }
              >
                <Heart
                  size={18}
                  fill={
                    watchlist
                      ? "currentColor"
                      : "none"
                  }
                />

                {watchlist
                  ? "Added to Watchlist"
                  : "Add to Watchlist"}
              </button>

              <div className="secure-note">

                <ShieldCheck size={20} />

                <span>
                  Your bid is secured and only visible to
                  you until the auction ends.
                </span>

              </div>

            </section>

            {/* BID HISTORY
                HIDDEN WHEN THERE ARE NO REAL BIDS */}

            {bids.length > 0 && (
              <section className="card bid-history-card">

                <h2 className="section-heading">
                  <TrendingUp size={18} />
                  Bid History{" "}
                  <span>(Highest First)</span>
                </h2>

                <div className="history-list">

                  {bids.map((bid, index) => (
                    <div
                      className="history-item"
                      key={`${bid.id}-${index}`}
                    >

                      <div
                        className={`bid-avatar ${
                          bid.className
                        }`}
                      >
                        {bid.initials}
                      </div>

                      <div className="history-user">
                        <strong>
                          {bid.name || "Bidder"}
                        </strong>
                      </div>

                      <div className="history-price">

                        <strong>
                          {bid.displayAmount}
                        </strong>

                        <span>
                          {bid.displayTime}
                        </span>

                      </div>

                    </div>
                  ))}

                </div>

                <button className="history-view-btn">
                  View All Bids
                  <ArrowRight size={16} />
                </button>

              </section>
            )}

            {/* SELLER */}

            <section className="card seller-card">

              <h2 className="section-heading">
                <UserRound size={18} />
                Seller Information
              </h2>

              <div className="seller-main">

                <div className="seller-avatar">
                  <UserRound size={34} />
                </div>

                <div>

                  <h3>
                    {auction.seller_name || "N/A"}

                    <BadgeCheck size={17} />
                  </h3>

                  <span>Seller</span>

                </div>

              </div>

              <div className="seller-contact">

                {auction.seller_email && (
                  <div>
                    <Mail size={16} />

                    <span>
                      {auction.seller_email}
                    </span>
                  </div>
                )}

                {auction.seller_contact && (
                  <div>
                    <Phone size={16} />

                    <span>
                      {auction.seller_contact}
                    </span>
                  </div>
                )}

              </div>

              {(sellerRating !== null ||
                itemsSold !== null ||
                sellerVerified !==
                  undefined &&
                  sellerVerified !== null) && (
                <>
                  <div className="seller-divider"></div>

                  <div className="seller-stats">

                    {sellerRating !== null && (
                      <div>
                        <Star size={18} />

                        <strong>
                          {sellerRating}
                        </strong>

                        <span>Rating</span>
                      </div>
                    )}

                    {itemsSold !== null && (
                      <div>
                        <Package size={18} />

                        <strong>
                          {itemsSold.toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                        <span>Items Sold</span>
                      </div>
                    )}

                    {sellerVerified !==
                      undefined &&
                      sellerVerified !== null && (
                        <div>
                          <ShieldCheck size={18} />

                          <strong>
                            {sellerVerified
                              ? "✓"
                              : "No"}
                          </strong>

                          <span>
                            Verified Seller
                          </span>
                        </div>
                      )}

                  </div>
                </>
              )}

            </section>

            {/* SECURITY */}

            <section className="card secure-card">

              <h2 className="section-heading">
                <ShieldCheck size={19} />
                Safe &amp; Secure Bidding
              </h2>

              <ul>

                <li>
                  <CheckCircle2 size={17} />
                  Your bids are encrypted and secure
                </li>

                <li>
                  <CheckCircle2 size={17} />
                  Only you can see your bids
                </li>

                <li>
                  <CheckCircle2 size={17} />
                  No commitment until you win
                </li>

                <li>
                  <CheckCircle2 size={17} />
                  Fair and transparent process
                </li>

              </ul>

              <div className="support-link">
                <Headphones size={20} />
                Need Help? Contact Support
              </div>

            </section>

          </aside>

        </div>
      </div>
    </div>
  );
};

export default LiveAuctionDetails;