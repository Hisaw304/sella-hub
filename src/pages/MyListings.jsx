import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Edit3,
  EyeOff,
  Eye,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const MyListings = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [openMenu, setOpenMenu] = useState(null);
  const [error, setError] = useState("");
  const [userPlan, setUserPlan] = useState(null);

  /*
  ========================================
  LOAD LISTINGS
  ========================================
  */

  useEffect(() => {
    const loadListings = async () => {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          navigate("/login");
          return;
        }

        setUser(user);

        const { data, error: listingsError } = await supabase
          .from("listings")
          .select(
            `
              *,
              categories (
                id,
                name
              ),
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
          });

        if (listingsError) {
          throw listingsError;
        }

        setListings(data || []);
      } catch (err) {
        console.error("My listings error:", err);
        setError("Unable to load your listings.");
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, [navigate]);

  useEffect(() => {
    const fetchUserPlan = async () => {
      if (!user?.id) {
        setUserPlan(null);
        return;
      }

      try {
        const { data, error } = await supabase
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

        if (error) {
          console.error("My listings plan error:", error);
          setUserPlan(null);
          return;
        }

        setUserPlan(data);
      } catch (err) {
        console.error("My listings plan error:", err);
        setUserPlan(null);
      }
    };

    fetchUserPlan();
  }, [user]);

  /*
  ========================================
  STATUS
  ========================================
  */

  const getStatus = (status) => {
    switch (status) {
      case "published":
        return {
          label: "Published",
          icon: <CheckCircle2 size={14} />,
          className: "published",
        };

      case "pending":
        return {
          label: "Pending",
          icon: <Clock3 size={14} />,
          className: "pending",
        };

      case "draft":
        return {
          label: "Draft",
          icon: <FileText size={14} />,
          className: "draft",
        };

      case "rejected":
        return {
          label: "Rejected",
          icon: <XCircle size={14} />,
          className: "rejected",
        };

      default:
        return {
          label: status || "Unknown",
          icon: <Clock3 size={14} />,
          className: "pending",
        };
    }
  };

  /*
  ========================================
  DELETE LISTING
  ========================================
  */

  const handleDelete = async (listing) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${listing.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(listing.id);
      setOpenMenu(null);

      const { error: deleteError } = await supabase
        .from("listings")
        .delete()
        .eq("id", listing.id)
        .eq("user_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      setListings((previous) =>
        previous.filter((item) => item.id !== listing.id)
      );
    } catch (err) {
      console.error("Delete listing error:", err);

      setError(err.message || "Unable to delete this listing.");
    } finally {
      setDeleting(null);
    }
  };

  /*
  ========================================
  FILTER LISTINGS
  ========================================
  */

  const filteredListings = listings.filter((listing) => {
    const matchesStatus =
      activeFilter === "all" || listing.status === activeFilter;

    const searchValue = search.toLowerCase().trim();

    const matchesSearch =
      !searchValue ||
      listing.title?.toLowerCase().includes(searchValue) ||
      listing.categories?.name?.toLowerCase().includes(searchValue);

    return matchesStatus && matchesSearch;
  });

  /*
  ========================================
  STATS
  ========================================
  */

  const totalListings = listings.length;

  const publishedListings = listings.filter(
    (listing) => listing.status === "published"
  ).length;

  const pendingListings = listings.filter(
    (listing) => listing.status === "pending"
  ).length;

  const draftListings = listings.filter(
    (listing) => listing.status === "draft"
  ).length;

  /*
  ========================================
  FORMAT PRICE
  ========================================
  */

  const formatPrice = (listing) => {
    if (listing.price_type === "contact" || listing.price === null) {
      return "Contact seller";
    }

    const formatted = new Intl.NumberFormat("en-NG").format(listing.price);

    if (listing.price_type === "starting_from") {
      return `From ₦${formatted}`;
    }

    if (listing.price_type === "negotiable") {
      return `₦${formatted} · Negotiable`;
    }

    return `₦${formatted}`;
  };

  /*
  ========================================
  GET MAIN IMAGE
  ========================================
  */

  const getMainImage = (listing) => {
    if (!listing.listing_images?.length) {
      return null;
    }

    const sortedImages = [...listing.listing_images].sort(
      (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
    );

    return sortedImages[0]?.image_url;
  };

  /*
  ========================================
  LOADING
  ========================================
  */

  if (loading) {
    return (
      <main className="sh-my-listings-page">
        <div className="sh-my-listings-loading">Loading your listings...</div>
      </main>
    );
  }

  return (
    <main className="sh-my-listings-page">
      <div className="sh-my-listings-container">
        {/* ========================================
            HEADER
        ======================================== */}

        <div className="sh-my-listings-top">
          <div>
            <Link to="/dashboard" className="sh-my-listings-back">
              <ArrowLeft size={16} />
              Dashboard
            </Link>

            <span className="sh-my-listings-label">Seller dashboard</span>

            <h1>
              My <strong>listings.</strong>
            </h1>

            <p>Manage everything you have posted on SellaHub from one place.</p>
          </div>

          <Link
            to="/dashboard/create-listing"
            className="sh-my-listings-create"
          >
            <Plus size={17} />
            Create listing
          </Link>
        </div>

        {/* ========================================
            ERROR
        ======================================== */}

        {error && (
          <div className="sh-my-listings-error">
            <XCircle size={16} />
            {error}
          </div>
        )}

        {/* ========================================
            STATS
        ======================================== */}

        <div className="sh-my-listings-stats">
          <div className="sh-my-listings-stat">
            <div className="sh-my-listings-stat-icon">
              <FileText size={18} />
            </div>

            <div>
              <span>Total listings</span>
              <strong>{totalListings}</strong>
            </div>
          </div>

          <div className="sh-my-listings-stat">
            <div className="sh-my-listings-stat-icon">
              <CheckCircle2 size={18} />
            </div>

            <div>
              <span>Published</span>
              <strong>{publishedListings}</strong>
            </div>
          </div>

          <div className="sh-my-listings-stat">
            <div className="sh-my-listings-stat-icon">
              <Clock3 size={18} />
            </div>

            <div>
              <span>Pending</span>
              <strong>{pendingListings}</strong>
            </div>
          </div>

          <div className="sh-my-listings-stat">
            <div className="sh-my-listings-stat-icon">
              <Edit3 size={18} />
            </div>

            <div>
              <span>Drafts</span>
              <strong>{draftListings}</strong>
            </div>
          </div>
        </div>

        {/* ========================================
            TOOLBAR
        ======================================== */}

        <div className="sh-my-listings-toolbar">
          <div className="sh-my-listings-search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search your listings..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="sh-my-listings-filters">
            <button
              type="button"
              className={activeFilter === "all" ? "active" : ""}
              onClick={() => setActiveFilter("all")}
            >
              All
              <span>{totalListings}</span>
            </button>

            <button
              type="button"
              className={activeFilter === "published" ? "active" : ""}
              onClick={() => setActiveFilter("published")}
            >
              Published
              <span>{publishedListings}</span>
            </button>

            <button
              type="button"
              className={activeFilter === "pending" ? "active" : ""}
              onClick={() => setActiveFilter("pending")}
            >
              Pending
              <span>{pendingListings}</span>
            </button>

            <button
              type="button"
              className={activeFilter === "draft" ? "active" : ""}
              onClick={() => setActiveFilter("draft")}
            >
              Drafts
              <span>{draftListings}</span>
            </button>
          </div>
        </div>

        {/* ========================================
    LISTINGS
======================================== */}

        {filteredListings.length > 0 ? (
          <div className="sh-my-listings-list">
            {filteredListings.map((listing) => {
              const isPlanExpired =
                !userPlan ||
                userPlan.status !== "active" ||
                (userPlan.expired_at &&
                  new Date(userPlan.expired_at) <= new Date());

              const isHiddenByPlan =
                isPlanExpired && listing.status === "published";

              const status = isHiddenByPlan
                ? {
                    label: "Hidden",
                    icon: <EyeOff size={14} />,
                    className: "expired",
                  }
                : getStatus(listing.status);

              const image = getMainImage(listing);

              return (
                <article className="sh-my-listing-card" key={listing.id}>
                  {/* IMAGE */}

                  <div className="sh-my-listing-image">
                    {image ? (
                      <img src={image} alt={listing.title} />
                    ) : (
                      <div className="sh-my-listing-no-image">
                        <PackageIcon />
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}

                  <div className="sh-my-listing-content">
                    <div className="sh-my-listing-content-top">
                      <div>
                        <span className="sh-my-listing-category">
                          {listing.categories?.name || "Uncategorized"}
                        </span>

                        <h2>{listing.title}</h2>

                        <p>
                          {listing.description?.slice(0, 115)}
                          {listing.description?.length > 115 ? "..." : ""}
                        </p>

                        {isHiddenByPlan && (
                          <small className="sh-listing-hidden-message">
                            Your subscription has expired. This listing is
                            hidden from customers.
                          </small>
                        )}
                      </div>

                      {/* MENU */}

                      <div className="sh-my-listing-menu">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenu(
                              openMenu === listing.id ? null : listing.id
                            )
                          }
                          aria-label="Listing options"
                        >
                          <MoreHorizontal size={19} />
                        </button>

                        {openMenu === listing.id && (
                          <div className="sh-my-listing-dropdown">
                            <Link
                              to={`/listing/${listing.slug}`}
                              onClick={() => setOpenMenu(null)}
                            >
                              <Eye size={14} />
                              View
                            </Link>

                            <Link
                              to={`/dashboard/edit-listing/${listing.id}`}
                              onClick={() => setOpenMenu(null)}
                            >
                              <Edit3 size={14} />
                              Edit
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleDelete(listing)}
                              disabled={deleting === listing.id}
                            >
                              <Trash2 size={14} />

                              {deleting === listing.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* BOTTOM */}

                    <div className="sh-my-listing-bottom">
                      <div className="sh-my-listing-price">
                        {formatPrice(listing)}
                      </div>

                      <div className="sh-my-listing-status">
                        <span className={`sh-status-badge ${status.className}`}>
                          {status.icon}
                          {status.label}
                        </span>

                        <span className="sh-my-listing-date">
                          {new Date(listing.created_at).toLocaleDateString(
                            "en-NG",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* VIEW */}

                  <Link
                    to={`/listing/${listing.slug}`}
                    className="sh-my-listing-view"
                    aria-label={`View ${listing.title}`}
                  >
                    <ArrowRight size={17} />
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          /* ========================================
              EMPTY STATE
          ======================================== */

          <div className="sh-my-listings-empty">
            <div className="sh-my-listings-empty-icon">
              <PackageIcon />
            </div>

            <h2>
              {search
                ? "No listings found."
                : activeFilter !== "all"
                ? `No ${activeFilter} listings.`
                : "You haven't listed anything yet."}
            </h2>

            <p>
              {search
                ? "Try changing your search or filter."
                : "Create your first listing and start reaching buyers on SellaHub."}
            </p>

            {!search && activeFilter === "all" && (
              <Link
                to="/dashboard/create-listing"
                className="sh-my-listings-empty-button"
              >
                Create your first listing
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

/*
=========================================================
EMPTY IMAGE ICON
=========================================================
*/

const PackageIcon = () => (
  <svg
    width="25"
    height="25"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m16.5 9.4-9-5.19" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="M3.27 6.96 12 12.01l8.73-5.05" />
    <path d="M12 22.08V12" />
  </svg>
);

export default MyListings;
