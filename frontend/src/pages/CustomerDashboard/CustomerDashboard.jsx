import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Users,
  Search,
  Eye,
  Mail,
  Phone,
  MapPin,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  X,
  Loader2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import "../../styles/ShipmentManagement.css";
import "../../styles/CustomerDashboardl.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const formatShipmentStatus = (status) => {
  if (!status) return "In Transit";
  const s = status.toLowerCase().trim().replace(/_/g, " ");
  if (s.includes("delivered")) return "Delivered";
  if (s.includes("out for delivery")) return "Out for Delivery";
  if (s.includes("in transit") || s.includes("transit")) return "In Transit";
  if (s.includes("dispatched")) return "Dispatched";
  if (s.includes("picked up")) return "Picked Up";
  if (s.includes("warehouse")) return "At Warehouse";
  if (s.includes("pickup scheduled")) return "Pickup Scheduled";
  if (
    s.includes("order placed") ||
    s.includes("created") ||
    s.includes("scheduled")
  )
    return "Order Placed";
  if (s.includes("failed")) return "Failed Delivery";
  return s
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const getStatusTone = (status) => {
  const s = (status || "").toLowerCase().trim();
  if (s === "active" || s.includes("delivered")) return "success";
  if (s === "inactive" || s.includes("failed") || s.includes("cancelled"))
    return "danger";
  if (
    s.includes("in transit") ||
    s.includes("in_transit") ||
    s.includes("transit") ||
    s.includes("out for delivery") ||
    s.includes("out_for_delivery") ||
    s.includes("dispatched")
  )
    return "info";
  if (
    s.includes("order placed") ||
    s.includes("created") ||
    s.includes("scheduled") ||
    s.includes("picked up") ||
    s.includes("picked_up") ||
    s.includes("warehouse")
  )
    return "warning";
  return "outline";
};

const timelineSteps = [
  { label: "Order Placed", step: 1 },
  { label: "Dispatched", step: 2 },
  { label: "In Transit", step: 3 },
  { label: "Out for Delivery", step: 4 },
  { label: "Delivered", step: 5 },
];

const getStepIndex = (status) => {
  const s = (status || "").toLowerCase().replace(/_/g, " ");
  if (s.includes("delivered")) return 4;
  if (s.includes("out for delivery")) return 3;
  if (s.includes("in transit") || s.includes("transit")) return 2;
  if (
    s.includes("dispatched") ||
    s.includes("picked up") ||
    s.includes("warehouse")
  )
    return 1;
  return 0; // Order placed / created / scheduled
};

export default function CustomerDashboard() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customerData, setCustomerData] = useState(null);

  // Search & filter for shipment history
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal state
  const [viewingShipment, setViewingShipment] = useState(null);

  // Switch customer ID in navbar/error state
  const [switchIdInput, setSwitchIdInput] = useState("");

  // Fetch customer landing data from backend
  const fetchData = useCallback(async (id) => {
    if (!id || !id.trim()) {
      setError("Please provide a valid Customer ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/customer-landing/${id.trim()}`, {
        method: "GET",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || `Customer not found (${res.status})`);
      }

      if (data && data.result) {
        setCustomerData(data.result);
      } else {
        throw new Error("Invalid response received from server.");
      }
    } catch (err) {
      console.error("Error fetching customer landing data:", err);
      setError(
        err.message || "Failed to load customer information. Please try again.",
      );
      setCustomerData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(customerId);
  }, [customerId, fetchData]);

  const customer = customerData?.customerf || null;
  const shipments = useMemo(
    () => customerData?.shipmentf || [],
    [customerData?.shipmentf],
  );
  const shipmentHistory = useMemo(
    () => customerData?.shipmenthistoryf || [],
    [customerData?.shipmenthistoryf],
  );

  // Switch customer ID handler
  const handleSwitchCustomerId = (e) => {
    e.preventDefault();
    if (switchIdInput.trim()) {
      navigate(`/customer-dashboard/${switchIdInput.trim()}`);
      setSwitchIdInput("");
    }
  };

  // Filtered shipments list
  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      const sStatus = formatShipmentStatus(s.status);
      const matchesStatus =
        statusFilter === "All" ||
        sStatus.toLowerCase() === statusFilter.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesStatus;

      const trackingId = (s.trackingId || s.shipmentId || "").toLowerCase();
      const origin = (
        s.senderCity ||
        s.senderAddress ||
        s.senderName ||
        ""
      ).toLowerCase();
      const dest = (
        s.receiverCity ||
        s.receiverAddress ||
        s.receiverName ||
        ""
      ).toLowerCase();

      return (
        matchesStatus &&
        (trackingId.includes(q) || origin.includes(q) || dest.includes(q))
      );
    });
  }, [shipments, searchQuery, statusFilter]);

  // Specific shipment history events for the modal
  const activeShipmentHistory = useMemo(() => {
    if (!viewingShipment) return [];
    return shipmentHistory
      .filter((h) => String(h.shipmentId) === String(viewingShipment._id))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [viewingShipment, shipmentHistory]);

  return (
    <div className="cdb-page">
      {/* Top Navigation Bar */}
      <header className="cdb-navbar">
        <div
          className="cdb-navbar__brand"
          onClick={() => navigate("/")}
          role="button"
          tabIndex={0}
        >
          <h3>LOGO</h3>
          {/* <div className="cdb-navbar__logo">
            <Package size={22} />
            <span>LOGIX</span>
          </div> */}

          <span className="cdb-navbar__tagline">Customer Portal</span>
        </div>

        <div className="cdb-navbar__actions">
          {customerId && (
            <div className="cdb-id-pill">
              <Users size={13} />
              <span>{customerId}</span>
            </div>
          )}

          <form
            onSubmit={handleSwitchCustomerId}
            className="cdb-search-id-form"
          >
            <input
              type="text"
              placeholder="Track other Customer ID"
              value={switchIdInput}
              onChange={(e) => setSwitchIdInput(e.target.value)}
            />
            <button type="submit">Track</button>
          </form>

          <Link to="/" className="shp-btn shp-btn--secondary shp-btn--sm">
            <ArrowLeft size={13} />
            <span>Back to Home</span>
          </Link>
          <button
            type="button"
            onClick={() => fetchData(customerId)}
            className="shp-btn shp-btn--secondary shp-btn--sm"
            title="Refresh Dashboard"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="cdb-main">
        {loading ? (
          <div className="cdb-state-card">
            <Loader2
              size={36}
              className="animate-spin"
              style={{ color: "var(--primary-color)" }}
            />
            <h3 className="cdb-state-title">Loading Customer Dashboard</h3>
            <p className="cdb-state-desc">
              Retrieving your profile, shipment records, and live status
              history...
            </p>
          </div>
        ) : error || !customer ? (
          <div className="cdb-state-card">
            <div className="cdb-state-icon cdb-state-icon--error">
              <AlertTriangle size={28} />
            </div>
            <h3 className="cdb-state-title">Customer Not Found</h3>
            <p className="cdb-state-desc">
              {error ||
                `No account was found for ID "${customerId}". Please check your Customer ID and try again.`}
            </p>
            <form
              onSubmit={handleSwitchCustomerId}
              style={{
                display: "flex",
                gap: "8px",
                width: "100%",
                maxWidth: "340px",
                marginTop: "10px",
              }}
            >
              <input
                type="text"
                placeholder="Enter Customer ID"
                value={switchIdInput}
                onChange={(e) => setSwitchIdInput(e.target.value)}
                className="shp-search-box"
                style={{ flex: 1, padding: "8px 12px" }}
                required
              />
              <button type="submit" className="shp-btn shp-btn--primary">
                Search
              </button>
            </form>
            <Link
              to="/"
              className="shp-btn shp-btn--ghost shp-btn--sm"
              style={{ marginTop: "12px" }}
            >
              <ArrowLeft size={14} />
              <span>Return to Home</span>
            </Link>
          </div>
        ) : (
          <div className="shp-container">
            {/* Customer Profile Banner */}
            <div className="shp-panel">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "14px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "14px" }}
                >
                  <div
                    className="shp-avatar"
                    style={{ width: 48, height: 48, fontSize: 20 }}
                  >
                    {customer.name?.charAt(0).toUpperCase() || "C"}
                  </div>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      <h2
                        className="shp-title"
                        style={{ margin: 0, fontSize: "22px" }}
                      >
                        {customer.name}
                      </h2>
                      <span
                        className={`shp-badge shp-badge--${
                          customer.status?.toLowerCase() === "active"
                            ? "success"
                            : "danger"
                        }`}
                      >
                        {customer.status || "Active"}
                      </span>
                      <span
                        className="shp-badge shp-badge--outline"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <ShieldCheck size={13} color="var(--success)" />{" "}
                        Verified Customer
                      </span>
                    </div>
                    <p
                      className="shp-subtitle"
                      style={{ fontFamily: "monospace", marginTop: "4px" }}
                    >
                      Customer ID: {customer.customerId}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="shp-kpi-grid">
              <div className="shp-kpi-card">
                <div className="shp-kpi-card__head">
                  <span className="shp-kpi-card__icon">
                    <Package size={16} />
                  </span>
                  <span className="shp-kpi-card__title">Total Shipments</span>
                </div>
                <div className="shp-kpi-card__value">{shipments.length}</div>
                <div className="shp-kpi-card__foot">All customer packages</div>
              </div>

              <div className="shp-kpi-card">
                <div className="shp-kpi-card__head">
                  <span className="shp-kpi-card__icon shp-kpi-card__icon--success">
                    <CheckCircle2 size={16} />
                  </span>
                  <span className="shp-kpi-card__title">Delivered</span>
                </div>
                <div className="shp-kpi-card__value">
                  {
                    shipments.filter((s) =>
                      s.status?.toLowerCase().includes("delivered"),
                    ).length
                  }
                </div>
                <div className="shp-kpi-card__foot">Successfully delivered</div>
              </div>

              <div className="shp-kpi-card">
                <div className="shp-kpi-card__head">
                  <span className="shp-kpi-card__icon shp-kpi-card__icon--info">
                    <Truck size={16} />
                  </span>
                  <span className="shp-kpi-card__title">In Transit</span>
                </div>
                <div className="shp-kpi-card__value">
                  {
                    shipments.filter(
                      (s) =>
                        s.status?.toLowerCase().includes("transit") ||
                        s.status?.toLowerCase().includes("dispatched"),
                    ).length
                  }
                </div>
                <div className="shp-kpi-card__foot">Currently moving</div>
              </div>

              <div className="shp-kpi-card">
                <div className="shp-kpi-card__head">
                  <span className="shp-kpi-card__icon shp-kpi-card__icon--warning">
                    <Clock size={16} />
                  </span>
                  <span className="shp-kpi-card__title">Out for Delivery</span>
                </div>
                <div className="shp-kpi-card__value">
                  {
                    shipments.filter((s) =>
                      s.status?.toLowerCase().includes("out_for_delivery"),
                    ).length
                  }
                </div>
                <div className="shp-kpi-card__foot">Final delivery route</div>
              </div>
            </div>

            {/* Customer Information & Addresses Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "16px",
              }}
            >
              {/* Contact Card */}
              <div className="shp-card">
                <div className="shp-card__header">
                  <span className="shp-card__icon shp-card__icon--origin">
                    <Users size={16} />
                  </span>
                  <h5 className="shp-card__title">Customer Contact Details</h5>
                </div>
                <div className="shp-card__content">
                  <div className="shp-kv-grid">
                    <div className="shp-kv">
                      <span className="shp-kv__label">Primary Name</span>
                      <span className="shp-kv__value">{customer.name}</span>
                    </div>
                    <div className="shp-kv">
                      <span className="shp-kv__label">Account Status</span>
                      <span className="shp-kv__value">
                        {customer.status || "Active"}
                      </span>
                    </div>
                    <div className="shp-kv">
                      <span className="shp-kv__label">Email Address</span>
                      <span
                        className="shp-kv__value"
                        style={{
                          wordBreak: "break-all",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Mail size={13} color="var(--primary-color)" />
                        {customer.email || "—"}
                      </span>
                    </div>
                    <div className="shp-kv">
                      <span className="shp-kv__label">Phone Number</span>
                      <span
                        className="shp-kv__value"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Phone size={13} color="var(--primary-color)" />
                        {customer.phonenumber || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Card */}
              <div className="shp-card">
                <div className="shp-card__header">
                  <span className="shp-card__icon shp-card__icon--dest">
                    <MapPin size={16} />
                  </span>
                  <h5 className="shp-card__title">Registered Address</h5>
                </div>
                <div className="shp-card__content">
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm, 6px)",
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "var(--primary-color)",
                      }}
                    >
                      <MapPin size={15} />
                      <strong style={{ fontSize: "13px", color: "#000000" }}>
                        Primary Delivery / Pickup Facility
                      </strong>
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "hsla(0, 0%, 0%, 0.75)",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {customer.address || "No address on file."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipment History Table Card */}
            <div className="shp-table-card">
              <div
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: 700,
                      fontFamily: "var(--primary-text)",
                    }}
                  >
                    Your Shipment History
                  </h3>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "12px",
                      color: "hsla(0,0%,0%,0.5)",
                    }}
                  >
                    Track the lifecycle and real-time transit status of all your
                    orders.
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <div className="shp-search-box" style={{ minWidth: 200 }}>
                    <span className="shp-search-icon">
                      <Search size={14} />
                    </span>
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tracking, city, route..."
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="shp-search-clear"
                        onClick={() => setSearchQuery("")}
                        aria-label="Clear search"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="shp-select-filter"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Order Placed">Order Placed</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Failed Delivery">Failed Delivery</option>
                  </select>
                </div>
              </div>

              <div className="shp-table-wrap">
                <table className="shp-table">
                  <thead>
                    <tr>
                      <th>Tracking No.</th>
                      <th>Origin</th>
                      <th>Destination</th>
                      <th>Expected Date</th>
                      <th style={{ textAlign: "center" }}>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShipments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            textAlign: "center",
                            padding: "36px 16px",
                            color: "hsla(0,0%,0%,0.5)",
                            fontStyle: "italic",
                          }}
                        >
                          {shipments.length === 0
                            ? "No shipments recorded under this customer ID yet."
                            : "No shipments matching your search criteria."}
                        </td>
                      </tr>
                    ) : (
                      filteredShipments.map((s) => {
                        const trackingCode =
                          s.trackingId || s.shipmentId || "N/A";
                        const formattedStatus = formatShipmentStatus(s.status);
                        const expectedDate = s.expectedDeliveryDate
                          ? new Date(
                              s.expectedDeliveryDate,
                            ).toLocaleDateString()
                          : "N/A";

                        return (
                          <tr key={s._id} className="shp-table__row">
                            <td>
                              <button
                                type="button"
                                className="shp-tracking-link"
                                onClick={() => setViewingShipment(s)}
                              >
                                {trackingCode}
                              </button>
                            </td>
                            <td>
                              <p className="shp-cell-title">
                                {s.senderCity || s.senderAddress || "Origin"}
                              </p>
                              {s.senderName && (
                                <span className="shp-cell-sub">
                                  From: {s.senderName}
                                </span>
                              )}
                            </td>
                            <td>
                              <p className="shp-cell-title">
                                {s.receiverCity ||
                                  s.receiverAddress ||
                                  "Destination"}
                              </p>
                              {s.receiverName && (
                                <span className="shp-cell-sub">
                                  To: {s.receiverName}
                                </span>
                              )}
                            </td>
                            <td>
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "hsla(0,0%,0%,0.75)",
                                }}
                              >
                                {expectedDate}
                              </span>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span
                                className={`shp-badge shp-badge--${getStatusTone(
                                  s.status,
                                )}`}
                              >
                                {formattedStatus}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                type="button"
                                onClick={() => setViewingShipment(s)}
                                className="shp-btn shp-btn--ghost shp-btn--xs"
                              >
                                <Eye size={13} />
                                <span>Track Details</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Shipment Modal */}
        {viewingShipment && (
          <div className="shp-modal-overlay">
            <div className="shp-modal shp-modal--lg">
              <div className="shp-modal__header">
                <div>
                  <h3 className="shp-modal__title">Shipment Information</h3>
                  <p className="shp-modal__subtitle">
                    Tracking #
                    {viewingShipment.trackingId || viewingShipment.shipmentId}
                  </p>
                </div>
                <button
                  type="button"
                  className="shp-modal__close"
                  onClick={() => setViewingShipment(null)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="shp-modal__body">
                {/* 5-Step Lifecycle Stepper */}
                <div className="shp-stepper-card">
                  <h4 className="shp-section-title">Shipment Progress</h4>
                  <div className="shp-stepper">
                    {timelineSteps.map((step, idx) => {
                      const currentIdx = getStepIndex(viewingShipment.status);
                      const isCompleted = idx < currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div
                          key={step.step}
                          className={`shp-stepper__step ${
                            isCompleted ? "shp-stepper__step--completed" : ""
                          } ${isCurrent ? "shp-stepper__step--current" : ""}`}
                        >
                          <div className="shp-stepper__circle">
                            {isCompleted ? (
                              <CheckCircle2 size={14} />
                            ) : (
                              step.step
                            )}
                          </div>
                          <span className="shp-stepper__label">
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Route specs */}
                <div className="shp-details-grid">
                  {/* Origin */}
                  <div className="shp-card">
                    <div className="shp-card__header">
                      <span className="shp-card__icon shp-card__icon--origin">
                        <MapPin size={15} />
                      </span>
                      <h5 className="shp-card__title">Sender & Origin</h5>
                    </div>
                    <div className="shp-kv-grid">
                      <div className="shp-kv">
                        <span className="shp-kv__label">Sender Name</span>
                        <span className="shp-kv__value">
                          {viewingShipment.senderName || "—"}
                        </span>
                      </div>
                      <div className="shp-kv">
                        <span className="shp-kv__label">Phone</span>
                        <span className="shp-kv__value">
                          {viewingShipment.senderPhoneNumber || "—"}
                        </span>
                      </div>
                      <div className="shp-kv">
                        <span className="shp-kv__label">Pickup Address</span>
                        <span className="shp-kv__value">
                          {viewingShipment.senderAddress || "—"}
                        </span>
                      </div>
                      <div className="shp-kv">
                        <span className="shp-kv__label">City / State</span>
                        <span className="shp-kv__value">
                          {[
                            viewingShipment.senderCity,
                            viewingShipment.senderState,
                          ]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="shp-card">
                    <div className="shp-card__header">
                      <span className="shp-card__icon shp-card__icon--dest">
                        <MapPin size={15} />
                      </span>
                      <h5 className="shp-card__title">
                        Receiver & Destination
                      </h5>
                    </div>
                    <div className="shp-kv-grid">
                      <div className="shp-kv">
                        <span className="shp-kv__label">Receiver Name</span>
                        <span className="shp-kv__value">
                          {viewingShipment.receiverName || "—"}
                        </span>
                      </div>
                      <div className="shp-kv">
                        <span className="shp-kv__label">Phone</span>
                        <span className="shp-kv__value">
                          {viewingShipment.receiverPhoneNumber || "—"}
                        </span>
                      </div>
                      <div className="shp-kv">
                        <span className="shp-kv__label">Delivery Address</span>
                        <span className="shp-kv__value">
                          {viewingShipment.receiverAddress || "—"}
                        </span>
                      </div>
                      <div className="shp-kv">
                        <span className="shp-kv__label">City / State</span>
                        <span className="shp-kv__value">
                          {[
                            viewingShipment.receiverCity,
                            viewingShipment.receiverState,
                          ]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cargo, Delivery & Status Timeline */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "16px",
                    marginTop: "16px",
                  }}
                >
                  {/* Cargo details */}
                  <div className="shp-card">
                    <h5 className="shp-card__title">
                      Cargo & Delivery Details
                    </h5>
                    <div className="shp-kv-grid">
                      <div className="shp-kv">
                        <span className="shp-kv__label">Current Status</span>
                        <span
                          className={`shp-badge shp-badge--${getStatusTone(
                            viewingShipment.status,
                          )}`}
                        >
                          {formatShipmentStatus(viewingShipment.status)}
                        </span>
                      </div>
                      <div className="shp-kv">
                        <span className="shp-kv__label">Priority</span>
                        <span className="shp-kv__value">
                          {viewingShipment.priority || "Standard"}
                        </span>
                      </div>
                      <div className="shp-kv">
                        <span className="shp-kv__label">Package Count</span>
                        <span className="shp-kv__value">
                          {viewingShipment.packageCount || 1} pkg
                        </span>
                      </div>
                      <div className="shp-kv">
                        <span className="shp-kv__label">Total Weight</span>
                        <span className="shp-kv__value">
                          {viewingShipment.totalWeight
                            ? `${viewingShipment.totalWeight} kg`
                            : "—"}
                        </span>
                      </div>
                      {viewingShipment.dimensions && (
                        <div className="shp-kv">
                          <span className="shp-kv__label">
                            Dimensions (L×W×H)
                          </span>
                          <span className="shp-kv__value">
                            {`${viewingShipment.dimensions.length || 0} × ${
                              viewingShipment.dimensions.width || 0
                            } × ${viewingShipment.dimensions.height || 0} cm`}
                          </span>
                        </div>
                      )}
                      <div className="shp-kv">
                        <span className="shp-kv__label">Expected Delivery</span>
                        <span className="shp-kv__value">
                          {viewingShipment.expectedDeliveryDate
                            ? new Date(
                                viewingShipment.expectedDeliveryDate,
                              ).toLocaleDateString()
                            : "—"}
                        </span>
                      </div>
                      {viewingShipment.driverName && (
                        <div className="shp-kv">
                          <span className="shp-kv__label">Assigned Driver</span>
                          <span className="shp-kv__value">
                            {viewingShipment.driverName}
                          </span>
                        </div>
                      )}
                      {viewingShipment.vehicleNo && (
                        <div className="shp-kv">
                          <span className="shp-kv__label">Vehicle No.</span>
                          <span className="shp-kv__value">
                            {viewingShipment.vehicleNo}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Audit History Timeline Log */}
                  <div className="shp-card">
                    <h5 className="shp-card__title">Status History Log</h5>
                    {activeShipmentHistory.length === 0 ? (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "hsla(0,0%,0%,0.5)",
                          fontStyle: "italic",
                          margin: "12px 0 0",
                        }}
                      >
                        No additional milestone updates recorded yet.
                      </p>
                    ) : (
                      <div className="cdb-history-list">
                        {activeShipmentHistory.map((item, idx) => (
                          <div
                            key={item._id || idx}
                            className="cdb-history-item"
                          >
                            <span
                              className={`cdb-history-dot ${
                                idx === 0 ? "cdb-history-dot--latest" : ""
                              }`}
                            />
                            <span className="cdb-history-time">
                              {new Date(item.createdAt).toLocaleString()}
                            </span>
                            <span className="cdb-history-status">
                              {formatShipmentStatus(item.status)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="shp-modal__footer">
                <button
                  type="button"
                  className="shp-btn shp-btn--ghost"
                  onClick={() => setViewingShipment(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
