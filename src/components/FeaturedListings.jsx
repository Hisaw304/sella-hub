import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Heart,
  MapPin,
  BadgeCheck,
  LoaderCircle,
  Package,
} from "lucide-react";

import { supabase } from "../lib/supabase";

const FeaturedListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFeaturedListings = async () => {
      try {
        setLoading(true);
        setError("");

        /*
      ========================================
      GET PUBLISHED LISTINGS
      ========================================
      */

        const { data: listingData, error: listingError } = await supabase
          .from("listings")
          .select(
            `
          *,
          categories (
            id,
            name
          )
        `
          )
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(20);

        if (listingError) {
          throw listingError;
        }

        if (!listingData || listingData.length === 0) {
          setListings([]);
          return;
        }

        /*
      ========================================
      GET SELLERS
      ========================================
      */

        const userIds = [
          ...new Set(
            listingData.map((listing) => listing.user_id).filter(Boolean)
          ),
        ];

        /*
      ========================================
      GET ACTIVE PLANS
      ========================================
      */

        let activePlans = [];

        if (userIds.length > 0) {
          const { data: planData, error: planError } = await supabase
            .from("user_plans")
            .select(
              `
            user_id,
            status,
            expired_at
          `
            )
            .in("user_id", userIds)
            .eq("status", "active")
            .gt("expired_at", new Date().toISOString());

          if (planError) {
            throw planError;
          }

          activePlans = planData || [];
        }

        /*
      ========================================
      ONLY KEEP LISTINGS FROM USERS
      WITH ACTIVE SUBSCRIPTIONS
      ========================================
      */

        const activeUserIds = new Set(activePlans.map((plan) => plan.user_id));

        const activeListings = listingData.filter((listing) =>
          activeUserIds.has(listing.user_id)
        );

        if (activeListings.length === 0) {
          setListings([]);
          return;
        }

        /*
      ========================================
      GET SELLER PROFILES
      ========================================
      */

        const activeSellerIds = [
          ...new Set(
            activeListings.map((listing) => listing.user_id).filter(Boolean)
          ),
        ];

        let profiles = [];

        if (activeSellerIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, role")
            .in("id", activeSellerIds);

          if (profileError) {
            console.warn("Profiles loading error:", profileError);
          } else {
            profiles = profileData || [];
          }
        }

        /*
      ========================================
      ATTACH SELLER PROFILE
      ========================================
      */

        const listingsWithProfiles = activeListings.map((listing) => ({
          ...listing,

          profiles:
            profiles.find((profile) => profile.id === listing.user_id) || null,
        }));

        /*
      ========================================
      SHOW ONLY 6 FEATURED LISTINGS
      ========================================
      */

        setListings(listingsWithProfiles.slice(0, 6));
      } catch (err) {
        console.error("Featured listings error:", err);
        setError("Unable to load featured listings.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedListings();
  }, []);

  const formatPrice = (listing) => {
    if (!listing) return "Price unavailable";

    if (
      listing.price === null ||
      listing.price === undefined ||
      listing.price === ""
    ) {
      return "Price unavailable";
    }

    return `₦${Number(listing.price).toLocaleString("en-NG")}`;
  };

  /*
  ========================================
  LOADING
  ========================================
  */

  if (loading) {
    return (
      <section className="sh-featured">
        <div className="sh-featured-container">
          <div className="sh-featured-header">
            <div className="sh-featured-heading">
              <span className="sh-section-label">Explore the marketplace</span>

              <h2>
                Find something
                <span> worth discovering.</span>
              </h2>
            </div>
          </div>

          <div className="sh-featured-loading">
            <LoaderCircle size={25} className="sh-featured-spinner" />

            <span>Loading listings...</span>
          </div>
        </div>
      </section>
    );
  }

  /*
  ========================================
  ERROR
  ========================================
  */

  if (error) {
    return (
      <section className="sh-featured">
        <div className="sh-featured-container">
          <div className="sh-featured-error">
            <Package size={22} />

            <p>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  /*
  ========================================
  CONTENT
  ========================================
  */

  return (
    <section className="sh-featured">
      <div className="sh-featured-container">
        {/* HEADER */}

        <div className="sh-featured-header">
          <div className="sh-featured-heading">
            <span className="sh-section-label">Explore the marketplace</span>

            <h2>
              Find something
              <span> worth discovering.</span>
            </h2>
          </div>

          <Link to="/browse" className="sh-view-all">
            View all listings
            <ArrowUpRight size={17} />
          </Link>
        </div>

        {/* EMPTY */}

        {listings.length === 0 ? (
          <div className="sh-featured-empty">
            <div className="sh-featured-empty-icon">
              <Package size={23} />
            </div>

            <h3>No listings yet</h3>

            <p>New products and services from sellers will appear here.</p>
          </div>
        ) : (
          <div className="sh-listings-grid">
            {listings.map((listing) => {
              const category = listing.categories?.name || "Marketplace";

              const seller = listing.profiles?.full_name || "SellaHub seller";

              const verified = Boolean(listing.verified);

              /*
              ========================================
              IMAGE
              ========================================

              Your listings table does not contain an image
              column, so don't try to read listing.image_url.
              Images should come from listing_images.
              */

              return (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  category={category}
                  seller={seller}
                  verified={verified}
                  formatPrice={formatPrice}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

/*
==================================================
LISTING CARD
==================================================
*/

const ListingCard = ({ listing, category, seller, verified, formatPrice }) => {
  const [image, setImage] = useState(null);

  useEffect(() => {
    const fetchImage = async () => {
      const { data, error } = await supabase
        .from("listing_images")
        .select("*")
        .eq("listing_id", listing.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setImage(data.image_url || data.url || data.image || data.path || null);
      }
    };

    fetchImage();
  }, [listing.id]);

  return (
    <article className="sh-listing-card">
      {/* IMAGE */}

      <Link to={`/listing/${listing.slug}`} className="sh-listing-image-link">
        <div className="sh-listing-image-wrap">
          {image ? (
            <img src={image} alt={listing.title} className="sh-listing-image" />
          ) : (
            <div className="sh-listing-no-image">
              <Package size={30} />
            </div>
          )}

          <span className="sh-listing-category">{category}</span>

          <button
            type="button"
            className="sh-save-listing"
            aria-label={`Save ${listing.title}`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <Heart size={17} />
          </button>
        </div>
      </Link>

      {/* CONTENT */}

      <div className="sh-listing-content">
        <div className="sh-listing-title-row">
          <h3>{listing.title}</h3>

          {verified && <BadgeCheck className="sh-verified-icon" size={17} />}
        </div>

        <div className="sh-listing-price">
          {listing.price_type === "starting_from" ? (
            <>
              <span className="sh-price-prefix">From</span>{" "}
              {formatPrice(listing)}
            </>
          ) : listing.price_type === "negotiable" ? (
            <>
              {formatPrice(listing)}
              <span className="sh-price-type">Negotiable</span>
            </>
          ) : listing.price_type === "free" ? (
            "Free"
          ) : listing.price_type === "contact" ? (
            "Contact seller"
          ) : (
            formatPrice(listing)
          )}
        </div>

        <div className="sh-listing-meta">
          <span>
            <MapPin size={14} />
            {listing.location || "Location not specified"}
          </span>

          <span className="sh-listing-seller">{seller}</span>
        </div>
      </div>
    </article>
  );
};

export default FeaturedListings;
