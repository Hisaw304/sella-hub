import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, Check, Crown, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";

const planIcons = {
  basic: BadgeCheck,
  standard: Sparkles,
  premium: Crown,
};

const PricingPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from("pricing_plans")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error) {
        console.error("Error fetching pricing plans:", error);
        setLoading(false);
        return;
      }

      setPlans(data || []);
      setLoading(false);
    };

    fetchPlans();
  }, []);

  if (loading) {
    return (
      <section className="sh-pricing">
        <div className="sh-pricing-container">
          <div className="sh-pricing-loading">Loading plans...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="sh-pricing">
      <div className="sh-pricing-container">
        {/* HEADER */}
        <div className="sh-pricing-header">
          <div className="sh-pricing-heading">
            <span className="sh-section-label">Listing plans</span>

            <h2>
              Choose how you
              <span> want to grow.</span>
            </h2>
          </div>

          <p>
            Start with the plan that fits your needs and give your products,
            services, or business the visibility it deserves.
          </p>
        </div>

        {/* PLANS */}
        <div className="sh-pricing-grid">
          {plans.map((plan) => {
            const Icon = planIcons[plan.slug] || BadgeCheck;

            return (
              <div
                className={`sh-pricing-card ${
                  plan.is_popular ? "is-popular" : ""
                }`}
                key={plan.id}
              >
                {/* POPULAR */}
                {plan.is_popular && (
                  <div className="sh-popular-badge">
                    <Sparkles size={13} />
                    Most Popular
                  </div>
                )}

                {/* TOP */}
                <div className="sh-pricing-top">
                  <div className="sh-plan-icon">
                    <Icon size={19} strokeWidth={1.8} />
                  </div>

                  <h3>{plan.name}</h3>

                  <p>{plan.description}</p>
                </div>

                {/* PRICE */}
                <div className="sh-plan-price">
                  <strong>₦{Number(plan.price).toLocaleString()}</strong>

                  <span>/ listing</span>
                </div>

                {/* BUTTON */}
                <a href="/signup" className="sh-plan-button">
                  Choose {plan.name}
                  <ArrowRight size={16} />
                </a>

                {/* FEATURES */}
                <div className="sh-plan-features">
                  <span className="sh-features-title">What's included</span>

                  <ul>
                    {Array.isArray(plan.features) &&
                      plan.features.map((feature, index) => (
                        <li key={index}>
                          <span className="sh-check">
                            <Check size={12} strokeWidth={2.5} />
                          </span>

                          {feature}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTNOTE */}
        <div className="sh-pricing-note">
          <Check size={15} />

          <span>
            All plans include secure payment, listing management, responsive
            seller tools, and access to the SellaHub marketplace.
          </span>
        </div>
      </div>
    </section>
  );
};

export default PricingPlans;
