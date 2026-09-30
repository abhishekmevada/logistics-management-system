import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Package,
  CheckCircle2,
  Truck,
  User,
  Warehouse,
  MapPin,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import "../../styles/DashboardOverview.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, title, headline, headlineLabel, rows }) {
  return (
    <div className="ov-stat-card ov-panel">
      <div className="ov-stat-card__head">
        <div className="ov-stat-card__icon">{icon}</div>
        <div className="ov-stat-card__title">{title}</div>
      </div>
      <div className="ov-stat-card__headline">
        <span className="ov-stat-card__headline-value">{headline ?? 0}</span>
        <span className="ov-stat-card__headline-label">{headlineLabel}</span>
      </div>
      <ul className="ov-stat-card__rows">
        {rows.map((row) => (
          <li key={row.label} className="ov-stat-card__row">
            <span
              className={
                "ov-stat-card__dot" +
                (row.tone ? ` ov-stat-card__dot--${row.tone}` : "")
              }
            />
            <span className="ov-stat-card__row-label">{row.label}</span>
            <span className="ov-stat-card__row-value">{row.value ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Charts Panel ──────────────────────────────────────────────────────────────

const PIE_COLORS = {
  "On time": "hsl(214, 100%, 60%)",
  Delayed: "#ff8000",
  Failed: "hsl(4, 78%, 52%)",
};

function ChartsPanel({ shipmentVolume = [], deliveryPerformance = [] }) {
  const totalPerf = deliveryPerformance.reduce(
    (acc, curr) => acc + (Number(curr.value) || 0),
    0
  );

  return (
    <div className="ov-charts-panel">
      <div className="ov-panel ov-charts-panel__block">
        <div className="ov-section__title">Shipment volume, this week</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={shipmentVolume}
            margin={{ top: 16, right: 8, left: -18, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="hsl(0, 0%, 90%)" />
            <XAxis
              dataKey="day"
              tick={{ fontFamily: "Roboto, sans-serif", fontSize: 12 }}
              axisLine={{ stroke: "hsl(0, 0%, 80%)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontFamily: "Roboto, sans-serif", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                fontFamily: "Roboto, sans-serif",
                fontSize: 12,
                border: "1px solid hsl(0, 0%, 80%)",
                borderRadius: 6,
              }}
            />
            <Bar
              dataKey="shipments"
              fill="hsl(214, 100%, 60%)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="ov-panel ov-charts-panel__block">
        <div className="ov-section__title">Delivery performance</div>
        <div className="ov-charts-panel__pie-row">
          <ResponsiveContainer width="100%" height={200}>
            {totalPerf > 0 ? (
              <PieChart>
                <Pie
                  data={deliveryPerformance}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={54}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {deliveryPerformance.map((entry) => (
                    <Cell
                      key={entry.label}
                      fill={PIE_COLORS[entry.label] || "#999"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontFamily: "Roboto, sans-serif",
                    fontSize: 12,
                    border: "1px solid hsl(0, 0%, 80%)",
                    borderRadius: 6,
                  }}
                />
              </PieChart>
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted, #888)",
                  fontSize: "12px",
                }}
              >
                No delivery metrics recorded yet
              </div>
            )}
          </ResponsiveContainer>
          <ul className="ov-charts-panel__legend">
            {deliveryPerformance.map((entry) => (
              <li key={entry.label}>
                <span
                  className="ov-charts-panel__legend-dot"
                  style={{ background: PIE_COLORS[entry.label] || "#999" }}
                />
                {entry.label}
                <span className="ov-charts-panel__legend-value">
                  {entry.value ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Alerts Panel ──────────────────────────────────────────────────────────────

const ALERT_CONFIG = {
  failedDelivery: {
    icon: AlertTriangle,
    tone: "danger",
    iconColor: "hsl(4, 78%, 52%)",
  },
  documentExpiry: {
    icon: Clock,
    tone: "warning",
    iconColor: "#d97706",
  },
  dispatch: {
    icon: Truck,
    tone: "info",
    iconColor: "hsl(214, 100%, 60%)",
  },
};

function AlertsPanel({ alerts = [] }) {
  return (
    <div className="ov-panel ov-alerts-panel">
      <div className="ov-section__title">Alerts</div>
      {alerts && alerts.length > 0 ? (
        <ul className="ov-alerts-panel__list">
          {alerts.map((alert) => {
            const config = ALERT_CONFIG[alert.type] || {
              icon: AlertCircle,
              tone: "info",
              iconColor: "hsl(214, 100%, 60%)",
            };
            const AlertIcon = config.icon;
            return (
              <li key={alert.id} className="ov-alerts-panel__item">
                <span
                  className={`ov-alerts-panel__icon-badge ov-alerts-panel__icon-badge--${config.tone}`}
                >
                  <AlertIcon size={13} color={config.iconColor} />
                </span>
                <div>
                  <p className="ov-alerts-panel__message">{alert.message}</p>
                  <span className="ov-alerts-panel__time">{alert.time}</span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div
          style={{
            padding: "24px 0",
            color: "#64748b",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 size={16} color="#16a34a" />
          <span>All operational systems running normally. No active alerts.</span>
        </div>
      )}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function DashboardOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState("");
  const navigate = useNavigate();

  const fetchOverview = useCallback(
    async (isManualRefresh = false) => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const res = await fetch(`${API_BASE_URL}/dashboard/overview`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(
            json.message || "Failed to load dashboard overview data"
          );
        }

        setData(json.data);
        const dt = new Date();
        setLastUpdatedTime(
          dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        );
      } catch (err) {
        console.error("Dashboard overview fetch error:", err);
        setError(err.message || "Could not connect to backend server");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (loading && !data) {
    return (
      <main
        className="ov-main"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
          gap: "12px",
        }}
      >
        <RefreshCw
          className="w-8 h-8"
          style={{
            color: "hsl(214, 100%, 60%)",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>
          Loading operations overview…
        </p>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="ov-main" style={{ padding: "24px 0" }}>
        <div
          className="ov-panel"
          style={{
            textAlign: "center",
            padding: "48px 24px",
            maxWidth: "480px",
            margin: "0 auto",
          }}
        >
          <AlertCircle
            size={40}
            color="#ef4444"
            style={{ margin: "0 auto 14px" }}
          />
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Failed to load overview data
          </h3>
          <p
            style={{
              fontSize: "13px",
              color: "#64748b",
              marginBottom: "20px",
            }}
          >
            {error}
          </p>
          <button
            onClick={() => fetchOverview(false)}
            style={{
              padding: "8px 20px",
              background: "hsl(214, 100%, 60%)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontWeight: 500,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Retry Connection
          </button>
        </div>
      </main>
    );
  }

  const {
    shipments = { total: 0, pending: 0, inTransit: 0, delivered: 0, failed: 0 },
    deliveries = { today: 0, completed: 0, pending: 0 },
    fleet = { total: 0, available: 0, assigned: 0 },
    drivers = { available: 0, assigned: 0, workload: 0 },
    warehouse = { inbound: 0, outbound: 0, storageUsedPct: 0 },
    trips = { today: 0, active: 0, completed: 0 },
    shipmentVolume = [],
    deliveryPerformance = [],
    alerts = [],
  } = data || {};

  return (
    <main className="ov-main">
      <section>
        <div className="ov-section-head">
          <span className="ov-section__title">Operations overview</span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="ov-section-hint">
              {lastUpdatedTime
                ? `Updated at ${lastUpdatedTime}`
                : "Updated moments ago"}
            </span>
            <button
              type="button"
              onClick={() => fetchOverview(true)}
              disabled={refreshing}
              title="Refresh dashboard metrics"
              style={{
                background: "var(--surface, #fff)",
                border: "1px solid var(--border, #e2e8f0)",
                borderRadius: "6px",
                padding: "5px 10px",
                cursor: refreshing ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--color, #0f172a)",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              <RefreshCw
                size={13}
                style={{
                  animation: refreshing ? "spin 1s linear infinite" : "none",
                }}
              />
              <span>{refreshing ? "Refreshing…" : "Refresh"}</span>
            </button>
          </div>
        </div>
        <div className="ov-kpi-grid">
          <StatCard
            icon={<Package size={17} />}
            title="Shipments"
            headline={shipments.total}
            headlineLabel="total shipments"
            rows={[
              { label: "Pending", value: shipments.pending, tone: "warning" },
              { label: "In transit", value: shipments.inTransit, tone: "info" },
              {
                label: "Delivered",
                value: shipments.delivered,
                tone: "success",
              },
              { label: "Failed", value: shipments.failed, tone: "danger" },
            ]}
          />
          <StatCard
            icon={<CheckCircle2 size={17} />}
            title="Deliveries"
            headline={deliveries.today}
            headlineLabel="deliveries today"
            rows={[
              {
                label: "Completed",
                value: deliveries.completed,
                tone: "success",
              },
              { label: "Pending", value: deliveries.pending, tone: "warning" },
            ]}
          />
          <StatCard
            icon={<Truck size={17} />}
            title="Fleet"
            headline={fleet.total}
            headlineLabel="total vehicles"
            rows={[
              { label: "Available", value: fleet.available, tone: "success" },
              { label: "Assigned", value: fleet.assigned, tone: "info" },
            ]}
          />
          <StatCard
            icon={<User size={17} />}
            title="Drivers"
            headline={drivers.available}
            headlineLabel="available now"
            rows={[
              { label: "Assigned", value: drivers.assigned, tone: "info" },
              {
                label: "Workload",
                value: `${drivers.workload}%`,
                tone: "warning",
              },
            ]}
          />
        </div>
      </section>

      <section>
        <div className="ov-kpi-grid">
          <StatCard
            icon={<Warehouse size={17} />}
            title="Warehouse"
            headline={`${warehouse.storageUsedPct}%`}
            headlineLabel="storage in use"
            rows={[
              {
                label: "Inbound packages",
                value: warehouse.inbound,
                tone: "info",
              },
              {
                label: "Outbound packages",
                value: warehouse.outbound,
                tone: "success",
              },
            ]}
          />
          <StatCard
            icon={<MapPin size={17} />}
            title="Trips"
            headline={trips.today}
            headlineLabel="trips today"
            rows={[
              { label: "Active", value: trips.active, tone: "info" },
              { label: "Completed", value: trips.completed, tone: "success" },
            ]}
          />
        </div>
      </section>

      <section>
        <div className="ov-section-head">
          <span className="ov-section__title">Reports</span>
        </div>
        <div className="ov-two-col">
          <ChartsPanel
            shipmentVolume={shipmentVolume}
            deliveryPerformance={deliveryPerformance}
          />
          <AlertsPanel alerts={alerts} />
        </div>
      </section>
    </main>
  );
}
