import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  ShieldCheck,
  Clock3,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  FileText,
  CalendarDays,
  User,
  CreditCard,
  AlertCircle,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  Ban,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
// import "./AdminVerification.css";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const DOCUMENT_LABELS = {
  nin: "NIN",
  international_passport: "International Passport",
  drivers_license: "Driver's License",
  voters_card: "Voter's Card",
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const formatDateTime = (date) => {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

const getDocumentLabel = (type) => {
  return DOCUMENT_LABELS[type] || type || "Unknown document";
};

const getStatus = (status) => {
  switch (status) {
    case "approved":
      return {
        label: "Approved",
        icon: <CheckCircle2 size={14} />,
        className: "approved",
      };

    case "rejected":
      return {
        label: "Rejected",
        icon: <XCircle size={14} />,
        className: "rejected",
      };

    case "pending":
    default:
      return {
        label: "Pending",
        icon: <Clock3 size={14} />,
        className: "pending",
      };
  }
};

const maskDocumentNumber = (value) => {
  if (!value) return "—";

  const text = String(value).trim();

  if (text.length <= 4) {
    return "••••";
  }

  return `${"•".repeat(Math.max(4, text.length - 4))}${text.slice(-4)}`;
};

export default function AdminVerification() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const [page, setPage] = useState(1);

  const [selectedVerification, setSelectedVerification] = useState(null);
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentLoading, setDocumentLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  /*
  ========================================
  LOAD VERIFICATIONS
  ========================================
  */

  const loadVerifications = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      /*
      ========================================
      FETCH VERIFICATIONS
      ========================================
      */

      const { data: verificationData, error: verificationError } =
        await supabase
          .from("verifications")
          .select(
            `
            id,
            user_id,
            document_type,
            document_number,
            date_of_birth,
            document_path,
            status,
            rejection_reason,
            reviewed_by,
            submitted_at,
            reviewed_at,
            created_at,
            updated_at
          `
          )
          .order("submitted_at", { ascending: false });

      if (verificationError) {
        throw verificationError;
      }

      const records = verificationData || [];

      /*
      ========================================
      FETCH SELLER PROFILES
      ========================================
      */

      const userIds = [
        ...new Set(records.map((item) => item.user_id).filter(Boolean)),
      ];

      let profilesMap = {};

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
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
          throw profilesError;
        }

        profilesMap = (profilesData || []).reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
      }

      /*
      ========================================
      FETCH REVIEWERS
      ========================================
      */

      const reviewerIds = [
        ...new Set(records.map((item) => item.reviewed_by).filter(Boolean)),
      ];

      let reviewersMap = {};

      if (reviewerIds.length > 0) {
        const { data: reviewersData, error: reviewersError } = await supabase
          .from("profiles")
          .select(
            `
              id,
              full_name,
              business_name
            `
          )
          .in("id", reviewerIds);

        if (reviewersError) {
          throw reviewersError;
        }

        reviewersMap = (reviewersData || []).reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
      }

      /*
      ========================================
      COMBINE DATA
      ========================================
      */

      const combined = records.map((verification) => ({
        ...verification,
        profile: profilesMap[verification.user_id] || null,
        reviewer: reviewersMap[verification.reviewed_by] || null,
      }));

      setVerifications(combined);
    } catch (err) {
      console.error("Admin verification error:", err);

      setError(err.message || "Unable to load verification requests.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVerifications();
  }, []);

  /*
  ========================================
  STATS
  ========================================
  */

  const stats = useMemo(() => {
    const total = verifications.length;

    const pending = verifications.filter(
      (item) => item.status === "pending"
    ).length;

    const approved = verifications.filter(
      (item) => item.status === "approved"
    ).length;

    const rejected = verifications.filter(
      (item) => item.status === "rejected"
    ).length;

    return {
      total,
      pending,
      approved,
      rejected,
    };
  }, [verifications]);

  /*
  ========================================
  FILTER + SEARCH
  ========================================
  */

  const filteredVerifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    let results = [...verifications];

    if (statusFilter !== "all") {
      results = results.filter((item) => item.status === statusFilter);
    }

    if (query) {
      results = results.filter((item) => {
        const profile = item.profile;

        const name = profile?.full_name?.toLowerCase() || "";

        const business = profile?.business_name?.toLowerCase() || "";

        const documentType = getDocumentLabel(item.document_type).toLowerCase();

        const documentNumber = item.document_number?.toLowerCase() || "";

        return (
          name.includes(query) ||
          business.includes(query) ||
          documentType.includes(query) ||
          documentNumber.includes(query)
        );
      });
    }

    results.sort((a, b) => {
      const dateA = new Date(a.submitted_at || a.created_at).getTime();
      const dateB = new Date(b.submitted_at || b.created_at).getTime();

      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return results;
  }, [verifications, search, statusFilter, sortOrder]);

  /*
  ========================================
  PAGINATION
  ========================================
  */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredVerifications.length / PAGE_SIZE)
  );

  const paginatedVerifications = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return filteredVerifications.slice(start, start + PAGE_SIZE);
  }, [filteredVerifications, page]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortOrder]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  /*
  ========================================
  OPEN VERIFICATION
  ========================================
  */

  const openVerification = async (verification) => {
    try {
      setSelectedVerification(verification);
      setDocumentUrl("");
      setDocumentLoading(true);
      setError("");

      if (!verification.document_path) {
        setDocumentLoading(false);
        return;
      }

      /*
      ========================================
      CREATE SIGNED URL
      ========================================
      */

      const { data, error: signedUrlError } = await supabase.storage
        .from("verification-documents")
        .createSignedUrl(verification.document_path, 60 * 10);

      if (signedUrlError) {
        throw signedUrlError;
      }

      setDocumentUrl(data?.signedUrl || "");
    } catch (err) {
      console.error("Document preview error:", err);

      setError(
        err.message || "Unable to generate the verification document preview."
      );
    } finally {
      setDocumentLoading(false);
    }
  };

  /*
  ========================================
  CLOSE VERIFICATION
  ========================================
  */

  const closeVerification = () => {
    setSelectedVerification(null);
    setDocumentUrl("");
    setShowRejectModal(false);
    setRejectionReason("");
  };

  /*
  ========================================
  APPROVE VERIFICATION
  ========================================
  */

  const approveVerification = async () => {
    if (!selectedVerification) return;

    try {
      setActionLoading(true);
      setError("");

      const {
        data: { user: adminUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!adminUser) {
        throw new Error("You must be logged in as an administrator.");
      }

      const { error: updateError } = await supabase
        .from("verifications")
        .update({
          status: "approved",
          reviewed_by: adminUser.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedVerification.id)
        .eq("status", "pending");

      if (updateError) {
        throw updateError;
      }

      /*
      ========================================
      UPDATE LOCAL STATE
      ========================================
      */

      const now = new Date().toISOString();

      setVerifications((current) =>
        current.map((item) =>
          item.id === selectedVerification.id
            ? {
                ...item,
                status: "approved",
                reviewed_by: adminUser.id,
                reviewed_at: now,
                rejection_reason: null,
              }
            : item
        )
      );

      setSelectedVerification((current) =>
        current
          ? {
              ...current,
              status: "approved",
              reviewed_by: adminUser.id,
              reviewed_at: now,
              rejection_reason: null,
            }
          : current
      );
    } catch (err) {
      console.error("Approve verification error:", err);

      setError(err.message || "Unable to approve this verification.");
    } finally {
      setActionLoading(false);
    }
  };

  /*
  ========================================
  REJECT VERIFICATION
  ========================================
  */

  const rejectVerification = async () => {
    if (!selectedVerification) return;

    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const {
        data: { user: adminUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!adminUser) {
        throw new Error("You must be logged in as an administrator.");
      }

      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("verifications")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason.trim(),
          reviewed_by: adminUser.id,
          reviewed_at: now,
          updated_at: now,
        })
        .eq("id", selectedVerification.id)
        .eq("status", "pending");

      if (updateError) {
        throw updateError;
      }

      /*
      ========================================
      UPDATE LOCAL STATE
      ========================================
      */

      setVerifications((current) =>
        current.map((item) =>
          item.id === selectedVerification.id
            ? {
                ...item,
                status: "rejected",
                rejection_reason: rejectionReason.trim(),
                reviewed_by: adminUser.id,
                reviewed_at: now,
              }
            : item
        )
      );

      setSelectedVerification((current) =>
        current
          ? {
              ...current,
              status: "rejected",
              rejection_reason: rejectionReason.trim(),
              reviewed_by: adminUser.id,
              reviewed_at: now,
            }
          : current
      );

      setShowRejectModal(false);
      setRejectionReason("");
    } catch (err) {
      console.error("Reject verification error:", err);

      setError(err.message || "Unable to reject this verification.");
    } finally {
      setActionLoading(false);
    }
  };

  /*
  ========================================
  RENDER
  ========================================
  */

  return (
    <div className="sh-admin-verification">
      {/* ========================================
          HEADER
      ======================================== */}

      <div className="sh-admin-verification-header">
        <div>
          <span className="sh-admin-verification-eyebrow">
            SELLER VERIFICATION
          </span>

          <h1>Verification requests</h1>

          <p>
            Review seller identity documents and verify accounts before granting
            verified status.
          </p>
        </div>

        <button
          type="button"
          className="sh-admin-verification-refresh"
          onClick={() => loadVerifications(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={16}
            className={refreshing ? "sh-admin-verification-spin" : ""}
          />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ========================================
          ERROR
      ======================================== */}

      {error && (
        <div className="sh-admin-verification-error">
          <AlertCircle size={17} />

          <span>{error}</span>

          <button type="button" onClick={() => setError("")}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* ========================================
          STATS
      ======================================== */}

      <div className="sh-admin-verification-stats">
        <div className="sh-admin-verification-stat">
          <div className="sh-admin-verification-stat-icon">
            <ShieldCheck size={19} />
          </div>

          <div>
            <span>Total requests</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="sh-admin-verification-stat">
          <div className="sh-admin-verification-stat-icon pending">
            <Clock3 size={19} />
          </div>

          <div>
            <span>Pending review</span>
            <strong>{stats.pending}</strong>
          </div>
        </div>

        <div className="sh-admin-verification-stat">
          <div className="sh-admin-verification-stat-icon approved">
            <CheckCircle2 size={19} />
          </div>

          <div>
            <span>Approved</span>
            <strong>{stats.approved}</strong>
          </div>
        </div>

        <div className="sh-admin-verification-stat">
          <div className="sh-admin-verification-stat-icon rejected">
            <XCircle size={19} />
          </div>

          <div>
            <span>Rejected</span>
            <strong>{stats.rejected}</strong>
          </div>
        </div>
      </div>

      {/* ========================================
          TOOLBAR
      ======================================== */}

      <div className="sh-admin-verification-toolbar">
        <div className="sh-admin-verification-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search seller, business or document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button type="button" onClick={() => setSearch("")}>
              <X size={15} />
            </button>
          )}
        </div>

        <div className="sh-admin-verification-filters">
          <div className="sh-admin-verification-status-filters">
            {STATUS_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.value}
                className={statusFilter === option.value ? "active" : ""}
                onClick={() => setStatusFilter(option.value)}
              >
                {option.label}

                {option.value !== "all" && (
                  <span>
                    {option.value === "pending"
                      ? stats.pending
                      : option.value === "approved"
                      ? stats.approved
                      : stats.rejected}
                  </span>
                )}
              </button>
            ))}
          </div>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="sh-admin-verification-sort"
          >
            <option value="newest">Newest first</option>

            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      {/* ========================================
          TABLE
      ======================================== */}

      <div className="sh-admin-verification-table-card">
        {loading ? (
          <div className="sh-admin-verification-loading">
            <LoaderCircle size={28} className="sh-admin-verification-spin" />

            <span>Loading verification requests...</span>
          </div>
        ) : filteredVerifications.length === 0 ? (
          <div className="sh-admin-verification-empty">
            <div className="sh-admin-verification-empty-icon">
              <ShieldCheck size={28} />
            </div>

            <h3>No verification requests found</h3>

            <p>
              {search || statusFilter !== "all"
                ? "Try changing your search or filters."
                : "Seller verification requests will appear here."}
            </p>
          </div>
        ) : (
          <>
            <div className="sh-admin-verification-table-wrap">
              <table className="sh-admin-verification-table">
                <thead>
                  <tr>
                    <th>Seller</th>
                    <th>Document</th>
                    <th>Date of birth</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedVerifications.map((verification) => {
                    const status = getStatus(verification.status);

                    const profile = verification.profile;

                    return (
                      <tr key={verification.id}>
                        {/* SELLER */}

                        <td>
                          <div className="sh-admin-verification-seller">
                            <div className="sh-admin-verification-avatar">
                              {profile?.avatar_url ? (
                                <img
                                  src={profile.avatar_url}
                                  alt={profile.full_name || "Seller"}
                                />
                              ) : (
                                <User size={17} />
                              )}
                            </div>

                            <div>
                              <strong>
                                {profile?.full_name || "Unknown seller"}
                              </strong>

                              <span>
                                {profile?.business_name || "Individual seller"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* DOCUMENT */}

                        <td>
                          <div className="sh-admin-verification-document">
                            <div>
                              <CreditCard size={15} />
                            </div>

                            <span>
                              {getDocumentLabel(verification.document_type)}
                            </span>
                          </div>
                        </td>

                        {/* DOB */}

                        <td>{formatDate(verification.date_of_birth)}</td>

                        {/* STATUS */}

                        <td>
                          <span
                            className={`sh-admin-verification-status ${status.className}`}
                          >
                            {status.icon}
                            {status.label}
                          </span>
                        </td>

                        {/* SUBMITTED */}

                        <td>
                          <div className="sh-admin-verification-date">
                            <CalendarDays size={14} />

                            {formatDate(verification.submitted_at)}
                          </div>
                        </td>

                        {/* ACTION */}

                        <td>
                          <button
                            type="button"
                            className="sh-admin-verification-view-btn"
                            onClick={() => openVerification(verification)}
                          >
                            <Eye size={15} />
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ========================================
                PAGINATION
            ======================================== */}

            <div className="sh-admin-verification-pagination">
              <span>
                Showing{" "}
                {Math.min(
                  (page - 1) * PAGE_SIZE + 1,
                  filteredVerifications.length
                )}{" "}
                to {Math.min(page * PAGE_SIZE, filteredVerifications.length)} of{" "}
                {filteredVerifications.length}
              </span>

              <div>
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft size={16} />
                </button>

                <strong>
                  {page} / {totalPages}
                </strong>

                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ========================================
          REVIEW MODAL
      ======================================== */}

      {selectedVerification && (
        <div
          className="sh-admin-verification-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeVerification();
            }
          }}
        >
          <div className="sh-admin-verification-modal">
            {/* MODAL HEADER */}

            <div className="sh-admin-verification-modal-header">
              <div>
                <span>VERIFICATION REVIEW</span>

                <h2>Identity verification</h2>
              </div>

              <button
                type="button"
                onClick={closeVerification}
                className="sh-admin-verification-modal-close"
              >
                <X size={19} />
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="sh-admin-verification-modal-body">
              {/* SELLER */}

              <section className="sh-admin-verification-review-section">
                <div className="sh-admin-verification-review-heading">
                  <User size={17} />
                  <span>Seller information</span>
                </div>

                <div className="sh-admin-verification-review-seller">
                  <div className="sh-admin-verification-review-avatar">
                    {selectedVerification.profile?.avatar_url ? (
                      <img
                        src={selectedVerification.profile.avatar_url}
                        alt={selectedVerification.profile.full_name || "Seller"}
                      />
                    ) : (
                      <User size={21} />
                    )}
                  </div>

                  <div>
                    <strong>
                      {selectedVerification.profile?.full_name ||
                        "Unknown seller"}
                    </strong>

                    <span>
                      {selectedVerification.profile?.business_name ||
                        "Individual seller"}
                    </span>
                  </div>
                </div>
              </section>

              {/* IDENTITY DETAILS */}

              <section className="sh-admin-verification-review-section">
                <div className="sh-admin-verification-review-heading">
                  <CreditCard size={17} />
                  <span>Identity details</span>
                </div>

                <div className="sh-admin-verification-detail-grid">
                  <div>
                    <span>Identification document</span>

                    <strong>
                      {getDocumentLabel(selectedVerification.document_type)}
                    </strong>
                  </div>

                  <div>
                    <span>Document number</span>

                    <strong>
                      {maskDocumentNumber(selectedVerification.document_number)}
                    </strong>
                  </div>

                  <div>
                    <span>Date of birth</span>

                    <strong>
                      {formatDate(selectedVerification.date_of_birth)}
                    </strong>
                  </div>

                  <div>
                    <span>Submitted</span>

                    <strong>
                      {formatDateTime(selectedVerification.submitted_at)}
                    </strong>
                  </div>
                </div>
              </section>

              {/* DOCUMENT */}

              <section className="sh-admin-verification-review-section">
                <div className="sh-admin-verification-review-heading">
                  <FileText size={17} />
                  <span>Identification document</span>
                </div>

                <div className="sh-admin-verification-document-preview">
                  {documentLoading ? (
                    <div className="sh-admin-verification-document-loading">
                      <LoaderCircle
                        size={28}
                        className="sh-admin-verification-spin"
                      />

                      <span>Preparing secure document preview...</span>
                    </div>
                  ) : documentUrl ? (
                    selectedVerification.document_path
                      ?.toLowerCase()
                      .endsWith(".pdf") ? (
                      <div className="sh-admin-verification-pdf">
                        <FileText size={38} />

                        <strong>PDF identification document</strong>

                        <span>
                          The document is securely loaded from private storage.
                        </span>

                        <a
                          href={documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="sh-admin-verification-open-document"
                        >
                          Open document
                        </a>
                      </div>
                    ) : (
                      <img
                        src={documentUrl}
                        alt="Seller identification document"
                      />
                    )
                  ) : (
                    <div className="sh-admin-verification-document-missing">
                      <AlertCircle size={28} />

                      <span>Identification document is unavailable.</span>
                    </div>
                  )}
                </div>
              </section>

              {/* CURRENT STATUS */}

              <section className="sh-admin-verification-review-section">
                <div className="sh-admin-verification-review-heading">
                  <ShieldCheck size={17} />
                  <span>Verification status</span>
                </div>

                <div className="sh-admin-verification-current-status">
                  <span
                    className={`sh-admin-verification-status ${
                      getStatus(selectedVerification.status).className
                    }`}
                  >
                    {getStatus(selectedVerification.status).icon}

                    {getStatus(selectedVerification.status).label}
                  </span>

                  {selectedVerification.reviewed_at && (
                    <span>
                      Reviewed{" "}
                      {formatDateTime(selectedVerification.reviewed_at)}
                    </span>
                  )}
                </div>

                {selectedVerification.status === "rejected" &&
                  selectedVerification.rejection_reason && (
                    <div className="sh-admin-verification-rejection">
                      <strong>Rejection reason</strong>

                      <p>{selectedVerification.rejection_reason}</p>
                    </div>
                  )}
              </section>
            </div>

            {/* MODAL FOOTER */}

            {selectedVerification.status === "pending" && (
              <div className="sh-admin-verification-modal-footer">
                <button
                  type="button"
                  className="sh-admin-verification-reject-btn"
                  onClick={() => {
                    setShowRejectModal(true);
                    setError("");
                  }}
                  disabled={actionLoading}
                >
                  <Ban size={16} />
                  Reject verification
                </button>

                <button
                  type="button"
                  className="sh-admin-verification-approve-btn"
                  onClick={approveVerification}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <LoaderCircle
                      size={16}
                      className="sh-admin-verification-spin"
                    />
                  ) : (
                    <Check size={16} />
                  )}
                  Approve verification
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================
          REJECTION MODAL
      ======================================== */}

      {showRejectModal && selectedVerification && (
        <div className="sh-admin-verification-reject-overlay">
          <div className="sh-admin-verification-reject-modal">
            <div className="sh-admin-verification-reject-header">
              <div className="sh-admin-verification-reject-icon">
                <Ban size={20} />
              </div>

              <button type="button" onClick={() => setShowRejectModal(false)}>
                <X size={18} />
              </button>
            </div>

            <h3>Reject verification?</h3>

            <p>
              Tell the seller why their verification request was rejected. They
              can use this information to correct the issue and resubmit.
            </p>

            <label>Rejection reason</label>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Example: The uploaded document is unclear. Please upload a clearer copy."
              rows={5}
              autoFocus
            />

            <div className="sh-admin-verification-reject-actions">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={rejectVerification}
                disabled={actionLoading || !rejectionReason.trim()}
              >
                {actionLoading ? (
                  <LoaderCircle
                    size={15}
                    className="sh-admin-verification-spin"
                  />
                ) : (
                  <XCircle size={15} />
                )}
                Reject verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
