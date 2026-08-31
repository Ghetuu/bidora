import { useEffect, useRef, useState } from "react";
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

// ==========================================
// OTP TIMER
// ==========================================

const OTP_DURATION_SECONDS = 3 * 60 + 30;

const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

function Login() {
  const navigate = useNavigate();

  // ==========================================
  // STATE
  // ==========================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [otp, setOtp] = useState("");

  const [showOtp, setShowOtp] = useState(false);

  const [otpTimer, setOtpTimer] = useState(0);
  const [otpExpired, setOtpExpired] = useState(false);

  const timerIntervalRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // START OTP TIMER
  // ==========================================

  const startOtpTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setOtpExpired(false);
    setOtpTimer(OTP_DURATION_SECONDS);

    timerIntervalRef.current = setInterval(() => {
      setOtpTimer((previous) => {
        if (previous <= 1) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;

          setOtpExpired(true);

          // Remove old OTP success message
          setSuccess("");

          return 0;
        }

        return previous - 1;
      });
    }, 1000);
  };

  // ==========================================
  // CLEAN TIMER
  // ==========================================

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

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
        setError(data.detail || "Invalid email or password.");
        return;
      }

      // ==========================================
      // LOGIN CREDENTIALS VALID
      // OTP SENT
      // ==========================================

      setShowOtp(true);

      setOtp("");
      startOtpTimer();

      setSuccess(
        data.message || "OTP has been sent to your email."
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
  // RESEND OTP
  // ==========================================

  const handleResendOtp = async () => {
    setError("");
    setSuccess("");

    // Do not resend while timer is active
    if (!otpExpired && otpTimer > 0) {
      return;
    }

    try {
      setResendLoading(true);

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
          data.detail || "Unable to resend OTP."
        );
        return;
      }

      // Clear previous OTP
      setOtp("");

      // Start new 3:30 timer
      startOtpTimer();

      setSuccess(
        data.message ||
          "A new OTP has been sent to your email."
      );
    } catch (error) {
      console.error("RESEND OTP ERROR:", error);

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setResendLoading(false);
    }
  };

  // ==========================================
  // VERIFY LOGIN OTP
  // ==========================================

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // ==========================================
    // CHECK OTP EXPIRATION
    // ==========================================

    if (otpExpired || otpTimer <= 0) {
      setError(
        "Your OTP has expired. Please click Resend OTP to get a new OTP."
      );
      return;
    }

    // ==========================================
    // EMPTY OTP
    // ==========================================

    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    // ==========================================
    // INVALID OTP FORMAT
    // ==========================================

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP.");
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
        // Backend invalid OTP message
        setError(data.detail || "Invalid OTP.");
        return;
      }

      // ==========================================
      // LOGIN SUCCESS
      // ==========================================

      setSuccess(
        "Login successful. Redirecting..."
      );

      // Stop timer after successful verification
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

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

    setOtpTimer(0);
    setOtpExpired(false);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

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
                        disabled={otpExpired}
                      />

                    </div>

                    {/* ==================================
                        OTP TIMER
                    ================================== */}

                    {!otpExpired ? (

                      <p className="otp-timer-text">

                        OTP expires in{" "}

                        <strong>
                          {formatTime(otpTimer)}
                        </strong>

                      </p>

                    ) : (

                      <p className="otp-expired-text">
                        OTP has expired.
                      </p>

                    )}

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
                      disabled={
                        loading || otpExpired
                      }
                    >

                      {loading
                        ? "Verifying..."
                        : "Verify OTP"}

                    </button>

                  </form>

                  {/* ==================================
                      RESEND OTP
                  ================================== */}

                  <div className="resend-otp">

                    <span>
                      Didn't receive the OTP?
                    </span>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={
                        resendLoading ||
                        (!otpExpired && otpTimer > 0)
                      }
                    >

                      {resendLoading
                        ? "Resending..."
                        : otpExpired
                        ? "Resend OTP"
                        : `Resend OTP (${formatTime(
                            otpTimer
                          )})`}

                    </button>

                  </div>

                  {/* BACK BUTTON */}

                

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