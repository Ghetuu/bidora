import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    helpTopic: "",
    auctionId: "",
    message: "",
    message: "",
    privacy: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const helpTopics = [
    "Bidding & Auction Rules",
    "Payment & Invoicing",
    "Shipping & Delivery",
    "Selling / Consignment",
    "Report an Issue / Fraud",
    "Account Support & Login",
    "Other",
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setSubmitted(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.privacy) {
      alert("Please agree to the Privacy Policy.");
      return;
    }

    console.log("Contact Form Data:", formData);

    setSubmitted(true);

    // Add your backend API call here later
  };

  return (
    <div className="cp-page">
      <style>{`
        /* =====================================================
           BIDORA CONTACT PAGE
           All classes are scoped with "cp-" to avoid conflicts
        ===================================================== */

        .cp-page {
          width: 100%;
          min-height: 100vh;
          box-sizing: border-box;
          padding: 40px 20px;
          background: #f7f9fc;
          font-family: "Inter", "Segoe UI", Arial, sans-serif;
        }

        .cp-container {
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
        }

        /* =====================================================
           CONTACT FORM CARD
        ===================================================== */

        .cp-card {
          width: 100%;
          box-sizing: border-box;
          padding: 32px;
          background: #ffffff;
          border: 1px solid #edf0f5;
          border-radius: 14px;
          box-shadow: 0 8px 28px rgba(15, 23, 42, 0.07);
        }

        /* =====================================================
           FORM GRID
        ===================================================== */

        .cp-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 25px;
        }

        .cp-field {
          width: 100%;
          min-width: 0;
        }

        .cp-full-field {
          width: 100%;
          margin-bottom: 25px;
        }

        /* =====================================================
           LABEL
        ===================================================== */

        .cp-label {
          display: block;
          margin-bottom: 9px;
          color: #182033;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.4;
        }

        .cp-required {
          color: #ef4444;
          margin-left: 2px;
        }

        /* =====================================================
           INPUT
        ===================================================== */

        .cp-input,
        .cp-select,
        .cp-textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #dce2eb;
          border-radius: 8px;
          outline: none;
          background: #ffffff;
          color: #1e293b;
          font-family: inherit;
          font-size: 13px;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .cp-input,
        .cp-select {
          height: 44px;
          padding: 0 13px;
        }

        .cp-input::placeholder,
        .cp-textarea::placeholder {
          color: #9aa4b2;
        }

        .cp-input:focus,
        .cp-select:focus,
        .cp-textarea:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.09);
        }

        /* =====================================================
           SELECT
        ===================================================== */

        .cp-select {
          cursor: pointer;
          appearance: auto;
        }

        /* =====================================================
           AUCTION ID
        ===================================================== */

        .cp-auction-field {
          margin-bottom: 25px;
        }

        /* =====================================================
           MESSAGE
        ===================================================== */

        .cp-message-field {
          position: relative;
          margin-bottom: 20px;
        }

        .cp-textarea {
          min-height: 150px;
          padding: 13px;
          resize: vertical;
          line-height: 1.5;
        }

        .cp-character-count {
          position: absolute;
          right: 10px;
          bottom: 8px;
          color: #98a1af;
          font-size: 11px;
          pointer-events: none;
        }

        /* =====================================================
           PRIVACY
        ===================================================== */

        .cp-privacy {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 23px;
          color: #4b5563;
          font-size: 12px;
          line-height: 1.4;
        }

        .cp-checkbox {
          width: 14px;
          height: 14px;
          margin: 0;
          cursor: pointer;
          accent-color: #6366f1;
        }

        .cp-privacy-link {
          color: #4f46e5;
          font-weight: 600;
          text-decoration: none;
        }

        .cp-privacy-link:hover {
          text-decoration: underline;
        }

        /* =====================================================
           SUBMIT BUTTON
        ===================================================== */

        .cp-submit {
          width: 100%;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(
            90deg,
            #6538f5 0%,
            #245df5 100%
          );
          color: #ffffff;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.1px;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            opacity 0.2s ease;
        }

        .cp-submit:hover {
          transform: translateY(-1px);
          box-shadow: 0 7px 18px rgba(79, 70, 229, 0.23);
        }

        .cp-submit:active {
          transform: translateY(0);
        }

        .cp-submit-icon {
          font-size: 14px;
        }

        /* =====================================================
           SUCCESS MESSAGE
        ===================================================== */

        .cp-success {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 18px;
          padding: 12px 14px;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          background: #f0fdf4;
          color: #15803d;
          font-size: 13px;
          line-height: 1.4;
        }

        .cp-success-icon {
          font-size: 16px;
        }

        /* =====================================================
           SECURITY BOX
        ===================================================== */

        .cp-security {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-top: 16px;
          padding: 15px 16px;
          box-sizing: border-box;
          border: 1px solid #dbeafe;
          border-radius: 10px;
          background: #eff6ff;
        }

        .cp-security-icon {
          flex-shrink: 0;
          width: 27px;
          height: 27px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #2563eb;
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
        }

        .cp-security-content {
          min-width: 0;
        }

        .cp-security-title {
          margin: 0 0 3px;
          color: #2563eb;
          font-size: 12px;
          font-weight: 700;
        }

        .cp-security-text {
          margin: 0;
          color: #47709e;
          font-size: 11px;
          line-height: 1.5;
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 650px) {
          .cp-page {
            padding: 20px 12px;
          }

          .cp-card {
            padding: 22px 18px;
            border-radius: 12px;
          }

          .cp-row {
            grid-template-columns: 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }

          .cp-full-field,
          .cp-auction-field {
            margin-bottom: 20px;
          }

          .cp-textarea {
            min-height: 130px;
          }
        }

        @media (max-width: 400px) {
          .cp-card {
            padding: 18px 14px;
          }

          .cp-input,
          .cp-select {
            height: 42px;
          }

          .cp-submit {
            height: 44px;
          }
        }

        /* =====================================================
   BACK TO HOME BUTTON
===================================================== */

.cp-back-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  margin-bottom: 16px;
  padding: 8px 0;

  border: none;
  background: transparent;

  color: #4f46e5;

  font-family: inherit;
  font-size: 13px;
  font-weight: 600;

  cursor: pointer;

  transition: all 0.2s ease;
}

.cp-back-button:hover {
  color: #3730a3;
  transform: translateX(-3px);
}
  .cp-other-topic {
  margin-top: 16px;
}
      `}</style>

      <div className="cp-container">

        <button
            type="button"
            className="cp-back-button"
            onClick={() => navigate("/")}
            >
            ← Back to Home
            </button>

        <div className="cp-card">

          <form onSubmit={handleSubmit}>

            {/* =================================================
                FIRST NAME / LAST NAME
            ================================================= */}

            <div className="cp-row">

              <div className="cp-field">
                <label
                  htmlFor="cp-first-name"
                  className="cp-label"
                >
                  First Name
                  <span className="cp-required">*</span>
                </label>

                <input
                  id="cp-first-name"
                  name="firstName"
                  type="text"
                  className="cp-input"
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="cp-field">
                <label
                  htmlFor="cp-last-name"
                  className="cp-label"
                >
                  Last Name
                  <span className="cp-required">*</span>
                </label>

                <input
                  id="cp-last-name"
                  name="lastName"
                  type="text"
                  className="cp-input"
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>

            </div>

            {/* =================================================
                EMAIL / PHONE
            ================================================= */}

            <div className="cp-row">

              <div className="cp-field">
                <label
                  htmlFor="cp-email"
                  className="cp-label"
                >
                  Email Address
                  <span className="cp-required">*</span>
                </label>

                <input
                  id="cp-email"
                  name="email"
                  type="email"
                  className="cp-input"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="cp-field">
                <label
                  htmlFor="cp-phone"
                  className="cp-label"
                >
                  Phone Number (Optional)
                </label>

                <input
                  id="cp-phone"
                  name="phone"
                  type="tel"
                  className="cp-input"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

            </div>

            {/* =================================================
                HELP TOPIC
            ================================================= */}

            <div className="cp-full-field">

  <label
    htmlFor="cp-help-topic"
    className="cp-label"
  >
    What can we help you with?
    <span className="cp-required">*</span>
  </label>

  <select
    id="cp-help-topic"
    name="helpTopic"
    className="cp-select"
    value={formData.helpTopic}
    onChange={handleChange}
    required
  >
    <option value="">
      Select an option
    </option>

    {helpTopics.map((topic) => (
      <option key={topic} value={topic}>
        {topic}
      </option>
    ))}
  </select>

  {/* Show only when "Other" is selected */}
  {formData.helpTopic === "Other" && (
    <div className="cp-other-topic">

      <label
        htmlFor="cp-other-topic"
        className="cp-label"
      >
        Please specify your topic
        <span className="cp-required">*</span>
      </label>

      <input
        id="cp-other-topic"
        name="otherTopic"
        type="text"
        className="cp-input"
        placeholder="Enter your topic"
        value={formData.otherTopic}
        onChange={handleChange}
        required
      />

    </div>
  )}

</div>

            {/* =================================================
                MESSAGE
            ================================================= */}

            <div className="cp-message-field">

              <label
                htmlFor="cp-message"
                className="cp-label"
              >
                Message
                <span className="cp-required">*</span>
              </label>

              <textarea
                id="cp-message"
                name="message"
                className="cp-textarea"
                placeholder="Type your message here..."
                value={formData.message}
                onChange={(e) => {
                  if (e.target.value.length <= 1000) {
                    handleChange(e);
                  }
                }}
                maxLength={1000}
                required
              />

              <span className="cp-character-count">
                {formData.message.length} / 1000
              </span>

            </div>

            {/* =================================================
                PRIVACY
            ================================================= */}

            <label className="cp-privacy">

              <input
                type="checkbox"
                name="privacy"
                className="cp-checkbox"
                checked={formData.privacy}
                onChange={handleChange}
              />

              <span>
                I agree to the{" "}
                <a
                  href="/privacy-policy"
                  className="cp-privacy-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </a>
                .
              </span>

            </label>

            {/* =================================================
                SUBMIT
            ================================================= */}

            <button
              type="submit"
              className="cp-submit"
            >
              <span className="cp-submit-icon">
                ➤
              </span>

              <span>
                SUBMIT TICKET
              </span>
            </button>

            {/* =================================================
                SUCCESS
            ================================================= */}

            {submitted && (
              <div className="cp-success">
                <span className="cp-success-icon">
                  ✓
                </span>

                <span>
                  Your support ticket has been submitted
                  successfully.
                </span>
              </div>
            )}

          </form>

          {/* =================================================
              SECURITY INFORMATION
          ================================================= */}

          <div className="cp-security">

            <div className="cp-security-icon">
              ✓
            </div>

            <div className="cp-security-content">

              <p className="cp-security-title">
                Your information is secure with us.
              </p>

              <p className="cp-security-text">
                We respect your privacy and never share
                your data with third parties.
              </p>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default ContactPage;