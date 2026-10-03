import { useState, useMemo, useEffect } from "react";
import {
  Bell,
  Search,
  Truck,
  Package,
  AlertTriangle,
  Info,
  ShieldAlert,
  Clock,
  CheckCircle2,
  RefreshCw,
  Check,
  X,
  FileText,
  UserCheck,
  ChevronRight,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Helper for event type icons with tailored colors
const getEventIcon = (type) => {
  const t = (type || "").toLowerCase();
  if (t.includes("shipment created")) {
    return (
      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
        <Package className="w-5 h-5" />
      </div>
    );
  }
  if (t.includes("pickup") || t.includes("dispatched")) {
    return (
      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
        <Truck className="w-5 h-5" />
      </div>
    );
  }
  if (t.includes("out for delivery") || t.includes("delivered")) {
    return (
      <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-5 h-5" />
      </div>
    );
  }
  if (t.includes("driver assigned")) {
    return (
      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
        <UserCheck className="w-5 h-5" />
      </div>
    );
  }
  if (t.includes("failed") || t.includes("expiry") || t.includes("alert")) {
    return (
      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
        <AlertTriangle className="w-5 h-5" />
      </div>
    );
  }
  if (t.includes("document")) {
    return (
      <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
        <FileText className="w-5 h-5" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
      <Info className="w-5 h-5" />
    </div>
  );
};

// Helper for category badge styling
const getEventBadge = (type) => {
  const t = (type || "").toLowerCase();
  if (t.includes("failed") || t.includes("expiry")) {
    return "bg-red-50 text-red-700 border-red-200";
  }
  if (
    t.includes("out for delivery") ||
    t.includes("dispatched") ||
    t.includes("assigned")
  ) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (t.includes("delivered") || t.includes("completed")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  return "bg-blue-50 text-blue-700 border-blue-200";
};

// Helper for formatted dates
const formatDate = (isoString) => {
  if (!isoString) return "N/A";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHrs < 24) return `${diffHrs} hrs ago`;
  if (diffDays < 7) return `${diffDays} days ago`;

  return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}, ${d
    .getHours()
    .toString()
    .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

// ==========================================
// REDESIGNED NOTIFICATION DETAILS MODAL
// ==========================================
function NotificationModal({ notification, isOpen, onClose }) {
  if (!isOpen || !notification) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Sleek Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-transparent">
          <div className="flex items-center gap-3">
            {getEventIcon(notification.type)}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {notification.type}
                </h3>
                <span
                  className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md border ${getEventBadge(
                    notification.type,
                  )}`}
                >
                  {notification.type}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatDate(notification.createdAt || notification.timestamp)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 bg-transparent">
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">
              Event Details & Description
            </p>
            <p className="text-sm font-medium text-slate-800 leading-relaxed">
              {notification.message}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 border border-slate-200 rounded-xl bg-transparent">
              <span className="text-slate-400 block text-[11px] mb-0.5">
                Reference ID
              </span>
              <span className="font-mono font-bold text-slate-800">
                {notification.referenceId || notification.shipmentId || "—"}
              </span>
            </div>
            <div className="p-3 border border-slate-200 rounded-xl bg-transparent">
              <span className="text-slate-400 block text-[11px] mb-0.5">
                Read Status
              </span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Read
              </span>
            </div>
            <div className="p-3 border border-slate-200 rounded-xl col-span-2 bg-transparent">
              <span className="text-slate-400 block text-[11px] mb-0.5">
                Timestamp
              </span>
              <span className="font-medium text-slate-700">
                {new Date(
                  notification.createdAt || notification.timestamp,
                ).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-transparent">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN NOTIFICATION PAGE COMPONENT (100% WIDTH, TRANSPARENT BG)
// ==========================================
export default function DashboardNotification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [filterTab, setFilterTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);

  // ── Fetch notifications ────────────────────────────────────────────────---
  const fetchNotifications = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ── Open & auto-mark as read ──────────────────────────────────────────────
  const handleOpenNotification = async (notif) => {
    setSelectedNotification(notif);

    if (!notif.read && notif._id) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/notifications/${notif._id}/read`,
          {
            method: "PATCH",
            headers: getAuthHeaders(),
          },
        );
        if (res.ok) {
          setNotifications((prev) =>
            prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n)),
          );
        }
      } catch (err) {
        console.error("Mark read error:", err);
      }
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  // Filtered Notifications List
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filterTab === "unread" && n.read) return false;
      if (
        filterTab === "shipments" &&
        !(n.type || "").toLowerCase().includes("shipment")
      )
        return false;
      if (
        filterTab === "deliveries" &&
        !(n.type || "").toLowerCase().includes("delivery") &&
        !(n.type || "").toLowerCase().includes("pickup") &&
        !(n.type || "").toLowerCase().includes("dispatched")
      )
        return false;

      if (typeFilter !== "all" && n.type !== typeFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !(n.type || "").toLowerCase().includes(q) &&
          !(n.message || "").toLowerCase().includes(q) &&
          !(n.referenceId || "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [notifications, filterTab, typeFilter, searchQuery]);

  return (
    <div className="w-full bg-transparent space-y-6">
      {/* Header Panel */}
      <div className="w-full bg-transparent rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 relative">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live event activity & automated system updates
            </p>
          </div>
        </div>

        <button
          onClick={fetchNotifications}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-transparent">
        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl overflow-x-auto">
          {[
            { id: "all", label: `All (${notifications.length})` },
            { id: "unread", label: `Unread (${unreadCount})` },
            { id: "shipments", label: "Shipments" },
            { id: "deliveries", label: "Deliveries" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                filterTab === tab.id
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Event Select */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium"
          >
            <option value="all">All Events</option>
            <option value="Shipment Created">Shipment Created</option>
            <option value="Pickup Completed">Pickup Completed</option>
            <option value="Shipment Dispatched">Shipment Dispatched</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Failed Delivery">Failed Delivery</option>
            <option value="Document Expiry">Document Expiry</option>
            <option value="Shipment Status Updated">Status Updated</option>
            <option value="Driver Assigned">Driver Assigned</option>
          </select>
        </div>
      </div>

      {/* Notifications List Feed (100% Width) */}
      <div className="w-full space-y-2.5 bg-transparent">
        {loading ? (
          <div className="w-full bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">
              Loading notifications...
            </p>
          </div>
        ) : fetchError ? (
          <div className="w-full bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center text-xs text-rose-700">
            Failed to load notifications: {fetchError}{" "}
            <button
              onClick={fetchNotifications}
              className="underline font-semibold ml-1 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="w-full bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              No notifications found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You're all caught up! New system notifications will automatically
              appear here.
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item._id || item.id}
              onClick={() => handleOpenNotification(item)}
              className={`group w-full bg-white rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer flex items-start gap-4 relative ${
                !item.read
                  ? "border-blue-200 bg-blue-50/30 shadow-xs hover:border-blue-300"
                  : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
              }`}
            >
              {/* Unread indicator dot */}
              {!item.read && (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 absolute top-4 right-4 animate-pulse" />
              )}

              {/* Event Icon */}
              {getEventIcon(item.type)}

              {/* Content Body */}
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md border ${getEventBadge(
                      item.type,
                    )}`}
                  >
                    {item.type}
                  </span>

                  {(item.referenceId || item.shipmentId) && (
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.referenceId || item.shipmentId}
                    </span>
                  )}
                </div>

                <p
                  className={`text-xs sm:text-sm leading-relaxed mb-2 ${
                    !item.read
                      ? "font-bold text-slate-900"
                      : "font-medium text-slate-700"
                  }`}
                >
                  {item.message}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(item.createdAt || item.timestamp)}
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(
                      item.createdAt || item.timestamp,
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span>•</span>
                  <span
                    className={
                      item.read
                        ? "text-slate-400"
                        : "text-blue-600 font-semibold"
                    }
                  >
                    {item.read ? "Read" : "Unread"}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden sm:flex items-center justify-center text-slate-300 group-hover:text-slate-500 transition-colors self-center">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Modal */}
      <NotificationModal
        notification={selectedNotification}
        isOpen={Boolean(selectedNotification)}
        onClose={() => setSelectedNotification(null)}
      />
    </div>
  );
}
