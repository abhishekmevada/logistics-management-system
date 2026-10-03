import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Bell } from "lucide-react";
import "../../styles/Dashboard.css";
import DashboardOverview from "./Dashboardoverview";
import DashboardCustomer from "./DashboardCustomer";
import DashboardShipment from "./DashboardShipment";
import DashboardVechiles from "./DashboardVechicles";
import { canAccess, accessLabel } from "../../utils/rolePermissions";
import DashboardDriver from "./DashboardDriver";
import DashboardWarehouse from "./DashboardWarehouse";
import DashboardTrip from "./DashboardTrip";
import DashboardDelivery from "./DashboardDelivery";
import DashboardPod from "./DashboardPod";
import DashboardReport from "./DashboardReport";
import DashboardInvoice from "./DashboardInvoice";
import DashboardSetting from "./DashboardSetting";
import DashboardNotification from "./DashboardNotification";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ── Icons ─────────────────────────────────────────────────────────────────────

const ICON_PATHS = {
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  box: "M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  truck:
    "M3 6h11v10H3zM14 10h4l3 3v3h-7zM7.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  id: "M4 5h16v14H4zM9 9a2 2 0 100 4 2 2 0 000-4zM6.5 17c.6-2 2-3 3.5-3s2.9 1 3.5 3M15 9h4M15 13h4",
  warehouse: "M3 10l9-6 9 6v10H3zM9 20v-6h6v6",
  route:
    "M5 19a2 2 0 100-4 2 2 0 000 4zM19 9a2 2 0 100-4 2 2 0 000 4zM5 17V9a4 4 0 014-4h6",
  check: "M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5M9 13h6M9 17h6",
  invoice: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 9h6M9 13h6",
  chart: "M4 20V10M11 20V4M18 20v-7",
  bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 01-3.46 0",
  settings:
    "M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 00-2-1.2L14 3h-4l-.5 2.6a7 7 0 00-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 002 1.2L10 21h4l.5-2.6a7 7 0 002-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z",
  menu: "M4 6h16M4 12h16M4 18h16",
};

function Icon({ name }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

// ── Nav item definitions ──────────────────────────────────────────────────────

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: "grid", active: true },
  { key: "customers", label: "Customers", icon: "user" },
  { key: "shipments", label: "Shipments", icon: "box" },
  { key: "vehicles", label: "Vehicles", icon: "truck" },
  { key: "drivers", label: "Drivers", icon: "id" },
  { key: "warehouses", label: "Warehouses", icon: "warehouse" },
  { key: "trips", label: "Trips", icon: "route" },
  { key: "delivery", label: "Deliveries", icon: "check" },
  { key: "pod", label: "POD", icon: "doc" },
  { key: "invoices", label: "Invoices", icon: "invoice" },
  { key: "reports", label: "Reports", icon: "chart" },
  { key: "notifications", label: "Notifications", icon: "bell" },
  { key: "settings", label: "Settings", icon: "settings" },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ open, onClose, role, activeTab, onSelectTab }) {
  const navigate = useNavigate();
  const TAB_PATHS = {
    dashboard: "/dashboard",
    customers: "/customers",
    shipments: "/shipments",
    vehicles: "/vehicles",
    drivers: "/drivers",
    warehouses: "/warehouses",
    trips: "/trips",
    delivery: "/deliveries",
    deliveries: "/deliveries",
    pod: "/pod",
    invoices: "/invoices",
    reports: "/reports",
    notifications: "/notifications",
    notification: "/notifications",
    settings: "/settings",
    setting: "/settings",
  };

  return (
    <>
      {open && <div className="dash-sidebar__overlay" onClick={onClose} />}

      <aside className={"dash-sidebar" + (open ? " dash-sidebar--open" : "")}>
        <div className="dash-sidebar__brand">
          <span className="dash-sidebar__brand-mark">RF</span>
          <span className="dash-sidebar__brand-name">Routeflow</span>
        </div>
        <nav className="dash-sidebar__nav">
          {NAV.filter((item) => canAccess(role, item.key)).map((item) => {
            const label = accessLabel(role, item.key);
            const isActive =
              activeTab === item.key ||
              (item.key === "vehicles" && activeTab === "vechiles") ||
              (item.key === "delivery" && activeTab === "deliveries");
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  if (onSelectTab) onSelectTab(item.key);
                  if (TAB_PATHS[item.key]) {
                    navigate(TAB_PATHS[item.key]);
                  }
                  if (onClose) onClose();
                }}
                className={
                  "dash-sidebar__link" +
                  (isActive ? " dash-sidebar__link--active" : "")
                }
              >
                <Icon name={item.icon} />
                <p>{item.label}</p>
                {label && <span className="dash-sidebar__badge">{label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

// ── Topbar ────────────────────────────────────────────────────────────────────

function Topbar({ title, alertCount, username, role, onMenuClick }) {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoadingNotifications(true);
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Topbar fetch notifications error:", err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNotificationClick = async (n) => {
    setShowNotifications(false);
    const token = localStorage.getItem("token");
    if (!n.read && n._id && token) {
      try {
        await fetch(`${API_BASE_URL}/notifications/${n._id}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications((prev) =>
          prev.map((item) => (item._id === n._id ? { ...item, read: true } : item))
        );
      } catch (err) {
        console.error("Mark notification read error:", err);
      }
    }
    navigate("/notifications");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatRelativeTime = (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${diffDays}d ago`;
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="dash-topbar relative">
      <div className="dash-topbar__left">
        <button
          type="button"
          className="dash-topbar__hamburger"
          aria-label="Toggle menu"
          onClick={onMenuClick}
        >
          <Icon name="menu" />
        </button>
        <h1 className="dash-topbar__title">{title || "Dashboard"}</h1>
      </div>

      <div className="dash-topbar__actions relative">
        {/* <input
          type="search"
          className="dash-topbar__search"
          placeholder="Search shipments, customers, trips…"
        />*/}
        <div className="relative shrink-0">
          <button
            onClick={() => {
              const nextState = !showNotifications;
              setShowNotifications(nextState);
              if (nextState) {
                fetchNotifications();
              }
            }}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-orange-500 rounded-full ring-2 ring-white animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="font-semibold text-sm text-slate-800">
                  Notifications
                </h4>
                <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                  {unreadCount > 0 ? `${unreadCount} New` : "All read"}
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {loadingNotifications ? (
                  <p className="py-4 text-center text-xs text-slate-400">
                    Loading notifications...
                  </p>
                ) : notifications.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">
                    No notifications
                  </p>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n._id || n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`py-2.5 px-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors relative ${
                        !n.read ? "bg-blue-50/40" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs ${
                            !n.read
                              ? "font-bold text-slate-900"
                              : "font-semibold text-slate-700"
                          }`}
                        >
                          {n.type || n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {n.message || n.desc}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 inline-block">
                        {formatRelativeTime(n.createdAt || n.timestamp)}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="pt-2 mt-1 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate("/notifications");
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          id="navbar-create-user-btn"
          onClick={() => navigate("/register-user")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Create User</span>
        </button>
        <div
          className="dash-topbar__profile cursor-pointer"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <div className="dash-topbar__avatar">{username?.[0]}</div>
          <span className="dash-topbar__username">{username}</span>
          {role && (
            <span className="dash-topbar__role">{role.replace(/_/g, " ")}</span>
          )}
        </div>

        {showUserMenu && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs text-slate-700">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="font-semibold text-slate-800 truncate">
                {user?.email || username || "User"}
              </p>
              <p className="text-[11px] text-slate-500 capitalize">
                Role: {role?.replace(/_/g, " ") || "User"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(false);
                navigate("/settings");
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-2 text-slate-700"
            >
              Profile Settings
            </button>
            <div className="border-t border-slate-100 my-1"></div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-2"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Dashboardx({ initialTab = "dashboard" }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role ?? "";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [alertCount] = useState(3);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentNav = NAV.find((item) => item.key === activeTab);

  return (
    <div className="dash-wrap">
      <div className="dash">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          role={role}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />
        <Topbar
          title={currentNav?.label || "Dashboard"}
          alertCount={alertCount}
          username={user?.userName ?? "Unknown"}
          role={role}
          onMenuClick={() => setSidebarOpen((o) => !o)}
        />
        <main className="dash__main">
          {activeTab === "customers" && <DashboardCustomer />}
          {activeTab === "shipments" && <DashboardShipment />}
          {activeTab === "drivers" && <DashboardDriver />}
          {(activeTab === "vehicles" || activeTab === "vechiles") && (
            <DashboardVechiles />
          )}
          {(activeTab === "warehouses" || activeTab === "warehouse") && (
            <DashboardWarehouse />
          )}
          {(activeTab === "trips" || activeTab === "trip") && <DashboardTrip />}
          {(activeTab === "delivery" || activeTab === "deliveries") && (
            <DashboardDelivery />
          )}
          {activeTab === "pod" && <DashboardPod />}
          {(activeTab === "invoices" || activeTab === "invoice") && (
            <DashboardInvoice />
          )}
          {(activeTab === "reports" || activeTab === "report") && (
            <DashboardReport />
          )}
          {(activeTab === "notifications" || activeTab === "notification") && (
            <DashboardNotification />
          )}
          {(activeTab === "settings" || activeTab === "setting") && (
            <DashboardSetting />
          )}
          {activeTab !== "customers" &&
            activeTab !== "shipments" &&
            activeTab !== "drivers" &&
            activeTab !== "vehicles" &&
            activeTab !== "vechiles" &&
            activeTab !== "warehouses" &&
            activeTab !== "warehouse" &&
            activeTab !== "trips" &&
            activeTab !== "trip" &&
            activeTab !== "delivery" &&
            activeTab !== "deliveries" &&
            activeTab !== "pod" &&
            activeTab !== "invoices" &&
            activeTab !== "invoice" &&
            activeTab !== "reports" &&
            activeTab !== "report" &&
            activeTab !== "notifications" &&
            activeTab !== "notification" &&
            activeTab !== "settings" &&
            activeTab !== "setting" && <DashboardOverview />}
        </main>
      </div>
    </div>
  );
}
