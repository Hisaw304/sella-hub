import { useEffect, useState } from "react";
import {
  Bookmark,
  Package,
  MapPin,
  ArrowRight,
  Trash2,
  ArrowLeft,
  // ArrowRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Link, useNavigate } from "react-router-dom";
export default function SavedListings() {
  const [savedListings, setSavedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSavedListings = async () => {
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
          setSavedListings([]);
          return;
        }

        const { data, error: savedError } = await supabase
          .from("saved_listings")
          .select(
            `
            id,
            user_id,
            listing_id,
            created_at,
            listings (
              id,
              title,
              slug,
              price,
              price_type,
              location,
              status,
              listing_images (
                id,
                image_url,
                sort_order
              )
            )
          `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (savedError) {
          throw savedError;
        }

        const formattedListings = (data || [])
          .filter((item) => item.listings)
          .map((item) => {
            const listing = item.listings;

            const images = [...(listing.listing_images || [])].sort(
              (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
            );

            return {
              ...listing,
              saved_id: item.id,
              saved_at: item.created_at,
              listing_images: images,
            };
          });

        setSavedListings(formattedListings);
      } catch (err) {
        console.error("Saved listings error:", err);
        setError("Unable to load your saved listings.");
      } finally {
        setLoading(false);
      }
    };

    fetchSavedListings();
  }, []);

  const removeSavedListing = async (savedId) => {
    try {
      setRemoving(savedId);

      const { error } = await supabase
        .from("saved_listings")
        .delete()
        .eq("id", savedId);

      if (error) {
        throw error;
      }

      setSavedListings((current) =>
        current.filter((listing) => listing.saved_id !== savedId)
      );
    } catch (err) {
      console.error("Remove saved listing error:", err);
      setError("Unable to remove this saved listing.");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <main className="sh-saved-page">
      <div className="sh-saved-container">
        <Link to="/dashboard" className="sh-create-listing-back">
          <ArrowLeft size={17} />
          Dashboard
        </Link>
        {/* HEADER */}
        <div className="sh-saved-header">
          <div>
            <span className="sh-saved-label">Your collection</span>

            <h1>Saved listings</h1>

            <p>Listings you've saved so you can easily find them again.</p>
          </div>

          <div className="sh-saved-count">
            <Bookmark size={17} />

            <span>{loading ? "—" : savedListings.length} saved</span>
          </div>
        </div>

        {/* ERROR */}
        {error && <div className="sh-saved-error">{error}</div>}

        {/* LOADING */}
        {loading ? (
          <div className="sh-saved-empty">
            <div className="sh-saved-empty-icon">
              <Bookmark size={23} />
            </div>

            <h2>Loading saved listings...</h2>

            <p>We're fetching the listings you've saved.</p>
          </div>
        ) : savedListings.length === 0 ? (
          /* EMPTY */
          <div className="sh-saved-empty">
            <div className="sh-saved-empty-icon">
              <Bookmark size={23} />
            </div>

            <h2>No saved listings yet</h2>

            <p>
              When you find something you like, save the listing and it will
              appear here.
            </p>

            <a href="/dashboard/my-listings" className="sh-saved-browse">
              Browse listings
              <ArrowRight size={17} />
            </a>
          </div>
        ) : (
          /* LIST */
          <div className="sh-saved-grid">
            {savedListings.map((listing) => {
              const image = listing.listing_images?.[0]?.image_url;

              return (
                <article className="sh-saved-card" key={listing.saved_id}>
                  {/* IMAGE */}
                  <a
                    href={`/listing/${listing.slug}`}
                    className="sh-saved-image"
                  >
                    {image ? (
                      <img src={image} alt={listing.title} />
                    ) : (
                      <div className="sh-saved-no-image">
                        <Package size={28} />
                      </div>
                    )}

                    <span className="sh-saved-status">{listing.status}</span>
                  </a>

                  {/* CONTENT */}
                  <div className="sh-saved-content">
                    <div className="sh-saved-content-top">
                      <div>
                        <h2>
                          <a href={`/listing/${listing.slug}`}>
                            {listing.title}
                          </a>
                        </h2>

                        {listing.location && (
                          <span className="sh-saved-location">
                            <MapPin size={14} />
                            {listing.location}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="sh-saved-remove"
                        onClick={() => removeSavedListing(listing.saved_id)}
                        disabled={removing === listing.saved_id}
                        aria-label="Remove saved listing"
                        title="Remove saved listing"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="sh-saved-card-bottom">
                      <strong>
                        {listing.price
                          ? `₦${Number(listing.price).toLocaleString()}`
                          : "Contact seller"}
                      </strong>

                      {listing.price_type && <span>{listing.price_type}</span>}
                    </div>

                    <a
                      href={`/listing/${listing.slug}`}
                      className="sh-saved-view"
                    >
                      View listing
                      <ArrowRight size={15} />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
