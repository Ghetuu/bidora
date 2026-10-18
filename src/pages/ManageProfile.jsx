import React, { useEffect, useRef, useState } from "react";

import {
  FaCamera,
  FaCheck,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaSave,
  FaGavel,
  FaShieldAlt,
  FaHeadset,
  FaLock,
  FaBell,
  FaHistory,
  FaHeart,
  FaEye,
  FaChartBar,
  FaCalendarAlt,
  FaArrowRight,
  FaInfoCircle,
  FaTimes,
  FaIdBadge,
} from "react-icons/fa";

import "../styles/ManageProfile.css";

const API_URL = "http://127.0.0.1:8000";

const ManageProfile = () => {
  const fileInputRef = useRef(null);
  const imagePreviewRef = useRef(null);

  const [profileImage, setProfileImage] = useState(null);
  const [profileFile, setProfileFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [profileStats, setProfileStats] = useState({
  totalBids: null,
  wonAuctions: null,
});

const [statsLoading, setStatsLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    address: "",
  });

  const [accountInfo, setAccountInfo] = useState({
    emailVerified: false,
    mobileVerified: false,
    accountStatus: "Active",
    registrationDate: "",
  });

  // =========================================================
  // LOAD USER
  // Existing session storage logic preserved
  // =========================================================

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem("user");

      if (!storedUser) {
        return;
      }

      const user = JSON.parse(storedUser);

      setFormData({
        fullName:
          user.fullname ||
          user.full_name ||
          user.name ||
          "",

        username: user.username || "",

        email: user.email || "",

        phone: user.mobile || user.phone || "",

        address: user.address || "",
      });

      setAccountInfo({
        emailVerified:
          user.email_verified === true ||
          user.email_verified === 1,

        mobileVerified:
          user.mobile_verified === true ||
          user.mobile_verified === 1 ||
          user.mobile_verified === "true",

        accountStatus: user.account_status || "Active",

        registrationDate:
          user.registration_date || user.created_at || "",
      });

      if (user.profile_image) {
        setProfileImage(
          user.profile_image.startsWith("http")
            ? user.profile_image
            : `${API_URL}${user.profile_image}`
        );
      }
    } catch (error) {
      console.error("Unable to load profile:", error);
    }

    return () => {
      if (imagePreviewRef.current) {
        URL.revokeObjectURL(imagePreviewRef.current);
      }
    };
  }, []);

  // =========================================================
// LOAD USER DASHBOARD STATISTICS
// Uses the existing dashboard API
// =========================================================

useEffect(() => {
  const fetchProfileStats = async () => {
    try {
      const token =
        sessionStorage.getItem("access_token") ||
        localStorage.getItem("access_token");

      if (!token) {
        return;
      }

      const response = await fetch(
        `${API_URL}/api/user-dashboard`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Unable to load profile statistics (${response.status})`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error("Dashboard statistics are unavailable.");
      }

      const summary = data.summary || {};

      setProfileStats({
        totalBids: Number(summary.total_bids || 0),
        wonAuctions: Number(summary.won_auctions || 0),
      });
    } catch (error) {
      console.error("Profile statistics error:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  fetchProfileStats();
}, []);

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // PHOTO BUTTON
  // =========================================================

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  // =========================================================
  // PHOTO CHANGE
  // Existing upload behavior preserved
  // =========================================================

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5 MB.");
      e.target.value = "";
      return;
    }

    if (imagePreviewRef.current) {
      URL.revokeObjectURL(imagePreviewRef.current);
    }

    setProfileFile(file);

    const imageUrl = URL.createObjectURL(file);

    imagePreviewRef.current = imageUrl;

    setProfileImage(imageUrl);
  };

  // =========================================================
  // SAVE PROFILE
  // Existing API endpoint, fields and authentication preserved
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    try {
      setLoading(true);

      const token = sessionStorage.getItem("access_token");

      if (!token) {
        alert(
          "Your session has expired. Please login again."
        );
        return;
      }

      const data = new FormData();

      data.append("fullname", formData.fullName);
      data.append("username", formData.username);
      data.append("email", formData.email);
      data.append("mobile", formData.phone);
      data.append("address", formData.address);

      if (profileFile) {
        data.append("profile_image", profileFile);
      }

      const response = await fetch(
        `${API_URL}/api/users/profile`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
          },

          body: data,
        }
      );

      const result = await response.json();

      // =====================================================
      // ERROR HANDLING
      // =====================================================

      if (!response.ok) {
        console.log("PROFILE UPDATE ERROR:", result);

        if (result.detail) {
          if (Array.isArray(result.detail)) {
            const messages = result.detail
              .map((err) => {
                if (typeof err === "string") {
                  return err;
                }

                const field = err.loc
                  ? err.loc[err.loc.length - 1]
                  : "Field";

                return `${field}: ${
                  err.msg || "Invalid profile data"
                }`;
              })
              .join("\n");

            alert(messages);
          } else {
            alert(String(result.detail));
          }
        } else {
          alert("Profile update failed.");
        }

        return;
      }

      // =====================================================
      // UPDATED USER
      // =====================================================

      if (result.user) {
        sessionStorage.setItem(
          "user",
          JSON.stringify(result.user)
        );

        if (result.user.profile_image) {
          const savedImage =
            result.user.profile_image.startsWith("http")
              ? result.user.profile_image
              : `${API_URL}${result.user.profile_image}`;

          setProfileImage(savedImage);
        }

        setFormData({
          fullName: result.user.fullname || "",
          username: result.user.username || "",
          email: result.user.email || "",
          phone: result.user.mobile || "",
          address: result.user.address || "",
        });

        setAccountInfo({
          emailVerified:
            result.user.email_verified === true ||
            result.user.email_verified === 1,

          mobileVerified:
            result.user.mobile_verified === true ||
            result.user.mobile_verified === 1 ||
            result.user.mobile_verified === "true",

          accountStatus:
            result.user.account_status || "Active",

          registrationDate:
            result.user.registration_date ||
            result.user.created_at ||
            "",
        });
      }

      setProfileFile(null);

      if (imagePreviewRef.current) {
        URL.revokeObjectURL(imagePreviewRef.current);
        imagePreviewRef.current = null;
      }

      // Notify Dashboard
      window.dispatchEvent(new Event("profileUpdated"));

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);

      alert(
        error.message || "Unable to update profile."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // DISPLAY HELPERS
  // =========================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Not available";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return String(dateValue);
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const accountStatus = String(
    accountInfo.accountStatus || "Active"
  );

  const isActive =
    accountStatus.toLowerCase() === "active" ||
    accountStatus.toLowerCase() === "approved";

  return (
    <div className="manage-profile-page">
      {/* =====================================================
          PAGE BANNER
      ===================================================== */}

      <section className="mp-page-banner">
        <div className="mp-banner-icon">
          <FaUser />
        </div>

        <div className="mp-banner-content">
          <div className="mp-banner-eyebrow">
            BIDORA ACCOUNT
          </div>

          <h1>Manage Profile</h1>

          <p>
            Keep your information up to date for a better
            auction experience.
          </p>
        </div>

        <div className="mp-banner-watermark">
          <FaGavel />
        </div>
      </section>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="mp-layout">
        {/* ===================================================
            LEFT COLUMN
        =================================================== */}

        <main className="mp-main-column">
          {/* PROFILE INFORMATION */}

          <section className="mp-card mp-profile-card">
            <div className="mp-card-heading">
              <div className="mp-heading-icon">
                <FaUser />
              </div>

              <div>
                <h2>Profile Information</h2>

                <p>
                  Update your personal and contact details.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mp-profile-form-layout">
                {/* PROFILE PHOTO */}

                <div className="mp-photo-panel">
                  <div className="mp-profile-photo-wrapper">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="mp-profile-photo"
                      />
                    ) : (
                      <div className="mp-profile-placeholder">
                        <FaUser />
                      </div>
                    )}

                    <button
                      type="button"
                      className="mp-camera-button"
                      onClick={handlePhotoClick}
                      title="Change profile photo"
                      aria-label="Change profile photo"
                    >
                      <FaCamera />
                    </button>
                  </div>

                  <h3>
                    {formData.fullName || "Your Full Name"}
                  </h3>

                  <p className="mp-profile-handle">
                    @{formData.username || "username"}
                  </p>

                  <div className="mp-member-badge">
                    <FaCheck />
                    <span>Bidora Member</span>
                  </div>

                  <button
                    type="button"
                    className="mp-change-photo-button"
                    onClick={handlePhotoClick}
                  >
                    <FaCamera />
                    Change Photo
                  </button>

                  <span className="mp-photo-hint">
                    JPG, PNG or WebP · Max 5 MB
                  </span>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="mp-file-input"
                  />
                </div>

                {/* INPUT FIELDS */}

                <div className="mp-fields-grid">
                  <div className="mp-field">
                    <label htmlFor="mp-fullname">
                      Full Name <span>*</span>
                    </label>

                    <div className="mp-input-wrap">
                      <FaUser />

                      <input
                        id="mp-fullname"
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        autoComplete="name"
                        required
                      />
                    </div>
                  </div>

                  <div className="mp-field">
                    <label htmlFor="mp-username">
                      Username <span>*</span>
                    </label>

                    <div className="mp-input-wrap">
                      <FaIdBadge />

                      <input
                        id="mp-username"
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Enter username"
                        autoComplete="username"
                        required
                      />
                    </div>
                  </div>

                  <div className="mp-field">
                    <label htmlFor="mp-email">
                      Email Address <span>*</span>
                    </label>

                    <div className="mp-input-wrap">
                      <FaEnvelope />

                      <input
                        id="mp-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email address"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  <div className="mp-field">
                    <label htmlFor="mp-phone">
                      Mobile Number <span>*</span>
                    </label>

                    <div className="mp-input-wrap">
                      <FaPhone />

                      <input
                        id="mp-phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter mobile number"
                        autoComplete="tel"
                        required
                      />
                    </div>
                  </div>

                  <div className="mp-field mp-field-full">
                    <label htmlFor="mp-address">
                      Address
                    </label>

                    <div className="mp-input-wrap mp-textarea-wrap">
                      <FaMapMarkerAlt />

                      <textarea
                        id="mp-address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter your complete address"
                        rows={3}
                      />
                    </div>

                    <span className="mp-field-hint">
                      Your address helps with delivery-related
                      information.
                    </span>
                  </div>

                  <div className="mp-form-footer">
                    <p>
                      <FaInfoCircle />
                      Your information is handled securely.
                    </p>

                    <button
                      type="submit"
                      className="mp-save-button"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="mp-spinner" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </section>

          {/* ACCOUNT SETTINGS */}

          <section className="mp-card mp-account-card">
            <div className="mp-card-heading">
              <div className="mp-heading-icon mp-security-heading-icon">
                <FaShieldAlt />
              </div>

              <div>
                <h2>Account Settings</h2>

                <p>
                  Review your account verification and security.
                </p>
              </div>
            </div>

            <div className="mp-setting-row">
              <div className="mp-setting-icon">
                <FaEnvelope />
              </div>

              <div className="mp-setting-info">
                <h3>Email Verification</h3>

                <p>
                  {accountInfo.emailVerified
                    ? "Your email address is verified."
                    : "Email verification status is not confirmed."}
                </p>
              </div>

              <span
                className={`mp-status-badge ${
                  accountInfo.emailVerified
                    ? "mp-status-success"
                    : "mp-status-pending"
                }`}
              >
                <FaCheck />

                {accountInfo.emailVerified
                  ? "Verified"
                  : "Unconfirmed"}
              </span>
            </div>

            <div className="mp-setting-row">
              <div className="mp-setting-icon">
                <FaPhone />
              </div>

              <div className="mp-setting-info">
                <h3>Mobile Verification</h3>

                <p>
                  {accountInfo.mobileVerified
                    ? "Your mobile number is verified."
                    : "Mobile verification status is not confirmed."}
                </p>
              </div>

              <span
                className={`mp-status-badge ${
                  accountInfo.mobileVerified
                    ? "mp-status-success"
                    : "mp-status-pending"
                }`}
              >
                {accountInfo.mobileVerified && <FaCheck />}

                {accountInfo.mobileVerified
                  ? "Verified"
                  : "Unconfirmed"}
              </span>
            </div>

            <div className="mp-setting-row">
              <div className="mp-setting-icon">
                <FaLock />
              </div>

              <div className="mp-setting-info">
                <h3>Password & Security</h3>

                <p>
                  Keep your login credentials private and secure.
                </p>
              </div>

              <span className="mp-setting-note">
                <FaShieldAlt />
                Protected
              </span>
            </div>

            <div className="mp-setting-row mp-setting-row-last">
              <div className="mp-setting-icon">
                <FaUser />
              </div>

              <div className="mp-setting-info">
                <h3>Account Status</h3>

                <p>
                  Your current account status.
                </p>
              </div>

              <span
                className={`mp-status-badge ${
                  isActive
                    ? "mp-status-success"
                    : "mp-status-pending"
                }`}
              >
                {isActive && <FaCheck />}
                {accountStatus}
              </span>
            </div>
          </section>

          {/* ADDITIONAL INFORMATION */}

          <section className="mp-card mp-additional-card">
            <div className="mp-card-heading">
              <div className="mp-heading-icon mp-info-heading-icon">
                <FaInfoCircle />
              </div>

              <div>
                <h2>Additional Information</h2>

                <p>
                  Your account details at a glance.
                </p>
              </div>
            </div>

            <div className="mp-additional-grid">
              <div className="mp-additional-item">
                <FaCalendarAlt />

                <div>
                  <span>Date of Registration</span>

                  <strong>
                    {formatDate(accountInfo.registrationDate)}
                  </strong>
                </div>
              </div>

              <div className="mp-additional-item">
                <FaEnvelope />

                <div>
                  <span>Email Address</span>

                  <strong>
                    {accountInfo.emailVerified
                      ? "Verified"
                      : "Not confirmed"}
                  </strong>
                </div>
              </div>

              <div className="mp-additional-item">
                <FaPhone />

                <div>
                  <span>Mobile Number</span>

                  <strong>
                    {accountInfo.mobileVerified
                      ? "Verified"
                      : "Not confirmed"}
                  </strong>
                </div>
              </div>

              <div className="mp-additional-item">
                <FaUser />

                <div>
                  <span>Profile Picture</span>

                  <strong>
                    {profileImage ? "Uploaded" : "Not uploaded"}
                  </strong>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* ===================================================
            RIGHT SIDEBAR
        =================================================== */}

        <aside className="mp-sidebar">
          {/* QUICK STATS */}

          <section className="mp-card mp-stats-card">
            <div className="mp-sidebar-heading">
              <FaChartBar />
              <h2>Quick Stats</h2>
            </div>

            <p className="mp-stats-description">
              Your auction activity at a glance.
            </p>

            <div className="mp-stats-grid">
              <div className="mp-stat-box mp-stat-purple">
                <div className="mp-stat-icon">
                  <FaGavel />
                </div>

                <strong>
  {statsLoading
    ? "..."
    : (profileStats.totalBids ?? 0).toLocaleString("en-IN")}
</strong>
                <span>Total Bids Placed</span>
              </div>

              <div className="mp-stat-box mp-stat-green">
                <div className="mp-stat-icon">
                  <FaCheck />
                </div>

                <strong>
  {statsLoading
    ? "..."
    : (profileStats.wonAuctions ?? 0).toLocaleString("en-IN")}
</strong>

                <span>Auctions Won</span>
              </div>

              </div>

            <p className="mp-stats-footnote">
              Activity statistics are not connected to this
              page's existing API.
            </p>
          </section>

          {/* SECURITY CARD */}

          <section className="mp-card mp-security-card">
            <div className="mp-sidebar-heading">
              <FaShieldAlt />
              <h2>Your Security Matters</h2>
            </div>

            <div className="mp-security-content">
              <div>
                <p>
                  Your account information is protected by
                  Bidora's authentication system.
                </p>

                <div className="mp-security-points">
                  <span>
                    <FaCheck />
                    Authenticated requests
                  </span>

                  <span>
                    <FaCheck />
                    Secure profile updates
                  </span>
                </div>
              </div>

              <div className="mp-security-illustration">
                <FaLock />
              </div>
            </div>
          </section>

          {/* HELP CARD */}

          <section className="mp-card mp-help-card">
            <div className="mp-sidebar-heading">
              <FaHeadset />
              <h2>Need Help?</h2>
            </div>

            <p>
              Having trouble with your profile? Our support team
              is here to help.
            </p>

            <div className="mp-help-contact">
              <FaEnvelope />
              <span>
                Check the Help & Support section for assistance.
              </span>
            </div>
          </section>

          {/* QUICK LINKS */}

          <section className="mp-card mp-quick-links-card">
            <div className="mp-sidebar-heading">
              <FaArrowRight />
              <h2>Quick Links</h2>
            </div>

            <div className="mp-quick-link">
              <FaLock />
              <span>Password & Security</span>
              <FaArrowRight className="mp-link-arrow" />
            </div>

            <div className="mp-quick-link">
              <FaBell />
              <span>Notifications</span>
              <FaArrowRight className="mp-link-arrow" />
            </div>

            <div className="mp-quick-link">
              <FaHistory />
              <span>Account Activity</span>
              <FaArrowRight className="mp-link-arrow" />
            </div>

            <div className="mp-quick-link mp-quick-link-last">
              <FaShieldAlt />
              <span>Privacy & Security</span>
              <FaArrowRight className="mp-link-arrow" />
            </div>
          </section>

          {/* PROFILE TIP */}

          <section className="mp-profile-tip">
            <div className="mp-tip-icon">
              <FaUser />
            </div>

            <h3>Complete Your Profile</h3>

            <p>
              Keep your contact information up to date to enjoy a
              smoother auction experience.
            </p>
          </section>
        </aside>
      </div>

      {/* =====================================================
          BOTTOM SAVE BAR
      ===================================================== */}

      <div className="mp-bottom-bar">
        <div className="mp-bottom-message">
          <FaShieldAlt />

          <span>
            Remember to save your changes before leaving.
          </span>
        </div>

        <button
          type="button"
          className="mp-bottom-save-button"
          disabled={loading}
          onClick={() => {
            document
              .querySelector(".mp-profile-card form")
              ?.requestSubmit();
          }}
        >
          {loading ? (
            <>
              <span className="mp-spinner" />
              Saving...
            </>
          ) : (
            <>
              <FaSave />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ManageProfile;
