import { Link } from "react-router-dom";
import "./Navbar.css";
import bidoraIcon from "../assets/images/bidora-icon.png";

function Navbar() {
  return (
    <nav className="navbar">

      <div className="logo">
  <img src={bidoraIcon} alt="Bidora" />
  <span>Bidora</span>
</div>

      {/* Navigation Links */}
      <div className="links">
        <Link to="/">Home</Link>
        <Link to="#">Dashboard</Link>
        <Link to="/contact">Contact</Link>
        <Link to="#">About</Link>
      </div>

      {/* Login */}
      <div className="login-hover">
        <Link to="/login">Login</Link>/
      {/* </div>
       <div className="register-hover"> */}
        <Link to="/register">Register</Link>
      </div>

    </nav>
  );
}

export default Navbar;