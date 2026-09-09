import { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  CreditCard,
  CheckCircle2,
  Clock3,
  XCircle,
  TrendingUp,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  CalendarDays,
  Hash,
  WalletCards,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
// import "./AdminTransactions.css";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "success", label: "Successful" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "all", label: "All methods" },
  { value: "paystack", label: "Paystack" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "ussd", label: "USSD" },
  { value: "bank", label: "Bank" },
];

const formatAmount = (amount, currency = "NGN") => {
  const numericAmount = Number(amount || 0);

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${currency || "NGN"} ${numericAmount.toLocaleString()}`;
  }
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const formatDateTime = (date) => {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
};

const getStatusConfig = (status) => {
  const normalized = String(status || "").toLowerCase();

  if (
    normalized === "success" ||
    normalized === "successful" ||
    normalized === "paid" ||
    normalized === "completed"
  ) {
    return {
      label: "Successful",
      className: "success",
      icon: CheckCircle2,
    };
  }

  if (normalized === "pending") {
    return {
      label: "Pending",
      className: "pending",
      icon: Clock3,
    };
  }

  if (
    normalized === "failed" ||
    normalized === "cancelled" ||
    normalized === "canceled"
  ) {
    return {
      label:
        normalized === "cancelled" || normalized === "canceled"
          ? "Cancelled"
          : "Failed",
      className: "failed",
      icon: XCircle,
    };
  }

  return {
    label: status || "Unknown",
    className: "unknown",
    icon: AlertCircle,
  };
};

const getPaymentMethodLabel = (method) => {
  if (!method) return "—";

  return String(method)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getUserDisplayName = (profile, userId) => {
  if (profile?.business_name) return profile.business_name;
  if (profile?.full_name) return profile.full_name;

  return userId ? `${userId.slice(0, 8)}...` : "Unknown user";
};

export default function AdminTransactions() {
  const [payments, setPayments] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [plans, setPlans] = useState({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const loadPayments = async ({ refresh = false } = {}) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      /*
       * =========================================
       * PAYMENTS
       * =========================================
       */

      const { data: paymentData, error: paymentsError } = await supabase
        .from("payments")
        .select(
          `
          id,
          user_id,
          plan_id,
          reference,
          amount,
          currency,
          status,
          payment_method,
          paid_at,
          created_at
        `
        )
        .order("created_at", { ascending: false });

      if (paymentsError) throw paymentsError;

      const paymentsList = paymentData || [];

      setPayments(paymentsList);

      /*
       * =========================================
       * PROFILES
       * =========================================
       */

      const userIds = [
        ...new Set(
          paymentsList.map((payment) => payment.user_id).filter(Boolean)
        ),
      ];

      if (userIds.length > 0) {
        const { data: profileData, error: profilesError } = await supabase
          .from("profiles")
          .select(
            `
            id,
            full_name,
            business_name,
            avatar_url,
            role
          `
          )
          .in("id", userIds);

        if (profilesError) {
          console.error("Profiles error:", profilesError);
        } else {
          const profileMap = {};

          (profileData || []).forEach((profile) => {
            profileMap[profile.id] = profile;
          });

          setProfiles(profileMap);
        }
      } else {
        setProfiles({});
      }

      /*
       * =========================================
       * PRICING PLANS
       * =========================================
       */

      const planIds = [
        ...new Set(
          paymentsList.map((payment) => payment.plan_id).filter(Boolean)
        ),
      ];

      if (planIds.length > 0) {
        const { data: planData, error: plansError } = await supabase
          .from("pricing_plans")
          .select(
            `
            id,
            name,
            slug,
            price,
            max_listings
          `
          )
          .in("id", planIds);

        if (plansError) {
          console.error("Plans error:", plansError);
        } else {
          const planMap = {};

          (planData || []).forEach((plan) => {
            planMap[plan.id] = plan;
          });

          setPlans(planMap);
        }
      } else {
        setPlans({});
      }
    } catch (err) {
      console.error("Admin transactions error:", err);

      setError(
        err?.message || "Unable to load transactions. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  /*
   * =========================================
   * STATS
   * =========================================
   */

  const stats = useMemo(() => {
    const successfulPayments = payments.filter((payment) => {
      const status = String(payment.status || "").toLowerCase();

      return (
        status === "success" ||
        status === "successful" ||
        status === "paid" ||
        status === "completed"
      );
    });

    const pendingPayments = payments.filter((payment) => {
      return String(payment.status || "").toLowerCase() === "pending";
    });

    const failedPayments = payments.filter((payment) => {
      const status = String(payment.status || "").toLowerCase();

      return (
        status === "failed" || status === "cancelled" || status === "canceled"
      );
    });

    const revenue = successfulPayments.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    );

    return {
      total: payments.length,
      successful: successfulPayments.length,
      pending: pendingPayments.length,
      failed: failedPayments.length,
      revenue,
    };
  }, [payments]);

  /*
   * =========================================
   * FILTERING
   * =========================================
   */

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    let result = payments.filter((payment) => {
      const profile = profiles[payment.user_id];
      const plan = plans[payment.plan_id];

      const userName = getUserDisplayName(profile, payment.user_id);

      const reference = String(payment.reference || "").toLowerCase();

      const paymentMethod = String(payment.payment_method || "").toLowerCase();

      const planName = String(plan?.name || "").toLowerCase();

      const matchesSearch =
        !query ||
        reference.includes(query) ||
        userName.toLowerCase().includes(query) ||
        paymentMethod.includes(query) ||
        planName.includes(query);

      const normalizedStatus = String(payment.status || "").toLowerCase();

      let matchesStatus = true;

      if (statusFilter !== "all") {
        if (statusFilter === "success") {
          matchesStatus =
            normalizedStatus === "success" ||
            normalizedStatus === "successful" ||
            normalizedStatus === "paid" ||
            normalizedStatus === "completed";
        }

        if (statusFilter === "pending") {
          matchesStatus = normalizedStatus === "pending";
        }

        if (statusFilter === "failed") {
          matchesStatus =
            normalizedStatus === "failed" ||
            normalizedStatus === "cancelled" ||
            normalizedStatus === "canceled";
        }
      }

      const normalizedMethod = String(
        payment.payment_method || ""
      ).toLowerCase();

      const matchesMethod =
        methodFilter === "all" || normalizedMethod === methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });

    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();

      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [
    payments,
    profiles,
    plans,
    search,
    statusFilter,
    methodFilter,
    sortOrder,
  ]);

  /*
   * =========================================
   * PAGINATION
   * =========================================
   */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPayments.length / PAGE_SIZE)
  );

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;

    return filteredPayments.slice(start, start + PAGE_SIZE);
  }, [filteredPayments, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, methodFilter, sortOrder]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /*
   * =========================================
   * HELPERS
   * =========================================
   */

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setMethodFilter("all");
    setSortOrder("newest");
    setCurrentPage(1);
  };

  const hasFilters = search || statusFilter !== "all" || methodFilter !== "all";

  /*
   * =========================================
   * LOADING
   * =========================================
   */

  if (loading) {
    return (
      <div className="sh-admin-transactions">
        <div className="sh-admin-transactions-loading">
          <div className="sh-admin-transactions-spinner" />
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sh-admin-transactions">
      <div className="sh-admin-transactions-container">
        {/* =====================================
            HEADER
        ====================================== */}

        <div className="sh-admin-transactions-header">
          <div>
            <span className="sh-admin-transactions-eyebrow">
              PAYMENT MANAGEMENT
            </span>

            <h1>Transactions</h1>

            <p>
              Monitor payments, subscription purchases, and marketplace revenue.
            </p>
          </div>

          <button
            type="button"
            className="sh-admin-transactions-refresh"
            onClick={() => loadPayments({ refresh: true })}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? "sh-admin-transactions-refresh-icon spinning" : ""
              }
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* =====================================
            ERROR
        ====================================== */}

        {error && (
          <div className="sh-admin-transactions-error">
            <AlertCircle size={18} />

            <div>
              <strong>Unable to load transactions</strong>
              <span>{error}</span>
            </div>

            <button type="button" onClick={() => loadPayments()}>
              Try again
            </button>
          </div>
        )}

        {/* =====================================
            STATS
        ====================================== */}

        <div className="sh-admin-transactions-stats">
          <div className="sh-admin-transaction-stat">
            <div className="sh-admin-transaction-stat-icon">
              <CreditCard size={19} />
            </div>

            <div>
              <span>Total Payments</span>
              <strong>{stats.total.toLocaleString()}</strong>
            </div>
          </div>

          <div className="sh-admin-transaction-stat">
            <div className="sh-admin-transaction-stat-icon success">
              <CheckCircle2 size={19} />
            </div>

            <div>
              <span>Successful</span>
              <strong>{stats.successful.toLocaleString()}</strong>
            </div>
          </div>

          <div className="sh-admin-transaction-stat">
            <div className="sh-admin-transaction-stat-icon pending">
              <Clock3 size={19} />
            </div>

            <div>
              <span>Pending</span>
              <strong>{stats.pending.toLocaleString()}</strong>
            </div>
          </div>

          <div className="sh-admin-transaction-stat">
            <div className="sh-admin-transaction-stat-icon failed">
              <XCircle size={19} />
            </div>

            <div>
              <span>Failed</span>
              <strong>{stats.failed.toLocaleString()}</strong>
            </div>
          </div>

          <div className="sh-admin-transaction-stat revenue">
            <div className="sh-admin-transaction-stat-icon revenue">
              <TrendingUp size={19} />
            </div>

            <div>
              <span>Total Revenue</span>
              <strong>₦{stats.revenue.toLocaleString("en-NG")}</strong>
            </div>
          </div>
        </div>

        {/* =====================================
            TOOLBAR
        ====================================== */}

        <div className="sh-admin-transactions-toolbar">
          <div className="sh-admin-transactions-search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search reference, user or plan..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {search && (
              <button
                type="button"
                className="sh-admin-transactions-search-clear"
                onClick={() => setSearch("")}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="sh-admin-transactions-filters">
            <div className="sh-admin-transaction-filter">
              <SlidersHorizontal size={15} />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sh-admin-transaction-filter">
              <WalletCards size={15} />

              <select
                value={methodFilter}
                onChange={(event) => setMethodFilter(event.target.value)}
              >
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sh-admin-transaction-filter">
              <CalendarDays size={15} />

              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>
        </div>

        {/* =====================================
            RESULTS META
        ====================================== */}

        <div className="sh-admin-transactions-results-meta">
          <span>
            Showing{" "}
            <strong>
              {filteredPayments.length === 0
                ? 0
                : (currentPage - 1) * PAGE_SIZE + 1}
            </strong>{" "}
            –{" "}
            <strong>
              {Math.min(currentPage * PAGE_SIZE, filteredPayments.length)}
            </strong>{" "}
            of <strong>{filteredPayments.length}</strong> transactions
          </span>

          {hasFilters && (
            <button type="button" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        {/* =====================================
            TABLE
        ====================================== */}

        <div className="sh-admin-transactions-card">
          {paginatedPayments.length === 0 ? (
            <div className="sh-admin-transactions-empty">
              <div className="sh-admin-transactions-empty-icon">
                <CreditCard size={28} />
              </div>

              <h3>No transactions found</h3>

              <p>
                {hasFilters
                  ? "Try adjusting your search or filters."
                  : "There are no payment transactions yet."}
              </p>

              {hasFilters && (
                <button type="button" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="sh-admin-transactions-table-wrap">
              <table className="sh-admin-transactions-table">
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {paginatedPayments.map((payment) => {
                    const profile = profiles[payment.user_id];

                    const plan = plans[payment.plan_id];

                    const status = getStatusConfig(payment.status);

                    const StatusIcon = status.icon;

                    return (
                      <tr key={payment.id}>
                        {/* TRANSACTION */}

                        <td>
                          <div className="sh-admin-transaction-reference">
                            <div className="sh-admin-transaction-reference-icon">
                              <Hash size={14} />
                            </div>

                            <div>
                              <strong>
                                {payment.reference ||
                                  `${payment.id.slice(0, 12)}...`}
                              </strong>

                              <span>ID: {payment.id.slice(0, 8)}</span>
                            </div>
                          </div>
                        </td>

                        {/* USER */}

                        <td>
                          <div className="sh-admin-transaction-user">
                            <div className="sh-admin-transaction-avatar">
                              {profile?.avatar_url ? (
                                <img
                                  src={profile.avatar_url}
                                  alt={getUserDisplayName(
                                    profile,
                                    payment.user_id
                                  )}
                                />
                              ) : (
                                <User size={16} />
                              )}
                            </div>

                            <div>
                              <strong>
                                {getUserDisplayName(profile, payment.user_id)}
                              </strong>

                              <span>
                                {profile?.role === "admin" ? "Admin" : "User"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* PLAN */}

                        <td>
                          <div className="sh-admin-transaction-plan">
                            <strong>{plan?.name || "Unknown plan"}</strong>

                            {plan?.max_listings && (
                              <span>{plan.max_listings} listings</span>
                            )}
                          </div>
                        </td>

                        {/* AMOUNT */}

                        <td>
                          <strong className="sh-admin-transaction-amount">
                            {formatAmount(payment.amount, payment.currency)}
                          </strong>
                        </td>

                        {/* METHOD */}

                        <td>
                          <span className="sh-admin-transaction-method">
                            {getPaymentMethodLabel(payment.payment_method)}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td>
                          <span
                            className={`sh-admin-transaction-status ${status.className}`}
                          >
                            <StatusIcon size={13} />
                            {status.label}
                          </span>
                        </td>

                        {/* DATE */}

                        <td>
                          <div className="sh-admin-transaction-date">
                            <strong>{formatDate(payment.created_at)}</strong>

                            <span>
                              {new Date(payment.created_at).toLocaleTimeString(
                                "en-NG",
                                {
                                  hour: "numeric",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        </td>

                        {/* ACTION */}

                        <td>
                          <button
                            type="button"
                            className="sh-admin-transaction-view"
                            onClick={() => setSelectedPayment(payment)}
                            title="View transaction"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* =====================================
            PAGINATION
        ====================================== */}

        {filteredPayments.length > PAGE_SIZE && (
          <div className="sh-admin-transactions-pagination">
            <span>
              Page {currentPage} of {totalPages}
            </span>

            <div>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => page - 1)}
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => page + 1)}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =======================================
          TRANSACTION DETAILS MODAL
      ======================================== */}

      {selectedPayment && (
        <div
          className="sh-admin-transaction-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedPayment(null);
            }
          }}
        >
          <div className="sh-admin-transaction-modal">
            <div className="sh-admin-transaction-modal-header">
              <div>
                <span>PAYMENT DETAILS</span>

                <h2>Transaction Details</h2>
              </div>

              <button type="button" onClick={() => setSelectedPayment(null)}>
                <X size={18} />
              </button>
            </div>

            {(() => {
              const profile = profiles[selectedPayment.user_id];

              const plan = plans[selectedPayment.plan_id];

              const status = getStatusConfig(selectedPayment.status);

              const StatusIcon = status.icon;

              return (
                <div className="sh-admin-transaction-modal-body">
                  {/* AMOUNT */}

                  <div className="sh-admin-transaction-modal-amount">
                    <span>Amount Paid</span>

                    <strong>
                      {formatAmount(
                        selectedPayment.amount,
                        selectedPayment.currency
                      )}
                    </strong>

                    <span
                      className={`sh-admin-transaction-status ${status.className}`}
                    >
                      <StatusIcon size={13} />
                      {status.label}
                    </span>
                  </div>

                  {/* DETAILS */}

                  <div className="sh-admin-transaction-details-grid">
                    <div>
                      <span>Reference</span>
                      <strong>{selectedPayment.reference || "—"}</strong>
                    </div>

                    <div>
                      <span>Payment Method</span>
                      <strong>
                        {getPaymentMethodLabel(selectedPayment.payment_method)}
                      </strong>
                    </div>

                    <div>
                      <span>Currency</span>
                      <strong>{selectedPayment.currency || "NGN"}</strong>
                    </div>

                    <div>
                      <span>Plan</span>
                      <strong>{plan?.name || "Unknown plan"}</strong>
                    </div>

                    <div>
                      <span>Created</span>
                      <strong>
                        {formatDateTime(selectedPayment.created_at)}
                      </strong>
                    </div>

                    <div>
                      <span>Paid At</span>
                      <strong>{formatDateTime(selectedPayment.paid_at)}</strong>
                    </div>
                  </div>

                  {/* USER */}

                  <div className="sh-admin-transaction-modal-section">
                    <div className="sh-admin-transaction-modal-section-title">
                      <User size={16} />
                      Customer
                    </div>

                    <div className="sh-admin-transaction-modal-user">
                      <div className="sh-admin-transaction-avatar large">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={getUserDisplayName(
                              profile,
                              selectedPayment.user_id
                            )}
                          />
                        ) : (
                          <User size={18} />
                        )}
                      </div>

                      <div>
                        <strong>
                          {getUserDisplayName(profile, selectedPayment.user_id)}
                        </strong>

                        <span>
                          {profile?.business_name &&
                            profile.business_name !== profile.full_name &&
                            profile.full_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PLAN */}

                  <div className="sh-admin-transaction-modal-section">
                    <div className="sh-admin-transaction-modal-section-title">
                      <CreditCard size={16} />
                      Purchased Plan
                    </div>

                    <div className="sh-admin-transaction-modal-plan">
                      <div>
                        <strong>{plan?.name || "Unknown plan"}</strong>

                        <span>{plan?.slug || "—"}</span>
                      </div>

                      {plan?.price !== undefined && (
                        <strong>
                          {formatAmount(plan.price, selectedPayment.currency)}
                        </strong>
                      )}
                    </div>
                  </div>

                  {/* PAYMENT ID */}

                  <div className="sh-admin-transaction-modal-id">
                    <span>Payment ID</span>

                    <code>{selectedPayment.id}</code>
                  </div>
                </div>
              );
            })()}

            <div className="sh-admin-transaction-modal-footer">
              <button type="button" onClick={() => setSelectedPayment(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
