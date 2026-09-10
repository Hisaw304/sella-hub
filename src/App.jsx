import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import { supabase } from "./lib/supabase";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import ContactPage from "./pages/ContactPage";
import FAQ from "./pages/FAQ";
import About from "./pages/About";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Pricing from "./pages/Pricing";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Dashboard from "./pages/Dashboard";
import CreateListing from "./pages/CreateListing";
import MyListings from "./pages/MyListings";
import ListingDetails from "./pages/ListingDetails";
import EditListing from "./pages/EditListing";
import Profile from "./pages/Profile";
import Verification from "./pages/Verification";
import Payment from "./pages/Payment";
import SavedListings from "./pages/SavedListings";
import MyPlan from "./pages/MyPlan";
import Plans from "./pages/Plans";
import Checkout from "./pages/Checkout";
import BrowseListings from "./pages/BrowseListings";
import Categories from "./pages/Categories";
import SellerProfile from "./pages/SellerProfile";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminListings from "./pages/admin/AdminListings";
import AdminListingReview from "./pages/admin/AdminListingReview";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminVerification from "./pages/admin/AdminVerification";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";

import Notifications from "./pages/Notifications";

import Maintenance from "./pages/Maintenance";

const App = () => {
  const location = useLocation();

  const [maintenance, setMaintenance] = useState({
    loading: true,
    enabled: false,
    message: "",
  });

  /*
  =========================================
  CHECK MAINTENANCE MODE
  =========================================
  */
  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const { data, error } = await supabase.rpc("get_public_site_settings");

        if (error) {
          console.error("Maintenance mode check failed:", error);

          /*
            Fail open.

            If the settings request fails, don't
            accidentally take the marketplace offline.
          */
          setMaintenance({
            loading: false,
            enabled: false,
            message: "",
          });

          return;
        }

        const settings = data?.[0];

        setMaintenance({
          loading: false,
          enabled: settings?.maintenance_mode === true,
          message:
            settings?.maintenance_message ||
            "SellaHub is temporarily unavailable while we make some improvements. Please check back shortly.",
        });
      } catch (error) {
        console.error("Unexpected maintenance check error:", error);

        setMaintenance({
          loading: false,
          enabled: false,
          message: "",
        });
      }
    };

    checkMaintenanceMode();
  }, []);

  /*
  =========================================
  ADMIN ROUTES MUST REMAIN ACCESSIBLE
  =========================================
  */
  const isAdminRoute = location.pathname.startsWith("/admin");

  /*
  =========================================
  STANDALONE PAGES
  =========================================
  */
  const isStandalonePage =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/admin");

  /*
  =========================================
  MAINTENANCE SCREEN
  =========================================

  Admin pages are intentionally excluded so
  you can still access /admin/settings and
  turn maintenance mode back off.
  */
  if (!maintenance.loading && maintenance.enabled && !isAdminRoute) {
    return <Maintenance message={maintenance.message} />;
  }

  /*
  =========================================
  LOADING
  =========================================

  Prevent the marketplace from briefly
  appearing before the maintenance setting
  has been checked.
  */
  if (maintenance.loading) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {!isStandalonePage && <Navbar />}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/contact" element={<ContactPage />} />

          <Route path="/faq" element={<FAQ />} />

          <Route path="/about" element={<About />} />

          <Route path="/login" element={<Login />} />

          <Route path="/signup" element={<Signup />} />

          <Route path="/pricing" element={<Pricing />} />

          <Route path="/terms" element={<Terms />} />

          <Route path="/privacy" element={<Privacy />} />

          {/* =====================================
              DASHBOARD
          ====================================== */}

          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/dashboard/create-listing" element={<CreateListing />} />

          <Route path="/dashboard/my-listings" element={<MyListings />} />

          <Route path="/dashboard/edit-listing/:id" element={<EditListing />} />

          <Route path="/dashboard/profile" element={<Profile />} />

          <Route path="/dashboard/verification" element={<Verification />} />

          <Route path="/dashboard/saved" element={<SavedListings />} />

          <Route path="/dashboard/plan" element={<MyPlan />} />

          <Route path="/dashboard/payments" element={<Payment />} />

          <Route path="/dashboard/plans" element={<Plans />} />

          <Route path="/dashboard/notifications" element={<Notifications />} />

          <Route path="/dashboard/checkout/:planId" element={<Checkout />} />

          {/* =====================================
              PUBLIC LISTING
          ====================================== */}

          <Route path="/listing/:slug" element={<ListingDetails />} />

          {/* =====================================
              PUBLIC MARKETPLACE
          ====================================== */}

          <Route path="/browse" element={<BrowseListings />} />

          <Route path="/categories" element={<Categories />} />

          <Route path="/seller/:id" element={<SellerProfile />} />

          {/* =====================================
              ADMIN
          ====================================== */}

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />

            <Route path="listings" element={<AdminListings />} />

            <Route path="listings/:id" element={<AdminListingReview />} />

            <Route path="users" element={<AdminUsers />} />

            <Route path="categories" element={<AdminCategories />} />

            <Route path="plans" element={<AdminPlans />} />

            <Route path="transactions" element={<AdminTransactions />} />

            <Route path="verification" element={<AdminVerification />} />

            <Route path="reports" element={<AdminReports />} />

            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </main>

      {!isStandalonePage && <Footer />}
    </div>
  );
};

export default App;
