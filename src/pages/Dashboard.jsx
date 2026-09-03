import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  Plus,
  Bookmark,
  BadgeCheck,
  Layers3,
  CreditCard,
  UserRound,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState(null);
  const [recentListings, setRecentListings] = useState([]);
  // const [recentListingsLoading, setRecentListingsLoading] = useState(true);

  const [stats, setStats] = useState({
    totalListings: 0,
    publishedListings: 0,
    savedListings: 0,
  });

  // const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          setRecentListings([]);
          setStats({
            totalListings: 0,
            publishedListings: 0,
            savedListings: 0,
          });

          return;
        }

        /*
      ========================================
      SET USER
      ========================================
      */

        setUser(user);

        /*
      ========================================
      RECENT LISTINGS
      ========================================
      */

        const { data: recentData, error: recentError } = await supabase
          .from("listings")
          .select(
            `
          id,
          title,
          slug,
          price,
          price_type,
          status,
          location,
          created_at,
          listing_images (
            id,
            image_url,
            sort_order
          )
        `
          )
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(5);

        if (recentError) {
          throw recentError;
        }

        const formattedRecentListings = (recentData || []).map((listing) => ({
          ...listing,

          listing_images: [...(listing.listing_images || [])].sort(
            (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
          ),
        }));

        setRecentListings(formattedRecentListings);

        /*
      ========================================
      TOTAL LISTINGS
      ========================================
      */

        const { count: totalListings, error: totalError } = await supabase
          .from("listings")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("user_id", user.id);

        if (totalError) {
          throw totalError;
        }

        /*
      ========================================
      PUBLISHED LISTINGS
      ========================================
      */

        const { count: publishedListings, error: publishedError } =
          await supabase
            .from("listings")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("user_id", user.id)
            .eq("status", "published");

        if (publishedError) {
          throw publishedError;
        }

        /*
      ========================================
      SAVED LISTINGS
      ========================================
      */

        const { count: savedListings, error: savedError } = await supabase
          .from("saved_listings")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("user_id", user.id);

        if (savedError) {
          throw savedError;
        }

        /*
      ========================================
      UPDATE STATS
      ========================================
      */

        setStats({
          totalListings: totalListings || 0,
          publishedListings: publishedListings || 0,
          savedListings: savedListings || 0,
        });
      } catch (error) {
        console.error("Dashboard data error:", error);

        setRecentListings([]);

        setStats({
          totalListings: 0,
          publishedListings: 0,
          savedListings: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUser(user);

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error) {
        setProfile(profileData);
      }

      const { data: planData, error: planError } = await supabase
        .from("user_plans")
        .select(
          `
    *,
    pricing_plans (
      name,
      price,
      max_listings,
      max_images
    )
  `
        )
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (!planError) {
        setUserPlan(planData);
      }

      setLoading(false);
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();

    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="sh-dashboard-loading">
        <div className="sh-dashboard-loader"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || "SellaHub User";

  return (
    <div className="sh-dashboard">
      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <div
          className="sh-dashboard-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}

      <aside className={`sh-dashboard-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="sh-dashboard-sidebar-top">
          <div className="sh-dashboard-brand">
            <a href="/" className="sh-dashboard-logo">
              SellaHub
            </a>

            <button
              type="button"
              className="sh-dashboard-close"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X size={19} />
            </button>
          </div>

          <nav className="sh-dashboard-nav">
            <a href="/dashboard" className="sh-dashboard-nav-item active">
              <LayoutDashboard size={18} />
              <span>Overview</span>
            </a>

            <a href="/dashboard/my-listings" className="sh-dashboard-nav-item">
              <Package size={18} />
              <span>My Listings</span>
            </a>

            <a
              href="/dashboard/create-listing"
              className="sh-dashboard-nav-item"
            >
              <Plus size={18} />
              <span>Create Listing</span>
            </a>

            <a href="/dashboard/saved" className="sh-dashboard-nav-item">
              <Bookmark size={18} />
              <span>Saved Listings</span>
            </a>

            <div className="sh-dashboard-nav-divider" />

            <a href="/dashboard/verification" className="sh-dashboard-nav-item">
              <BadgeCheck size={18} />
              <span>Verification</span>
            </a>

            <a href="/dashboard/plan" className="sh-dashboard-nav-item">
              <Layers3 size={18} />
              <span>My Plan</span>
            </a>

            <a href="/dashboard/plans" className="sh-dashboard-nav-item">
              <CreditCard size={18} />
              <span>Plans</span>
            </a>

            <a href="/dashboard/payments" className="sh-dashboard-nav-item">
              <CreditCard size={18} />
              <span>Payments</span>
            </a>

            <a href="/dashboard/profile" className="sh-dashboard-nav-item">
              <UserRound size={18} />
              <span>Profile</span>
            </a>
          </nav>
        </div>

        <div className="sh-dashboard-sidebar-bottom">
          <button
            type="button"
            className="sh-dashboard-logout"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}

      <main className="sh-dashboard-main">
        {/* TOPBAR */}

        <header className="sh-dashboard-topbar">
          <button
            type="button"
            className="sh-dashboard-menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <div className="sh-dashboard-topbar-spacer" />

          <button
            type="button"
            className="sh-dashboard-notification"
            aria-label="Notifications"
          >
            <Bell size={19} />
            <span />
          </button>

          <a href="/dashboard/profile" className="sh-dashboard-user">
            <div className="sh-dashboard-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div className="sh-dashboard-user-info">
              <strong>{displayName}</strong>
              <small>Account</small>
            </div>
          </a>
        </header>

        {/* CONTENT */}

        <div className="sh-dashboard-content">
          <div className="sh-dashboard-heading">
            <div>
              <span className="sh-dashboard-label">Dashboard</span>

              <h1>
                Welcome back, <span>{displayName.split(" ")[0]}.</span>
              </h1>

              <p>
                Manage your listings, account and SellaHub activity from one
                place.
              </p>
            </div>

            <a href="/dashboard/create-listing" className="sh-dashboard-create">
              <Plus size={17} />
              Create listing
            </a>
          </div>

          {/* STATS */}

          <div className="sh-dashboard-stats">
            <div className="sh-dashboard-stat-card">
              <div className="sh-dashboard-stat-icon">
                <Package size={19} />
              </div>

              <div>
                <span>Total listings</span>

                <strong>{loading ? "—" : stats.totalListings}</strong>
              </div>
            </div>

            <div className="sh-dashboard-stat-card">
              <div className="sh-dashboard-stat-icon">
                <BadgeCheck size={19} />
              </div>

              <div>
                <span>Published</span>

                <strong>{loading ? "—" : stats.publishedListings}</strong>
              </div>
            </div>

            <div className="sh-dashboard-stat-card">
              <div className="sh-dashboard-stat-icon">
                <Bookmark size={19} />
              </div>

              <div>
                <span>Saved listings</span>

                <strong>{loading ? "—" : stats.savedListings}</strong>
              </div>
            </div>

            <div className="sh-dashboard-stat-card">
              <div className="sh-dashboard-stat-icon">
                <CreditCard size={19} />
              </div>

              <div>
                <span>
                  {userPlan
                    ? `${Math.max(
                        0,
                        userPlan.listings_allowed - userPlan.listings_used
                      )} listings remaining`
                    : "Choose a plan"}
                </span>

                <strong>{userPlan?.pricing_plans?.name || "No plan"}</strong>

                {userPlan?.expired_at && (
                  <small className="sh-dashboard-plan-expiry">
                    Expires{" "}
                    {new Date(userPlan.expired_at).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </small>
                )}
              </div>
            </div>
          </div>

          {/* MAIN GRID */}

          <div className="sh-dashboard-grid">
            {/* GET STARTED */}

            <section className="sh-dashboard-card sh-dashboard-get-started">
              <div className="sh-dashboard-card-header">
                <div>
                  <span className="sh-dashboard-card-label">
                    {stats.totalListings > 0 ? "Keep growing" : "Get started"}
                  </span>

                  <h2>
                    {stats.totalListings > 0
                      ? "Keep your business in front of more customers."
                      : "Put your business in front of more people."}
                  </h2>
                </div>
              </div>

              <p>
                {stats.totalListings > 0
                  ? "Add more listings to showcase your products or services and reach more customers on SellaHub."
                  : "Create your first listing and start showcasing your products or services to customers on SellaHub."}
              </p>

              <a
                href="/dashboard/create-listing"
                className="sh-dashboard-card-action"
              >
                {stats.totalListings > 0
                  ? "Create another listing"
                  : "Create your first listing"}

                <ChevronRight size={16} />
              </a>
            </section>

            {/* ACCOUNT STATUS */}

            <section className="sh-dashboard-card">
              <div className="sh-dashboard-card-header">
                <div>
                  <span className="sh-dashboard-card-label">
                    Account status
                  </span>

                  <h2>Your seller profile</h2>
                </div>
              </div>

              <div className="sh-dashboard-status">
                <div className="sh-dashboard-status-row">
                  <span>Profile</span>

                  <strong className="status-complete">Complete</strong>
                </div>

                <div className="sh-dashboard-status-row">
                  <span>Email</span>

                  <strong className="status-complete">Verified</strong>
                </div>

                <div className="sh-dashboard-status-row">
                  <span>Seller verification</span>

                  <strong
                    className={
                      profile?.seller_status === "verified"
                        ? "status-complete"
                        : "status-pending"
                    }
                  >
                    {profile?.seller_status === "verified"
                      ? "Verified"
                      : "Not verified"}
                  </strong>
                </div>
              </div>

              <a
                href="/dashboard/verification"
                className="sh-dashboard-card-action"
              >
                Manage verification
                <ChevronRight size={16} />
              </a>
            </section>

            {/* RECENT LISTINGS */}

            <section className="sh-dashboard-card sh-dashboard-recent">
              <div className="sh-dashboard-card-header">
                <div>
                  <span className="sh-dashboard-card-label">Activity</span>

                  <h2>Recent listings</h2>
                </div>

                <a href="/dashboard/my-listings">View all</a>
              </div>
              {loading ? (
                <div className="sh-dashboard-empty">
                  <div className="sh-dashboard-empty-icon">
                    <Package size={21} />
                  </div>

                  <h3>Loading listings...</h3>

                  <p>Fetching your recent listings.</p>
                </div>
              ) : recentListings.length === 0 ? (
                <div className="sh-dashboard-empty">
                  <div className="sh-dashboard-empty-icon">
                    <Package size={21} />
                  </div>

                  <h3>No listings yet</h3>

                  <p>Your recently created listings will appear here.</p>

                  <a
                    href="/dashboard/create-listing"
                    className="sh-dashboard-empty-action"
                  >
                    Create listing
                  </a>
                </div>
              ) : (
                <div className="sh-dashboard-recent-list">
                  {recentListings.map((listing) => {
                    const image = listing.listing_images?.[0]?.image_url;

                    return (
                      <a
                        key={listing.id}
                        href={`/listing/${listing.slug}`}
                        className="sh-dashboard-recent-item"
                      >
                        <div className="sh-dashboard-recent-image">
                          {image ? (
                            <img src={image} alt={listing.title} />
                          ) : (
                            <Package size={20} />
                          )}
                        </div>

                        <div className="sh-dashboard-recent-info">
                          <h3>{listing.title}</h3>

                          <span>
                            {listing.location || "Location not specified"}
                          </span>

                          <strong>
                            {listing.price
                              ? `₦${Number(listing.price).toLocaleString()}`
                              : "Contact seller"}
                          </strong>
                        </div>

                        <div className="sh-dashboard-recent-status">
                          <span
                            className={`sh-status sh-status-${listing.status}`}
                          >
                            {listing.status}
                          </span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
