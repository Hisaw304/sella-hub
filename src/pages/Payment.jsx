import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  Clock3,
  XCircle,
  Receipt,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Payment() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPayments = async () => {
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
          setError("You must be logged in to view your payments.");
          return;
        }

        /*
        ========================================
        PAYMENT HISTORY
        ========================================
        */

        const { data, error: paymentsError } = await supabase
          .from("payments")
          .select(
            `
              id,
              reference,
              amount,
              currency,
              status,
              payment_method,
              paid_at,
              created_at,
              plan_id,
              pricing_plans (
                id,
                name
              )
            `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (paymentsError) {
          throw paymentsError;
        }

        setPayments(data || []);
      } catch (err) {
        console.error("Payments loading error:", err);
        setError("Unable to load your payment history.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  /*
  ========================================
  FORMAT MONEY
  ========================================
  */

  const formatAmount = (amount, currency = "NGN") => {
    if (amount === null || amount === undefined) {
      return "—";
    }

    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  /*
  ========================================
  FORMAT DATE
  ========================================
  */

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

  const getStatusIcon = (status) => {
    switch (status) {
      case "successful":
        return <CheckCircle2 size={15} />;

      case "pending":
        return <Clock3 size={15} />;

      case "failed":
      case "cancelled":
        return <XCircle size={15} />;

      default:
        return <Receipt size={15} />;
    }
  };

  return (
    <div className="sh-payment-page">
      <main className="sh-payment-container">
        {/* ========================================
            TOP
        ======================================== */}

        <div className="sh-payment-top">
          <Link to="/dashboard" className="sh-payment-back">
            <ArrowLeft size={17} />
            <span>Back to dashboard</span>
          </Link>
        </div>

        {/* ========================================
            HEADER
        ======================================== */}

        <header className="sh-payment-header">
          <div className="sh-payment-header-icon">
            <CreditCard size={23} />
          </div>

          <div>
            <span className="sh-payment-label">Account</span>

            <h1>Payment history</h1>

            <p>View your previous plan purchases and payment transactions.</p>
          </div>
        </header>

        {/* ========================================
            CONTENT
        ======================================== */}

        <section className="sh-payment-card">
          {loading ? (
            <div className="sh-payment-empty">
              <div className="sh-payment-empty-icon">
                <CreditCard size={22} />
              </div>

              <h2>Loading payments...</h2>

              <p>Fetching your payment history.</p>
            </div>
          ) : error ? (
            <div className="sh-payment-empty">
              <div className="sh-payment-empty-icon">
                <XCircle size={22} />
              </div>

              <h2>Unable to load payments</h2>

              <p>{error}</p>

              <button
                type="button"
                className="sh-payment-retry"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          ) : payments.length === 0 ? (
            <div className="sh-payment-empty">
              <div className="sh-payment-empty-icon">
                <Receipt size={22} />
              </div>

              <h2>No payments yet</h2>

              <p>
                Your payment history will appear here after you purchase a
                marketplace plan.
              </p>

              <Link to="/dashboard/plans" className="sh-payment-action">
                View plans
              </Link>
            </div>
          ) : (
            <>
              {/* ========================================
                  DESKTOP TABLE
              ======================================== */}

              <div className="sh-payment-table-wrap">
                <table className="sh-payment-table">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Reference</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>
                          <div className="sh-payment-plan">
                            <div className="sh-payment-plan-icon">
                              <CreditCard size={16} />
                            </div>

                            <strong>
                              {payment.pricing_plans?.name ||
                                "Marketplace Plan"}
                            </strong>
                          </div>
                        </td>

                        <td>
                          <span className="sh-payment-reference">
                            {payment.reference}
                          </span>
                        </td>

                        <td>
                          <strong className="sh-payment-amount">
                            {formatAmount(payment.amount, payment.currency)}
                          </strong>
                        </td>

                        <td>
                          <span className="sh-payment-method">
                            {payment.payment_method || "—"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`sh-payment-status sh-payment-status-${payment.status}`}
                          >
                            {getStatusIcon(payment.status)}

                            {payment.status}
                          </span>
                        </td>

                        <td>
                          <span className="sh-payment-date">
                            {formatDate(payment.paid_at || payment.created_at)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ========================================
                  MOBILE CARDS
              ======================================== */}

              <div className="sh-payment-mobile-list">
                {payments.map((payment) => (
                  <div className="sh-payment-mobile-item" key={payment.id}>
                    <div className="sh-payment-mobile-top">
                      <div className="sh-payment-plan">
                        <div className="sh-payment-plan-icon">
                          <CreditCard size={16} />
                        </div>

                        <div>
                          <strong>
                            {payment.pricing_plans?.name || "Marketplace Plan"}
                          </strong>

                          <span>
                            {formatDate(payment.paid_at || payment.created_at)}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`sh-payment-status sh-payment-status-${payment.status}`}
                      >
                        {getStatusIcon(payment.status)}

                        {payment.status}
                      </span>
                    </div>

                    <div className="sh-payment-mobile-details">
                      <div>
                        <span>Amount</span>

                        <strong>
                          {formatAmount(payment.amount, payment.currency)}
                        </strong>
                      </div>

                      <div>
                        <span>Reference</span>

                        <strong>{payment.reference}</strong>
                      </div>

                      <div>
                        <span>Payment method</span>

                        <strong>{payment.payment_method || "—"}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
