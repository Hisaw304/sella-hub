import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Tag,
  Users,
  X,
  ClipboardList,
  CreditCard,
  Receipt,
  Flag,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  /*
  ========================================
  ADMIN NAVIGATION
  ========================================
  */

  const navigation = [
    {
      label: "Overview",
      items: [
        {
          name: "Dashboard",
          path: "/admin",
          icon: LayoutDashboard,
        },
      ],
    },

    {
      label: "Marketplace",
      items: [
        {
          name: "Listings",
          path: "/admin/listings",
          icon: ClipboardList,
        },
        {
          name: "Categories",
          path: "/admin/categories",
          icon: Tag,
        },
        {
          name: "Users",
          path: "/admin/users",
          icon: Users,
        },
      ],
    },

    {
      label: "Business",
      items: [
        {
          name: "Plans",
          path: "/admin/plans",
          icon: CreditCard,
        },
        {
          name: "Transactions",
          path: "/admin/transactions",
          icon: Receipt,
        },
        {
          name: "Verification",
          path: "/admin/verification",
          icon: ShieldCheck,
        },
      ],
    },

    {
      label: "Moderation",
      items: [
        {
          name: "Reports",
          path: "/admin/reports",
          icon: Flag,
        },
      ],
    },

    {
      label: "System",
      items: [
        {
          name: "Settings",
          path: "/admin/settings",
          icon: Settings,
        },
      ],
    },
  ];

  /*
  ========================================
  PAGE TITLES
  ========================================
  */

  const pageTitles = {
    "/admin": "Dashboard",
    "/admin/listings": "Listings",
    "/admin/categories": "Categories",
    "/admin/users": "Users",
    "/admin/plans": "Plans",
    "/admin/transactions": "Transactions",
    "/admin/verification": "Verification",
    "/admin/reports": "Reports",
    "/admin/settings": "Settings",
  };

  const currentPageTitle = pageTitles[location.pathname] || "Admin";

  /*
  ========================================
  LOAD ADMIN
  ========================================
  */

  useEffect(() => {
    const loadAdmin = async () => {
      try {
        setLoading(true);

        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!currentUser) {
          navigate("/login");
          return;
        }

        /*
        ========================================
        FETCH PROFILE
        ========================================
        */

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            `
            id,
            full_name,
            email,
            avatar_url,
            role
          `
          )
          .eq("id", currentUser.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        /*
        ========================================
        CHECK ADMIN ROLE
        ========================================
        */

        if (profileData?.role !== "admin") {
          navigate("/dashboard");
          return;
        }

        setUser(currentUser);
        setProfile(profileData);
      } catch (error) {
        console.error("Admin authentication error:", error);

        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadAdmin();
  }, [navigate]);

  /*
  ========================================
  CLOSE MOBILE SIDEBAR
  ========================================
  */

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  /*
  ========================================
  SIGN OUT
  ========================================
  */

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  /*
  ========================================
  AVATAR INITIAL
  ========================================
  */

  const adminName = profile?.full_name || user?.email || "Administrator";

  const adminInitial = adminName?.trim()?.charAt(0)?.toUpperCase() || "A";

  /*
  ========================================
  LOADING
  ========================================
  */

  if (loading) {
    return (
      <div className="sh-admin-loading">
        <div className="sh-admin-loading-spinner"></div>

        <span>Loading admin panel...</span>
      </div>
    );
  }

  return (
    <div className="sh-admin-layout">
      {/* ========================================
          MOBILE OVERLAY
      ======================================== */}

      {sidebarOpen && (
        <button
          type="button"
          className="sh-admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* ========================================
          SIDEBAR
      ======================================== */}

      <aside
        className={`sh-admin-sidebar ${
          sidebarOpen ? "sh-admin-sidebar-open" : ""
        }`}
      >
        {/* LOGO */}

        <div className="sh-admin-sidebar-top">
          <Link to="/admin" className="sh-admin-logo">
            <span>SellaHub</span>

            <small>Admin</small>
          </Link>

          <button
            type="button"
            className="sh-admin-mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION */}

        <nav className="sh-admin-navigation">
          {navigation.map((section) => (
            <div className="sh-admin-nav-section" key={section.label}>
              <span className="sh-admin-nav-label">{section.label}</span>

              <div className="sh-admin-nav-items">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/admin"}
                      className={({ isActive }) =>
                        `sh-admin-nav-item ${
                          isActive ? "sh-admin-nav-item-active" : ""
                        }`
                      }
                    >
                      <Icon size={18} strokeWidth={1.8} />

                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* SIDEBAR FOOTER */}

        <div className="sh-admin-sidebar-footer">
          <Link to="/dashboard" className="sh-admin-sidebar-footer-link">
            <ChevronLeft size={17} />

            <span>Seller Dashboard</span>
          </Link>

          <button
            type="button"
            className="sh-admin-sidebar-footer-link sh-admin-signout"
            onClick={handleSignOut}
          >
            <LogOut size={17} />

            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ========================================
          MAIN
      ======================================== */}

      <div className="sh-admin-main">
        {/* ========================================
            TOP BAR
        ======================================== */}

        <header className="sh-admin-topbar">
          {/* LEFT */}

          <div className="sh-admin-topbar-left">
            <button
              type="button"
              className="sh-admin-menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>

            {/* <div className="sh-admin-page-heading">
              <h1>{currentPageTitle}</h1>

              <span>Admin panel</span>
            </div> */}
          </div>

          {/* RIGHT */}

          <div className="sh-admin-topbar-right">
            {/* NOTIFICATIONS */}

            <div className="sh-admin-notification-wrapper">
              <button
                type="button"
                className="sh-admin-notification-button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="Notifications"
              >
                <Bell size={19} />

                <span className="sh-admin-notification-dot"></span>
              </button>

              {notificationsOpen && (
                <div className="sh-admin-notification-dropdown">
                  <div className="sh-admin-dropdown-header">
                    <div>
                      <strong>Notifications</strong>

                      <span>Recent admin activity</span>
                    </div>
                  </div>

                  <div className="sh-admin-empty-notifications">
                    <Bell size={21} />

                    <p>No new notifications</p>

                    <span>You're all caught up.</span>
                  </div>
                </div>
              )}
            </div>

            {/* ADMIN PROFILE */}

            <div className="sh-admin-profile-wrapper">
              <button
                type="button"
                className="sh-admin-profile-button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              >
                <div className="sh-admin-avatar">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={adminName} />
                  ) : (
                    <span>{adminInitial}</span>
                  )}
                </div>

                <div className="sh-admin-profile-info">
                  <strong>{adminName}</strong>

                  <span>Administrator</span>
                </div>

                <ChevronDown size={16} />
              </button>

              {profileMenuOpen && (
                <div className="sh-admin-profile-dropdown">
                  <div className="sh-admin-profile-dropdown-user">
                    <div className="sh-admin-avatar">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt={adminName} />
                      ) : (
                        <span>{adminInitial}</span>
                      )}
                    </div>

                    <div>
                      <strong>{adminName}</strong>

                      <span>{user?.email}</span>
                    </div>
                  </div>

                  <div className="sh-admin-dropdown-divider"></div>

                  <Link
                    to="/admin/settings"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <Settings size={16} />
                    Settings
                  </Link>

                  <button type="button" onClick={handleSignOut}>
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ========================================
            PAGE CONTENT
        ======================================== */}

        <main className="sh-admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
