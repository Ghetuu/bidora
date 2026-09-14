import React, { useEffect, useRef, useState } from "react";

import {
  FaCamera,
  FaCheck,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaSave,
} from "react-icons/fa";

import "../styles/ManageProfile.css";

const API_URL = "http://127.0.0.1:8000";

const ManageProfile = () => {

  const fileInputRef = useRef(null);

  const [profileImage, setProfileImage] = useState(null);
  const [profileFile, setProfileFile] = useState(null);

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    address: "",
  });

  // =========================================================
  // LOAD USER
  // =========================================================

  useEffect(() => {

    try {

      const storedUser =
        localStorage.getItem("user");

      if (!storedUser) {
        return;
      }

      const user =
        JSON.parse(storedUser);

      setFormData({
        fullName:
          user.fullname ||
          user.full_name ||
          user.name ||
          "",

        username:
          user.username || "",

        email:
          user.email || "",

        phone:
          user.mobile ||
          user.phone ||
          "",

        address:
          user.address || "",
      });

      if (user.profile_image) {

        setProfileImage(
          user.profile_image.startsWith("http")
            ? user.profile_image
            : `${API_URL}${user.profile_image}`
        );

      }

    } catch (error) {

      console.error(
        "Unable to load profile:",
        error
      );

    }

  }, []);

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleChange = (e) => {

    const {
      name,
      value
    } = e.target;

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
  // =========================================================

  const handlePhotoChange = (e) => {

    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {

      alert(
        "Please select a valid image."
      );

      return;
    }

    // Actual file for backend
    setProfileFile(file);

    // Preview
    const imageUrl =
      URL.createObjectURL(file);

    setProfileImage(imageUrl);

  };

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (loading) {
      return;
    }

    try {

      setLoading(true);

      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {

        alert(
          "Your session has expired. Please login again."
        );

        return;
      }

      // =====================================================
      // FORM DATA
      // =====================================================

      const data = new FormData();

      data.append(
        "fullname",
        formData.fullName
      );

      data.append(
        "username",
        formData.username
      );

      data.append(
        "email",
        formData.email
      );

      data.append(
        "mobile",
        formData.phone
      );

      data.append(
        "address",
        formData.address
      );

      // Add image only if user selected a new image
      if (profileFile) {

        data.append(
          "profile_image",
          profileFile
        );

      }

      // =====================================================
      // API REQUEST
      // =====================================================

      const response = await fetch(
        `${API_URL}/api/users/profile`,
        {
          method: "PUT",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: data,
        }
      );

      const result =
        await response.json();

      // =====================================================
      // ERROR
      // =====================================================

      // =====================================================
// ERROR
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

        localStorage.setItem(
          "user",
          JSON.stringify(
            result.user
          )
        );

        // Update profile image
        if (
          result.user.profile_image
        ) {

          setProfileImage(
            `${API_URL}${result.user.profile_image}`
          );

        }

        // Update form with database values
        setFormData({
          fullName:
            result.user.fullname || "",

          username:
            result.user.username || "",

          email:
            result.user.email || "",

          phone:
            result.user.mobile || "",

          address:
            result.user.address || "",
        });

      }

      // New image has now been uploaded
      setProfileFile(null);

      // Notify Dashboard
      window.dispatchEvent(
        new Event("profileUpdated")
      );

      alert(
        "Profile updated successfully!"
      );

    } catch (error) {

      console.error(
        "Profile update error:",
        error
      );

      alert(
        error.message ||
        "Unable to update profile."
      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="manage-profile-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="manage-profile-header">

        <div>

          <h1>
            Manage Profile
          </h1>

          <p>
            Manage your personal information and account details
          </p>

        </div>

      </div>

      <div className="manage-profile-content">

        {/* ===================================================
            PROFILE CARD
        =================================================== */}

        <div className="manage-profile-card">

          {/* =================================================
              PROFILE TOP
          ================================================= */}

          <div className="manage-profile-top">

            <div className="manage-profile-image-wrapper">

              {profileImage ? (

                <img
                  src={profileImage}
                  alt="Profile"
                  className="manage-profile-image"
                />

              ) : (

                <div className="manage-profile-placeholder">

                  <FaUser />

                </div>

              )}

              <button
                type="button"
                className="manage-profile-edit-btn"
                onClick={handlePhotoClick}
                title="Change profile photo"
              >

                <FaCamera />

              </button>

            </div>

            <h2>

              {formData.fullName ||
                "Your Full Name"}

            </h2>

            <p className="manage-profile-username">

              @{formData.username ||
                "username"}

            </p>

            <div className="manage-profile-verified">

              <FaCheck />

              <span>
                Verified Member
              </span>

            </div>

            <button
              type="button"
              className="manage-profile-change-photo"
              onClick={handlePhotoClick}
            >

              <FaCamera />

              Change Photo

            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="manage-profile-file-input"
            />

          </div>

          <div className="manage-profile-divider"></div>

          {/* =================================================
              FORM
          ================================================= */}

          <form
            className="manage-profile-form"
            onSubmit={handleSubmit}
          >

            {/* FULL NAME */}

            <div className="manage-profile-field">

              <label>
                Full Name
              </label>

              <div className="manage-profile-input-wrapper">

                <FaUser />

                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />

              </div>

            </div>

            {/* USERNAME */}

            <div className="manage-profile-field">

              <label>
                Username
              </label>

              <div className="manage-profile-input-wrapper">

                <span className="manage-profile-at">
                  @
                </span>

                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                />

              </div>

            </div>

            {/* EMAIL */}

            <div className="manage-profile-field">

              <label>
                Email
              </label>

              <div className="manage-profile-input-wrapper">

                <FaEnvelope />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                />

              </div>

            </div>

            {/* PHONE */}

            <div className="manage-profile-field">

              <label>
                Phone
              </label>

              <div className="manage-profile-input-wrapper">

                <FaPhone />

                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />

              </div>

            </div>

            {/* ADDRESS */}

            <div className="manage-profile-field manage-profile-full-width">

              <label>
                Address
              </label>

              <div className="manage-profile-input-wrapper manage-profile-textarea-wrapper">

                <FaMapMarkerAlt />

                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your address"
                  rows="3"
                />

              </div>

            </div>

            {/* SAVE */}

            <div className="manage-profile-actions">

              <button
                type="submit"
                className="manage-profile-save-btn"
                disabled={loading}
              >

                <FaSave />

                {loading
                  ? "Saving..."
                  : "Save Changes"}

              </button>

            </div>

          </form>

        </div>

      </div>

    </div>

  );

};

export default ManageProfile;