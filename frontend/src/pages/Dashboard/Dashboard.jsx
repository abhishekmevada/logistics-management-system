import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import "../../styles/Dashboard.css";
import DashboardOverview from "./Dashboardoverview";
import DashboardCustomer from "./DashboardCustomer";
import DashboardShipment from "./DashboardShipment";
import DashboardVechiles from "./DashboardVechicles";
import { canAccess, accessLabel } from "../../utils/rolePermissions";
import DashboardDriver from "./DashboardDriver";

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
              (item.key === "vehicles" && activeTab === "vechiles");
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
  return (
    <header className="dash-topbar">
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

      <div className="dash-topbar__actions">
        <input
          type="search"
          className="dash-topbar__search"
          placeholder="Search shipments, customers, trips…"
        />
        <button
          type="button"
          className="dash-topbar__icon-btn"
          aria-label="Notifications"
        >
          <Icon name="bell" />
          {alertCount > 0 && (
            <span className="dash-topbar__badge">{alertCount}</span>
          )}
        </button>
        <button
          type="button"
          id="navbar-create-user-btn"
          onClick={() => navigate("/register-user")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Create User</span>
        </button>
        <div className="dash-topbar__profile">
          <div className="dash-topbar__avatar">{username?.[0]}</div>
          <span className="dash-topbar__username">{username}</span>
          {role && (
            <span className="dash-topbar__role">{role.replace(/_/g, " ")}</span>
          )}
        </div>
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
          {activeTab !== "customers" &&
            activeTab !== "shipments" &&
            activeTab !== "drivers" &&
            activeTab !== "vehicles" &&
            activeTab !== "vechiles" && <DashboardOverview />}
        </main>
      </div>
    </div>
  );
}
