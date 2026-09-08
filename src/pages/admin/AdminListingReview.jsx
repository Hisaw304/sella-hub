import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Star,
  ShieldCheck,
  Trash2,
  MapPin,
  Phone,
  CalendarDays,
  ImageIcon,
  Eye,
  User,
  Package,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
// import "./AdminListingReview.css";

const AdminListingReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null);
  const [images, setImages] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!id) return;

    loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error: listingError } = await supabase
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
        .eq("id", id)
        .single();

      if (listingError) throw listingError;

      setListing(data);

      const { data: imagesData, error: imagesError } = await supabase
        .from("listing_images")
        .select(
          `
    id,
    listing_id,
    image_url,
    storage_path,
    sort_order
  `
        )
        .eq("listing_id", id)
        .order("sort_order", { ascending: true });

      if (imagesError) throw imagesError;

      setImages(imagesData || []);

      // Load seller profile separately.
      if (data?.user_id) {
        const { data: sellerData, error: sellerError } = await supabase
          .from("profiles")
          .select(
            `
              id,
              full_name,
              business_name,
              email,
              phone,
              avatar_url,
              role,
              created_at
            `
          )
          .eq("id", data.user_id)
          .maybeSingle();

        if (sellerError) throw sellerError;

        setSeller(sellerData);
      }
    } catch (err) {
      console.error("Admin listing review error:", err);
      setError(err.message || "Unable to load this listing.");
    } finally {
      setLoading(false);
    }
  };

  const approveListing = async () => {
    if (!listing) return;

    try {
      setActionLoading("approve");

      const { data, error: updateError } = await supabase
        .from("listings")
        .update({
          status: "published",
          updated_at: new Date().toISOString(),
        })
        .eq("id", listing.id)
        .eq("status", "pending")
        .select()
        .single();

      if (updateError) throw updateError;

      setListing((prev) => ({
        ...prev,
        ...data,
      }));

      alert("Listing approved successfully.");
    } catch (err) {
      console.error("Approve listing error:", err);
      alert(err.message || "Unable to approve listing.");
    } finally {
      setActionLoading("");
    }
  };

  const rejectListing = async () => {
    if (!listing) return;

    try {
      setActionLoading("reject");

      const { data, error: updateError } = await supabase
        .from("listings")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", listing.id)
        .eq("status", "pending")
        .select()
        .single();

      if (updateError) throw updateError;

      setListing((prev) => ({
        ...prev,
        ...data,
      }));

      setShowRejectBox(false);
      setRejectReason("");

      alert("Listing rejected. The seller will need to resubmit it.");
    } catch (err) {
      console.error("Reject listing error:", err);
      alert(err.message || "Unable to reject listing.");
    } finally {
      setActionLoading("");
    }
  };

  const toggleFeatured = async () => {
    if (!listing) return;

    try {
      setActionLoading("featured");

      const newValue = !listing.featured;

      const { error: updateError } = await supabase
        .from("listings")
        .update({
          featured: newValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", listing.id);

      if (updateError) throw updateError;

      setListing((prev) => ({
        ...prev,
        featured: newValue,
      }));
    } catch (err) {
      console.error("Featured update error:", err);
      alert(err.message || "Unable to update featured status.");
    } finally {
      setActionLoading("");
    }
  };

  const toggleVerified = async () => {
    if (!listing) return;

    try {
      setActionLoading("verified");

      const newValue = !listing.verified;

      const { error: updateError } = await supabase
        .from("listings")
        .update({
          verified: newValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", listing.id);

      if (updateError) throw updateError;

      setListing((prev) => ({
        ...prev,
        verified: newValue,
      }));
    } catch (err) {
      console.error("Verification update error:", err);
      alert(err.message || "Unable to update verification.");
    } finally {
      setActionLoading("");
    }
  };

  const deleteListing = async () => {
    if (!listing) return;

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this listing?"
    );

    if (!confirmed) return;

    try {
      setActionLoading("delete");

      const { error: deleteError } = await supabase
        .from("listings")
        .delete()
        .eq("id", listing.id);

      if (deleteError) throw deleteError;

      alert("Listing deleted successfully.");

      navigate("/admin/listings");
    } catch (err) {
      console.error("Delete listing error:", err);
      alert(err.message || "Unable to delete listing.");
    } finally {
      setActionLoading("");
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === "") {
      return "Contact seller";
    }

    return `₦${Number(price).toLocaleString("en-NG")}`;
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "long",
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
        return "draft";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "published":
        return "Published";

      case "pending":
        return "Pending Review";

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

  if (loading) {
    return (
      <div className="sh-review-loading">
        <Loader2 size={30} className="sh-review-spinner" />
        <p>Loading listing...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="sh-review-error">
        <AlertCircle size={30} />

        <h2>Unable to load listing</h2>

        <p>{error || "This listing could not be found."}</p>

        <button
          className="sh-review-back-btn"
          onClick={() => navigate("/admin/listings")}
        >
          <ArrowLeft size={17} />
          Back to Listings
        </button>
      </div>
    );
  }

  const isPending = listing.status === "pending";

  return (
    <div className="sh-admin-review-page">
      {/* HEADER */}
      <header className="sh-review-header">
        <button
          className="sh-review-back"
          onClick={() => navigate("/admin/listings")}
        >
          <ArrowLeft size={18} />
          Back to Listings
        </button>

        <div className="sh-review-header-right">
          <span
            className={`sh-review-status ${getStatusClass(listing.status)}`}
          >
            {getStatusLabel(listing.status)}
          </span>

          {listing.featured && (
            <span className="sh-review-featured-badge">
              <Star size={14} fill="currentColor" />
              Featured
            </span>
          )}

          {listing.verified && (
            <span className="sh-review-verified-badge">
              <ShieldCheck size={14} />
              Verified
            </span>
          )}
        </div>
      </header>

      {/* MAIN */}
      <main className="sh-review-content">
        <div className="sh-review-title-area">
          <div>
            <span className="sh-review-eyebrow">LISTING REVIEW</span>

            <h1>{listing.title}</h1>

            <p>Review this listing before making it visible to customers.</p>
          </div>
        </div>

        <div className="sh-review-grid">
          {/* LEFT */}
          <section className="sh-review-main">
            {/* LISTING PREVIEW */}
            <div className="sh-review-card">
              <div className="sh-review-card-heading">
                <div>
                  <span className="sh-review-card-label">
                    LISTING INFORMATION
                  </span>

                  <h2>Product Details</h2>
                </div>

                <div className="sh-review-icon-box">
                  <Package size={20} />
                </div>
              </div>

              <div className="sh-review-slider">
                {images.length > 0 ? (
                  <>
                    {/* Main Image */}
                    <div className="sh-review-slider-main">
                      <img
                        src={images[activeImage]?.image_url}
                        alt={listing?.title || "Listing image"}
                      />

                      {images.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="sh-review-slider-arrow sh-review-slider-prev"
                            onClick={() =>
                              setActiveImage((current) =>
                                current === 0 ? images.length - 1 : current - 1
                              )
                            }
                            aria-label="Previous image"
                          >
                            <ArrowLeft size={18} />
                          </button>

                          <button
                            type="button"
                            className="sh-review-slider-arrow sh-review-slider-next"
                            onClick={() =>
                              setActiveImage((current) =>
                                current === images.length - 1 ? 0 : current + 1
                              )
                            }
                            aria-label="Next image"
                          >
                            <ArrowRight size={18} />
                          </button>

                          <div className="sh-review-slider-counter">
                            {activeImage + 1} / {images.length}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Thumbnails */}
                    {images.length > 1 && (
                      <div className="sh-review-slider-thumbnails">
                        {images.map((image, index) => (
                          <button
                            type="button"
                            key={image.id}
                            className={`sh-review-slider-thumb ${
                              activeImage === index ? "active" : ""
                            }`}
                            onClick={() => setActiveImage(index)}
                          >
                            <img
                              src={image.image_url}
                              alt={`${listing?.title || "Listing"} ${
                                index + 1
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="sh-review-image-placeholder">
                    <ImageIcon size={40} />
                    <span>No images uploaded</span>
                  </div>
                )}
              </div>

              <div className="sh-review-details">
                <div className="sh-review-detail-full">
                  <span>Title</span>
                  <strong>{listing.title}</strong>
                </div>

                <div className="sh-review-detail">
                  <span>Category</span>
                  <strong>{listing.categories?.name || "Uncategorized"}</strong>
                </div>

                <div className="sh-review-detail">
                  <span>Listing Type</span>
                  <strong>
                    {listing.listing_type
                      ? listing.listing_type.charAt(0).toUpperCase() +
                        listing.listing_type.slice(1)
                      : "—"}
                  </strong>
                </div>

                <div className="sh-review-detail">
                  <span>Price</span>
                  <strong className="sh-review-price">
                    {formatPrice(listing.price)}
                  </strong>
                </div>

                <div className="sh-review-detail">
                  <span>Price Type</span>
                  <strong>{listing.price_type || "Fixed"}</strong>
                </div>

                <div className="sh-review-detail">
                  <span>Location</span>
                  <strong>{listing.location || "Not provided"}</strong>
                </div>
              </div>

              <div className="sh-review-description">
                <span>Description</span>

                <p>{listing.description || "No description provided."}</p>
              </div>
            </div>

            {/* SELLER */}
            <div className="sh-review-card">
              <div className="sh-review-card-heading">
                <div>
                  <span className="sh-review-card-label">SELLER</span>

                  <h2>Seller Information</h2>
                </div>

                <div className="sh-review-icon-box">
                  <User size={20} />
                </div>
              </div>

              <div className="sh-review-seller">
                <div className="sh-review-avatar">
                  {seller?.avatar_url ? (
                    <img
                      src={seller.avatar_url}
                      alt={seller.full_name || "Seller"}
                    />
                  ) : (
                    <span>
                      {(seller?.full_name || "S").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="sh-review-seller-info">
                  <h3>
                    {seller?.business_name ||
                      seller?.full_name ||
                      "Unknown Seller"}
                  </h3>

                  {seller?.business_name && seller?.full_name && (
                    <p>{seller.full_name}</p>
                  )}
                </div>
              </div>

              <div className="sh-review-seller-details">
                <div>
                  <Phone size={16} />

                  <span>
                    {listing.phone || seller?.phone || "No phone provided"}
                  </span>
                </div>

                <div>
                  <CalendarDays size={16} />

                  <span>Seller joined {formatDate(seller?.created_at)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT */}
          <aside className="sh-review-sidebar">
            {/* REVIEW ACTIONS */}
            <div className="sh-review-card sh-review-actions-card">
              <span className="sh-review-card-label">ADMIN ACTIONS</span>

              <h2>Review Listing</h2>

              <p className="sh-review-action-description">
                Choose what should happen to this listing.
              </p>

              {isPending && (
                <>
                  <button
                    className="sh-review-approve"
                    onClick={approveListing}
                    disabled={actionLoading}
                  >
                    {actionLoading === "approve" ? (
                      <Loader2 size={17} className="sh-review-spinner" />
                    ) : (
                      <Check size={17} />
                    )}
                    Approve Listing
                  </button>

                  <button
                    className="sh-review-reject"
                    onClick={() => setShowRejectBox(true)}
                    disabled={actionLoading}
                  >
                    <X size={17} />
                    Reject Listing
                  </button>
                </>
              )}

              {!isPending && (
                <div className="sh-review-no-action">
                  <AlertCircle size={17} />

                  <span>
                    This listing is currently{" "}
                    <strong>{getStatusLabel(listing.status)}</strong>.
                  </span>
                </div>
              )}
            </div>

            {/* CONTROLS */}
            <div className="sh-review-card">
              <span className="sh-review-card-label">LISTING CONTROLS</span>

              <h2>Visibility & Trust</h2>

              <button
                className={`sh-review-control ${
                  listing.featured ? "active" : ""
                }`}
                onClick={toggleFeatured}
                disabled={actionLoading}
              >
                <div className="sh-review-control-icon">
                  <Star
                    size={17}
                    fill={listing.featured ? "currentColor" : "none"}
                  />
                </div>

                <div>
                  <strong>
                    {listing.featured ? "Featured Listing" : "Mark as Featured"}
                  </strong>

                  <span>
                    {listing.featured
                      ? "Shown in featured areas."
                      : "Highlight this listing."}
                  </span>
                </div>
              </button>

              <button
                className={`sh-review-control ${
                  listing.verified ? "active" : ""
                }`}
                onClick={toggleVerified}
                disabled={actionLoading}
              >
                <div className="sh-review-control-icon">
                  <ShieldCheck size={17} />
                </div>

                <div>
                  <strong>
                    {listing.verified ? "Verified Listing" : "Verify Listing"}
                  </strong>

                  <span>
                    {listing.verified
                      ? "Seller/listing is verified."
                      : "Add a verification badge."}
                  </span>
                </div>
              </button>
            </div>

            {/* META */}
            <div className="sh-review-card">
              <span className="sh-review-card-label">LISTING META</span>

              <div className="sh-review-meta">
                <div>
                  <CalendarDays size={16} />

                  <div>
                    <span>Submitted</span>
                    <strong>{formatDate(listing.created_at)}</strong>
                  </div>
                </div>

                <div>
                  <Eye size={16} />

                  <div>
                    <span>Views</span>
                    <strong>
                      {Number(listing.views || 0).toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div>
                  <Package size={16} />

                  <div>
                    <span>Listing ID</span>
                    <strong>{listing.id}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* DELETE */}
            <button
              className="sh-review-delete"
              onClick={deleteListing}
              disabled={actionLoading}
            >
              {actionLoading === "delete" ? (
                <Loader2 size={16} className="sh-review-spinner" />
              ) : (
                <Trash2 size={16} />
              )}
              Delete Listing
            </button>
          </aside>
        </div>
      </main>

      {/* REJECT MODAL */}
      {showRejectBox && (
        <div className="sh-review-modal-overlay">
          <div className="sh-review-modal">
            <button
              className="sh-review-modal-close"
              onClick={() => {
                setShowRejectBox(false);
                setRejectReason("");
              }}
            >
              <X size={19} />
            </button>

            <div className="sh-review-modal-icon">
              <X size={22} />
            </div>

            <span className="sh-review-card-label">REJECT LISTING</span>

            <h2>Reject this listing?</h2>

            <p>
              The listing will not be visible to customers. The seller will need
              to edit and resubmit it for another review.
            </p>

            <label>
              Reason
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain what needs to be changed..."
                rows={5}
              />
            </label>

            <div className="sh-review-modal-actions">
              <button
                className="sh-review-modal-cancel"
                onClick={() => {
                  setShowRejectBox(false);
                  setRejectReason("");
                }}
              >
                Cancel
              </button>

              <button
                className="sh-review-modal-confirm"
                onClick={rejectListing}
                disabled={actionLoading === "reject"}
              >
                {actionLoading === "reject" ? (
                  <Loader2 size={16} className="sh-review-spinner" />
                ) : (
                  <X size={16} />
                )}
                Reject Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminListingReview;
