import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BellRing,
  Building,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Coins,
  DollarSign,
  Download,
  Edit,
  Edit2,
  Eye,
  FileCheck,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  FileWarning,
  Fuel,
  Gauge,
  Info,
  MapPin,
  Navigation,
  Phone,
  Plus,
  Power,
  PowerOff,
  RotateCcw,
  Route,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Truck,
  Upload,
  User,
  Wrench,
  X,
} from "lucide-react";

import {
  VEHICLE_TYPES,
  VEHICLE_STATUSES,
  SORT_OPTIONS,
} from "../data/vehicleData";
import "../../styles/ShipmentManagement.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ── 1. VehicleSummaryCards Component ─────────────────────────────────────────

function VehicleSummaryCards({
  vehicles = [],
  currentFilter,
  onSelectFilter,
  onOpenReminders,
}) {
  const totalVehicles = vehicles.length;
  const availableCount = vehicles.filter(
    (v) => v.status === "Available",
  ).length;
  const assignedCount = vehicles.filter((v) => v.status === "Assigned").length;
  const maintenanceCount = vehicles.filter(
    (v) => v.status === "In Maintenance",
  ).length;

  const expiringDocsCount = vehicles.filter((v) => {
    const docs = v.documents;
    if (!docs) return false;
    return Object.values(docs).some(
      (d) => d.status === "Expiring Soon" || d.status === "Expired",
    );
  }).length;

  const cards = [
    {
      id: "total",
      title: "Total Vehicles",
      count: totalVehicles,
      subtitle: "All registered fleet vehicles",
      icon: Truck,
      toneClass: "shp-kpi-card__icon--info",
      filterValue: "All",
    },
    {
      id: "available",
      title: "Available",
      count: availableCount,
      subtitle: "Ready for assignment",
      icon: CheckCircle2,
      toneClass: "shp-kpi-card__icon--success",
      filterValue: "Available",
    },
    {
      id: "assigned",
      title: "Assigned",
      count: assignedCount,
      subtitle: "Currently on trip",
      icon: Navigation,
      toneClass: "shp-kpi-card__icon--info",
      filterValue: "Assigned",
    },
    {
      id: "maintenance",
      title: "In Maintenance",
      count: maintenanceCount,
      subtitle: "Under maintenance",
      icon: Wrench,
      toneClass: "shp-kpi-card__icon--warning",
      filterValue: "In Maintenance",
    },
    {
      id: "documents",
      title: "Expiring Documents",
      count: expiringDocsCount,
      subtitle:
        expiringDocsCount > 0
          ? "Require compliance review"
          : "All documents valid",
      icon: FileWarning,
      toneClass: "shp-kpi-card__icon--danger",
      filterValue: null,
      isSpecialAction: true,
    },
  ];

  return (
    <div className="shp-kpi-grid">
      {cards.map((card) => {
        const IconComponent = card.icon;

        return (
          <div
            key={card.id}
            onClick={() => {
              if (card.isSpecialAction && onOpenReminders) {
                onOpenReminders();
              } else if (card.filterValue && onSelectFilter) {
                onSelectFilter(card.filterValue);
              }
            }}
            className="shp-kpi-card"
            style={{ cursor: "pointer" }}
          >
            <div className="shp-kpi-card__head">
              <span className={`shp-kpi-card__icon ${card.toneClass || ""}`}>
                <IconComponent size={16} />
              </span>
              <span className="shp-kpi-card__title">{card.title}</span>
            </div>

            <div className="shp-kpi-card__value">{card.count}</div>

            <div className="shp-kpi-card__foot">{card.subtitle}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── 2. VehicleToolbar Component ──────────────────────────────────────────────

function VehicleToolbar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  sortBy,
  setSortBy,
  statusCounts = {},
  onFilterChange,
}) {
  const tabs = [
    { key: "All", label: "All Vehicles", count: statusCounts.all ?? 0 },
    {
      key: "Available",
      label: "Available",
      count: statusCounts.available ?? 0,
    },
    { key: "Assigned", label: "Assigned", count: statusCounts.assigned ?? 0 },
    {
      key: "In Maintenance",
      label: "In Maintenance",
      count: statusCounts.maintenance ?? 0,
    },
    { key: "Inactive", label: "Inactive", count: statusCounts.inactive ?? 0 },
  ];

  const handleTabClick = (key) => {
    setStatusFilter(key);
    if (onFilterChange) onFilterChange();
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (onFilterChange) onFilterChange();
  };

  const handleTypeChange = (val) => {
    setTypeFilter(val);
    if (onFilterChange) onFilterChange();
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    if (onFilterChange) onFilterChange();
  };

  return (
    <div className="shp-control-bar">
      <div className="shp-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`shp-tab ${statusFilter === tab.key ? "shp-tab--active" : ""}`}
            onClick={() => handleTabClick(tab.key)}
          >
            {tab.label}
            <span className="shp-tab__count">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="shp-filters-right">
        <div className="shp-search-box">
          <span className="shp-search-icon">
            <Search size={14} />
          </span>
          <input
            type="search"
            placeholder="Search reg #, model, driver, ID..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="shp-search-clear"
              onClick={() => handleSearchChange("")}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <select
          className="shp-select-filter"
          value={typeFilter}
          onChange={(e) => handleTypeChange(e.target.value)}
          aria-label="Filter by Vehicle Type"
        >
          <option value="All Types">Type: All Types</option>
          <option value="Truck">Truck</option>
          <option value="Mini Truck">Mini Truck</option>
          <option value="Van">Van</option>
          <option value="Tempo">Tempo</option>
          <option value="Pickup">Pickup</option>
          <option value="Trailer">Trailer</option>
          <option value="Container Truck">Container Truck</option>
        </select>

        <select
          className="shp-select-filter"
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          aria-label="Sort vehicles"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort: {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ── 3. VehicleTable Component ────────────────────────────────────────────────

function VehicleTable({
  vehicles = [],
  isLoading = false,
  totalFilteredCount = 0,
  totalCount = 0,
  currentPage = 1,
  setCurrentPage,
  pageSize = 10,
  setPageSize,
  totalPages = 1,
  startIndex = 0,
  endIndex = 0,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onOpenDocuments,
  onOpenMaintenance,
  onOpenFuel,
}) {
  const getDocumentStatus = (docs) => {
    if (!docs) return { text: "No Docs", tone: "neutral" };
    const docList = Object.values(docs);
    const hasExpired = docList.some((d) => d.status === "Expired");
    if (hasExpired) {
      return { text: "Expired Docs", tone: "danger" };
    }
    const hasExpiring = docList.some((d) => d.status === "Expiring Soon");
    if (hasExpiring) {
      return { text: "Expiring Soon", tone: "warning" };
    }
    return { text: "All Valid", tone: "success" };
  };

  const getStatusTone = (status) => {
    switch (status) {
      case "Available":
        return "success";
      case "Assigned":
        return "info";
      case "In Maintenance":
        return "warning";
      case "Inactive":
      default:
        return "neutral";
    }
  };

  return (
    <div className="shp-table-card">
      {isLoading ? (
        <div className="shp-empty-state" style={{ padding: "48px 24px" }}>
          <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="shp-empty-state__title">Loading Vehicles...</p>
          <p className="shp-empty-state__text">
            Fetching fleet records from the database.
          </p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="shp-empty-state">
          <p className="shp-empty-state__title">No vehicles found</p>
          <p className="shp-empty-state__text">
            No fleet vehicles found. Click &quot;Add Vehicle&quot; to register a
            new commercial vehicle.
          </p>
        </div>
      ) : null}

      {vehicles.length > 0 && (
        <div className="shp-table-wrap">
          <table className="shp-table">
            <thead>
              <tr>
                <th>Vehicle &amp; Model</th>
                <th>Registration Number</th>
                <th>Type &amp; Capacity</th>
                <th>Driver / Current Trip</th>
                <th>Status</th>
                <th>Compliance</th>
                <th>Maintenance</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => {
                const docStatus = getDocumentStatus(v.documents);

                return (
                  <tr key={v.id} className="shp-table__row">
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <div>
                          <button
                            type="button"
                            className="shp-tracking-link"
                            onClick={() => onView(v)}
                          >
                            {v.model}
                          </button>
                          <span className="shp-cell-sub">
                            {v.fuelType || "Diesel"}{" "}
                            {v.year ? `(${v.year})` : ""}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className="shp-priority-pill"
                        style={{
                          fontFamily: "monospace",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {v.registrationNumber}
                      </span>
                    </td>

                    <td>
                      <p className="shp-cell-title">{v.type}</p>
                      <span className="shp-cell-sub">{v.capacity}</span>
                    </td>

                    <td>
                      {v.driver && v.driver !== "Unassigned" ? (
                        <p className="shp-cell-title">{v.driver}</p>
                      ) : (
                        <span className="shp-text-muted">Unassigned</span>
                      )}
                      {v.currentTrip ? (
                        <div
                          className="shp-route-flow"
                          style={{ marginTop: "2px" }}
                        >
                          <span className="shp-route-city">
                            {v.currentTrip.origin
                              ? v.currentTrip.origin.split(",")[0]
                              : ""}
                          </span>
                          <span className="shp-route-arrow">
                            <ArrowRight size={11} />
                          </span>
                          <span className="shp-route-city">
                            {v.currentTrip.destination
                              ? v.currentTrip.destination.split(",")[0]
                              : ""}
                          </span>
                        </div>
                      ) : (
                        <span className="shp-cell-sub">
                          {v.location ? v.location.split(",")[0] : "In Yard"}
                        </span>
                      )}
                    </td>

                    <td>
                      <span
                        className={`shp-badge shp-badge--${getStatusTone(v.status)}`}
                      >
                        {v.status}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() => onOpenDocuments(v)}
                        className={`shp-badge shp-badge--${docStatus.tone}`}
                        style={{
                          cursor: "pointer",
                          border: "none",
                          textAlign: "start",
                        }}
                        title="Click to view & update documents"
                      >
                        {docStatus.text}
                      </button>
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() => onOpenMaintenance(v)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                        title="Click to view maintenance logs"
                      >
                        <p className="shp-cell-title">
                          {v.maintenance?.nextServiceDate || "Not Scheduled"}
                        </p>
                        <span className="shp-cell-sub">
                          Last: {v.maintenance?.lastServiceDate || "N/A"}
                        </span>
                      </button>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div className="shp-action-btns">
                        <button
                          type="button"
                          className="shp-icon-btn"
                          title="View Details"
                          onClick={() => onView(v)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          className="shp-icon-btn"
                          title="Maintenance Log"
                          onClick={() => onOpenMaintenance(v)}
                        >
                          <Wrench size={14} />
                        </button>
                        <button
                          type="button"
                          className="shp-icon-btn"
                          title="Fuel & Expense Log"
                          onClick={() => {
                            if (onOpenFuel) onOpenFuel(v);
                          }}
                        >
                          <Fuel size={14} />
                        </button>
                        <button
                          type="button"
                          className={`shp-icon-btn ${v.status === "Inactive" ? "shp-icon-btn--success" : ""}`}
                          title={
                            v.status === "Inactive"
                              ? "Activate Vehicle"
                              : "Deactivate Vehicle"
                          }
                          onClick={() => onToggleStatus(v)}
                        >
                          {v.status === "Inactive" ? (
                            <Power size={14} color="#16a34a" />
                          ) : (
                            <PowerOff size={14} />
                          )}
                        </button>
                        <button
                          type="button"
                          className="shp-icon-btn shp-icon-btn--danger"
                          title="Delete Vehicle"
                          onClick={() => onDelete(v)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="shp-table-footer">
        <div className="shp-pagination-info">
          {totalFilteredCount === 0 ? (
            <span>No vehicles to display</span>
          ) : (
            <span>
              Showing <strong>{startIndex + 1}</strong>–
              <strong>{endIndex}</strong> of{" "}
              <strong>{totalFilteredCount}</strong> vehicles
              {totalFilteredCount !== totalCount && (
                <span className="shp-pagination-total-hint">
                  {" "}
                  (filtered from {totalCount} total)
                </span>
              )}
            </span>
          )}
        </div>

        {totalFilteredCount > 0 && setCurrentPage && (
          <div className="shp-pagination-controls">
            <div className="shp-pagination-size">
              <label htmlFor="veh-page-size">Rows per page:</label>
              <select
                id="veh-page-size"
                className="shp-pagination-select"
                value={pageSize}
                onChange={(e) => {
                  if (setPageSize) setPageSize(Number(e.target.value));
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
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                type="button"
                className="shp-pagination-btn"
                title="Previous Page"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="shp-pagination-page-indicator">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="shp-pagination-btn"
                title="Next Page"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
              >
                <ChevronRight size={14} />
              </button>
              <button
                type="button"
                className="shp-pagination-btn"
                title="Last Page"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 4. VehicleModal Component ────────────────────────────────────────────────

function VehicleModal({
  isOpen,
  onClose,
  onSave,
  vehicle = null,
  existingVehicles = [],
}) {
  const isEdit = !!vehicle;

  const initialDocuments = {
    insurance: {
      documentName: "Insurance",
      documentNumber: "",
      expireDate: "",
    },
    rc: {
      documentName: "RC",
      documentNumber: "",
      expireDate: "",
    },
    puc: {
      documentName: "PUC",
      documentNumber: "",
      expireDate: "",
    },
    fitness: {
      documentName: "Fitness Certificate",
      documentNumber: "",
      expireDate: "",
    },
    permit: {
      documentName: "Transport Permit",
      documentNumber: "",
      expireDate: "",
    },
  };

  const [formData, setFormData] = useState({
    registrationNumber: "",
    type: "Truck",
    model: "",
    year: new Date().getFullYear(),
    capacity: "",
    capacityValue: 1,
    fuelType: "Diesel",
    driver: "",
    driverPhone: "",
    status: "Available",
    location: "",
    documents: initialDocuments,
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (vehicle) {
      const d = vehicle.documents || {};
      setFormData({
        registrationNumber: vehicle.registrationNumber || "",
        type: vehicle.type || "Truck",
        model: vehicle.model || "",
        year: vehicle.year || new Date().getFullYear(),
        capacity: vehicle.capacity || "",
        capacityValue: vehicle.capacityValue || 1,
        fuelType: vehicle.fuelType || "Diesel",
        driver: vehicle.driver || "",
        driverPhone: vehicle.driverPhone || "",
        status: vehicle.status || "Available",
        location: vehicle.location || "",
        documents: {
          insurance: {
            documentName: d.insurance?.documentName || "Insurance",
            documentNumber:
              d.insurance?.documentNumber || d.insurance?.policyNumber || "",
            expireDate:
              d.insurance?.expireDate || d.insurance?.expiryDate || "",
          },
          rc: {
            documentName: d.rc?.documentName || "RC",
            documentNumber: d.rc?.documentNumber || d.rc?.rcNumber || "",
            expireDate: d.rc?.expireDate || d.rc?.expiryDate || "",
          },
          puc: {
            documentName: d.puc?.documentName || "PUC",
            documentNumber:
              d.puc?.documentNumber || d.puc?.certificateNumber || "",
            expireDate: d.puc?.expireDate || d.puc?.expiryDate || "",
          },
          fitness: {
            documentName: d.fitness?.documentName || "Fitness Certificate",
            documentNumber:
              d.fitness?.documentNumber || d.fitness?.certificateNumber || "",
            expireDate: d.fitness?.expireDate || d.fitness?.expiryDate || "",
          },
          permit: {
            documentName: d.permit?.documentName || "Transport Permit",
            documentNumber:
              d.permit?.documentNumber || d.permit?.permitNumber || "",
            expireDate: d.permit?.expireDate || d.permit?.expiryDate || "",
          },
        },
      });
    } else {
      setFormData({
        registrationNumber: "",
        type: "Truck",
        model: "",
        year: new Date().getFullYear(),
        capacity: "4.5 Ton",
        capacityValue: 4.5,
        fuelType: "Diesel",
        driver: "",
        driverPhone: "",
        status: "Available",
        location: "Central Depot, Mumbai",
        documents: {
          insurance: {
            documentName: "Insurance",
            documentNumber: "",
            expireDate: "",
          },
          rc: {
            documentName: "RC",
            documentNumber: "",
            expireDate: "",
          },
          puc: {
            documentName: "PUC",
            documentNumber: "",
            expireDate: "",
          },
          fitness: {
            documentName: "Fitness Certificate",
            documentNumber: "",
            expireDate: "",
          },
          permit: {
            documentName: "Transport Permit",
            documentNumber: "",
            expireDate: "",
          },
        },
      });
    }
    setErrors({});
    setApiError("");
    setIsSubmitting(false);
  }, [vehicle, isOpen]);

  const handleDocChange = (docKey, field, value) => {
    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docKey]: {
          ...prev.documents[docKey],
          [field]: value,
        },
      },
    }));
    const errKey = `${docKey}_${field}`;
    if (errors[errKey]) {
      setErrors((prev) => ({ ...prev, [errKey]: null }));
    }
  };

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    const regTrimmed = (formData.registrationNumber || "").trim().toUpperCase();
    if (!regTrimmed) {
      newErrors.registrationNumber = "Registration number is required";
    } else {
      const isDuplicate = existingVehicles.some(
        (v) =>
          (v.registrationNumber || "").toUpperCase() === regTrimmed &&
          (!isEdit || v.id !== vehicle?.id),
      );
      if (isDuplicate) {
        newErrors.registrationNumber = `Vehicle with registration '${regTrimmed}' already exists in fleet!`;
      }
    }

    if (!formData.model.trim()) {
      newErrors.model =
        "Vehicle model is required (e.g. Tata 407, Ashok Leyland)";
    }

    if (!formData.capacity.trim()) {
      newErrors.capacity = "Capacity is required (e.g. 4.5 Ton, 24 Ton)";
    }

    if (!isEdit) {
      const docConfigs = [
        { key: "insurance", label: "Insurance" },
        { key: "rc", label: "RC" },
        { key: "puc", label: "PUC" },
        { key: "fitness", label: "Fitness Certificate" },
        { key: "permit", label: "Transport Permit" },
      ];

      docConfigs.forEach(({ key, label }) => {
        const doc = formData.documents?.[key] || {};
        if (!doc.documentNumber || !doc.documentNumber.trim()) {
          newErrors[`${key}_documentNumber`] = `${label} number is required`;
        }
        if (!doc.expireDate) {
          newErrors[`${key}_expireDate`] = `${label} expiry date is required`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const computeStatusHelper = (dateStr) => {
    if (!dateStr) return "Valid";
    const now = new Date();
    const target = new Date(dateStr);
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "Expired";
    if (diffDays <= 20) return "Expiring Soon";
    return "Valid";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;

    const numMatch = String(formData.capacity).match(/[\d.]+/);
    const capNum = numMatch
      ? parseFloat(numMatch[0])
      : Number(formData.capacityValue) || 1;

    // In Edit mode, delegate to onSave
    if (isEdit) {
      onSave({
        ...formData,
        capacityValue: capNum,
      });
      onClose();
      return;
    }

    // Add Vehicle Mode: Connect to Backend API POST /vechile
    const token = localStorage.getItem("token");
    if (!token) {
      setApiError("Authentication token not found. Please log in first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        vregistrationnumber: formData.registrationNumber.trim().toUpperCase(),
        vtype: formData.type,
        vmodel: formData.model.trim(),
        vcapacity: capNum,
        vfuletype: formData.fuelType,
        vstatus: formData.status || "Available",
        documents: {
          insurance: {
            documentName: "Insurance",
            documentNumber: formData.documents.insurance.documentNumber.trim(),
            expireDate: formData.documents.insurance.expireDate,
          },
          rc: {
            documentName: "RC",
            documentNumber: formData.documents.rc.documentNumber.trim(),
            expireDate: formData.documents.rc.expireDate,
          },
          puc: {
            documentName: "PUC",
            documentNumber: formData.documents.puc.documentNumber.trim(),
            expireDate: formData.documents.puc.expireDate,
          },
          fitness: {
            documentName: "Fitness Certificate",
            documentNumber: formData.documents.fitness.documentNumber.trim(),
            expireDate: formData.documents.fitness.expireDate,
          },
          permit: {
            documentName: "Transport Permit",
            documentNumber: formData.documents.permit.documentNumber.trim(),
            expireDate: formData.documents.permit.expireDate,
          },
        },
        // Flat compatibility fields
        insuranceDocumentNumber:
          formData.documents.insurance.documentNumber.trim(),
        insuranceExpireDate: formData.documents.insurance.expireDate,
        insuranceExpiry: formData.documents.insurance.expireDate,
        rcDocumentNumber: formData.documents.rc.documentNumber.trim(),
        rcExpireDate: formData.documents.rc.expireDate,
        rcExpiry: formData.documents.rc.expireDate,
        pucDocumentNumber: formData.documents.puc.documentNumber.trim(),
        pucExpireDate: formData.documents.puc.expireDate,
        fitnessDocumentNumber: formData.documents.fitness.documentNumber.trim(),
        fitnessExpireDate: formData.documents.fitness.expireDate,
        permitDocumentNumber: formData.documents.permit.documentNumber.trim(),
        permitExpireDate: formData.documents.permit.expireDate,
        // Frontend properties for consistency
        registrationNumber: formData.registrationNumber.trim().toUpperCase(),
        type: formData.type,
        model: formData.model.trim(),
        capacity: formData.capacity,
        capacityValue: capNum,
        fuelType: formData.fuelType,
        status: formData.status || "Available",
        driver: formData.driver?.trim() || "",
        driverPhone: formData.driverPhone?.trim() || "",
        location: formData.location?.trim() || "",
      };

      const res = await fetch(`${API_BASE_URL}/vechile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.message || "Failed to add vehicle";
        if (errorMsg.toLowerCase().includes("exist")) {
          setErrors((prev) => ({
            ...prev,
            registrationNumber: errorMsg,
          }));
        }
        setApiError(errorMsg);
        return;
      }

      // Backend succeeded - construct rich vehicle record for local dashboard
      const savedVehicle = data.vehicle || {};
      const newVehicleRecord = {
        id: `VEH-${String(existingVehicles.length + 1).padStart(3, "0")}`,
        _id: savedVehicle._id,
        registrationNumber: formData.registrationNumber.trim().toUpperCase(),
        type: formData.type,
        model: formData.model.trim(),
        year: Number(formData.year) || new Date().getFullYear(),
        capacity: formData.capacity || `${capNum} Ton`,
        capacityValue: capNum,
        fuelType: formData.fuelType,
        driver: formData.driver?.trim() || "",
        driverPhone: formData.driverPhone?.trim() || "",
        status: formData.status || "Available",
        location: formData.location?.trim() || "Central Depot, Mumbai",
        documents: {
          insurance: {
            documentName: "Insurance",
            documentNumber: formData.documents.insurance.documentNumber.trim(),
            policyNumber: formData.documents.insurance.documentNumber.trim(),
            provider: "Fleet Insurance Corp",
            expireDate: formData.documents.insurance.expireDate,
            expiryDate: formData.documents.insurance.expireDate,
            status: computeStatusHelper(
              formData.documents.insurance.expireDate,
            ),
          },
          rc: {
            documentName: "RC",
            documentNumber: formData.documents.rc.documentNumber.trim(),
            rcNumber: formData.documents.rc.documentNumber.trim(),
            expireDate: formData.documents.rc.expireDate,
            expiryDate: formData.documents.rc.expireDate,
            status: computeStatusHelper(formData.documents.rc.expireDate),
          },
          puc: {
            documentName: "PUC",
            documentNumber: formData.documents.puc.documentNumber.trim(),
            certificateNumber: formData.documents.puc.documentNumber.trim(),
            expireDate: formData.documents.puc.expireDate,
            expiryDate: formData.documents.puc.expireDate,
            status: computeStatusHelper(formData.documents.puc.expireDate),
          },
          fitness: {
            documentName: "Fitness Certificate",
            documentNumber: formData.documents.fitness.documentNumber.trim(),
            certificateNumber: formData.documents.fitness.documentNumber.trim(),
            expireDate: formData.documents.fitness.expireDate,
            expiryDate: formData.documents.fitness.expireDate,
            status: computeStatusHelper(formData.documents.fitness.expireDate),
          },
          permit: {
            documentName: "Transport Permit",
            documentNumber: formData.documents.permit.documentNumber.trim(),
            permitNumber: formData.documents.permit.documentNumber.trim(),
            permitType: "State Commercial Permit",
            expireDate: formData.documents.permit.expireDate,
            expiryDate: formData.documents.permit.expireDate,
            status: computeStatusHelper(formData.documents.permit.expireDate),
          },
        },
        maintenance: {
          lastServiceDate: null,
          nextServiceDate: null,
          serviceCenter: "",
          lastCost: 0,
          totalMaintenanceCost: 0,
          healthScore: 100,
        },
        maintenanceHistory: [],
        fuelSummary: {
          totalFuelLitres: 0,
          totalFuelCost: 0,
          avgMileage: "0.0 km/L",
        },
        fuelRecords: [],
      };

      onSave(newVehicleRecord);
      onClose();
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Something went wrong while connecting to the server",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-auto max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEdit ? "Edit Vehicle Information" : "Add New Fleet Vehicle"}
              </h3>
              <p className="text-xs text-slate-500">
                {isEdit
                  ? `Updating records for ${vehicle?.registrationNumber}`
                  : "Register a new commercial vehicle to the fleet"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {apiError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-700 text-xs animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span className="font-medium">{apiError}</span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vehicle Registration Number{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. MH-12-AB-4521"
                  value={formData.registrationNumber}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      registrationNumber: e.target.value.toUpperCase(),
                    });
                    if (errors.registrationNumber)
                      setErrors({ ...errors, registrationNumber: null });
                  }}
                  className={`w-full px-3 py-2 text-xs font-mono font-bold tracking-wider rounded-lg border focus:outline-none focus:ring-2 uppercase ${
                    errors.registrationNumber
                      ? "border-rose-400 bg-rose-50/30 focus:ring-rose-500/20"
                      : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
                  }`}
                />
                {errors.registrationNumber ? (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.registrationNumber}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Indian RTO format (State-District-Series-Number)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vehicle Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {VEHICLE_TYPES.filter((t) => t !== "All Types").map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vehicle Make &amp; Model{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tata 407 Gold SFC / Ashok Leyland"
                  value={formData.model}
                  onChange={(e) => {
                    setFormData({ ...formData, model: e.target.value });
                    if (errors.model) setErrors({ ...errors, model: null });
                  }}
                  className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 ${
                    errors.model
                      ? "border-rose-400 bg-rose-50/30 focus:ring-rose-500/20"
                      : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
                  }`}
                />
                {errors.model && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    {errors.model}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Capacity <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4.5 Ton"
                  value={formData.capacity}
                  onChange={(e) => {
                    setFormData({ ...formData, capacity: e.target.value });
                    if (errors.capacity)
                      setErrors({ ...errors, capacity: null });
                  }}
                  className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 ${
                    errors.capacity
                      ? "border-rose-400 bg-rose-50/30 focus:ring-rose-500/20"
                      : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
                  }`}
                />
                {errors.capacity && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    {errors.capacity}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fuel Type
                </label>
                <select
                  value={formData.fuelType}
                  onChange={(e) =>
                    setFormData({ ...formData, fuelType: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Diesel">Diesel</option>
                  <option value="CNG">CNG</option>
                  <option value="Petrol">Petrol</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {VEHICLE_STATUSES.filter((s) => s !== "All").map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Driver
                </label>
                <input
                  type="text"
                  placeholder="e.g. Anil Deshmukh or leave blank"
                  value={formData.driver}
                  onChange={(e) =>
                    setFormData({ ...formData, driver: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Operating Hub / Current Location
              </label>
              <input
                type="text"
                placeholder="e.g. Bhiwandi DC Hub, Mumbai / Okhla Phase III, Delhi"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {!isEdit && (
              <div className="pt-3 border-t border-slate-100 bg-slate-50/60 p-4 rounded-xl space-y-3">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800">
                    Vehicle Statutory Documents &amp; Compliance (Required)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Please enter the Document Number and Expire Date for all 5
                  mandatory compliance documents.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    {
                      key: "insurance",
                      title: "1. Insurance Policy",
                      placeholder: "e.g. POL-8829104",
                    },
                    {
                      key: "rc",
                      title: "2. Registration Certificate (RC)",
                      placeholder: "e.g. RC-MH12-4521",
                    },
                    {
                      key: "puc",
                      title: "3. Pollution Under Control (PUC)",
                      placeholder: "e.g. PUC-MH-2026-90",
                    },
                    {
                      key: "fitness",
                      title: "4. Fitness Certificate",
                      placeholder: "e.g. FIT-2026-4412",
                    },
                    {
                      key: "permit",
                      title: "5. Transport Permit",
                      placeholder: "e.g. NP-IND-2026-778",
                    },
                  ].map(({ key, title, placeholder }) => (
                    <div
                      key={key}
                      className={`p-3 bg-white rounded-lg border space-y-2 ${
                        errors[`${key}_documentNumber`] ||
                        errors[`${key}_expireDate`]
                          ? "border-rose-300 bg-rose-50/10"
                          : "border-slate-200"
                      } ${key === "permit" ? "md:col-span-2" : ""}`}
                    >
                      <span className="block text-xs font-bold text-slate-800">
                        {title} <span className="text-rose-500">*</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Document Number{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder={placeholder}
                            value={
                              formData.documents?.[key]?.documentNumber || ""
                            }
                            onChange={(e) =>
                              handleDocChange(
                                key,
                                "documentNumber",
                                e.target.value,
                              )
                            }
                            className={`w-full px-2.5 py-1.5 text-xs font-mono rounded-md border focus:outline-none focus:ring-1 ${
                              errors[`${key}_documentNumber`]
                                ? "border-rose-400 bg-rose-50/30"
                                : "border-slate-200 focus:border-blue-500"
                            }`}
                          />
                          {errors[`${key}_documentNumber`] && (
                            <p className="text-[10px] text-rose-600 mt-0.5">
                              {errors[`${key}_documentNumber`]}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Expire Date <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={formData.documents?.[key]?.expireDate || ""}
                            onChange={(e) =>
                              handleDocChange(key, "expireDate", e.target.value)
                            }
                            className={`w-full px-2.5 py-1.5 text-xs rounded-md border focus:outline-none focus:ring-1 ${
                              errors[`${key}_expireDate`]
                                ? "border-rose-400 bg-rose-50/30"
                                : "border-slate-200 focus:border-blue-500"
                            }`}
                          />
                          {errors[`${key}_expireDate`] && (
                            <p className="text-[10px] text-rose-600 mt-0.5">
                              {errors[`${key}_expireDate`]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end space-x-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Vehicle...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEdit ? "Save Changes" : "Add Vehicle"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 5. VehicleDetailsModal Component ─────────────────────────────────────────

function VehicleDetailsModal({
  isOpen,
  onClose,
  vehicle,
  onEdit,
  onOpenDocuments,
  onOpenMaintenance,
  onOpenFuel,
  onOpenTrips,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [fuelRecordsList, setFuelRecordsList] = useState([]);
  const [isLoadingMaintenance, setIsLoadingMaintenance] = useState(false);
  const [isLoadingFuel, setIsLoadingFuel] = useState(false);

  useEffect(() => {
    if (!isOpen || !vehicle) return;

    setMaintenanceRecords(vehicle.maintenanceHistory || []);
    setFuelRecordsList(vehicle.fuelRecords || []);

    const targetVehicleId = vehicle._id || vehicle.id;
    if (!targetVehicleId || String(targetVehicleId).startsWith("VEH-")) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    // Fetch maintenance records
    setIsLoadingMaintenance(true);
    fetch(`${API_BASE_URL}/vechile-maintenance/${targetVehicleId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((item) => ({
            id: item._id,
            type: item.serviceType,
            serviceType: item.serviceType,
            description: item.description,
            odometer: item.odometer,
            cost: item.serviceCost,
            serviceCost: item.serviceCost,
            serviceCenter: item.serviceProvider,
            serviceProvider: item.serviceProvider,
            date: item.serviceDate
              ? new Date(item.serviceDate).toISOString().split("T")[0]
              : "",
            serviceDate: item.serviceDate
              ? new Date(item.serviceDate).toISOString().split("T")[0]
              : "",
            nextDueDate: item.nextServiceDate
              ? new Date(item.nextServiceDate).toISOString().split("T")[0]
              : "",
            nextServiceDate: item.nextServiceDate
              ? new Date(item.nextServiceDate).toISOString().split("T")[0]
              : "",
          }));
          setMaintenanceRecords(mapped);
        }
      })
      .catch((err) =>
        console.error("Error fetching vehicle maintenance records:", err),
      )
      .finally(() => setIsLoadingMaintenance(false));

    // Fetch fuel records
    setIsLoadingFuel(true);
    fetch(`${API_BASE_URL}/vechile-fuel/${targetVehicleId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((item) => ({
            id: item._id,
            date: item.fuelDate
              ? new Date(item.fuelDate).toISOString().split("T")[0]
              : "",
            fuelDate: item.fuelDate
              ? new Date(item.fuelDate).toISOString().split("T")[0]
              : "",
            fuelType: item.fuelType,
            litres: item.quantity,
            quantity: item.quantity,
            pricePerLitre: item.pricePerLitre,
            totalCost: item.fuelCost,
            fuelCost: item.fuelCost,
            odometer: item.odometer,
            station: item.fuelStation,
            fuelStation: item.fuelStation,
          }));
          setFuelRecordsList(mapped);
        }
      })
      .catch((err) =>
        console.error("Error fetching vehicle fuel records:", err),
      )
      .finally(() => setIsLoadingFuel(false));
  }, [isOpen, vehicle]);

  if (!isOpen || !vehicle) return null;

  const docs = vehicle.documents || {};
  const maintenance = vehicle.maintenance || {};
  const fuelSummary = vehicle.fuelSummary || {};
  const tripSummary = vehicle.tripSummary || {};
  const tripHistory = vehicle.tripHistory || [];

  const totalMaintenanceSpent = maintenanceRecords.reduce(
    (sum, m) => sum + (Number(m.serviceCost ?? m.cost) || 0),
    0,
  );
  const latestMaintenance = maintenanceRecords[0];
  const lastMaintDate =
    latestMaintenance?.serviceDate ||
    latestMaintenance?.date ||
    maintenance.lastServiceDate ||
    "N/A";
  const nextMaintDueDate =
    latestMaintenance?.nextServiceDate ||
    latestMaintenance?.nextDueDate ||
    maintenance.nextServiceDate ||
    "N/A";

  const totalFuelLitresUsed = fuelRecordsList.reduce(
    (sum, f) => sum + (Number(f.litres ?? f.quantity) || 0),
    0,
  );
  const totalFuelCostSpent = fuelRecordsList.reduce(
    (sum, f) => sum + (Number(f.totalCost ?? f.fuelCost) || 0),
    0,
  );

  const getDocBadge = (status) => {
    if (status === "Expired") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          Expired
        </span>
      );
    }
    if (status === "Expiring Soon") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          Expiring Soon
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Valid
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-6 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        <div
          className="px-6 py-4 border-b border-slate-100 flex items-center justify-between text-white"
          style={{ background: "hsl(0deg, 0%, 95%)" }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3
                  className="text-base font-extrabold  tracking-wide"
                  style={{ color: "black" }}
                >
                  {vehicle.model}
                </h3>
              </div>
              <div
                className="flex items-center space-x-2 mt-0.5 text-xs"
                style={{ color: "black" }}
              >
                <span className="font-mono font-bold">
                  {vehicle.registrationNumber}
                </span>
                <span>•</span>
                <span>{vehicle.type}</span>
                <span>•</span>
                <span>{vehicle.capacity}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onEdit(vehicle);
              }}
              className="px-3 py-1.5  text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1 border "
              style={{
                background: "hsl(0deg, 0%, 80%)",
                color: "black",
                border: "1px solid hsl(0deg, 0%, 75%)",
              }}
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-1 px-6 border-b border-slate-200 bg-slate-50/70 overflow-x-auto text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            Vehicle Overview
          </button>
          <button
            onClick={() => setActiveTab("assignment")}
            className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "assignment"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            Assignment &amp; Route
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "documents"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            Documents &amp; Compliance
          </button>
          <button
            onClick={() => setActiveTab("maintenance")}
            className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "maintenance"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            Maintenance &amp; Service
          </button>
          <button
            onClick={() => setActiveTab("fuel")}
            className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "fuel"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            Fuel &amp; Expenses
          </button>
          <button
            onClick={() => setActiveTab("trips")}
            className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "trips"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            Trips &amp; Utilization
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">
                    Operational Status
                  </p>
                  <p className="text-sm font-extrabold text-slate-800 mt-1 flex items-center space-x-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        vehicle.status === "Available"
                          ? "bg-emerald-500"
                          : vehicle.status === "Assigned"
                            ? "bg-blue-500 animate-pulse"
                            : vehicle.status === "In Maintenance"
                              ? "bg-amber-500"
                              : "bg-slate-400"
                      }`}
                    ></span>
                    <span>{vehicle.status}</span>
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">
                    Payload Capacity
                  </p>
                  <p className="text-sm font-extrabold text-slate-800 mt-1">
                    {vehicle.capacity}
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">
                    Odometer
                  </p>
                  <p className="text-sm font-extrabold text-slate-800 mt-1">
                    {(vehicle.odometer || 0).toLocaleString()} km
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">
                    Fleet Health Score
                  </p>
                  <p className="text-sm font-extrabold text-emerald-600 mt-1 flex items-center space-x-1">
                    <span>{maintenance.healthScore || 90}%</span>
                    <span className="text-[10px] font-medium text-slate-500">
                      (Good)
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                  Vehicle Specifications
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Registration Plate
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {vehicle.registrationNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Body Type
                    </span>
                    <span className="font-semibold text-slate-800">
                      {vehicle.type}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Model &amp; Series
                    </span>
                    <span className="font-semibold text-slate-800">
                      {vehicle.model}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Model Year
                    </span>
                    <span className="font-semibold text-slate-800">
                      {vehicle.year || "2022"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Fuel Type
                    </span>
                    <span className="font-semibold text-slate-800">
                      {vehicle.fuelType || "Diesel"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/40 rounded-xl border border-blue-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Current Assignment &amp; Telemetry</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-blue-700">
                    {vehicle.status === "Assigned"
                      ? "Live In-Transit"
                      : "Stationary in Yard"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">
                      Assigned Driver
                    </span>
                    <span className="font-bold text-slate-800">
                      {vehicle.driver && vehicle.driver !== "Unassigned"
                        ? vehicle.driver
                        : "No driver assigned"}
                    </span>
                    {vehicle.driverPhone && (
                      <span className="block text-[11px] text-slate-500">
                        {vehicle.driverPhone}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">
                      Current Location / Hub
                    </span>
                    <span className="font-bold text-slate-800 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{vehicle.location || "Central Depot"}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "assignment" && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                  Active Trip Details
                </h4>
                {vehicle.currentTrip ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase">
                          Trip Reference
                        </span>
                        <p className="font-mono font-bold text-slate-900 text-sm">
                          {vehicle.currentTrip.tripId}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Status
                        </span>
                        <p className="font-bold text-blue-700 text-xs">
                          {vehicle.currentTrip.status}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Origin
                        </span>
                        <span className="font-semibold text-slate-800">
                          {vehicle.currentTrip.origin}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Destination
                        </span>
                        <span className="font-semibold text-slate-800">
                          {vehicle.currentTrip.destination}
                        </span>
                      </div>
                    </div>

                    {vehicle.currentTrip.eta && (
                      <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-800 text-xs font-medium flex items-center justify-between">
                        <span>Estimated Arrival (ETA):</span>
                        <span className="font-bold">
                          {vehicle.currentTrip.eta}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500">
                    <Route className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold">
                      No active trip dispatched for this vehicle.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Vehicle is currently ready for dispatch or in yard.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Statutory &amp; Transport Documents
                </h4>
                <button
                  onClick={() => {
                    onClose();
                    onOpenDocuments(vehicle);
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <span>Open Full Compliance Editor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-slate-800">
                      Insurance Policy
                    </span>
                    {getDocBadge(docs.insurance?.status)}
                  </div>
                  <p className="text-xs text-slate-600 font-mono font-medium">
                    {docs.insurance?.documentNumber ||
                      docs.insurance?.policyNumber ||
                      "N/A"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Expires:{" "}
                    <strong className="text-slate-700">
                      {docs.insurance?.expireDate ||
                        docs.insurance?.expiryDate ||
                        "N/A"}
                    </strong>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-slate-800">
                      Registration Certificate (RC)
                    </span>
                    {getDocBadge(docs.rc?.status)}
                  </div>
                  <p className="text-xs text-slate-600 font-mono font-medium">
                    {docs.rc?.documentNumber || docs.rc?.rcNumber || "N/A"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Expires:{" "}
                    <strong className="text-slate-700">
                      {docs.rc?.expireDate || docs.rc?.expiryDate || "N/A"}
                    </strong>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-slate-800">
                      Pollution Under Control (PUC)
                    </span>
                    {getDocBadge(docs.puc?.status)}
                  </div>
                  <p className="text-xs text-slate-600 font-mono font-medium">
                    {docs.puc?.documentNumber ||
                      docs.puc?.certificateNumber ||
                      "N/A"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Expires:{" "}
                    <strong className="text-slate-700">
                      {docs.puc?.expireDate || docs.puc?.expiryDate || "N/A"}
                    </strong>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-slate-800">
                      Fitness Certificate
                    </span>
                    {getDocBadge(docs.fitness?.status)}
                  </div>
                  <p className="text-xs text-slate-600 font-mono font-medium">
                    {docs.fitness?.documentNumber ||
                      docs.fitness?.certificateNumber ||
                      "N/A"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Expires:{" "}
                    <strong className="text-slate-700">
                      {docs.fitness?.expireDate ||
                        docs.fitness?.expiryDate ||
                        "N/A"}
                    </strong>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-slate-800">
                      Transport Permit
                    </span>
                    {getDocBadge(docs.permit?.status)}
                  </div>
                  <p className="text-xs text-slate-600 font-mono font-medium">
                    {docs.permit?.documentNumber ||
                      docs.permit?.permitNumber ||
                      "N/A"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Expires:{" "}
                    <strong className="text-slate-700">
                      {docs.permit?.expireDate ||
                        docs.permit?.expiryDate ||
                        "N/A"}
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "maintenance" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Last Service Date
                  </span>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                    {lastMaintDate}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Next Service Due
                  </span>
                  <p className="text-sm font-extrabold text-blue-600 mt-0.5">
                    {nextMaintDueDate}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Total Spent
                  </span>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                    ₹
                    {(
                      totalMaintenanceSpent ||
                      maintenance.totalMaintenanceCost ||
                      0
                    ).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Recent Service Logs ({maintenanceRecords.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenMaintenance) onOpenMaintenance(vehicle);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Service Record</span>
                  </button>
                </div>

                {isLoadingMaintenance ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    <div className="w-6 h-6 border-2 border-amber-600/20 border-t-amber-600 rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading service history...</span>
                  </div>
                ) : maintenanceRecords.length > 0 ? (
                  <div className="space-y-2.5">
                    {maintenanceRecords.map((m, idx) => (
                      <div
                        key={m.id || idx}
                        className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/80 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">
                            {m.serviceType || m.type || "Service Check"}
                          </span>
                          <span className="font-bold text-slate-900">
                            ₹
                            {(
                              Number(m.serviceCost ?? m.cost) || 0
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-1">
                          {m.description}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 flex-wrap gap-2">
                          <span>
                            Workshop:{" "}
                            <strong className="text-slate-600">
                              {m.serviceProvider ||
                                m.serviceCenter ||
                                "Service Hub"}
                            </strong>
                          </span>
                          <span>
                            Date:{" "}
                            <strong className="text-slate-600">
                              {m.serviceDate || m.date || "N/A"}
                            </strong>
                          </span>
                          {m.odometer !== undefined && m.odometer !== null && (
                            <span>
                              Odometer:{" "}
                              <strong className="text-slate-600">
                                {Number(m.odometer).toLocaleString()} km
                              </strong>
                            </span>
                          )}
                          {(m.nextServiceDate || m.nextDueDate) && (
                            <span className="text-blue-600 font-semibold">
                              Next Due:{" "}
                              <strong>
                                {m.nextServiceDate || m.nextDueDate}
                              </strong>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 flex flex-col items-center justify-center space-y-2">
                    <Wrench className="w-8 h-8 text-slate-300" />
                    <p className="text-xs text-slate-400">
                      No maintenance history recorded for this vehicle.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenMaintenance) onOpenMaintenance(vehicle);
                      }}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Service Record</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "fuel" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Total Fuel Used
                  </span>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                    {(
                      totalFuelLitresUsed ||
                      fuelSummary.totalFuelLitres ||
                      0
                    ).toLocaleString()}{" "}
                    L / Kg
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Total Fuel Cost
                  </span>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                    ₹
                    {(
                      totalFuelCostSpent ||
                      fuelSummary.totalFuelCost ||
                      0
                    ).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Average Mileage
                  </span>
                  <p className="text-sm font-extrabold text-emerald-600 mt-0.5">
                    {fuelSummary.avgMileage || "N/A"}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Recent Refueling Records ({fuelRecordsList.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenFuel) onOpenFuel(vehicle);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Fuel Record</span>
                  </button>
                </div>

                {isLoadingFuel ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    <div className="w-6 h-6 border-2 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading refueling records...</span>
                  </div>
                ) : fuelRecordsList.length > 0 ? (
                  <div className="divide-y divide-slate-100 text-xs">
                    {fuelRecordsList.map((f, idx) => (
                      <div
                        key={f.id || idx}
                        className="py-2.5 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-800">
                            {f.litres || f.quantity} L ({f.fuelType})
                          </span>
                          <p className="text-[11px] text-slate-400">
                            {f.station || f.fuelStation} •{" "}
                            {f.date ||
                              (f.fuelDate ? f.fuelDate.split("T")[0] : "")}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900">
                            ₹
                            {(f.totalCost || f.fuelCost || 0).toLocaleString(
                              "en-IN",
                            )}
                          </span>
                          <p className="text-[10px] text-slate-400">
                            @ ₹
                            {f.pricePerLitre ||
                              ((f.totalCost || f.fuelCost) &&
                              (f.litres || f.quantity)
                                ? (
                                    (f.totalCost || f.fuelCost) /
                                    (f.litres || f.quantity)
                                  ).toFixed(2)
                                : "0")}
                            /L
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 flex flex-col items-center justify-center space-y-2">
                    <p className="text-xs text-slate-400">
                      No recent fuel records.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenFuel) onOpenFuel(vehicle);
                      }}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Fuel Record</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "trips" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Total Trips
                  </span>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                    {tripSummary.totalTrips || 0}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Total Distance
                  </span>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                    {(tripSummary.totalDistanceKm || 0).toLocaleString()} km
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Completed
                  </span>
                  <p className="text-sm font-extrabold text-emerald-600 mt-0.5">
                    {tripSummary.completedTrips || 0}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Utilization Rate
                  </span>
                  <p className="text-sm font-extrabold text-blue-600 mt-0.5">
                    {tripSummary.utilizationRate || 0}%
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                  Recent Dispatches &amp; Trips
                </h4>
                {tripHistory.length > 0 ? (
                  <div className="space-y-2">
                    {tripHistory.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-slate-900">
                              {t.tripId}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="font-semibold text-slate-800">
                              {t.origin} &rarr; {t.destination}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Driver: {t.driver} • {t.distanceKm} km • {t.date}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No trip history recorded.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="text-xs text-slate-400">
            Viewing real-time fleet telematics for {vehicle.registrationNumber}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 6. DocumentsModal Component ──────────────────────────────────────────────

function DocumentsModal({ isOpen, onClose, vehicle, onUpdateDocuments }) {
  const [docState, setDocState] = useState({
    insurance: { documentNumber: "", expireDate: "" },
    rc: { documentNumber: "", expireDate: "" },
    puc: { documentNumber: "", expireDate: "" },
    fitness: { documentNumber: "", expireDate: "" },
    permit: { documentNumber: "", expireDate: "" },
  });

  const [savedToast, setSavedToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  const formatToDateInput = (val) => {
    if (!val) return "";
    try {
      return new Date(val).toISOString().split("T")[0];
    } catch (e) {
      return "";
    }
  };

  useEffect(() => {
    if (vehicle?.documents) {
      const d = vehicle.documents;
      setDocState({
        insurance: {
          documentNumber:
            d.insurance?.documentNumber || d.insurance?.policyNumber || "",
          expireDate: formatToDateInput(
            d.insurance?.expireDate || d.insurance?.expiryDate,
          ),
        },
        rc: {
          documentNumber: d.rc?.documentNumber || d.rc?.rcNumber || "",
          expireDate: formatToDateInput(d.rc?.expireDate || d.rc?.expiryDate),
        },
        puc: {
          documentNumber:
            d.puc?.documentNumber || d.puc?.certificateNumber || "",
          expireDate: formatToDateInput(d.puc?.expireDate || d.puc?.expiryDate),
        },
        fitness: {
          documentNumber:
            d.fitness?.documentNumber || d.fitness?.certificateNumber || "",
          expireDate: formatToDateInput(
            d.fitness?.expireDate || d.fitness?.expiryDate,
          ),
        },
        permit: {
          documentNumber:
            d.permit?.documentNumber || d.permit?.permitNumber || "",
          expireDate: formatToDateInput(
            d.permit?.expireDate || d.permit?.expiryDate,
          ),
        },
      });
      setApiError("");
    }
  }, [vehicle, isOpen]);

  if (!isOpen || !vehicle) return null;

  const computeStatus = (dateStr) => {
    if (!dateStr) return "Valid";
    const now = new Date();
    const target = new Date(dateStr);
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Expired";
    if (diffDays <= 20) return "Expiring Soon";
    return "Valid";
  };

  const handleDocChange = (key, field, value) => {
    setDocState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setApiError("");
    setIsSaving(true);

    const updatedDocs = {
      insurance: {
        documentName: "Insurance",
        documentNumber: (docState.insurance.documentNumber || "").trim(),
        policyNumber: (docState.insurance.documentNumber || "").trim(),
        expireDate: docState.insurance.expireDate,
        expiryDate: docState.insurance.expireDate,
        status: computeStatus(docState.insurance.expireDate),
      },
      rc: {
        documentName: "RC",
        documentNumber: (docState.rc.documentNumber || "").trim(),
        rcNumber: (docState.rc.documentNumber || "").trim(),
        expireDate: docState.rc.expireDate,
        expiryDate: docState.rc.expireDate,
        status: computeStatus(docState.rc.expireDate),
      },
      puc: {
        documentName: "PUC",
        documentNumber: (docState.puc.documentNumber || "").trim(),
        certificateNumber: (docState.puc.documentNumber || "").trim(),
        expireDate: docState.puc.expireDate,
        expiryDate: docState.puc.expireDate,
        status: computeStatus(docState.puc.expireDate),
      },
      fitness: {
        documentName: "Fitness Certificate",
        documentNumber: (docState.fitness.documentNumber || "").trim(),
        certificateNumber: (docState.fitness.documentNumber || "").trim(),
        expireDate: docState.fitness.expireDate,
        expiryDate: docState.fitness.expireDate,
        status: computeStatus(docState.fitness.expireDate),
      },
      permit: {
        documentName: "Transport Permit",
        documentNumber: (docState.permit.documentNumber || "").trim(),
        permitNumber: (docState.permit.documentNumber || "").trim(),
        permitType: "State Commercial Permit",
        expireDate: docState.permit.expireDate,
        expiryDate: docState.permit.expireDate,
        status: computeStatus(docState.permit.expireDate),
      },
    };

    // If vehicle has MongoDB _id or backend ID, persist to PUT /vechile/:id/documents
    const targetId = vehicle._id || vehicle.id;
    const token = localStorage.getItem("token");
    if (token && targetId && !String(targetId).startsWith("VEH-")) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/vechile/${targetId}/documents`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ documents: updatedDocs }),
          },
        );

        if (!res.ok) {
          const errData = await res.json();
          setApiError(
            errData.message || "Failed to update documents on server",
          );
          setIsSaving(false);
          return;
        }
      } catch (err) {
        console.error("Failed to update documents on backend:", err);
      }
    }

    onUpdateDocuments(vehicle.id, updatedDocs);
    setSavedToast(true);
    setIsSaving(false);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 800);
  };

  const renderBadge = (dateStr) => {
    const status = computeStatus(dateStr);
    if (status === "Expired") {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <ShieldAlert className="w-3 h-3" />
          <span>Expired</span>
        </span>
      );
    }
    if (status === "Expiring Soon") {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3" />
          <span>Expiring Soon</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <ShieldCheck className="w-3 h-3" />
        <span>Valid</span>
      </span>
    );
  };

  const docConfigs = [
    {
      key: "insurance",
      title: "1. Insurance Policy",
      placeholder: "e.g. POL-8829104",
    },
    {
      key: "rc",
      title: "2. Registration Certificate (RC)",
      placeholder: "e.g. RC-MH12-4521",
    },
    {
      key: "puc",
      title: "3. Pollution Under Control (PUC)",
      placeholder: "e.g. PUC-MH-2026-90",
    },
    {
      key: "fitness",
      title: "4. Fitness Certificate",
      placeholder: "e.g. FIT-2026-4412",
    },
    {
      key: "permit",
      title: "5. Transport Permit",
      placeholder: "e.g. NP-IND-2026-778",
    },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-auto max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  Vehicle Documents &amp; Compliance
                </h3>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  {vehicle.registrationNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Track and update statutory transport documents, document
                numbers, validity periods and renewal alerts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSave}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {apiError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            {savedToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Document validity and compliance details updated successfully!
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {docConfigs.map(({ key, title, placeholder }) => (
                <div
                  key={key}
                  className={`p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5 ${
                    key === "permit" ? "md:col-span-2" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">
                      {title}
                    </span>
                    {renderBadge(docState[key]?.expireDate)}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Document Number
                      </label>
                      <input
                        type="text"
                        value={docState[key]?.documentNumber || ""}
                        onChange={(e) =>
                          handleDocChange(key, "documentNumber", e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono"
                        placeholder={placeholder}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Expire Date
                      </label>
                      <input
                        type="date"
                        value={docState[key]?.expireDate || ""}
                        onChange={(e) =>
                          handleDocChange(key, "expireDate", e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end space-x-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Document Records</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 7. MaintenanceModal Component ────────────────────────────────────────────

function MaintenanceModal({
  isOpen,
  onClose,
  vehicle,
  onAddMaintenanceRecord,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    serviceDate: new Date().toISOString().split("T")[0],
    serviceType: "Routine Periodic Service",
    description: "",
    odometer: "",
    serviceCost: "",
    serviceProvider: "",
    nextServiceDate: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [records, setRecords] = useState([]);

  useEffect(() => {
    if (isOpen && vehicle) {
      setFormData({
        serviceDate: new Date().toISOString().split("T")[0],
        serviceType: "Routine Periodic Service",
        description: "",
        odometer: "",
        serviceCost: "",
        serviceProvider: "",
        nextServiceDate: "",
      });
      setFormError("");
      setToastMsg("");
      setShowAddForm(false);

      const targetId = vehicle._id || vehicle.id;
      const initialLogs = vehicle.maintenanceHistory || [];
      setRecords(initialLogs);

      const token = localStorage.getItem("token");
      if (token && targetId && !String(targetId).startsWith("VEH-")) {
        fetch(`${API_BASE_URL}/vechile-maintenance/${targetId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => (res.ok ? res.json() : []))
          .then((data) => {
            if (Array.isArray(data) && data.length > 0) {
              const mapped = data.map((item) => ({
                id: item._id,
                _id: item._id,
                vehicleId: item.vehicleId || item.vechileId,
                date: item.serviceDate
                  ? new Date(item.serviceDate).toISOString().split("T")[0]
                  : "",
                serviceDate: item.serviceDate
                  ? new Date(item.serviceDate).toISOString().split("T")[0]
                  : "",
                type: item.serviceType,
                serviceType: item.serviceType,
                description: item.description,
                odometer: item.odometer,
                cost: item.serviceCost,
                serviceCost: item.serviceCost,
                serviceCenter: item.serviceProvider,
                serviceProvider: item.serviceProvider,
                nextDueDate: item.nextServiceDate
                  ? new Date(item.nextServiceDate).toISOString().split("T")[0]
                  : "",
                nextServiceDate: item.nextServiceDate
                  ? new Date(item.nextServiceDate).toISOString().split("T")[0]
                  : "",
              }));
              setRecords(mapped);
            }
          })
          .catch((err) =>
            console.error("Error fetching vehicle maintenance logs:", err),
          );
      }
    }
  }, [isOpen, vehicle]);

  if (!isOpen || !vehicle) return null;

  const currentMaint = vehicle.maintenance || {};
  const totalCost = records.reduce(
    (sum, r) => sum + (Number(r.serviceCost ?? r.cost) || 0),
    0,
  );
  const lastRecord = records[0];
  const lastDate =
    lastRecord?.serviceDate ||
    lastRecord?.date ||
    currentMaint.lastServiceDate ||
    "N/A";
  const nextDueDate =
    lastRecord?.nextServiceDate ||
    lastRecord?.nextDueDate ||
    currentMaint.nextServiceDate ||
    "N/A";
  const lastProvider =
    lastRecord?.serviceProvider ||
    lastRecord?.serviceCenter ||
    currentMaint.serviceCenter ||
    "";
  const latestOdo = lastRecord?.odometer;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (
      !formData.serviceDate ||
      !formData.serviceType ||
      !formData.description.trim() ||
      formData.odometer === "" ||
      formData.serviceCost === "" ||
      !formData.serviceProvider.trim()
    ) {
      setFormError("Please fill in all required maintenance fields.");
      return;
    }

    const odoNum = Number(formData.odometer);
    const costNum = Number(formData.serviceCost);

    if (isNaN(odoNum) || odoNum < 0) {
      setFormError("Odometer reading must be a valid non-negative number.");
      return;
    }

    if (isNaN(costNum) || costNum < 0) {
      setFormError("Service cost must be a valid non-negative amount.");
      return;
    }

    const targetVehicleId = vehicle._id || vehicle.id;
    const token = localStorage.getItem("token");

    setIsSubmitting(true);
    try {
      let savedLogId = null;

      if (
        token &&
        targetVehicleId &&
        !String(targetVehicleId).startsWith("VEH-")
      ) {
        const payload = {
          vehicleId: targetVehicleId,
          vechileId: targetVehicleId,
          serviceDate: formData.serviceDate,
          serviceType: formData.serviceType,
          description: formData.description.trim(),
          odometer: odoNum,
          serviceCost: costNum,
          serviceProvider: formData.serviceProvider.trim(),
          nextServiceDate: formData.nextServiceDate || undefined,
        };

        const res = await fetch(`${API_BASE_URL}/vechile-maintenance`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data.message || "Failed to save maintenance record to backend",
          );
        }
        savedLogId = data.log?._id;
      }

      const newRecord = {
        id: savedLogId || `MNT-${Math.floor(100 + Math.random() * 900)}`,
        _id: savedLogId,
        vehicleId: targetVehicleId,
        date: formData.serviceDate,
        serviceDate: formData.serviceDate,
        type: formData.serviceType,
        serviceType: formData.serviceType,
        serviceCenter: formData.serviceProvider.trim(),
        serviceProvider: formData.serviceProvider.trim(),
        cost: costNum,
        serviceCost: costNum,
        odometer: odoNum,
        description: formData.description.trim(),
        nextDueDate: formData.nextServiceDate || "",
        nextServiceDate: formData.nextServiceDate || "",
      };

      setRecords((prev) => [newRecord, ...prev]);
      if (onAddMaintenanceRecord) {
        onAddMaintenanceRecord(vehicle.id, newRecord);
      }

      setShowAddForm(false);
      setToastMsg("Maintenance & service record saved successfully!");
      setFormData({
        serviceDate: new Date().toISOString().split("T")[0],
        serviceType: "Routine Periodic Service",
        description: "",
        odometer: "",
        serviceCost: "",
        serviceProvider: "",
        nextServiceDate: "",
      });
      setTimeout(() => setToastMsg(""), 3000);
    } catch (err) {
      setFormError(
        err.message || "Something went wrong while connecting to the server",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-auto max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  Maintenance &amp; Service History
                </h3>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-200 text-slate-800">
                  {vehicle.registrationNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Log service interventions, preventive checkups, component
                repairs and next schedules.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 bg-amber-50/30 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Last Service
            </span>
            <p className="text-sm font-extrabold text-slate-800 mt-0.5">
              {lastDate}
            </p>
            {lastProvider && (
              <span className="text-[10px] text-slate-400 truncate block">
                {lastProvider}
              </span>
            )}
            {latestOdo !== undefined && latestOdo !== null && (
              <span className="text-[10px] font-mono font-semibold text-slate-600 block mt-0.5">
                {latestOdo.toLocaleString()} km
              </span>
            )}
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Next Service Due
            </span>
            <p className="text-sm font-extrabold text-amber-600 mt-0.5">
              {nextDueDate}
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold">
              Health Score: {currentMaint.healthScore || 90}%
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Total Service Spend
            </span>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5">
              ₹{totalCost.toLocaleString("en-IN")}
            </p>
            <span className="text-[10px] text-slate-400">
              {records.length} logged service{records.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {toastMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Service Log Records ({records.length})
            </h4>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setFormError("");
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? "Hide Form" : "Log New Service"}</span>
            </button>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleSubmit}
              className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-150"
            >
              <div className="font-bold text-xs text-slate-800 pb-1 border-b border-slate-200 flex items-center justify-between">
                <span>Record New Maintenance Entry</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Vehicle: {vehicle.registrationNumber}
                </span>
              </div>

              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Service Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.serviceDate}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceDate: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Service Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceType: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                  >
                    <option value="Routine Periodic Service">
                      Routine Periodic Service
                    </option>
                    <option value="Engine & Transmission Overhaul">
                      Engine &amp; Transmission Overhaul
                    </option>
                    <option value="Brake Lining & Suspension">
                      Brake Lining &amp; Suspension
                    </option>
                    <option value="Tire Rotation & Wheel Alignment">
                      Tire Rotation &amp; Wheel Alignment
                    </option>
                    <option value="Electrical & Battery Service">
                      Electrical &amp; Battery Service
                    </option>
                    <option value="AC & Cabin Air System">
                      AC &amp; Cabin Air System
                    </option>
                    <option value="Oil & Filter Replacement">
                      Oil &amp; Filter Replacement
                    </option>
                    <option value="Body & Structural Repair">
                      Body &amp; Structural Repair
                    </option>
                    <option value="General Safety Inspection">
                      General Safety Inspection
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Next Service Date
                  </label>
                  <input
                    type="date"
                    value={formData.nextServiceDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nextServiceDate: e.target.value,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Service Provider / Workshop{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Motors Hub / Apex Commercial"
                    value={formData.serviceProvider}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        serviceProvider: e.target.value,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Odometer Reading (km){" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 45200"
                    value={formData.odometer}
                    onChange={(e) =>
                      setFormData({ ...formData, odometer: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Service Cost (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="e.g. 8500"
                    value={formData.serviceCost}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceCost: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Work Description &amp; Parts Replaced{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. Replaced engine oil, oil filter, air filter, topped up coolant."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-1 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormError("");
                  }}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg shadow-2xs transition-colors flex items-center space-x-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Log...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Service Record</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {records.length > 0 ? (
            <div className="space-y-3">
              {records.map((rec, idx) => (
                <div
                  key={rec.id || rec._id || idx}
                  className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-900">
                          {rec.serviceType || rec.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {rec.description}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹
                        {(
                          Number(rec.serviceCost ?? rec.cost) || 0
                        ).toLocaleString("en-IN")}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {rec.serviceDate || rec.date}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>
                          {rec.serviceProvider ||
                            rec.serviceCenter ||
                            "Authorized Hub"}
                        </span>
                      </span>
                      {rec.odometer !== undefined && rec.odometer !== null && (
                        <span className="flex items-center space-x-1 font-mono text-slate-600">
                          <Gauge className="w-3 h-3 text-slate-400" />
                          <span>
                            {Number(rec.odometer).toLocaleString()} km
                          </span>
                        </span>
                      )}
                    </div>
                    {(rec.nextServiceDate || rec.nextDueDate) && (
                      <span>
                        Next Due:{" "}
                        <strong className="text-slate-700">
                          {rec.nextServiceDate || rec.nextDueDate}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No previous maintenance history logged for this vehicle.
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 8. FuelRecordsModal Component ────────────────────────────────────────────

function FuelRecordsModal({ isOpen, onClose, vehicle, onAddFuelRecord }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [records, setRecords] = useState(vehicle?.fuelRecords || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    fuelType: vehicle?.fuelType || "Diesel",
    litres: "",
    pricePerLitre: "90.5",
    odometer: vehicle?.odometer ? vehicle.odometer + 450 : 65000,
    station: "Indian Oil Retail Outlet",
  });
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    if (!isOpen || !vehicle) return;
    setRecords(vehicle.fuelRecords || []);

    const fetchFuelLogs = async () => {
      const targetId = vehicle._id || vehicle.id;
      if (!targetId) return;

      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/vechile-fuel/${targetId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map((log) => ({
              id: log._id || `FL-${Math.floor(100 + Math.random() * 900)}`,
              date: log.fuelDate ? log.fuelDate.split("T")[0] : log.date,
              fuelType: log.fuelType,
              litres: log.quantity ?? log.quatity ?? log.litres,
              pricePerLitre:
                log.pricePerLitre ||
                ((log.fuelCost || log.fuelConst || log.totalCost) &&
                (log.quantity || log.quatity || log.litres)
                  ? (
                      (log.fuelCost || log.fuelConst || log.totalCost) /
                      (log.quantity || log.quatity || log.litres)
                    ).toFixed(2)
                  : "90.5"),
              totalCost: log.fuelCost ?? log.fuelConst ?? log.totalCost,
              odometer: log.odometer,
              station: log.fuelStation || log.station,
            }));
            setRecords(mapped);
          }
        }
      } catch (err) {
        console.error("Error fetching fuel records:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFuelLogs();
  }, [isOpen, vehicle]);

  if (!isOpen || !vehicle) return null;

  const calculatedTotalLitres = records.reduce(
    (acc, curr) => acc + (parseFloat(curr.litres) || 0),
    0,
  );
  const calculatedTotalCost = records.reduce(
    (acc, curr) => acc + (parseFloat(curr.totalCost) || 0),
    0,
  );
  const avgPrice =
    calculatedTotalLitres > 0
      ? (calculatedTotalCost / calculatedTotalLitres).toFixed(2)
      : 90;

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    const ltr = parseFloat(formData.litres);
    const rate = parseFloat(formData.pricePerLitre);
    if (!ltr || isNaN(ltr) || ltr <= 0) {
      setFormError("Please enter valid fuel quantity (litres/kg)");
      return;
    }
    if (!rate || isNaN(rate) || rate <= 0) {
      setFormError("Please enter valid price per unit");
      return;
    }
    if (!formData.station || !formData.station.trim()) {
      setFormError("Please enter fuel station or vendor name");
      return;
    }

    const total = ltr * rate;
    const targetVehicleId = vehicle._id || vehicle.id;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/vechile-fuel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicleId: targetVehicleId,
          vechileId: targetVehicleId,
          fuelDate: formData.date,
          date: formData.date,
          fuelType: formData.fuelType,
          quantity: ltr,
          quatity: ltr,
          litres: ltr,
          fuelCost: total,
          fuelConst: total,
          totalCost: total,
          odometer: parseInt(formData.odometer) || vehicle.odometer || 0,
          fuelStation: formData.station.trim(),
          station: formData.station.trim(),
          pricePerLitre: rate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save fuel log");
      }

      const newRecord = {
        id: data.record?._id || `FL-${Math.floor(100 + Math.random() * 900)}`,
        date: formData.date,
        fuelType: formData.fuelType,
        litres: ltr,
        pricePerLitre: rate,
        totalCost: total,
        odometer: parseInt(formData.odometer) || vehicle.odometer || 0,
        station: formData.station.trim(),
      };

      setRecords((prev) => [newRecord, ...prev]);
      if (onAddFuelRecord) {
        onAddFuelRecord(vehicle.id || vehicle._id, newRecord);
      }

      setShowAddForm(false);
      setToastMsg("Fuel record successfully registered to vehicle ledger!");
      setFormData({
        date: new Date().toISOString().split("T")[0],
        fuelType: vehicle.fuelType || "Diesel",
        litres: "",
        pricePerLitre: "90.5",
        odometer: (vehicle.odometer || 60000) + 500,
        station: "Indian Oil Retail Outlet",
      });
      setTimeout(() => setToastMsg(""), 3000);
    } catch (err) {
      setFormError(err.message || "Network error while saving fuel record");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-auto overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  Fuel Consumption &amp; Expense Log
                </h3>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-200 text-slate-800">
                  {vehicle.registrationNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Track fuel fillings, dispense volumes, costs and monitor mileage
                efficiency.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 bg-emerald-50/30 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Total Fuel Logged
            </span>
            <p className="text-sm font-extrabold text-slate-800 mt-0.5">
              {calculatedTotalLitres.toLocaleString()}{" "}
              {vehicle.fuelType === "CNG" ? "Kg" : "Litres"}
            </p>
            <span className="text-[10px] text-slate-400">
              {records.length} refuel entries
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Total Fuel Cost
            </span>
            <p className="text-sm font-extrabold text-emerald-700 mt-0.5">
              ₹{calculatedTotalCost.toLocaleString("en-IN")}
            </p>
            <span className="text-[10px] text-slate-400">
              Avg ₹{avgPrice}/unit
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Calculated Mileage
            </span>
            <p className="text-sm font-extrabold text-blue-600 mt-0.5">
              {vehicle.fuelSummary?.avgMileage || "9.2 km/L"}
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold">
              Optimal fleet band
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {toastMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Fueling Ledger Entries ({records.length})
            </h4>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(!showAddForm);
                setFormError("");
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? "Hide Form" : "Add Fuel Record"}</span>
            </button>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleAddSubmit}
              className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-150"
            >
              <div className="font-bold text-xs text-slate-800 pb-1 border-b border-slate-200 flex items-center justify-between">
                <span>Record New Fuel Entry</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Vehicle: {vehicle.registrationNumber}
                </span>
              </div>

              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Fuel Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.fuelType}
                    onChange={(e) =>
                      setFormData({ ...formData, fuelType: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Litres / Kg <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    required
                    placeholder="e.g. 65"
                    value={formData.litres}
                    onChange={(e) =>
                      setFormData({ ...formData, litres: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Price / Litre (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    placeholder="90.50"
                    value={formData.pricePerLitre}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricePerLitre: e.target.value,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Odometer Reading (km){" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.odometer}
                    onChange={(e) =>
                      setFormData({ ...formData, odometer: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Total Amount (₹)
                  </label>
                  <div className="px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 rounded-lg border border-slate-200">
                    ₹
                    {(
                      (parseFloat(formData.litres) || 0) *
                      (parseFloat(formData.pricePerLitre) || 0)
                    ).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Fuel Station / Vendor <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indian Oil COCO, Highway Junction"
                  value={formData.station}
                  onChange={(e) =>
                    setFormData({ ...formData, station: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-1 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormError("");
                  }}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Saving..." : "Save Fuel Record"}</span>
                </button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2" />
              <span>Loading fuel records...</span>
            </div>
          ) : records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold">
                    <th className="py-2">Date</th>
                    <th className="py-2">Fuel Type</th>
                    <th className="py-2">Quantity</th>
                    <th className="py-2">Rate/Unit</th>
                    <th className="py-2">Odometer</th>
                    <th className="py-2">Station</th>
                    <th className="py-2 text-right">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-medium text-slate-800">
                        {r.date}
                      </td>
                      <td className="py-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-[10px] text-slate-700">
                          {r.fuelType}
                        </span>
                      </td>
                      <td className="py-2.5 font-bold text-slate-800">
                        {r.litres} {r.fuelType === "CNG" ? "Kg" : "L"}
                      </td>
                      <td className="py-2.5 text-slate-600">
                        ₹{r.pricePerLitre}
                      </td>
                      <td className="py-2.5 font-mono text-slate-500">
                        {(r.odometer || 0).toLocaleString()} km
                      </td>
                      <td className="py-2.5 text-slate-600 truncate max-w-37.5">
                        {r.station}
                      </td>
                      <td className="py-2.5 text-right font-extrabold text-slate-900">
                        ₹{(r.totalCost || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
              <Fuel className="w-8 h-8 text-slate-300" />
              <p>No fuel consumption records logged for this vehicle.</p>
              {!showAddForm && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(true);
                    setFormError("");
                  }}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Fuel Record</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 9. TripHistoryModal Component ────────────────────────────────────────────

function TripHistoryModal({ isOpen, onClose, vehicle, onAddTrip }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    driver: vehicle?.driver || "Anil Deshmukh",
    date: new Date().toISOString().split("T")[0],
    distanceKm: "",
    status: "Completed",
  });
  const [toastMsg, setToastMsg] = useState(false);

  if (!isOpen || !vehicle) return null;

  const history = vehicle.tripHistory || [];
  const totalTrips =
    (vehicle.tripSummary?.totalTrips || 0) +
    (history.length > 3 ? history.length - 3 : 0);
  const totalDistance =
    vehicle.tripSummary?.totalDistanceKm ||
    history.reduce((acc, curr) => acc + (curr.distanceKm || 0), 0) + 12000;
  const utilization = vehicle.tripSummary?.utilizationRate || 85;

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.origin || !formData.destination || !formData.distanceKm)
      return;

    const newTrip = {
      tripId: `TRP-${Math.floor(1000 + Math.random() * 9000)}`,
      driver: formData.driver || vehicle.driver || "Staff Driver",
      origin: formData.origin,
      destination: formData.destination,
      date: formData.date,
      distanceKm: parseInt(formData.distanceKm) || 100,
      status: formData.status,
    };

    onAddTrip(vehicle.id, newTrip);
    setShowAddForm(false);
    setToastMsg(true);
    setFormData({
      origin: "",
      destination: "",
      driver: vehicle.driver || "Anil Deshmukh",
      date: new Date().toISOString().split("T")[0],
      distanceKm: "",
      status: "Completed",
    });
    setTimeout(() => setToastMsg(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  Trip History &amp; Vehicle Utilization
                </h3>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-200 text-slate-800">
                  {vehicle.registrationNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Log completed journeys, track active shipments and calculate
                operational fleet utilization.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 bg-blue-50/40 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Lifetime Trips
            </span>
            <p className="text-sm font-extrabold text-slate-800 mt-0.5">
              {totalTrips}
            </p>
            <span className="text-[10px] text-slate-400">All dispatches</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Total Distance
            </span>
            <p className="text-sm font-extrabold text-slate-800 mt-0.5">
              {totalDistance.toLocaleString()} km
            </p>
            <span className="text-[10px] text-slate-400">Recorded mileage</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Active Trips
            </span>
            <p className="text-sm font-extrabold text-blue-600 mt-0.5">
              {vehicle.status === "Assigned" ? 1 : 0}
            </p>
            <span className="text-[10px] text-blue-500 font-semibold">
              {vehicle.status === "Assigned" ? "In transit" : "Idle in yard"}
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Utilization Rate
            </span>
            <p className="text-sm font-extrabold text-emerald-600 mt-0.5">
              {utilization}%
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold">
              High efficiency
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
          {toastMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Trip log added successfully to vehicle records!</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Recent Trip Logs ({history.length})
            </h4>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? "Hide Form" : "Log New Trip"}</span>
            </button>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleAddSubmit}
              className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-150"
            >
              <div className="font-bold text-xs text-slate-800 pb-1 border-b border-slate-200">
                Dispatch / Log Trip
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Origin *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Delhi Cargo Hub"
                    value={formData.origin}
                    onChange={(e) =>
                      setFormData({ ...formData, origin: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Destination *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai DC, Bhiwandi"
                    value={formData.destination}
                    onChange={(e) =>
                      setFormData({ ...formData, destination: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Anil Deshmukh"
                    value={formData.driver}
                    onChange={(e) =>
                      setFormData({ ...formData, driver: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Distance (km) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="1420"
                    value={formData.distanceKm}
                    onChange={(e) =>
                      setFormData({ ...formData, distanceKm: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Trip Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                  >
                    <option value="Completed">Completed</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
                >
                  Save Trip Record
                </button>
              </div>
            </form>
          )}

          {history.length > 0 ? (
            <div className="space-y-2.5">
              {history.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {t.tripId}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="font-semibold text-slate-800 text-xs flex items-center space-x-1">
                        <span>{t.origin}</span>
                        <span className="text-slate-400">&rarr;</span>
                        <span>{t.destination}</span>
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === "Completed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : t.status === "In Transit"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Driver:{" "}
                      <strong className="text-slate-700">{t.driver}</strong>
                    </span>
                    <span>
                      Distance:{" "}
                      <strong className="text-slate-700">
                        {t.distanceKm} km
                      </strong>{" "}
                      • {t.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No trip history logged for this vehicle.
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 10. ServiceReminderModal Component ───────────────────────────────────────

function ServiceReminderModal({
  isOpen,
  onClose,
  vehicles = [],
  onCompleteService,
}) {
  if (!isOpen) return null;

  const now = new Date("2026-09-14");

  const reminders = vehicles
    .map((v) => {
      const nextDate = v.maintenance?.nextServiceDate;
      let daysRemaining = 30;
      if (nextDate) {
        const diff = Math.ceil(
          (new Date(nextDate) - now) / (1000 * 60 * 60 * 24),
        );
        daysRemaining = diff;
      }

      let priority = "Low";
      if (daysRemaining <= 7) priority = "High";
      else if (daysRemaining <= 20) priority = "Medium";

      return {
        vehicleId: v.id,
        model: v.model,
        registrationNumber: v.registrationNumber,
        serviceDueDate: nextDate || "2026-10-15",
        serviceType: "Routine Periodic & Safety Inspection",
        daysRemaining,
        priority,
        serviceCenter:
          v.maintenance?.serviceCenter || "Central Authorized Workshop",
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Fleet Service &amp; Maintenance Reminders
              </h3>
              <p className="text-xs text-slate-500">
                Scheduled vehicle service due dates, safety inspections and
                preventive alerts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {reminders.map((r) => {
            const isDueSoon = r.daysRemaining <= 7;
            const isOverdue = r.daysRemaining < 0;

            return (
              <div
                key={r.vehicleId}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                  isOverdue
                    ? "bg-rose-50/40 border-rose-200"
                    : isDueSoon
                      ? "bg-amber-50/40 border-amber-200"
                      : "bg-slate-50/70 border-slate-200/80"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-lg mt-0.5 ${
                      isOverdue
                        ? "bg-rose-100 text-rose-600"
                        : isDueSoon
                          ? "bg-amber-100 text-amber-600"
                          : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-xs">
                        {r.model}
                      </span>
                      <span className="font-mono font-bold text-xs bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded">
                        {r.registrationNumber}
                      </span>
                      <span
                        className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                          r.priority === "High"
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : r.priority === "Medium"
                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {r.priority} Priority
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">
                      {r.serviceType}
                    </p>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-1">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>
                          Due:{" "}
                          <strong className="text-slate-700">
                            {r.serviceDueDate}
                          </strong>
                        </span>
                      </span>
                      <span>•</span>
                      <span
                        className={`font-bold ${
                          isOverdue
                            ? "text-rose-600"
                            : isDueSoon
                              ? "text-amber-600"
                              : "text-slate-600"
                        }`}
                      >
                        {isOverdue
                          ? `Overdue by ${Math.abs(r.daysRemaining)} days`
                          : r.daysRemaining === 0
                            ? "Due today"
                            : `Due in ${r.daysRemaining} days`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sm:shrink-0 flex sm:justify-end">
                  <button
                    onClick={() => onCompleteService(r.vehicleId)}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Mark as Completed</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50 text-xs">
          <span className="text-slate-500">
            {reminders.length} service schedules tracked across active fleet
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 11. BulkImportModal Component ────────────────────────────────────────────

function BulkImportModal({
  isOpen,
  onClose,
  existingVehicles = [],
  onImportVehicles,
}) {
  const [parsedRows, setParsedRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [rawText, setRawText] = useState("");

  if (!isOpen) return null;

  const sampleCsv = `vehicleId,registrationNumber,type,model,capacity,driver,status
VEH-011,PB-10-XY-9081,Truck,Tata Signa 4825.TK,28 Ton,Harvinder Singh,Available
VEH-012,TN-02-AZ-4419,Van,Mahindra Bolero Maxi,1.2 Ton,K. Balaji,Available
VEH-013,AP-09-RT-7711,Pickup,Tata Intra V30,2 Ton,Suresh Naidu,Assigned
VEH-014,HR-26-CC-8820,Container Truck,Eicher Pro 3019,16 Ton,Kuldeep Yadav,In Maintenance`;

  const parseCsvText = (text) => {
    try {
      setParseError("");
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) {
        setParseError(
          "CSV must have a header line and at least 1 record line.",
        );
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

      const rows = [];
      const regSet = new Set(
        existingVehicles.map((v) => v.registrationNumber.toUpperCase()),
      );

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const rowObj = {};
        headers.forEach((h, idx) => {
          rowObj[h] = cols[idx] || "";
        });

        const reg = (
          rowObj.registrationnumber ||
          rowObj["registration number"] ||
          cols[1] ||
          ""
        ).toUpperCase();
        const type = rowObj.type || cols[2] || "Truck";
        const model = rowObj.model || cols[3] || "Commercial Carrier";
        const capacity = rowObj.capacity || cols[4] || "4.5 Ton";
        const driver = rowObj.driver || cols[5] || "Unassigned";
        const status = rowObj.status || cols[6] || "Available";
        const vehicleId =
          rowObj.vehicleid ||
          cols[0] ||
          `VEH-${Math.floor(100 + Math.random() * 900)}`;

        let validationError = null;
        if (!reg) {
          validationError = "Missing registration number";
        } else if (regSet.has(reg)) {
          validationError = "Duplicate: already in fleet";
        }

        rows.push({
          id: vehicleId,
          registrationNumber: reg,
          type,
          model,
          capacity,
          driver,
          status: [
            "Available",
            "Assigned",
            "In Maintenance",
            "Inactive",
          ].includes(status)
            ? status
            : "Available",
          validationError,
          isValid: !validationError,
        });
      }

      setParsedRows(rows);
    } catch (err) {
      setParseError("Failed to parse CSV file: " + err.message);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target.result;
      setRawText(content);
      parseCsvText(content);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setFileName("sample_fleet_vehicles.csv");
    setRawText(sampleCsv);
    parseCsvText(sampleCsv);
  };

  const handleConfirmImport = () => {
    const validVehicles = parsedRows
      .filter((r) => r.isValid)
      .map((r) => ({
        id: r.id || `VEH-${Math.floor(100 + Math.random() * 900)}`,
        registrationNumber: r.registrationNumber,
        type: r.type,
        model: r.model,
        year: 2023,
        capacity: r.capacity,
        capacityValue: parseFloat(r.capacity) || 4,
        fuelType: "Diesel",
        driver: r.driver,
        driverPhone: "+91 98000 00000",
        status: r.status,
        location: "Central Depot Hub",
        odometer: 45000,
        documents: {
          insurance: {
            policyNumber: `POL-IMP-${Math.floor(1000 + Math.random() * 9000)}`,
            provider: "National Insurance",
            expiryDate: "2027-05-15",
            status: "Valid",
          },
          rc: {
            rcNumber: `RC-${r.registrationNumber.replace(/-/g, "")}`,
            expiryDate: "2037-08-20",
            status: "Valid",
          },
          fitness: {
            certificateNumber: `FIT-IMP-${Math.floor(1000 + Math.random() * 9000)}`,
            expiryDate: "2027-02-10",
            status: "Valid",
          },
          permit: {
            permitNumber: `NP-IMP-${Math.floor(1000 + Math.random() * 9000)}`,
            permitType: "All India Permit",
            expiryDate: "2027-10-30",
            status: "Valid",
          },
          puc: {
            certificateNumber: `PUC-IMP-${Math.floor(100 + Math.random() * 9000)}`,
            expiryDate: "2026-12-15",
            status: "Valid",
          },
        },
        maintenance: {
          lastServiceDate: "2026-06-15",
          nextServiceDate: "2026-10-15",
          serviceCenter: "Authorized Commercial Works",
          lastCost: 7500,
          totalMaintenanceCost: 22500,
          healthScore: 94,
        },
        maintenanceHistory: [],
        fuelSummary: {
          totalFuelLitres: 1200,
          totalFuelCost: 108000,
          avgMileage: "9.0 km/L",
        },
        fuelRecords: [],
        tripSummary: {
          totalTrips: 45,
          totalDistanceKm: 18000,
          activeTrips: r.status === "Assigned" ? 1 : 0,
          completedTrips: 45,
          utilizationRate: 80,
        },
        tripHistory: [],
      }));

    if (validVehicles.length === 0) return;

    onImportVehicles(validVehicles);
    onClose();
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Bulk Import Vehicles from CSV
              </h3>
              <p className="text-xs text-slate-500">
                Upload or preview CSV spreadsheet with vehicle records for
                instant batch registration.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/60 rounded-2xl p-6 text-center transition-colors">
            <FileSpreadsheet className="w-10 h-10 text-blue-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800">
              {fileName
                ? `Selected file: ${fileName}`
                : "Upload your Vehicle CSV file"}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
              Expected columns: vehicleId, registrationNumber, type, model,
              capacity, driver, status
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-2xs transition-colors">
                Choose CSV File
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleLoadSample}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Load Sample CSV</span>
              </button>
            </div>
          </div>

          {parseError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Parsed Records Preview ({parsedRows.length})
                </h4>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {validCount} Valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {invalidCount} Invalid / Duplicate
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-56">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Reg Number</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Model</th>
                      <th className="p-2.5">Capacity</th>
                      <th className="p-2.5">Driver</th>
                      <th className="p-2.5">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, idx) => (
                      <tr
                        key={idx}
                        className={
                          r.isValid
                            ? "hover:bg-slate-50"
                            : "bg-rose-50/40 text-rose-900"
                        }
                      >
                        <td className="p-2.5">
                          {r.isValid ? (
                            <span className="inline-flex items-center text-emerald-600 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Ready
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center text-rose-600 font-bold text-[11px]"
                              title={r.validationError}
                            >
                              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                              {r.validationError}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono font-bold">
                          {r.registrationNumber}
                        </td>
                        <td className="p-2.5">{r.type}</td>
                        <td className="p-2.5 font-medium">{r.model}</td>
                        <td className="p-2.5">{r.capacity}</td>
                        <td className="p-2.5">{r.driver}</td>
                        <td className="p-2.5">{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={validCount === 0}
            onClick={handleConfirmImport}
            className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-2xs transition-colors flex items-center space-x-1.5 ${
              validCount > 0
                ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                : "bg-slate-300 cursor-not-allowed"
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>
              Import {validCount} {validCount === 1 ? "Vehicle" : "Vehicles"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 12. Main Dashboard Vehicles Page Component ───────────────────────────────

export default function Vehicles({ onVehicleCountChange }) {
  // Master vehicles state populated directly from backend database
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters, sorting, and pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal dialog states
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedVehicleForDetails, setSelectedVehicleForDetails] =
    useState(null);

  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedVehicleForDoc, setSelectedVehicleForDoc] = useState(null);

  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [selectedVehicleForMaint, setSelectedVehicleForMaint] = useState(null);

  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [selectedVehicleForFuel, setSelectedVehicleForFuel] = useState(null);

  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [selectedVehicleForTrip, setSelectedVehicleForTrip] = useState(null);

  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);

  // Delete Confirmation state
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  // Toast feedback notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter and sort vehicle records
  const filteredVehicles = useMemo(() => {
    return vehicles
      .filter((v) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchId = v.id?.toLowerCase().includes(q);
          const matchReg = v.registrationNumber?.toLowerCase().includes(q);
          const matchType = v.type?.toLowerCase().includes(q);
          const matchModel = v.model?.toLowerCase().includes(q);
          const matchDriver = v.driver?.toLowerCase().includes(q);
          if (
            !matchId &&
            !matchReg &&
            !matchType &&
            !matchModel &&
            !matchDriver
          ) {
            return false;
          }
        }

        if (statusFilter !== "All" && v.status !== statusFilter) {
          return false;
        }

        if (typeFilter !== "All Types" && v.type !== typeFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "oldest":
            return a.id.localeCompare(b.id);
          case "reg-asc":
            return (a.registrationNumber || "").localeCompare(
              b.registrationNumber || "",
            );
          case "reg-desc":
            return (b.registrationNumber || "").localeCompare(
              a.registrationNumber || "",
            );
          case "capacity-asc":
            return (a.capacityValue || 0) - (b.capacityValue || 0);
          case "capacity-desc":
            return (b.capacityValue || 0) - (a.capacityValue || 0);
          case "newest":
          default:
            return b.id.localeCompare(a.id);
        }
      });
  }, [vehicles, searchQuery, statusFilter, typeFilter, sortBy]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredVehicles.length);
  const displayedVehicles = filteredVehicles.slice(startIndex, endIndex);

  // Status counts for control bar tabs
  const statusCounts = useMemo(
    () => ({
      all: vehicles.length,
      available: vehicles.filter((v) => v.status === "Available").length,
      assigned: vehicles.filter((v) => v.status === "Assigned").length,
      maintenance: vehicles.filter((v) => v.status === "In Maintenance").length,
      inactive: vehicles.filter((v) => v.status === "Inactive").length,
    }),
    [vehicles],
  );

  // Keep parent / sidebar updated with vehicle count
  useEffect(() => {
    if (onVehicleCountChange) {
      onVehicleCountChange(vehicles.length);
    }
  }, [vehicles.length, onVehicleCountChange]);

  // Load vehicles from backend API
  const fetchBackendVehicles = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setVehicles([]);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/vechile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped = data.map((v, index) => {
            const regNum = (
              v.vregistrationnumber ||
              v.registrationNumber ||
              `VEH-${index + 1}`
            ).toUpperCase();
            const ins = v.documents?.insurance || {};
            const rc = v.documents?.rc || {};
            const puc = v.documents?.puc || {};
            const fitness = v.documents?.fitness || {};
            const permit = v.documents?.permit || {};

            const formatExpDate = (d) => {
              if (!d) return "";
              try {
                return new Date(d).toISOString().split("T")[0];
              } catch (e) {
                return "";
              }
            };

            const computeDocStatus = (dateStr) => {
              if (!dateStr) return "Valid";
              const now = new Date();
              const target = new Date(dateStr);
              const diffDays = Math.ceil(
                (target - now) / (1000 * 60 * 60 * 24),
              );
              if (diffDays < 0) return "Expired";
              if (diffDays <= 20) return "Expiring Soon";
              return "Valid";
            };

            const insDate = formatExpDate(
              ins.expireDate || v.documents?.insuranceExpire,
            );
            const rcDate = formatExpDate(
              rc.expireDate || v.documents?.rcExpire,
            );
            const pucDate = formatExpDate(puc.expireDate);
            const fitnessDate = formatExpDate(fitness.expireDate);
            const permitDate = formatExpDate(permit.expireDate);

            const insNum =
              ins.documentNumber ||
              ins.policyNumber ||
              `POL-${regNum.replace(/[^A-Z0-9]/g, "")}`;
            const rcNum = rc.documentNumber || rc.rcNumber || `RC-${regNum}`;
            const pucNum =
              puc.documentNumber || puc.certificateNumber || `PUC-${regNum}`;
            const fitnessNum =
              fitness.documentNumber ||
              fitness.certificateNumber ||
              `FIT-${regNum}`;
            const permitNum =
              permit.documentNumber || permit.permitNumber || `NP-${regNum}`;

            const cap = v.vcapacity || v.capacityValue || 1;

            return {
              id: `VEH-${String(index + 1).padStart(3, "0")}`,
              _id: v._id,
              registrationNumber: regNum,
              type: v.vtype || v.type || "Truck",
              model: v.vmodel || v.model || "Commercial Vehicle",
              year: v.year || new Date().getFullYear(),
              capacity: `${cap} Ton`,
              capacityValue: Number(cap) || 1,
              fuelType: v.vfuletype || v.fuelType || "Diesel",
              driver: v.driver || "",
              driverPhone: v.driverPhone || "",
              status:
                v.vstatus === "Avaliable"
                  ? "Available"
                  : v.vstatus || "Available",
              location: v.location || "Central Depot, Mumbai",
              documents: {
                insurance: {
                  documentName: ins.documentName || "Insurance",
                  documentNumber: insNum,
                  policyNumber: insNum,
                  provider: ins.provider || "Fleet Insurance Corp",
                  expireDate: insDate,
                  expiryDate: insDate,
                  status: computeDocStatus(insDate),
                },
                rc: {
                  documentName: rc.documentName || "RC",
                  documentNumber: rcNum,
                  rcNumber: rcNum,
                  expireDate: rcDate,
                  expiryDate: rcDate,
                  status: computeDocStatus(rcDate),
                },
                fitness: {
                  documentName: fitness.documentName || "Fitness Certificate",
                  documentNumber: fitnessNum,
                  certificateNumber: fitnessNum,
                  expireDate: fitnessDate,
                  expiryDate: fitnessDate,
                  status: computeDocStatus(fitnessDate),
                },
                permit: {
                  documentName: permit.documentName || "Transport Permit",
                  documentNumber: permitNum,
                  permitNumber: permitNum,
                  permitType: permit.permitType || "State Commercial Permit",
                  expireDate: permitDate,
                  expiryDate: permitDate,
                  status: computeDocStatus(permitDate),
                },
                puc: {
                  documentName: puc.documentName || "PUC",
                  documentNumber: pucNum,
                  certificateNumber: pucNum,
                  expireDate: pucDate,
                  expiryDate: pucDate,
                  status: computeDocStatus(pucDate),
                },
              },
              maintenance: {
                lastServiceDate: null,
                nextServiceDate: null,
                serviceCenter: "",
                lastCost: 0,
                totalMaintenanceCost: 0,
                healthScore: 100,
              },
              maintenanceHistory: [],
              fuelSummary: {
                totalFuelLitres: 0,
                totalFuelCost: 0,
                avgMileage: "0.0 km/L",
              },
              fuelRecords: [],
            };
          });

          setVehicles(mapped);
        } else {
          setVehicles([]);
        }
      } else {
        setVehicles([]);
      }
    } catch (err) {
      console.error("Error fetching vehicles from backend:", err);
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendVehicles();
  }, []);

  // Handlers for Add / Edit
  const handleOpenAddVehicle = () => {
    setEditingVehicle(null);
    setIsVehicleModalOpen(true);
  };

  const handleOpenEditVehicle = (veh) => {
    setEditingVehicle(veh);
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = (vehicleData) => {
    if (editingVehicle) {
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === editingVehicle.id ? { ...v, ...vehicleData } : v,
        ),
      );
      showToast(
        `Vehicle ${vehicleData.registrationNumber} updated successfully!`,
      );
    } else {
      const assignedId =
        vehicleData.id || `VEH-${String(vehicles.length + 1).padStart(3, "0")}`;
      const newVehicle = {
        ...vehicleData,
        id: assignedId,
      };
      setVehicles((prev) => [newVehicle, ...prev]);
      showToast(`Vehicle ${vehicleData.registrationNumber} added to fleet!`);
    }
    setIsVehicleModalOpen(false);
  };

  // Handlers for Delete
  const handleConfirmDelete = () => {
    if (!vehicleToDelete) return;
    const reg = vehicleToDelete.registrationNumber;
    setVehicles((prev) => prev.filter((v) => v.id !== vehicleToDelete.id));
    setVehicleToDelete(null);
    showToast(`Vehicle ${reg} removed from fleet records.`, "info");
  };

  // Handler for Activate / Deactivate
  const handleToggleStatus = (veh) => {
    const newStatus = veh.status === "Inactive" ? "Available" : "Inactive";
    setVehicles((prev) =>
      prev.map((v) => (v.id === veh.id ? { ...v, status: newStatus } : v)),
    );
    showToast(
      `Vehicle ${veh.registrationNumber} is now ${newStatus.toUpperCase()}`,
      newStatus === "Available" ? "success" : "info",
    );
  };

  // Handlers for Sub-Modals
  const handleOpenDocuments = (veh) => {
    setSelectedVehicleForDoc(veh);
    setIsDocModalOpen(true);
  };

  const handleUpdateDocuments = (vehicleId, updatedDocs) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId ? { ...v, documents: updatedDocs } : v,
      ),
    );
    showToast(`Document compliance updated for vehicle ID ${vehicleId}`);
  };

  const handleOpenMaintenance = (veh) => {
    setSelectedVehicleForMaint(veh);
    setIsMaintModalOpen(true);
  };

  const handleAddMaintenanceRecord = (vehicleId, newRecord) => {
    const costVal = Number(newRecord.serviceCost ?? newRecord.cost) || 0;

    const updateVehicleMaint = (v) => {
      const currentHist = v.maintenanceHistory || [];
      const updatedCost = (v.maintenance?.totalMaintenanceCost || 0) + costVal;
      return {
        ...v,
        maintenance: {
          ...v.maintenance,
          lastServiceDate: newRecord.serviceDate || newRecord.date,
          nextServiceDate:
            newRecord.nextServiceDate ||
            newRecord.nextDueDate ||
            v.maintenance?.nextServiceDate,
          serviceCenter: newRecord.serviceProvider || newRecord.serviceCenter,
          lastCost: costVal,
          totalMaintenanceCost: updatedCost,
        },
        maintenanceHistory: [newRecord, ...currentHist],
      };
    };

    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === vehicleId || v._id === vehicleId) {
          return updateVehicleMaint(v);
        }
        return v;
      }),
    );

    setSelectedVehicleForDetails((prev) => {
      if (prev && (prev.id === vehicleId || prev._id === vehicleId)) {
        return updateVehicleMaint(prev);
      }
      return prev;
    });

    showToast(`New service record registered successfully!`);
  };

  const handleOpenFuel = (veh) => {
    setSelectedVehicleForFuel(veh);
    setIsFuelModalOpen(true);
  };

  const handleAddFuelRecord = (vehicleId, newRecord) => {
    const ltr = Number(
      newRecord.litres || newRecord.quantity || newRecord.quatity || 0,
    );
    const cost = Number(
      newRecord.totalCost || newRecord.fuelCost || newRecord.fuelConst || 0,
    );

    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === vehicleId || v._id === vehicleId) {
          const currentFuel = v.fuelRecords || [];
          const currentTotalLtr = (v.fuelSummary?.totalFuelLitres || 0) + ltr;
          const currentTotalCost = (v.fuelSummary?.totalFuelCost || 0) + cost;
          const updated = {
            ...v,
            odometer: newRecord.odometer || v.odometer,
            fuelSummary: {
              ...v.fuelSummary,
              totalFuelLitres: currentTotalLtr,
              totalFuelCost: currentTotalCost,
            },
            fuelRecords: [newRecord, ...currentFuel],
          };
          return updated;
        }
        return v;
      }),
    );

    setSelectedVehicleForDetails((prev) => {
      if (prev && (prev.id === vehicleId || prev._id === vehicleId)) {
        const currentFuel = prev.fuelRecords || [];
        const currentTotalLtr = (prev.fuelSummary?.totalFuelLitres || 0) + ltr;
        const currentTotalCost = (prev.fuelSummary?.totalFuelCost || 0) + cost;
        return {
          ...prev,
          odometer: newRecord.odometer || prev.odometer,
          fuelSummary: {
            ...prev.fuelSummary,
            totalFuelLitres: currentTotalLtr,
            totalFuelCost: currentTotalCost,
          },
          fuelRecords: [newRecord, ...currentFuel],
        };
      }
      return prev;
    });

    showToast(`Fuel filling entry recorded successfully!`);
  };

  const handleOpenTrips = (veh) => {
    setSelectedVehicleForTrip(veh);
    setIsTripModalOpen(true);
  };

  const handleAddTrip = (vehicleId, newTrip) => {
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === vehicleId) {
          const currentTrips = v.tripHistory || [];
          const totalDistance =
            (v.tripSummary?.totalDistanceKm || 0) + newTrip.distanceKm;
          const totalCount = (v.tripSummary?.totalTrips || 0) + 1;
          return {
            ...v,
            status: newTrip.status === "In Transit" ? "Assigned" : v.status,
            currentTrip: newTrip.status === "In Transit" ? newTrip : null,
            tripSummary: {
              ...v.tripSummary,
              totalTrips: totalCount,
              totalDistanceKm: totalDistance,
              completedTrips:
                newTrip.status === "Completed"
                  ? (v.tripSummary?.completedTrips || 0) + 1
                  : v.tripSummary?.completedTrips,
            },
            tripHistory: [newTrip, ...currentTrips],
          };
        }
        return v;
      }),
    );
    showToast(`Trip ${newTrip.tripId} dispatched and logged!`);
  };

  const handleCompleteService = (vehicleId) => {
    const today = new Date().toISOString().split("T")[0];
    const nextThreeMonths = new Date();
    nextThreeMonths.setMonth(nextThreeMonths.getMonth() + 3);
    const nextDue = nextThreeMonths.toISOString().split("T")[0];

    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === vehicleId) {
          const newMnt = {
            id: `MNT-${Math.floor(100 + Math.random() * 900)}`,
            date: today,
            type: "Routine Inspection & Service Completed",
            serviceCenter: v.maintenance?.serviceCenter || "Central Workshop",
            cost: 6500,
            description:
              "Scheduled maintenance carried out and safety clearance approved.",
            nextDueDate: nextDue,
            technician: "Senior Workshop Lead",
          };
          return {
            ...v,
            maintenance: {
              ...v.maintenance,
              lastServiceDate: today,
              nextServiceDate: nextDue,
              lastCost: 6500,
              totalMaintenanceCost:
                (v.maintenance?.totalMaintenanceCost || 0) + 6500,
              healthScore: 98,
            },
            maintenanceHistory: [newMnt, ...(v.maintenanceHistory || [])],
          };
        }
        return v;
      }),
    );
    showToast(
      `Service for ${vehicleId} marked as completed! Next service scheduled for ${nextDue}.`,
    );
  };

  const handleBulkImport = (importedVehicles) => {
    setVehicles((prev) => [...importedVehicles, ...prev]);
    showToast(
      `Successfully imported ${importedVehicles.length} vehicles into fleet!`,
    );
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    if (filteredVehicles.length === 0) {
      showToast("No vehicle records to export with current filters.", "error");
      return;
    }

    const headers = [
      "Vehicle ID",
      "Registration Number",
      "Type",
      "Model",
      "Capacity",
      "Driver",
      "Status",
      "Insurance Expiry",
      "RC Expiry",
      "Next Service",
    ];

    const rows = filteredVehicles.map((v) => [
      `"${v.id}"`,
      `"${v.registrationNumber}"`,
      `"${v.type}"`,
      `"${v.model}"`,
      `"${v.capacity}"`,
      `"${v.driver || "Unassigned"}"`,
      `"${v.status}"`,
      `"${v.documents?.insurance?.expiryDate || "N/A"}"`,
      `"${v.documents?.rc?.expiryDate || "N/A"}"`,
      `"${v.maintenance?.nextServiceDate || "N/A"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `fleet_vehicles_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${filteredVehicles.length} vehicle records to CSV.`);
  };

  // Refresh data handler
  const handleRefresh = () => {
    fetchBackendVehicles();
    setSearchQuery("");
    setStatusFilter("All");
    setTypeFilter("All Types");
    setSortBy("newest");
    showToast("Fleet data reloaded from database.");
  };

  return (
    <div className="shp-container">
      {/* Toast Notification */}
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
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 1. Header */}
      <div className="shp-header">
        <div>
          <h2 className="shp-title">Vehicle Management</h2>
          <p className="shp-subtitle">
            Manage fleet vehicles, availability, documents, maintenance logs,
            and vehicle utilization.
          </p>
        </div>

        <div className="shp-header__actions">
          <button
            type="button"
            onClick={handleRefresh}
            title="Reload fleet records from database"
            className="shp-btn shp-btn--ghost"
          >
            <RotateCcw size={14} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            title="Download filtered fleet records as CSV"
            className="shp-btn shp-btn--secondary"
          >
            <FileSpreadsheet size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBulkImportModalOpen(true)}
            title="Bulk import vehicles via CSV file"
            className="shp-btn shp-btn--secondary"
          >
            <Upload size={14} />
            <span>Bulk Import</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddVehicle}
            className="shp-btn shp-btn--primary"
          >
            <Plus size={16} />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* 2. 5 Summary Metric Cards */}
      <VehicleSummaryCards
        vehicles={vehicles}
        currentFilter={statusFilter}
        onSelectFilter={(val) => setStatusFilter(val)}
        onOpenReminders={() => setIsReminderModalOpen(true)}
      />

      {/* 3. Filter & Control Bar */}
      <VehicleToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        statusCounts={statusCounts}
        onFilterChange={() => setCurrentPage(1)}
      />

      {/* 4. Table Card */}
      <VehicleTable
        vehicles={displayedVehicles}
        isLoading={isLoading}
        totalFilteredCount={filteredVehicles.length}
        totalCount={vehicles.length}
        currentPage={safeCurrentPage}
        setCurrentPage={setCurrentPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        onView={(veh) => {
          setSelectedVehicleForDetails(veh);
          setIsDetailsModalOpen(true);
        }}
        onEdit={handleOpenEditVehicle}
        onDelete={(veh) => setVehicleToDelete(veh)}
        onToggleStatus={handleToggleStatus}
        onOpenDocuments={handleOpenDocuments}
        onOpenMaintenance={handleOpenMaintenance}
        onOpenFuel={handleOpenFuel}
      />

      {/* Modals */}
      <VehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onSave={handleSaveVehicle}
        vehicle={editingVehicle}
        existingVehicles={vehicles}
      />

      <VehicleDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        vehicle={selectedVehicleForDetails}
        onEdit={handleOpenEditVehicle}
        onOpenDocuments={handleOpenDocuments}
        onOpenMaintenance={handleOpenMaintenance}
        onOpenFuel={handleOpenFuel}
        onOpenTrips={handleOpenTrips}
      />

      <DocumentsModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        vehicle={selectedVehicleForDoc}
        onUpdateDocuments={handleUpdateDocuments}
      />

      <MaintenanceModal
        isOpen={isMaintModalOpen}
        onClose={() => setIsMaintModalOpen(false)}
        vehicle={selectedVehicleForMaint}
        onAddMaintenanceRecord={handleAddMaintenanceRecord}
      />

      <FuelRecordsModal
        isOpen={isFuelModalOpen}
        onClose={() => setIsFuelModalOpen(false)}
        vehicle={selectedVehicleForFuel}
        onAddFuelRecord={handleAddFuelRecord}
      />

      <TripHistoryModal
        isOpen={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
        vehicle={selectedVehicleForTrip}
        onAddTrip={handleAddTrip}
      />

      <ServiceReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        vehicles={vehicles}
        onCompleteService={handleCompleteService}
      />

      <BulkImportModal
        isOpen={isBulkImportModalOpen}
        onClose={() => setIsBulkImportModalOpen(false)}
        existingVehicles={vehicles}
        onImportVehicles={handleBulkImport}
      />

      {/* Delete Confirmation Modal */}
      {vehicleToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Fleet Vehicle
                </h3>
                <p className="text-xs text-slate-500">
                  This action will remove vehicle from records
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
              Are you sure you want to delete vehicle{" "}
              <strong className="text-slate-900 font-mono font-bold">
                {vehicleToDelete.registrationNumber} ({vehicleToDelete.model})
              </strong>
              ? All associated service and fuel records will be dereferenced.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setVehicleToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Vehicle</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
