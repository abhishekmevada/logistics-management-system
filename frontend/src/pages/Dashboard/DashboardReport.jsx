import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Filter,
  RotateCcw,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  User,
  Package,
  Warehouse,
  Printer,
  ChevronDown,
  Search,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import "../../styles/DashboardReport.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Helper for safe badge CSS classes
const getBadgeClass = (statusOrType, defaultVal = "default") => {
  const val = (statusOrType || defaultVal)
    .toString()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return `rpt-badge rpt-badge--${val}`;
};

// ── Report Type Options ───────────────────────────────────────────────────────

const REPORT_OPTIONS = [
  { value: "shipment", label: "Shipment Report" },
  { value: "delivery", label: "Delivery Report" },
  { value: "customer", label: "Customer-wise Shipment Report" },
  { value: "driver", label: "Driver Performance Report" },
  { value: "vehicle", label: "Vehicle Utilization Report" },
  { value: "warehouse", label: "Warehouse Activity Report" },
  { value: "trip", label: "Trip Report" },
  { value: "invoice", label: "Invoice/Billing Report" },
  { value: "failed_delivery", label: "Failed Delivery Report" },
  { value: "summary", label: "Monthly & Yearly Operational Summary" },
];

// ── Dropdown Choices Default ─────────────────────────────────────────────────

const DEFAULT_OPTIONS = ["All"];

const MONTHS = [
  "All Months",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const YEARS = ["2026", "2025", "2024", "2023"];

// ── Main Component ────────────────────────────────────────────────────────────

export default function DashboardReport() {
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState("shipment");

  // Common Date Filter States
  const [fromDate, setFromDate] = useState("2026-09-01");
  const [toDate, setToDate] = useState("2026-10-31");

  // Dynamic Filter States
  const [customerFilter, setCustomerFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [driverFilter, setDriverFilter] = useState("All");
  const [vehicleFilter, setVehicleFilter] = useState("All");
  const [warehouseFilter, setWarehouseFilter] = useState("All");
  const [activityTypeFilter, setActivityTypeFilter] = useState("All");
  const [tripStatusFilter, setTripStatusFilter] = useState("All");
  const [originFilter, setOriginFilter] = useState("All");
  const [destFilter, setDestFilter] = useState("All");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("All");
  const [failureReasonFilter, setFailureReasonFilter] = useState("All");
  const [reattemptFilter, setReattemptFilter] = useState("All");

  // Operational Summary Filter States
  const [periodType, setPeriodType] = useState("Monthly");
  const [summaryYear, setSummaryYear] = useState("2026");
  const [summaryMonth, setSummaryMonth] = useState("September");

  // Dynamic dropdown options (populated from API)
  const [customerOptions, setCustomerOptions] = useState(DEFAULT_OPTIONS);
  const [driverOptions, setDriverOptions] = useState(DEFAULT_OPTIONS);
  const [vehicleOptions, setVehicleOptions] = useState(DEFAULT_OPTIONS);
  const [warehouseOptions, setWarehouseOptions] = useState(DEFAULT_OPTIONS);

  // Backend Integration States (Store all 10 reports at once)
  const [allReports, setAllReports] = useState({
    shipment: [],
    delivery: [],
    customer: [],
    driver: [],
    vehicle: [],
    warehouse: [],
    trip: [],
    invoice: [],
    failed_delivery: [],
    summary: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Toast State
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch All Reports from Backend API at Once ──────────────────────────────
  const fetchReport = useCallback(
    async (isManual = false) => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/report`, {
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
          throw new Error(json.message || "Failed to load report data");
        }

        if (json.options) {
          if (json.options.customers)
            setCustomerOptions(json.options.customers);
          if (json.options.drivers) setDriverOptions(json.options.drivers);
          if (json.options.vehicles) setVehicleOptions(json.options.vehicles);
          if (json.options.warehouses)
            setWarehouseOptions(json.options.warehouses);
        }

        if (json.reports) {
          setAllReports(json.reports);
        } else if (json.data) {
          setAllReports((prev) => ({
            ...prev,
            [selectedReport]: json.data,
          }));
        }

        if (isManual) {
          const currentName =
            REPORT_OPTIONS.find((r) => r.value === selectedReport)?.label || "Report";
          const currentCount =
            (json.reports && json.reports[selectedReport]?.length) ||
            json.data?.length ||
            0;
          showToast(
            `${currentName} generated with ${currentCount} record(s).`,
          );
        }
      } catch (err) {
        console.error("Report fetch error:", err);
        setError(err.message || "Failed to connect to backend server");
        showToast("Error loading report from server.");
      } finally {
        setLoading(false);
      }
    },
    [selectedReport, navigate],
  );

  // Auto-fetch complete reports from backend on mount
  useEffect(() => {
    fetchReport(false);
  }, [fetchReport]);

  // Switch report type instantly and reset specific filters
  const handleReportChange = (nextReport) => {
    setSelectedReport(nextReport);
    setCustomerFilter("All");
    setStatusFilter("All");
    setDriverFilter("All");
    setVehicleFilter("All");
    setWarehouseFilter("All");
    setActivityTypeFilter("All");
    setTripStatusFilter("All");
    setOriginFilter("All");
    setDestFilter("All");
    setInvoiceStatusFilter("All");
    setFailureReasonFilter("All");
    setReattemptFilter("All");
  };

  // Reset all filters to default
  const handleReset = () => {
    setFromDate("2026-09-01");
    setToDate("2026-10-31");
    setCustomerFilter("All");
    setStatusFilter("All");
    setDriverFilter("All");
    setVehicleFilter("All");
    setWarehouseFilter("All");
    setActivityTypeFilter("All");
    setTripStatusFilter("All");
    setOriginFilter("All");
    setDestFilter("All");
    setInvoiceStatusFilter("All");
    setFailureReasonFilter("All");
    setReattemptFilter("All");
    setPeriodType("Monthly");
    setSummaryYear("2026");
    setSummaryMonth("September");
    showToast("Filters reset to default.");
  };

  // Generate Report action
  const handleGenerate = (e) => {
    e.preventDefault();
    fetchReport(true);
  };

  // ── FILTERING ENGINE ────────────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    const rawList = (allReports && allReports[selectedReport]) || [];

    return rawList.filter((item) => {
      // 1. Date Range Filter
      if (selectedReport !== "summary") {
        const itemDate =
          item.date ||
          item.deliveryDate ||
          item.lastDate ||
          (item.time ? item.time.substring(0, 10) : null) ||
          item.reattemptDate;

        if (itemDate && itemDate !== "Pending" && itemDate !== "N/A") {
          const cleanDate = itemDate.substring(0, 10);
          if (fromDate && cleanDate < fromDate) return false;
          if (toDate && cleanDate > toDate) return false;
        }
      }

      // 2. Report Specific Filters
      switch (selectedReport) {
        case "shipment": {
          if (customerFilter !== "All" && item.customer !== customerFilter) {
            return false;
          }
          if (
            statusFilter !== "All" &&
            (item.status || "").toLowerCase() !== statusFilter.toLowerCase()
          ) {
            return false;
          }
          if (driverFilter !== "All" && item.driver !== driverFilter) {
            return false;
          }
          if (
            vehicleFilter !== "All" &&
            !item.vehicle?.includes(vehicleFilter) &&
            !vehicleFilter.includes(item.vehicle || "")
          ) {
            return false;
          }
          return true;
        }

        case "delivery": {
          if (customerFilter !== "All" && item.customer !== customerFilter) {
            return false;
          }
          if (driverFilter !== "All" && item.driver !== driverFilter) {
            return false;
          }
          if (
            statusFilter !== "All" &&
            item.status?.toLowerCase() !== statusFilter.toLowerCase()
          ) {
            return false;
          }
          return true;
        }

        case "customer": {
          if (customerFilter !== "All" && item.customer !== customerFilter) {
            return false;
          }
          if (statusFilter !== "All") {
            const sf = statusFilter.toLowerCase();
            if (sf.includes("transit") && (item.inTransit || 0) === 0)
              return false;
            if (sf.includes("delivered") && (item.delivered || 0) === 0)
              return false;
            if (sf.includes("failed") && (item.failed || 0) === 0) return false;
          }
          return true;
        }

        case "driver": {
          if (driverFilter !== "All" && item.driverName !== driverFilter) {
            return false;
          }
          if (
            statusFilter !== "All" &&
            item.status?.toLowerCase() !== statusFilter.toLowerCase() &&
            item.availability?.toLowerCase() !== statusFilter.toLowerCase()
          ) {
            return false;
          }
          return true;
        }

        case "vehicle": {
          if (
            vehicleFilter !== "All" &&
            !item.vehicleNo?.includes(vehicleFilter) &&
            !vehicleFilter.includes(item.vehicleNo || "")
          ) {
            return false;
          }
          if (
            statusFilter !== "All" &&
            item.status?.toLowerCase() !== statusFilter.toLowerCase()
          ) {
            return false;
          }
          return true;
        }

        case "warehouse": {
          if (
            warehouseFilter !== "All" &&
            !item.warehouse
              ?.toLowerCase()
              .includes(warehouseFilter.split(" ")[0].toLowerCase()) &&
            !warehouseFilter
              .toLowerCase()
              .includes(item.warehouse?.toLowerCase() || "")
          ) {
            return false;
          }
          if (
            activityTypeFilter !== "All" &&
            item.type?.toLowerCase() !== activityTypeFilter.toLowerCase()
          ) {
            return false;
          }
          return true;
        }

        case "trip": {
          if (driverFilter !== "All" && item.driver !== driverFilter) {
            return false;
          }
          if (
            vehicleFilter !== "All" &&
            !item.vehicle?.includes(vehicleFilter) &&
            !vehicleFilter.includes(item.vehicle || "")
          ) {
            return false;
          }
          if (
            tripStatusFilter !== "All" &&
            item.status?.toLowerCase() !== tripStatusFilter.toLowerCase()
          ) {
            return false;
          }
          if (
            originFilter !== "All" &&
            item.origin?.toLowerCase() !== originFilter.toLowerCase()
          ) {
            return false;
          }
          if (
            destFilter !== "All" &&
            item.destination?.toLowerCase() !== destFilter.toLowerCase()
          ) {
            return false;
          }
          return true;
        }

        case "invoice": {
          if (customerFilter !== "All" && item.customer !== customerFilter) {
            return false;
          }
          if (
            invoiceStatusFilter !== "All" &&
            item.status?.toLowerCase() !== invoiceStatusFilter.toLowerCase()
          ) {
            return false;
          }
          return true;
        }

        case "failed_delivery": {
          if (customerFilter !== "All" && item.customer !== customerFilter) {
            return false;
          }
          if (driverFilter !== "All" && item.driver !== driverFilter) {
            return false;
          }
          if (
            failureReasonFilter !== "All" &&
            !item.reason
              ?.toLowerCase()
              .includes(failureReasonFilter.toLowerCase())
          ) {
            return false;
          }
          if (
            reattemptFilter !== "All" &&
            !item.status?.toLowerCase().includes(reattemptFilter.toLowerCase())
          ) {
            return false;
          }
          return true;
        }

        case "summary": {
          if (item.periodType !== periodType) return false;
          if (summaryYear && item.year !== summaryYear) return false;
          if (
            periodType === "Monthly" &&
            summaryMonth &&
            summaryMonth !== "All" &&
            summaryMonth !== "All Months" &&
            item.month !== "All" &&
            item.month !== summaryMonth
          ) {
            return false;
          }
          return true;
        }

        default:
          return true;
      }
    });
  }, [
    selectedReport,
    fromDate,
    toDate,
    customerFilter,
    statusFilter,
    driverFilter,
    vehicleFilter,
    warehouseFilter,
    activityTypeFilter,
    tripStatusFilter,
    originFilter,
    destFilter,
    invoiceStatusFilter,
    failureReasonFilter,
    reattemptFilter,
    periodType,
    summaryYear,
    summaryMonth,
    allReports,
  ]);

  // ── DYNAMIC SUMMARY KPI STATS (Calculated from filtered records) ─────────────
  const dynamicKPIs = useMemo(() => {
    const rows = filteredRows;
    const count = rows.length;

    switch (selectedReport) {
      case "shipment": {
        const delivered = rows.filter((r) => r.status === "Delivered").length;
        const inTransit = rows.filter(
          (r) =>
            r.status === "In Transit" ||
            r.status === "Dispatched" ||
            r.status === "Out for Delivery",
        ).length;
        const pending = rows.filter(
          (r) =>
            r.status === "Created" ||
            r.status === "Pickup Scheduled" ||
            r.status === "Picked Up" ||
            r.status === "At Warehouse",
        ).length;
        const failed = rows.filter(
          (r) => r.status === "Failed Delivery",
        ).length;
        return [
          { label: "Total", value: count, tone: "" },
          { label: "Delivered", value: delivered, tone: "success" },
          { label: "In Transit", value: inTransit, tone: "info" },
          { label: "Pending", value: pending, tone: "warning" },
          { label: "Failed", value: failed, tone: "danger" },
        ];
      }

      case "delivery": {
        const delivered = rows.filter((r) => r.status === "Delivered").length;
        const outForDel = rows.filter(
          (r) => r.status === "Out for Delivery",
        ).length;
        const reattempts = rows.filter(
          (r) => r.status === "Re-attempt Scheduled",
        ).length;
        const failed = rows.filter((r) => r.status === "Failed").length;
        return [
          { label: "Total Deliveries", value: count, tone: "" },
          { label: "Delivered", value: delivered, tone: "success" },
          { label: "Out for Delivery", value: outForDel, tone: "info" },
          { label: "Re-attempts", value: reattempts, tone: "warning" },
          { label: "Failed", value: failed, tone: "danger" },
        ];
      }

      case "customer": {
        const totalBookings = rows.reduce(
          (acc, r) => acc + (r.totalBookings || 0),
          0,
        );
        const delivered = rows.reduce((acc, r) => acc + (r.delivered || 0), 0);
        const inTransit = rows.reduce((acc, r) => acc + (r.inTransit || 0), 0);
        return [
          { label: "Active Customers", value: count, tone: "info" },
          { label: "Total Bookings", value: totalBookings, tone: "" },
          { label: "Delivered", value: delivered, tone: "success" },
          { label: "In Transit", value: inTransit, tone: "info" },
        ];
      }

      case "driver": {
        const totalAssigned = rows.reduce(
          (acc, r) => acc + (r.assigned || 0),
          0,
        );
        const totalCompleted = rows.reduce(
          (acc, r) => acc + (r.completed || 0),
          0,
        );
        const rate =
          totalAssigned > 0
            ? `${Math.round((totalCompleted / totalAssigned) * 100)}%`
            : "100%";
        return [
          { label: "Drivers Count", value: count, tone: "info" },
          { label: "Total Assigned", value: totalAssigned, tone: "" },
          {
            label: "Completed Deliveries",
            value: totalCompleted,
            tone: "success",
          },
          { label: "Avg On-Time Rate", value: rate, tone: "warning" },
        ];
      }

      case "vehicle": {
        const assigned = rows.filter(
          (r) => r.status === "Assigned" || r.status === "Available",
        ).length;
        const inMaint = rows.filter(
          (r) => r.status === "In Maintenance",
        ).length;
        const totalTrips = rows.reduce((acc, r) => acc + (r.trips || 0), 0);
        return [
          { label: "Vehicles Selected", value: count, tone: "" },
          { label: "Active/Assigned", value: assigned, tone: "info" },
          { label: "In Maintenance", value: inMaint, tone: "warning" },
          { label: "Total Trips Run", value: totalTrips, tone: "success" },
        ];
      }

      case "warehouse": {
        const inbound = rows.filter((r) => r.type === "Inbound").length;
        const storage = rows.filter((r) => r.type === "Storage").length;
        const outbound = rows.filter((r) => r.type === "Outbound").length;
        return [
          { label: "Total Transactions", value: count, tone: "" },
          { label: "Inbound Packages", value: inbound, tone: "info" },
          { label: "Storage Placements", value: storage, tone: "warning" },
          { label: "Outbound Dispatches", value: outbound, tone: "success" },
        ];
      }

      case "trip": {
        const inTransit = rows.filter(
          (r) => r.status === "In Transit" || r.status === "Dispatched",
        ).length;
        const completed = rows.filter((r) => r.status === "Completed").length;
        const planned = rows.filter((r) => r.status === "Planned").length;
        return [
          { label: "Total Trips", value: count, tone: "" },
          { label: "In Transit / Dispatched", value: inTransit, tone: "info" },
          { label: "Completed", value: completed, tone: "success" },
          { label: "Planned", value: planned, tone: "warning" },
        ];
      }

      case "invoice": {
        const paidCount = rows.filter((r) => r.status === "Paid").length;
        const pendingCount = rows.filter((r) => r.status === "Pending").length;
        const overdueCount = rows.filter((r) => r.status === "Overdue").length;
        const totalAmount = rows.reduce(
          (acc, r) => acc + (r.amountVal || 0),
          0,
        );
        return [
          { label: "Invoices Count", value: count, tone: "" },
          {
            label: "Total Value",
            value: `₹${totalAmount.toLocaleString()}`,
            tone: "info",
          },
          { label: "Paid", value: paidCount, tone: "success" },
          { label: "Pending", value: pendingCount, tone: "warning" },
          { label: "Overdue", value: overdueCount, tone: "danger" },
        ];
      }

      case "failed_delivery": {
        const unavail = rows.filter((r) =>
          (r.reason || "").toLowerCase().includes("unavailable"),
        ).length;
        const address = rows.filter((r) =>
          (r.reason || "").toLowerCase().includes("address"),
        ).length;
        const reattempts = rows.filter((r) =>
          (r.status || "").toLowerCase().includes("re-attempt"),
        ).length;
        return [
          { label: "Total Failed", value: count, tone: "danger" },
          { label: "Customer Unavailable", value: unavail, tone: "warning" },
          { label: "Address Issues", value: address, tone: "warning" },
          { label: "Re-attempts Scheduled", value: reattempts, tone: "info" },
        ];
      }

      case "summary": {
        const totalShipments = rows.reduce(
          (acc, r) => acc + (r.shipments || 0),
          0,
        );
        const totalOnTime = rows.reduce((acc, r) => acc + (r.onTime || 0), 0);
        return [
          { label: "Periods Evaluated", value: count, tone: "" },
          { label: "Total Shipments", value: totalShipments, tone: "info" },
          {
            label: "Total On-Time Deliveries",
            value: totalOnTime,
            tone: "success",
          },
        ];
      }

      default:
        return [{ label: "Total Records", value: count, tone: "" }];
    }
  }, [filteredRows, selectedReport]);

  // Export CSV / Excel file
  const handleExportExcel = () => {
    if (!filteredRows.length) {
      showToast("No data to export for current filter criteria.");
      return;
    }
    const headers = Object.keys(filteredRows[0]).join(",");
    const rows = filteredRows
      .map((obj) => Object.values(obj).join(","))
      .join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedReport}_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Excel/CSV export downloaded successfully.");
  };

  // Export PDF simulation / Print
  const handleExportPDF = () => {
    window.print();
  };

  const reportLabel = useMemo(() => {
    return (
      REPORT_OPTIONS.find((r) => r.value === selectedReport)?.label || "Report"
    );
  }, [selectedReport]);

  return (
    <div className="rpt-container">
      {/* Report table readability overrides: show complete cell content */}
      <style>{`
        .rpt-table-container {
          width: 100%;
          max-width: 100%;
          overflow-x: auto !important;
          overflow-y: visible !important;
          -webkit-overflow-scrolling: touch;
        }

        .rpt-table-container .rpt-table {
          width: 100% !important;
          min-width: 1200px !important;
          table-layout: auto !important;
          border-collapse: collapse;
        }

        .rpt-table-container .rpt-table th,
        .rpt-table-container .rpt-table td {
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
          vertical-align: top;
          max-width: none !important;
          height: auto !important;
        }

        .rpt-table-container .rpt-table tbody td {
          line-height: 1.45;
        }

        .rpt-table-container .rpt-table td .rpt-badge {
          white-space: nowrap !important;
        }
      `}</style>
      {/* ── TOP PANEL: Reports & Analytics Filter Box (Matching Wireframe) ── */}
      <section className="rpt-panel">
        <div className="rpt-header">
          <h2 className="rpt-title">
            <FileText size={20} color="hsl(214, 100%, 60%)" />
            Reports & Analytics
          </h2>
          <p className="rpt-subtitle">
            Configure reporting parameters and generate on-demand operational
            intelligence.
          </p>
        </div>

        <form onSubmit={handleGenerate}>
          {/* Report Type Selector */}
          <div className="rpt-form-group">
            <label className="rpt-label" htmlFor="reportTypeSelect">
              Report Type
            </label>
            <select
              id="reportTypeSelect"
              className="rpt-select rpt-select-main"
              value={selectedReport}
              onChange={(e) => handleReportChange(e.target.value)}
            >
              {REPORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* ── DYNAMIC REPORT-SPECIFIC FILTERS ────────────────────────────── */}
          {selectedReport === "summary" ? (
            /* Monthly & Yearly Operational Summary Filters */
            <div className="rpt-filters-grid">
              <div className="rpt-filter-item">
                <label className="rpt-label">Period Type</label>
                <select
                  className="rpt-select"
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value)}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>

              <div className="rpt-filter-item">
                <label className="rpt-label">Year</label>
                <select
                  className="rpt-select"
                  value={summaryYear}
                  onChange={(e) => setSummaryYear(e.target.value)}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {periodType === "Monthly" && (
                <div className="rpt-filter-item">
                  <label className="rpt-label">Month</label>
                  <select
                    className="rpt-select"
                    value={summaryMonth}
                    onChange={(e) => setSummaryMonth(e.target.value)}
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : (
            /* Standard Filters Grid */
            <div className="rpt-filters-grid">
              {/* Date From */}
              <div className="rpt-filter-item">
                <label className="rpt-label">From Date</label>
                <input
                  type="date"
                  className="rpt-input"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              {/* Date To */}
              <div className="rpt-filter-item">
                <label className="rpt-label">To Date</label>
                <input
                  type="date"
                  className="rpt-input"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              {/* 1. Shipment Report Specifics */}
              {selectedReport === "shipment" && (
                <>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Status</label>
                    <select
                      className="rpt-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">All</option>
                      <option value="Created">Created</option>
                      <option value="Pickup Scheduled">Pickup Scheduled</option>
                      <option value="Picked Up">Picked Up</option>
                      <option value="At Warehouse">At Warehouse</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Failed Delivery">Failed Delivery</option>
                    </select>
                  </div>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Customer</label>
                    <select
                      className="rpt-select"
                      value={customerFilter}
                      onChange={(e) => setCustomerFilter(e.target.value)}
                    >
                      {customerOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Driver</label>
                    <select
                      className="rpt-select"
                      value={driverFilter}
                      onChange={(e) => setDriverFilter(e.target.value)}
                    >
                      {driverOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Vehicle</label>
                    <select
                      className="rpt-select"
                      value={vehicleFilter}
                      onChange={(e) => setVehicleFilter(e.target.value)}
                    >
                      {vehicleOptions.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* 2. Delivery Report Specifics */}
              {selectedReport === "delivery" && (
                <>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Customer</label>
                    <select
                      className="rpt-select"
                      value={customerFilter}
                      onChange={(e) => setCustomerFilter(e.target.value)}
                    >
                      {customerOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Driver</label>
                    <select
                      className="rpt-select"
                      value={driverFilter}
                      onChange={(e) => setDriverFilter(e.target.value)}
                    >
                      {driverOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Delivery Status</label>
                    <select
                      className="rpt-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">All</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Failed">Failed</option>
                      <option value="Re-attempt Scheduled">
                        Re-attempt Scheduled
                      </option>
                    </select>
                  </div>
                </>
              )}

              {/* 3. Customer-wise Shipment Report Specifics */}
              {selectedReport === "customer" && (
                <>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Customer</label>
                    <select
                      className="rpt-select"
                      value={customerFilter}
                      onChange={(e) => setCustomerFilter(e.target.value)}
                    >
                      {customerOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Shipment Status</label>
                    <select
                      className="rpt-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">All</option>
                      <option value="Created">Created</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                </>
              )}

              {/* 4. Driver Performance Report Specifics */}
              {selectedReport === "driver" && (
                <>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Driver</label>
                    <select
                      className="rpt-select"
                      value={driverFilter}
                      onChange={(e) => setDriverFilter(e.target.value)}
                    >
                      {driverOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Delivery Status</label>
                    <select
                      className="rpt-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">All</option>
                      <option value="Active">Active</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Failed">Failed</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </>
              )}

              {/* 5. Vehicle Utilization Report Specifics */}
              {selectedReport === "vehicle" && (
                <>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Vehicle</label>
                    <select
                      className="rpt-select"
                      value={vehicleFilter}
                      onChange={(e) => setVehicleFilter(e.target.value)}
                    >
                      {vehicleOptions.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Vehicle Status</label>
                    <select
                      className="rpt-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">All</option>
                      <option value="Available">Available</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Maintenance">In Maintenance</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </>
              )}

              {/* 6. Warehouse Activity Report Specifics */}
              {selectedReport === "warehouse" && (
                <>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Warehouse</label>
                    <select
                      className="rpt-select"
                      value={warehouseFilter}
                      onChange={(e) => setWarehouseFilter(e.target.value)}
                    >
                      {warehouseOptions.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Activity Type</label>
                    <select
                      className="rpt-select"
                      value={activityTypeFilter}
                      onChange={(e) => setActivityTypeFilter(e.target.value)}
                    >
                      <option value="All">All</option>
                      <option value="Inbound">Inbound</option>
                      <option value="Storage">Storage</option>
                      <option value="Outbound">Outbound</option>
                    </select>
                  </div>
                </>
              )}

              {/* 7. Trip Report Specifics */}
              {selectedReport === "trip" && (
                <>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Driver</label>
                    <select
                      className="rpt-select"
                      value={driverFilter}
                      onChange={(e) => setDriverFilter(e.target.value)}
                    >
                      {driverOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Vehicle</label>
                    <select
                      className="rpt-select"
                      value={vehicleFilter}
                      onChange={(e) => setVehicleFilter(e.target.value)}
                    >
                      {vehicleOptions.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Trip Status</label>
                    <select
                      className="rpt-select"
                      value={tripStatusFilter}
                      onChange={(e) => setTripStatusFilter(e.target.value)}
                    >
                      <option value="All">All</option>
                      <option value="Planned">Planned</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Arrived">Arrived</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Origin</label>
                    <select
                      className="rpt-select"
                      value={originFilter}
                      onChange={(e) => setOriginFilter(e.target.value)}
                    >
                      <option value="All">All Origins</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Pune">Pune</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Ahmedabad">Ahmedabad</option>
                      <option value="Chennai">Chennai</option>
                      <option value="Gandhinagar">Gandhinagar</option>
                    </select>
                  </div>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Destination</label>
                    <select
                      className="rpt-select"
                      value={destFilter}
                      onChange={(e) => setDestFilter(e.target.value)}
                    >
                      <option value="All">All Destinations</option>
                      <option value="Pune">Pune</option>
                      <option value="Surat">Surat</option>
                      <option value="Jaipur">Jaipur</option>
                      <option value="Bangalore">Bangalore</option>
                      <option value="Indore">Indore</option>
                      <option value="Mumbai">Mumbai</option>
                    </select>
                  </div>
                </>
              )}

              {/* 8. Invoice / Billing Report Specifics */}
              {selectedReport === "invoice" && (
                <>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Customer</label>
                    <select
                      className="rpt-select"
                      value={customerFilter}
                      onChange={(e) => setCustomerFilter(e.target.value)}
                    >
                      {customerOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Invoice Status</label>
                    <select
                      className="rpt-select"
                      value={invoiceStatusFilter}
                      onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                    >
                      <option value="All">All</option>
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </>
              )}

              {/* 9. Failed Delivery Report Specifics */}
              {selectedReport === "failed_delivery" && (
                <>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Customer</label>
                    <select
                      className="rpt-select"
                      value={customerFilter}
                      onChange={(e) => setCustomerFilter(e.target.value)}
                    >
                      {customerOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Driver</label>
                    <select
                      className="rpt-select"
                      value={driverFilter}
                      onChange={(e) => setDriverFilter(e.target.value)}
                    >
                      {driverOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Failure Reason</label>
                    <select
                      className="rpt-select"
                      value={failureReasonFilter}
                      onChange={(e) => setFailureReasonFilter(e.target.value)}
                    >
                      <option value="All">All Reasons</option>
                      <option value="Customer Unavailable">
                        Customer Unavailable
                      </option>
                      <option value="Incorrect Address">
                        Incorrect Address
                      </option>
                      <option value="Refused Delivery">Refused Delivery</option>
                      <option value="Premises Closed">Premises Closed</option>
                    </select>
                  </div>
                  <div className="rpt-filter-item">
                    <label className="rpt-label">Re-attempt Status</label>
                    <select
                      className="rpt-select"
                      value={reattemptFilter}
                      onChange={(e) => setReattemptFilter(e.target.value)}
                    >
                      <option value="All">All</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Pending Dispatch">Pending Dispatch</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Action Buttons Row */}
          <div className="rpt-actions-row">
            <button
              type="button"
              onClick={handleReset}
              className="rpt-btn rpt-btn--outline"
            >
              <RotateCcw size={14} />
              Reset
            </button>
            <button type="submit" className="rpt-btn rpt-btn--primary">
              <Filter size={14} />
              Generate Report
            </button>
          </div>
        </form>
      </section>

      {/* ── BOTTOM PANEL: Generated Report Output (Matching Wireframe) ──── */}
      <section className="rpt-panel">
        {/* Head Bar: Title & Export Buttons */}
        <div className="rpt-result-head">
          <h3 className="rpt-result-title">
            <Package size={18} color="hsl(214, 100%, 60%)" />
            {reportLabel}
          </h3>
          <div className="rpt-result-exports">
            <button
              type="button"
              onClick={handleExportPDF}
              className="rpt-btn rpt-btn--export"
              title="Print or save as PDF"
            >
              <Printer size={14} />
              Export PDF
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="rpt-btn rpt-btn--export"
              title="Download Excel / CSV"
            >
              <FileSpreadsheet size={14} color="#16a34a" />
              Export Excel
            </button>
          </div>
        </div>

        {/* Dynamic Summary KPI Badges Row */}
        <div className="rpt-kpi-summary-row">
          {dynamicKPIs.map((kpi, idx) => (
            <div
              key={idx}
              className={`rpt-kpi-pill ${
                kpi.tone ? `rpt-kpi-pill--${kpi.tone}` : ""
              }`}
            >
              <span className="rpt-kpi-pill__label">{kpi.label}:</span>
              <span className="rpt-kpi-pill__value">{kpi.value}</span>
            </div>
          ))}
        </div>

        {/* Dynamic Data Table or Empty State */}
        <div className="rpt-table-container">
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 16px",
                gap: "12px",
              }}
            >
              <RefreshCw
                size={28}
                style={{
                  color: "hsl(214, 100%, 60%)",
                  animation: "spin 1s linear infinite",
                }}
              />
              <span style={{ fontSize: "14px", color: "hsl(0, 0%, 45%)" }}>
                Loading report data from server...
              </span>
            </div>
          ) : error ? (
            <div
              className="rpt-empty-state"
              style={{ color: "hsl(4, 78%, 52%)" }}
            >
              <AlertCircle size={36} color="hsl(4, 78%, 52%)" />
              <h4>Failed to load report data</h4>
              <p>{error}</p>
              <button
                type="button"
                className="rpt-btn rpt-btn--primary"
                onClick={() => fetchReport(false)}
                style={{ marginTop: "12px" }}
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rpt-empty-state">
              <AlertTriangle size={36} color="#f59e0b" />
              <h4>No matching records found</h4>
              <p>
                Try changing your filter selections or click{" "}
                <strong>Reset</strong> to view all records.
              </p>
            </div>
          ) : (
            <>
              {selectedReport === "shipment" && (
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>Shipment</th>
                      <th>Tracking</th>
                      <th>Customer</th>
                      <th>Status</th>
                      <th>Driver</th>
                      <th>Vehicle</th>
                      <th>Origin / Dest</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 600 }}>{row.id}</td>
                        <td>
                          <span
                            style={{
                              fontFamily: "monospace",
                              color: "#475569",
                            }}
                          >
                            {row.tracking}
                          </span>
                        </td>
                        <td>{row.customer}</td>
                        <td>
                          <span
                            className={getBadgeClass(row.status, "created")}
                          >
                            ● {row.status || "Created"}
                          </span>
                        </td>
                        <td>{row.driver}</td>
                        <td>{row.vehicle}</td>
                        <td>
                          {row.origin} → {row.destination}
                        </td>
                        <td>{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {selectedReport === "delivery" && (
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>Delivery ID</th>
                      <th>Tracking</th>
                      <th>Customer</th>
                      <th>Delivery Address</th>
                      <th>Driver</th>
                      <th>Attempts</th>
                      <th>Status</th>
                      <th>Delivery Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 600 }}>{row.id}</td>
                        <td style={{ fontFamily: "monospace" }}>
                          {row.tracking}
                        </td>
                        <td>{row.customer}</td>
                        <td>{row.address}</td>
                        <td>{row.driver}</td>
                        <td>{row.attempts}</td>
                        <td>
                          <span
                            className={getBadgeClass(row.status, "pending")}
                          >
                            ● {row.status || "Pending"}
                          </span>
                        </td>
                        <td>{row.deliveryDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {selectedReport === "customer" && (
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Total Bookings</th>
                      <th>In Transit</th>
                      <th>Delivered</th>
                      <th>Failed</th>
                      <th>Total Volume</th>
                      <th>Last Shipment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{row.customer}</td>
                        <td>{row.totalBookings}</td>
                        <td>
                          <span className="rpt-badge rpt-badge--in_transit">
                            {row.inTransit}
                          </span>
                        </td>
                        <td>
                          <span className="rpt-badge rpt-badge--delivered">
                            {row.delivered}
                          </span>
                        </td>
                        <td>
                          <span className="rpt-badge rpt-badge--failed">
                            {row.failed}
                          </span>
                        </td>
                        <td>{row.weight}</td>
                        <td>{row.lastDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {selectedReport === "driver" && (
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>Driver Name</th>
                      <th>Driver ID</th>
                      <th>Phone Number</th>
                      <th>Assigned</th>
                      <th>Completed</th>
                      <th>Delayed</th>
                      <th>Success Rate</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{row.driverName}</td>
                        <td>{row.driverId}</td>
                        <td>{row.phone}</td>
                        <td>{row.assigned}</td>
                        <td>{row.completed}</td>
                        <td>{row.delayed}</td>
                        <td style={{ fontWeight: 700, color: "#16a34a" }}>
                          {row.successRate}
                        </td>
                        <td>
                          <span
                            className={getBadgeClass(
                              row.status || row.availability,
                              "active",
                            )}
                          >
                            ● {row.status || row.availability || "Active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {selectedReport === "vehicle" && (
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>Vehicle Registration</th>
                      <th>Model</th>
                      <th>Type</th>
                      <th>Current Driver</th>
                      <th>Total Trips</th>
                      <th>Distance (km)</th>
                      <th>Fuel Cost</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{row.vehicleNo}</td>
                        <td>{row.model}</td>
                        <td>{row.type}</td>
                        <td>{row.driver}</td>
                        <td>{row.trips}</td>
                        <td>{row.distance}</td>
                        <td>{row.fuelCost}</td>
                        <td>
                          <span
                            className={getBadgeClass(row.status, "available")}
                          >
                            ● {row.status || "Available"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {selectedReport === "warehouse" && (
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>Warehouse</th>
                      <th>Activity Type</th>
                      <th>Shipment / Tracking</th>
                      <th>Location (Zone/Rack/Bin)</th>
                      <th>Processed By</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.warehouse}</td>
                        <td>
                          <span className={getBadgeClass(row.type, "inbound")}>
                            ● {row.type || "Inbound"}
                          </span>
                        </td>
                        <td>{row.shipment}</td>
                        <td>{row.location}</td>
                        <td>{row.user}</td>
                        <td>{row.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {selectedReport === "trip" && (
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>Trip ID</th>
                      <th>Origin</th>
                      <th>Destination</th>
                      <th>Driver</th>
                      <th>Vehicle</th>
                      <th>Packages</th>
                      <th>Departure</th>
                      <th>Arrival</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{row.tripId}</td>
                        <td>{row.origin}</td>
                        <td>{row.destination}</td>
                        <td>{row.driver}</td>
                        <td>{row.vehicle}</td>
                        <td>{row.packages}</td>
                        <td>{row.departure}</td>
                        <td>{row.arrival}</td>
                        <td>
                          <span
                            className={getBadgeClass(row.status, "planned")}
                          >
                            ● {row.status || "Planned"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {selectedReport === "invoice" && (
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Shipment Ref</th>
                      <th>Amount</th>
                      <th>Tax</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{row.invoiceNo}</td>
                        <td>{row.date}</td>
                        <td>{row.customer}</td>
                        <td>{row.shipment}</td>
                        <td style={{ fontWeight: 600 }}>{row.amount}</td>
                        <td>{row.tax}</td>
                        <td>{row.dueDate}</td>
                        <td>
                          <span
                            className={getBadgeClass(row.status, "pending")}
                          >
                            ● {row.status || "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {selectedReport === "failed_delivery" && (
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>Shipment ID</th>
                      <th>Tracking</th>
                      <th>Customer</th>
                      <th>Driver</th>
                      <th>Failure Reason</th>
                      <th>Attempts</th>
                      <th>Re-attempt Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{row.id}</td>
                        <td style={{ fontFamily: "monospace" }}>
                          {row.tracking}
                        </td>
                        <td>{row.customer}</td>
                        <td>{row.driver}</td>
                        <td style={{ color: "#dc2626", fontWeight: 500 }}>
                          {row.reason}
                        </td>
                        <td>{row.attempts}</td>
                        <td>{row.reattemptDate}</td>
                        <td>
                          <span className={getBadgeClass(row.status, "failed")}>
                            ● {row.status || "Failed"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {selectedReport === "summary" && (
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Total Shipments</th>
                      <th>On-Time Deliveries</th>
                      <th>Fuel & Maintenance</th>
                      <th>Inbound Volume</th>
                      <th>Outbound Volume</th>
                      <th>Efficiency Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{row.period}</td>
                        <td>{row.shipments}</td>
                        <td>{row.onTime}</td>
                        <td>{row.fuelCost}</td>
                        <td>{row.inbound}</td>
                        <td>{row.outbound}</td>
                        <td style={{ fontWeight: 700, color: "#16a34a" }}>
                          {row.efficiency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* Table Footer */}
          <div className="rpt-table-footer">
            <span>
              Showing {filteredRows.length} matching record
              {filteredRows.length === 1 ? "" : "s"}
            </span>
            {selectedReport === "summary" ? (
              <span>
                Period: {periodType} ({summaryYear}
                {periodType === "Monthly" ? ` - ${summaryMonth}` : ""})
              </span>
            ) : (
              <span>
                Reporting Period: {fromDate} to {toDate}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="rpt-toast">
          <CheckCircle2 size={16} color="#4ade80" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
