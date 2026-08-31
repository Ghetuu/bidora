import React, { useState } from "react";
import "../styles/createauction.css";

const CreateAuction = () => {
  const [images, setImages] = useState([]);
  const [purchaseProof, setPurchaseProof] = useState(null);
  const [sellerProof, setSellerProof] = useState(null);
  const [sellerImage, setSellerImage] = useState(null);

  const [formData, setFormData] = useState({
    productTitle: "",
    category: "",
    description: "",
    condition: "",

    purchaseDate: "",
    purchasedBy: "",
    purchasePrice: "",

    startingPrice: "",
    auctionStart: "",
    auctionEnd: "",

    productLocation: "",
    deliveryType: "Pickup Only",

    shippingType: "Free",
    shippingCharges: "",

    sellerName: "",
    sellerEmail: "",
    contactNumber: "",

    area: "",
    city: "",
    state: "",
    country: "India",
    pinCode: "",

    warrantyStatus: "",
    warrantyDetails: "",

    paymentMethod: "",
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
      ["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(
        file.type
      )
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
  // PURCHASE PROOF
  // =====================================================

  const handlePurchaseProof = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      setPurchaseProof(file);
    }
  };

  // =====================================================
  // SELLER PROOF
  // =====================================================

  const handleSellerProof = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      setSellerProof(file);
    }
  };

  // =====================================================
  // SELLER IMAGE
  // =====================================================

  const handleSellerImage = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      setSellerImage({
        file,
        preview: URL.createObjectURL(file),
      });
    }
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = (e) => {
    e.preventDefault();

    if (images.length < 3) {
      alert("Please upload at least 3 product images.");
      return;
    }

    if (!purchaseProof) {
      alert("Please upload a bill or proof of purchase.");
      return;
    }

    console.log("Auction Data:", formData);
    console.log("Product Images:", images);
    console.log("Purchase Proof:", purchaseProof);
    console.log("Seller Proof:", sellerProof);
    console.log("Seller Image:", sellerImage);

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

          <h1>Create New Auction</h1>

          <p>
            Add product details, proof of purchase, auction timing,
            seller information and delivery preferences.
          </p>

        </div>

        <div className="auction-header-actions">

          <button
            type="button"
            className="auction-save-btn"
            onClick={saveDraft}
          >
            Save as Draft
          </button>

          <button
            type="submit"
            form="create-auction-form"
            className="auction-publish-btn"
          >
            Publish Auction
          </button>

        </div>

      </div>

      {/* =====================================================
          FORM
      ===================================================== */}

      <form
        id="create-auction-form"
        className="auction-form"
        onSubmit={handleSubmit}
      >

        {/* =====================================================
            LEFT COLUMN
        ===================================================== */}

        <div className="auction-left-column">

          {/* =================================================
              1. PRODUCT INFORMATION
          ================================================= */}

          <section className="auction-card">

            <div className="auction-card-title">

              <div className="auction-card-heading">

                <span className="auction-section-icon">
                  ▣
                </span>

                <span>Product Information</span>

              </div>

              <span className="auction-section-number">
                01
              </span>

            </div>

            {/* PRODUCT TITLE */}

            <div className="auction-field">

              <label htmlFor="productTitle">
                Product Title
                <span className="auction-required">*</span>
              </label>

              <input
                id="productTitle"
                type="text"
                name="productTitle"
                value={formData.productTitle}
                onChange={handleChange}
                placeholder="e.g. Canon EOS R5 Mirrorless Camera"
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

                  <option value="">Select category</option>

                  <option value="electronics">
                    Electronics
                  </option>

                  <option value="mobile">
                    Mobile & Accessories
                  </option>

                  <option value="laptop">
                    Laptop & Computer
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
                    Like New
                  </option>

                  <option value="excellent">
                    Excellent
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
                  Product Description
                  <span className="auction-required">*</span>
                </label>

                <span className="auction-character-count">
                  {formData.description.length}/1000
                </span>

              </div>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the product, usage, defects, accessories included and anything bidders should know."
                rows="6"
                maxLength="1000"
                required
              />

            </div>

          </section>

          {/* =================================================
              2. PURCHASE & PROOF
          ================================================= */}

          <section className="auction-card">

            <div className="auction-card-title">

              <div className="auction-card-heading">

                <span className="auction-section-icon">
                  ▤
                </span>

                <span>Purchase & Proof Details</span>

              </div>

              <span className="auction-section-number">
                02
              </span>

            </div>

            <p className="auction-card-description">
              Provide original purchase information to verify product
              ownership and authenticity.
            </p>

            {/* BILL / PROOF */}

            <div className="auction-field">

              <label>
                Bill / Proof of Purchase
                <span className="auction-required">*</span>
              </label>

              <label className="auction-upload-box auction-proof-upload">

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handlePurchaseProof}
                />

                <div className="auction-upload-icon">
                  ↑
                </div>

                <strong>
                  {purchaseProof
                    ? purchaseProof.name
                    : "Upload Bill or Proof"}
                </strong>

                <span>
                  JPG, PNG or PDF · Maximum 5MB
                </span>

              </label>

            </div>

            {/* PURCHASE DATE + WHO */}

            <div className="auction-two-column">

              <div className="auction-field">

                <label htmlFor="purchaseDate">
                  Date of Product Buy
                  <span className="auction-required">*</span>
                </label>

                <input
                  id="purchaseDate"
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="auction-field">

                <label htmlFor="purchasedBy">
                  Who Purchased
                  <span className="auction-required">*</span>
                </label>

                <input
                  id="purchasedBy"
                  type="text"
                  name="purchasedBy"
                  value={formData.purchasedBy}
                  onChange={handleChange}
                  placeholder="Name of original buyer"
                  required
                />

              </div>

            </div>

            {/* PURCHASE PRICE */}

            <div className="auction-field">

              <label htmlFor="purchasePrice">
                Original Purchase Price (₹)
                <span className="auction-required">*</span>
              </label>

              <input
                id="purchasePrice"
                type="number"
                min="0"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                placeholder="Enter original purchase price"
                required
              />

            </div>

          </section>

          {/* =================================================
              3. SELLER DETAILS
          ================================================= */}

          <section className="auction-card">

            <div className="auction-card-title">

              <div className="auction-card-heading">

                <span className="auction-section-icon">
                  ◉
                </span>

                <span>Seller Details</span>

              </div>

              <span className="auction-section-number">
                03
              </span>

            </div>

            {/* SELLER TOP */}

            <div className="seller-profile-row">

              <div className="seller-image-wrapper">

                {sellerImage ? (
                  <img
                    src={sellerImage.preview}
                    alt="Seller"
                    className="seller-image"
                  />
                ) : (
                  <div className="seller-image-placeholder">
                    👤
                  </div>
                )}

                <label className="seller-camera-button">
                  +
                  <input
                    type="file"
                    hidden
                    accept=".jpg,.jpeg,.png"
                    onChange={handleSellerImage}
                  />
                </label>

              </div>

              <div className="seller-profile-info">

                <strong>
                  Seller Profile
                </strong>

                <span>
                  Upload a clear profile image for verification.
                </span>

              </div>

            </div>

            {/* NAME + EMAIL */}

            <div className="auction-two-column">

              <div className="auction-field">

                <label htmlFor="sellerName">
                  Seller Name
                  <span className="auction-required">*</span>
                </label>

                <input
                  id="sellerName"
                  type="text"
                  name="sellerName"
                  value={formData.sellerName}
                  onChange={handleChange}
                  placeholder="Enter seller name"
                  required
                />

              </div>

              <div className="auction-field">

                <label htmlFor="sellerEmail">
                  Email
                  <span className="auction-required">*</span>
                </label>

                <input
                  id="sellerEmail"
                  type="email"
                  name="sellerEmail"
                  value={formData.sellerEmail}
                  onChange={handleChange}
                  placeholder="seller@example.com"
                  required
                />

              </div>

            </div>

            {/* CONTACT */}

            <div className="auction-field">

              <label htmlFor="contactNumber">
                Contact Number
                <span className="auction-required">*</span>
              </label>

              <input
                id="contactNumber"
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="+91 XXXXX XXXXX"
                required
              />

            </div>

            {/* ADDRESS */}

            <h3 className="auction-subtitle">
              Seller Address
            </h3>

            <div className="auction-field">

              <label htmlFor="area">
                Area / Street
                <span className="auction-required">*</span>
              </label>

              <input
                id="area"
                type="text"
                name="area"
                value={formData.area}
                onChange={handleChange}
                placeholder="Area, street or locality"
                required
              />

            </div>

            <div className="auction-two-column">

              <div className="auction-field">

                <label htmlFor="city">
                  City
                  <span className="auction-required">*</span>
                </label>

                <input
                  id="city"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  required
                />

              </div>

              <div className="auction-field">

                <label htmlFor="state">
                  State
                  <span className="auction-required">*</span>
                </label>

                <input
                  id="state"
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                  required
                />

              </div>

            </div>

            <div className="auction-two-column">

              <div className="auction-field">

                <label htmlFor="country">
                  Country
                  <span className="auction-required">*</span>
                </label>

                <input
                  id="country"
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="auction-field">

                <label htmlFor="pinCode">
                  Pincode
                  <span className="auction-required">*</span>
                </label>

                <input
                  id="pinCode"
                  type="text"
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleChange}
                  placeholder="6-digit pincode"
                  required
                />

              </div>

            </div>

            {/* SELLER PROOF */}

            <div className="auction-field">

              <label>
                Seller Verification Proof
                <span className="auction-required">*</span>
              </label>

              <label className="auction-proof-button auction-full-proof">

                <span>📎</span>

                <div>
                  <strong>
                    {sellerProof
                      ? sellerProof.name
                      : "Upload Seller Proof"}
                  </strong>

                  <small>
                    ID / Address proof · JPG, PNG or PDF
                  </small>
                </div>

                <input
                  type="file"
                  hidden
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleSellerProof}
                />

              </label>

            </div>

          </section>

        </div>

        {/* =====================================================
            RIGHT COLUMN
        ===================================================== */}

        <div className="auction-right-column">

          {/* =================================================
              PRODUCT IMAGES
          ================================================= */}

          <section className="auction-card">

            <div className="auction-card-title">

              <div className="auction-card-heading">

                <span className="auction-section-icon">
                  ▧
                </span>

                <span>Product Images</span>

              </div>

              <span className="auction-section-number">
                04
              </span>

            </div>

            <div className="auction-image-requirement">

              <strong>
                Minimum 3 images required
              </strong>

              <span>
                Upload up to 12 high-quality product images.
              </span>

            </div>

            {/* IMAGE UPLOAD */}

            <label className="auction-image-add-box">

              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleImageUpload}
              />

              <div className="auction-add-image-icon">
                ↑
              </div>

              <strong>
                Add Image
              </strong>

              <span>
                JPG / PNG · Max 5MB
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
                      alt={`Product ${index + 1}`}
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
                    >
                      ×
                    </button>

                  </div>

                ))}

              </div>

            )}

            {images.length < 3 && (

              <div className="auction-image-warning">
                <span>!</span>
                Please upload at least {3 - images.length} more
                product image{3 - images.length > 1 ? "s" : ""}.
              </div>

            )}

          </section>

          {/* =================================================
              AUCTION DETAILS
          ================================================= */}

          <section className="auction-card">

            <div className="auction-card-title">

              <div className="auction-card-heading">

                <span className="auction-section-icon">
                  ◷
                </span>

                <span>Auction Details</span>

              </div>

              <span className="auction-section-number">
                05
              </span>

            </div>

            {/* STARTING PRICE */}

            <div className="auction-field">

              <label htmlFor="startingPrice">
                Starting Price (₹)
                <span className="auction-required">*</span>
              </label>

              <input
                id="startingPrice"
                type="number"
                min="0"
                name="startingPrice"
                value={formData.startingPrice}
                onChange={handleChange}
                placeholder="Enter starting price"
                required
              />

            </div>

            {/* START DATE */}

            <div className="auction-field">

              <label htmlFor="auctionStart">
                Starting Date & Time
                <span className="auction-required">*</span>
              </label>

              <input
                id="auctionStart"
                type="datetime-local"
                name="auctionStart"
                value={formData.auctionStart}
                onChange={handleChange}
                required
              />

            </div>

            {/* END DATE */}

            <div className="auction-field">

              <label htmlFor="auctionEnd">
                Ending Date & Time
                <span className="auction-required">*</span>
              </label>

              <input
                id="auctionEnd"
                type="datetime-local"
                name="auctionEnd"
                value={formData.auctionEnd}
                onChange={handleChange}
                required
              />

            </div>

          </section>

          {/* =================================================
              LOCATION & DELIVERY
          ================================================= */}

          <section className="auction-card">

            <div className="auction-card-title">

              <div className="auction-card-heading">

                <span className="auction-section-icon">
                  ⌖
                </span>

                <span>Location & Delivery</span>

              </div>

              <span className="auction-section-number">
                06
              </span>

            </div>

            {/* PRODUCT LOCATION */}

            <div className="auction-field">

              <label htmlFor="productLocation">
                Product Location
                <span className="auction-required">*</span>
              </label>

              <input
                id="productLocation"
                type="text"
                name="productLocation"
                value={formData.productLocation}
                onChange={handleChange}
                placeholder="Where is the product currently located?"
                required
              />

            </div>

            {/* DELIVERY */}

            <div className="auction-field">

              <label>
                Delivery / Pickup
                <span className="auction-required">*</span>
              </label>

              <div className="auction-three-toggle">

                {[
                  "Pickup Only",
                  "Delivery",
                  "Both",
                ].map((option) => (

                  <button
                    type="button"
                    key={option}
                    className={
                      formData.deliveryType === option
                        ? "auction-toggle-active"
                        : ""
                    }
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        deliveryType: option,
                      }))
                    }
                  >
                    {option}
                  </button>

                ))}

              </div>

            </div>

            {/* SHIPPING */}

            <div className="auction-field">

              <label>
                Shipping Charges
                <span className="auction-required">*</span>
              </label>

              <div className="auction-shipping-options">

                {[
                  "Free",
                  "Paid",
                  "Buyer Pays",
                  "Seller Pays",
                ].map((option) => (

                  <label
                    className="auction-radio-row"
                    key={option}
                  >

                    <input
                      type="radio"
                      name="shippingType"
                      value={option}
                      checked={
                        formData.shippingType === option
                      }
                      onChange={handleChange}
                    />

                    <span>{option}</span>

                  </label>

                ))}

              </div>

            </div>

            {/* PAID SHIPPING */}

            {(formData.shippingType === "Paid" ||
              formData.shippingType === "Buyer Pays" ||
              formData.shippingType === "Seller Pays") && (

              <div className="auction-field">

                <label htmlFor="shippingCharges">
                  Shipping Charges (₹)
                </label>

                <input
                  id="shippingCharges"
                  type="number"
                  min="0"
                  name="shippingCharges"
                  value={formData.shippingCharges}
                  onChange={handleChange}
                  placeholder="Enter shipping charges"
                />

              </div>

            )}

          </section>

          {/* =================================================
              WARRANTY
          ================================================= */}

          <section className="auction-card">

            <div className="auction-card-title">

              <div className="auction-card-heading">

                <span className="auction-section-icon">
                  ✓
                </span>

                <span>Warranty Status</span>

              </div>

              <span className="auction-section-number">
                07
              </span>

            </div>

            <div className="auction-field">

              <label htmlFor="warrantyStatus">
                Warranty Status
                <span className="auction-required">*</span>
              </label>

              <select
                id="warrantyStatus"
                name="warrantyStatus"
                value={formData.warrantyStatus}
                onChange={handleChange}
                required
              >

                <option value="">
                  Select warranty status
                </option>

                <option value="active">
                  Active Warranty
                </option>

                <option value="expired">
                  Expired Warranty
                </option>

                <option value="not-available">
                  No Warranty
                </option>

                <option value="unknown">
                  Unknown
                </option>

              </select>

            </div>

            <div className="auction-field">

              <label htmlFor="warrantyDetails">
                Warranty Details
              </label>

              <textarea
                id="warrantyDetails"
                name="warrantyDetails"
                value={formData.warrantyDetails}
                onChange={handleChange}
                placeholder="Enter warranty period, company, expiry date or other details."
                rows="3"
              />

            </div>

          </section>

          {/* =================================================
              PAYMENT
          ================================================= */}

          <section className="auction-card">

            <div className="auction-card-title">

              <div className="auction-card-heading">

                <span className="auction-section-icon">
                  ₹
                </span>

                <span>Payment Method</span>

              </div>

              <span className="auction-section-number">
                08
              </span>

            </div>

            <div className="auction-field">

              <label htmlFor="paymentMethod">
                Payment Method
                <span className="auction-required">*</span>
              </label>

              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                required
              >

                <option value="">
                  Select payment method
                </option>

                <option value="upi">
                  UPI
                </option>

                <option value="bank-transfer">
                  Bank Transfer
                </option>

                <option value="cash-on-pickup">
                  Cash on Pickup
                </option>

                <option value="online-payment">
                  Online Payment
                </option>

              </select>

            </div>

          </section>

          {/* =================================================
              AUCTION PREVIEW
          ================================================= */}

          <section className="auction-preview-card">

            <div className="auction-preview-title">

              <span className="auction-preview-icon">
                ◉
              </span>

              <span>Auction Preview</span>

            </div>

            <div className="auction-preview-content">

              <div className="auction-preview-image">

                {images.length > 0 ? (

                  <img
                    src={images[0].preview}
                    alt="Auction preview"
                  />

                ) : (

                  <div className="auction-preview-placeholder">
                    Product Image
                  </div>

                )}

              </div>

              <div className="auction-preview-details">

                <h3>
                  {formData.productTitle ||
                    "Product Title Will Appear Here"}
                </h3>

                <div className="auction-preview-price">

                  Starting Price: ₹
                  {formData.startingPrice || "0"}

                </div>

                <div className="auction-preview-meta">

                  <span>
                    ◈ {formData.category || "Category"}
                  </span>

                  <span>
                    ⌖ {formData.productLocation || "Location"}
                  </span>

                  <span>
                    ◷{" "}
                    {formData.auctionEnd
                      ? new Date(
                          formData.auctionEnd
                        ).toLocaleString()
                      : "Ending date & time"}
                  </span>

                </div>

              </div>

            </div>

            <div className="auction-preview-status">

              <span className="status-dot"></span>

              Fill all required fields to publish your auction.

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
