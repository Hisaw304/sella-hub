import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Clock3,
  LoaderCircle,
  Package,
  UserRound,
  Users,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    listings: 0,
    sellers: 0,
    customers: 0,
    pending: 0,
  });

  const [recentListings, setRecentListings] = useState([]);
  const [recentSellers, setRecentSellers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        /*
        ========================================
        FETCH LISTING COUNT
        ========================================
        */

        const { count: listingCount, error: listingsCountError } =
          await supabase.from("listings").select("*", {
            count: "exact",
            head: true,
          });

        if (listingsCountError) {
          throw listingsCountError;
        }

        /*
        ========================================
        FETCH ACTIVE SELLERS
        ========================================
        */

        const { data: activeSellerPlans, error: activeSellerError } =
          await supabase
            .from("user_plans")
            .select(
              `
      user_id,
      status,
      started_at,
      expired_at
    `
            )
            .eq("status", "active")
            .gt("expired_at", new Date().toISOString());

        console.log("ACTIVE SELLER PLANS:", activeSellerPlans);
        console.log("ACTIVE SELLER ERROR:", activeSellerError);

        if (activeSellerError) {
          throw activeSellerError;
        }

        const activeSellerIds = [
          ...new Set((activeSellerPlans || []).map((plan) => plan.user_id)),
        ];

        console.log("ACTIVE SELLER IDS:", activeSellerIds);

        const sellerCount = activeSellerIds.length;

        /*
        ========================================
        FETCH CUSTOMERS
        ========================================
        */

        // For now, normal "user" profiles are treated as customers.
        const { count: customerCount, error: customersCountError } =
          await supabase
            .from("profiles")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("role", "user");

        if (customersCountError) {
          throw customersCountError;
        }

        /*
        ========================================
        FETCH PENDING LISTINGS
        ========================================
        */

        const { count: pendingCount, error: pendingCountError } = await supabase
          .from("listings")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("status", "pending");

        if (pendingCountError) {
          throw pendingCountError;
        }

        /*
        ========================================
        FETCH RECENT LISTINGS
        ========================================
        */

        const { data: listingsData, error: listingsError } = await supabase
          .from("listings")
          .select(
            `
              id,
              title,
              status,
              created_at,
              user_id,
              categories (
                name
              )
            `
          )
          .order("created_at", {
            ascending: false,
          })
          .limit(5);

        if (listingsError) {
          throw listingsError;
        }

        /*
        ========================================
        FETCH RECENT ACTIVE SELLERS
        ========================================
        */

        let sellersData = [];

        if (activeSellerIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select(
              `
              id,
              full_name,
              business_name,
              avatar_url,
              created_at,
              role
            `
            )
            .in("id", activeSellerIds)
            .order("created_at", {
              ascending: false,
            })
            .limit(5);

          if (profilesError) {
            throw profilesError;
          }

          sellersData = profilesData || [];
        }

        /*
        ========================================
        UPDATE DASHBOARD STATS
        ========================================
        */

        setStats({
          listings: listingCount || 0,
          sellers: sellerCount || 0,
          customers: customerCount || 0,
          pending: pendingCount || 0,
        });

        /*
        ========================================
        UPDATE RECENT DATA
        ========================================
        */

        setRecentListings(listingsData || []);
        setRecentSellers(sellersData);
      } catch (err) {
        console.error("Admin dashboard error:", err);

        setError(err.message || "Unable to load the admin dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "active":
        return "active";

      case "pending":
        return "pending";

      case "rejected":
        return "rejected";

      case "sold":
        return "sold";

      default:
        return "";
    }
  };

  if (loading) {
    return (
      <main className="sh-admin-content">
        <div className="sh-admin-loading">
          <LoaderCircle size={25} className="sh-admin-spinner" />
          <span>Loading dashboard...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="sh-admin-content">
        <div className="sh-admin-error">
          <ShieldCheck size={22} />
          <div>
            <h3>Unable to load dashboard</h3>
            <p>{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="sh-admin-content">
      {/* ========================================
          HEADER
      ======================================== */}

      <div className="sh-admin-dashboard-header">
        <div>
          <span className="sh-admin-eyebrow">Administrator overview</span>

          <h1>Dashboard</h1>

          <p>Here's what's happening across SellaHub today.</p>
        </div>
      </div>

      {/* ========================================
    STAT CARDS
======================================== */}

      <div className="sh-admin-stats">
        {/* LISTINGS */}

        <div className="sh-admin-stat-card">
          <div className="sh-admin-stat-top">
            <span>Total Listings</span>

            <div className="sh-admin-stat-icon">
              <Package size={19} />
            </div>
          </div>

          <strong>{stats.listings.toLocaleString()}</strong>

          <p>All listings on SellaHub</p>
        </div>

        {/* SELLERS */}

        <div className="sh-admin-stat-card">
          <div className="sh-admin-stat-top">
            <span>Active Sellers</span>

            <div className="sh-admin-stat-icon">
              <Users size={19} />
            </div>
          </div>

          <strong>{stats.sellers.toLocaleString()}</strong>

          <p>Currently subscribed sellers</p>
        </div>

        {/* CUSTOMERS */}

        <div className="sh-admin-stat-card">
          <div className="sh-admin-stat-top">
            <span>Total Customers</span>

            <div className="sh-admin-stat-icon">
              <UserRound size={19} />
            </div>
          </div>

          <strong>{stats.customers.toLocaleString()}</strong>

          <p>Registered customers</p>
        </div>

        {/* PENDING */}

        <div className="sh-admin-stat-card">
          <div className="sh-admin-stat-top">
            <span>Pending Reviews</span>

            <div className="sh-admin-stat-icon">
              <Clock3 size={19} />
            </div>
          </div>

          <strong>{stats.pending.toLocaleString()}</strong>

          <p className="sh-admin-stat-warning">Listings awaiting review</p>
        </div>
      </div>

      {/* ========================================
          LOWER CONTENT
      ======================================== */}

      <div className="sh-admin-overview-grid">
        {/* ========================================
            RECENT LISTINGS
        ======================================== */}

        <section className="sh-admin-panel">
          <div className="sh-admin-panel-header">
            <div>
              <span>Marketplace</span>
              <h2>Recent listings</h2>
            </div>

            <Link to="/admin/listings">
              View all
              <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className="sh-admin-listings">
            {recentListings.length === 0 ? (
              <div className="sh-admin-empty">
                <Package size={22} />
                <p>No listings yet.</p>
              </div>
            ) : (
              recentListings.map((listing) => (
                <div className="sh-admin-listing-row" key={listing.id}>
                  <div className="sh-admin-listing-icon">
                    <Package size={18} />
                  </div>

                  <div className="sh-admin-listing-info">
                    <h3>{listing.title}</h3>

                    <span>{listing.categories?.name || "Uncategorized"}</span>
                  </div>

                  <div className="sh-admin-listing-right">
                    <span
                      className={`sh-admin-status ${getStatusClass(
                        listing.status
                      )}`}
                    >
                      {listing.status || "Unknown"}
                    </span>

                    <time>{formatDate(listing.created_at)}</time>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ========================================
            RECENT SELLERS
        ======================================== */}

        <section className="sh-admin-panel">
          <div className="sh-admin-panel-header">
            <div>
              <span>Community</span>
              <h2>Recent sellers</h2>
            </div>

            <Link to="/admin/sellers">
              View all
              <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className="sh-admin-sellers">
            {recentSellers.length === 0 ? (
              <div className="sh-admin-empty">
                <Users size={22} />
                <p>No sellers yet.</p>
              </div>
            ) : (
              recentSellers.map((seller) => (
                <div className="sh-admin-seller-row" key={seller.id}>
                  <div className="sh-admin-seller-avatar">
                    {seller.avatar_url ? (
                      <img
                        src={seller.avatar_url}
                        alt={
                          seller.business_name || seller.full_name || "Seller"
                        }
                      />
                    ) : (
                      <UserRound size={18} />
                    )}
                  </div>

                  <div className="sh-admin-seller-info">
                    <h3>
                      {seller.business_name ||
                        seller.full_name ||
                        "Unnamed seller"}
                    </h3>

                    <span>
                      {seller.business_name && seller.full_name
                        ? seller.full_name
                        : "Seller"}
                    </span>
                  </div>

                  <time>{formatDate(seller.created_at)}</time>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminDashboard;
