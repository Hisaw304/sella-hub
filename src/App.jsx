import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";

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
import Notifications from "./pages/Notifications";
import AdminListings from "./pages/admin/AdminListings";
import AdminListingReview from "./pages/admin/AdminListingReview";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminTransactions from "./pages/admin/AdminTransactions";

const App = () => {
  const location = useLocation();

  const isStandalonePage =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/admin");

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

          {/* Dashboard */}
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

          {/* Public Listing */}
          <Route path="/listing/:slug" element={<ListingDetails />} />

          {/* Public Marketplace */}
          <Route path="/browse" element={<BrowseListings />} />
          <Route path="/categories" element={<Categories />} />

          <Route path="/seller/:id" element={<SellerProfile />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />

            {/* Later */}
            <Route path="listings" element={<AdminListings />} />
            <Route path="listings/:id" element={<AdminListingReview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="plans" element={<AdminPlans />} />
            <Route path="transactions" element={<AdminTransactions />} />
            {/* <Route path="verification" element={<AdminVerification />} /> */}
            {/* <Route path="reports" element={<AdminReports />} /> */}
            {/* <Route path="settings" element={<AdminSettings />} /> */}
          </Route>
        </Routes>
      </main>

      {!isStandalonePage && <Footer />}
    </div>
  );
};

export default App;
