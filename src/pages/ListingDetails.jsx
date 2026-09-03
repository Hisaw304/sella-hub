import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { supabase } from "../lib/supabase";
// import "../styles/ListingDetails.css";

const ListingDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [relatedListings, setRelatedListings] = useState([]);
  const [sellerListings, setSellerListings] = useState([]);

  const [selectedImage, setSelectedImage] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [saved, setSaved] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  /*
  ========================================
  LOAD LISTING
  ========================================
  */

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        setError("");

        /*
      ========================================
      LISTING
      ========================================
      */

        const { data, error } = await supabase
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
          .eq("slug", slug)
          .eq("status", "published")
          // published
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          setListing(null);
          return;
        }

        /*
      ========================================
      SORT LISTING IMAGES
      ========================================
      */

        const sortedImages = [...(data.listing_images || [])].sort(
          (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
        );

        /*
      ========================================
      SELLER PROFILE
      ========================================
      */
        let sellerProfile = null;

        if (data.user_id) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select(
              `
      id,
      full_name,
      business_name,
      avatar_url,
      phone,
      location,
      seller_status,
      created_at
    `
            )
            .eq("id", data.user_id)
            .maybeSingle();

          if (profileError) {
            console.error("Seller profile error:", profileError);
          }

          sellerProfile = profileData;
        }

        /*
      ========================================
      NORMALIZE LISTING
      ========================================
      */

        const normalizedListing = {
          ...data,
          listing_images: sortedImages,
          profiles: sellerProfile,
        };

        setListing(normalizedListing);

        /*
      ========================================
      RELATED LISTINGS
      ========================================
      */

        if (data.category_id) {
          const { data: relatedData, error: relatedError } = await supabase
            .from("listings")
            .select(
              `
              id,
              title,
              slug,
              price,
              price_type,
              location,
              created_at,
              listing_images (
                image_url,
                sort_order
              )
            `
            )
            .eq("category_id", data.category_id)
            .eq("status", "published")
            // published
            .neq("id", data.id)
            .limit(4);

          if (relatedError) {
            console.error("Related listings error:", relatedError);
          }

          setRelatedListings(relatedData || []);
        } else {
          setRelatedListings([]);
        }

        /*
      ========================================
      SELLER LISTINGS
      ========================================
      */

        if (data.user_id) {
          const { data: sellerData, error: sellerError } = await supabase
            .from("listings")
            .select(
              `
              id,
              title,
              slug,
              price,
              price_type,
              location,
              created_at,
              listing_images (
                image_url,
                sort_order
              )
            `
            )
            .eq("user_id", data.user_id)
            .eq("status", "published")
            .neq("id", data.id)
            .limit(4);

          if (sellerError) {
            console.error("Seller listings error:", sellerError);
          }

          setSellerListings(sellerData || []);
        } else {
          setSellerListings([]);
        }
      } catch (err) {
        console.error("Listing details error:", err);

        setListing(null);
        setError("Unable to load this listing.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchListing();
    }
  }, [slug]);

  /*
  ========================================
  IMAGES
  ========================================
  */

  const images = listing?.listing_images || [];

  const currentImage = images[selectedImage]?.image_url || null;

  /*
  ========================================
  PRICE
  ========================================
  */

  const formattedPrice = useMemo(() => {
    if (!listing) {
      return "";
    }

    if (
      listing.price_type === "contact" ||
      listing.price === null ||
      listing.price === undefined
    ) {
      return "Contact seller";
    }

    const price = new Intl.NumberFormat("en-NG").format(listing.price);

    if (listing.price_type === "starting_from") {
      return `From ₦${price}`;
    }

    return `₦${price}`;
  }, [listing]);

  /*
  ========================================
  SELLER NAME
  ========================================
  */

  const sellerName =
    listing?.profiles?.business_name ||
    listing?.profiles?.full_name ||
    "SellaHub Seller";

  /*
  ========================================
  NEXT IMAGE
  ========================================
  */

  const nextImage = () => {
    if (!images.length) {
      return;
    }

    setSelectedImage((current) => (current + 1) % images.length);
  };

  /*
  ========================================
  PREVIOUS IMAGE
  ========================================
  */

  const previousImage = () => {
    if (!images.length) {
      return;
    }

    setSelectedImage(
      (current) => (current - 1 + images.length) % images.length
    );
  };

  /*
  ========================================
  SAVE
  ========================================
  */

  const handleSave = () => {
    setSaved((current) => !current);
  };

  /*
  ========================================
  SHARE
  ========================================
  */

  const handleShare = async () => {
    const shareData = {
      title: listing?.title || "SellaHub Listing",
      text: listing?.description || "Check out this listing on SellaHub.",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);

        alert("Listing link copied.");
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("Share error:", err);
      }
    }
  };

  /*
  ========================================
  CONTACT SELLER
  ========================================
  */

  const handleContactSeller = () => {
    navigate(`/contact-seller?listing=${listing.id}`);
  };

  /*
  ========================================
  LOADING
  ========================================
  */

  if (loading) {
    return (
      <main className="sh-listing-details-page">
        <div className="sh-listing-details-loading">
          <div className="sh-listing-loading-spinner" />
          <span>Loading listing...</span>
        </div>
      </main>
    );
  }

  /*
  ========================================
  ERROR
  ========================================
  */

  if (error) {
    return (
      <main className="sh-listing-details-page">
        <div className="sh-listing-details-state">
          <h1>Something went wrong.</h1>

          <p>{error}</p>

          <Link to="/browse">
            Browse listings
            <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  /*
  ========================================
  NOT FOUND
  ========================================
  */

  if (!listing) {
    return (
      <main className="sh-listing-details-page">
        <div className="sh-listing-details-state">
          <div className="sh-listing-state-icon">
            <Flag size={22} />
          </div>

          <h1>Listing not found.</h1>

          <p>
            This listing may have been removed, unpublished, or no longer
            exists.
          </p>

          <Link to="/browse-listings">
            Browse listings
            <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="sh-listing-details-page">
      <div className="sh-listing-details-container">
        {/* ========================================
            BREADCRUMB
        ======================================== */}

        <div className="sh-listing-breadcrumb">
          <Link to="/">Home</Link>

          <span>/</span>

          <Link to={`/browse?category=${listing.categories?.slug || ""}`}>
            {listing.categories?.name || "Category"}
          </Link>

          <span>/</span>

          <strong>{listing.title}</strong>
        </div>

        {/* ========================================
            MAIN LISTING
        ======================================== */}

        <section className="sh-listing-main">
          {/* IMAGE GALLERY */}

          <div className="sh-listing-gallery">
            <div
              className="sh-listing-main-image"
              onClick={() => images.length && setShowGallery(true)}
            >
              {currentImage ? (
                <img src={currentImage} alt={listing.title} />
              ) : (
                <div className="sh-listing-no-image">
                  <span>No image available</span>
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    className="sh-gallery-arrow sh-gallery-prev"
                    onClick={(event) => {
                      event.stopPropagation();
                      previousImage();
                    }}
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    type="button"
                    className="sh-gallery-arrow sh-gallery-next"
                    onClick={(event) => {
                      event.stopPropagation();
                      nextImage();
                    }}
                    aria-label="Next image"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {images.length > 0 && (
                <span className="sh-gallery-count">
                  {selectedImage + 1} / {images.length}
                </span>
              )}
            </div>

            {/* THUMBNAILS */}

            {images.length > 1 && (
              <div className="sh-listing-thumbnails">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    className={selectedImage === index ? "active" : ""}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img
                      src={image.image_url}
                      alt={`${listing.title} ${index + 1}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ========================================
              LISTING INFORMATION
          ======================================== */}

          <div className="sh-listing-info">
            <span className="sh-listing-category">
              {listing.categories?.name || "Marketplace listing"}
            </span>

            <h1>{listing.title}</h1>

            <div className="sh-listing-price">
              {formattedPrice}

              {listing.price_type === "negotiable" && <span>Negotiable</span>}
            </div>

            {/* QUICK INFO */}

            <div className="sh-listing-quick-info">
              {listing.condition && (
                <div>
                  <span>Condition</span>
                  <strong>{listing.condition}</strong>
                </div>
              )}

              {listing.location && (
                <div>
                  <span>Location</span>
                  <strong>
                    <MapPin size={14} />
                    {listing.location}
                  </strong>
                </div>
              )}
            </div>

            {/* DESCRIPTION */}

            <div className="sh-listing-short-description">
              <p>{listing.description}</p>
            </div>

            {/* ACTIONS */}

            <div className="sh-listing-actions">
              <button
                type="button"
                className="sh-listing-contact"
                onClick={handleContactSeller}
              >
                <MessageCircle size={17} />
                Contact seller
              </button>

              <button
                type="button"
                className={`sh-listing-save ${saved ? "saved" : ""}`}
                onClick={handleSave}
                aria-label={
                  saved ? "Remove from saved listings" : "Save listing"
                }
              >
                <Heart size={18} fill={saved ? "currentColor" : "none"} />
              </button>

              <button
                type="button"
                className="sh-listing-share"
                onClick={handleShare}
                aria-label="Share listing"
              >
                <Share2 size={18} />
              </button>
            </div>

            {/* TRUST */}

            <div className="sh-listing-trust">
              <ShieldCheck size={18} />

              <div>
                <strong>Shop with confidence</strong>

                <span>Connect directly with verified sellers on SellaHub.</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================
            LOWER CONTENT
        ======================================== */}

        <section className="sh-listing-lower">
          {/* LEFT */}

          <div className="sh-listing-lower-main">
            {/* DESCRIPTION */}

            <div className="sh-listing-content-section">
              <span className="sh-listing-section-label">
                About this listing
              </span>

              <h2>
                Product <span>description.</span>
              </h2>

              <div className="sh-listing-description">
                {listing.description?.split("\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            {/* DETAILS */}

            <div className="sh-listing-content-section">
              <span className="sh-listing-section-label">
                Listing information
              </span>

              <h2>
                Listing <span>details.</span>
              </h2>

              <div className="sh-listing-details-grid">
                <div>
                  <span>Category</span>
                  <strong>{listing.categories?.name || "Not specified"}</strong>
                </div>

                {listing.condition && (
                  <div>
                    <span>Condition</span>
                    <strong>{listing.condition}</strong>
                  </div>
                )}

                {listing.location && (
                  <div>
                    <span>Location</span>
                    <strong>{listing.location}</strong>
                  </div>
                )}

                <div>
                  <span>Listed</span>
                  <strong>
                    {new Date(listing.created_at).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================
              SELLER CARD
          ======================================== */}

          <aside className="sh-listing-seller">
            <span className="sh-listing-section-label">Seller</span>

            <div className="sh-seller-profile">
              <div className="sh-seller-avatar">
                {listing.profiles?.avatar_url ? (
                  <img src={listing.profiles.avatar_url} alt={sellerName} />
                ) : (
                  <UserRound size={24} />
                )}
              </div>

              <div>
                <h3>{sellerName}</h3>

                {listing.profiles?.seller_status === "verified" && (
                  <span className="sh-seller-verified">
                    <CheckCircle2 size={13} />
                    Verified business
                  </span>
                )}
              </div>
            </div>

            {listing.profiles?.location && (
              <div className="sh-seller-location">
                <MapPin size={15} />
                {listing.profiles.location}
              </div>
            )}

            <div className="sh-seller-stats">
              <div>
                <strong>{sellerListings.length + 1}</strong>
                <span>Listings</span>
              </div>

              <div>
                <strong>SellaHub</strong>
                <span>Marketplace</span>
              </div>
            </div>

            <button
              type="button"
              className="sh-seller-contact"
              onClick={handleContactSeller}
            >
              Contact seller
              <ArrowRight size={16} />
            </button>

            <Link
              to={`/seller/${listing.user_id}?from=${listing.slug}`}
              className="sh-seller-profile-link"
            >
              View seller profile
              <ArrowRight size={14} />
            </Link>

            <button type="button" className="sh-listing-report">
              <Flag size={14} />
              Report this listing
            </button>
          </aside>
        </section>

        {/* ========================================
            MORE FROM SELLER
        ======================================== */}

        {sellerListings.length > 0 && (
          <section className="sh-listing-related-section">
            <div className="sh-listing-section-heading">
              <div>
                <span className="sh-listing-section-label">
                  More from this seller
                </span>

                <h2>
                  More from <span>{sellerName}.</span>
                </h2>
              </div>

              <Link to={`/seller/${listing.user_id}`}>
                View seller
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="sh-listing-related-grid">
              {sellerListings.map((item) => (
                <RelatedCard key={item.id} listing={item} />
              ))}
            </div>
          </section>
        )}

        {/* ========================================
            RELATED LISTINGS
        ======================================== */}

        {relatedListings.length > 0 && (
          <section className="sh-listing-related-section">
            <div className="sh-listing-section-heading">
              <div>
                <span className="sh-listing-section-label">
                  You may also like
                </span>

                <h2>
                  Related <span>listings.</span>
                </h2>
              </div>

              <Link to="/browse">
                Browse all
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="sh-listing-related-grid">
              {relatedListings.map((item) => (
                <RelatedCard key={item.id} listing={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ========================================
          FULLSCREEN GALLERY
      ======================================== */}

      {showGallery && (
        <div
          className="sh-listing-lightbox"
          onClick={() => setShowGallery(false)}
        >
          <button
            type="button"
            className="sh-lightbox-close"
            onClick={() => setShowGallery(false)}
            aria-label="Close gallery"
          >
            <X size={22} />
          </button>

          <button
            type="button"
            className="sh-lightbox-arrow sh-lightbox-prev"
            onClick={(event) => {
              event.stopPropagation();
              previousImage();
            }}
            aria-label="Previous image"
          >
            <ChevronLeft size={26} />
          </button>

          <img
            src={currentImage}
            alt={listing.title}
            onClick={(event) => event.stopPropagation()}
          />

          <button
            type="button"
            className="sh-lightbox-arrow sh-lightbox-next"
            onClick={(event) => {
              event.stopPropagation();
              nextImage();
            }}
            aria-label="Next image"
          >
            <ChevronRight size={26} />
          </button>
        </div>
      )}
    </main>
  );
};

/*
=========================================================
RELATED CARD
=========================================================
*/

const RelatedCard = ({ listing }) => {
  const image = [...(listing.listing_images || [])].sort(
    (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
  )[0]?.image_url;

  const price =
    listing.price === null || listing.price_type === "contact"
      ? "Contact seller"
      : `₦${new Intl.NumberFormat("en-NG").format(listing.price)}`;

  return (
    <Link to={`/listing/${listing.slug}`} className="sh-related-card">
      <div className="sh-related-image">
        {image ? <img src={image} alt={listing.title} /> : <div>No image</div>}
      </div>

      <div className="sh-related-content">
        <h3>{listing.title}</h3>

        <strong>{price}</strong>

        {listing.location && (
          <span>
            <MapPin size={12} />
            {listing.location}
          </span>
        )}
      </div>
    </Link>
  );
};

export default ListingDetails;
