import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Crown,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const PLAN_LEVELS = {
  Basic: 1,
  Standard: 2,
  Premium: 3,
};

const PLAN_ICONS = {
  Basic: BadgeCheck,
  Standard: Sparkles,
  Premium: Crown,
};

export default function Checkout() {
  const { planId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);

  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState("");

  /*
  ========================================
  LOAD CHECKOUT
  ========================================
  */

  useEffect(() => {
    const fetchCheckout = async () => {
      try {
        setLoading(true);
        setError("");

        /*
        ========================================
        CURRENT USER
        ========================================
        */

        const {
          data: { user: authUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!authUser) {
          navigate("/login");
          return;
        }

        setUser(authUser);

        /*
        ========================================
        SELECTED PLAN
        ========================================
        */

        const { data: selectedPlan, error: selectedPlanError } = await supabase
          .from("pricing_plans")
          .select("*")
          .eq("id", planId)
          .eq("is_active", true)
          .single();

        if (selectedPlanError) {
          throw selectedPlanError;
        }

        if (!selectedPlan) {
          throw new Error("Plan not found.");
        }

        setPlan(selectedPlan);

        /*
        ========================================
        CURRENT USER PLAN
        ========================================
        */

        const { data: activePlan, error: activePlanError } = await supabase
          .from("user_plans")
          .select(
            `
                id,
                plan_id,
                status,
                listings_allowed,
                listings_used
              `
          )
          .eq("user_id", authUser.id)
          .eq("status", "active")
          .maybeSingle();

        if (activePlanError) {
          throw activePlanError;
        }

        if (activePlan) {
          /*
          ========================================
          GET CURRENT PLAN DETAILS
          ========================================
          */

          const { data: currentPlanData, error: currentPlanError } =
            await supabase
              .from("pricing_plans")
              .select("*")
              .eq("id", activePlan.plan_id)
              .maybeSingle();

          if (currentPlanError) {
            throw currentPlanError;
          }

          setCurrentPlan({
            ...activePlan,
            plan: currentPlanData,
          });
        }
      } catch (err) {
        console.error("Checkout loading error:", err);
        setError("Unable to load checkout.");
      } finally {
        setLoading(false);
      }
    };

    if (planId) {
      fetchCheckout();
    }
  }, [planId, navigate]);

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

  const getFeatures = (selectedPlan) => {
    if (Array.isArray(selectedPlan?.features)) {
      return selectedPlan.features;
    }

    if (typeof selectedPlan?.features === "string") {
      try {
        const parsed = JSON.parse(selectedPlan.features);

        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        return selectedPlan.features
          .split(",")
          .map((feature) => feature.trim())
          .filter(Boolean);
      }
    }

    return [];
  };

  /*
  ========================================
  PLAN STATUS
  ========================================
  */

  const selectedPlanName = plan?.name || "";

  const currentPlanName = currentPlan?.plan?.name || "";

  const selectedLevel = PLAN_LEVELS[selectedPlanName] || 0;

  const currentLevel = PLAN_LEVELS[currentPlanName] || 0;

  const isCurrent = currentPlan?.plan_id === plan?.id;

  const isUpgrade = !isCurrent && selectedLevel > currentLevel;

  const isDowngrade =
    !isCurrent && currentLevel > 0 && selectedLevel < currentLevel;

  const features = getFeatures(plan);

  const PlanIcon = PLAN_ICONS[selectedPlanName] || ShieldCheck;

  /*
  ========================================
  PAYMENT
  ========================================
  */

  const handlePayment = async () => {
    try {
      setPaymentLoading(true);
      setError("");

      if (!user) {
        setError("You must be logged in to continue.");
        return;
      }

      if (!plan) {
        setError("Selected plan could not be found.");
        return;
      }

      if (isCurrent) {
        setError("You are already on this plan.");
        return;
      }

      /*
      ========================================
      DOWNGRADE
      ========================================
      */

      if (isDowngrade) {
        setError("Downgrades are not available through checkout yet.");
        return;
      }

      /*
      ========================================
      INITIALIZE PAYSTACK
      ========================================
      */

      const response = await fetch("/api/initialize-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: plan.id,
          userId: user.id,
          email: user.email,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to initialize payment.");
      }

      /*
      ========================================
      REDIRECT TO PAYSTACK
      ========================================
      */

      if (result.authorization_url) {
        window.location.href = result.authorization_url;
        return;
      }

      throw new Error("Payment URL was not returned.");
    } catch (err) {
      console.error("Payment initialization error:", err);

      setError(err.message || "Unable to start payment. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  /*
  ========================================
  LOADING
  ========================================
  */

  if (loading) {
    return (
      <main className="sh-checkout-page">
        <div className="sh-checkout-container">
          <Link to="/dashboard/plans" className="sh-checkout-back">
            <ArrowLeft size={17} />
            Back to plans
          </Link>

          <div className="sh-checkout-loading">
            <LoaderCircle size={28} className="sh-checkout-spinner" />

            <h2>Loading checkout...</h2>

            <p>Preparing your selected SellaHub plan.</p>
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

  if (error && !plan) {
    return (
      <main className="sh-checkout-page">
        <div className="sh-checkout-container">
          <Link to="/dashboard/plans" className="sh-checkout-back">
            <ArrowLeft size={17} />
            Back to plans
          </Link>

          <div className="sh-checkout-error">
            <div className="sh-checkout-error-icon">
              <ShieldCheck size={22} />
            </div>

            <h2>Unable to load checkout</h2>

            <p>{error}</p>

            <Link to="/dashboard/plans" className="sh-checkout-error-button">
              Return to plans
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="sh-checkout-page">
      <div className="sh-checkout-container">
        {/* ========================================
            TOP
        ======================================== */}

        <div className="sh-checkout-top">
          <Link to="/dashboard/plans" className="sh-checkout-back">
            <ArrowLeft size={17} />
            Back to plans
          </Link>
        </div>

        {/* ========================================
            HEADER
        ======================================== */}

        <header className="sh-checkout-header">
          <span className="sh-checkout-label">Secure checkout</span>

          <h1>
            {isUpgrade
              ? "Upgrade your plan"
              : isDowngrade
              ? "Change your plan"
              : "Choose your plan"}
          </h1>

          <p>Review your plan before continuing to secure payment.</p>
        </header>

        {/* ========================================
            CHECKOUT GRID
        ======================================== */}

        <div className="sh-checkout-grid">
          {/* ========================================
              PLAN
          ======================================== */}

          <section className="sh-checkout-card">
            <div className="sh-checkout-plan-top">
              <div className="sh-checkout-plan-icon">
                <PlanIcon size={25} />
              </div>

              <div>
                <span className="sh-checkout-small-label">Selected plan</span>

                <h2>{selectedPlanName}</h2>
              </div>
            </div>

            <p className="sh-checkout-description">
              {plan?.description || "A marketplace plan designed for sellers."}
            </p>

            <div className="sh-checkout-price">
              <strong>{formatPrice(plan?.price)}</strong>

              <span>{plan?.period || "/ plan"}</span>
            </div>

            <div className="sh-checkout-divider" />

            <div className="sh-checkout-features">
              <span className="sh-checkout-feature-title">
                Your plan includes
              </span>

              {features.length > 0 ? (
                <ul>
                  {features.map((feature, index) => (
                    <li key={index}>
                      <span>
                        <Check size={14} />
                      </span>

                      {feature}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Plan features will appear here.</p>
              )}
            </div>
          </section>

          {/* ========================================
              ORDER SUMMARY
          ======================================== */}

          <section className="sh-checkout-summary">
            <div className="sh-checkout-summary-header">
              <div>
                <span className="sh-checkout-small-label">Order summary</span>

                <h2>{selectedPlanName} plan</h2>
              </div>

              <PlanIcon size={21} />
            </div>

            {currentPlan && (
              <div className="sh-checkout-change">
                <span>Current plan</span>

                <strong>{currentPlanName}</strong>
              </div>
            )}

            <div className="sh-checkout-summary-row">
              <span>Plan</span>

              <strong>{selectedPlanName}</strong>
            </div>

            <div className="sh-checkout-summary-row">
              <span>Listings allowed</span>

              <strong>{plan?.max_listings ?? 0}</strong>
            </div>

            <div className="sh-checkout-summary-total">
              <span>Total</span>

              <strong>{formatPrice(plan?.price)}</strong>
            </div>

            {error && <div className="sh-checkout-message">{error}</div>}

            {isCurrent ? (
              <button
                type="button"
                disabled
                className="sh-checkout-button sh-checkout-button-disabled"
              >
                <Check size={17} />
                Current plan
              </button>
            ) : isDowngrade ? (
              <button
                type="button"
                className="sh-checkout-button sh-checkout-button-disabled"
                disabled
              >
                Downgrade unavailable
              </button>
            ) : (
              <button
                type="button"
                className="sh-checkout-button"
                onClick={handlePayment}
                disabled={paymentLoading}
              >
                {paymentLoading ? (
                  <>
                    <LoaderCircle size={17} className="sh-checkout-spinner" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={17} />
                    Continue to secure payment
                  </>
                )}
              </button>
            )}

            <div className="sh-checkout-secure">
              <ShieldCheck size={17} />

              <p>
                Payments are securely processed by Paystack. Your plan is
                activated only after successful payment confirmation.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
