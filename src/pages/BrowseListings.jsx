import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Bookmark,
  Package,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const ITEMS_PER_PAGE = 12;

export default function BrowseListings() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [listings, setListings] = useState([]);

  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);

  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [savedListings, setSavedListings] = useState(new Set());
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const [location, setLocation] = useState(searchParams.get("location") || "");

  const [category, setCategory] = useState(searchParams.get("category") || "");

  const [sort, setSort] = useState(searchParams.get("sort") || "newest");

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");

  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");

  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const [totalPages, setTotalPages] = useState(1);

  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const loadSavedListings = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data, error } = await supabase
          .from("saved_listings")
          .select("listing_id")
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }

        setSavedListings(new Set((data || []).map((item) => item.listing_id)));
      } catch (error) {
        console.error("Saved listings loading error:", error);
      }
    };

    loadSavedListings();
  }, []);
  /*
  ========================================
  LOAD CATEGORIES
  ========================================
  */

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);

        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true });

        if (error) {
          throw error;
        }

        setCategories(data || []);
      } catch (err) {
        console.error("Categories loading error:", err);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  /*
  ========================================
  LOAD LISTINGS
  ========================================
  */

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError("");

        let query = supabase
          .from("listings")
          .select(
            `
              id,
              user_id,
              category_id,
              title,
              slug,
              description,
              price,
              price_type,
              location,
              status,
              created_at,
              categories (
                id,
                name,
                slug
              ),
              listing_images (
                id,
                image_url,
                sort_order
              )
            `,
            { count: "exact" }
          )
          .eq("status", "published");

        /*
        ========================================
        SEARCH
        ========================================
        */

        if (search.trim()) {
          query = query.ilike("title", `%${search.trim()}%`);
        }

        /*
        ========================================
        LOCATION
        ========================================
        */

        if (location.trim()) {
          query = query.ilike("location", `%${location.trim()}%`);
        }

        /*
        ========================================
        CATEGORY
        ========================================
        */

        if (category) {
          const selectedCategory = categories.find(
            (item) => item.slug === category || item.id === category
          );

          if (selectedCategory) {
            query = query.eq("category_id", selectedCategory.id);
          }
        }

        /*
        ========================================
        PRICE
        ========================================
        */

        if (minPrice !== "") {
          query = query.gte("price", Number(minPrice));
        }

        if (maxPrice !== "") {
          query = query.lte("price", Number(maxPrice));
        }

        /*
        ========================================
        SORT
        ========================================
        */

        if (sort === "oldest") {
          query = query.order("created_at", {
            ascending: true,
          });
        } else if (sort === "price-low") {
          query = query.order("price", {
            ascending: true,
          });
        } else if (sort === "price-high") {
          query = query.order("price", {
            ascending: false,
          });
        } else {
          query = query.order("created_at", {
            ascending: false,
          });
        }

        /*
        ========================================
        FETCH
        ========================================
        */

        const from = (page - 1) * ITEMS_PER_PAGE;

        const to = from + ITEMS_PER_PAGE - 1;

        query = query.range(from, to);

        const { data, error: listingsError, count } = await query;

        if (listingsError) {
          throw listingsError;
        }

        const formattedListings = (data || []).map((listing) => ({
          ...listing,

          listing_images: [...(listing.listing_images || [])].sort(
            (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
          ),
        }));

        setListings(formattedListings);

        /*
        ========================================
        UPDATE URL
        ========================================
        */

        const params = new URLSearchParams();

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (location.trim()) {
          params.set("location", location.trim());
        }

        if (category) {
          params.set("category", category);
        }

        if (sort !== "newest") {
          params.set("sort", sort);
        }

        if (minPrice !== "") {
          params.set("minPrice", minPrice);
        }

        if (maxPrice !== "") {
          params.set("maxPrice", maxPrice);
        }

        if (page > 1) {
          params.set("page", String(page));
        }

        setSearchParams(params, {
          replace: true,
        });

        /*
        ========================================
        TOTAL PAGES
        ========================================
        */

        setTotalPages(Math.max(Math.ceil((count || 0) / ITEMS_PER_PAGE), 1));
      } catch (err) {
        console.error("Browse listings error:", err);

        setError("Unable to load listings.");
      } finally {
        setLoading(false);
      }
    };

    /*
      Wait for categories before applying
      category filtering.
    */

    if (!categoriesLoading) {
      fetchListings();
    }
  }, [
    search,
    location,
    category,
    sort,
    minPrice,
    maxPrice,
    page,
    categories,
    categoriesLoading,
    setSearchParams,
  ]);

  /*
  ========================================
  RESET PAGE WHEN FILTER CHANGES
  ========================================
  */

  useEffect(() => {
    setPage(1);
  }, [search, location, category, sort, minPrice, maxPrice]);

  /*
  ========================================
  SELECTED CATEGORY NAME
  ========================================
  */

  const selectedCategoryName = useMemo(() => {
    if (!category) return "";

    const found = categories.find(
      (item) => item.slug === category || item.id === category
    );

    return found?.name || "";
  }, [category, categories]);

  /*
  ========================================
  CLEAR FILTERS
  ========================================
  */

  const clearFilters = () => {
    setSearch("");
    setLocation("");
    setCategory("");
    setSort("newest");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  };

  /*
  ========================================
  PRICE FORMAT
  ========================================
  */

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === "") {
      return "Contact seller";
    }

    return `₦${Number(price).toLocaleString("en-NG")}`;
  };

  /*
  ========================================
  PAGE NUMBERS
  ========================================
  */

  const pageNumbers = [];

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pageNumbers.push(i);
    }
  }

  const toggleSave = async (listingId) => {
    try {
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

      const alreadySaved = savedListings.has(listingId);

      if (alreadySaved) {
        const { error } = await supabase
          .from("saved_listings")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", listingId);

        if (error) {
          throw error;
        }

        setSavedListings((previous) => {
          const next = new Set(previous);
          next.delete(listingId);
          return next;
        });
      } else {
        const { error } = await supabase.from("saved_listings").insert({
          user_id: user.id,
          listing_id: listingId,
        });

        if (error) {
          throw error;
        }

        setSavedListings((previous) => {
          const next = new Set(previous);
          next.add(listingId);
          return next;
        });
      }
    } catch (error) {
      console.error("Save listing error:", error);
    }
  };

  /*
  ========================================
  RENDER
  ========================================
  */

  return (
    <main className="sh-browse-page">
      <div className="sh-browse-container">
        {/* ========================================
            HEADER
        ======================================== */}

        <header className="sh-browse-header">
          <div>
            <span className="sh-browse-label">SellaHub marketplace</span>

            <h1>Find something worth buying.</h1>

            <p>
              Browse listings from sellers across the marketplace and find
              exactly what you need.
            </p>
          </div>

          <div className="sh-browse-result-count">
            <Package size={17} />

            <span>
              {loading
                ? "Loading..."
                : `${listings.length} ${
                    listings.length === 1 ? "listing" : "listings"
                  }`}
            </span>
          </div>
        </header>

        {/* ========================================
            SEARCH BAR
        ======================================== */}

        <div className="sh-browse-search">
          <div className="sh-browse-search-input">
            <Search size={18} />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search listings..."
            />

            {search && (
              <button type="button" onClick={() => setSearch("")}>
                <X size={16} />
              </button>
            )}
          </div>

          <div className="sh-browse-location-input">
            <MapPin size={18} />

            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
            />
          </div>

          <button
            type="button"
            className="sh-browse-filter-toggle"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal size={17} />
            Filters
          </button>
        </div>

        {/* ========================================
            FILTERS
        ======================================== */}

        <div
          className={`sh-browse-filters ${
            filtersOpen ? "sh-browse-filters-open" : ""
          }`}
        >
          <div className="sh-browse-filter">
            <label>Category</label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All categories</option>

              {categories.map((item) => (
                <option key={item.id} value={item.slug || item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sh-browse-filter">
            <label>Min price</label>

            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="₦0"
            />
          </div>

          <div className="sh-browse-filter">
            <label>Max price</label>

            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="No limit"
            />
          </div>

          <div className="sh-browse-filter">
            <label>Sort by</label>

            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest</option>

              <option value="oldest">Oldest</option>

              <option value="price-low">Price: Low to high</option>

              <option value="price-high">Price: High to low</option>
            </select>
          </div>

          <button
            type="button"
            className="sh-browse-clear"
            onClick={clearFilters}
          >
            <X size={15} />
            Clear
          </button>
        </div>

        {/* ========================================
            ACTIVE FILTER
        ======================================== */}

        {(selectedCategoryName ||
          search ||
          location ||
          minPrice ||
          maxPrice) && (
          <div className="sh-browse-active">
            <Filter size={15} />

            <span>{selectedCategoryName || "Filtered listings"}</span>

            <button type="button" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        )}

        {/* ========================================
            ERROR
        ======================================== */}

        {error ? (
          <div className="sh-browse-state sh-browse-error">
            <div className="sh-browse-state-icon">
              <Package size={22} />
            </div>

            <h2>Unable to load listings</h2>

            <p>{error}</p>

            <button type="button" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        ) : loading ? (
          /* ========================================
              LOADING
          ======================================== */

          <div className="sh-browse-grid">
            {Array.from({
              length: 8,
            }).map((_, index) => (
              <div className="sh-listing-skeleton" key={index}>
                <div className="sh-listing-skeleton-image" />

                <div className="sh-listing-skeleton-line large" />

                <div className="sh-listing-skeleton-line" />

                <div className="sh-listing-skeleton-line short" />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          /* ========================================
              EMPTY
          ======================================== */

          <div className="sh-browse-state">
            <div className="sh-browse-state-icon">
              <Search size={22} />
            </div>

            <h2>No listings found</h2>

            <p>We couldn't find listings matching your search or filters.</p>

            <button type="button" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        ) : (
          /* ========================================
              LISTINGS
          ======================================== */

          <>
            <div className="sh-browse-grid">
              {listings.map((listing) => {
                const image = listing.listing_images?.[0]?.image_url;

                return (
                  <Link
                    key={listing.id}
                    to={`/listing/${listing.slug}`}
                    className="sh-browse-listing-card"
                  >
                    <div className="sh-browse-listing-image">
                      {image ? (
                        <img src={image} alt={listing.title} />
                      ) : (
                        <div className="sh-browse-no-image">
                          <Package size={28} />
                        </div>
                      )}

                      {listing.price_type && (
                        <span className="sh-browse-price-type">
                          {listing.price_type}
                        </span>
                      )}

                      {/* SAVE */}
                      <button
                        type="button"
                        className={`sh-browse-save ${
                          savedListings.has(listing.id) ? "saved" : ""
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleSave(listing.id);
                        }}
                        aria-label={
                          savedListings.has(listing.id)
                            ? "Remove from saved listings"
                            : "Save listing"
                        }
                      >
                        <Bookmark
                          size={18}
                          fill={
                            savedListings.has(listing.id)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>
                    </div>

                    <div className="sh-browse-listing-content">
                      <span className="sh-browse-listing-category">
                        {listing.categories?.name || "Marketplace"}
                      </span>

                      <h2>{listing.title}</h2>

                      <div className="sh-browse-listing-location">
                        <MapPin size={14} />

                        <span>
                          {listing.location || "Location not specified"}
                        </span>
                      </div>

                      <div className="sh-browse-listing-bottom">
                        <strong>{formatPrice(listing.price)}</strong>

                        <ArrowDownUp size={16} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* ========================================
                PAGINATION
            ======================================== */}

            {totalPages > 1 && (
              <div className="sh-browse-pagination">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  <ChevronLeft size={17} />
                  Previous
                </button>

                <div>
                  {pageNumbers.map((number, index) => {
                    const previous = pageNumbers[index - 1];

                    const showDots = previous && number - previous > 1;

                    return (
                      <span key={number} className="sh-browse-page-group">
                        {showDots && (
                          <span className="sh-browse-dots">...</span>
                        )}

                        <button
                          type="button"
                          className={page === number ? "active" : ""}
                          onClick={() => setPage(number)}
                        >
                          {number}
                        </button>
                      </span>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                  <ChevronRight size={17} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
