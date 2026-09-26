import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Package,
  Tag,
} from "lucide-react";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

import { supabase } from "../lib/supabase";

import electronicsImage from "../assets/electronics.jpg";
import fashionImage from "../assets/fashion.jpg";
import homeImage from "../assets/home-living.jpg";
import foodImage from "../assets/food.jpg";
import servicesImage from "../assets/services.jpg";
import jobImage from "../assets/job.jpg";

const CATEGORY_IMAGES = {
  Electronics: electronicsImage,
  Fashion: fashionImage,
  "Home & Living": homeImage,
  "Food & Beverages": foodImage,
  Services: servicesImage,
  "Jobs & Careers": jobImage,
};

const HOME_CATEGORY_NAMES = [
  "Electronics",
  "Fashion",
  "Services",
  "Jobs & Careers",
  "Food & Beverages",
  "Home & Living",
];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError("");

        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (error) {
          throw error;
        }

        setCategories(data || []);
      } catch (err) {
        console.error("Categories loading error:", err);
        setError("Unable to load categories.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const homepageCategories = HOME_CATEGORY_NAMES.map((name) =>
    categories.find((category) => category.name === name)
  ).filter(Boolean);

  if (loading) {
    return (
      <section className="sh-home-categories">
        <div className="sh-home-categories-container">
          <div className="sh-home-section-heading">
            <span>Explore marketplace</span>
            <h2>Find what you're looking for.</h2>
          </div>

          <div className="sh-categories-loading">
            <LoaderCircle size={24} className="sh-categories-spinner" />
            <span>Loading categories...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="sh-home-categories">
        <div className="sh-home-categories-container">
          <div className="sh-categories-error">
            <Tag size={22} />
            <p>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="sh-home-categories">
      <div className="sh-home-categories-container">
        {/* HEADER */}

        <div className="sh-home-section-heading">
          <div>
            <span>Explore marketplace</span>

            <h2>
              Find what
              <span> you're looking for.</span>
            </h2>

            <p>
              Explore listings across different categories and discover products
              and services from sellers on SellaHub.
            </p>
          </div>

          <Link to="/categories" className="sh-categories-view-all">
            View all categories
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* CATEGORIES */}

        {homepageCategories.length === 0 ? (
          <div className="sh-categories-empty">
            <div className="sh-categories-empty-icon">
              <Package size={22} />
            </div>

            <h3>No categories available</h3>

            <p>
              Categories will appear here when they are added to the
              marketplace.
            </p>
          </div>
        ) : (
          <div className="sh-home-category-slider">
            <Swiper
              modules={[Navigation]}
              navigation={{
                prevEl: ".sh-home-category-prev",
                nextEl: ".sh-home-category-next",
              }}
              spaceBetween={18}
              slidesPerView={1.15}
              speed={600}
              grabCursor={true}
              simulateTouch={true}
              allowTouchMove={true}
              touchRatio={1}
              touchAngle={45}
              resistance={true}
              resistanceRatio={0.85}
              breakpoints={{
                560: {
                  slidesPerView: 2.1,
                  spaceBetween: 16,
                },
                768: {
                  slidesPerView: 2.5,
                  spaceBetween: 18,
                },
                1024: {
                  slidesPerView: 3.5,
                  spaceBetween: 20,
                },
                1280: {
                  slidesPerView: 4.25,
                  spaceBetween: 20,
                },
              }}
            >
              {homepageCategories.map((category) => (
                <SwiperSlide key={category.id}>
                  <Link
                    to={`/browse?category=${category.id}`}
                    className="sh-home-category-card"
                  >
                    <img
                      src={CATEGORY_IMAGES[category.name]}
                      alt={category.name}
                      className="sh-home-category-image"
                    />

                    <div className="sh-home-category-overlay" />

                    <div className="sh-home-category-content">
                      <span>Explore</span>

                      <h3>{category.name}</h3>
                    </div>

                    <div className="sh-home-category-arrow">
                      <ArrowUpRight size={18} />
                    </div>
                  </Link>
                </SwiperSlide>
              ))}

              {/* VIEW ALL CARD */}

              <SwiperSlide>
                <Link
                  to="/categories"
                  className="sh-home-category-card sh-home-category-view-all"
                >
                  <div className="sh-home-category-view-content">
                    <span>SellaHub</span>

                    <h3>
                      View all
                      <br />
                      categories
                    </h3>

                    <div className="sh-home-category-view-arrow">
                      <ArrowRight size={19} />
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            </Swiper>

            {/* SLIDER CONTROLS */}

            <div className="sh-home-category-controls">
              <button
                type="button"
                className="sh-home-category-nav sh-home-category-prev"
                aria-label="Previous categories"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                className="sh-home-category-nav sh-home-category-next"
                aria-label="Next categories"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
