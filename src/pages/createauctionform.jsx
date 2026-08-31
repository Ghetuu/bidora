import React, { useState } from "react";
import "../styles/createauctionform.css";

const CreateAuction = () => {
  const [images, setImages] = useState([]);
  const [purchaseProof, setPurchaseProof] = useState(null);
  const [sellerProof, setSellerProof] = useState(null);

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

    locationArea: "",
    locationCity: "",
    locationState: "",
    locationCountry: "India",
    locationPincode: "",

    deliveryType: "pickup",

    shippingType: "free",
    shippingCharges: "",
    shippingPaidBy: "",

    warrantyStatus: "",

    paymentMethod: "",

    sellerName: "",
    sellerEmail: "",
    sellerContact: "",
  });

  /* =====================================================
     INPUT CHANGE
  ===================================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =====================================================
     IMAGE UPLOAD
  ===================================================== */

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);

    const validFiles = files.filter((file) =>
      [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ].includes(file.type)
    );

    const remainingSlots = 12 - images.length;

    const newImages = validFiles
      .slice(0, remainingSlots)
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
      }));

    setImages((prev) => [...prev, ...newImages]);

    e.target.value = "";
  };

  /* =====================================================
     REMOVE IMAGE
  ===================================================== */

  const removeImage = (index) => {
    setImages((prev) => {
      const image = prev[index];

      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }

      return prev.filter((_, i) => i !== index);
    });
  };

  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit = (e) => {
    e.preventDefault();

    if (images.length < 3) {
      alert("Please upload at least 3 product images.");
      return;
    }

    if (!purchaseProof) {
      alert("Please upload the bill or proof of purchase.");
      return;
    }

    if (!sellerProof) {
      alert("Please upload seller verification proof.");
      return;
    }

    console.log("Auction Data:", formData);
    console.log("Product Images:", images);
    console.log("Purchase Proof:", purchaseProof);
    console.log("Seller Proof:", sellerProof);

    alert("Auction published successfully!");
  };

  /* =====================================================
     SAVE DRAFT
  ===================================================== */

  const saveDraft = () => {
    console.log("Draft:", formData);
    alert("Auction saved as draft.");
  };

  return (
    <div className="ca-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="ca-header">

        <div className="ca-header-content">

          <div className="ca-breadcrumb">
            <span>Dashboard</span>
            <b>•</b>
            <span>Auctions</span>
            <b>•</b>
            <strong>Create Auction</strong>
          </div>

          <h1>Create Auction</h1>

          <p>
            Create a new auction by adding your product details,
            images, pricing and seller information.
          </p>

        </div>

        <div className="ca-header-actions">

          <button
            type="button"
            className="ca-btn ca-btn-light"
            onClick={saveDraft}
          >
            Save Draft
          </button>

          <button
            type="submit"
            form="ca-auction-form"
            className="ca-btn ca-btn-primary"
          >
            + Publish Auction
          </button>

        </div>

      </header>


      {/* =================================================
          MAIN FORM
      ================================================= */}

      <form
        id="ca-auction-form"
        className="ca-form"
        onSubmit={handleSubmit}
      >

        {/* =================================================
            TOP TWO COLUMN AREA
        ================================================= */}

        <div className="ca-main-card">

          {/* ===============================================
              LEFT - IMAGES
          =============================================== */}

          <section className="ca-image-section">

            <div className="ca-section-heading">

              <div className="ca-heading-icon">
                ▧
              </div>

              <div>
                <h2>Upload Images</h2>
                <p>Add high quality images of your product</p>
              </div>

            </div>


            <label className="ca-upload-box">

              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleImageUpload}
              />

              <div className="ca-upload-icon">
                ↑
              </div>

              <h3>Drag & drop images here</h3>

              <span className="ca-upload-or">
                or
              </span>

              <span className="ca-browse-btn">
                Browse Files
              </span>

              <p>
                JPG, PNG or WEBP (Max. 5MB each)
              </p>

            </label>


            {/* IMAGE PREVIEW */}

            <div className="ca-preview-header">

              <div>
                <span className="ca-preview-icon">
                  ▣
                </span>

                <strong>Image Preview</strong>
              </div>

              <span>
                {images.length}/12
              </span>

            </div>


            {images.length > 0 ? (

              <div className="ca-image-grid">

                {images.map((image, index) => (

                  <div
                    className="ca-image-item"
                    key={`${image.name}-${index}`}
                  >

                    <img
                      src={image.preview}
                      alt={`Product ${index + 1}`}
                    />

                    {index === 0 && (
                      <span className="ca-cover-badge">
                        COVER
                      </span>
                    )}

                    <button
                      type="button"
                      className="ca-remove-image"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </button>

                  </div>

                ))}

              </div>

            ) : (

              <div className="ca-empty-preview">
                Images will appear here after uploading
              </div>

            )}


            <div className="ca-image-note">
              <span>ⓘ</span>
              <p>
                You can upload up to 12 product images.
                Minimum 3 images are required.
              </p>
            </div>

          </section>


          {/* ===============================================
              RIGHT - BASIC AUCTION DETAILS
          =============================================== */}

          <section className="ca-details-section">

            <div className="ca-section-heading">

              <div className="ca-heading-icon">
                №
              </div>

              <div>
                <h2>Auction Details</h2>
                <p>Fill in the details to create a new auction</p>
              </div>

            </div>


            {/* TITLE + CATEGORY */}

            <div className="ca-field-grid">

              <div className="ca-field">

                <label>
                  Auction Title
                  <span>*</span>
                </label>

                <div className="ca-input-wrap">

                  <span className="ca-input-icon">
                    ◇
                  </span>

                  <input
                    type="text"
                    name="productTitle"
                    value={formData.productTitle}
                    onChange={handleChange}
                    placeholder="Enter auction title"
                    required
                  />

                </div>

              </div>


              <div className="ca-field">

                <label>
                  Category
                  <span>*</span>
                </label>

                <div className="ca-input-wrap">

                  <span className="ca-input-icon">
                    ▦
                  </span>

                  <select
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

                    <option value="mobile">
                      Mobile & Tablets
                    </option>

                    <option value="laptop">
                      Laptop & Computers
                    </option>

                    <option value="vehicles">
                      Vehicles
                    </option>

                    <option value="fashion">
                      Fashion
                    </option>

                    <option value="furniture">
                      Furniture
                    </option>

                    <option value="collectibles">
                      Collectibles
                    </option>

                    <option value="books">
                      Books
                    </option>

                    <option value="other">
                      Other
                    </option>

                  </select>

                </div>

              </div>

            </div>


            {/* CONDITION */}

            <div className="ca-field-grid">

              <div className="ca-field">

                <label>
                  Product Condition
                  <span>*</span>
                </label>

                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                >

                  <option value="">
                    Select condition
                  </option>

                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="used">Used</option>

                </select>

              </div>


              <div className="ca-field">

                <label>
                  Warranty Status
                </label>

                <select
                  name="warrantyStatus"
                  value={formData.warrantyStatus}
                  onChange={handleChange}
                >

                  <option value="">
                    Select warranty status
                  </option>

                  <option value="no-warranty">
                    No Warranty
                  </option>

                  <option value="active">
                    Warranty Active
                  </option>

                  <option value="expired">
                    Warranty Expired
                  </option>

                  <option value="extended">
                    Extended Warranty
                  </option>

                </select>

              </div>

            </div>


            {/* DESCRIPTION */}

            <div className="ca-field ca-field-full">

              <div className="ca-label-row">

                <label>
                  Description
                  <span>*</span>
                </label>

                <small>
                  {formData.description.length}/1000
                </small>

              </div>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                maxLength="1000"
                placeholder="Enter product description, condition, features, accessories and other important information..."
                required
              />

            </div>


            {/* PRICE */}

            <div className="ca-price-grid">

              <div className="ca-field">

                <label>
                  Starting Bid (₹)
                  <span>*</span>
                </label>

                <div className="ca-input-wrap">

                  <span className="ca-currency">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    name="startingPrice"
                    value={formData.startingPrice}
                    onChange={handleChange}
                    placeholder="Enter starting bid"
                    required
                  />

                </div>

              </div>


              <div className="ca-field">

                <label>
                  Original Purchase Price (₹)
                  <span>*</span>
                </label>

                <div className="ca-input-wrap">

                  <span className="ca-currency">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    placeholder="Enter purchase price"
                    required
                  />

                </div>

              </div>

            </div>


            {/* DATE TIME */}

            <div className="ca-field-grid">

              <div className="ca-field">

                <label>
                  Start Date & Time
                  <span>*</span>
                </label>

                <input
                  type="datetime-local"
                  name="auctionStart"
                  value={formData.auctionStart}
                  onChange={handleChange}
                  required
                />

              </div>


              <div className="ca-field">

                <label>
                  End Date & Time
                  <span>*</span>
                </label>

                <input
                  type="datetime-local"
                  name="auctionEnd"
                  value={formData.auctionEnd}
                  onChange={handleChange}
                  required
                />

              </div>

            </div>


            {/* LOCATION */}

            <div className="ca-field ca-field-full">

              <label>
                Location
                <span>*</span>
              </label>

              <div className="ca-input-wrap">

                <span className="ca-input-icon">
                  ⌖
                </span>

                <input
                  type="text"
                  name="locationArea"
                  value={formData.locationArea}
                  onChange={handleChange}
                  placeholder="Enter product area / locality"
                  required
                />

              </div>

            </div>

          </section>

        </div>


        {/* =================================================
            ADDITIONAL INFORMATION
        ================================================= */}

        <div className="ca-bottom-grid">

          {/* ===============================================
              PURCHASE INFORMATION
          =============================================== */}

          <section className="ca-card">

            <div className="ca-card-heading">

              <div className="ca-small-icon">
                ✓
              </div>

              <div>
                <h2>Purchase Information</h2>
                <p>Original purchase and ownership details</p>
              </div>

            </div>


            <div className="ca-field-grid">

              <div className="ca-field">

                <label>
                  Date of Product Buy
                  <span>*</span>
                </label>

                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  required
                />

              </div>


              <div className="ca-field">

                <label>
                  Purchased By
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="purchasedBy"
                  value={formData.purchasedBy}
                  onChange={handleChange}
                  placeholder="Name of original buyer"
                  required
                />

              </div>

            </div>


            <div className="ca-document-box">

              <div>

                <strong>
                  Bill / Proof of Purchase
                </strong>

                <p>
                  Upload original bill, invoice or ownership proof.
                </p>

              </div>

              <label className="ca-upload-document">

                + Upload

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) =>
                    setPurchaseProof(
                      e.target.files?.[0] || null
                    )
                  }
                />

              </label>

            </div>

            {purchaseProof && (
              <div className="ca-file-name">
                ✓ {purchaseProof.name}
              </div>
            )}

          </section>


          {/* ===============================================
              LOCATION DETAILS
          =============================================== */}

          <section className="ca-card">

            <div className="ca-card-heading">

              <div className="ca-small-icon">
                ⌖
              </div>

              <div>
                <h2>Product Location</h2>
                <p>Where the product is currently located</p>
              </div>

            </div>


            <div className="ca-field">

              <label>
                Area / Locality
                <span>*</span>
              </label>

              <input
                type="text"
                name="locationArea"
                value={formData.locationArea}
                onChange={handleChange}
                placeholder="e.g. Satellite Road"
                required
              />

            </div>


            <div className="ca-field-grid">

              <div className="ca-field">

                <label>
                  City
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="locationCity"
                  value={formData.locationCity}
                  onChange={handleChange}
                  placeholder="Ahmedabad"
                  required
                />

              </div>


              <div className="ca-field">

                <label>
                  State
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="locationState"
                  value={formData.locationState}
                  onChange={handleChange}
                  placeholder="Gujarat"
                  required
                />

              </div>

            </div>


            <div className="ca-field-grid">

              <div className="ca-field">

                <label>
                  Country
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="locationCountry"
                  value={formData.locationCountry}
                  onChange={handleChange}
                  required
                />

              </div>


              <div className="ca-field">

                <label>
                  Pincode
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="locationPincode"
                  value={formData.locationPincode}
                  onChange={handleChange}
                  placeholder="380015"
                  required
                />

              </div>

            </div>

          </section>


          {/* ===============================================
              DELIVERY & SHIPPING
          =============================================== */}

          <section className="ca-card">

            <div className="ca-card-heading">

              <div className="ca-small-icon">
                ⇄
              </div>

              <div>
                <h2>Delivery & Shipping</h2>
                <p>Choose how the buyer receives the product</p>
              </div>

            </div>


            <div className="ca-field">

              <label>
                Delivery / Pickup
                <span>*</span>
              </label>

              <div className="ca-choice-grid">

                {[
                  ["pickup", "Pickup Only", "Buyer collects the product"],
                  ["delivery", "Delivery", "Seller ships the product"],
                  ["both", "Both", "Pickup or delivery"],
                ].map(([value, title, text]) => (

                  <button
                    key={value}
                    type="button"
                    className={
                      formData.deliveryType === value
                        ? "ca-choice active"
                        : "ca-choice"
                    }
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        deliveryType: value,
                      }))
                    }
                  >
                    <strong>{title}</strong>
                    <small>{text}</small>
                  </button>

                ))}

              </div>

            </div>


            <div className="ca-field">

              <label>
                Shipping Charges
                <span>*</span>
              </label>

              <div className="ca-radio-grid">

                <label
                  className={
                    formData.shippingType === "free"
                      ? "ca-radio active"
                      : "ca-radio"
                  }
                >

                  <input
                    type="radio"
                    name="shippingType"
                    value="free"
                    checked={formData.shippingType === "free"}
                    onChange={handleChange}
                  />

                  <div>
                    <strong>Free Shipping</strong>
                    <small>No shipping charge</small>
                  </div>

                </label>


                <label
                  className={
                    formData.shippingType === "paid"
                      ? "ca-radio active"
                      : "ca-radio"
                  }
                >

                  <input
                    type="radio"
                    name="shippingType"
                    value="paid"
                    checked={formData.shippingType === "paid"}
                    onChange={handleChange}
                  />

                  <div>
                    <strong>Paid Shipping</strong>
                    <small>Additional shipping cost</small>
                  </div>

                </label>

              </div>

            </div>


            {formData.shippingType === "paid" && (

              <div className="ca-field-grid">

                <div className="ca-field">

                  <label>
                    Shipping Charges (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    name="shippingCharges"
                    value={formData.shippingCharges}
                    onChange={handleChange}
                    placeholder="e.g. 500"
                  />

                </div>


                <div className="ca-field">

                  <label>
                    Charges Paid By
                  </label>

                  <select
                    name="shippingPaidBy"
                    value={formData.shippingPaidBy}
                    onChange={handleChange}
                  >

                    <option value="">
                      Select
                    </option>

                    <option value="buyer">
                      Buyer Pays
                    </option>

                    <option value="seller">
                      Seller Pays
                    </option>

                  </select>

                </div>

              </div>

            )}

          </section>


          {/* ===============================================
              SELLER DETAILS
          =============================================== */}

          <section className="ca-card">

            <div className="ca-card-heading">

              <div className="ca-small-icon">
                ◉
              </div>

              <div>
                <h2>Seller Details</h2>
                <p>Seller contact and verification information</p>
              </div>

            </div>


            <div className="ca-field">

              <label>
                Seller Name
                <span>*</span>
              </label>

              <input
                type="text"
                name="sellerName"
                value={formData.sellerName}
                onChange={handleChange}
                placeholder="Enter seller full name"
                required
              />

            </div>


            <div className="ca-field-grid">

              <div className="ca-field">

                <label>
                  Email Address
                  <span>*</span>
                </label>

                <input
                  type="email"
                  name="sellerEmail"
                  value={formData.sellerEmail}
                  onChange={handleChange}
                  placeholder="seller@example.com"
                  required
                />

              </div>


              <div className="ca-field">

                <label>
                  Contact Number
                  <span>*</span>
                </label>

                <input
                  type="tel"
                  name="sellerContact"
                  value={formData.sellerContact}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  required
                />

              </div>

            </div>


            <div className="ca-document-box">

              <div>

                <strong>
                  Seller Verification Proof
                </strong>

                <p>
                  Upload identity or ownership verification document.
                </p>

              </div>

              <label className="ca-upload-document">

                + Upload

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) =>
                    setSellerProof(
                      e.target.files?.[0] || null
                    )
                  }
                />

              </label>

            </div>

            {sellerProof && (
              <div className="ca-file-name">
                ✓ {sellerProof.name}
              </div>
            )}

          </section>


          {/* ===============================================
              PAYMENT
          =============================================== */}

          <section className="ca-card ca-payment-card">

            <div className="ca-card-heading">

              <div className="ca-small-icon">
                ₹
              </div>

              <div>
                <h2>Payment Method</h2>
                <p>Select accepted payment method</p>
              </div>

            </div>


            <div className="ca-payment-grid">

              {[
                "UPI",
                "Bank Transfer",
                "Credit / Debit Card",
                "Cash on Pickup",
              ].map((method) => (

                <button
                  type="button"
                  key={method}
                  className={
                    formData.paymentMethod === method
                      ? "ca-payment active"
                      : "ca-payment"
                  }
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentMethod: method,
                    }))
                  }
                >
                  {method}
                </button>

              ))}

            </div>

          </section>

        </div>


        {/* =================================================
            FORM FOOTER
        ================================================= */}

        <div className="ca-form-footer">

          <div className="ca-footer-info">
            <strong>Ready to publish?</strong>
            <span>
              Make sure all required information is complete.
            </span>
          </div>

          <div className="ca-footer-actions">

            <button
              type="button"
              className="ca-btn ca-btn-light ca-cancel"
              onClick={saveDraft}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="ca-btn ca-btn-primary ca-publish"
            >
              + Create Auction
            </button>

          </div>

        </div>

      </form>


      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="ca-footer">

        <span>
          © 2026 Bidora. All rights reserved.
        </span>

        <span>
          Seller Console · Create Auction
        </span>

      </footer>

    </div>
  );
};

export default CreateAuction;