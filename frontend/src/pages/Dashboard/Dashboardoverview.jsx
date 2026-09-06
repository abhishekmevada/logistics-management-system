import { useEffect, useState } from "react";
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
import "../../styles/DashboardOverview.css";

const dashboardMockData = {
  shipments: {
    total: 1284,
    pending: 96,
    inTransit: 214,
    delivered: 918,
    failed: 56,
  },
  deliveries: { today: 63, completed: 47, pending: 16 },
  fleet: { total: 48, available: 19, assigned: 29 },
  drivers: { available: 14, assigned: 27, workload: 66 },
  warehouse: { inbound: 132, outbound: 98, storageUsedPct: 71 },
  trips: { today: 22, active: 9, completed: 13 },
  shipmentVolume: [
    { day: "Mon", shipments: 142 },
    { day: "Tue", shipments: 168 },
    { day: "Wed", shipments: 155 },
    { day: "Thu", shipments: 190 },
    { day: "Fri", shipments: 204 },
    { day: "Sat", shipments: 121 },
    { day: "Sun", shipments: 88 },
  ],
  deliveryPerformance: [
    { label: "On time", value: 802 },
    { label: "Delayed", value: 116 },
    { label: "Failed", value: 56 },
  ],
  alerts: [
    {
      id: "a1",
      type: "failedDelivery",
      message: "Shipment #TRK-48213 failed delivery — receiver unavailable",
      time: "12 min ago",
    },
    {
      id: "a2",
      type: "documentExpiry",
      message: "Driver license for R. Mehta expires in 5 days",
      time: "1 hr ago",
    },
    {
      id: "a3",
      type: "documentExpiry",
      message: "Insurance for vehicle MH-12-AB-4521 expires in 9 days",
      time: "3 hr ago",
    },
    {
      id: "a4",
      type: "dispatch",
      message: "Trip #TRP-1092 dispatched from Pune Warehouse",
      time: "5 hr ago",
    },
  ],
};

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, title, headline, headlineLabel, rows }) {
  return (
    <div className="ov-stat-card ov-panel">
      <div className="ov-stat-card__head">
        <div className="ov-stat-card__icon">{icon}</div>
        <div className="ov-stat-card__title">{title}</div>
      </div>
      <div className="ov-stat-card__headline">
        <span className="ov-stat-card__headline-value">{headline}</span>
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
            <span className="ov-stat-card__row-value">{row.value}</span>
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

function ChartsPanel({ shipmentVolume, deliveryPerformance }) {
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
                  {entry.value}
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

const TONE_BY_TYPE = {
  failedDelivery: "danger",
  documentExpiry: "warning",
  dispatch: "info",
};

function AlertsPanel({ alerts }) {
  return (
    <div className="ov-panel ov-alerts-panel">
      <div className="ov-section__title">Alerts</div>
      <ul className="ov-alerts-panel__list">
        {alerts.map((alert) => (
          <li key={alert.id} className="ov-alerts-panel__item">
            <span
              className={`ov-alerts-panel__dot ov-alerts-panel__dot--${
                TONE_BY_TYPE[alert.type] || "info"
              }`}
            />
            <div>
              <p className="ov-alerts-panel__message">{alert.message}</p>
              <span className="ov-alerts-panel__time">{alert.time}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function DashboardOverview() {
  const [data, setData] = useState(null);
  useEffect(() => setData(dashboardMockData), []);
  if (!data) return null;

  const {
    shipments,
    deliveries,
    fleet,
    drivers,
    warehouse,
    trips,
    shipmentVolume,
    deliveryPerformance,
    alerts,
  } = data;

  return (
    <main className="ov-main">
      <section>
        <div className="ov-section-head">
          <span className="ov-section__title">Operations overview</span>
          <span className="ov-section-hint">Updated moments ago</span>
        </div>
        <div className="ov-kpi-grid">
          <StatCard
            icon="📦"
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
            icon="✅"
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
            icon="🚚"
            title="Fleet"
            headline={fleet.total}
            headlineLabel="total vehicles"
            rows={[
              { label: "Available", value: fleet.available, tone: "success" },
              { label: "Assigned", value: fleet.assigned, tone: "info" },
            ]}
          />
          <StatCard
            icon="🪪"
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
            icon="🏭"
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
            icon="🗺️"
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
