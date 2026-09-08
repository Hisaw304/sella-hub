import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  X,
  Trash2,
  Star,
  ShieldCheck,
  MapPin,
  Clock3,
  Package,
  MoreHorizontal,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
// import "./AdminListings.css";

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
  { value: "draft", label: "Draft" },
  { value: "expired", label: "Expired" },
];

const LISTING_TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "product", label: "Products" },
  { value: "service", label: "Services" },
];

const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") {
    return "—";
  }

  return `₦${Number(price).toLocaleString("en-NG")}`;
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getStatusClass = (status) => {
  switch (status) {
    case "published":
      return "published";

    case "pending":
      return "pending";

    case "rejected":
      return "rejected";

    case "draft":
      return "draft";

    case "expired":
      return "expired";

    default:
      return "default";
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case "published":
      return "Published";

    case "pending":
      return "Pending";

    case "rejected":
      return "Rejected";

    case "draft":
      return "Draft";

    case "expired":
      return "Expired";

    default:
      return status || "Unknown";
  }
};

export default function AdminListings() {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const [currentPage, setCurrentPage] = useState(1);

  const [openMenu, setOpenMenu] = useState(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingListing, setRejectingListing] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  /* =========================================
     LOAD LISTINGS
  ========================================= */

  const loadListings = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error: listingsError } = await supabase
        .from("listings")
        .select(
          `
          id,
          user_id,
          category_id,
          title,
          slug,
          listing_type,
          description,
          price,
          price_type,
          location,
          phone,
          status,
          featured,
          verified,
          views,
          created_at,
          updated_at,
          categories (
            name
          )
        `
        )
        .order("created_at", { ascending: false });

      if (listingsError) {
        throw listingsError;
      }

      const listingData = data || [];

      /*
       * Get sellers separately because profiles is connected
       * through user_id.
       */

      const userIds = [
        ...new Set(
          listingData.map((listing) => listing.user_id).filter(Boolean)
        ),
      ];

      let profiles = [];

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select(
            `
              id,
              full_name,
              business_name,
              avatar_url
            `
          )
          .in("id", userIds);

        if (profilesError) {
          throw profilesError;
        }

        profiles = profilesData || [];
      }

      const profileMap = Object.fromEntries(
        profiles.map((profile) => [profile.id, profile])
      );

      const enrichedListings = listingData.map((listing) => ({
        ...listing,
        seller: profileMap[listing.user_id] || null,
      }));

      setListings(enrichedListings);
    } catch (err) {
      console.error("Admin listings error:", err);

      setError(err.message || "Unable to load marketplace listings.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     LOAD CATEGORIES
  ========================================= */

  const loadCategories = async () => {
    const { data, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true });

    if (categoriesError) {
      console.error("Categories error:", categoriesError);
      return;
    }

    setCategories(data || []);
  };

  useEffect(() => {
    loadListings();
    loadCategories();
  }, []);

  /* =========================================
     FILTER + SEARCH
  ========================================= */

  const filteredListings = useMemo(() => {
    let result = [...listings];

    const searchValue = search.trim().toLowerCase();

    if (searchValue) {
      result = result.filter((listing) => {
        const title = listing.title?.toLowerCase() || "";
        const location = listing.location?.toLowerCase() || "";
        const sellerName = listing.seller?.full_name?.toLowerCase() || "";
        const businessName = listing.seller?.business_name?.toLowerCase() || "";
        const category = listing.categories?.name?.toLowerCase() || "";

        return (
          title.includes(searchValue) ||
          location.includes(searchValue) ||
          sellerName.includes(searchValue) ||
          businessName.includes(searchValue) ||
          category.includes(searchValue)
        );
      });
    }

    if (statusFilter !== "all") {
      result = result.filter((listing) => listing.status === statusFilter);
    }

    if (typeFilter !== "all") {
      result = result.filter((listing) => {
        const type = String(listing.listing_type || "").toLowerCase();

        return type === typeFilter;
      });
    }

    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();

      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [listings, search, statusFilter, typeFilter, sortOrder]);

  /* =========================================
     PAGINATION
  ========================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredListings.length / ITEMS_PER_PAGE)
  );

  const paginatedListings = filteredListings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, typeFilter, sortOrder]);

  /* =========================================
     APPROVE LISTING
  ========================================= */

  const approveListing = async (listing) => {
    const confirmed = window.confirm(
      `Approve "${listing.title}" and make it live on SellaHub?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(`approve-${listing.id}`);

      const { error: updateError } = await supabase
        .from("listings")
        .update({
          status: "published",
          updated_at: new Date().toISOString(),
        })
        .eq("id", listing.id);

      if (updateError) {
        throw updateError;
      }

      setListings((prev) =>
        prev.map((item) =>
          item.id === listing.id
            ? {
                ...item,
                status: "published",
                updated_at: new Date().toISOString(),
              }
            : item
        )
      );

      setOpenMenu(null);
    } catch (err) {
      console.error("Approve listing error:", err);

      alert(err.message || "Unable to approve this listing.");
    } finally {
      setActionLoading(null);
    }
  };

  /* =========================================
     REJECT LISTING
  ========================================= */

  const openRejectModal = (listing) => {
    setRejectingListing(listing);
    setRejectReason("");
    setShowRejectModal(true);
    setOpenMenu(null);
  };

  const rejectListing = async () => {
    if (!rejectingListing) return;

    try {
      setActionLoading(`reject-${rejectingListing.id}`);

      const { error: updateError } = await supabase
        .from("listings")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", rejectingListing.id);

      if (updateError) {
        throw updateError;
      }

      setListings((prev) =>
        prev.map((item) =>
          item.id === rejectingListing.id
            ? {
                ...item,
                status: "rejected",
                updated_at: new Date().toISOString(),
              }
            : item
        )
      );

      setShowRejectModal(false);
      setRejectingListing(null);
      setRejectReason("");
    } catch (err) {
      console.error("Reject listing error:", err);

      alert(err.message || "Unable to reject this listing.");
    } finally {
      setActionLoading(null);
    }
  };

  /* =========================================
     DELETE LISTING
  ========================================= */

  const deleteListing = async (listing) => {
    const confirmed = window.confirm(
      `Delete "${listing.title}" permanently? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setActionLoading(`delete-${listing.id}`);

      const { error: deleteError } = await supabase
        .from("listings")
        .delete()
        .eq("id", listing.id);

      if (deleteError) {
        throw deleteError;
      }

      setListings((prev) => prev.filter((item) => item.id !== listing.id));

      setOpenMenu(null);
    } catch (err) {
      console.error("Delete listing error:", err);

      alert(err.message || "Unable to delete this listing.");
    } finally {
      setActionLoading(null);
    }
  };

  /* =========================================
     TOGGLE FEATURED
  ========================================= */

  const toggleFeatured = async (listing) => {
    try {
      setActionLoading(`featured-${listing.id}`);

      const newValue = !listing.featured;

      const { error: updateError } = await supabase
        .from("listings")
        .update({
          featured: newValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", listing.id);

      if (updateError) {
        throw updateError;
      }

      setListings((prev) =>
        prev.map((item) =>
          item.id === listing.id
            ? {
                ...item,
                featured: newValue,
              }
            : item
        )
      );

      setOpenMenu(null);
    } catch (err) {
      console.error("Featured update error:", err);

      alert(err.message || "Unable to update featured status.");
    } finally {
      setActionLoading(null);
    }
  };

  /* =========================================
     TOGGLE VERIFIED
  ========================================= */

  const toggleVerified = async (listing) => {
    try {
      setActionLoading(`verified-${listing.id}`);

      const newValue = !listing.verified;

      const { error: updateError } = await supabase
        .from("listings")
        .update({
          verified: newValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", listing.id);

      if (updateError) {
        throw updateError;
      }

      setListings((prev) =>
        prev.map((item) =>
          item.id === listing.id
            ? {
                ...item,
                verified: newValue,
              }
            : item
        )
      );

      setOpenMenu(null);
    } catch (err) {
      console.error("Verified update error:", err);

      alert(err.message || "Unable to update verification.");
    } finally {
      setActionLoading(null);
    }
  };

  /* =========================================
     STATS
  ========================================= */

  const listingStats = useMemo(() => {
    return {
      total: listings.length,

      pending: listings.filter((item) => item.status === "pending").length,

      published: listings.filter((item) => item.status === "published").length,

      rejected: listings.filter((item) => item.status === "rejected").length,
    };
  }, [listings]);

  return (
    <div className="sh-admin-listings-page">
      {/* =========================================
          HEADER
      ========================================= */}

      <div className="sh-admin-listings-header">
        <div>
          <span className="sh-admin-eyebrow">MARKETPLACE</span>

          <h1>Listings</h1>

          <p>Manage, review, and moderate marketplace listings.</p>
        </div>

        <button
          className="sh-admin-refresh-btn"
          onClick={loadListings}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "sh-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* =========================================
          STATS
      ========================================= */}

      <div className="sh-admin-listing-stats">
        <div className="sh-admin-listing-stat">
          <div className="sh-admin-listing-stat-icon">
            <Package size={18} />
          </div>

          <div>
            <strong>{listingStats.total.toLocaleString()}</strong>

            <span>Total Listings</span>
          </div>
        </div>

        <div className="sh-admin-listing-stat">
          <div className="sh-admin-listing-stat-icon pending">
            <Clock3 size={18} />
          </div>

          <div>
            <strong>{listingStats.pending.toLocaleString()}</strong>

            <span>Pending Review</span>
          </div>
        </div>

        <div className="sh-admin-listing-stat">
          <div className="sh-admin-listing-stat-icon published">
            <Check size={18} />
          </div>

          <div>
            <strong>{listingStats.published.toLocaleString()}</strong>

            <span>Published</span>
          </div>
        </div>

        <div className="sh-admin-listing-stat">
          <div className="sh-admin-listing-stat-icon rejected">
            <X size={18} />
          </div>

          <div>
            <strong>{listingStats.rejected.toLocaleString()}</strong>

            <span>Rejected</span>
          </div>
        </div>
      </div>

      {/* =========================================
          ERROR
      ========================================= */}

      {error && (
        <div className="sh-admin-listing-error">
          <AlertCircle size={18} />

          <span>{error}</span>

          <button onClick={loadListings}>Try again</button>
        </div>
      )}

      {/* =========================================
          FILTERS
      ========================================= */}

      <div className="sh-admin-listing-toolbar">
        <div className="sh-admin-listing-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search listings, sellers, locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button
              className="sh-admin-clear-search"
              onClick={() => setSearch("")}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="sh-admin-filter-control">
          <Filter size={15} />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <ChevronDown size={14} />
        </div>

        <div className="sh-admin-filter-control">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {LISTING_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <ChevronDown size={14} />
        </div>

        <div className="sh-admin-filter-control">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Newest first</option>

            <option value="oldest">Oldest first</option>
          </select>

          <ChevronDown size={14} />
        </div>
      </div>

      {/* =========================================
          RESULT INFO
      ========================================= */}

      <div className="sh-admin-listing-result-info">
        <span>
          Showing <strong>{filteredListings.length}</strong>{" "}
          {filteredListings.length === 1 ? "listing" : "listings"}
        </span>
      </div>

      {/* =========================================
          TABLE
      ========================================= */}

      <div className="sh-admin-listing-table-wrap">
        {loading ? (
          <div className="sh-admin-listing-loading">
            <div className="sh-admin-loader" />

            <p>Loading listings...</p>
          </div>
        ) : paginatedListings.length === 0 ? (
          <div className="sh-admin-listing-empty">
            <div className="sh-admin-empty-icon">
              <Package size={25} />
            </div>

            <h3>No listings found</h3>

            <p>
              {search || statusFilter !== "all" || typeFilter !== "all"
                ? "Try changing your search or filters."
                : "There are no listings on SellaHub yet."}
            </p>

            {(search || statusFilter !== "all" || typeFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="sh-admin-listing-table-scroll">
              <table className="sh-admin-listing-table">
                <thead>
                  <tr>
                    <th>Listing</th>
                    <th>Seller</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedListings.map((listing) => {
                    const sellerName =
                      listing.seller?.business_name ||
                      listing.seller?.full_name ||
                      "Unknown seller";

                    return (
                      <tr key={listing.id}>
                        {/* LISTING */}

                        <td>
                          <div className="sh-admin-listing-main">
                            <div className="sh-admin-listing-image">
                              <Package size={18} />
                            </div>

                            <div className="sh-admin-listing-title-wrap">
                              <strong>{listing.title}</strong>

                              <div className="sh-admin-listing-meta">
                                {listing.featured && (
                                  <span className="sh-admin-mini-badge featured">
                                    <Star size={10} />
                                    Featured
                                  </span>
                                )}

                                {listing.verified && (
                                  <span className="sh-admin-mini-badge verified">
                                    <ShieldCheck size={10} />
                                    Verified
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* SELLER */}

                        <td>
                          <div className="sh-admin-seller">
                            <div className="sh-admin-seller-avatar">
                              {listing.seller?.avatar_url ? (
                                <img src={listing.seller.avatar_url} alt="" />
                              ) : (
                                sellerName.charAt(0).toUpperCase()
                              )}
                            </div>

                            <span>{sellerName}</span>
                          </div>
                        </td>

                        {/* CATEGORY */}

                        <td>
                          <span className="sh-admin-category">
                            {listing.categories?.name || "Uncategorized"}
                          </span>
                        </td>

                        {/* PRICE */}

                        <td>
                          <div className="sh-admin-price">
                            <strong>{formatPrice(listing.price)}</strong>

                            {listing.price_type && (
                              <small>{listing.price_type}</small>
                            )}
                          </div>
                        </td>

                        {/* LOCATION */}

                        <td>
                          <div className="sh-admin-location">
                            <MapPin size={13} />

                            <span>{listing.location || "—"}</span>
                          </div>
                        </td>

                        {/* STATUS */}

                        <td>
                          <span
                            className={`sh-admin-status ${getStatusClass(
                              listing.status
                            )}`}
                          >
                            <span />

                            {getStatusLabel(listing.status)}
                          </span>
                        </td>

                        {/* DATE */}

                        <td>
                          <span className="sh-admin-date">
                            {formatDate(listing.created_at)}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td>
                          <div className="sh-admin-actions">
                            <button
                              className="sh-admin-view-btn"
                              title="View listing"
                              onClick={() =>
                                window.open(
                                  `/listing/${listing.slug}`,
                                  "_blank"
                                )
                              }
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              className="sh-admin-more-btn"
                              onClick={() =>
                                setOpenMenu(
                                  openMenu === listing.id ? null : listing.id
                                )
                              }
                            >
                              <MoreHorizontal size={17} />
                            </button>

                            {openMenu === listing.id && (
                              <div className="sh-admin-action-menu">
                                <button
                                  onClick={() =>
                                    window.open(
                                      `/listing/${listing.slug}`,
                                      "_blank"
                                    )
                                  }
                                >
                                  <ExternalLink size={15} />
                                  View listing
                                </button>

                                {listing.status === "pending" && (
                                  <button
                                    onClick={() => approveListing(listing)}
                                    disabled={
                                      actionLoading === `approve-${listing.id}`
                                    }
                                  >
                                    <Check size={15} />
                                    Approve listing
                                  </button>
                                )}

                                {listing.status !== "rejected" && (
                                  <button
                                    onClick={() => openRejectModal(listing)}
                                  >
                                    <X size={15} />
                                    Reject listing
                                  </button>
                                )}

                                <button onClick={() => toggleFeatured(listing)}>
                                  <Star size={15} />
                                  {listing.featured
                                    ? "Remove featured"
                                    : "Mark as featured"}
                                </button>

                                <button onClick={() => toggleVerified(listing)}>
                                  <ShieldCheck size={15} />
                                  {listing.verified
                                    ? "Remove verification"
                                    : "Verify listing"}
                                </button>

                                <div className="sh-admin-menu-divider" />

                                <button
                                  className="danger"
                                  onClick={() => deleteListing(listing)}
                                >
                                  <Trash2 size={15} />
                                  Delete listing
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* =========================================
                PAGINATION
            ========================================= */}

            {totalPages > 1 && (
              <div className="sh-admin-pagination">
                <span>
                  Page <strong>{currentPage}</strong> of{" "}
                  <strong>{totalPages}</strong>
                </span>

                <div>
                  <button
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* =========================================
          REJECT MODAL
      ========================================= */}

      {showRejectModal && rejectingListing && (
        <div className="sh-admin-modal-overlay">
          <div className="sh-admin-modal">
            <button
              className="sh-admin-modal-close"
              onClick={() => {
                setShowRejectModal(false);
                setRejectingListing(null);
              }}
            >
              <X size={18} />
            </button>

            <div className="sh-admin-modal-icon">
              <X size={20} />
            </div>

            <h2>Reject listing?</h2>

            <p>
              You are about to reject{" "}
              <strong>"{rejectingListing.title}"</strong>.
            </p>

            <label>
              Reason
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Optional reason for rejecting this listing..."
                rows={4}
              />
            </label>

            <div className="sh-admin-modal-actions">
              <button
                className="sh-admin-modal-cancel"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingListing(null);
                }}
              >
                Cancel
              </button>

              <button
                className="sh-admin-modal-reject"
                onClick={rejectListing}
                disabled={actionLoading === `reject-${rejectingListing.id}`}
              >
                {actionLoading === `reject-${rejectingListing.id}`
                  ? "Rejecting..."
                  : "Reject listing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
