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
} from "react-icons/fa";

import "../styles/adminauctionlist.css";

const API_URL = "http://127.0.0.1:8000";

function AdminAuctionList({ status = "all", title = "All Auctions" }) {
  const navigate = useNavigate();

  const [auctions, setAuctions] = useState([]);
  const [filteredAuctions, setFilteredAuctions] = useState([]);
const [selectedRejectionReason, setSelectedRejectionReason] =
  useState(null);
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
     FETCH AUCTIONS
  ========================================================= */

  useEffect(() => {
    fetchAuctions();
  }, [status]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      setError("");

      let url = `${API_URL}/admin/auctions/all`;

      if (status !== "all") {
        url = `${API_URL}/admin/auctions/status/${status}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch auctions");
      }

      const data = await response.json();

      const auctionData = Array.isArray(data)
        ? data
        : data.auctions || [];

      setAuctions(auctionData);
      setFilteredAuctions(auctionData);
      setSelectedAuctions([]);
      setCurrentPage(1);
    } catch (err) {
      console.error("Auction fetch error:", err);
      setError("Unable to load auctions.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     SEARCH FILTER
  ========================================================= */

  useEffect(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      setFilteredAuctions(auctions);
      setCurrentPage(1);
      return;
    }

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

      return (
        product.toLowerCase().includes(search) ||
        brand.toLowerCase().includes(search) ||
        category.toLowerCase().includes(search) ||
        seller.toLowerCase().includes(search) ||
        city.toLowerCase().includes(search) ||
        String(approvedBy).toLowerCase().includes(search) ||
        String(rejectedBy).toLowerCase().includes(search) ||
        rejectionReason.toLowerCase().includes(search)
      );
    });

    setFilteredAuctions(filtered);
    setCurrentPage(1);
  }, [searchTerm, auctions]);

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const handleView = (auction) => {
    navigate(`/admin/dashboard/auctions/${auction.id}`, {
      state: { auction },
    });
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
      const response = await fetch(
        `${API_URL}/admin/auctions/${auction.id}`,
        {
          method: "DELETE",
        }
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
    return (
      auction.approved_by_name ||
      auction.approved_by ||
      auction.approver_name ||
      auction.approvedBy ||
      "Automatic"
    );
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

  const isApprovedPage =
    status.toLowerCase() === "approved";

  const isRejectedPage =
    status.toLowerCase() === "rejected";

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

        <div className="auction-search">
          <FaSearch />

          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
          />
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

                      <td>
                        <div className="auction-action-buttons">

                          <button
                            className="auction-action-btn auction-view-action"
                            onClick={() =>
                              handleView(auction)
                            }
                            title="View Auction"
                            type="button"
                          >
                            <FaEye />
                          </button>

                          <button
                            className="auction-action-btn auction-update-action"
                            onClick={() =>
                              handleUpdate(auction)
                            }
                            title="Update Auction"
                            type="button"
                          >
                            <FaEdit />
                          </button>

                          <button
                            className="auction-action-btn auction-delete-action"
                            onClick={() =>
                              handleDelete(auction)
                            }
                            title="Delete Auction"
                            type="button"
                          >
                            <FaTrash />
                          </button>

                        </div>
                      </td>

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

    </div>
  );
}

export default AdminAuctionList;