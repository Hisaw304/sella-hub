import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Crown,
  LoaderCircle,
  Package,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const PLAN_ICONS = {
  Basic: BadgeCheck,
  Standard: Sparkles,
  Premium: Crown,
};

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError("");

        /*
        ========================================
        CURRENT USER
        ========================================
        */

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          setError("You must be logged in to view plans.");
          return;
        }

        /*
        ========================================
        PRICING PLANS
        ========================================
        */

        const { data: planData, error: planError } = await supabase
          .from("pricing_plans")
          .select("*")
          .eq("is_active", true)
          .order("price", { ascending: true });

        if (planError) {
          throw planError;
        }

        /*
        ========================================
        CURRENT USER PLAN
        ========================================
        */

        const { data: userPlan, error: userPlanError } = await supabase
          .from("user_plans")
          .select("id, plan_id, status")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        if (userPlanError) {
          throw userPlanError;
        }

        setPlans(planData || []);
        setCurrentPlanId(userPlan?.plan_id || null);
      } catch (err) {
        console.error("Plans loading error:", err);
        setError("Unable to load available plans.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  /*
  ========================================
  HELPERS
  ========================================
  */

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === "") {
      return "₦0";
    }

    return `₦${Number(price).toLocaleString("en-NG")}`;
  };

  const getFeatures = (plan) => {
    if (Array.isArray(plan.features)) {
      return plan.features;
    }

    if (typeof plan.features === "string") {
      try {
        const parsed = JSON.parse(plan.features);

        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        return plan.features
          .split(",")
          .map((feature) => feature.trim())
          .filter(Boolean);
      }
    }

    return [];
  };

  const getPlanIcon = (name) => {
    return PLAN_ICONS[name] || ShieldCheck;
  };

  /*
  ========================================
  LOADING
  ========================================
  */

  if (loading) {
    return (
      <main className="sh-plans-page">
        <div className="sh-plans-container">
          <Link to="/dashboard" className="sh-plans-back">
            <ArrowLeft size={17} />
            Back to dashboard
          </Link>

          <div className="sh-plans-loading">
            <LoaderCircle size={28} className="sh-plans-spinner" />
            <h2>Loading plans...</h2>
            <p>Fetching the available SellaHub plans.</p>
          </div>
        </div>
      </main>
    );
  }

  /*
  ========================================
  ERROR
  ========================================
  */

  if (error) {
    return (
      <main className="sh-plans-page">
        <div className="sh-plans-container">
          <Link to="/dashboard" className="sh-plans-back">
            <ArrowLeft size={17} />
            Back to dashboard
          </Link>

          <div className="sh-plans-error">
            <div className="sh-plans-error-icon">
              <ShieldCheck size={22} />
            </div>

            <h2>Unable to load plans</h2>
            <p>{error}</p>

            <button
              type="button"
              className="sh-plans-retry"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="sh-plans-page">
      <div className="sh-plans-container">
        {/* ========================================
            TOP
        ======================================== */}

        <div className="sh-plans-top">
          <Link to="/dashboard" className="sh-plans-back">
            <ArrowLeft size={17} />
            Back to dashboard
          </Link>
        </div>

        {/* ========================================
            HEADER
        ======================================== */}

        <header className="sh-plans-header">
          <span className="sh-plans-label">Marketplace plans</span>

          <h1>Choose the plan that fits your business.</h1>

          <p>
            Select a plan that gives your listings the visibility and tools you
            need to grow on SellaHub.
          </p>
        </header>

        {/* ========================================
            PLANS
        ======================================== */}

        {plans.length === 0 ? (
          <div className="sh-plans-empty">
            <Package size={24} />

            <h2>No plans available</h2>

            <p>There are currently no active marketplace plans available.</p>
          </div>
        ) : (
          <div className="sh-plans-grid">
            {plans.map((plan) => {
              const planName = plan.name || "Plan";
              const PlanIcon = getPlanIcon(planName);
              const features = getFeatures(plan);

              const isCurrent = currentPlanId === plan.id;

              const PLAN_LEVELS = {
                Basic: 1,
                Standard: 2,
                Premium: 3,
              };

              const currentPlan = plans.find(
                (item) => item.id === currentPlanId
              );

              const currentPlanName = currentPlan?.name || null;

              const currentLevel = PLAN_LEVELS[currentPlanName] || 0;
              const planLevel = PLAN_LEVELS[planName] || 0;

              const isUpgrade = planLevel > currentLevel;
              const isDowngrade = planLevel < currentLevel;

              return (
                <article
                  key={plan.id}
                  className={`sh-plan-option ${
                    isCurrent ? "sh-plan-option-current" : ""
                  }`}
                >
                  {isCurrent && (
                    <div className="sh-plan-current-badge">
                      <Check size={13} />
                      Current plan
                    </div>
                  )}

                  <div className="sh-plan-option-icon">
                    <PlanIcon size={23} />
                  </div>

                  <div className="sh-plan-option-heading">
                    <h2>{planName}</h2>

                    <p>
                      {plan.description ||
                        "A marketplace plan designed for sellers."}
                    </p>
                  </div>

                  <div className="sh-plan-option-price">
                    <strong>{formatPrice(plan.price)}</strong>

                    <span>
                      {plan.period ||
                        (planName === "Basic" ? "/ listing" : "/ plan")}
                    </span>
                  </div>

                  <div className="sh-plan-option-limit">
                    <Package size={17} />

                    <span>
                      Up to <strong>{plan.max_listings ?? 0}</strong> active
                      listing
                      {Number(plan.max_listings) === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="sh-plan-option-divider" />

                  <div className="sh-plan-option-features">
                    <span className="sh-plan-feature-title">Plan includes</span>

                    {features.length > 0 ? (
                      <ul>
                        {features.map((feature, index) => (
                          <li key={`${plan.id}-${index}`}>
                            <span>
                              <Check size={14} />
                            </span>

                            {feature}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="sh-plan-no-features">
                        Plan features will appear here.
                      </p>
                    )}
                  </div>

                  {/* ========================================
                      PAYMENT BUTTON
                  ======================================== */}

                  {/* ========================================
    PLAN ACTION
======================================== */}

                  {isCurrent ? (
                    <button
                      type="button"
                      className="sh-plan-option-button sh-plan-option-button-current"
                      disabled
                    >
                      <Check size={17} />
                      Current plan
                    </button>
                  ) : (
                    <Link
                      to={`/dashboard/checkout/${plan.id}`}
                      className={`sh-plan-option-button ${
                        isDowngrade ? "sh-plan-option-button-downgrade" : ""
                      }`}
                    >
                      {isUpgrade ? "Upgrade plan" : "Downgrade"}
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* ========================================
            FOOTER NOTE
        ======================================== */}

        <div className="sh-plans-note">
          <ShieldCheck size={17} />

          <p>
            Payments are securely processed through Paystack. Your plan will be
            activated after successful payment confirmation.
          </p>
        </div>
      </div>
    </main>
  );
}
