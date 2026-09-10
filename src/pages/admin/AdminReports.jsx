import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Flag,
  Clock3,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  FileText,
  User,
  Mail,
  CalendarDays,
  ExternalLink,
  Save,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
// import "./AdminReports.css";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "All reports" },
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

const getStatus = (status) => {
  const normalized = String(status || "pending").toLowerCase();

  switch (normalized) {
    case "reviewed":
      return {
        label: "Reviewed",
        className: "reviewed",
        icon: <Eye size={14} />,
      };

    case "resolved":
      return {
        label: "Resolved",
        className: "resolved",
        icon: <CheckCircle2 size={14} />,
      };

    case "dismissed":
      return {
        label: "Dismissed",
        className: "dismissed",
        icon: <XCircle size={14} />,
      };

    case "pending":
    default:
      return {
        label: "Pending",
        className: "pending",
        icon: <Clock3 size={14} />,
      };
  }
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getReasonLabel = (reason) => {
  if (!reason) return "Other";

  return String(reason)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const truncateId = (id) => {
  if (!id) return "—";

  const value = String(id);

  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-4)}`;
};

const AdminReports = () => {
  const [reports, setReports] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const [page, setPage] = useState(1);

  const [selectedReport, setSelectedReport] = useState(null);
  const [reportListing, setReportListing] = useState(null);
  const [listingLoading, setListingLoading] = useState(false);

  const [adminNote, setAdminNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  /* =========================================
     LOAD REPORTS
  ========================================== */

  const loadReports = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const { data, error: reportsError } = await supabase
        .from("listing_reports")
        .select(
          `
          id,
          listing_id,
          reason,
          description,
          reporter_name,
          reporter_email,
          status,
          admin_note,
          created_at,
          reviewed_at
        `
        )
        .order("created_at", {
          ascending: false,
        });

      if (reportsError) {
        throw reportsError;
      }

      setReports(data || []);
    } catch (err) {
      console.error("Admin reports error:", err);

      setError(err?.message || "Unable to load listing reports.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  /* =========================================
     FILTER + SEARCH + SORT
  ========================================== */

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    let result = [...reports];

    if (statusFilter !== "all") {
      result = result.filter(
        (report) =>
          String(report.status || "pending").toLowerCase() === statusFilter
      );
    }

    if (query) {
      result = result.filter((report) => {
        const searchableValues = [
          report.id,
          report.listing_id,
          report.reason,
          report.description,
          report.reporter_name,
          report.reporter_email,
          report.status,
          report.admin_note,
        ];

        return searchableValues.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query)
        );
      });
    }

    result.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();

      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [reports, search, statusFilter, sortOrder]);

  /* =========================================
     PAGINATION
  ========================================== */

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));

  const paginatedReports = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return filteredReports.slice(start, start + PAGE_SIZE);
  }, [filteredReports, page]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortOrder]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  /* =========================================
     STATS
  ========================================== */

  const stats = useMemo(() => {
    const total = reports.length;

    const pending = reports.filter(
      (report) => String(report.status || "pending").toLowerCase() === "pending"
    ).length;

    const reviewed = reports.filter(
      (report) => String(report.status || "").toLowerCase() === "reviewed"
    ).length;

    const resolved = reports.filter(
      (report) => String(report.status || "").toLowerCase() === "resolved"
    ).length;

    const dismissed = reports.filter(
      (report) => String(report.status || "").toLowerCase() === "dismissed"
    ).length;

    return {
      total,
      pending,
      reviewed,
      resolved,
      dismissed,
    };
  }, [reports]);

  /* =========================================
     OPEN REPORT
  ========================================== */

  const openReport = async (report) => {
    setSelectedReport(report);
    setAdminNote(report.admin_note || "");
    setReportListing(null);

    if (!report.listing_id) {
      return;
    }

    try {
      setListingLoading(true);

      const { data, error: listingError } = await supabase
        .from("listings")
        .select(
          `
          id,
          title,
          slug,
          description,
          price,
          price_type,
          location,
          status,
          listing_type,
          featured,
          verified,
          created_at
        `
        )
        .eq("id", report.listing_id)
        .maybeSingle();

      if (listingError) {
        throw listingError;
      }

      setReportListing(data || null);
    } catch (err) {
      console.error("Report listing error:", err);
    } finally {
      setListingLoading(false);
    }
  };

  /* =========================================
     CLOSE REPORT
  ========================================== */

  const closeReport = () => {
    if (noteSaving || statusUpdating) {
      return;
    }

    setSelectedReport(null);
    setReportListing(null);
    setAdminNote("");
  };

  /* =========================================
     UPDATE REPORT STATUS
  ========================================== */

  const updateReportStatus = async (newStatus) => {
    if (!selectedReport) {
      return;
    }

    try {
      setStatusUpdating(true);

      const now = new Date().toISOString();

      const updatePayload = {
        status: newStatus,
        reviewed_at: newStatus === "pending" ? null : now,
      };

      const { data, error: updateError } = await supabase
        .from("listing_reports")
        .update(updatePayload)
        .eq("id", selectedReport.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setReports((current) =>
        current.map((report) =>
          report.id === selectedReport.id
            ? {
                ...report,
                ...data,
              }
            : report
        )
      );

      setSelectedReport((current) =>
        current
          ? {
              ...current,
              ...data,
            }
          : current
      );
    } catch (err) {
      console.error("Update report status error:", err);

      alert(err?.message || "Unable to update the report status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  /* =========================================
     SAVE ADMIN NOTE
  ========================================== */

  const saveAdminNote = async () => {
    if (!selectedReport) {
      return;
    }

    try {
      setNoteSaving(true);

      const { data, error: updateError } = await supabase
        .from("listing_reports")
        .update({
          admin_note: adminNote.trim() || null,
        })
        .eq("id", selectedReport.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setReports((current) =>
        current.map((report) =>
          report.id === selectedReport.id
            ? {
                ...report,
                ...data,
              }
            : report
        )
      );

      setSelectedReport((current) =>
        current
          ? {
              ...current,
              ...data,
            }
          : current
      );
    } catch (err) {
      console.error("Save admin note error:", err);

      alert(err?.message || "Unable to save the admin note.");
    } finally {
      setNoteSaving(false);
    }
  };

  /* =========================================
     VIEW LISTING
  ========================================== */

  const viewListing = () => {
    if (!reportListing) {
      return;
    }

    if (reportListing.slug) {
      window.open(
        `/listing/${reportListing.slug}`,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    window.open(
      `/listing/${reportListing.id}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /* =========================================
     LOADING STATE
  ========================================== */

  if (loading) {
    return (
      <div className="sh-admin-reports">
        <div className="sh-admin-reports-loading">
          <div className="sh-admin-reports-spinner">
            <Loader2 size={28} />
          </div>

          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  /* =========================================
     RENDER
  ========================================== */

  return (
    <div className="sh-admin-reports">
      <div className="sh-admin-reports-container">
        {/* =====================================
            HEADER
        ====================================== */}

        <div className="sh-admin-reports-header">
          <div>
            <span className="sh-admin-reports-eyebrow">MODERATION</span>

            <h1>Listing Reports</h1>

            <p>
              Review reports submitted by users and manage potentially
              problematic listings.
            </p>
          </div>

          <button
            type="button"
            className="sh-admin-reports-refresh"
            onClick={() => loadReports(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "sh-admin-reports-spin" : ""}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* =====================================
            ERROR
        ====================================== */}

        {error && (
          <div className="sh-admin-reports-error">
            <AlertTriangle size={18} />

            <span>{error}</span>

            <button type="button" onClick={() => loadReports()}>
              Try again
            </button>
          </div>
        )}

        {/* =====================================
            STATS
        ====================================== */}

        <div className="sh-admin-reports-stats">
          <div className="sh-admin-report-stat">
            <div className="sh-admin-report-stat-icon total">
              <Flag size={19} />
            </div>

            <div>
              <span>Total Reports</span>
              <strong>{stats.total}</strong>
            </div>
          </div>

          <div className="sh-admin-report-stat">
            <div className="sh-admin-report-stat-icon pending">
              <Clock3 size={19} />
            </div>

            <div>
              <span>Pending</span>
              <strong>{stats.pending}</strong>
            </div>
          </div>

          <div className="sh-admin-report-stat">
            <div className="sh-admin-report-stat-icon reviewed">
              <Eye size={19} />
            </div>

            <div>
              <span>Reviewed</span>
              <strong>{stats.reviewed}</strong>
            </div>
          </div>

          <div className="sh-admin-report-stat">
            <div className="sh-admin-report-stat-icon resolved">
              <CheckCircle2 size={19} />
            </div>

            <div>
              <span>Resolved</span>
              <strong>{stats.resolved}</strong>
            </div>
          </div>

          <div className="sh-admin-report-stat">
            <div className="sh-admin-report-stat-icon dismissed">
              <XCircle size={19} />
            </div>

            <div>
              <span>Dismissed</span>
              <strong>{stats.dismissed}</strong>
            </div>
          </div>
        </div>

        {/* =====================================
            TOOLBAR
        ====================================== */}

        <div className="sh-admin-reports-toolbar">
          <div className="sh-admin-reports-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search reports, listings, reporters..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {search && (
              <button
                type="button"
                className="sh-admin-reports-search-clear"
                onClick={() => setSearch("")}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="sh-admin-reports-filters">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="sh-admin-reports-select"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="sh-admin-reports-select"
            >
              <option value="newest">Newest first</option>

              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        {/* =====================================
            TABLE
        ====================================== */}

        <div className="sh-admin-reports-table-card">
          <div className="sh-admin-reports-table-wrap">
            <table className="sh-admin-reports-table">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Listing</th>
                  <th>Reporter</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {paginatedReports.length > 0 ? (
                  paginatedReports.map((report) => {
                    const status = getStatus(report.status);

                    return (
                      <tr key={report.id}>
                        {/* REPORT */}

                        <td>
                          <div className="sh-admin-report-id">
                            <div className="sh-admin-report-id-icon">
                              <Flag size={15} />
                            </div>

                            <div>
                              <strong>#{truncateId(report.id)}</strong>

                              <span>Report ID</span>
                            </div>
                          </div>
                        </td>

                        {/* LISTING */}

                        <td>
                          <div className="sh-admin-report-listing">
                            <strong>{truncateId(report.listing_id)}</strong>

                            <span>Listing ID</span>
                          </div>
                        </td>

                        {/* REPORTER */}

                        <td>
                          <div className="sh-admin-report-reporter">
                            <div className="sh-admin-report-avatar">
                              <User size={15} />
                            </div>

                            <div>
                              <strong>
                                {report.reporter_name || "Unknown reporter"}
                              </strong>

                              <span>{report.reporter_email || "No email"}</span>
                            </div>
                          </div>
                        </td>

                        {/* REASON */}

                        <td>
                          <span className="sh-admin-report-reason">
                            {getReasonLabel(report.reason)}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td>
                          <span
                            className={`sh-admin-report-status ${status.className}`}
                          >
                            {status.icon}
                            {status.label}
                          </span>
                        </td>

                        {/* CREATED */}

                        <td>
                          <span className="sh-admin-report-date">
                            {formatDate(report.created_at)}
                          </span>
                        </td>

                        {/* ACTION */}

                        <td>
                          <button
                            type="button"
                            className="sh-admin-report-view-btn"
                            onClick={() => openReport(report)}
                          >
                            <Eye size={15} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="sh-admin-reports-empty-cell">
                      <div className="sh-admin-reports-empty">
                        <div className="sh-admin-reports-empty-icon">
                          <Flag size={25} />
                        </div>

                        <h3>
                          {search || statusFilter !== "all"
                            ? "No reports found"
                            : "No reports yet"}
                        </h3>

                        <p>
                          {search || statusFilter !== "all"
                            ? "Try changing your search or filters."
                            : "Listing reports submitted by users will appear here."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* =====================================
              PAGINATION
          ====================================== */}

          {filteredReports.length > 0 && (
            <div className="sh-admin-reports-pagination">
              <span>
                Showing <strong>{(page - 1) * PAGE_SIZE + 1}</strong> to{" "}
                <strong>
                  {Math.min(page * PAGE_SIZE, filteredReports.length)}
                </strong>{" "}
                of <strong>{filteredReports.length}</strong>
              </span>

              <div className="sh-admin-reports-pagination-controls">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft size={16} />
                </button>

                <span>
                  {page} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={page === totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =======================================
          REPORT DETAILS MODAL
      ======================================== */}

      {selectedReport && (
        <div
          className="sh-admin-report-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeReport();
            }
          }}
        >
          <div className="sh-admin-report-modal">
            {/* MODAL HEADER */}

            <div className="sh-admin-report-modal-header">
              <div>
                <span className="sh-admin-report-modal-eyebrow">
                  REPORT REVIEW
                </span>

                <h2>Listing Report</h2>

                <p>#{truncateId(selectedReport.id)}</p>
              </div>

              <button
                type="button"
                className="sh-admin-report-modal-close"
                onClick={closeReport}
                disabled={noteSaving || statusUpdating}
              >
                <X size={19} />
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="sh-admin-report-modal-body">
              {/* STATUS */}

              <div className="sh-admin-report-detail-status-row">
                <span className="sh-admin-report-detail-label">
                  Current status
                </span>

                {(() => {
                  const status = getStatus(selectedReport.status);

                  return (
                    <span
                      className={`sh-admin-report-status ${status.className}`}
                    >
                      {status.icon}
                      {status.label}
                    </span>
                  );
                })()}
              </div>

              {/* LISTING */}

              <section className="sh-admin-report-detail-section">
                <div className="sh-admin-report-section-title">
                  <FileText size={17} />

                  <h3>Reported Listing</h3>
                </div>

                {listingLoading ? (
                  <div className="sh-admin-report-listing-loading">
                    <Loader2 size={20} className="sh-admin-reports-spin" />

                    <span>Loading listing...</span>
                  </div>
                ) : reportListing ? (
                  <div className="sh-admin-report-listing-card">
                    <div>
                      <strong>
                        {reportListing.title || "Untitled listing"}
                      </strong>

                      <span>
                        {reportListing.location || "Location not provided"}
                      </span>
                    </div>

                    <button type="button" onClick={viewListing}>
                      <ExternalLink size={15} />
                      View listing
                    </button>
                  </div>
                ) : (
                  <div className="sh-admin-report-listing-missing">
                    <AlertTriangle size={17} />

                    <span>
                      This listing could not be found. It may have been deleted.
                    </span>
                  </div>
                )}
              </section>

              {/* REPORT REASON */}

              <section className="sh-admin-report-detail-section">
                <div className="sh-admin-report-section-title">
                  <Flag size={17} />

                  <h3>Report Reason</h3>
                </div>

                <div className="sh-admin-report-reason-box">
                  <strong>{getReasonLabel(selectedReport.reason)}</strong>

                  <p>
                    {selectedReport.description ||
                      "No additional description was provided."}
                  </p>
                </div>
              </section>

              {/* REPORTER */}

              <section className="sh-admin-report-detail-section">
                <div className="sh-admin-report-section-title">
                  <User size={17} />

                  <h3>Reporter Information</h3>
                </div>

                <div className="sh-admin-report-info-grid">
                  <div className="sh-admin-report-info-item">
                    <span>
                      <User size={14} />
                      Name
                    </span>

                    <strong>
                      {selectedReport.reporter_name || "Not provided"}
                    </strong>
                  </div>

                  <div className="sh-admin-report-info-item">
                    <span>
                      <Mail size={14} />
                      Email
                    </span>

                    <strong>
                      {selectedReport.reporter_email || "Not provided"}
                    </strong>
                  </div>

                  <div className="sh-admin-report-info-item">
                    <span>
                      <CalendarDays size={14} />
                      Reported
                    </span>

                    <strong>{formatDateTime(selectedReport.created_at)}</strong>
                  </div>

                  <div className="sh-admin-report-info-item">
                    <span>
                      <Clock3 size={14} />
                      Reviewed
                    </span>

                    <strong>
                      {formatDateTime(selectedReport.reviewed_at)}
                    </strong>
                  </div>
                </div>
              </section>

              {/* ADMIN NOTE */}

              <section className="sh-admin-report-detail-section">
                <div className="sh-admin-report-section-title">
                  <FileText size={17} />

                  <h3>Admin Note</h3>
                </div>

                <textarea
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  placeholder="Add an internal note about this report..."
                  rows={5}
                />

                <div className="sh-admin-report-note-footer">
                  <span>Internal note — visible only to administrators.</span>

                  <button
                    type="button"
                    className="sh-admin-report-save-note"
                    onClick={saveAdminNote}
                    disabled={noteSaving}
                  >
                    {noteSaving ? (
                      <>
                        <Loader2 size={15} className="sh-admin-reports-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={15} />
                        Save note
                      </>
                    )}
                  </button>
                </div>
              </section>
            </div>

            {/* MODAL FOOTER */}

            <div className="sh-admin-report-modal-footer">
              <button
                type="button"
                className="sh-admin-report-modal-cancel"
                onClick={closeReport}
                disabled={noteSaving || statusUpdating}
              >
                Close
              </button>

              <div className="sh-admin-report-status-actions">
                {selectedReport.status !== "pending" && (
                  <button
                    type="button"
                    className="sh-admin-report-status-btn pending"
                    onClick={() => updateReportStatus("pending")}
                    disabled={statusUpdating}
                  >
                    <Clock3 size={15} />
                    Mark pending
                  </button>
                )}

                {selectedReport.status !== "reviewed" && (
                  <button
                    type="button"
                    className="sh-admin-report-status-btn reviewed"
                    onClick={() => updateReportStatus("reviewed")}
                    disabled={statusUpdating}
                  >
                    <Eye size={15} />
                    Mark reviewed
                  </button>
                )}

                {selectedReport.status !== "resolved" && (
                  <button
                    type="button"
                    className="sh-admin-report-status-btn resolved"
                    onClick={() => updateReportStatus("resolved")}
                    disabled={statusUpdating}
                  >
                    <CheckCircle2 size={15} />
                    Resolve
                  </button>
                )}

                {selectedReport.status !== "dismissed" && (
                  <button
                    type="button"
                    className="sh-admin-report-status-btn dismissed"
                    onClick={() => updateReportStatus("dismissed")}
                    disabled={statusUpdating}
                  >
                    <XCircle size={15} />
                    Dismiss
                  </button>
                )}
              </div>
            </div>

            {statusUpdating && (
              <div className="sh-admin-report-updating">
                <Loader2 size={15} className="sh-admin-reports-spin" />
                Updating report...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
