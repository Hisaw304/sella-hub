import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import {
  ArrowUpRight,
  Heart,
  MapPin,
  BadgeCheck,
  LoaderCircle,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { supabase } from "../lib/supabase";

import "swiper/css";
import "swiper/css/navigation";

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
          .order("created_at", { ascending: false });

        if (listingError) {
          throw listingError;
        }

        if (!listingData || listingData.length === 0) {
          setListings([]);
          return;
        }

        /*
        ========================================
        GET SELLER IDS
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
                expired_at,
                plan_id,
                pricing_plans (
                  id,
                  name,
                  slug,
                  featured_homepage
                )
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
        SELLERS ELIGIBLE FOR HOMEPAGE FEATURE
        ========================================
        */

        const featuredSellerIds = new Set(
          activePlans
            .filter((plan) => plan.pricing_plans?.featured_homepage === true)
            .map((plan) => plan.user_id)
        );

        /*
        ========================================
        ONE LISTING PER PREMIUM SELLER
        ========================================

        Listings are already ordered newest first,
        so the first listing we encounter for each
        seller becomes their featured listing.
        ========================================
        */

        const sellerMap = new Map();

        for (const listing of listingData) {
          if (!featuredSellerIds.has(listing.user_id)) {
            continue;
          }

          if (!sellerMap.has(listing.user_id)) {
            sellerMap.set(listing.user_id, listing);
          }
        }

        const featuredListings = Array.from(sellerMap.values());

        if (featuredListings.length === 0) {
          setListings([]);
          return;
        }

        /*
        ========================================
        GET SELLER PROFILES
        ========================================
        */

        const sellerIds = [
          ...new Set(
            featuredListings.map((listing) => listing.user_id).filter(Boolean)
          ),
        ];

        let profiles = [];

        if (sellerIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, role")
            .in("id", sellerIds);

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

        const listingsWithProfiles = featuredListings.map((listing) => ({
          ...listing,
          profiles:
            profiles.find((profile) => profile.id === listing.user_id) || null,
        }));

        setListings(listingsWithProfiles);
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
      <section className="sh-premium-featured">
        <div className="sh-premium-featured-container">
          <div className="sh-premium-featured-header">
            <div className="sh-premium-featured-heading">
              <span className="sh-section-label">Premium sellers</span>

              <h2>
                Discover what’s
                <span> worth a closer look.</span>
              </h2>
            </div>

            <div className="sh-premium-featured-actions">
              <Link to="/browse" className="sh-view-all">
                View all listings
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>

          <div className="sh-premium-featured-loading">
            <LoaderCircle size={25} className="sh-premium-featured-spinner" />

            <span>Loading featured listings...</span>
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
      <section className="sh-premium-featured">
        <div className="sh-premium-featured-container">
          <div className="sh-premium-featured-error">
            <Package size={22} />
            <p>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  /*
  ========================================
  EMPTY
  ========================================
  */

  if (listings.length === 0) {
    return null;
  }

  /*
  ========================================
  CONTENT
  ========================================
  */

  return (
    <section className="sh-premium-featured">
      <div className="sh-premium-featured-container">
        {/* HEADER */}
        <div className="sh-premium-featured-header">
          <div className="sh-premium-featured-heading">
            <span className="sh-section-label">Featured sellers</span>

            <h2>
              Discover what’s
              <span> worth a closer look.</span>
            </h2>
          </div>

          {/* VIEW ALL ONLY */}
          <div className="sh-premium-featured-actions">
            <Link to="/browse" className="sh-view-all">
              View all listings
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>

        {/* SLIDER */}
        {/* SLIDER */}
        <div className="sh-premium-featured-slider">
          {/* NAVIGATION — SITS OVER THE CARDS */}
          <button
            type="button"
            className="sh-premium-featured-nav sh-premium-featured-prev"
            aria-label="Previous featured listings"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            className="sh-premium-featured-nav sh-premium-featured-next"
            aria-label="Next featured listings"
          >
            <ChevronRight size={18} />
          </button>

          <Swiper
            modules={[Navigation, Autoplay]}
            navigation={{
              prevEl: ".sh-premium-featured-prev",
              nextEl: ".sh-premium-featured-next",
            }}
            loop={listings.length > 1}
            spaceBetween={22}
            slidesPerView={1.15}
            speed={750}
            autoplay={
              listings.length > 1
                ? {
                    delay: 4000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                  }
                : false
            }
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 18,
              },

              900: {
                slidesPerView: 3,
                spaceBetween: 20,
              },

              1200: {
                slidesPerView: 4,
                spaceBetween: 22,
              },
            }}
          >
            {listings.map((listing) => {
              const category = listing.categories?.name || "Marketplace";

              const seller = listing.profiles?.full_name || "SellaHub seller";

              const verified = Boolean(listing.verified);

              return (
                <SwiperSlide key={listing.id}>
                  <PremiumFeaturedCard
                    listing={listing}
                    category={category}
                    seller={seller}
                    verified={verified}
                    formatPrice={formatPrice}
                  />
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

/*
==================================================
PREMIUM FEATURED CARD
==================================================
*/

const PremiumFeaturedCard = ({
  listing,
  category,
  seller,
  verified,
  formatPrice,
}) => {
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
    <article className="sh-premium-featured-card">
      {/* IMAGE */}

      <Link
        to={`/listing/${listing.slug}`}
        className="sh-premium-featured-image-link"
      >
        <div className="sh-premium-featured-image-wrap">
          {image ? (
            <img
              src={image}
              alt={listing.title}
              className="sh-premium-featured-image"
            />
          ) : (
            <div className="sh-premium-featured-no-image">
              <Package size={30} />
            </div>
          )}

          <span className="sh-premium-featured-category">{category}</span>

          <button
            type="button"
            className="sh-premium-featured-save"
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

      <div className="sh-premium-featured-content">
        <div className="sh-premium-featured-title-row">
          <h3>{listing.title}</h3>

          {verified && (
            <BadgeCheck className="sh-premium-featured-verified" size={17} />
          )}
        </div>

        <div className="sh-premium-featured-price">
          {listing.price_type === "starting_from" ? (
            <>
              <span className="sh-premium-featured-price-prefix">From</span>{" "}
              {formatPrice(listing)}
            </>
          ) : listing.price_type === "negotiable" ? (
            <>
              {formatPrice(listing)}

              <span className="sh-premium-featured-price-type">Negotiable</span>
            </>
          ) : listing.price_type === "free" ? (
            "Free"
          ) : listing.price_type === "contact" ? (
            "Contact seller"
          ) : (
            formatPrice(listing)
          )}
        </div>

        <div className="sh-premium-featured-meta">
          <span>
            <MapPin size={14} />

            {listing.location || "Location not specified"}
          </span>

          <span className="sh-premium-featured-seller">{seller}</span>
        </div>
      </div>
    </article>
  );
};

export default FeaturedListings;
