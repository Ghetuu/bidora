import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";


// =====================================================
// PUBLIC PAGES
// =====================================================

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import ContactPage from "./pages/ContactPage";


// =====================================================
// ADMIN PAGES
// =====================================================

import AdminLogin from "./admin/adminlogin";
import AdminDashboard from "./admin/admindashboard";
import AdminHome from "./admin/adminhome";
import AdminUsers from "./admin/adminusers";
import PendingAuction from "./admin/PendingAuction";
import ContactMessages from "./admin/ContactMessages";

// =====================================================
// USER DASHBOARD
// =====================================================

import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/dashboard_home";
import CreateAuction from "./pages/createauctionform";
import MyAuctions from "./pages/MyAuctions";
import AuctionDetails from "./pages/auctiondetails";
import AllAuctions from "./pages/AllAuctions";
import LiveAuctions from "./pages/LiveAuctions";

function App() {

  return (

    <BrowserRouter>

      <Routes>


        {/* =================================================
            PUBLIC PAGES
        ================================================= */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />
        <Route
          path="/contact"
          element={<ContactPage />}
        />


        {/* =================================================
            USER DASHBOARD
        ================================================= */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        >

          {/* Default User Dashboard */}

          <Route
            index
            element={<DashboardHome />}
          />

          {/* User Dashboard Home */}

          <Route
            path="home"
            element={<DashboardHome />}
          />

          <Route 
            path="create-auction" 
            element={<CreateAuction />} 
          />

          <Route
            path="my-auctions"
            element={<MyAuctions />}
          />

            <Route
              path="auction/:id"
              element={<AuctionDetails />}
            />

            <Route
              path="all-auctions"
              element={<AllAuctions />}
            />
            <Route
              path="live-auctions"
              element={<LiveAuctions />}
            />
          

        </Route>


        {/* =================================================
            ADMIN LOGIN
        ================================================= */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />


        {/* =================================================
            ADMIN DASHBOARD
            Sidebar + Navbar + Page Content
        ================================================= */}

        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        >

          {/* =============================================
              DEFAULT ADMIN HOME

              URL:
              /admin/dashboard
          ============================================= */}

          <Route
            index
            element={<AdminHome />}
          />


          {/* =============================================
              ALL USERS

              URL:
              /admin/dashboard/users
          ============================================= */}

          <Route
            path="users"
            element={<AdminUsers />}
          />

           <Route
          path="auctions/pending"
          element={<PendingAuction />}
        />

         <Route
            path="contact-messages"
            element={<ContactMessages />}
          />


        </Route>

       

        {/* =================================================
            UNKNOWN URL
        ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>

  );

}


export default App;