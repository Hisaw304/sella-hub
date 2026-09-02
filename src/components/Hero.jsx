import { ArrowRight, Search, ShieldCheck, Store } from "lucide-react";

import heroImage from "../assets/herosh.jpg";

const Hero = () => {
  return (
    <section className="sh-hero">
      <div className="sh-hero-container">
        {/* HERO CONTENT */}
        <div className="sh-hero-content">
          <div className="sh-hero-badge">
            <span className="sh-hero-badge-dot"></span>
            Nigeria's growing marketplace
          </div>

          <h1 className="sh-hero-title">
            Discover.
            <br />
            Connect.
            <br />
            <span>Buy &amp; Sell.</span>
          </h1>

          <p className="sh-hero-description">
            Find products, discover trusted services, and connect with
            businesses and sellers all in one place.
          </p>

          <div className="sh-hero-actions">
            <a href="/browse" className="sh-hero-primary">
              Explore Listings
              <ArrowRight size={18} />
            </a>

            <a href="/signup" className="sh-hero-secondary">
              Post a Listing
            </a>
          </div>

          <div className="sh-hero-trust">
            <ShieldCheck size={17} />
            <span>Built for buyers, sellers &amp; businesses</span>
          </div>
        </div>

        {/* HERO IMAGE */}
        <div className="sh-hero-visual">
          <div className="sh-hero-image-wrap">
            <img
              src={heroImage}
              alt="Discover products and services on SellaHub"
              className="sh-hero-image"
            />
          </div>

          <div className="sh-floating-card sh-floating-card-top">
            <div className="sh-floating-icon">
              <Search size={17} />
            </div>

            <div>
              <strong>Find what you need</strong>
              <span>Thousands of listings</span>
            </div>
          </div>

          <div className="sh-floating-card sh-floating-card-bottom">
            <div className="sh-floating-icon">
              <Store size={17} />
            </div>

            <div>
              <strong>Grow your business</strong>
              <span>Reach more customers</span>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="sh-hero-stats">
        <div className="sh-stat">
          <strong>10,000+</strong>
          <span>Listings</span>
        </div>

        <div className="sh-stat-divider"></div>

        <div className="sh-stat">
          <strong>2,500+</strong>
          <span>Sellers</span>
        </div>

        <div className="sh-stat-divider"></div>

        <div className="sh-stat">
          <strong>1,000+</strong>
          <span>Verified Businesses</span>
        </div>
      </div>
    </section>
  );
};

export default Hero;
