import "../styles/Register.css";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { Link, useNavigate } from "react-router-dom";

import axios from "axios";

import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaPaperPlane,
  FaCheckCircle,
  FaFileAlt,
} from "react-icons/fa";

import Navbar from "../components/Navbar";


// ==========================================
// VALIDATION REGEX
// ==========================================

const FULLNAME_REGEX =
  /^[A-Za-z\s]+$/;

const USERNAME_REGEX =
  /^[A-Za-z@_#]+$/;

// Exactly 10 digits, starting 6-9 (matches backend UserCreate schema)
const MOBILE_REGEX =
  /^[6-9]\d{9}$/;

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.(com|in|org|net|edu|gov|co|io|info|biz)$/i; 

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-]).{6,}$/;


// ==========================================
// OTP
// ==========================================

const OTP_DURATION_SECONDS =
  3 * 60 + 40;


const formatTime = (totalSeconds) => {

  const minutes =
    Math.floor(totalSeconds / 60);

  const seconds =
    totalSeconds % 60;

  return `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
};


// ==========================================
// COMPONENT
// ==========================================

function Register() {

  const navigate = useNavigate();

  const [formData, setFormData] =
    useState({
      fullname: "",
      username: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: "",
      address: "",
      terms: false,
    });


  // ==========================================
  // OTP STATE
  // ==========================================

  const [otpSent, setOtpSent] =
    useState(false);

  const [otp, setOtp] =
    useState("");

  const [otpVerified, setOtpVerified] =
    useState(false);

  const [otpTimer, setOtpTimer] =
    useState(0);

  const [otpExpired, setOtpExpired] =
    useState(false);


  // ==========================================
  // LOADING
  // ==========================================

  const [loading, setLoading] =
    useState(false);

  const [registering, setRegistering] =
    useState(false);


  const timerIntervalRef =
    useRef(null);


  // ==========================================
  // STOP TIMER
  // ==========================================

  const stopOtpTimer = () => {

    if (timerIntervalRef.current) {

      clearInterval(
        timerIntervalRef.current
      );

      timerIntervalRef.current = null;
    }

    setOtpTimer(0);
    setOtpExpired(false);
  };


  // ==========================================
  // START TIMER
  // ==========================================

  const startOtpTimer = () => {

    if (timerIntervalRef.current) {

      clearInterval(
        timerIntervalRef.current
      );
    }

    setOtpExpired(false);

    setOtpTimer(
      OTP_DURATION_SECONDS
    );


    timerIntervalRef.current =
      setInterval(() => {

        setOtpTimer((previous) => {

          if (previous <= 1) {

            clearInterval(
              timerIntervalRef.current
            );

            timerIntervalRef.current =
              null;

            setOtpExpired(true);

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

        clearInterval(
          timerIntervalRef.current
        );
      }
    };

  }, []);


  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (e) => {

    const {
      name,
      value,
      type,
      checked,
    } = e.target;


    setFormData((previous) => ({
      ...previous,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));


    // Email changed
    // OTP must be verified again

    if (name === "email") {

      setOtpSent(false);

      setOtpVerified(false);

      setOtp("");

      stopOtpTimer();
    }


    // Mobile changed
    // OTP must be verified again
    // (mobile is checked together with email for duplicates)

    if (name === "mobile") {

      setOtpSent(false);

      setOtpVerified(false);

      setOtp("");

      stopOtpTimer();
    }
  };


  // ==========================================
  // VALIDATE FIELDS BEFORE SENDING OTP
  // ==========================================
  //
  // Checks every field except OTP itself and
  // Terms & Conditions (those don't apply yet
  // at the "send OTP" stage).
  //

  const validateBeforeOtp = () => {

    const fullname =
      formData.fullname.trim();

    const username =
      formData.username.trim();

    const email =
      formData.email
        .trim()
        .toLowerCase();

    const mobile =
      formData.mobile.trim();

    const address =
      formData.address.trim();


    // ==========================================
    // FULL NAME
    // ==========================================

    if (!fullname) {

      alert(
        "Please enter your full name."
      );

      return false;
    }


    if (!FULLNAME_REGEX.test(fullname)) {

      alert(
        "Full name can only contain letters and spaces."
      );

      return false;
    }


    // ==========================================
    // USERNAME
    // ==========================================

    if (!username) {

      alert(
        "Please enter your username."
      );

      return false;
    }


    if (!USERNAME_REGEX.test(username)) {

      alert(
        "Username can only contain letters, '@', '_' and '#'. Digits and other special characters are not allowed."
      );

      return false;
    }


    // ==========================================
    // EMAIL
    // ==========================================

    if (!email) {

      alert(
        "Please enter your email address."
      );

      return false;
    }


    if (!EMAIL_REGEX.test(email)) {

      alert(
        "Please enter a valid email address."
      );

      return false;
    }


    // ==========================================
    // MOBILE
    // ==========================================

    if (!mobile) {

      alert(
        "Please enter your mobile number."
      );

      return false;
    }


    if (!MOBILE_REGEX.test(mobile)) {

      alert(
        "Mobile number must be a valid 10-digit number."
      );

      return false;
    }


    // ==========================================
    // PASSWORD
    // ==========================================

    if (!formData.password) {

      alert(
        "Please enter your password."
      );

      return false;
    }


    if (!PASSWORD_REGEX.test(
      formData.password
    )) {

      alert(
        "Password must be at least 6 characters and include one uppercase letter, one lowercase letter, one digit and one special character."
      );

      return false;
    }


    // ==========================================
    // CONFIRM PASSWORD
    // ==========================================

    if (!formData.confirmPassword) {

      alert(
        "Please confirm your password."
      );

      return false;
    }


    if (
      formData.password !==
      formData.confirmPassword
    ) {

      alert(
        "Password and Confirm Password do not match."
      );

      return false;
    }


    // ==========================================
    // ADDRESS
    // ==========================================

    if (!address) {

      alert(
        "Please enter your address."
      );

      return false;
    }


    return true;
  };


  // ==========================================
  // SEND OTP
  // ==========================================

  const handleSendOTP = async () => {

    // Validate every field first.
    // If anything is invalid, show alert
    // and stop here (OTP is not requested).

    if (!validateBeforeOtp()) {

      return;
    }


    const email =
      formData.email
        .trim()
        .toLowerCase();

    const mobile =
      formData.mobile.trim();


    if (
      otpSent &&
      !otpExpired &&
      otpTimer > 0
    ) {

      alert(
        `Please wait ${formatTime(
          otpTimer
        )} before requesting a new OTP.`
      );

      return;
    }


    try {

      setLoading(true);


      const response =
        await axios.post(
          "http://127.0.0.1:8000/api/users/send-otp",
          {
            email: email,
            mobile: mobile,
          }
        );


      alert(
        response.data.message ||
          "OTP sent successfully."
      );


      setFormData((previous) => ({
        ...previous,
        email: email,
      }));

      setOtpSent(true);

      setOtpVerified(false);

      setOtp("");

      startOtpTimer();

    } catch (error) {

      console.error(error);

      // Shows backend message, including:
      // "Same email / phone number not valid. Already registered."

      alert(
        error.response?.data?.detail ||
          "Unable to send OTP. Please try again."
      );

    } finally {

      setLoading(false);
    }
  };


  // ==========================================
  // VERIFY OTP
  // ==========================================

  const handleVerifyOTP = async () => {

    if (otpExpired) {

      alert(
        "OTP has expired. Please resend OTP."
      );

      return;
    }


    if (!otp) {

      alert(
        "Please enter the OTP."
      );

      return;
    }


    if (!/^\d{6}$/.test(otp)) {

      alert(
        "OTP must contain exactly 6 digits."
      );

      return;
    }


    try {

      setLoading(true);


      const response =
        await axios.post(
          "http://127.0.0.1:8000/api/users/verify-otp",
          {
            email:
              formData.email
                .trim()
                .toLowerCase(),

            otp: otp,
          }
        );


      alert(
        response.data.message ||
          "Email verified successfully."
      );


      setOtpVerified(true);

      stopOtpTimer();

    } catch (error) {

      console.error(error);

      setOtpVerified(false);

      alert(
        error.response?.data?.detail ||
          "Invalid or expired OTP."
      );

    } finally {

      setLoading(false);
    }
  };


  // ==========================================
  // VALIDATE FORM (final submit, includes OTP + terms)
  // ==========================================

  const validateForm = () => {

    if (!validateBeforeOtp()) {

      return false;
    }


    // ==========================================
    // OTP
    // ==========================================

    if (!otpVerified) {

      alert(
        "Please verify your email with OTP first."
      );

      return false;
    }


    // ==========================================
    // TERMS
    // ==========================================

    if (!formData.terms) {

      alert(
        "Please accept Terms & Conditions."
      );

      return false;
    }


    return true;
  };


  // ==========================================
  // REGISTER
  // ==========================================

  const handleSubmit = async (e) => {

    e.preventDefault();


    if (!validateForm()) {

      return;
    }


    try {

      setRegistering(true);


      const response =
        await axios.post(
          "http://127.0.0.1:8000/api/users/register",
          {
            fullname:
              formData.fullname.trim(),

            username:
              formData.username.trim(),

            email:
              formData.email
                .trim()
                .toLowerCase(),

            mobile:
              formData.mobile.trim(),

            password:
              formData.password,

            confirm_password:
              formData.confirmPassword,

            address:
              formData.address.trim(),
          }
        );


      alert(
        response.data.message ||
          "Registration successful."
      );


      // ==========================================
      // CLEAR FORM
      // ==========================================

      setFormData({
        fullname: "",
        username: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
        address: "",
        terms: false,
      });


      setOtp("");

      setOtpSent(false);

      setOtpVerified(false);

      stopOtpTimer();


      // ==========================================
      // GO TO LOGIN
      // ==========================================

      navigate("/login");

    } catch (error) {

      console.error(
        "Registration error:",
        error
      );


      alert(
        error.response?.data?.detail ||
          "Registration failed. Please try again."
      );

    } finally {

      setRegistering(false);
    }
  };


  // ==========================================
  // JSX
  // ==========================================

  return (
    <>
      <Navbar />

      <div className="register-page">

        <div className="register-card">

          {/* =====================================
              LEFT SIDE
          ===================================== */}

          <div className="register-form">

            <div className="heading">

              <h1>
                Create Your Account
              </h1>

              <div className="heading-line"></div>

            </div>


            <form
              onSubmit={handleSubmit}
            >

              {/* FULL NAME */}

              <div className="input-box full">

                <FaUser />

                <input
                  type="text"
                  name="fullname"
                  placeholder="Full Name"
                  value={
                    formData.fullname
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>


              {/* USERNAME + MOBILE */}

              <div className="grid-2">

                <div className="input-box">

                  <FaUser />

                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={
                      formData.username
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="input-box">

                  <FaPhone />

                  <input
                    type="tel"
                    name="mobile"
                    placeholder="Mobile Number"
                    maxLength={10}
                    inputMode="numeric"
                    value={
                      formData.mobile
                    }
                    onChange={(e) => {

                      const value =
                        e.target.value.replace(
                          /\D/g,
                          ""
                        );

                      setFormData(
                        (previous) => ({
                          ...previous,
                          mobile:
                            value.slice(
                              0,
                              10
                            ),
                        })
                      );

                      setOtpSent(false);
                      setOtpVerified(false);
                      setOtp("");
                      stopOtpTimer();
                    }}
                  />

                </div>

              </div>


              {/* PASSWORD */}

              <div className="grid-2">

                <div className="input-box">

                  <FaLock />

                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={
                      formData.password
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="input-box">

                  <FaLock />

                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={
                      formData.confirmPassword
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>


              {/* EMAIL */}

              <div className="input-box full">

                <FaEnvelope />

                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={
                    formData.email
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>


              {/* ADDRESS */}

              <div className="input-box full textarea-box">

                <FaMapMarkerAlt />

                <textarea
                  rows="3"
                  name="address"
                  placeholder="Address"
                  value={
                    formData.address
                  }
                  onChange={
                    handleChange
                  }
                ></textarea>

              </div>


              {/* =================================
                  EMAIL OTP
              ================================= */}

              <div className="otp-section">

                <div className="otp-title">

                  <span>
                    Email Verification
                  </span>

                </div>


                <p className="otp-description">

                  OTP will be sent to the
                  email entered above.

                </p>


                {/* SEND OTP */}

                {!otpSent && (

                  <button
                    type="button"
                    className="send-otp-btn"
                    onClick={
                      handleSendOTP
                    }
                    disabled={
                      loading ||
                      !formData.email
                    }
                  >

                    <FaPaperPlane />

                    {loading
                      ? "Sending OTP..."
                      : "Send OTP"}

                  </button>

                )}


                {/* OTP INPUT */}

                {otpSent &&
                  !otpVerified && (

                    <div className="otp-box">

                      <div className="otp-input-row">

                        <div className="input-box otp-input">

                          <FaLock />

                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            disabled={
                              otpExpired
                            }
                            onChange={(e) => {

                              const value =
                                e.target.value.replace(
                                  /\D/g,
                                  ""
                                );

                              setOtp(
                                value.slice(
                                  0,
                                  6
                                )
                              );
                            }}
                          />

                        </div>


                        <button
                          type="button"
                          className="verify-otp-btn"
                          onClick={
                            handleVerifyOTP
                          }
                          disabled={
                            loading ||
                            otpExpired
                          }
                        >

                          {loading
                            ? "Verifying..."
                            : "Verify OTP"}

                        </button>

                      </div>


                      {/* TIMER */}

                      {!otpExpired ? (

                        <p className="otp-timer-text">

                          OTP expires in{" "}

                          <b>
                            {formatTime(
                              otpTimer
                            )}
                          </b>

                        </p>

                      ) : (

                        <p className="otp-expired-text">

                          OTP has expired.

                        </p>

                      )}


                      {/* RESEND */}

                      <p className="resend-text">

                        Didn't receive OTP?

                        <button
                          type="button"
                          onClick={
                            handleSendOTP
                          }
                          disabled={
                            loading ||
                            (
                              !otpExpired &&
                              otpTimer > 0
                            )
                          }
                        >

                          {loading
                            ? "Resending..."
                            : otpExpired
                            ? "Resend OTP"
                            : `Resend OTP (${formatTime(
                                otpTimer
                              )})`}

                        </button>

                      </p>

                    </div>
                  )}


                {/* VERIFIED */}

                {otpVerified && (

                  <div className="otp-success">

                    <FaCheckCircle />

                    <span>
                      Email Verified
                    </span>

                  </div>

                )}

              </div>


              {/* TERMS */}

              <div className="checkbox">

                <input
                  type="checkbox"
                  name="terms"
                  checked={
                    formData.terms
                  }
                  onChange={
                    handleChange
                  }
                />

                <span>

                  I agree to the{" "}

                  <a href="#">
                    Terms & Conditions
                  </a>

                </span>

              </div>


              {/* LOGIN */}

              <p className="register-link">

                Already have an account?

                <Link to="/login">
                  Login
                </Link>

              </p>


              {/* REGISTER */}

              <div className="buttons">

                <button
                  type="submit"
                  className="register-btn"
                  disabled={
                    !otpVerified ||
                    !formData.terms ||
                    registering
                  }
                >

                  {registering
                    ? "Registering..."
                    : "Register"}

                </button>

              </div>

            </form>

          </div>


          {/* =====================================
              RIGHT SIDE
          ===================================== */}

          <div className="register-info">

            <div className="shield-wrapper">

              <FaShieldAlt
                className="shield"
              />

            </div>


            <h2>
              Account Verification
            </h2>


            <p className="info-description">

              Verify your email address
              and wait for admin approval.

            </p>


            <div className="process-card">

              <h3>
                Registration Process
              </h3>


              <div className="process-item">

                <div className="process-icon">
                  <FaFileAlt />
                </div>

                <span>
                  Enter account details
                </span>

              </div>


              <div className="process-item">

                <div className="process-icon">
                  <FaEnvelope />
                </div>

                <span>
                  Verify email with OTP
                </span>

              </div>


              <div className="process-item">

                <div className="process-icon">
                  <FaUser />
                </div>

                <span>
                  Admin reviews account
                </span>

              </div>


              <div className="process-item">

                <div className="process-icon">
                  <FaCheckCircle />
                </div>

                <span>
                  Login after approval
                </span>

              </div>

            </div>


            <div className="security-card">

              <FaShieldAlt />

              <div>

                <h4>
                  Secure & Trusted
                </h4>

                <p>
                  Your information is safe
                  with us. We never share
                  your details.
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>
    </>
  );
}


export default Register;
