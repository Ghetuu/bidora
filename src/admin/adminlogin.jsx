import "../styles/adminlogin.css";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
  FaUser,
  FaLock,
  FaArrowRight,
  FaShieldAlt,
  FaGavel,
  FaEye,
} from "react-icons/fa";

function AdminLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/admin/login",
        formData
      );

      alert(res.data.message);
      navigate("/admin/dashboard");
    } catch (err) {
      alert(err.response?.data?.detail || "Login Failed");
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">

        <div className="admin-logo">
          <FaGavel />
          <div>
            <h2>Bidora</h2>
            <p>Online Auction System</p>
          </div>
        </div>

        <div className="admin-user-icon">
          <FaUser />
        </div>

        <h1>Admin Login</h1>

        <p className="admin-subtitle">
          Sign in to continue to the Admin Dashboard
        </p>

        <form onSubmit={handleSubmit}>

          <div className="admin-form-group">
            <label>Username</label>

            <div className="admin-input-box">
              <FaUser />

              <input
                type="text"
                name="username"
                placeholder="Enter Username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label>Password</label>

            <div className="admin-input-box">
              <FaLock />

              <input
                type="password"
                name="password"
                placeholder="Enter Password"
                value={formData.password}
                onChange={handleChange}
              />

              <FaEye />
            </div>
          </div>

          <div className="admin-options">
            <label>
              <input type="checkbox" />
              Remember Me
            </label>

            <a href="/">Forgot Password?</a>
          </div>

          <button
            type="submit"
            className="admin-login-btn"
          >
            <FaArrowRight />
            Login
          </button>

        </form>

        <div className="admin-features-box">

          <h3>Admin Features</h3>

          <ul>
            <li>✔ User Management</li>
            <li>✔ Product Approval</li>
            <li>✔ Auction Monitoring</li>
            <li>✔ KYC Verification</li>
          </ul>

        </div>

        <div className="admin-security">
          <FaShieldAlt />
          Secure Admin Access
        </div>

        <p className="admin-copyright">
          © 2026 Bidora Admin Panel
        </p>

      </div>
    </div>
  );
}

export default AdminLogin;