import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LoaderCircle, Package, Tag } from "lucide-react";
import { supabase } from "../lib/supabase";

import electronicsImage from "../assets/electronics.jpg";
import fashionImage from "../assets/fashion.jpg";
import homeImage from "../assets/home-living.jpg";
import automobilesImage from "../assets/automotive.jpg";
import beautyImage from "../assets/fashion.jpg";
import foodImage from "../assets/food.jpg";
import servicesImage from "../assets/services.jpg";
import realEstateImage from "../assets/real-estate.jpg";
import agricultureImage from "../assets/agriculture.jpg";
import businessImage from "../assets/business.jpg";

const CATEGORY_IMAGES = {
  Electronics: electronicsImage,
  Fashion: fashionImage,
  "Home & Living": homeImage,
  Automobiles: automobilesImage,
  "Beauty & Personal Care": beautyImage,
  "Food & Beverages": foodImage,
  Services: servicesImage,
  "Real Estate": realEstateImage,
  Agriculture: agricultureImage,
  "Business & Industrial": businessImage,
};

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
          .order("sort_order", { ascending: true })
          .limit(6);

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

            <h2>Find what you're looking for.</h2>

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

        {categories.length === 0 ? (
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
          <div className="sh-categories-grid">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/browse?category=${category.id}`}
                className="sh-category-card"
                style={{
                  backgroundImage: `url(${
                    CATEGORY_IMAGES[category.name] || ""
                  })`,
                }}
              >
                <div className="sh-category-overlay" />

                <div className="sh-category-icon">
                  <Tag size={21} />
                </div>

                <div className="sh-category-content">
                  <h3>{category.name}</h3>

                  {category.description && <p>{category.description}</p>}
                </div>

                <div className="sh-category-arrow">
                  <ArrowRight size={17} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
