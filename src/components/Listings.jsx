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

const Listings = () => {
  const [categoryRows, setCategoryRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError("");

        /*
        ========================================
        GET CATEGORIES
        ========================================
        */

        const { data: categories, error: categoriesError } = await supabase
          .from("categories")
          .select("id, name, slug")
          .order("name", { ascending: true });

        if (categoriesError) {
          throw categoriesError;
        }

        if (!categories || categories.length === 0) {
          setCategoryRows([]);
          return;
        }

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
          .order("created_at", { ascending: false });

        if (listingError) {
          throw listingError;
        }

        if (!listingData || listingData.length === 0) {
          setCategoryRows([]);
          return;
        }

        /*
        ========================================
        GET SELLER PROFILES
        ========================================
        */

        const userIds = [
          ...new Set(
            listingData.map((listing) => listing.user_id).filter(Boolean)
          ),
        ];

        let profiles = [];

        if (userIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, role")
            .in("id", userIds);

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

        const listingsWithProfiles = listingData.map((listing) => ({
          ...listing,

          profiles:
            profiles.find((profile) => profile.id === listing.user_id) || null,
        }));

        /*
        ========================================
        BUILD CATEGORY ROWS
        ========================================

        Each category receives ONLY its newest
        10 published listings.

        The 11th position is reserved for the
        "View all [Category]" card in the JSX.

        IMPORTANT:

        If a category has 25 listings in the
        database, only the newest 10 appear
        on this homepage row.

        The remaining listings still exist and
        remain accessible through Browse/Search.
        */

        const rows = categories
          .map((category) => {
            const categoryListings = listingsWithProfiles
              .filter((listing) => listing.category_id === category.id)
              .slice(0, 10);

            return {
              id: category.id,
              name: category.name,
              slug: category.slug,
              listings: categoryListings,
            };
          })
          .filter((category) => category.listings.length > 0);

        setCategoryRows(rows);
      } catch (err) {
        console.error("Listings error:", err);

        setError("Unable to load listings.");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  /*
  ========================================
  FORMAT PRICE
  ========================================
  */

  const formatPrice = (listing) => {
    if (!listing) {
      return "Price unavailable";
    }

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
        {/* ========================================
            MAIN HEADER
        ======================================== */}

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

        {/* ========================================
            EMPTY STATE
        ======================================== */}

        {categoryRows.length === 0 ? (
          <div className="sh-featured-empty">
            <div className="sh-featured-empty-icon">
              <Package size={23} />
            </div>

            <h3>No listings yet</h3>

            <p>New products and services from sellers will appear here.</p>
          </div>
        ) : (
          /*
          ========================================
          CATEGORY ROWS
          ========================================
          */

          <div className="sh-category-rows">
            {categoryRows.map((category) => (
              <section className="sh-category-row" key={category.id}>
                {/* ========================================
                    CATEGORY TITLE
                ======================================== */}

                <div className="sh-category-row-header">
                  <div className="sh-category-row-title">
                    <h3>{category.name}</h3>
                  </div>
                </div>

                {/* ========================================
                    HORIZONTAL LISTINGS
                ======================================== */}

                <div className="sh-category-scroll">
                  <div className="sh-category-track">
                    {/* ========================================
                        MAXIMUM 10 LISTINGS
                    ======================================== */}

                    {category.listings.map((listing) => {
                      const seller =
                        listing.profiles?.full_name || "SellaHub seller";

                      const verified = Boolean(listing.verified);

                      return (
                        <ListingCard
                          key={listing.id}
                          listing={listing}
                          seller={seller}
                          verified={verified}
                          formatPrice={formatPrice}
                        />
                      );
                    })}

                    {/* ========================================
                        11TH CARD — VIEW ALL CATEGORY
                    ======================================== */}

                    <Link
                      to={`/browse?category=${category.id}`}
                      className="sh-category-view-card"
                      aria-label={`View all ${category.name} listings`}
                    >
                      <div className="sh-category-view-card-inner">
                        <span>View all {category.name}</span>
                        <ArrowUpRight size={21} />
                      </div>
                    </Link>
                  </div>
                </div>
              </section>
            ))}
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
        .order("created_at", {
          ascending: true,
        })
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
      {/* ========================================
          IMAGE
      ======================================== */}

      <Link to={`/listing/${listing.slug}`} className="sh-listing-image-link">
        <div className="sh-listing-image-wrap">
          {image ? (
            <img
              src={image}
              alt={listing.title}
              className="sh-listing-image"
              loading="lazy"
            />
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

      {/* ========================================
          CONTENT
      ======================================== */}

      <div className="sh-listing-content">
        <div className="sh-listing-title-row">
          <h3>{listing.title}</h3>

          {verified && <BadgeCheck className="sh-verified-icon" size={17} />}
        </div>

        {/* ========================================
            PRICE
        ======================================== */}

        <div className="sh-listing-price">
          {listing.price_type === "starting_from" ? (
            <>
              <span className="sh-price-prefix">From</span>

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

        {/* ========================================
            META
        ======================================== */}

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

export default Listings;
