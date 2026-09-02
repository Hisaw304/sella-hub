import PricingPlans from "../components/PricingPlans";

const Pricing = () => {
  return (
    <main className="sh-pricing-page">
      {/* ========================================
          HERO
      ======================================== */}

      <section className="sh-pricing-hero">
        <div className="sh-pricing-container">
          <div className="sh-pricing-hero-content">
            <span className="sh-section-label">SellaHub Plans</span>

            <h1>
              Choose the plan
              <span> that works for you.</span>
            </h1>

            <p>
              Get your products, services, or business in front of more people
              with a SellaHub listing plan built around your needs.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================
          PRICING PLANS
      ======================================== */}

      <section className="sh-pricing-section">
        <PricingPlans />
      </section>
    </main>
  );
};

export default Pricing;
