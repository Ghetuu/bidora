import React, { useState } from "react";
import "../styles/createauction.css";

const CreateAuction = () => {
  const [images, setImages] = useState([]);

  const [formData, setFormData] = useState({
    productTitle: "",
    category: "",
    condition: "",
    description: "",
    warranty: "",

    basePrice: "",
    reservePrice: "",
    auctionStart: "",
    auctionEnd: "",

    sellerName: "",
    sellerEmail: "",
    contactNumber: "",
    city: "",
    state: "",
    pinCode: "",

    deliveryType: "Local pickup",
    estimatedDelivery: "",
    shippingTerms: "Free shipping",
    shippingCharges: "",
    chargesPaidBy: "",
    serviceProvider: "",
  });

  // =====================================================
  // HANDLE INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // IMAGE UPLOAD
  // =====================================================

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);

    const validImages = files.filter((file) =>
      ["image/jpeg", "image/png", "image/jpg"].includes(file.type)
    );

    const availableSlots = 12 - images.length;

    const selectedImages = validImages
      .slice(0, availableSlots)
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
      }));

    setImages((prev) => [...prev, ...selectedImages]);

    e.target.value = "";
  };

  // =====================================================
  // REMOVE IMAGE
  // =====================================================

  const removeImage = (index) => {
    setImages((prev) => {
      const imageToRemove = prev[index];

      if (imageToRemove?.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }

      return prev.filter((_, imageIndex) => imageIndex !== index);
    });
  };

  // =====================================================
  // SUBMIT AUCTION
  // =====================================================

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Auction Data:", formData);
    console.log("Images:", images);

    alert("Auction published successfully!");
  };

  // =====================================================
  // SAVE DRAFT
  // =====================================================

  const saveDraft = () => {
    console.log("Draft saved:", formData);

    alert("Auction saved as draft.");
  };

  return (
    <div className="auction-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="auction-page-header">

        <div className="auction-header-content">

          <span className="auction-new-listing">
            NEW LISTING
          </span>

          <h1>
            Create auction
          </h1>

          <p>
            Create a trusted listing with accurate product details,
            clear pricing, images and delivery information.
          </p>

        </div>

        <div className="auction-header-actions">

          <button
            type="button"
            className="auction-save-btn"
            onClick={saveDraft}
          >
            Save draft
          </button>

          <button
            type="submit"
            form="create-auction-form"
            className="auction-publish-btn"
          >
            Publish auction
          </button>

        </div>

      </div>

      {/* =====================================================
          AUCTION FORM
      ===================================================== */}

      <form
        id="create-auction-form"
        className="auction-form"
        onSubmit={handleSubmit}
      >

        {/* =================================================
            LEFT COLUMN
        ================================================= */}

        <div className="auction-left-column">

          {/* =================================================
              ITEM DETAILS
          ================================================= */}

          <section className="auction-card">

            <div className="auction-card-title">

              <div className="auction-card-heading">

                <span className="auction-section-icon">
                  ▣
                </span>

                <span>
                  Item details
                </span>

              </div>

              <span className="auction-section-number">
                01
              </span>

            </div>

            {/* PRODUCT TITLE */}

            <div className="auction-field">

              <label htmlFor="productTitle">
                Product title
                <span className="auction-required">*</span>
              </label>

              <input
                id="productTitle"
                type="text"
                name="productTitle"
                value={formData.productTitle}
                onChange={handleChange}
                placeholder="e.g. Canon EOS R5 Mirrorless Body"
                required
              />

            </div>

            {/* CATEGORY + CONDITION */}

            <div className="auction-two-column">

              <div className="auction-field">

                <label htmlFor="category">
                  Category
                  <span className="auction-required">*</span>
                </label>

                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >

                  <option value="">
                    Select category
                  </option>

                  <option value="electronics">
                    Electronics
                  </option>

                  <option value="vehicles">
                    Vehicles
                  </option>

                  <option value="fashion">
                    Fashion
                  </option>

                  <option value="collectibles">
                    Collectibles
                  </option>

                  <option value="furniture">
                    Furniture
                  </option>

                  <option value="books">
                    Books
                  </option>

                  <option value="other">
                    Other
                  </option>

                </select>

              </div>

              <div className="auction-field">

                <label htmlFor="condition">
                  Condition
                  <span className="auction-required">*</span>
                </label>

                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                >

                  <option value="">
                    Select condition
                  </option>

                  <option value="new">
                    New
                  </option>

                  <option value="like-new">
                    Like new
                  </option>

                  <option value="good">
                    Good
                  </option>

                  <option value="fair">
                    Fair
                  </option>

                  <option value="used">
                    Used
                  </option>

                </select>

              </div>

            </div>

            {/* DESCRIPTION */}

            <div className="auction-field">

              <div className="auction-label-row">

                <label htmlFor="description">
                  Description
                </label>

                <span className="auction-character-count">
                  {formData.description.length}/750
                </span>

              </div>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe usage, defects, accessories included, and anything a bidder should know."
                rows="5"
                maxLength="750"
              />

            </div>

            {/* WARRANTY */}

            <div className="auction-field">

              <label htmlFor="warranty">
                Warranty
              </label>

              <input
                id="warranty"
                type="text"
                name="warranty"
                value={formData.warranty}
                onChange={handleChange}
                placeholder="e.g. 5 months brand warranty remaining"
              />

            </div>

          </section>

          {/* =================================================
              LOGISTICS & SCHEDULE
          ================================================= */}

          <section className="auction-card">

            <div className="auction-card-title">

              <div className="auction-card-heading">

                <span className="auction-section-icon">
                  ◫
                </span>

                <span>
                  Logistics & schedule
                </span>

              </div>

              <span className="auction-section-number">
                03
              </span>

            </div>

            {/* PRICE */}

            <div className="auction-two-column">

              <div className="auction-field">

                <label htmlFor="basePrice">
                  Base price (₹)
                  <span className="auction-required">*</span>
                </label>

                <input
                  id="basePrice"
                  type="number"
                  min="0"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleChange}
                  placeholder="0"
                  required
                />

              </div>

              <div className="auction-field">

                <label htmlFor="reservePrice">
                  Reserve price (₹)
                </label>

                <input
                  id="reservePrice"
                  type="number"
                  min="0"
                  name="reservePrice"
                  value={formData.reservePrice}
                  onChange={handleChange}
                  placeholder="Optional"
                />

              </div>

            </div>

            {/* AUCTION DATE */}

            <div className="auction-two-column">

              <div className="auction-field">

                <label htmlFor="auctionStart">
                  Auction starts
                </label>

                <input
                  id="auctionStart"
                  type="datetime-local"
                  name="auctionStart"
                  value={formData.auctionStart}
                  onChange={handleChange}
                />

              </div>

              <div className="auction-field">

                <label htmlFor="auctionEnd">
                  Auction ends
                </label>

                <input
                  id="auctionEnd"
                  type="datetime-local"
                  name="auctionEnd"
                  value={formData.auctionEnd}
                  onChange={handleChange}
                />

              </div>

            </div>

            {/* INFORMATION */}

            <div className="auction-info-message">

              <span className="auction-info-icon">
                ⓘ
              </span>

              <span>
                The auction will not close below the reserve price.
                If it isn't met, bids are released and the item
                stays unsold.
              </span>

            </div>

          </section>

          {/* =================================================
              SELLER INFORMATION
          ================================================= */}

          <section className="auction-card">

            <div className="auction-card-title">

              <div className="auction-card-heading">

                <span className="auction-section-icon">
                  ▣
                </span>

                <span>
                  Logistics & seller
                </span>

              </div>

              <span className="auction-section-number">
                05
              </span>

            </div>

            <h3 className="auction-subtitle">
              Seller information
            </h3>

            {/* NAME + CITY */}

            <div className="auction-two-column">

              <div className="auction-field">

                <label htmlFor="sellerName">
                  Full name
                </label>

                <input
                  id="sellerName"
                  type="text"
                  name="sellerName"
                  value={formData.sellerName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                />

              </div>

              <div className="auction-field">

                <label htmlFor="city">
                  City
                </label>

                <input
                  id="city"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter city"
                />

              </div>

            </div>

            {/* EMAIL + STATE */}

            <div className="auction-two-column">

              <div className="auction-field">

                <label htmlFor="sellerEmail">
                  Email address
                </label>

                <input
                  id="sellerEmail"
                  type="email"
                  name="sellerEmail"
                  value={formData.sellerEmail}
                  onChange={handleChange}
                  placeholder="Enter email"
                />

              </div>

              <div className="auction-field">

                <label htmlFor="state">
                  State
                </label>

                <input
                  id="state"
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Enter state"
                />

              </div>

            </div>

            {/* CONTACT + PIN */}

            <div className="auction-two-column">

              <div className="auction-field">

                <label htmlFor="contactNumber">
                  Contact number
                </label>

                <input
                  id="contactNumber"
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  placeholder="Enter contact number"
                />

              </div>

              <div className="auction-field">

                <label htmlFor="pinCode">
                  PIN code
                </label>

                <input
                  id="pinCode"
                  type="text"
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleChange}
                  placeholder="Enter pincode"
                />

              </div>

            </div>

          </section>

        </div>

        {/* =================================================
            RIGHT COLUMN
        ================================================= */}

        <div className="auction-right-column">

          {/* =================================================
              IMAGES
          ================================================= */}

          <section className="auction-card">

            <div className="auction-card-title">

              <div className="auction-card-heading">

                <span className="auction-section-icon">
                  ▧
                </span>

                <span>
                  Images
                </span>

              </div>

              <span className="auction-section-number">
                02
              </span>

            </div>

            <p className="auction-card-description">
              Up to 12 · JPG / PNG · 5MB each
            </p>

            {/* UPLOAD */}

            <label className="auction-upload-box">

              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png"
                onChange={handleImageUpload}
              />

              <div className="auction-upload-icon">
                ☁
              </div>

              <strong>
                Drop images or browse
              </strong>

              <span>
                First image becomes the listing cover
              </span>

            </label>

            {/* IMAGE PREVIEW */}

            {images.length > 0 && (

              <div className="auction-image-preview-grid">

                {images.map((image, index) => (

                  <div
                    className="auction-image-preview"
                    key={`${image.name}-${index}`}
                  >

                    <img
                      src={image.preview}
                      alt={`Auction item ${index + 1}`}
                    />

                    {index === 0 && (
                      <span className="auction-cover-badge">
                        Cover
                      </span>
                    )}

                    <button
                      type="button"
                      className="auction-remove-image"
                      onClick={() => removeImage(index)}
                      title="Remove image"
                    >
                      ×
                    </button>

                  </div>

                ))}

              </div>

            )}

            {/* DEFAULT IMAGE SLOTS */}

            {images.length === 0 && (

              <div className="auction-cover-grid">

                {[
                  "Main view",
                  "Close-up",
                  "Serial / label",
                  "Packaging",
                  "Accessories",
                  "Defects",
                ].map((item) => (

                  <div
                    className="auction-cover-item"
                    key={item}
                  >

                    <div className="auction-cover-placeholder">
                      ◈
                    </div>

                    <span>
                      {item}
                    </span>

                  </div>

                ))}

              </div>

            )}

            {/* PROOF OF PURCHASE */}

            <div className="auction-proof">

              <h3>
                Proof of purchase
              </h3>

              <p>
                Original bill or ownership document is mandatory
                for verification.
              </p>

              <div className="auction-proof-buttons">

                <label className="auction-proof-button">

                  <span>
                    📎
                  </span>

                  Upload bill

                  <small>
                    JPG / PNG
                  </small>

                  <input
                    type="file"
                    hidden
                    accept=".jpg,.jpeg,.png"
                  />

                </label>

                <label className="auction-proof-button">

                  <span>
                    🔒
                  </span>

                  Upload proof document

                  <small>
                    PDF
                  </small>

                  <input
                    type="file"
                    hidden
                    accept=".pdf"
                  />

                </label>

              </div>

            </div>

          </section>

          {/* =================================================
              DELIVERY
          ================================================= */}

          <section className="auction-card">

            <div className="auction-card-title">

              <div className="auction-card-heading">

                <span className="auction-section-icon">
                  ▣
                </span>

                <span>
                  Delivery
                </span>

              </div>

              <span className="auction-section-number">
                04
              </span>

            </div>

            <p className="auction-card-description">
              Seller & courier
            </p>

            {/* DELIVERY TYPE + ESTIMATED TIME */}

            <div className="auction-two-column">

              <div className="auction-field">

                <label>
                  Delivery type
                </label>

                <div className="auction-toggle-buttons">

                  <button
                    type="button"
                    className={
                      formData.deliveryType === "Local pickup"
                        ? "auction-toggle-active"
                        : ""
                    }
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        deliveryType: "Local pickup",
                      }))
                    }
                  >
                    Local pickup
                  </button>

                  <button
                    type="button"
                    className={
                      formData.deliveryType === "Courier"
                        ? "auction-toggle-active"
                        : ""
                    }
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        deliveryType: "Courier",
                      }))
                    }
                  >
                    Courier
                  </button>

                </div>

              </div>

              <div className="auction-field">

                <label htmlFor="estimatedDelivery">
                  Estimated delivery time
                </label>

                <input
                  id="estimatedDelivery"
                  type="text"
                  name="estimatedDelivery"
                  value={formData.estimatedDelivery}
                  onChange={handleChange}
                  placeholder="e.g. 3–5 days after payment"
                />

              </div>

            </div>

            {/* SHIPPING TERMS */}

            <div className="auction-field">

              <label>
                Shipping terms
              </label>

              <div className="auction-shipping-options">

                {[
                  "Free shipping",
                  "Paid shipping (calculated)",
                  "Custom terms",
                ].map((option) => (

                  <label
                    className="auction-radio-row"
                    key={option}
                  >

                    <input
                      type="radio"
                      name="shippingTerms"
                      value={option}
                      checked={
                        formData.shippingTerms === option
                      }
                      onChange={handleChange}
                    />

                    <span>
                      {option}
                    </span>

                  </label>

                ))}

              </div>

            </div>

            {/* SHIPPING CHARGES */}

            <div className="auction-two-column">

              <div className="auction-field">

                <label htmlFor="shippingCharges">
                  Shipping charges (₹)
                </label>

                <input
                  id="shippingCharges"
                  type="number"
                  min="0"
                  name="shippingCharges"
                  value={formData.shippingCharges}
                  onChange={handleChange}
                  placeholder="0"
                />

              </div>

              <div className="auction-field">

                <label htmlFor="chargesPaidBy">
                  Charges paid by
                </label>

                <select
                  id="chargesPaidBy"
                  name="chargesPaidBy"
                  value={formData.chargesPaidBy}
                  onChange={handleChange}
                >

                  <option value="">
                    Select
                  </option>

                  <option value="buyer">
                    Buyer
                  </option>

                  <option value="seller">
                    Seller
                  </option>

                </select>

              </div>

            </div>

            {/* SERVICE PROVIDER */}

            <div className="auction-field">

              <label htmlFor="serviceProvider">
                Service provider
              </label>

              <input
                id="serviceProvider"
                type="text"
                name="serviceProvider"
                value={formData.serviceProvider}
                onChange={handleChange}
                placeholder="Optional — e.g. Delhivery, BlueDart"
              />

            </div>

          </section>

        </div>

      </form>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="auction-footer">

        <span>
          © 2026 Bidora. All rights reserved.
        </span>

        <span>
          Seller Console v1.0
        </span>

      </footer>

    </div>
  );
};

export default CreateAuction;
