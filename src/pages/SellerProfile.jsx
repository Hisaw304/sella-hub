import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  LoaderCircle,
  MapPin,
  Package,
  Share2,
  UserRound,
} from "lucide-react";

import { supabase } from "../lib/supabase";

const SellerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [seller, setSeller] = useState(null);
  const [listings, setListings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();

  const listingSlug = searchParams.get("from");

  /*
  ========================================
  LOAD SELLER
  ========================================
  */

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        setLoading(true);
        setError("");

        /*
        ========================================
        SELLER PROFILE
        ========================================
        */

        const { data: sellerData, error: sellerError } = await supabase
          .from("profiles")
          .select(
            `
            id,
            full_name,
            business_name,
            avatar_url,
            location,
            seller_status,
            created_at
          `
          )
          .eq("id", id)
          .maybeSingle();

        if (sellerError) {
          throw sellerError;
        }

        if (!sellerData) {
          setSeller(null);
          setError("Seller profile not found.");
          return;
        }

        setSeller(sellerData);

        /*
        ========================================
        SELLER LISTINGS
        ========================================
        */

        const { data: listingsData, error: listingsError } = await supabase
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
          .eq("user_id", id)
          .eq("status", "published")
          .order("created_at", { ascending: false });

        if (listingsError) {
          throw listingsError;
        }

        /*
        ========================================
        NORMALIZE LISTINGS
        ========================================
        */

        const normalizedListings = (listingsData || []).map((listing) => {
          const sortedImages = [...(listing.listing_images || [])].sort(
            (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
          );

          return {
            ...listing,
            listing_images: sortedImages,
          };
        });

        setListings(normalizedListings);
      } catch (err) {
        console.error("Seller profile loading error:", err);

        setError("Unable to load this seller.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSeller();
    }
  }, [id]);

  /*
  ========================================
  PRICE
  ========================================
  */

  const formatPrice = (listing) => {
    if (!listing) {
      return "Price unavailable";
    }

    if (listing.price_type === "free") {
      return "Free";
    }

    if (listing.price_type === "contact") {
      return "Contact seller";
    }

    if (
      listing.price === null ||
      listing.price === undefined ||
      listing.price === ""
    ) {
      return "Price unavailable";
    }

    const price = `₦${Number(listing.price).toLocaleString("en-NG")}`;

    if (listing.price_type === "starting_from") {
      return `From ${price}`;
    }

    return price;
  };

  /*
  ========================================
  SELLER NAME
  ========================================
  */

  const sellerName =
    seller?.business_name || seller?.full_name || "SellaHub Seller";

  /*
  ========================================
  MEMBER SINCE
  ========================================
  */

  const memberSince = seller?.created_at
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(new Date(seller.created_at))
    : "";

  /*
  ========================================
  SHARE
  ========================================
  */

  const handleShare = async () => {
    const shareData = {
      title: sellerName,
      text: `View ${sellerName}'s listings on SellaHub.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Seller profile link copied.");
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("Share error:", err);
      }
    }
  };

  /*
  ========================================
  CONTACT
  ========================================
  */

  const handleContactSeller = () => {
    navigate(`/contact-seller?seller=${seller.id}`);
  };

  /*
  ========================================
  LOADING
  ========================================
  */

  if (loading) {
    return (
      <main className="sh-seller-page">
        <div className="sh-seller-container">
          <div className="sh-seller-loading">
            <LoaderCircle size={28} className="sh-seller-spinner" />

            <span>Loading seller...</span>
          </div>
        </div>
      </main>
    );
  }

  /*
  ========================================
  ERROR
  ========================================
  */

  if (error || !seller) {
    return (
      <main className="sh-seller-page">
        <div className="sh-seller-container">
          <div className="sh-seller-error">
            <div className="sh-seller-error-icon">
              <UserRound size={24} />
            </div>

            <h2>Seller not found</h2>

            <p>We couldn't find the seller you're looking for.</p>

            {listingSlug ? (
              <Link
                to={`/listing/${listingSlug}`}
                className="sh-seller-back-button"
              >
                <ArrowLeft size={16} />
                Back to listing
              </Link>
            ) : (
              <Link to="/browse" className="sh-seller-back-button">
                <ArrowLeft size={16} />
                Back to marketplace
              </Link>
            )}
          </div>
        </div>
      </main>
    );
  }

  /*
  ========================================
  PAGE
  ========================================
  */

  return (
    <main className="sh-seller-page">
      <div className="sh-seller-container">
        {/* BACK */}

        {listingSlug ? (
          <Link to={`/listing/${listingSlug}`} className="sh-seller-back">
            <ArrowLeft size={16} />
            Back to listing
          </Link>
        ) : (
          <Link to="/browse" className="sh-seller-back">
            <ArrowLeft size={16} />
            Back to marketplace
          </Link>
        )}

        {/* SELLER HERO */}

        <section className="sh-seller-hero">
          <div className="sh-seller-identity">
            <div className="sh-seller-large-avatar">
              {seller.avatar_url ? (
                <img src={seller.avatar_url} alt={sellerName} />
              ) : (
                <UserRound size={42} />
              )}
            </div>

            <div className="sh-seller-details">
              <div className="sh-seller-name-row">
                <h1>{sellerName}</h1>

                {seller.seller_status === "verified" && (
                  <span className="sh-seller-badge">
                    <BadgeCheck size={17} />
                    Verified
                  </span>
                )}
              </div>

              {seller.business_name && seller.full_name && (
                <p className="sh-seller-owner">{seller.full_name}</p>
              )}

              <div className="sh-seller-info">
                {seller.location && (
                  <span>
                    <MapPin size={15} />
                    {seller.location}
                  </span>
                )}

                {memberSince && (
                  <span>
                    <CalendarDays size={15} />
                    Member since {memberSince}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="sh-seller-actions">
            <button
              type="button"
              className="sh-seller-share"
              onClick={handleShare}
            >
              <Share2 size={16} />
              Share
            </button>

            <button
              type="button"
              className="sh-seller-contact"
              onClick={handleContactSeller}
            >
              Contact seller
              <ArrowUpRight size={16} />
            </button>
          </div>
        </section>

        {/* SELLER STATS */}

        <section className="sh-seller-stats">
          <div className="sh-seller-stat">
            <Package size={19} />

            <div>
              <strong>{listings.length}</strong>
              <span>Active listings</span>
            </div>
          </div>

          <div className="sh-seller-stat">
            <BadgeCheck size={19} />

            <div>
              <strong>
                {seller.seller_status === "verified" ? "Verified" : "Seller"}
              </strong>

              <span>Seller status</span>
            </div>
          </div>

          {seller.location && (
            <div className="sh-seller-stat">
              <MapPin size={19} />

              <div>
                <strong>{seller.location}</strong>
                <span>Location</span>
              </div>
            </div>
          )}
        </section>

        {/* LISTINGS */}

        <section className="sh-seller-listings">
          <div className="sh-seller-listings-header">
            <div>
              <span className="sh-section-label">Seller marketplace</span>

              <h2>
                Listings from <span>{sellerName}.</span>
              </h2>

              <p>Browse the latest products and services from this seller.</p>
            </div>
          </div>

          {listings.length === 0 ? (
            <div className="sh-seller-empty">
              <div className="sh-seller-empty-icon">
                <Package size={24} />
              </div>

              <h3>No active listings</h3>

              <p>This seller doesn't have any active listings right now.</p>
            </div>
          ) : (
            <div className="sh-seller-listings-grid">
              {listings.map((listing) => {
                const image = listing.listing_images?.[0]?.image_url;

                return (
                  <article className="sh-seller-listing-card" key={listing.id}>
                    <Link
                      to={`/listing/${listing.slug}`}
                      className="sh-seller-listing-image"
                    >
                      {image ? (
                        <img src={image} alt={listing.title} />
                      ) : (
                        <div className="sh-seller-listing-no-image">
                          <Package size={28} />
                        </div>
                      )}

                      {listing.categories?.name && (
                        <span>{listing.categories.name}</span>
                      )}
                    </Link>

                    <div className="sh-seller-listing-content">
                      <div className="sh-seller-listing-title">
                        <h3>{listing.title}</h3>

                        <ArrowUpRight size={16} />
                      </div>

                      <p className="sh-seller-listing-price">
                        {formatPrice(listing)}
                      </p>

                      {listing.location && (
                        <div className="sh-seller-listing-location">
                          <MapPin size={14} />
                          {listing.location}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default SellerProfile;
