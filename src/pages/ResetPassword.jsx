import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/resetpassword.css";

const API_BASE_URL = "http://127.0.0.1:8000";

const ResetPassword = () => {
  const navigate = useNavigate();

  // 1 = Email
  // 2 = OTP
  // 3 = New Password
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // SEND FORGOT PASSWORD OTP
  // =========================================================

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_BASE_URL}/api/users/forgot-password`,
        {
          email: cleanEmail,
        }
      );

      setMessage(
        response.data.message ||
          "OTP sent successfully to your email."
      );

      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // VERIFY FORGOT PASSWORD OTP
  // =========================================================

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      setError("Please enter the OTP.");
      return;
    }

    if (cleanOtp.length !== 6) {
      setError("OTP must be 6 digits.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_BASE_URL}/api/users/verify-forgot-password-otp`,
        {
          email: email.trim(),
          otp: cleanOtp,
        }
      );

      setMessage(
        response.data.message ||
          "OTP verified successfully."
      );

      setStep(3);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Invalid OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RESET PASSWORD
  // =========================================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_BASE_URL}/api/users/reset-password`,
        {
          email: email.trim(),
          new_password: newPassword,
        }
      );

      setMessage(
        response.data.message ||
          "Password changed successfully."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // CLOSE POPUP / BACK TO LOGIN
  // =========================================================

  const handleClose = () => {
    if (!loading) {
      navigate("/login");
    }
  };

  return (
    <div className="reset-password-page">

      {/* Dark Background */}
      <div className="reset-password-overlay">

        {/* Popup */}
        <div className="reset-password-popup">

          {/* Close Button */}
          <button
            type="button"
            className="reset-close-button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close"
          >
            ×
          </button>

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="reset-password-header">

            <div className="reset-password-icon">
              🔐
            </div>

            <h2>
              {step === 1 && "Forgot Password?"}
              {step === 2 && "Verify OTP"}
              {step === 3 && "Reset Password"}
            </h2>

            <p>
              {step === 1 &&
                "Enter your registered email address and we'll send you an OTP."}

              {step === 2 &&
                "Enter the 6-digit OTP sent to your registered email."}

              {step === 3 &&
                "Create a new password for your Bidora account."}
            </p>

          </div>

          {/* =================================================
              ERROR MESSAGE
          ================================================= */}

          {error && (
            <div className="reset-error">
              {error}
            </div>
          )}

          {/* =================================================
              SUCCESS MESSAGE
          ================================================= */}

          {message && (
            <div className="reset-success">
              {message}
            </div>
          )}

          {/* =================================================
              STEP 1 - EMAIL
          ================================================= */}

          {step === 1 && (
            <form onSubmit={handleForgotPassword}>

              <div className="reset-form-group">

                <label htmlFor="reset-email">
                  Email Address
                </label>

                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your registered email"
                  autoComplete="email"
                />

              </div>

              <button
                type="submit"
                className="reset-password-button"
                disabled={loading}
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>

            </form>
          )}

          {/* =================================================
              STEP 2 - OTP
          ================================================= */}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>

              <div className="reset-form-group">

                <label htmlFor="reset-otp">
                  Enter OTP
                </label>

                <input
                  id="reset-otp"
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6);

                    setOtp(value);
                    setError("");
                  }}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />

              </div>

              <button
                type="submit"
                className="reset-password-button"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                className="reset-back-button"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setMessage("");
                  setError("");
                }}
                disabled={loading}
              >
                ← Change Email
              </button>

            </form>
          )}

          {/* =================================================
              STEP 3 - NEW PASSWORD
          ================================================= */}

          {step === 3 && (
            <form onSubmit={handleResetPassword}>

              {/* New Password */}

              <div className="reset-form-group">

                <label htmlFor="new-password">
                  New Password
                </label>

                <div className="reset-password-wrapper">

                  <input
                    id="new-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="reset-password-toggle"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>

                </div>

              </div>

              {/* Confirm Password */}

              <div className="reset-form-group">

                <label htmlFor="confirm-password">
                  Confirm Password
                </label>

                <div className="reset-password-wrapper">

                  <input
                    id="confirm-password"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="reset-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

              </div>

              <button
                type="submit"
                className="reset-password-button"
                disabled={loading}
              >
                {loading
                  ? "Changing Password..."
                  : "Reset Password"}
              </button>

            </form>
          )}

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="reset-password-footer">

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
            >
              Back to Login
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ResetPassword;