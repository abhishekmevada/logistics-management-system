import React, { useState, useEffect, useMemo } from "react";
import {
  Mail,
  Search,
  RefreshCw,
  Trash2,
  Eye,
  Copy,
  Check,
  AlertTriangle,
  X,
  Calendar,
  Clock,
  User,
  Download,
  MessageSquare,
  ExternalLink,
  ChevronDown,
  Inbox,
  Send,
} from "lucide-react";
import "../../styles/DashboardQuery.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function DashboardQuery() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "oldest"
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const token = localStorage.getItem("token");

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch queries from backend GET /query
  const fetchQueries = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/query`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load queries");
      }

      // Handle both { getQuery: [...] }, { queries: [...] }, or raw array
      const rawList = Array.isArray(data?.getQuery)
        ? data.getQuery
        : Array.isArray(data?.queries)
        ? data.queries
        : Array.isArray(data)
        ? data
        : [];

      setQueries(rawList);
      if (isManualRefresh) {
        showToast("Queries refreshed successfully");
      }
    } catch (err) {
      console.error("Fetch queries error:", err);
      showToast(err.message || "Failed to fetch queries", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  // Delete query
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/query/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete query");
      }

      setQueries((prev) => prev.filter((q) => q._id !== id));
      if (selectedQuery?._id === id) {
        setSelectedQuery(null);
      }
      setDeleteConfirmId(null);
      showToast("Query deleted successfully");
    } catch (err) {
      console.error("Delete query error:", err);
      showToast(err.message || "Failed to delete query", "error");
    }
  };

  const copyToClipboard = (text, type = "email") => {
    navigator.clipboard.writeText(text);
    if (type === "email") {
      setCopiedEmail(text);
      setTimeout(() => setCopiedEmail(null), 2000);
    }
    showToast(`Copied ${type} to clipboard!`, "info");
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (queries.length === 0) {
      showToast("No queries to export", "error");
      return;
    }

    const headers = ["Name", "Email", "Message", "Date", "Time"];
    const rows = queries.map((q) => {
      const dateObj = q.datetime ? new Date(q.datetime) : null;
      const dateStr = dateObj ? dateObj.toLocaleDateString() : "N/A";
      const timeStr = dateObj ? dateObj.toLocaleTimeString() : "N/A";
      const cleanMsg = (q.message || "").replace(/"/g, '""');
      return `"${q.name || ""}","${q.email || ""}","${cleanMsg}","${dateStr}","${timeStr}"`;
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `contact_queries_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Queries exported to CSV successfully");
  };

  // Date formatter
  const formatDate = (dateString) => {
    if (!dateString) return { date: "N/A", time: "" };
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return { date: "N/A", time: "" };

    const date = d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const time = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return { date, time };
  };

  // Relative time formatter
  const getRelativeTime = (dateString) => {
    if (!dateString) return "";
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Filtered & sorted queries
  const filteredQueries = useMemo(() => {
    let list = [...queries];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.name?.toLowerCase().includes(q) ||
          item.email?.toLowerCase().includes(q) ||
          item.message?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const timeA = new Date(a.datetime || 0).getTime();
      const timeB = new Date(b.datetime || 0).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [queries, searchQuery, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const total = queries.length;
    const today = new Date().toDateString();
    const todayCount = queries.filter(
      (q) => q.datetime && new Date(q.datetime).toDateString() === today
    ).length;

    const uniqueEmails = new Set(
      queries.map((q) => q.email?.toLowerCase()).filter(Boolean)
    ).size;

    return { total, todayCount, uniqueEmails };
  }, [queries]);

  // Get avatar initials
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="dash-query-page">
      {/* Toast Notification (styled similar to DashboardShipment.jsx) */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-bold border ${
              toastMessage.type === "error"
                ? "bg-rose-900 text-white border-rose-700"
                : toastMessage.type === "info"
                ? "bg-slate-900 text-white border-slate-700"
                : "bg-emerald-900 text-white border-emerald-700"
            }`}
          >
            {toastMessage.type === "error" ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white ml-2 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="dash-query-header">
        <div className="dash-query-header__left">
          <div className="dash-query-header__badge">
            <MessageSquare size={14} className="text-blue-500" />
            <span>Customer Inquiries</span>
          </div>
          <h1 className="dash-query-header__title">Contact Form Queries</h1>
          <p className="dash-query-header__desc">
            View, review, and manage direct inquiries submitted through the
            website landing page.
          </p>
        </div>

        <div className="dash-query-header__actions">
          <button
            type="button"
            onClick={handleExportCSV}
            className="dash-query-btn dash-query-btn--secondary"
            title="Export queries to CSV file"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => fetchQueries(true)}
            disabled={refreshing || loading}
            className="dash-query-btn dash-query-btn--primary"
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="dash-query-stats">
        <div className="dash-query-stat-card">
          <div className="dash-query-stat-card__icon bg-blue-50 text-blue-600">
            <Inbox size={22} />
          </div>
          <div className="dash-query-stat-card__content">
            <span className="dash-query-stat-card__label">Total Inquiries</span>
            <div className="dash-query-stat-card__value">{stats.total}</div>
          </div>
        </div>

        <div className="dash-query-stat-card">
          <div className="dash-query-stat-card__icon bg-emerald-50 text-emerald-600">
            <Clock size={22} />
          </div>
          <div className="dash-query-stat-card__content">
            <span className="dash-query-stat-card__label">Received Today</span>
            <div className="dash-query-stat-card__value">
              {stats.todayCount}
            </div>
          </div>
        </div>

        <div className="dash-query-stat-card">
          <div className="dash-query-stat-card__icon bg-purple-50 text-purple-600">
            <User size={22} />
          </div>
          <div className="dash-query-stat-card__content">
            <span className="dash-query-stat-card__label">Unique Senders</span>
            <div className="dash-query-stat-card__value">
              {stats.uniqueEmails}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="dash-query-toolbar">
        <div className="dash-query-search">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by sender name, email, or message keyword..."
            className="dash-query-search__input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="dash-query-search__clear"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="dash-query-filter-group">
          <div className="dash-query-sort">
            <span className="text-xs text-slate-500 font-medium">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="dash-query-sort__select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queries Table Section */}
      <div className="dash-query-card">
        {loading ? (
          <div className="dash-query-loading">
            <RefreshCw size={28} className="animate-spin text-blue-600" />
            <p>Loading inquiries from database...</p>
          </div>
        ) : filteredQueries.length === 0 ? (
          <div className="dash-query-empty">
            <div className="dash-query-empty__icon">
              <Mail size={36} className="text-slate-400" />
            </div>
            <h3 className="dash-query-empty__title">
              {searchQuery ? "No matching inquiries found" : "No inquiries yet"}
            </h3>
            <p className="dash-query-empty__desc">
              {searchQuery
                ? `No inquiries match "${searchQuery}". Try different keywords or clear your search filter.`
                : "When users submit queries through the contact form on your landing page, they will appear here."}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="dash-query-btn dash-query-btn--secondary"
                style={{ marginTop: "12px" }}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card List (visible on < 640px) */}
            <div className="dash-query-mobile-list">
              {filteredQueries.map((item) => {
                const { date, time } = formatDate(item.datetime);
                const relTime = getRelativeTime(item.datetime);

                return (
                  <div
                    key={item._id || `${item.email}-${item.datetime}`}
                    className="dash-query-card-item"
                  >
                    <div className="dash-query-card-item__top">
                      <div className="dash-query-user min-w-0 flex-1">
                        <div className="dash-query-avatar shrink-0">
                          {getInitials(item.name)}
                        </div>
                        <div className="dash-query-user__info min-w-0 flex-1">
                          <span className="dash-query-user__name truncate">
                            {item.name || "Anonymous"}
                          </span>
                          {relTime && (
                            <span className="dash-query-user__reltime">
                              {relTime}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="dash-query-date-chip shrink-0">
                        <Calendar size={11} className="text-slate-400" />
                        <span>{date}</span>
                      </div>
                    </div>

                    <div className="dash-query-email-box">
                      <a
                        href={`mailto:${item.email}`}
                        className="dash-query-email-link truncate"
                        title={`Send email to ${item.email}`}
                      >
                        <Mail size={13} className="shrink-0 text-slate-400" />
                        <span className="truncate">{item.email}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.email, "email")}
                        className="dash-query-copy-btn shrink-0"
                        title="Copy email address"
                      >
                        {copiedEmail === item.email ? (
                          <Check size={12} className="text-emerald-500" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>

                    <div
                      className="dash-query-message-preview cursor-pointer"
                      onClick={() => setSelectedQuery(item)}
                      title="Click to view full message"
                    >
                      <p className="line-clamp-2">
                        {item.message || "No message body provided."}
                      </p>
                    </div>

                    <div className="dash-query-card-item__actions">
                      <button
                        type="button"
                        onClick={() => setSelectedQuery(item)}
                        className="dash-query-mobile-btn dash-query-mobile-btn--view"
                        title="View inquiry details"
                      >
                        <Eye size={15} />
                        <span>View</span>
                      </button>

                      <a
                        href={`mailto:${item.email}?subject=Re: Athenura Logistics Inquiry&body=Dear ${encodeURIComponent(
                          item.name || "Customer"
                        )},%0D%0A%0D%0AThank you for contacting us regarding:%0D%0A"${encodeURIComponent(
                          item.message || ""
                        )}"%0D%0A%0D%0A`}
                        className="dash-query-mobile-btn dash-query-mobile-btn--reply"
                        title="Reply to sender via Email"
                      >
                        <Send size={14} />
                        <span>Reply</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(item._id)}
                        className="dash-query-mobile-btn dash-query-mobile-btn--delete"
                        title="Delete this inquiry"
                        aria-label="Delete inquiry"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (visible on >= 640px) */}
            <div className="dash-query-table-wrapper">
              <table className="dash-query-table">
                <thead>
                  <tr>
                    <th>Sender</th>
                    <th>Email</th>
                    <th>Message Preview</th>
                    <th>Received Date</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueries.map((item) => {
                    const { date, time } = formatDate(item.datetime);
                    const relTime = getRelativeTime(item.datetime);

                    return (
                      <tr
                        key={item._id || `${item.email}-${item.datetime}`}
                        className="dash-query-row"
                      >
                        {/* Sender */}
                        <td>
                          <div className="dash-query-user">
                            <div className="dash-query-avatar">
                              {getInitials(item.name)}
                            </div>
                            <div className="dash-query-user__info">
                              <span className="dash-query-user__name">
                                {item.name || "Anonymous"}
                              </span>
                              {relTime && (
                                <span className="dash-query-user__reltime">
                                  {relTime}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td>
                          <div className="dash-query-email-box">
                            <a
                              href={`mailto:${item.email}`}
                              className="dash-query-email-link"
                              title={`Send email to ${item.email}`}
                            >
                              <Mail size={13} className="shrink-0 text-slate-400" />
                              <span>{item.email}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(item.email, "email")}
                              className="dash-query-copy-btn"
                              title="Copy email address"
                            >
                              {copiedEmail === item.email ? (
                                <Check size={12} className="text-emerald-500" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Message Preview */}
                        <td>
                          <div
                            className="dash-query-message-preview cursor-pointer"
                            onClick={() => setSelectedQuery(item)}
                            title="Click to view full message"
                          >
                            <p>{item.message || "No message body provided."}</p>
                          </div>
                        </td>

                        {/* Received Date */}
                        <td>
                          <div className="dash-query-date-box">
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                              <Calendar size={13} className="text-slate-400" />
                              <span>{date}</span>
                            </div>
                            {time && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                                <Clock size={11} />
                                <span>{time}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="dash-query-actions">
                            <button
                              type="button"
                              onClick={() => setSelectedQuery(item)}
                              className="dash-query-action-btn dash-query-action-btn--view"
                              title="View inquiry details"
                            >
                              <Eye size={15} />
                            </button>

                            <a
                              href={`mailto:${item.email}?subject=Re: Athenura Logistics Inquiry&body=Dear ${encodeURIComponent(
                                item.name || "Customer"
                              )},%0D%0A%0D%0AThank you for contacting us regarding:%0D%0A"${encodeURIComponent(
                                item.message || ""
                              )}"%0D%0A%0D%0A`}
                              className="dash-query-action-btn dash-query-action-btn--reply"
                              title="Reply to sender via Email"
                            >
                              <Send size={14} />
                            </a>

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(item._id)}
                              className="dash-query-action-btn dash-query-action-btn--delete"
                              title="Delete this inquiry"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="dash-query-footer">
          <span className="dash-query-footer__count">
            Showing <strong>{filteredQueries.length}</strong> of{" "}
            <strong>{queries.length}</strong> inquiries
          </span>
        </div>
      </div>

      {/* Query Detail Modal */}
      {selectedQuery && (
        <div
          className="dash-query-modal-overlay"
          onClick={() => setSelectedQuery(null)}
        >
          <div
            className="dash-query-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dash-query-modal__header">
              <div className="flex items-center gap-3">
                <div className="dash-query-avatar dash-query-avatar--lg">
                  {getInitials(selectedQuery.name)}
                </div>
                <div>
                  <h3 className="dash-query-modal__title">
                    {selectedQuery.name || "Anonymous Contact"}
                  </h3>
                  <div className="dash-query-modal__meta">
                    <Mail size={13} className="text-slate-400" />
                    <a
                      href={`mailto:${selectedQuery.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {selectedQuery.email}
                    </a>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedQuery(null)}
                className="dash-query-modal__close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="dash-query-modal__body">
              <div className="dash-query-detail-info">
                <div className="dash-query-detail-item">
                  <span className="dash-query-detail-label">Received Date</span>
                  <span className="dash-query-detail-val">
                    {formatDate(selectedQuery.datetime).date}{" "}
                    {formatDate(selectedQuery.datetime).time &&
                      `at ${formatDate(selectedQuery.datetime).time}`}
                  </span>
                </div>
                <div className="dash-query-detail-item">
                  <span className="dash-query-detail-label">Status</span>
                  <span className="dash-query-detail-badge">Inquiry</span>
                </div>
              </div>

              <div className="dash-query-message-container">
                <div className="dash-query-message-header">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Full Inquiry Message
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(selectedQuery.message, "message")
                    }
                    className="dash-query-copy-text-btn"
                  >
                    <Copy size={13} />
                    <span>Copy Text</span>
                  </button>
                </div>
                <div className="dash-query-message-content">
                  {selectedQuery.message || "No message content."}
                </div>
              </div>
            </div>

            <div className="dash-query-modal__footer">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(selectedQuery._id)}
                className="dash-query-btn dash-query-btn--danger-outline"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedQuery(null)}
                  className="dash-query-btn dash-query-btn--secondary"
                >
                  Close
                </button>
                <a
                  href={`mailto:${selectedQuery.email}?subject=Re: Athenura Logistics Inquiry&body=Dear ${encodeURIComponent(
                    selectedQuery.name || "Customer"
                  )},%0D%0A%0D%0AThank you for contacting Athenura Logistics regarding:%0D%0A"${encodeURIComponent(
                    selectedQuery.message || ""
                  )}"%0D%0A%0D%0A`}
                  className="dash-query-btn dash-query-btn--primary"
                >
                  <Send size={14} />
                  <span>Reply via Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          className="dash-query-modal-overlay"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="dash-query-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dash-query-confirm-icon">
              <AlertTriangle size={24} className="text-rose-600" />
            </div>
            <h3 className="dash-query-confirm-title">Delete Inquiry?</h3>
            <p className="dash-query-confirm-desc">
              Are you sure you want to permanently delete this customer inquiry?
              This action cannot be undone.
            </p>
            <div className="dash-query-confirm-actions">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="dash-query-btn dash-query-btn--secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="dash-query-btn dash-query-btn--danger"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
