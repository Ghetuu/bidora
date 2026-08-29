import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

import {
  FaEnvelope,
  FaLock,
  FaGavel,
  FaShieldAlt,
  FaKey,
} from "react-icons/fa";

import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();

  // ==========================================
  // STATE
  // ==========================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [otp, setOtp] = useState("");

  const [showOtp, setShowOtp] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Frontend validation
    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://127.0.0.1:8000/api/users/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.detail || "Invalid email or password."
        );
        return;
      }

      // ==========================================
      // LOGIN CREDENTIALS VALID
      // OTP SENT
      // ==========================================

      setShowOtp(true);

      setSuccess(
        data.message ||
          "OTP has been sent to your email."
      );

    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setError(
        "Unable to connect to the server. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // VERIFY LOGIN OTP
  // ==========================================

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("OTP must contain exactly 6 digits.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://127.0.0.1:8000/api/users/verify-login-otp",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            otp: otp.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.detail || "Invalid OTP."
        );
        return;
      }

      // ==========================================
      // LOGIN SUCCESS
      // ==========================================

      setSuccess(
        "Login successful. Redirecting..."
      );

      // Store user information
      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      localStorage.setItem(
        "isLoggedIn",
        "true"
      );

      // ==========================================
      // GO TO DASHBOARD
      // ==========================================

      setTimeout(() => {
        navigate("/Dashboard");
      }, 500);

    } catch (error) {
      console.error(
        "OTP VERIFICATION ERROR:",
        error
      );

      setError(
        "Unable to connect to the server. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // BACK TO LOGIN
  // ==========================================

  const handleBackToLogin = () => {
    setShowOtp(false);

    setOtp("");

    setError("");

    setSuccess("");
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <>
      <Navbar />

      <div className="login-page">

        <div className="login-card">

          {/* LEFT SIDE */}

          <div className="login-form-container">

            <div className="login-box">

              {/* BRAND */}

              <div className="brand">

                <FaGavel className="logo-icon" />

                <h1>Bidora</h1>

              </div>

              {/* ==================================
                  NORMAL LOGIN
              ================================== */}

              {!showOtp && (
                <>
                  <h2>Welcome Back 👋</h2>

                  <p className="subtitle">
                    Login to continue bidding securely.
                  </p>

                  <form onSubmit={handleLogin}>

                    {/* EMAIL */}

                    <div className="input-group">

                      <FaEnvelope />

                      <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) =>
                          setEmail(e.target.value)
                        }
                        autoComplete="email"
                      />

                    </div>

                    {/* PASSWORD */}

                    <div className="input-group">

                      <FaLock />

                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                        autoComplete="current-password"
                      />

                    </div>

                    {/* OPTIONS */}

                    <div className="options">

                      <label>

                        <input
                          type="checkbox"
                        />

                        Remember Me

                      </label>

                      <Link to="/forgot-password">
                        Forgot Password?
                      </Link>

                    </div>

                    {/* ERROR */}

                    {error && (
                      <div className="login-error">
                        {error}
                      </div>
                    )}

                    {/* SUCCESS */}

                    {success && (
                      <div className="login-success">
                        {success}
                      </div>
                    )}

                    {/* LOGIN BUTTON */}

                    <button
                      type="submit"
                      className="login-btn"
                      disabled={loading}
                    >

                      {loading
                        ? "Checking..."
                        : "Login"}

                    </button>

                  </form>

                  {/* REGISTER */}

                  <p className="register-link">

                    Don't have an account?

                    <Link to="/register">
                      {" "}Register
                    </Link>

                  </p>

                </>
              )}

              {/* ==================================
                  OTP SCREEN
              ================================== */}

              {showOtp && (
                <>

                  <div className="otp-icon">

                    <FaKey />

                  </div>

                  <h2>Verify Your Email</h2>

                  <p className="subtitle">

                    We have sent a 6-digit OTP to

                    <br />

                    <strong>{email}</strong>

                  </p>

                  <form onSubmit={handleVerifyOtp}>

                    {/* OTP INPUT */}

                    <div className="input-group">

                      <FaKey />

                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => {

                          const value =
                            e.target.value.replace(
                              /\D/g,
                              ""
                            );

                          if (value.length <= 6) {
                            setOtp(value);
                          }

                        }}
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                      />

                    </div>

                    {/* ERROR */}

                    {error && (
                      <div className="login-error">
                        {error}
                      </div>
                    )}

                    {/* SUCCESS */}

                    {success && (
                      <div className="login-success">
                        {success}
                      </div>
                    )}

                    {/* VERIFY BUTTON */}

                    <button
                      type="submit"
                      className="login-btn"
                      disabled={loading}
                    >

                      {loading
                        ? "Verifying..."
                        : "Verify OTP"}

                    </button>

                  </form>

                  {/* BACK BUTTON */}

                  <button
                    type="button"
                    className="back-login-btn"
                    onClick={handleBackToLogin}
                  >
                    ← Back to Login
                  </button>

                </>
              )}

            </div>

          </div>

          {/* ==================================
              RIGHT SIDE
          ================================== */}

          <div className="login-info">

            <FaShieldAlt className="shield" />

            <h2>
              Secure Online Auctions
            </h2>

            <p>

              Join thousands of buyers and sellers
              participating in trusted real-time
              online auctions.

            </p>

            <div className="features">

              <div>✔ Live Auctions</div>

              <div>✔ Secure Payments</div>

              <div>✔ AI Recommendations</div>

              <div>✔ Verified Sellers</div>

              <div>✔ Email OTP Verification</div>

            </div>

          </div>

        </div>

      </div>
    </>
  );
}

export default Login;