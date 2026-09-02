import { ArrowRight, Store } from "lucide-react";

const FooterCTA = () => {
  return (
    <section className="sh-footer-cta">
      <div className="sh-footer-cta-container">
        <div className="sh-footer-cta-content">
          <div className="sh-footer-cta-icon">
            <Store size={21} strokeWidth={1.7} />
          </div>

          <span className="sh-footer-cta-label">Ready to get started?</span>

          <h2>
            Put your business
            <span> on the map.</span>
          </h2>

          <p>
            Create your listing, reach new customers, and give your business the
            visibility it deserves on SellaHub.
          </p>

          <div className="sh-footer-cta-actions">
            <a href="/signup" className="sh-footer-cta-primary">
              Start selling
              <ArrowRight size={17} />
            </a>

            <a href="/browse" className="sh-footer-cta-secondary">
              Browse listings
            </a>
          </div>
        </div>

        <div className="sh-footer-cta-bottom">
          <span>Products</span>
          <span>Services</span>
          <span>Businesses</span>
          <span>Opportunities</span>
        </div>
      </div>
    </section>
  );
};

export default FooterCTA;
