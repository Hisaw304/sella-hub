import {
  ArrowRight,
  BadgeCheck,
  Globe2,
  Handshake,
  Store,
  Users,
} from "lucide-react";

const About = () => {
  return (
    <main className="sh-about-page">
      {/* ========================================
          HERO
      ======================================== */}

      <section className="sh-about-hero">
        <div className="sh-about-container">
          <div className="sh-about-hero-content">
            <span className="sh-section-label">About SellaHub</span>

            <h1>
              Where businesses
              <span> meet opportunity.</span>
            </h1>

            <p>
              SellaHub is built to make it easier for businesses, sellers, and
              service providers to showcase what they offer and connect with
              people actively looking for it.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================
          INTRO
      ======================================== */}

      <section className="sh-about-intro">
        <div className="sh-about-container">
          <div className="sh-about-intro-grid">
            <div className="sh-about-intro-label">
              <span>Our purpose</span>
              <div className="sh-about-line"></div>
            </div>

            <div className="sh-about-intro-content">
              <h2>
                A better place to
                <span> be discovered.</span>
              </h2>

              <p>
                Finding the right product, service, or business shouldn't have
                to be complicated. SellaHub brings sellers and customers
                together in one accessible marketplace designed around
                discovery.
              </p>

              <p>
                From independent sellers to established businesses, the platform
                gives you the tools to create a presence, publish your
                offerings, and reach a wider audience.
              </p>

              <a href="/signup" className="sh-about-link">
                Create your account
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          VALUES
      ======================================== */}

      <section className="sh-about-values">
        <div className="sh-about-container">
          <div className="sh-about-values-header">
            <div>
              <span className="sh-section-label">What drives us</span>

              <h2>
                Built around
                <span> people.</span>
              </h2>
            </div>

            <p>
              Everything we build is focused on making marketplace discovery
              simpler, more useful, and more trustworthy.
            </p>
          </div>

          <div className="sh-about-values-grid">
            <div className="sh-about-value-card">
              <div className="sh-about-value-icon">
                <Store size={20} />
              </div>

              <span>01</span>

              <h3>Visibility</h3>

              <p>
                Give businesses and sellers a place where their products and
                services can be discovered by the right audience.
              </p>
            </div>

            <div className="sh-about-value-card">
              <div className="sh-about-value-icon">
                <Users size={20} />
              </div>

              <span>02</span>

              <h3>Connection</h3>

              <p>
                Make it easier for buyers and businesses to find each other and
                start meaningful conversations.
              </p>
            </div>

            <div className="sh-about-value-card">
              <div className="sh-about-value-icon">
                <BadgeCheck size={20} />
              </div>

              <span>03</span>

              <h3>Trust</h3>

              <p>
                Create a marketplace experience where quality, transparency, and
                responsible listings matter.
              </p>
            </div>

            <div className="sh-about-value-card">
              <div className="sh-about-value-icon">
                <Handshake size={20} />
              </div>

              <span>04</span>

              <h3>Opportunity</h3>

              <p>
                Help businesses of different sizes get the exposure and
                opportunities they need to grow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          MARKETPLACE STATEMENT
      ======================================== */}

      <section className="sh-about-statement">
        <div className="sh-about-container">
          <div className="sh-about-statement-inner">
            <div className="sh-about-statement-icon">
              <Globe2 size={22} strokeWidth={1.6} />
            </div>

            <span className="sh-section-label">The SellaHub vision</span>

            <h2>
              More than a listing.
              <br />
              <span>A place to grow.</span>
            </h2>

            <p>
              We believe every business has something worth discovering.
              SellaHub is creating the infrastructure to make that discovery
              easier.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================
          CTA
      ======================================== */}

      <section className="sh-about-cta">
        <div className="sh-about-container">
          <div className="sh-about-cta-inner">
            <div>
              <span className="sh-section-label">Join SellaHub</span>

              <h2>
                Ready to get
                <span> discovered?</span>
              </h2>
            </div>

            <a href="/signup" className="sh-about-cta-button">
              Start selling
              <ArrowRight size={17} />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;
