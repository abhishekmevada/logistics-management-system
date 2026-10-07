import React, { useState, useEffect, useMemo } from "react";
import {
  Receipt,
  RefreshCw,
  FileSpreadsheet,
  QrCode,
  Plus,
  Building2,
  Layers,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Download,
  Search,
  MapPin,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Calendar,
  User,
  Truck,
  Calculator,
  Trash2,
  CheckCircle2,
  Printer,
  Clock,
  AlertTriangle,
  ShieldCheck,
  UserPlus,
  ChevronDown,
  Info,
  ChartNoAxesCombined,
} from "lucide-react";

import {
  downloadInvoicePDF,
  exportInvoicesToCSV,
  formatINR,
  numberToWordsINR,
  setCompanyInfoData,
} from "./utils/pdfGenerator";

import "../../styles/ShipmentManagement.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Module-level dynamic cache populated solely from the database
let dynamicCompanyInfo = null;

// Proxy object for seamless, reactive access to live database company info across helpers
export const COMPANY_INFO = new Proxy(
  {},
  {
    get(target, prop) {
      if (!dynamicCompanyInfo) return undefined;
      return dynamicCompanyInfo[prop];
    },
  },
);

// ==========================================
// 1. TOAST COMPONENT
// ==========================================
function Toast({ toast, onClose }) {
  if (!toast) return null;

  const bgStyles = {
    success: "bg-emerald-900 text-emerald-100 border-emerald-700",
    info: "bg-slate-900 text-slate-100 border-slate-700",
    warning: "bg-amber-900 text-amber-100 border-amber-700",
    error: "bg-rose-900 text-rose-100 border-rose-700",
  };

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    info: <Info className="w-4 h-4 text-blue-400" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    error: <AlertTriangle className="w-4 h-4 text-rose-400" />,
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-xs font-medium ${bgStyles[toast.type || "info"]}`}
      >
        {icons[toast.type || "info"]}
        <span>{toast.message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-slate-400 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 2. BILLING SUMMARY CARDS COMPONENT
// ==========================================
function BillingSummaryCards({ invoices, activeFilter, onSelectFilter }) {
  const totalInvoices = invoices.length;
  const totalBilled = invoices.reduce(
    (acc, inv) => acc + (Number(inv.totalAmount) || 0),
    0,
  );

  let totalPaid = 0;
  let totalPending = 0;
  let totalOverdue = 0;

  let paidCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;

  invoices.forEach((inv) => {
    const statusStr = String(
      inv.status || inv.paymentStatus || "pending",
    ).toLowerCase();
    const totalAmt = Number(inv.totalAmount) || 0;
    const paidAmt =
      inv.paidAmount !== undefined && !isNaN(Number(inv.paidAmount))
        ? Number(inv.paidAmount)
        : statusStr === "paid"
          ? totalAmt
          : 0;

    if (statusStr === "paid") {
      totalPaid += totalAmt;
      paidCount += 1;
    } else if (
      statusStr === "partially_paid" ||
      statusStr === "partially paid"
    ) {
      const actualPaid = paidAmt > 0 ? paidAmt : Math.round(totalAmt * 0.5);
      totalPaid += actualPaid;
      totalPending += Math.max(0, totalAmt - actualPaid);
      pendingCount += 1;
    } else if (statusStr === "overdue") {
      totalPaid += paidAmt;
      totalOverdue += Math.max(0, totalAmt - paidAmt);
      overdueCount += 1;
    } else if (statusStr !== "cancelled") {
      totalPaid += paidAmt;
      totalPending += Math.max(0, totalAmt - paidAmt);
      pendingCount += 1;
    }
  });

  const collectionPercent =
    totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

  return (
    <div className="shp-kpi-grid">
      {/* 1. TOTAL INVOICES */}
      <div
        onClick={() => onSelectFilter("All")}
        className={`shp-kpi-card cursor-pointer transition-all ${
          activeFilter === "All" ? "ring-2 ring-blue-500" : ""
        }`}
      >
        <div className="shp-kpi-card__head">
          <span className="shp-kpi-card__icon">
            <Building2 className="w-4 h-4 text-blue-600" />
          </span>
          <span className="shp-kpi-card__title">TOTAL INVOICES</span>
        </div>
        <div className="shp-kpi-card__value">{totalInvoices}</div>
        <div className="shp-kpi-card__foot">Active billing records</div>
      </div>

      {/* 2. TOTAL BILLED */}
      <div
        onClick={() => onSelectFilter("All")}
        className={`shp-kpi-card cursor-pointer transition-all ${
          activeFilter === "All" ? "ring-2 ring-purple-500" : ""
        }`}
      >
        <div className="shp-kpi-card__head">
          <span className="shp-kpi-card__icon shp-kpi-card__icon--info">
            <Layers className="w-4 h-4 text-purple-600" />
          </span>
          <span className="shp-kpi-card__title">TOTAL BILLED</span>
        </div>
        <div className="shp-kpi-card__value" title={formatINR(totalBilled)}>
          {formatINR(totalBilled)}
        </div>
        <div className="shp-kpi-card__foot">Total invoiced revenue</div>
      </div>

      {/* 3. PAID AMOUNT */}
      <div
        onClick={() => onSelectFilter("Paid")}
        className={`shp-kpi-card cursor-pointer transition-all ${
          activeFilter === "Paid" ? "ring-2 ring-emerald-500" : ""
        }`}
      >
        <div className="shp-kpi-card__head">
          <span className="shp-kpi-card__icon shp-kpi-card__icon--success">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </span>
          <span className="shp-kpi-card__title">PAID AMOUNT</span>
        </div>
        <div className="shp-kpi-card__value" style={{ color: "#059669" }}>
          {collectionPercent}%
        </div>
        <div className="shp-kpi-card__foot">{formatINR(totalPaid)} cleared</div>
      </div>

      {/* 4. PENDING TODAY */}
      <div
        onClick={() => onSelectFilter("Pending")}
        className={`shp-kpi-card cursor-pointer transition-all ${
          activeFilter === "Pending" ? "ring-2 ring-amber-500" : ""
        }`}
      >
        <div className="shp-kpi-card__head">
          <span className="shp-kpi-card__icon shp-kpi-card__icon--warning">
            <ArrowDownLeft className="w-4 h-4 text-amber-600" />
          </span>
          <span className="shp-kpi-card__title">PENDING TODAY</span>
        </div>
        <div className="shp-kpi-card__value" style={{ color: "#d97706" }}>
          {pendingCount}
        </div>
        <div className="shp-kpi-card__foot">{formatINR(totalPending)} due</div>
      </div>

      {/* 5. OVERDUE TODAY */}
      <div
        onClick={() => onSelectFilter("Overdue")}
        className={`shp-kpi-card cursor-pointer transition-all ${
          activeFilter === "Overdue" ? "ring-2 ring-rose-500" : ""
        }`}
      >
        <div className="shp-kpi-card__head">
          <span className="shp-kpi-card__icon shp-kpi-card__icon--danger">
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </span>
          <span className="shp-kpi-card__title">OVERDUE TODAY</span>
        </div>
        <div className="shp-kpi-card__value" style={{ color: "#dc2626" }}>
          {overdueCount}
        </div>
        <div className="shp-kpi-card__foot">
          {formatINR(totalOverdue)} delayed
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. BILLING REPORTS SECTION COMPONENT
// ==========================================
function BillingReportsSection({ invoices, onFilterCustomer }) {
  const [reportPeriod, setReportPeriod] = useState("Quarter 3 (Current)");

  const totalBilled = invoices.reduce(
    (acc, inv) => acc + (Number(inv.totalAmount) || 0),
    0,
  );

  let totalPaid = 0;
  let totalPending = 0;
  let totalOverdue = 0;

  let paidInvoicesCount = 0;
  let pendingInvoicesCount = 0;
  let overdueInvoicesCount = 0;

  invoices.forEach((inv) => {
    const statusStr = String(
      inv.status || inv.paymentStatus || "pending",
    ).toLowerCase();
    const totalAmt = Number(inv.totalAmount) || 0;
    const paidAmt =
      inv.paidAmount !== undefined && !isNaN(Number(inv.paidAmount))
        ? Number(inv.paidAmount)
        : statusStr === "paid"
          ? totalAmt
          : 0;

    if (statusStr === "paid") {
      totalPaid += totalAmt;
      paidInvoicesCount += 1;
    } else if (
      statusStr === "partially_paid" ||
      statusStr === "partially paid"
    ) {
      const actualPaid = paidAmt > 0 ? paidAmt : Math.round(totalAmt * 0.5);
      totalPaid += actualPaid;
      totalPending += Math.max(0, totalAmt - actualPaid);
      pendingInvoicesCount += 1;
    } else if (statusStr === "overdue") {
      totalPaid += paidAmt;
      totalOverdue += Math.max(0, totalAmt - paidAmt);
      overdueInvoicesCount += 1;
    } else if (statusStr !== "cancelled") {
      totalPaid += paidAmt;
      totalPending += Math.max(0, totalAmt - paidAmt);
      pendingInvoicesCount += 1;
    }
  });

  const paidPercent =
    totalBilled > 0 ? ((totalPaid / totalBilled) * 100).toFixed(1) : "0.0";
  const pendingPercent =
    totalBilled > 0 ? ((totalPending / totalBilled) * 100).toFixed(1) : "0.0";
  const overduePercent =
    totalBilled > 0 ? ((totalOverdue / totalBilled) * 100).toFixed(1) : "0.0";

  const customerMap = {};
  invoices.forEach((inv) => {
    const name = inv.customer?.name || "Other Customer";
    const statusStr = String(
      inv.status || inv.paymentStatus || "pending",
    ).toLowerCase();
    const totalAmt = Number(inv.totalAmount) || 0;
    const paidAmt =
      inv.paidAmount !== undefined && !isNaN(Number(inv.paidAmount))
        ? Number(inv.paidAmount)
        : statusStr === "paid"
          ? totalAmt
          : 0;

    if (!customerMap[name]) {
      customerMap[name] = {
        name,
        count: 0,
        total: 0,
        pending: 0,
        overdue: 0,
        paid: 0,
      };
    }
    customerMap[name].count += 1;
    customerMap[name].total += totalAmt;
    customerMap[name].paid += paidAmt;

    if (
      statusStr === "pending" ||
      statusStr === "partially_paid" ||
      statusStr === "partially paid"
    ) {
      customerMap[name].pending += Math.max(0, totalAmt - paidAmt);
    } else if (statusStr === "overdue") {
      customerMap[name].overdue += Math.max(0, totalAmt - paidAmt);
    }
  });

  const topCustomers = Object.values(customerMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#eff6ff] text-[#2563eb] rounded-lg">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Billing & Revenue Report Summary
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Logistics freight receivable aging, cash realization, and customer
            account aggregates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value)}
            className="text-xs font-medium bg-[#f8f9fa] border border-gray-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="Current Month (Sep 2026)">
              Current Month (Sep 2026)
            </option>
            <option value="Quarter 3 (Current)">Quarter 3 (Current FY)</option>
            <option value="All Time Records">All Time Records</option>
          </select>

          <button
            onClick={() => exportInvoicesToCSV(invoices)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-[#f8f9fa] hover:bg-gray-100 text-slate-700 rounded-xl border border-gray-200 transition-colors shadow-2xs"
            title="Download CSV Billing Report"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Realization & Distribution Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-slate-700">
            Cash Realization & Aging Breakdown
          </span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
              Paid: {paidPercent}% ({formatINR(totalPaid)})
            </span>
            <span className="flex items-center gap-1 text-amber-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span>
              Pending: {pendingPercent}% ({formatINR(totalPending)})
            </span>
            <span className="flex items-center gap-1 text-rose-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span>
              Overdue: {overduePercent}% ({formatINR(totalOverdue)})
            </span>
          </div>
        </div>

        {/* Multi-segment progress bar */}
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${paidPercent}%` }}
            className="bg-emerald-500 h-full transition-all duration-500"
            title={`Paid: ${paidPercent}%`}
          />
          <div
            style={{ width: `${pendingPercent}%` }}
            className="bg-amber-400 h-full transition-all duration-500"
            title={`Pending: ${pendingPercent}%`}
          />
          <div
            style={{ width: `${overduePercent}%` }}
            className="bg-rose-500 h-full transition-all duration-500"
            title={`Overdue: ${overduePercent}%`}
          />
        </div>
      </div>

      {/* 4 Summary Stat Cards within the report */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
        <div className="bg-[#f8f9fa] rounded-xl p-3 border border-gray-100">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">
            Total Billed Revenue
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1 font-heading">
            {formatINR(totalBilled)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {invoices.length} total shipments invoiced
          </div>
        </div>

        <div className="bg-emerald-50/40 rounded-xl p-3 border border-emerald-100">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase">
            Total Paid Amount
          </div>
          <div className="text-lg font-bold text-emerald-800 mt-1 font-heading">
            {formatINR(totalPaid)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">
            {paidInvoicesCount} invoices cleared
          </div>
        </div>

        <div className="bg-amber-50/40 rounded-xl p-3 border border-amber-100">
          <div className="text-[11px] font-semibold text-amber-700 uppercase">
            Total Pending Amount
          </div>
          <div className="text-lg font-bold text-amber-800 mt-1 font-heading">
            {formatINR(totalPending)}
          </div>
          <div className="text-[11px] text-amber-600 mt-0.5">
            {pendingInvoicesCount} invoices in credit cycle
          </div>
        </div>

        <div className="bg-rose-50/40 rounded-xl p-3 border border-rose-100">
          <div className="text-[11px] font-semibold text-rose-700 uppercase">
            Total Overdue Amount
          </div>
          <div className="text-lg font-bold text-rose-800 mt-1 font-heading">
            {formatINR(totalOverdue)}
          </div>
          <div className="text-[11px] text-rose-600 mt-0.5">
            {overdueInvoicesCount} invoices delayed
          </div>
        </div>
      </div>

      {/* Top Clients by Invoiced Volume */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            Top Logistics Clients by Invoiced Volume
          </span>
          <span className="text-[11px] text-slate-400">
            Click a client to filter invoices below
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {topCustomers.map((cust) => (
            <button
              key={cust.name}
              onClick={() => onFilterCustomer && onFilterCustomer(cust.name)}
              className="text-left p-2.5 rounded-xl border border-gray-200 bg-[#f8f9fa] hover:bg-blue-50/60 hover:border-blue-300 transition-all group flex flex-col justify-between"
            >
              <div>
                <div
                  className="font-semibold text-xs text-slate-800 group-hover:text-blue-700 truncate"
                  title={cust.name}
                >
                  {cust.name}
                </div>
                <div className="text-[11px] text-slate-400">
                  {cust.count} Invoices
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-900 font-heading">
                  {formatINR(cust.total)}
                </span>
                {cust.overdue > 0 ? (
                  <span className="text-[10px] px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded font-medium">
                    Overdue
                  </span>
                ) : cust.pending > 0 ? (
                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-700 rounded font-medium">
                    Pending
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded font-medium">
                    Cleared
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. INVOICE TABLE COMPONENT
// ==========================================
function InvoiceTable({
  invoices,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  customerFilter,
  setCustomerFilter,
  onViewInvoice,
  onDownloadInvoice,
  onToggleStatus,
  onOpenReportTab,
}) {
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === "all") setStatusFilter("All");
    else if (tab === "paid") setStatusFilter("Paid");
    else if (tab === "pending") setStatusFilter("Pending");
    else if (tab === "overdue") setStatusFilter("Overdue");
    else if (tab === "analytics") {
      if (onOpenReportTab) onOpenReportTab();
    }
    setCurrentPage(1);
  };

  const paidCount = invoices.filter((i) => i.status === "Paid").length;
  const pendingCount = invoices.filter((i) => i.status === "Pending").length;
  const overdueCount = invoices.filter((i) => i.status === "Overdue").length;

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      (inv.id && inv.id.toLowerCase().includes(q)) ||
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(q)) ||
      (inv.customer?.name && inv.customer.name.toLowerCase().includes(q)) ||
      (inv.customer?.contactPerson &&
        inv.customer.contactPerson.toLowerCase().includes(q)) ||
      (inv.shipmentId && inv.shipmentId.toLowerCase().includes(q)) ||
      (inv.shipmentDetails?.origin &&
        inv.shipmentDetails.origin.toLowerCase().includes(q)) ||
      (inv.shipmentDetails?.destination &&
        inv.shipmentDetails.destination.toLowerCase().includes(q));

    const matchStatus = statusFilter === "All" || inv.status === statusFilter;
    const matchCustomer =
      !customerFilter || inv.customer?.name === customerFilter;

    return matchSearch && matchStatus && matchCustomer;
  });

  const filterKey = `${activeTab}|${statusFilter}|${customerFilter}|${searchQuery}|${pageSize}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredInvoices.length);
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  const getPageNumbers = (current, total) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, "...", total];
    }
    if (current >= total - 3) {
      return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, "...", current - 1, current, current + 1, "...", total];
  };

  const uniqueCustomers = Array.from(
    new Set(invoices.map((i) => i.customer?.name).filter(Boolean)),
  );

  return (
    <>
      {/* Control & Filter Bar */}
      <div className="shp-control-bar">
        {/* Left: Tab Buttons */}
        <div className="shp-tabs">
          <button
            type="button"
            onClick={() => handleTabClick("all")}
            className={`shp-tab ${activeTab === "all" ? "shp-tab--active" : ""}`}
          >
            <span>Invoices Ledger</span>
            <span className="shp-tab__count">{invoices.length}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick("paid")}
            className={`shp-tab ${activeTab === "paid" ? "shp-tab--active" : ""}`}
          >
            <span>Paid Invoices</span>
            <span className="shp-tab__count">{paidCount}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick("pending")}
            className={`shp-tab ${activeTab === "pending" ? "shp-tab--active" : ""}`}
          >
            <span>Pending Invoices</span>
            <span className="shp-tab__count">{pendingCount}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick("overdue")}
            className={`shp-tab ${activeTab === "overdue" ? "shp-tab--active" : ""}`}
          >
            <span>Overdue</span>
            <span className="shp-tab__count">{overdueCount}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick("analytics")}
            className={`shp-tab ${activeTab === "analytics" ? "shp-tab--active" : ""}`}
          >
            <span style={{ display: "flex", alignItems: "center" }}>
              <ChartNoAxesCombined style={{ height: "16px" }} /> Tax & Aging
              Flow
            </span>
          </button>
        </div>

        {/* Right: Search & Dropdowns */}
        <div className="shp-filters-right">
          <div className="shp-search-box">
            <span className="shp-search-icon">
              <Search size={14} />
            </span>
            <input
              type="search"
              placeholder="Search invoice, client, AWB..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="shp-search-clear"
                onClick={() => setSearchQuery("")}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <select
            className="shp-select-filter"
            value={customerFilter}
            onChange={(e) => {
              setCustomerFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Clients</option>
            {uniqueCustomers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            className="shp-select-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              if (e.target.value === "All") setActiveTab("all");
              else if (e.target.value === "Paid") setActiveTab("paid");
              else if (e.target.value === "Pending") setActiveTab("pending");
              else if (e.target.value === "Overdue") setActiveTab("overdue");
              setCurrentPage(1);
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid Only</option>
            <option value="Pending">Pending Only</option>
            <option value="Overdue">Overdue Only</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="shp-table-card">
        {/* Table Rows */}
        <div className="shp-table-wrap">
          <table className="shp-table">
            <thead>
              <tr>
                <th>INVOICE & CUSTOMER</th>
                <th>LOCATION & ROUTE</th>
                <th>SHIPMENT REF</th>
                <th>CHARGES (BASE)</th>
                <th>TOTAL AMOUNT</th>
                <th>COLLECTION / DUE</th>
                <th>STATUS</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((inv, idx) => {
                  const statusStr = String(
                    inv.status || inv.paymentStatus || "Pending",
                  ).toLowerCase();
                  const isPaid = statusStr === "paid";
                  const isPending = statusStr === "pending";
                  const isPartial =
                    statusStr === "partially_paid" ||
                    statusStr === "partially paid";
                  const isCancelled = statusStr === "cancelled";
                  const isOverdue = statusStr === "overdue";
                  const tagId = `INV-0${startIndex + idx + 1}`;

                  return (
                    <tr key={inv.id} className="shp-table__row">
                      {/* INVOICE & CUSTOMER */}
                      <td>
                        <button
                          type="button"
                          className="shp-tracking-link"
                          onClick={() => onViewInvoice(inv)}
                        >
                          {tagId}
                        </button>
                        <p className="shp-cell-title">{inv.customer?.name}</p>
                        <span className="shp-cell-sub">
                          Mgr.{" "}
                          {inv.customer?.contactPerson || "Logistics Incharge"}
                        </span>
                      </td>

                      {/* LOCATION & ROUTE */}
                      <td>
                        <div className="shp-route-flow">
                          <MapPin size={13} className="text-slate-400" />
                          <span>
                            {inv.shipmentDetails?.destination?.split(",")[0] ||
                              inv.shipmentDetails?.origin?.split(",")[0] ||
                              "Central Hub"}
                          </span>
                        </div>
                        <span className="shp-cell-sub">
                          {inv.shipmentDetails?.origin} →{" "}
                          {inv.shipmentDetails?.destination}
                        </span>
                      </td>

                      {/* SHIPMENT REF */}
                      <td>
                        <span
                          className="shp-cell-title"
                          style={{ fontFamily: "monospace" }}
                        >
                          {inv.shipmentId}
                        </span>
                        <span className="shp-cell-sub">
                          {inv.shipmentDetails?.vehicleNo &&
                          !/^[0-9a-fA-F]{24}$/.test(
                            String(inv.shipmentDetails.vehicleNo).trim(),
                          )
                            ? inv.shipmentDetails.vehicleNo
                            : "Fleet Vehicle"}
                        </span>
                      </td>

                      {/* CHARGES (BASE) */}
                      <td>
                        <strong style={{ color: "#0f172a" }}>
                          {formatINR(inv.subtotal || inv.totalAmount * 0.85)}
                        </strong>
                        <span className="shp-cell-sub">
                          +{formatINR(inv.taxAmount || inv.totalAmount * 0.15)}{" "}
                          GST
                        </span>
                      </td>

                      {/* TOTAL AMOUNT */}
                      <td>
                        <strong
                          style={{
                            color: "#0f172a",
                            fontFamily: "monospace",
                            fontSize: "13.5px",
                          }}
                        >
                          {formatINR(inv.totalAmount)}
                        </strong>
                        <span className="shp-cell-sub">
                          Tax Inv: {inv.invoiceNumber || inv.id}
                        </span>
                      </td>

                      {/* COLLECTION / DUE */}
                      <td>
                        <span
                          className={`shp-badge ${
                            isPaid
                              ? "shp-badge--success"
                              : isPartial
                                ? "shp-badge--info"
                                : isPending
                                  ? "shp-badge--warning"
                                  : isCancelled
                                    ? "shp-badge--neutral"
                                    : "shp-badge--danger"
                          }`}
                        >
                          {isPaid
                            ? "Cleared"
                            : isPartial
                              ? "Partial"
                              : isPending
                                ? "Pending"
                                : isCancelled
                                  ? "Cancelled"
                                  : "Overdue"}
                        </span>
                        <span className="shp-cell-sub">Due: {inv.dueDate}</span>
                      </td>

                      {/* STATUS BADGE */}
                      <td>
                        <span
                          className={`shp-badge ${
                            isPaid
                              ? "shp-badge--success"
                              : isPartial
                                ? "shp-badge--info"
                                : isPending
                                  ? "shp-badge--warning"
                                  : isCancelled
                                    ? "shp-badge--neutral"
                                    : "shp-badge--danger"
                          }`}
                        >
                          {inv.status || "Pending"}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td style={{ textAlign: "right" }}>
                        <div className="shp-action-btns">
                          <button
                            type="button"
                            onClick={() => onViewInvoice(inv)}
                            className="shp-icon-btn"
                            title="View Invoice Document"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDownloadInvoice(inv)}
                            className="shp-icon-btn"
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onToggleStatus(inv)}
                            className="shp-icon-btn"
                            title="Edit Status & Payment Details"
                          >
                            <Edit size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="shp-empty-state">
                    <p className="shp-empty-state__title">
                      No invoices match criteria
                    </p>
                    <p className="shp-empty-state__text">
                      Try clearing your search or status filter.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("All");
                        setCustomerFilter("");
                        setActiveTab("all");
                      }}
                      className="shp-btn shp-btn--secondary shp-btn--sm"
                      style={{ marginTop: "8px" }}
                    >
                      Reset Filter
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="shp-table-footer">
          <div className="shp-pagination-info">
            {filteredInvoices.length === 0 ? (
              <span>No invoices to display</span>
            ) : (
              <span>
                Showing <strong>{startIndex + 1}</strong>–
                <strong>{endIndex}</strong> of{" "}
                <strong>{filteredInvoices.length}</strong> billing entries
                {filteredInvoices.length !== invoices.length && (
                  <span className="shp-pagination-total-hint">
                    {" "}
                    (filtered from {invoices.length} total)
                  </span>
                )}
              </span>
            )}
          </div>

          {filteredInvoices.length > 0 && (
            <div className="shp-pagination-controls">
              <div className="shp-pagination-size">
                <label htmlFor="shp-page-size-select">Rows per page:</label>
                <select
                  id="shp-page-size-select"
                  className="shp-pagination-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="shp-pagination-nav">
                <button
                  type="button"
                  className="shp-pagination-btn"
                  title="First Page"
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage(1)}
                >
                  <ChevronsLeft size={14} />
                </button>
                <button
                  type="button"
                  className="shp-pagination-btn"
                  title="Previous Page"
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>

                <div className="shp-pagination-pages">
                  {getPageNumbers(safeCurrentPage, totalPages).map(
                    (pageNum, idx) =>
                      pageNum === "..." ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="shp-pagination-ellipsis"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={`page-${pageNum}`}
                          type="button"
                          className={`shp-pagination-btn ${
                            safeCurrentPage === pageNum
                              ? "shp-pagination-btn--active"
                              : ""
                          }`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      ),
                  )}
                </div>

                <button
                  type="button"
                  className="shp-pagination-btn"
                  title="Next Page"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  className="shp-pagination-btn"
                  title="Last Page"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Helper to format backend invoice documents to UI structure
function formatBackendInvoice(inv) {
  if (!inv) return null;
  const custName =
    inv.customerId?.name ||
    inv.customer?.name ||
    inv.customerName ||
    "Customer";
  const contact =
    inv.customerId?.contactPerson || inv.customer?.contactPerson || custName;
  const email = inv.customerId?.email || inv.customer?.email || "";
  const phone = inv.customerId?.phonenumber
    ? String(inv.customerId.phonenumber)
    : inv.customerId?.phone || inv.customer?.phone || "";
  const address = inv.customerId?.address || inv.customer?.address || "";
  const gstin =
    inv.customerGstin || inv.customerId?.gstin || inv.customer?.gstin || "";

  const rawShp = inv.shipmentId;
  const isShpObj = typeof rawShp === "object" && rawShp !== null;

  const shpId = isShpObj
    ? rawShp.trackingId || rawShp.shipmentId || "SHP-REF"
    : (typeof rawShp === "string" ? rawShp : "") ||
      inv.shipmentRef ||
      "SHP-REF";

  const origin = isShpObj
    ? rawShp.senderCity || rawShp.senderAddress || "Origin Hub"
    : inv.shipmentDetails?.origin || "Origin Hub";

  const destination = isShpObj
    ? rawShp.receiverCity || rawShp.receiverAddress || "Destination Site"
    : inv.shipmentDetails?.destination || "Destination Site";

  let rawVeh = isShpObj
    ? (typeof rawShp.vehicleNo === "object" && rawShp.vehicleNo !== null
        ? rawShp.vehicleNo.vregistrationnumber ||
          rawShp.vehicleNo.vregistrationNo ||
          rawShp.vehicleNo.registrationNumber ||
          rawShp.vehicleNo.vname ||
          rawShp.vehicleNo.vmodel
        : typeof rawShp.vehicleNo === "string"
          ? rawShp.vehicleNo
          : "") ||
      (typeof rawShp.assignedVehicleNo === "object" &&
      rawShp.assignedVehicleNo !== null
        ? rawShp.assignedVehicleNo.vregistrationnumber ||
          rawShp.assignedVehicleNo.vregistrationNo
        : typeof rawShp.assignedVehicleNo === "string"
          ? rawShp.assignedVehicleNo
          : "") ||
      rawShp.vehicleRegistrationNo ||
      rawShp.vehicleNumber ||
      inv.shipmentDetails?.vehicleNo ||
      ""
    : inv.shipmentDetails?.vehicleNo || "";

  if (typeof rawVeh === "object" && rawVeh !== null) {
    rawVeh =
      rawVeh.vregistrationnumber ||
      rawVeh.vregistrationNo ||
      rawVeh.registrationNumber ||
      rawVeh.vname ||
      rawVeh.vmodel ||
      "";
  }

  const cleanVehStr = String(rawVeh || "").trim();
  const vehicleNo =
    cleanVehStr && !/^[0-9a-fA-F]{24}$/.test(cleanVehStr)
      ? cleanVehStr
      : "Fleet Vehicle";

  const weight = isShpObj
    ? rawShp.totalWeight
      ? `${rawShp.totalWeight} kg`
      : inv.shipmentDetails?.weight || "N/A"
    : inv.shipmentDetails?.weight || "N/A";

  const rawStatus = inv.paymentStatus || inv.status || "Pending";
  const status =
    rawStatus === "paid"
      ? "Paid"
      : rawStatus === "overdue"
        ? "Overdue"
        : rawStatus === "pending"
          ? "Pending"
          : rawStatus;

  const rawItems =
    Array.isArray(inv.items) && inv.items.length > 0 ? inv.items : [];
  const items = rawItems.map((it) => {
    const qty = Number(it.quantity) || 1;
    const rate =
      Number(it.unitPrice) || Number(it.rate) || Number(it.amount) || 0;
    const amt = Number(it.amount) || qty * rate;
    const taxP =
      Number(it.taxPercent) !== undefined && !isNaN(Number(it.taxPercent))
        ? Number(it.taxPercent)
        : Number(it.taxRate) || 18;
    const itemTax =
      Number(it.taxAmount) !== undefined && !isNaN(Number(it.taxAmount))
        ? Number(it.taxAmount)
        : Math.round(amt * (taxP / 100) * 100) / 100;
    const itemTotal =
      Number(it.totalAmount) !== undefined && !isNaN(Number(it.totalAmount))
        ? Number(it.totalAmount)
        : Math.round((amt + itemTax) * 100) / 100;

    return {
      description: it.description || "Freight Transportation Service",
      quantity: qty,
      unit: it.unit || "Trip",
      rate,
      taxPercent: taxP,
      amount: amt,
      taxAmount: itemTax,
      totalAmount: itemTotal,
    };
  });

  const subtotal =
    Number(inv.subtotal) || items.reduce((acc, it) => acc + it.amount, 0);
  const taxAmount =
    Number(inv.taxAmount) !== undefined && !isNaN(Number(inv.taxAmount))
      ? Number(inv.taxAmount)
      : items.reduce((acc, it) => acc + it.taxAmount, 0);
  const grandTotal = Number(inv.totalAmount) || subtotal + taxAmount;

  return {
    id: inv._id ? String(inv._id) : inv.id || inv.invoiceNumber,
    _id: inv._id,
    invoiceNumber:
      inv.invoiceNumber ||
      inv.id ||
      `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
    customer: {
      name: custName,
      contactPerson: contact,
      email,
      phone,
      address,
      gstin,
    },
    shipmentId: shpId,
    shipmentDetails: {
      origin,
      destination,
      vehicleNo,
      weight,
    },
    invoiceDate: inv.issueDate
      ? new Date(inv.issueDate).toISOString().split("T")[0]
      : inv.invoiceDate || new Date().toISOString().split("T")[0],
    dueDate: inv.dueDate
      ? new Date(inv.dueDate).toISOString().split("T")[0]
      : inv.dueDate ||
        new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
    status,
    items:
      items.length > 0
        ? items
        : [
            {
              description: "FTL Road Freight Transportation Service",
              quantity: 1,
              unit: "Trip",
              rate: subtotal || 25000,
              taxPercent: 18,
              amount: subtotal || 25000,
            },
          ],
    subtotal,
    taxAmount,
    totalAmount: grandTotal,
    paidAmount:
      inv.paidAmount !== undefined && !isNaN(Number(inv.paidAmount))
        ? Number(inv.paidAmount)
        : rawStatus === "paid"
          ? grandTotal
          : 0,
    balanceAmount:
      inv.balanceAmount !== undefined && !isNaN(Number(inv.balanceAmount))
        ? Number(inv.balanceAmount)
        : Math.max(
            0,
            Math.round(
              (grandTotal -
                (inv.paidAmount !== undefined && !isNaN(Number(inv.paidAmount))
                  ? Number(inv.paidAmount)
                  : rawStatus === "paid"
                    ? grandTotal
                    : 0)) *
                100,
            ) / 100,
          ),
    paymentMethod: inv.paymentMethod || "NEFT / RTGS Bank Transfer",
    notes: inv.notes || "Payment due within credit terms.",
    bankDetails: {
      accountName:
        inv.bankDetails?.accountName ||
        dynamicCompanyInfo?.bankDetails?.accountName ||
        "",
      accountNumber:
        inv.bankDetails?.accountNumber ||
        dynamicCompanyInfo?.bankDetails?.accountNumber ||
        "",
      bankAndBranch:
        inv.bankDetails?.bankAndBranch ||
        (inv.bankDetails?.bankName
          ? `${inv.bankDetails.bankName}, ${inv.bankDetails.branch || ""}`
              .trim()
              .replace(/^, |, $/g, "")
          : dynamicCompanyInfo?.bankDetails?.bankAndBranch ||
            (dynamicCompanyInfo?.bankDetails?.bankName
              ? `${dynamicCompanyInfo.bankDetails.bankName}, ${dynamicCompanyInfo.bankDetails.branch || ""}`
                  .trim()
                  .replace(/^, |, $/g, "")
              : "")),
      ifscCode:
        inv.bankDetails?.ifscCode ||
        dynamicCompanyInfo?.bankDetails?.ifscCode ||
        "",
    },
    paymentHistory: Array.isArray(inv.paymentHistory) ? inv.paymentHistory : [],
  };
}

// ==========================================
// 5. CREATE INVOICE MODAL COMPONENT
// ==========================================
function InvoiceModal({ isOpen, onClose, onSaveInvoice, companyInfo }) {
  if (!isOpen) return null;

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");

  const [selectedShipmentId, setSelectedShipmentId] = useState("");
  const [shipmentId, setShipmentId] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [weight, setWeight] = useState("");

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("Pending");
  const [paymentMethod, setPaymentMethod] = useState(
    "NEFT / RTGS Bank Transfer",
  );
  const [notes, setNotes] = useState(
    "Payment is due within standard credit terms. Freight subject to road transit conditions.",
  );

  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankAndBranch, setBankAndBranch] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [isLoadingBankDetails, setIsLoadingBankDetails] = useState(false);
  const [bankAutofillSuccess, setBankAutofillSuccess] = useState(false);

  const applyBankDetails = (bd) => {
    if (!bd) return;
    const bName = bd.bankName || "";
    const bBranch = bd.branch || "";
    const resolvedBankBranch =
      bd.bankAndBranch ||
      (bName && bBranch ? `${bName}, ${bBranch}` : bName || bBranch || "");

    setAccountName(bd.accountName || "");
    setAccountNumber(bd.accountNumber || "");
    setBankAndBranch(resolvedBankBranch);
    setIfscCode(bd.ifscCode || "");
    setBankAutofillSuccess(true);
  };

  const fetchAndAutofillBankDetails = async () => {
    setIsLoadingBankDetails(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/company-info`, { headers });
      if (res.ok) {
        const data = await res.json();
        const bd = data?.company?.bankDetails || data?.bankDetails;
        if (bd) {
          applyBankDetails(bd);
        } else if (companyInfo?.bankDetails) {
          applyBankDetails(companyInfo.bankDetails);
        }
      } else if (companyInfo?.bankDetails) {
        applyBankDetails(companyInfo.bankDetails);
      }
    } catch {
      if (companyInfo?.bankDetails) {
        applyBankDetails(companyInfo.bankDetails);
      }
    } finally {
      setIsLoadingBankDetails(false);
    }
  };

  const [items, setItems] = useState([
    {
      description: "FTL Road Freight Transportation (Heavy Trailer)",
      quantity: 1,
      unit: "Trip",
      rate: 42000,
      taxPercent: 18,
      amount: 42000,
    },
  ]);

  const [customerList, setCustomerList] = useState([]);
  const [shipmentList, setShipmentList] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedByBackend, setCalculatedByBackend] = useState(false);
  const [backendCalculation, setBackendCalculation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${API_BASE_URL}/customers?limit=100`, { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const list = Array.isArray(data?.customers)
          ? data.customers
          : Array.isArray(data)
            ? data
            : [];
        setCustomerList(list);
      })
      .catch(() => {});

    fetch(`${API_BASE_URL}/shipments?limit=100`, { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const list = Array.isArray(data?.shipments)
          ? data.shipments
          : Array.isArray(data)
            ? data
            : [];
        setShipmentList(list);
      })
      .catch(() => {});

    // Automatically autofill company bank remittance details from DB on modal open
    fetchAndAutofillBankDetails();
  }, [isOpen]);

  useEffect(() => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setInvoiceNumber(`INV-2026-${randomSuffix}`);

    const today = new Date();
    setInvoiceDate(today.toISOString().split("T")[0]);

    const due = new Date();
    due.setDate(today.getDate() + 15);
    setDueDate(due.toISOString().split("T")[0]);

    setCalculatedByBackend(false);
    setBackendCalculation(null);
  }, [isOpen]);

  // Step 2 & 3: POST /billing/calculate-charges -> Backend calculation & preview
  // Step 2 & 3: POST /billing/calculate-charges -> Backend calculation & preview
  const calculateBackendCharges = async (
    targetShipmentId,
    shipmentObj,
    isFresh = false,
  ) => {
    setIsCalculating(true);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const systemKeywords = [
        "Base Freight",
        "Priority Surcharge",
        "Handling Fee",
        "Fuel Surcharge",
        "Distance Charge",
      ];

      // Extract custom user-added charge lines and pass them as additionalItems
      const customUserItems = items.filter(
        (it) =>
          it.isCustom &&
          !systemKeywords.some((sys) => (it.description || "").includes(sys)),
      );

      const additionalItems = customUserItems.map((it) => ({
        description: it.description || "Additional Charge",
        quantity: Math.max(1, Number(it.quantity) || 1),
        unit: it.unit || "Service",
        unitPrice: Math.max(0, Number(it.rate) || 0),
        taxPercent:
          Number(it.taxPercent) !== undefined && !isNaN(Number(it.taxPercent))
            ? Number(it.taxPercent)
            : 18,
      }));

      const allItemsPayload = items.map((it) => ({
        description: it.description || "Charge Item",
        quantity: Math.max(1, Number(it.quantity) || 1),
        unit: it.unit || "Service",
        unitPrice: Math.max(0, Number(it.rate) || 0),
        taxPercent:
          Number(it.taxPercent) !== undefined && !isNaN(Number(it.taxPercent))
            ? Number(it.taxPercent)
            : 18,
        isCustom: !!it.isCustom,
      }));

      const payload = {
        shipmentId: targetShipmentId,
        packageCount: shipmentObj?.packageCount || 1,
        totalWeight: shipmentObj?.totalWeight || 100,
        priority: shipmentObj?.priority || "Standard",
        additionalItems,
        items: allItemsPayload,
        taxRate: 18,
      };

      const res = await fetch(`${API_BASE_URL}/billing/calculate-charges`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.calculation) {
          if (Array.isArray(data.calculation.breakdownItems)) {
            const updatedItems = data.calculation.breakdownItems.map((b) => {
              const sysKey = systemKeywords.find((sys) =>
                (b.description || "").includes(sys),
              );
              const isCustom = !sysKey;

              // If not fresh load, check if user had edited an existing item
              if (!isFresh) {
                const existingItem = items.find((it) => {
                  if (!it) return false;
                  if (it.description === b.description) return true;
                  return sysKey && (it.description || "").includes(sysKey);
                });

                if (existingItem && existingItem.isEdited) {
                  return { ...existingItem };
                }
              }

              const qty = b.quantity || 1;
              const rate = b.unitPrice ?? b.rate ?? b.amount ?? 0;
              const amt = b.amount ?? qty * rate;
              const tp =
                Number(b.taxPercent ?? b.taxRate) !== undefined &&
                !isNaN(Number(b.taxPercent ?? b.taxRate))
                  ? Number(b.taxPercent ?? b.taxRate)
                  : 18;
              const taxAmt =
                Number(b.taxAmount) !== undefined && !isNaN(Number(b.taxAmount))
                  ? Number(b.taxAmount)
                  : Math.round(amt * (tp / 100) * 100) / 100;
              const totAmt =
                Number(b.totalAmount) !== undefined &&
                !isNaN(Number(b.totalAmount))
                  ? Number(b.totalAmount)
                  : Math.round((amt + taxAmt) * 100) / 100;

              return {
                description: b.description || b.name || "Freight Charge",
                quantity: qty,
                unit: b.unit || (isCustom ? "Service" : "Shipment"),
                rate,
                taxPercent: tp,
                amount: amt,
                taxAmount: taxAmt,
                totalAmount: totAmt,
                isCustom,
                isEdited: false,
              };
            });

            setItems(updatedItems);
          }
          setBackendCalculation(data.calculation);
          setCalculatedByBackend(true);
        }
      }
    } catch (err) {
      console.warn("Could not calculate charges via backend:", err);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCustomerChange = (e) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    const found = customerList.find(
      (c) => String(c._id || c.customerId || c.id) === String(custId),
    );
    if (found) {
      setCustomerName(found.name || "");
      setContactPerson(found.contactPerson || found.name || "");
      setCustomerEmail(found.email || "");
      setCustomerPhone(
        found.phonenumber ? String(found.phonenumber) : found.phone || "",
      );
      setCustomerAddress(found.address || found.pickupAddress || "");
      setCustomerGstin(found.gstin || "");
    }
  };

  // Step 1: Select Shipment -> triggers POST /billing/calculate-charges
  const handleShipmentChange = (e) => {
    const sId = e.target.value;
    setSelectedShipmentId(sId);
    const found = shipmentList.find(
      (s) =>
        String(s._id || s.shipmentId || s.id || s.trackingId) === String(sId),
    );
    if (found) {
      setShipmentId(found.trackingId || found.shipmentId || "");
      setOrigin(found.senderCity || found.senderAddress || "");
      setDestination(found.receiverCity || found.receiverAddress || "");
      const resolvedVehicle =
        (typeof found.vehicleNo === "object" && found.vehicleNo !== null
          ? found.vehicleNo.vregistrationnumber ||
            found.vehicleNo.vregistrationNo ||
            found.vehicleNo.registrationNumber ||
            found.vehicleNo.vehicleNo ||
            found.vehicleNo.vmodel
          : typeof found.vehicleNo === "string"
            ? found.vehicleNo
            : "") ||
        (typeof found.assignedVehicleNo === "object" &&
        found.assignedVehicleNo !== null
          ? found.assignedVehicleNo.vregistrationnumber ||
            found.assignedVehicleNo.vregistrationNo
          : typeof found.assignedVehicleNo === "string"
            ? found.assignedVehicleNo
            : "") ||
        (typeof found.vehicle === "object" && found.vehicle !== null
          ? found.vehicle.vregistrationnumber || found.vehicle.vregistrationNo
          : typeof found.vehicle === "string"
            ? found.vehicle
            : "") ||
        (typeof found.tripNo === "object" && found.tripNo !== null
          ? found.tripNo.vehicleId?.vregistrationnumber ||
            found.tripNo.vehicleNo?.vregistrationnumber ||
            (typeof found.tripNo.vehicleNo === "string"
              ? found.tripNo.vehicleNo
              : "")
          : "") ||
        found.vehicleRegistrationNo ||
        found.vehicleNumber ||
        "";

      setVehicleNo(resolvedVehicle);
      setWeight(found.totalWeight ? `${found.totalWeight} kg` : "");

      if (found.customerId) {
        const cId =
          typeof found.customerId === "object"
            ? found.customerId._id
            : found.customerId;
        const cObj =
          typeof found.customerId === "object"
            ? found.customerId
            : customerList.find(
                (c) => String(c._id || c.customerId || c.id) === String(cId),
              );
        if (cObj) {
          setSelectedCustomerId(String(cObj._id || cObj.customerId || cObj.id));
          setCustomerName(cObj.name || "");
          setContactPerson(cObj.contactPerson || cObj.name || "");
          setCustomerEmail(cObj.email || "");
          setCustomerPhone(
            cObj.phonenumber ? String(cObj.phonenumber) : cObj.phone || "",
          );
          setCustomerAddress(cObj.address || cObj.pickupAddress || "");
          setCustomerGstin(cObj.gstin || "");
        }
      }

      setItems([]);
      calculateBackendCharges(sId, found, true);
    } else {
      setCalculatedByBackend(false);
      setBackendCalculation(null);
    }
  };

  const handleAddItem = () => {
    setItems((prevItems) => [
      ...prevItems,
      {
        description: "",
        quantity: 1,
        unit: "Service",
        rate: 0,
        taxPercent: 18,
        amount: 0,
        taxAmount: 0,
        totalAmount: 0,
        isCustom: true,
        isEdited: true,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems((prevItems) => prevItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prevItems) => {
      const updated = [...prevItems];
      const current = { ...updated[index], [field]: value, isEdited: true };

      const q = Number(current.quantity) || 0;
      const r = Number(current.rate) || 0;
      const tp =
        Number(current.taxPercent) !== undefined &&
        !isNaN(Number(current.taxPercent))
          ? Number(current.taxPercent)
          : 18;

      const amt = Math.round(q * r * 100) / 100;
      const taxAmt = Math.round(amt * (tp / 100) * 100) / 100;
      const totAmt = Math.round((amt + taxAmt) * 100) / 100;

      current.amount = amt;
      current.taxAmount = taxAmt;
      current.totalAmount = totAmt;

      updated[index] = current;
      return updated;
    });
  };

  // Directly consume backend calculation totals if calculated by backend and not edited
  const rawSubtotal = items.reduce(
    (acc, it) => acc + (Number(it.amount) || 0),
    0,
  );
  const rawTaxAmount = items.reduce((acc, it) => {
    const itemTax =
      Number(it.taxAmount) !== undefined && !isNaN(Number(it.taxAmount))
        ? Number(it.taxAmount)
        : Math.round(
            (Number(it.amount) || 0) *
              ((Number(it.taxPercent) || 18) / 100) *
              100,
          ) / 100;
    return acc + itemTax;
  }, 0);
  const roundedRawTax = Math.round(rawTaxAmount * 100) / 100;
  const rawGrandTotal = Math.round((rawSubtotal + roundedRawTax) * 100) / 100;

  const hasUserEdits = items.some((it) => it.isEdited);

  const subtotal =
    calculatedByBackend &&
    backendCalculation?.subtotal !== undefined &&
    !hasUserEdits
      ? backendCalculation.subtotal
      : rawSubtotal;

  const taxAmount =
    calculatedByBackend &&
    backendCalculation?.taxAmount !== undefined &&
    !hasUserEdits
      ? backendCalculation.taxAmount
      : roundedRawTax;

  const grandTotal =
    calculatedByBackend &&
    backendCalculation?.totalAmount !== undefined &&
    !hasUserEdits
      ? backendCalculation.totalAmount
      : rawGrandTotal;

  // Step 4 & 5: POST /invoices -> Backend validates & saves to MongoDB
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert("Please enter Customer Name.");
      return;
    }
    if (!customerEmail.trim()) {
      alert("Please enter Customer Email Address.");
      return;
    }
    if (!customerPhone.trim()) {
      alert("Please enter Customer Phone Number.");
      return;
    }
    if (!customerAddress.trim()) {
      alert("Please enter Customer Billing Address.");
      return;
    }

    if (selectedShipmentId || shipmentId.trim()) {
      if (!shipmentId.trim()) {
        alert("Please enter Shipment Reference AWB.");
        return;
      }
      if (!origin.trim()) {
        alert("Please enter Origin City / Hub.");
        return;
      }
      if (!destination.trim()) {
        alert("Please enter Destination City / Hub.");
        return;
      }
      if (!vehicleNo.trim()) {
        alert("Please enter Assigned Vehicle No.");
        return;
      }
      if (!weight.trim()) {
        alert("Please enter Cargo Weight / Volume.");
        return;
      }
    }

    if (!items || items.length === 0) {
      alert("Please add at least one line item.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].description || !items[i].description.trim()) {
        alert(`Please fill description for line item #${i + 1}`);
        return;
      }
    }

    if (!dueDate) {
      alert("Please select Invoice Due Date.");
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let resolvedCustId = selectedCustomerId;
    if (!resolvedCustId && customerName) {
      const match = customerList.find(
        (c) =>
          c.name?.toLowerCase().trim() === customerName.toLowerCase().trim() ||
          String(c.customerId) === String(customerName).trim(),
      );
      if (match) {
        resolvedCustId = match._id || match.customerId;
      }
    }

    const payload = {
      invoiceType: selectedShipmentId ? "shipment" : "service",
      shipmentId: selectedShipmentId || shipmentId || undefined,
      customerId: resolvedCustId || undefined,
      customerName: customerName.trim(),
      contactPerson: contactPerson.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      customerGstin: customerGstin.trim(),
      items: items.map((it) => {
        const q = Math.max(1, Number(it.quantity) || 1);
        const r = Math.max(0, Number(it.rate ?? it.unitPrice) || 0);
        const amt = Number(it.amount) || q * r;
        const tp =
          Number(it.taxPercent) !== undefined && !isNaN(Number(it.taxPercent))
            ? Number(it.taxPercent)
            : 18;
        const ta =
          Number(it.taxAmount) !== undefined && !isNaN(Number(it.taxAmount))
            ? Number(it.taxAmount)
            : Math.round(amt * (tp / 100) * 100) / 100;
        const tot =
          Number(it.totalAmount) !== undefined && !isNaN(Number(it.totalAmount))
            ? Number(it.totalAmount)
            : Math.round((amt + ta) * 100) / 100;

        return {
          description: it.description || "Charge Item",
          quantity: q,
          unit: it.unit || "Service",
          unitPrice: r,
          amount: amt,
          taxPercent: tp,
          taxAmount: ta,
          totalAmount: tot,
          isCustom: !!it.isCustom,
        };
      }),
      baseCharges: items[0]?.rate || subtotal,
      additionalCharges: 0,
      taxRate: 18,
      paidAmount: status === "Paid" ? grandTotal : 0,
      paymentMethod: paymentMethod,
      notes: notes,
      invoiceDate: invoiceDate,
      dueDate: dueDate,
      origin: origin,
      destination: destination,
      vehicleNo: vehicleNo,
      weight: weight,
      bankDetails: {
        accountName,
        accountNumber,
        bankAndBranch,
        ifscCode,
      },
    };

    try {
      const res = await fetch(`${API_BASE_URL}/invoices`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.invoice) {
        const formatted = formatBackendInvoice(data.invoice);
        onSaveInvoice(formatted);
        onClose();
        return;
      }

      alert(
        data.message || "Failed to create invoice. Please check all fields.",
      );
    } catch (err) {
      console.error("Error submitting invoice:", err);
      alert("Network or server error occurred while creating invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#f8f9fa] border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1a56db] text-white rounded-xl shadow-2xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">
                Create New Freight Tax Invoice
              </h2>
              <p className="text-xs text-slate-400">
                Generate official GST bill of supply for customer consignment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto flex-1 p-6 space-y-6 text-xs"
        >
          {/* Section 1: Customer Selection / Input */}
          <div className="bg-[#f8f9fa] p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                1. Customer & Consignee Details
              </span>
              <span className="text-[11px] text-slate-400">
                Select pre-registered customer or enter manually
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Fast Fill Customer Preset
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={handleCustomerChange}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Choose Customer --</option>
                  {customerList.map((c) => (
                    <option
                      key={c._id || c.customerId || c.id}
                      value={c._id || c.customerId || c.id}
                    >
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Company / Client Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Retail Logistics"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar (Dispatch Mgr)"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  GSTIN Number
                </label>
                <input
                  type="text"
                  placeholder="27AAAAA0000A1Z5"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="billing@company.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 12345"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Billing & Registered Address
              </label>
              <input
                type="text"
                placeholder="Plot 45, Industrial Logistics Park, Chakan, Pune - 410501"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Shipment Linkage */}
          <div className="bg-[#f8f9fa] p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                2. Shipment & Consignment Linkage
              </span>
              <span className="text-[11px] text-slate-400">
                Link existing manifest or create standalone invoice
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Preset Shipment Link
                </label>
                <select
                  value={selectedShipmentId}
                  onChange={handleShipmentChange}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Standalone Billing --</option>
                  {shipmentList
                    .filter(
                      (s) =>
                        String(s._id || s.shipmentId || s.id) ===
                          String(selectedShipmentId) ||
                        String(
                          s.status ||
                            s.shipmentStatus ||
                            s.deliveryStatus ||
                            "",
                        ).toLowerCase() === "delivered",
                    )
                    .map((s) => (
                      <option
                        key={s._id || s.shipmentId || s.id}
                        value={s._id || s.shipmentId || s.id}
                      >
                        {s.trackingId || s.shipmentId || "Shipment"} (
                        {s.senderCity || s.origin || "Origin"} →{" "}
                        {s.receiverCity || s.destination || "Destination"})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Shipment Reference AWB
                </label>
                <input
                  type="text"
                  placeholder="SHP-8842-PN"
                  value={shipmentId}
                  onChange={(e) => setShipmentId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Origin City / Hub
                </label>
                <input
                  type="text"
                  placeholder="Chakan, Pune"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Destination City / Site
                </label>
                <input
                  type="text"
                  placeholder="Bhiwandi, Mumbai"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Assigned Vehicle No
                </label>
                <input
                  type="text"
                  placeholder="MH-12-RN-8842"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Cargo Weight / Volume
                </label>
                <input
                  type="text"
                  placeholder="24.5 MT"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Line Items & Charges Table */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-blue-600" />
                3. Freight Charges & Line Items breakdown
                {isCalculating && (
                  <span className="text-[11px] font-normal text-amber-600 flex items-center gap-1 ml-2">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Calculating
                    backend price...
                  </span>
                )}
                {calculatedByBackend && !isCalculating && (
                  <span className="text-[11px] font-normal text-emerald-600 flex items-center gap-1 ml-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{" "}
                    Live Backend Preview (/billing/calculate-charges)
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                {selectedShipmentId && (
                  <button
                    type="button"
                    onClick={() => {
                      const found = shipmentList.find(
                        (s) =>
                          String(
                            s._id || s.shipmentId || s.id || s.trackingId,
                          ) === String(selectedShipmentId),
                      );
                      calculateBackendCharges(selectedShipmentId, found);
                    }}
                    disabled={isCalculating}
                    className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-bold bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors border border-amber-200"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isCalculating ? "animate-spin" : ""}`}
                    />
                    <span>Recalculate Charges</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-800 font-bold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors border border-blue-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Charge Line</span>
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 w-16 text-center">Qty</th>
                    <th className="py-2 px-3 w-20 text-center">Unit</th>
                    <th className="py-2 px-3 w-24 text-right">Rate (₹)</th>
                    <th className="py-2 px-3 w-16 text-center">GST %</th>
                    <th className="py-2 px-3 w-24 text-right">GST (₹)</th>
                    <th className="py-2 px-3 w-28 text-right">Amount (₹)</th>
                    <th className="py-2 px-2 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, idx) => {
                    const itemTax =
                      item.taxAmount !== undefined &&
                      !isNaN(Number(item.taxAmount))
                        ? Number(item.taxAmount)
                        : Math.round(
                            (Number(item.amount) || 0) *
                              ((Number(item.taxPercent) || 18) / 100) *
                              100,
                          ) / 100;
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "description",
                                e.target.value,
                              )
                            }
                            placeholder="Line item charge description"
                            className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(idx, "quantity", e.target.value)
                            }
                            className="w-full text-center bg-white border border-gray-200 rounded px-1.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) =>
                              handleItemChange(idx, "unit", e.target.value)
                            }
                            placeholder="Trip / MT"
                            className="w-full text-center bg-white border border-gray-200 rounded px-1.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            required
                            value={item.rate}
                            onChange={(e) =>
                              handleItemChange(idx, "rate", e.target.value)
                            }
                            className="w-full text-right bg-white border border-gray-200 rounded px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={item.taxPercent}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "taxPercent",
                                e.target.value,
                              )
                            }
                            className="w-full text-center bg-white border border-gray-200 rounded px-1 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="p-2 text-right font-medium text-amber-700">
                          {formatINR(itemTax)}
                        </td>
                        <td className="p-2 text-right font-bold text-slate-900 pr-3">
                          {formatINR(item.amount)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={items.length <= 1}
                            className="text-slate-400 hover:text-rose-600 disabled:opacity-30 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Dates & Summary Calculations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-3 bg-[#f8f9fa] p-3.5 rounded-xl border border-gray-200">
              <span className="font-bold text-slate-800 uppercase tracking-wide block border-b border-gray-200 pb-1.5">
                Dates & Terms
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Payment Method / Terms
                </label>
                <input
                  type="text"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="NEFT / RTGS Bank Transfer"
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Remarks & Special Terms
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Calculations Summary Card */}
            <div className="bg-[#f8f9fa] p-4 rounded-xl border border-gray-200 flex flex-col justify-between space-y-3">
              <span className="font-bold text-slate-800 uppercase tracking-wide block border-b border-gray-200 pb-1.5">
                Tax Calculation Summary
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Amount:</span>
                  <span className="font-semibold text-slate-900">
                    {formatINR(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Total GST Tax Amount:</span>
                  <span className="font-semibold text-slate-900">
                    {formatINR(taxAmount)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-500 pt-1 border-t border-gray-200">
                  <span>Round Off:</span>
                  <span>₹0.00</span>
                </div>

                <div className="pt-2 border-t-2 border-slate-300 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900 font-heading">
                    Total Payable:
                  </span>
                  <span className="text-lg font-extrabold text-[#1a56db] font-heading">
                    {formatINR(grandTotal)}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-200 text-[11px] text-blue-900 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 inline shrink-0" />
                  <span>
                    {calculatedByBackend
                      ? "Price preview verified via Backend API (/billing/calculate-charges)"
                      : "GST e-Invoice format with QR verification readiness"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Company Bank Remittance Details */}
          <div className="bg-[#f8f9fa] p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  5. Company Bank Remittance Details
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Official bank details printed on tax invoice for NEFT/RTGS
                  payments
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => {
                    setAccountName(e.target.value);
                    setBankAutofillSuccess(false);
                  }}
                  placeholder="Account Name"
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Account No
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                    setBankAutofillSuccess(false);
                  }}
                  placeholder="Account Number"
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Bank & Branch
                </label>
                <input
                  type="text"
                  value={bankAndBranch}
                  onChange={(e) => {
                    setBankAndBranch(e.target.value);
                    setBankAutofillSuccess(false);
                  }}
                  placeholder="Bank & Branch Name"
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => {
                    setIfscCode(e.target.value);
                    setBankAutofillSuccess(false);
                  }}
                  placeholder="IFSC Code"
                  className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Form Submit Footer inside form */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 text-slate-700 text-xs font-semibold hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#1a56db] hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting to MongoDB...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Generate Tax Invoice</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 5.1 EDIT INVOICE STATUS MODAL COMPONENT
// ==========================================
function EditStatusModal({ isOpen, onClose, invoice, onSaveStatus }) {
  if (!isOpen || !invoice) return null;

  const [dbInvoice, setDbInvoice] = useState(invoice);
  const [newPaymentReceived, setNewPaymentReceived] = useState("0");

  useEffect(() => {
    if (!isOpen || !invoice) return;
    setDbInvoice(invoice);
    const targetId = invoice._id || invoice.id;
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${API_BASE_URL}/invoices/${targetId}`, { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const fresh = data?.invoice || data;
        if (fresh) {
          const formatted = formatBackendInvoice(fresh);
          setDbInvoice(formatted || fresh);
        }
      })
      .catch((err) => {
        console.error("Error fetching fresh invoice from DB:", err);
      });
  }, [isOpen, invoice]);

  const activeInvoice = dbInvoice || invoice;
  const totalAmount = Number(activeInvoice.totalAmount) || 0;
  const existingPaidAmount =
    activeInvoice.paidAmount !== undefined &&
    !isNaN(Number(activeInvoice.paidAmount))
      ? Number(activeInvoice.paidAmount)
      : activeInvoice.status === "Paid"
        ? totalAmount
        : 0;

  const getInitialStatus = (inv) => {
    const raw = String(
      inv.paymentStatus || inv.status || "pending",
    ).toLowerCase();
    if (raw === "partially paid" || raw === "partially_paid")
      return "partially_paid";
    if (raw === "paid") return "paid";
    if (raw === "overdue") return "overdue";
    if (raw === "cancelled") return "cancelled";
    return "pending";
  };

  const [status, setStatus] = useState(getInitialStatus(activeInvoice));
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionRef, setTransactionRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeInvoice) {
      setStatus(getInitialStatus(activeInvoice));
      setPaymentMethod(activeInvoice.paymentMethod || "cash");
      setTransactionRef(activeInvoice.transactionRef || "");
      setNewPaymentReceived("0");
    }
  }, [dbInvoice, invoice]);

  const addedPayment = Number(newPaymentReceived) || 0;
  const finalPaidAmount = Math.min(
    totalAmount,
    existingPaidAmount + addedPayment,
  );
  const balanceAmount = Math.max(
    0,
    Math.round((totalAmount - finalPaidAmount) * 100) / 100,
  );

  const handleNewPaymentChange = (val) => {
    setNewPaymentReceived(val);
    const p = Number(val) || 0;
    const totPaid = existingPaidAmount + p;
    if (totPaid >= totalAmount && totalAmount > 0) {
      setStatus("paid");
    } else if (totPaid > 0 && totPaid < totalAmount) {
      setStatus("partially_paid");
    } else if (totPaid === 0) {
      setStatus("pending");
    }
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    if (newStatus === "paid") {
      setNewPaymentReceived(
        String(Math.max(0, totalAmount - existingPaidAmount)),
      );
    } else if (newStatus === "pending") {
      setNewPaymentReceived("0");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const targetId = invoice._id || invoice.id;

    try {
      const res = await fetch(`${API_BASE_URL}/invoices/${targetId}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status,
          paidAmount: finalPaidAmount,
          balanceAmount,
          paymentMethod,
          transactionRef,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        onSaveStatus(
          targetId,
          status,
          finalPaidAmount,
          balanceAmount,
          data.invoice,
        );
        onClose();
      } else {
        alert(data.message || "Failed to update invoice status.");
      }
    } catch (err) {
      console.error("Error updating invoice status:", err);
      alert("Network error occurred while updating status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 text-xs">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#f8f9fa] border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#1a56db] text-white rounded-xl shadow-2xs">
              <Edit className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Update Invoice Status
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {invoice.invoiceNumber || invoice.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Total Amount (₹)
            </label>
            <input
              type="text"
              readOnly
              value={formatINR(totalAmount)}
              className="w-full bg-slate-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-700 font-bold cursor-not-allowed focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Paid Amount (₹)
            </label>
            <input
              type="text"
              readOnly
              value={formatINR(existingPaidAmount)}
              className="w-full bg-slate-100 border border-gray-200 rounded-lg px-3 py-2 text-emerald-800 font-bold cursor-not-allowed focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              New Payment Received (₹)
            </label>
            <input
              type="number"
              min="0"
              max={Math.max(0, totalAmount - existingPaidAmount)}
              step="any"
              value={newPaymentReceived}
              onChange={(e) => handleNewPaymentChange(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Remaining Balance (₹)
            </label>
            <input
              type="text"
              readOnly
              value={formatINR(balanceAmount)}
              className="w-full bg-slate-100 border border-gray-200 rounded-lg px-3 py-2 text-amber-700 font-bold cursor-not-allowed focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="pending">Pending</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="cash">cash</option>
              <option value="card">card</option>
              <option value="bank_transfer">bank_transfer</option>
              <option value="upi">upi</option>
              <option value="credit">credit</option>
              <option value="cheque">cheque</option>
              <option value="other">other</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Transaction Ref / Reference No
            </label>
            <input
              type="text"
              placeholder="e.g. UTR987654321 / CHQ-00129"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 text-slate-700 text-xs font-semibold hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-[#1a56db] hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Status</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 6. CREATE USER MODAL COMPONENT
// ==========================================
function CreateUserModal({ isOpen, onClose, onSaveUser }) {
  if (!isOpen) return null;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Fleet Manager");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim()) {
      alert("Please provide full name and email address.");
      return;
    }

    const newUser = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || "+91 98765 00000",
      role,
      department:
        role === "Fleet Manager" ? "Fleet Management" : "Billing & Operations",
      status: "Active",
      initials:
        fullName
          .trim()
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "US",
      createdAt: new Date().toISOString().split("T")[0],
    };

    onSaveUser(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-120 p-6 sm:p-7 relative animate-in zoom-in-95 duration-200">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#edf4ff] text-[#1a6cf0] flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-heading leading-tight">
                Create New System User
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Add operational staff, dispatchers or drivers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors -mr-1 -mt-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rajesh Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full text-xs sm:text-sm bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="rajesh@logistics.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs sm:text-sm bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Role & Phone Number (Two Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Role */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Role
              </label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full appearance-none text-xs sm:text-sm bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-9 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="Fleet Manager">Fleet Manager</option>
                  <option value="Billing Manager">Billing Manager</option>
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="Driver">Driver</option>
                  <option value="Logistics Officer">Logistics Officer</option>
                  <option value="Warehouse Supervisor">
                    Warehouse Supervisor
                  </option>
                  <option value="Admin">Admin</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+91 98765 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs sm:text-sm bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#1a6cf0] hover:bg-[#155ad0] text-white text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 7. INVOICE DETAIL MODAL COMPONENT
// ==========================================
function InvoiceDetailModal({
  invoice,
  isOpen,
  onClose,
  onUpdateStatus,
  onTriggerDownload,
  companyInfo,
}) {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    const content = document.getElementById("printable-invoice-modal");
    if (!content) {
      window.print();
      return;
    }

    let printMount = document.getElementById("print-mount");
    if (!printMount) {
      printMount = document.createElement("div");
      printMount.id = "print-mount";
      document.body.appendChild(printMount);
    }

    printMount.innerHTML = content.innerHTML;
    window.print();

    setTimeout(() => {
      if (printMount) {
        printMount.innerHTML = "";
      }
    }, 1000);
  };

  const handleDownload = async () => {
    if (onTriggerDownload) {
      onTriggerDownload(invoice);
    } else {
      await downloadInvoicePDF(invoice);
    }
  };

  const items =
    invoice.items && invoice.items.length > 0
      ? invoice.items
      : [
          {
            description:
              invoice.serviceDescription || "Logistics & Freight Services",
            quantity: 1,
            unit: "Trip",
            rate: invoice.subtotal || invoice.totalAmount,
            taxPercent: 18,
            amount: invoice.subtotal || invoice.totalAmount,
          },
        ];

  const subtotal =
    invoice.subtotal ||
    items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const taxAmount = invoice.taxAmount || invoice.totalAmount - subtotal;
  const grandTotal = invoice.totalAmount || subtotal + taxAmount;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }

          .no-print, header, nav, sidebar, footer {
            display: none !important;
          }

          /* Hide main app root when printing via print-mount */
          #root {
            display: none !important;
          }

          #print-mount {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          #print-mount * {
            visibility: visible !important;
          }

          /* Fallback styling for direct window print */
          .fixed.inset-0 {
            position: static !important;
            display: block !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            width: 100% !important;
            box-shadow: none !important;
          }
          .fixed.inset-0 > div {
            position: static !important;
            display: block !important;
            max-width: 100% !important;
            width: 100% !important;
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #printable-invoice-modal {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }

          table, tr, td, th, .border, .rounded-xl {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print px-6 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1a56db] rounded-lg">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base font-heading">
                  Tax Invoice Preview
                </span>
                <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  {invoice.invoiceNumber || invoice.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official GST Freight Bill of Supply document
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1a56db] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
              title="Download PDF Document"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document Body */}
        <div
          id="printable-invoice-modal"
          className="overflow-y-auto flex-1 p-6 sm:p-8 bg-white text-slate-900 text-xs"
        >
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold text-blue-900 tracking-tight font-heading">
                    {companyInfo?.name || ""}
                  </span>
                </div>
                {companyInfo?.tagline && (
                  <div className="text-xs font-medium text-slate-600 mt-0.5">
                    {companyInfo.tagline}
                  </div>
                )}
                <div className="text-[11px] text-slate-500 mt-1 space-y-0.5 leading-tight">
                  {companyInfo?.headOffice && <p>{companyInfo.headOffice}</p>}
                  <p>
                    {companyInfo?.gstin && (
                      <span>
                        <span className="font-semibold text-slate-700">
                          GSTIN:
                        </span>{" "}
                        {companyInfo.gstin}
                      </span>
                    )}
                    {companyInfo?.cin && (
                      <span className="ml-1">
                        |{" "}
                        <span className="font-semibold text-slate-700">
                          CIN:
                        </span>{" "}
                        {companyInfo.cin}
                      </span>
                    )}
                    {companyInfo?.pan && (
                      <span className="ml-1">
                        |{" "}
                        <span className="font-semibold text-slate-700">
                          PAN:
                        </span>{" "}
                        {companyInfo.pan}
                      </span>
                    )}
                  </p>
                  <p>
                    {companyInfo?.phone && (
                      <span>
                        <span className="font-semibold text-slate-700">
                          Phone:
                        </span>{" "}
                        {companyInfo.phone}
                      </span>
                    )}
                    {companyInfo?.email && (
                      <span className="ml-1">
                        |{" "}
                        <span className="font-semibold text-slate-700">
                          Email:
                        </span>{" "}
                        {companyInfo.email}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right flex flex-col items-start sm:items-end">
                <span className="text-sm font-black tracking-widest text-slate-900 uppercase font-heading">
                  TAX INVOICE
                </span>
                <span className="text-[11px] text-slate-500">
                  ORIGINAL FOR RECIPIENT
                </span>

                <div className="mt-2">
                  {(invoice.status === "Paid" || invoice.status === "paid") && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> PAID & SETTLED
                    </span>
                  )}
                  {(invoice.status === "Pending" ||
                    invoice.status === "pending") && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold rounded-full">
                      <Clock className="w-3.5 h-3.5" /> PENDING PAYMENT
                    </span>
                  )}
                  {(invoice.status === "Partially Paid" ||
                    invoice.status === "partially_paid" ||
                    invoice.status === "partially paid") && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 border border-blue-300 text-blue-800 text-xs font-bold rounded-full">
                      <Info className="w-3.5 h-3.5" /> PARTIALLY PAID
                    </span>
                  )}
                  {(invoice.status === "Overdue" ||
                    invoice.status === "overdue") && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold rounded-full animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" /> OVERDUE BILLING
                    </span>
                  )}
                  {(invoice.status === "Cancelled" ||
                    invoice.status === "cancelled") && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold rounded-full">
                      <X className="w-3.5 h-3.5" /> CANCELLED INVOICE
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5 p-4 rounded-xl bg-[#f8f9fa] border border-gray-200">
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-gray-200">
                Invoice Specifics
              </div>
              <div className="grid grid-cols-3 text-xs gap-1 pt-1">
                <span className="text-slate-500 font-medium">
                  Invoice Number:
                </span>
                <span className="col-span-2 font-bold text-slate-900 font-heading">
                  {invoice.invoiceNumber || invoice.id}
                </span>

                <span className="text-slate-500 font-medium">
                  Invoice Date:
                </span>
                <span className="col-span-2 font-semibold text-slate-800">
                  {invoice.invoiceDate}
                </span>

                <span className="text-slate-500 font-medium">
                  Payment Due Date:
                </span>
                <span className="col-span-2 font-semibold text-slate-800">
                  {invoice.dueDate}
                </span>

                <span className="text-slate-500 font-medium">Shipment ID:</span>
                <span className="col-span-2 font-mono font-bold text-blue-700">
                  {invoice.shipmentId}
                </span>

                <span className="text-slate-500 font-medium">SAC Code:</span>
                <span className="col-span-2 text-slate-700">
                  996511 (Goods Transport by Road)
                </span>

                <span className="text-slate-500 font-medium">
                  Payment Terms:
                </span>
                <span className="col-span-2 text-slate-700">
                  {invoice.paymentMethod || "Net 15 Days"}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-gray-200">
                Billed To / Consignee
              </div>
              <div className="pt-1">
                <div className="text-sm font-bold text-slate-900">
                  {invoice.customer?.name}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  <span className="font-semibold text-slate-700">Attn:</span>{" "}
                  {invoice.customer?.contactPerson} ({invoice.customer?.phone})
                </div>
                <div className="text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-700">GSTIN:</span>{" "}
                  <span className="font-mono font-bold text-slate-800">
                    {invoice.customer?.gstin || "N/A"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                  {invoice.customer?.address}
                </div>
                {invoice.customer?.email && (
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Email: {invoice.customer.email}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#1a56db] text-white rounded-md">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                  Consignment Route:{" "}
                </span>
                <span className="text-xs font-semibold text-blue-800">
                  {invoice.shipmentDetails?.origin || "Hub"} →{" "}
                  {invoice.shipmentDetails?.destination || "Destination"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-500">Vehicle No: </span>
                <span className="font-mono font-bold text-slate-800">
                  {invoice.shipmentDetails?.vehicleNo || "MH-12-RN-8842"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Cargo Weight: </span>
                <span className="font-bold text-slate-800">
                  {invoice.shipmentDetails?.weight || "24.5 MT"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-hidden mb-5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">
                    Service & Shipment Description
                  </th>
                  <th className="py-2.5 px-3 text-center">Qty / Unit</th>
                  <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                  <th className="py-2.5 px-3 text-center">GST %</th>
                  <th className="py-2.5 px-3 text-right">GST (₹)</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {items.map((item, index) => {
                  const itemTax =
                    item.taxAmount !== undefined &&
                    !isNaN(Number(item.taxAmount))
                      ? Number(item.taxAmount)
                      : Math.round(
                          (Number(item.amount) || 0) *
                            ((Number(item.taxPercent) || 18) / 100) *
                            100,
                        ) / 100;
                  return (
                    <tr
                      key={index}
                      className={
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      }
                    >
                      <td className="py-3 px-3 text-center text-slate-500 font-medium">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">
                          {item.description}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          SAC: 996511 - Road Freight Transportation Logistics
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-slate-700">
                        {item.quantity} {item.unit || "Trip"}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700">
                        {formatINR(item.rate)}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-700">
                        {item.taxPercent || 18}%
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-amber-700">
                        {formatINR(itemTax)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatINR(item.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Payment History Log */}
          {Array.isArray(invoice.paymentHistory) &&
            invoice.paymentHistory.length > 0 && (
              <div className="rounded-xl border border-gray-200 overflow-hidden mb-5">
                <div className="px-3.5 py-2 bg-slate-900 text-white font-bold uppercase tracking-wide text-[11px] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>
                      Payment History & Audit Trail (
                      {invoice.paymentHistory.length})
                    </span>
                  </div>
                  <span className="text-slate-300 font-medium normal-case text-[11px]">
                    Total Payments Received:{" "}
                    {formatINR(invoice.paidAmount || 0)}
                  </span>
                </div>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-gray-200 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="py-2 px-3">Date & Time</th>
                      <th className="py-2 px-3 text-right">Amount (₹)</th>
                      <th className="py-2 px-3">Method</th>
                      <th className="py-2 px-3">Transaction Ref</th>
                      <th className="py-2 px-3">Notes / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoice.paymentHistory.map((ph, idx) => (
                      <tr
                        key={idx}
                        className={
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                        }
                      >
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          {ph.paidAt
                            ? new Date(ph.paidAt).toLocaleString()
                            : "N/A"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                          {formatINR(ph.amount)}
                        </td>
                        <td className="py-2.5 px-3 uppercase font-semibold text-slate-800 text-[11px]">
                          {ph.paymentMethod || "cash"}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-800 font-medium text-[11px]">
                          {ph.transactionRef || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 italic">
                          {ph.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 pb-4">
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Amount in Words:
                </span>
                <div className="text-xs font-bold text-slate-900 italic mt-0.5 bg-[#f8f9fa] p-2 rounded-lg border border-gray-200">
                  {numberToWordsINR(grandTotal)}
                </div>
              </div>

              <div className="bg-[#f8f9fa] rounded-xl p-3 border border-gray-200 text-[11px]">
                <div className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Bank Remittance Details (NEFT / RTGS)</span>
                </div>
                <div className="grid grid-cols-3 gap-0.5 text-slate-600">
                  <span className="font-medium">Account Name:</span>
                  <span className="col-span-2 font-semibold text-slate-800">
                    {invoice.bankDetails?.accountName ||
                      companyInfo?.bankDetails?.accountName ||
                      ""}
                  </span>

                  <span className="font-medium">Account No:</span>
                  <span className="col-span-2 font-mono font-bold text-blue-700">
                    {invoice.bankDetails?.accountNumber ||
                      companyInfo?.bankDetails?.accountNumber ||
                      ""}
                  </span>

                  <span className="font-medium">Bank & Branch:</span>
                  <span className="col-span-2 text-slate-800">
                    {invoice.bankDetails?.bankAndBranch ||
                      (companyInfo?.bankDetails?.bankName
                        ? `${companyInfo.bankDetails.bankName}, ${companyInfo.bankDetails.branch || ""}`
                            .trim()
                            .replace(/^, |, $/g, "")
                        : companyInfo?.bankDetails?.branch || "")}
                  </span>

                  <span className="font-medium">IFSC Code:</span>
                  <span className="col-span-2 font-mono font-bold text-slate-800">
                    {invoice.bankDetails?.ifscCode ||
                      companyInfo?.bankDetails?.ifscCode ||
                      ""}
                  </span>
                </div>
              </div>

              {invoice.notes && (
                <div className="text-[11px] text-slate-600 bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/60">
                  <span className="font-semibold text-amber-900">Note: </span>
                  <span>{invoice.notes}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="bg-[#f8f9fa] rounded-xl p-4 border border-gray-200 space-y-2.5">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Freight Base Subtotal:</span>
                  <span className="font-semibold text-slate-900">
                    {formatINR(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-xs text-slate-600">
                  <span>Total GST Tax Amount:</span>
                  <span className="font-semibold text-slate-900">
                    {formatINR(taxAmount)}
                  </span>
                </div>

                <div className="flex justify-between text-xs text-slate-500 pt-1 border-t border-gray-200">
                  <span>Round Off:</span>
                  <span className="text-slate-700">₹0.00</span>
                </div>

                <div className="pt-2 border-t-2 border-slate-300 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900 font-heading">
                    Total Payable (INR):
                  </span>
                  <span className="text-xl font-extrabold text-[#1a56db] font-heading">
                    {formatINR(grandTotal)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#f8f9fa] rounded-xl border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white rounded border border-gray-200">
                    <QrCode className="w-8 h-8 text-slate-800" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>GST e-Invoice IRN Verified</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      IRN: 8fa99c2...4e712a
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400">
                    Authorized Signatory
                  </div>
                  <div className="text-xs font-bold text-slate-800 font-heading">
                    LogiTrack Accounts Desk
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3 text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div>
              1. Goods received in good order. Standard terms of carriage apply.
              2. Subject to Mumbai Jurisdiction.
            </div>
            <div className="font-semibold text-slate-600">
              Page 1 of 1 • Generated via LogiTrack IMS
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="no-print px-6 py-3 bg-[#f8f9fa] border-t border-gray-200 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Close Preview
            </button>
            <button
              onClick={handleDownload}
              className="px-5 py-2 rounded-lg bg-[#1a56db] hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 8. MAIN DASHBOARD INVOICE COMPONENT
// ==========================================
export default function DashboardInvoice() {
  const [invoices, setInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [customerFilter, setCustomerFilter] = useState("");

  // Users State
  const [users, setUsers] = useState([
    {
      id: "USR-001",
      name: "Admin User",
      email: "admin@logitrack.com",
      role: "Admin",
      department: "Billing & Logistics",
      initials: "AD",
      status: "Active",
    },
  ]);
  const [currentUser, setCurrentUser] = useState(users[0]);

  // Modals & Views State
  const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] =
    useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] =
    useState(null);
  const [selectedInvoiceForStatus, setSelectedInvoiceForStatus] =
    useState(null);
  const [showReportsSection, setShowReportsSection] = useState(true);
  const [toast, setToast] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);

  const fetchCompanyInfoFromDB = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/company-info`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data?.company) {
          dynamicCompanyInfo = data.company;
          setCompanyInfoData(data.company);
          setCompanyInfo(data.company);
        }
      }
    } catch (err) {
      console.warn("Company info fetch notice:", err);
    }
  };

  // Fetch initial company info and invoices from MongoDB on mount
  useEffect(() => {
    fetchCompanyInfoFromDB();

    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${API_BASE_URL}/invoices?limit=100`, { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const rawList = Array.isArray(data?.invoices)
          ? data.invoices
          : Array.isArray(data)
            ? data
            : [];
        if (rawList.length > 0) {
          const formatted = rawList.map(formatBackendInvoice).filter(Boolean);
          setInvoices(formatted);
        }
      })
      .catch((err) => console.warn("Initial invoices fetch notice:", err));
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleRefresh = () => {
    fetchCompanyInfoFromDB();
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${API_BASE_URL}/invoices?limit=100`, { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const rawList = Array.isArray(data?.invoices)
          ? data.invoices
          : Array.isArray(data)
            ? data
            : [];
        if (rawList.length > 0) {
          const formatted = rawList.map(formatBackendInvoice).filter(Boolean);
          setInvoices(formatted);
        }
      })
      .catch(() => {});

    showToast(
      "Billing ledger synchronized with central fleet database",
      "info",
    );
  };

  // 1. Create Invoice Handler
  const handleSaveNewInvoice = (newInvoice) => {
    setInvoices([newInvoice, ...invoices]);
    showToast(
      `Invoice ${newInvoice.invoiceNumber || newInvoice.id} created successfully!`,
      "success",
    );
  };

  // 2. Create User Handler
  const handleSaveNewUser = (newUser) => {
    setUsers((prev) => [...prev, newUser]);
    showToast(
      `User ${newUser.name} (${newUser.role}) created successfully!`,
      "success",
    );
  };

  // 3. Status Update Handler
  const handleUpdateStatus = (invoiceId, newStatus) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          return { ...inv, status: newStatus };
        }
        return inv;
      }),
    );

    if (selectedInvoiceForDetail && selectedInvoiceForDetail.id === invoiceId) {
      setSelectedInvoiceForDetail((prev) => ({ ...prev, status: newStatus }));
    }

    showToast(`Invoice ${invoiceId} updated to ${newStatus}`, "info");
  };

  // 4. Edit Status Modal Handler
  const handleToggleStatus = (target) => {
    const inv =
      typeof target === "object" && target !== null
        ? target
        : invoices.find((i) => i.id === target || i._id === target);
    if (!inv) return;
    setSelectedInvoiceForStatus(inv);
  };

  const handleSaveStatusUpdate = (
    invoiceId,
    newStatusRaw,
    newPaidAmount,
    newBalance,
    backendInvoice,
  ) => {
    const formatted = backendInvoice
      ? formatBackendInvoice(backendInvoice)
      : null;
    const finalStatus = formatted
      ? formatted.status
      : newStatusRaw === "paid"
        ? "Paid"
        : newStatusRaw === "overdue"
          ? "Overdue"
          : newStatusRaw === "partially_paid"
            ? "Partially Paid"
            : newStatusRaw === "cancelled"
              ? "Cancelled"
              : "Pending";

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId || inv._id === invoiceId) {
          if (formatted) return formatted;
          return {
            ...inv,
            status: finalStatus,
            paidAmount: newPaidAmount,
            balanceAmount: newBalance,
          };
        }
        return inv;
      }),
    );

    if (
      selectedInvoiceForDetail &&
      (selectedInvoiceForDetail.id === invoiceId ||
        selectedInvoiceForDetail._id === invoiceId)
    ) {
      setSelectedInvoiceForDetail((prev) =>
        formatted
          ? formatted
          : {
              ...prev,
              status: finalStatus,
              paidAmount: newPaidAmount,
              balanceAmount: newBalance,
            },
      );
    }

    showToast(
      `Invoice status updated to ${finalStatus} successfully`,
      "success",
    );
  };

  // 5. Download Invoice PDF
  const handleDownloadInvoice = async (invoice) => {
    const success = await downloadInvoicePDF(invoice, companyInfo);
    if (success) {
      showToast(
        `Downloaded official PDF for ${invoice.invoiceNumber || invoice.id}`,
        "success",
      );
    }
  };

  return (
    <div className="shp-container">
      {/* Toast Notification */}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Top Header & Metrics Banner */}
      <div className="shp-header">
        <div>
          <h2 className="shp-title">Invoice & Billing Management</h2>
          <p className="shp-subtitle">
            Manage customer freight invoices, calculate shipment charges, track
            receivables & aging statuses, generate tax documents, and analyze
            billing summaries.
          </p>
        </div>
        <div className="shp-header__actions">
          <button
            type="button"
            className="shp-btn shp-btn--ghost"
            onClick={handleRefresh}
            title="Refresh"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            type="button"
            className="shp-btn shp-btn--ghost"
            onClick={() => exportInvoicesToCSV(invoices)}
          >
            <FileSpreadsheet size={14} />
            Export CSV
          </button>
          <button
            type="button"
            className="shp-btn shp-btn--secondary"
            onClick={() => setShowReportsSection(!showReportsSection)}
          >
            <QrCode size={14} />
            {showReportsSection ? "Hide Tax Report" : "Tax Report"}
          </button>
          <button
            type="button"
            className="shp-btn shp-btn--primary"
            onClick={() => setIsCreateInvoiceModalOpen(true)}
          >
            <Plus size={16} />
            Create Invoice
          </button>
        </div>
      </div>

      {/* 5 Summary KPI Metric Cards */}
      <BillingSummaryCards
        invoices={invoices}
        activeFilter={statusFilter}
        onSelectFilter={(st) => setStatusFilter(st)}
      />

      {/* Optional Interactive Reports / Tax Aging Flow Section */}
      {showReportsSection && (
        <div className="animate-in fade-in slide-in-from-top-3 duration-300">
          <BillingReportsSection
            invoices={invoices}
            onFilterCustomer={(c) => {
              setCustomerFilter(c);
              showToast(`Filtered ledger for ${c}`, "info");
            }}
          />
        </div>
      )}

      {/* Customer Invoices & Billing Table */}
      <InvoiceTable
        invoices={invoices}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        customerFilter={customerFilter}
        setCustomerFilter={setCustomerFilter}
        onViewInvoice={(inv) => setSelectedInvoiceForDetail(inv)}
        onDownloadInvoice={handleDownloadInvoice}
        onToggleStatus={handleToggleStatus}
        onOpenReportTab={() => setShowReportsSection((prev) => !prev)}
      />

      {/* Create Invoice Modal */}
      <InvoiceModal
        isOpen={isCreateInvoiceModalOpen}
        onClose={() => setIsCreateInvoiceModalOpen(false)}
        onSaveInvoice={handleSaveNewInvoice}
        companyInfo={companyInfo}
      />

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        onSaveUser={handleSaveNewUser}
      />

      {/* Edit Invoice Status Modal */}
      <EditStatusModal
        isOpen={!!selectedInvoiceForStatus}
        invoice={selectedInvoiceForStatus}
        onClose={() => setSelectedInvoiceForStatus(null)}
        onSaveStatus={handleSaveStatusUpdate}
      />

      {/* Invoice Details & Printable Document Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoiceForDetail}
        isOpen={!!selectedInvoiceForDetail}
        onClose={() => setSelectedInvoiceForDetail(null)}
        onUpdateStatus={handleUpdateStatus}
        onTriggerDownload={handleDownloadInvoice}
        companyInfo={companyInfo}
      />
    </div>
  );
}
