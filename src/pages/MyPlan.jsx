import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  Crown,
  Loader2,
  Package,
  Sparkles,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PLAN_LIMITS = {
  Basic: 1,
  Standard: 5,
  Premium: 15,
};

const PLAN_ICONS = {
  Basic: BadgeCheck,
  Standard: Sparkles,
  Premium: Crown,
};

export default function MyPlan() {
  const [plan, setPlan] = useState(null);
  const [usage, setUsage] = useState({
    total: 0,
    published: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyPlan = async () => {
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
          setError("You must be logged in to view your plan.");
          return;
        }

        /*
      ========================================
      USER PLAN
      ========================================
      */

        const { data: userPlanData, error: planError } = await supabase
          .from("user_plans")
          .select(
            `
    *,
    pricing_plans (*)
  `
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (planError) {
          throw planError;
        }

        if (!userPlanData) {
          setPlan(null);

          setUsage({
            total: 0,
            published: 0,
          });

          return;
        }

        const allowed = Number(userPlanData.listings_allowed);

        let planDetails;

        if (allowed === 1) {
          planDetails = {
            name: "Basic",
            description:
              "A simple way to get your products or services discovered.",
            price: "₦5,000",
            period: "/ listing",
            listingsAllowed: 1,
          };
        } else if (allowed === 5) {
          planDetails = {
            name: "Standard",
            description:
              "More visibility and better exposure for growing businesses.",
            price: "₦12,000",
            period: "/ listing",
            listingsAllowed: 5,
          };
        } else if (allowed === 15) {
          planDetails = {
            name: "Premium",
            description: "Maximum exposure for businesses ready to stand out.",
            price: "₦25,000",
            period: "/ listing",
            listingsAllowed: 15,
          };
        } else {
          planDetails = {
            name: "Unknown",
            description: "Your current SellaHub plan.",
            price: "—",
            period: "",
            listingsAllowed: allowed,
          };
        }

        /*
      ========================================
      LISTING USAGE
      ========================================
      */

        const { data: listings, error: listingsError } = await supabase
          .from("listings")
          .select("id, status")
          .eq("user_id", user.id);

        if (listingsError) {
          throw listingsError;
        }

        const total = listings?.length || 0;

        const published =
          listings?.filter((listing) => listing.status === "published")
            .length || 0;

        /*
      ========================================
      FINAL PLAN OBJECT
      ========================================
      */

        setPlan({
          ...userPlanData,
          plan: planDetails,
        });

        setUsage({
          total,
          published,
        });
      } catch (err) {
        console.error("My plan error:", err);

        setError(err?.message || "Unable to load your current plan.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyPlan();
  }, []);

  /*
  ========================================
  LOADING
  ========================================
  */

  if (loading) {
    return (
      <main className="sh-plan-page">
        <div className="sh-plan-container">
          <Link to="/dashboard" className="sh-plan-back">
            <ArrowLeft size={16} />
            Return to Dashboard
          </Link>

          <div className="sh-plan-loading">
            <Loader2 size={22} className="sh-plan-spinner" />

            <h2>Loading your plan...</h2>

            <p>We're checking your current membership and usage.</p>
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
      <main className="sh-plan-page">
        <div className="sh-plan-container">
          <Link to="/dashboard" className="sh-plan-back">
            <ArrowLeft size={16} />
            Return to Dashboard
          </Link>

          <div className="sh-plan-error">
            <div className="sh-plan-error-icon">
              <CreditCard size={22} />
            </div>

            <h2>Unable to load your plan</h2>

            <p>{error}</p>

            <Link to="/dashboard" className="sh-plan-primary-button">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /*
  ========================================
  NO PLAN
  ========================================
  */

  if (!plan) {
    return (
      <main className="sh-plan-page">
        <div className="sh-plan-container">
          <Link to="/dashboard" className="sh-plan-back">
            <ArrowLeft size={16} />
            Return to Dashboard
          </Link>

          <div className="sh-plan-header">
            <span className="sh-plan-label">Membership</span>

            <h1>My plan</h1>

            <p>
              Manage your SellaHub listing plan and see your current marketplace
              usage.
            </p>
          </div>

          <div className="sh-plan-empty">
            <div className="sh-plan-empty-icon">
              <CreditCard size={23} />
            </div>

            <h2>No active plan</h2>

            <p>
              Choose a listing plan to start publishing your products or
              services on SellaHub.
            </p>

            <Link to="/dashboard/plans" className="sh-plan-primary-button">
              View pricing
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /*
========================================
PLAN DATA
========================================
*/

  /*
========================================
PLAN DATA
========================================
*/

  const planData = plan?.pricing_plans || {};

  const planName = planData.name || "No Plan";

  const PlanIcon = PLAN_ICONS[planName] || BadgeCheck;

  const description =
    planData.description || "Your current SellaHub marketplace plan.";

  const price = planData.price
    ? `₦${Number(planData.price).toLocaleString()}`
    : "₦0";

  const period = "/ listing";

  const features = Array.isArray(planData.features) ? planData.features : [];

  const listingLimit = Number(
    planData.max_listings || plan.listings_allowed || 0
  );

  const remaining = Math.max(listingLimit - usage.total, 0);

  const usagePercentage =
    listingLimit > 0 ? Math.min((usage.total / listingLimit) * 100, 100) : 0;

  /*
========================================
DATES
========================================
*/

  const startDate = plan?.started_at || plan?.start_date || plan?.created_at;

  const endDate = plan?.expires_at || plan?.end_date || plan?.expiry_date;

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };
  /*
  ========================================
  STATUS
  ========================================
  */

  const status = plan.status || "active";

  const isActive =
    status === "active" || status === "published" || status === "paid";

  return (
    <main className="sh-plan-page">
      <div className="sh-plan-container">
        {/* ========================================
            BACK
        ======================================== */}

        <Link to="/dashboard" className="sh-plan-back">
          <ArrowLeft size={16} />
          Return to Dashboard
        </Link>

        {/* ========================================
            HEADER
        ======================================== */}

        <div className="sh-plan-header">
          <span className="sh-plan-label">Membership</span>

          <h1>My plan</h1>

          <p>
            Manage your SellaHub listing plan and monitor your marketplace
            usage.
          </p>
        </div>

        {/* ========================================
            MAIN PLAN CARD
        ======================================== */}

        <section className="sh-plan-card">
          <div className="sh-plan-card-top">
            <div className="sh-plan-icon">
              <PlanIcon size={25} />
            </div>

            <div className="sh-plan-card-heading">
              <div className="sh-plan-name-row">
                <h2>{planName}</h2>

                <span
                  className={`sh-plan-status ${
                    isActive
                      ? "sh-plan-status-active"
                      : "sh-plan-status-inactive"
                  }`}
                >
                  <span></span>
                  {isActive ? "Active" : status}
                </span>
              </div>

              <p>{description}</p>
            </div>
          </div>

          <div className="sh-plan-price">
            <strong>{price}</strong>

            <span>{period}</span>
          </div>

          {/* ========================================
              USAGE
          ======================================== */}

          <div className="sh-plan-usage">
            <div className="sh-plan-usage-header">
              <div>
                <span>Listing usage</span>

                <strong>
                  {usage.total} of {listingLimit}
                </strong>
              </div>

              <Package size={18} />
            </div>

            <div className="sh-plan-progress">
              <div
                className="sh-plan-progress-fill"
                style={{
                  width: `${usagePercentage}%`,
                }}
              />
            </div>

            <div className="sh-plan-usage-footer">
              <span>
                {remaining} listing
                {remaining === 1 ? "" : "s"} remaining
              </span>

              <span>{usage.published} published</span>
            </div>
          </div>

          {/* ========================================
              PLAN DETAILS
          ======================================== */}

          <div className="sh-plan-details">
            <div className="sh-plan-detail">
              <CalendarDays size={17} />

              <div>
                <span>Started</span>
                <strong>{formatDate(startDate)}</strong>
              </div>
            </div>

            <div className="sh-plan-detail">
              <CalendarDays size={17} />

              <div>
                <span>Expires</span>
                <strong>{formatDate(endDate)}</strong>
              </div>
            </div>

            <div className="sh-plan-detail">
              <Package size={17} />

              <div>
                <span>Listings</span>
                <strong>{listingLimit} allowed</strong>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================
            FEATURES
        ======================================== */}

        <section className="sh-plan-features-card">
          <div className="sh-plan-section-heading">
            <div>
              <span>Included</span>

              <h2>Plan features</h2>
            </div>
          </div>

          {features.length > 0 ? (
            <div className="sh-plan-features">
              {features.map((feature, index) => (
                <div key={index} className="sh-plan-feature">
                  <BadgeCheck size={16} />

                  <span>{feature}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="sh-plan-no-features">
              <p>Your plan features will appear here.</p>
            </div>
          )}
        </section>

        {/* ========================================
            ACTIONS
        ======================================== */}

        <section className="sh-plan-actions">
          <div>
            <span>Need more exposure?</span>

            <h2>Upgrade your plan</h2>

            <p>
              Get more active listings and better visibility across the
              marketplace.
            </p>
          </div>

          <Link to="/dashboard/plans" className="sh-plan-upgrade">
            View plans
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </main>
  );
}
