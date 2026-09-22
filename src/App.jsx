import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";
import { RealtimeProvider } from "./context/RealtimeContext";
// =========================================================
// PUBLIC
// =========================================================
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import ContactPage from "./pages/ContactPage";

// =========================================================
// ADMIN
// =========================================================
import AdminLogin from "./admin/adminlogin";
import AdminDashboard from "./admin/admindashboard";
import AdminHome from "./admin/adminhome";
import AdminUsers from "./admin/adminusers";
import AdminAuctionList from "./admin/AdminAuctionList";
import ContactMessages from "./admin/ContactMessages";
import AdminAuctionDetails from "./admin/AdminAuctionDetails";
import LiveAuctionBidding from "./admin/LiveAuctionBidding";


// =========================================================
// USER DASHBOARD
// =========================================================
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/dashboard_home";
import CreateAuction from "./pages/createauctionform";
import MyAuctions from "./pages/MyAuctions";
import AuctionDetails from "./pages/auctiondetails";
import AllAuctions from "./pages/AllAuctions";
import LiveAuctions from "./pages/LiveAuctions";
import LiveAuctionDetails from "./pages/LiveAuctionDetails";
import ManageProfile from "./pages/ManageProfile";
import AuctionHistory from "./pages/AuctionHistory";


function App() {
  return (
     <RealtimeProvider>
    <BrowserRouter>

      <Routes>

        {/* =====================================================
            PUBLIC ROUTES
        ===================================================== */}

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

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


        {/* =====================================================
            USER DASHBOARD
        ===================================================== */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        >

          {/* /dashboard */}
          <Route
            index
            element={<DashboardHome />}
          />

          {/* /dashboard/home */}
          <Route
            path="home"
            element={<DashboardHome />}
          />

          {/* /dashboard/create-auction */}
          <Route
            path="create-auction"
            element={<CreateAuction />}
          />

          {/* /dashboard/my-auctions */}
          <Route
            path="my-auctions"
            element={<MyAuctions />}
          />

          {/* /dashboard/auction/:id */}
          <Route
            path="auction/:id"
            element={<AuctionDetails />}
          />

          {/* /dashboard/all-auctions */}
          <Route
            path="all-auctions"
            element={<AllAuctions />}
          />

          {/* /dashboard/live-auctions */}
          <Route
            path="live-auctions"
            element={<LiveAuctions />}
          />

          {/* /dashboard/live-auction/:auctionId */}
          <Route
            path="live-auction/:auctionId"
            element={<LiveAuctionDetails />}
          />
          <Route path="manage-profile" element={<ManageProfile />} />
          <Route
    path="history/auction"
    element={<AuctionHistory />}
  />

        </Route>


        {/* =====================================================
            ADMIN LOGIN
        ===================================================== */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />


        {/* =====================================================
            ADMIN DASHBOARD
        ===================================================== */}

        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        >

          {/* /admin/dashboard */}
          <Route
            index
            element={<AdminHome />}
          />

          {/* /admin/dashboard/users */}
          <Route
            path="users"
            element={<AdminUsers />}
          />


          {/* =================================================
              AUCTIONS
          ================================================= */}

          {/* All Auctions
              /admin/dashboard/auctions
          */}
          <Route
            path="auctions"
            element={
              <AdminAuctionList
                status="all"
                title="All Auctions"
              />
            }
          />


          {/* Approved Auctions
              /admin/dashboard/auctions/approved
          */}
          <Route
            path="auctions/approved"
            element={
              <AdminAuctionList
                status="approved"
                title="Approved Auctions"
              />
            }
          />


          {/* Rejected Auctions
              /admin/dashboard/auctions/rejected
          */}
          <Route
            path="auctions/rejected"
            element={
              <AdminAuctionList
                status="rejected"
                title="Rejected Auctions"
              />
            }
          />


          {/* Live Auctions
              /admin/dashboard/auctions/live
          */}
          <Route
            path="auctions/live"
            element={
              <AdminAuctionList
                status="live"
                title="Live Auctions"
              />
            }
          />
          <Route
              path="/admin/dashboard/auctions/:id/live-bidding"
              element={<LiveAuctionBidding />}
            />


          {/* Pending Auctions
              /admin/dashboard/auctions/pending
          */}
          <Route
            path="auctions/pending"
            element={
              <AdminAuctionList
                status="pending"
                title="Pending Auctions"
              />
            }
          />


          {/* Completed Auctions
              Database status = ended
              /admin/dashboard/auctions/completed
          */}
          <Route
            path="auctions/completed"
            element={
              <AdminAuctionList
                status="ended"
                title="Completed Auctions"
              />
            }
          />

           <Route
    path="/admin/dashboard/auctions/:id"
    element={<AdminAuctionDetails />}
  />


          {/* =================================================
              CONTACT MESSAGES
          ================================================= */}

          <Route
            path="contact-messages"
            element={<ContactMessages />}
          />

        </Route>


        {/* =====================================================
            FALLBACK
        ===================================================== */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </BrowserRouter>
    </RealtimeProvider>
  );
}


export default App;