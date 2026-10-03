import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Check,
  MapPin,
  Phone,
  Mail,
  FileText,
  Download,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Package,
  Clock,
  Truck,
  Search,
  ArrowRight,
  Eye,
  Trash2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  FileSpreadsheet,
  Navigation,
  Play,
  CheckCircle,
} from "lucide-react";
import "../../styles/ShipmentManagement.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const getStatusTone = (status) => {
  if (status === "completed") return "success";
  if (status === "cancelled") return "danger";
  if (["in_transit", "dispatched", "arrived"].includes(status)) return "info";
  return "warning"; // planned
};

const formatStatus = (status) =>
  (status || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (isoString) => {
  if (!isoString) return "N/A";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "N/A";
  return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}, ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

/* ==========================================================================
   1. CREATE TRIP MODAL (Matching DashboardShipment Modal Architecture)
   ========================================================================== */
function CreateTripModal({
  isOpen,
  onClose,
  onSubmit,
  drivers = [],
  vehicles = [],
  availableShipments = [],
  isSubmitting = false,
}) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [stops, setStops] = useState([""]);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedShipmentIds, setSelectedShipmentIds] = useState([]);
  const [scheduledDeparture, setScheduledDeparture] = useState("");
  const [scheduledArrival, setScheduledArrival] = useState("");
  const [shipmentSearch, setShipmentSearch] = useState("");

  // Distance & Cost Calculation
  const [plannedDistanceKm, setPlannedDistanceKm] = useState(0);
  const [baseFare, setBaseFare] = useState(1500);
  const [calculatedCost, setCalculatedCost] = useState(0);
  const [sourceLabel, setSourceLabel] = useState("");
  const [isDistanceLoading, setIsDistanceLoading] = useState(false);
  const [isManualDistance, setIsManualDistance] = useState(false);
  const [isManualCost, setIsManualCost] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const depDefault = new Date(now.getTime() + 2 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16);
      const arrDefault = new Date(now.getTime() + 26 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16);
      setScheduledDeparture(depDefault);
      setScheduledArrival(arrDefault);
      setIsManualDistance(false);
      setIsManualCost(false);
      setSourceLabel("");
    }
  }, [isOpen]);

  const handleAddStop = () => setStops([...stops, ""]);
  const handleStopChange = (index, val) => {
    const updated = [...stops];
    updated[index] = val;
    setStops(updated);
  };
  const handleRemoveStop = (index) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const handleToggleShipment = (id) => {
    if (selectedShipmentIds.includes(id)) {
      setSelectedShipmentIds(selectedShipmentIds.filter((item) => item !== id));
    } else {
      setSelectedShipmentIds([...selectedShipmentIds, id]);
    }
  };

  const handleSelectAllShipments = () => {
    if (selectedShipmentIds.length === availableShipments.length) {
      setSelectedShipmentIds([]);
    } else {
      setSelectedShipmentIds(availableShipments.map((s) => s._id));
    }
  };

  // Live OpenStreetMap & OSRM API Distance Calculation with fallback
  useEffect(() => {
    let active = true;
    const cleanOrigin = origin.trim();
    const cleanDest = destination.trim();
    const validStops = stops.filter((s) => s.trim().length > 0);

    if (!cleanOrigin || !cleanDest) {
      if (!isManualDistance) {
        setPlannedDistanceKm(0);
      }
      setSourceLabel("");
      return;
    }

    const fetchRouteDistance = async () => {
      setIsDistanceLoading(true);
      let finalKm = 0;
      let label = "⚡ Fallback Estimation";

      try {
        const geo1Res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanOrigin + ", India")}`,
        );
        const geo1Data = await geo1Res.json();
        const geo2Res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanDest + ", India")}`,
        );
        const geo2Data = await geo2Res.json();

        if (geo1Data.length > 0 && geo2Data.length > 0) {
          const lat1 = geo1Data[0].lat,
            lon1 = geo1Data[0].lon;
          const lat2 = geo2Data[0].lat,
            lon2 = geo2Data[0].lon;

          const routeRes = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`,
          );
          const routeData = await routeRes.json();

          if (routeData.routes && routeData.routes.length > 0) {
            const roadDistanceKm = Math.round(
              routeData.routes[0].distance / 1000,
            );
            const stopAddon = validStops.length * 70;
            finalKm = roadDistanceKm + stopAddon;
            label = "🌐 Live OpenStreetMap API";
          }
        }
      } catch (err) {
        console.warn(
          "Live API fetch skipped or network limit, using database",
          err,
        );
      }

      if (!finalKm) {
        const baseDistance = Math.max(
          150,
          (cleanOrigin.length + cleanDest.length) * 25,
        );
        finalKm = baseDistance + validStops.length * 60;
        label = "⚡ Fallback Estimation";
      }

      if (active) {
        setIsDistanceLoading(false);
        setSourceLabel(label);
        if (!isManualDistance) {
          setPlannedDistanceKm(finalKm);
        }
      }
    };

    const timer = setTimeout(() => {
      fetchRouteDistance();
    }, 500);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [origin, destination, stops, isManualDistance]);

  // Cost calculation based on distance & vehicle rate (unless manually edited)
  useEffect(() => {
    if (isManualCost) return;
    let ratePerKm = 24;
    const selectedVeh = vehicles.find((v) => v._id === selectedVehicleId);
    if (selectedVeh && selectedVeh.ratePerKm) {
      ratePerKm = Number(selectedVeh.ratePerKm);
    }
    const distance = Number(plannedDistanceKm) || 0;
    setCalculatedCost(distance > 0 ? baseFare + distance * ratePerKm : 0);
  }, [plannedDistanceKm, selectedVehicleId, baseFare, vehicles, isManualCost]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) {
      alert("Please provide origin and destination hubs");
      return;
    }
    if (!selectedDriverId) {
      alert("Please assign a driver");
      return;
    }
    if (!selectedVehicleId) {
      alert("Please assign a vehicle");
      return;
    }
    if (selectedShipmentIds.length === 0) {
      alert("Please select at least one shipment to bundle");
      return;
    }
    if (!scheduledDeparture || !scheduledArrival) {
      alert("Please select scheduled departure and arrival");
      return;
    }

    const validStops = stops
      .map((s, idx) => ({ location: s.trim(), stopOrder: idx + 1 }))
      .filter((s) => s.location.length > 0);

    const payload = {
      origin: origin.trim(),
      destination: destination.trim(),
      stops: validStops,
      driverId: selectedDriverId,
      vechileId: selectedVehicleId,
      vehicleId: selectedVehicleId,
      shipmentIds: selectedShipmentIds,
      plannedDeparture: new Date(scheduledDeparture).toISOString(),
      plannedArrival: new Date(scheduledArrival).toISOString(),
      plannedDistance: Number(plannedDistanceKm),
      tripCost: Number(calculatedCost),
    };

    onSubmit(payload);
  };

  const filteredAvailableShipments = availableShipments.filter((shp) => {
    if (!shipmentSearch.trim()) return true;
    const q = shipmentSearch.toLowerCase();
    const tracking = (shp.trackingId || shp.shipmentId || "").toLowerCase();
    const sender = (shp.senderName || "").toLowerCase();
    const receiver = (shp.receiverName || "").toLowerCase();
    return tracking.includes(q) || sender.includes(q) || receiver.includes(q);
  });

  return (
    <div className="shp-modal-overlay">
      <div className="shp-modal shp-modal--lg">
        {/* Header */}
        <div className="shp-modal__header">
          <div>
            <h3 className="shp-modal__title">Create New Trip Manifest</h3>
            <p className="shp-modal__subtitle">
              Configure route, assign available driver/fleet and bundle ready
              shipments into this manifest.
            </p>
          </div>
          <button
            type="button"
            className="shp-modal__close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="shp-modal__form">
          <div className="shp-modal__body" style={{ maxHeight: "65vh" }}>
            {/* Section 1: Route */}
            <div style={{ marginBottom: "20px" }}>
              <h5 className="shp-section-title">1. Route & Hub Locations</h5>
              <div className="shp-form-row">
                <div className="shp-form-group">
                  <label className="shp-label">Origin Hub / City *</label>
                  <input
                    type="text"
                    required
                    className="shp-input"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="e.g. Pune Central Hub"
                  />
                </div>
                <div className="shp-form-group">
                  <label className="shp-label">Destination Hub / City *</label>
                  <input
                    type="text"
                    required
                    className="shp-input"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Chennai Gateway Hub"
                  />
                </div>
              </div>

              {/* Intermediate Stops */}
              <div
                style={{
                  marginTop: "16px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <MapPin size={15} style={{ color: "#f59e0b" }} />
                    <label
                      className="shp-label"
                      style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}
                    >
                      Intermediate Transit Stops (
                      {stops.filter((s) => s.trim().length > 0).length})
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddStop}
                    className="shp-btn shp-btn--secondary shp-btn--sm"
                    style={{
                      fontSize: "11.5px",
                      padding: "4px 10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Plus size={13} />
                    <span>Add Transit Stop</span>
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {stops.map((stop, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
                      }}
                    >
                      <span
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: "#2563eb",
                          color: "#ffffff",
                          display: "grid",
                          placeItems: "center",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        className="shp-input"
                        value={stop}
                        onChange={(e) => handleStopChange(idx, e.target.value)}
                        placeholder={`Stop #${idx + 1} city or transit hub (e.g. Solapur Hub)`}
                        style={{
                          border: "none",
                          outline: "none",
                          boxShadow: "none",
                          background: "transparent",
                          padding: "4px 0",
                        }}
                      />
                      {stops.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStop(idx)}
                          className="shp-icon-btn shp-icon-btn--danger"
                          title="Remove transit stop"
                          style={{ flexShrink: 0 }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 2: Driver & Vehicle Allocation */}
            <div style={{ marginBottom: "20px" }}>
              <h5 className="shp-section-title">
                2. Driver & Vehicle Allocation
              </h5>
              <div className="shp-form-row">
                <div className="shp-form-group">
                  <label className="shp-label">Assign Driver *</label>
                  <select
                    required
                    className="shp-select"
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                  >
                    <option value="">-- Choose Available Driver --</option>
                    {drivers.map((drv) => {
                      const name = drv.userId?.name || drv.name || "Driver";
                      const avail = drv.availability || "available";
                      const isAvail = avail === "available";
                      return (
                        <option
                          key={drv._id}
                          value={drv._id}
                          disabled={!isAvail}
                        >
                          {name} ({drv.driverId || drv._id.slice(-6)}) •{" "}
                          {avail.toUpperCase()}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="shp-form-group">
                  <label className="shp-label">Assign Vehicle *</label>
                  <select
                    required
                    className="shp-select"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                  >
                    <option value="">-- Choose Available Vehicle --</option>
                    {vehicles.map((veh) => {
                      const reg =
                        veh.vregistrationnumber ||
                        veh.registrationNumber ||
                        "Vehicle";
                      const model = veh.vmodel || veh.model || "";
                      const status = veh.vstatus || "Available";
                      const isAvail = status === "Available";
                      return (
                        <option
                          key={veh._id}
                          value={veh._id}
                          disabled={!isAvail}
                        >
                          {reg} ({model} • {veh.vcapacity || 0} kg) •{" "}
                          {status.toUpperCase()}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Attached Shipments */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <div>
                  <h5 className="shp-section-title" style={{ margin: 0 }}>
                    3. Attach Shipments ({selectedShipmentIds.length} Selected)
                  </h5>
                  <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                    Select created shipments to consolidate into this trip payload.
                  </span>
                </div>
                {availableShipments.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllShipments}
                    className="shp-btn shp-btn--ghost shp-btn--sm"
                    style={{ fontSize: "11px" }}
                  >
                    {selectedShipmentIds.length === availableShipments.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                )}
              </div>

              {availableShipments.length > 0 && (
                <div style={{ marginBottom: "8px" }}>
                  <input
                    type="text"
                    className="shp-input"
                    placeholder="Filter created shipments by tracking ID, sender, receiver..."
                    value={shipmentSearch}
                    onChange={(e) => setShipmentSearch(e.target.value)}
                    style={{
                      fontSize: "12px",
                      padding: "6px 10px",
                      width: "100%",
                    }}
                  />
                </div>
              )}

              <div
                className="shp-table-wrap shp-table-wrap--sm"
                style={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  border: "1px solid var(--border)",
                }}
              >
                {filteredAvailableShipments.length > 0 ? (
                  <table className="shp-table">
                    <thead>
                      <tr>
                        <th style={{ width: "40px" }}>Select</th>
                        <th>Tracking / ID</th>
                        <th>Sender → Receiver</th>
                        <th>Weight</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAvailableShipments.map((shp) => {
                        const isSelected = selectedShipmentIds.includes(
                          shp._id,
                        );
                        return (
                          <tr
                            key={shp._id}
                            onClick={() => handleToggleShipment(shp._id)}
                            style={{
                              cursor: "pointer",
                              background: isSelected
                                ? "hsl(214, 100%, 97%)"
                                : undefined,
                            }}
                          >
                            <td>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleShipment(shp._id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td>
                              <strong className="shp-tracking-link">
                                {shp.trackingId || shp.shipmentId || shp._id}
                              </strong>
                            </td>
                            <td>
                              <span style={{ fontSize: "12px" }}>
                                {shp.senderName || "—"} →{" "}
                                {shp.receiverName || "—"}
                              </span>
                            </td>
                            <td>
                              {shp.totalWeight ? `${shp.totalWeight} kg` : "—"}
                            </td>
                            <td>
                              <span
                                className={`shp-badge shp-badge--${getStatusTone(shp.status)}`}
                              >
                                {formatStatus(shp.status)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div
                    style={{
                      padding: "24px",
                      textAlign: "center",
                      color: "#94a3b8",
                      fontSize: "12px",
                    }}
                  >
                    No available created shipments found to attach.
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Schedule & Cost Summary */}
            <div style={{ marginBottom: "10px" }}>
              <h5 className="shp-section-title">
                4. Timestamps & Metrics Estimation
              </h5>
              <div className="shp-form-row">
                <div className="shp-form-group">
                  <label className="shp-label">
                    Planned Departure Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="shp-input"
                    value={scheduledDeparture}
                    onChange={(e) => setScheduledDeparture(e.target.value)}
                  />
                </div>
                <div className="shp-form-group">
                  <label className="shp-label">
                    Planned Arrival Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="shp-input"
                    value={scheduledArrival}
                    onChange={(e) => setScheduledArrival(e.target.value)}
                  />
                </div>
              </div>

              {/* Editable Distance & Cost Inputs */}
              <div className="shp-form-row" style={{ marginTop: "12px" }}>
                <div className="shp-form-group">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <label className="shp-label" style={{ margin: 0 }}>
                      Estimated Distance (km) *
                    </label>
                    {isDistanceLoading ? (
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Loader2 size={12} className="animate-spin" /> Fetching
                        route...
                      </span>
                    ) : (
                      sourceLabel && (
                        <span
                          style={{
                            fontSize: "10.5px",
                            color: "#475569",
                            fontWeight: 600,
                          }}
                        >
                          {sourceLabel}
                        </span>
                      )
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    required
                    className="shp-input"
                    value={plannedDistanceKm}
                    onChange={(e) => {
                      setIsManualDistance(true);
                      setPlannedDistanceKm(
                        e.target.value === "" ? "" : Number(e.target.value),
                      );
                    }}
                    placeholder="Enter estimated distance"
                  />
                </div>

                <div className="shp-form-group">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <label className="shp-label" style={{ margin: 0 }}>
                      Calculated Manifest Cost (₹) *
                    </label>
                    {isManualCost && (
                      <span
                        style={{
                          fontSize: "10.5px",
                          color: "#64748b",
                          fontStyle: "italic",
                        }}
                      >
                        (Manual cost override)
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    required
                    className="shp-input"
                    value={calculatedCost}
                    onChange={(e) => {
                      setIsManualCost(true);
                      setCalculatedCost(
                        e.target.value === "" ? "" : Number(e.target.value),
                      );
                    }}
                    placeholder="Enter manifest cost"
                  />
                </div>
              </div>

              {/* Metrics pill summary */}
              <div
                style={{
                  background: "hsl(214, 100%, 97%)",
                  border: "1px solid hsl(214, 90%, 85%)",
                  borderRadius: "var(--radius)",
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginTop: "12px",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#1e3a8a",
                      textTransform: "uppercase",
                      fontWeight: 700,
                    }}
                  >
                    Estimated Distance
                  </span>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "#1e293b",
                    }}
                  >
                    {plannedDistanceKm || 0} km
                  </div>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#1e3a8a",
                      textTransform: "uppercase",
                      fontWeight: 700,
                    }}
                  >
                    Attached Shipments
                  </span>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "#1e293b",
                    }}
                  >
                    {selectedShipmentIds.length} Packages
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#1e3a8a",
                      textTransform: "uppercase",
                      fontWeight: 700,
                    }}
                  >
                    Total Manifest Cost
                  </span>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 800,
                      color: "#2563eb",
                    }}
                  >
                    ₹{Number(calculatedCost || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="shp-modal__footer">
            <button
              type="button"
              className="shp-btn shp-btn--ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="shp-btn shp-btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creating Manifest...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Dispatch & Create Trip</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   2. TRIP DETAILS MODAL (Matching DashboardShipment Details Modal)
   ========================================================================== */
function TripDetailsModal({
  isOpen,
  onClose,
  trip,
  onTransitionStatus,
  onDepartTrip,
  onArriveTrip,
  driversMap = {},
  vehiclesMap = {},
}) {
  if (!isOpen || !trip) return null;

  // Resolve Driver Details
  const driverName =
    trip.driverId?.userId?.name ||
    trip.driverId?.name ||
    driversMap[trip.driverId]?.name ||
    "Unassigned Driver";
  const driverPhone =
    trip.driverId?.userId?.phone ||
    trip.driverId?.phonenumber ||
    driversMap[trip.driverId]?.phone ||
    "—";

  // Resolve Vehicle Details
  const vehicleReg =
    trip.vehicleId?.vregistrationnumber ||
    trip.vehicleId?.registrationNumber ||
    vehiclesMap[trip.vehicleId]?.vregistrationnumber ||
    "Unassigned Vehicle";
  const vehicleModel =
    trip.vehicleId?.vmodel ||
    trip.vehicleId?.model ||
    vehiclesMap[trip.vehicleId]?.vmodel ||
    "";
  const vehicleType =
    trip.vehicleId?.vtype || vehiclesMap[trip.vehicleId]?.vtype || "";
  const vehicleCap =
    trip.vehicleId?.vcapacity || vehiclesMap[trip.vehicleId]?.vcapacity || null;

  return (
    <div className="shp-modal-overlay">
      <div className="shp-modal shp-modal--lg">
        {/* Header */}
        <div className="shp-modal__header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 className="shp-modal__title font-mono">
                {trip.tripId || trip._id}
              </h3>
              <span
                className={`shp-badge shp-badge--${getStatusTone(trip.status)}`}
              >
                {formatStatus(trip.status)}
              </span>
            </div>
            <p className="shp-modal__subtitle">
              Manifest created on {formatDate(trip.createdAt)}
            </p>
          </div>
          <button
            type="button"
            className="shp-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="shp-modal__body" style={{ maxHeight: "65vh" }}>
          {/* Route Breakdown */}
          <div style={{ marginBottom: "20px" }}>
            <h5 className="shp-section-title">
              Route Breakdown & Transit Points
            </h5>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                overflowX: "auto",
              }}
            >
              {/* Origin */}
              <div style={{ textAlign: "center", minWidth: "100px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#2563eb",
                    color: "#ffffff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    margin: "0 auto 4px",
                  }}
                >
                  A
                </div>
                <strong
                  style={{
                    fontSize: "12.5px",
                    color: "#000000",
                    display: "block",
                  }}
                >
                  {trip.origin}
                </strong>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  Origin Hub
                </span>
              </div>

              {/* Stops */}
              {trip.stops &&
                trip.stops.map((stop, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        height: "2px",
                        width: "40px",
                        background: "#cbd5e1",
                      }}
                    ></div>
                    <div style={{ textAlign: "center", minWidth: "90px" }}>
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: "#f59e0b",
                          color: "#ffffff",
                          display: "grid",
                          placeItems: "center",
                          fontSize: "11px",
                          fontWeight: 700,
                          margin: "0 auto 4px",
                        }}
                      >
                        {stop.stopOrder || i + 1}
                      </div>
                      <strong
                        style={{
                          fontSize: "12px",
                          color: "#334155",
                          display: "block",
                        }}
                      >
                        {stop.location || stop}
                      </strong>
                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                        Transit Stop
                      </span>
                    </div>
                  </div>
                ))}

              <div
                style={{ height: "2px", width: "40px", background: "#cbd5e1" }}
              ></div>

              {/* Destination */}
              <div style={{ textAlign: "center", minWidth: "100px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#10b981",
                    color: "#ffffff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    margin: "0 auto 4px",
                  }}
                >
                  B
                </div>
                <strong
                  style={{
                    fontSize: "12.5px",
                    color: "#000000",
                    display: "block",
                  }}
                >
                  {trip.destination}
                </strong>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  Destination Hub
                </span>
              </div>
            </div>
          </div>

          {/* Driver & Vehicle Allocation Cards */}
          <div className="shp-form-row" style={{ marginBottom: "20px" }}>
            <div
              style={{
                flex: 1,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "6px",
                }}
              >
                <Phone size={14} className="text-gray-400" />
                <span
                  style={{
                    fontSize: "11.5px",
                    color: "#64748b",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  Assigned Driver
                </span>
              </div>
              <strong
                style={{ fontSize: "14px", color: "#000000", display: "block" }}
              >
                {driverName}
              </strong>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                📞 {driverPhone}
              </span>
            </div>

            <div
              style={{
                flex: 1,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "6px",
                }}
              >
                <Truck size={14} className="text-gray-400" />
                <span
                  style={{
                    fontSize: "11.5px",
                    color: "#64748b",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  Assigned Vehicle
                </span>
              </div>
              <strong
                style={{ fontSize: "14px", color: "#000000", display: "block" }}
              >
                {vehicleReg}
              </strong>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                {vehicleModel} {vehicleType ? `• ${vehicleType}` : ""}{" "}
                {vehicleCap ? `(${vehicleCap} kg)` : ""}
              </span>
            </div>
          </div>

          {/* Consolidated Shipments */}
          <div style={{ marginBottom: "20px" }}>
            <h5 className="shp-section-title">
              Consolidated Shipments ({trip.shipmentIds?.length || 0} Packages)
            </h5>
            <div
              className="shp-table-wrap shp-table-wrap--sm"
              style={{
                maxHeight: "200px",
                overflowY: "auto",
                border: "1px solid var(--border)",
              }}
            >
              <table className="shp-table">
                <thead>
                  <tr>
                    <th>Tracking #</th>
                    <th>Sender & Receiver</th>
                    <th>Weight</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trip.shipmentIds && trip.shipmentIds.length > 0 ? (
                    trip.shipmentIds.map((shp, idx) => {
                      const isObj = typeof shp === "object" && shp !== null;
                      const tracking = isObj
                        ? shp.trackingId || shp.shipmentId || shp._id
                        : shp;
                      const sender = isObj ? shp.senderName || "" : "";
                      const receiver = isObj ? shp.receiverName || "" : "";
                      const weight = isObj
                        ? shp.totalWeight
                          ? `${shp.totalWeight} kg`
                          : "—"
                        : "—";
                      const status = isObj ? shp.status : "";

                      return (
                        <tr key={idx}>
                          <td>
                            <strong className="shp-tracking-link">
                              {tracking}
                            </strong>
                          </td>
                          <td>
                            <span style={{ fontSize: "12px" }}>
                              {sender ? sender : "—"} →{" "}
                              {receiver ? receiver : "—"}
                            </span>
                          </td>
                          <td>{weight}</td>
                          <td>
                            {status && (
                              <span
                                className={`shp-badge shp-badge--${getStatusTone(status)}`}
                              >
                                {formatStatus(status)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        style={{ textAlign: "center", color: "#94a3b8" }}
                      >
                        No attached shipments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Schedule & Financials */}
          <div className="shp-form-row">
            <div
              style={{
                flex: 1,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "14px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: "#64748b",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                Timestamps Breakdown
              </span>
              <div
                style={{ marginTop: "6px", fontSize: "12px", spaceY: "4px" }}
              >
                <div>
                  <span style={{ color: "#64748b" }}>Planned Dep: </span>
                  <strong>{formatDate(trip.plannedDeparture)}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Planned Arr: </span>
                  <strong>{formatDate(trip.plannedArrival)}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Actual Dep: </span>
                  <strong
                    style={{
                      color: trip.actualDeparture ? "#10b981" : "#64748b",
                    }}
                  >
                    {formatDate(trip.actualDeparture)}
                  </strong>
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Actual Arr: </span>
                  <strong
                    style={{
                      color: trip.actualArrival ? "#10b981" : "#64748b",
                    }}
                  >
                    {formatDate(trip.actualArrival)}
                  </strong>
                </div>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                background: "hsl(214, 100%, 97%)",
                border: "1px solid hsl(214, 90%, 85%)",
                borderRadius: "var(--radius)",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#1e3a8a",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  Planned Distance
                </span>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "#1e293b",
                  }}
                >
                  {trip.plannedDistance || 0} km
                </div>
              </div>

              <div style={{ marginTop: "10px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#1e3a8a",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  Manifest Total Cost
                </span>
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    color: "#2563eb",
                  }}
                >
                  ₹{(trip.tripCost || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Lifecycle Transition Actions */}
        <div className="shp-modal__footer">
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span
              style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}
            >
              Lifecycle Action:
            </span>
            {trip.status === "planned" && (
              <button
                type="button"
                className="shp-btn shp-btn--secondary shp-btn--sm"
                onClick={() => onTransitionStatus(trip, "dispatched")}
              >
                <Navigation size={13} />
                Dispatch Trip
              </button>
            )}
            {trip.status === "dispatched" && (
              <button
                type="button"
                className="shp-btn shp-btn--primary shp-btn--sm"
                onClick={() => onDepartTrip(trip)}
              >
                <Play size={13} />
                Depart Trip (In Transit)
              </button>
            )}
            {trip.status === "in_transit" && (
              <button
                type="button"
                className="shp-btn shp-btn--secondary shp-btn--sm"
                onClick={() => onArriveTrip(trip)}
              >
                <MapPin size={13} />
                Record Arrival
              </button>
            )}
            {trip.status === "arrived" && (
              <button
                type="button"
                className="shp-btn shp-btn--primary shp-btn--sm"
                onClick={() => onTransitionStatus(trip, "completed")}
              >
                <CheckCircle size={13} />
                Complete Trip
              </button>
            )}
            {trip.status !== "completed" && trip.status !== "cancelled" && (
              <button
                type="button"
                className="shp-btn shp-btn--danger shp-btn--sm"
                onClick={() => onTransitionStatus(trip, "cancelled")}
              >
                Cancel Manifest
              </button>
            )}
          </div>
          <button
            type="button"
            className="shp-btn shp-btn--ghost"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   3. MAIN DASHBOARD TRIP COMPONENT (Matching DashboardShipment UI Structure)
   ========================================================================== */
export default function DashboardTrip() {
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filters & State
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);

  // Toast feedback notification
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const navi = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navi("/login");
    }
  }, [token, navi]);

  // Lookup dictionaries
  const driversMap = useMemo(() => {
    const map = {};
    drivers.forEach((d) => {
      map[d._id] = {
        name: d.userId?.name || d.name || "Driver",
        phone: d.userId?.phone || d.phonenumber || "—",
      };
    });
    return map;
  }, [drivers]);

  const vehiclesMap = useMemo(() => {
    const map = {};
    vehicles.forEach((v) => {
      map[v._id] = {
        vregistrationnumber:
          v.vregistrationnumber || v.registrationNumber || "",
        vmodel: v.vmodel || v.model || "",
        vtype: v.vtype || v.type || "",
        vcapacity: v.vcapacity || 0,
      };
    });
    return map;
  }, [vehicles]);

  const shipmentsMap = useMemo(() => {
    const map = {};
    shipments.forEach((s) => {
      if (s._id) map[s._id] = s;
      if (s.shipmentId) map[s.shipmentId] = s;
      if (s.trackingId) map[s.trackingId] = s;
    });
    return map;
  }, [shipments]);

  // Available shipments for trip creation (only shipments with status 'created')
  const availableShipments = useMemo(() => {
    const activeAssignedIds = new Set();
    trips.forEach((t) => {
      if (t.status !== "completed" && t.status !== "cancelled") {
        (t.shipmentIds || []).forEach((s) => {
          const id = typeof s === "object" && s !== null ? s._id : s;
          if (id) activeAssignedIds.add(id.toString());
        });
      }
    });

    return shipments.filter((shp) => {
      if (activeAssignedIds.has(shp._id?.toString())) return false;
      const status = (shp.status || "").toLowerCase();
      return status === "created";
    });
  }, [shipments, trips]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const headers = getAuthHeaders();

      // Trips
      const tripsRes = await fetch(`${API_BASE_URL}/trip`, { headers });
      if (tripsRes.ok) {
        const data = await tripsRes.json();
        setTrips(data.getTrip || []);
      } else {
        const errData = await tripsRes.json();
        setFetchError(errData.message || "Failed to load trips");
      }

      // Drivers
      const driversRes = await fetch(`${API_BASE_URL}/drivers`, { headers });
      if (driversRes.ok) {
        const data = await driversRes.json();
        setDrivers(data.drivers || []);
      }

      // Vehicles
      const vehiclesRes = await fetch(`${API_BASE_URL}/vechile`, { headers });
      if (vehiclesRes.ok) {
        const data = await vehiclesRes.json();
        setVehicles(Array.isArray(data) ? data : []);
      }

      // Shipments
      const shipmentsRes = await fetch(`${API_BASE_URL}/shipments?limit=1000`, {
        headers,
      });
      if (shipmentsRes.ok) {
        const data = await shipmentsRes.json();
        setShipments(data.shipments || []);
      }
    } catch {
      setFetchError("Network error — could not reach backend API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = trips.length;
    const planned = trips.filter((t) => t.status === "planned").length;
    const dispatched = trips.filter((t) => t.status === "dispatched").length;
    const inTransit = trips.filter((t) => t.status === "in_transit").length;
    const arrived = trips.filter((t) => t.status === "arrived").length;
    const active = dispatched + inTransit + arrived;
    const completed = trips.filter((t) => t.status === "completed").length;
    const cancelled = trips.filter((t) => t.status === "cancelled").length;
    return {
      total,
      planned,
      dispatched,
      inTransit,
      arrived,
      active,
      completed,
      cancelled,
    };
  }, [trips]);

  // Handlers
  const handleCreateTrip = async (payload) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/trip`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create trip manifest");
      }

      showToast(`Trip ${data.trip?.tripId || ""} created successfully!`);
      setIsCreateOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.message || "Error creating trip", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransitionStatus = async (trip, targetStatus) => {
    try {
      const tripId = trip._id || trip.tripId;
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: targetStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        let msg =
          data.message || `Failed to transition status to ${targetStatus}`;
        if (data.notReadyShipments && data.notReadyShipments.length > 0) {
          msg += ` (${data.notReadyShipments.length} shipment(s) not ready at warehouse)`;
        }
        throw new Error(msg);
      }

      showToast(data.message || `Trip status updated to ${targetStatus}!`);
      fetchData();
      if (selectedDetails && selectedDetails._id === trip._id) {
        setSelectedDetails((prev) =>
          prev ? { ...prev, status: targetStatus } : null,
        );
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDepartTrip = async (trip) => {
    try {
      const tripId = trip._id || trip.tripId;
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}/depart`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to record departure");

      showToast(data.message || "Trip departed successfully!");
      fetchData();
      if (selectedDetails && selectedDetails._id === trip._id) {
        setSelectedDetails((prev) =>
          prev
            ? {
                ...prev,
                status: "in_transit",
                actualDeparture:
                  data.actualDeparture || new Date().toISOString(),
              }
            : null,
        );
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleArriveTrip = async (trip) => {
    try {
      const tripId = trip._id || trip.tripId;
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}/arrive`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to record arrival");

      showToast(data.message || "Trip marked as arrived!");
      fetchData();
      if (selectedDetails && selectedDetails._id === trip._id) {
        setSelectedDetails((prev) =>
          prev
            ? {
                ...prev,
                status: "arrived",
                actualArrival: data.actualArrival || new Date().toISOString(),
              }
            : null,
        );
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Trip ID",
      "Shipment ID (SHP)",
      "Origin",
      "Destination",
      "Stops",
      "Driver",
      "Vehicle",
      "Distance (km)",
      "Cost (INR)",
      "Status",
      "Planned Departure",
      "Planned Arrival",
      "Actual Departure",
      "Actual Arrival",
    ];

    const rows = filteredTrips.map((t) => {
      const driverName =
        t.driverId?.userId?.name ||
        t.driverId?.name ||
        driversMap[t.driverId]?.name ||
        "Unassigned";
      const vehicleReg =
        t.vehicleId?.vregistrationnumber ||
        t.vehicleId?.registrationNumber ||
        vehiclesMap[t.vehicleId]?.vregistrationnumber ||
        "Unassigned";
      const stopsStr = (t.stops || []).map((s) => s.location || s).join("; ");
      const shpIdsStr = (t.shipmentIds || [])
        .map((s) => {
          if (typeof s === "object" && s !== null) {
            return s.shipmentId || s.trackingId || s._id;
          }
          const found = shipmentsMap[s];
          return found ? found.shipmentId || found.trackingId || found._id : s;
        })
        .join("; ");

      return [
        t.tripId || t._id,
        `"${shpIdsStr}"`,
        t.origin,
        t.destination,
        stopsStr,
        driverName,
        vehicleReg,
        t.plannedDistance || 0,
        t.tripCost || 0,
        t.status,
        t.plannedDeparture ? formatDate(t.plannedDeparture) : "",
        t.plannedArrival ? formatDate(t.plannedArrival) : "",
        t.actualDeparture ? formatDate(t.actualDeparture) : "",
        t.actualArrival ? formatDate(t.actualArrival) : "",
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trip_manifests_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredTrips.length} trip manifests to CSV.`);
  };

  // Filter & Search Logic
  const filteredTrips = useMemo(() => {
    return trips
      .filter((trip) => {
        // Tab Filter
        if (activeTab === "planned" && trip.status !== "planned") return false;
        if (activeTab === "dispatched" && trip.status !== "dispatched")
          return false;
        if (activeTab === "in_transit" && trip.status !== "in_transit")
          return false;
        if (activeTab === "arrived" && trip.status !== "arrived") return false;
        if (activeTab === "completed" && trip.status !== "completed")
          return false;
        if (activeTab === "cancelled" && trip.status !== "cancelled")
          return false;

        // Status Select Filter
        if (statusFilter !== "All" && trip.status !== statusFilter)
          return false;

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const tripCode = (trip.tripId || trip._id || "").toLowerCase();
          const driverName = (
            trip.driverId?.userId?.name ||
            trip.driverId?.name ||
            driversMap[trip.driverId]?.name ||
            ""
          ).toLowerCase();
          const vehicleReg = (
            trip.vehicleId?.vregistrationnumber ||
            trip.vehicleId?.registrationNumber ||
            vehiclesMap[trip.vehicleId]?.vregistrationnumber ||
            ""
          ).toLowerCase();
          const origin = (trip.origin || "").toLowerCase();
          const destination = (trip.destination || "").toLowerCase();

          const shipmentIdsStr = (trip.shipmentIds || [])
            .map((s) => {
              if (typeof s === "object" && s !== null) {
                return s.shipmentId || s.trackingId || s._id || "";
              }
              const found = shipmentsMap[s];
              return found
                ? found.shipmentId || found.trackingId || found._id || ""
                : s || "";
            })
            .join(" ")
            .toLowerCase();

          return (
            tripCode.includes(q) ||
            driverName.includes(q) ||
            vehicleReg.includes(q) ||
            origin.includes(q) ||
            destination.includes(q) ||
            shipmentIdsStr.includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }
        if (sortBy === "cost") {
          return (b.tripCost || 0) - (a.tripCost || 0);
        }
        if (sortBy === "distance") {
          return (b.plannedDistance || 0) - (a.plannedDistance || 0);
        }
        return 0;
      });
  }, [
    trips,
    activeTab,
    statusFilter,
    searchQuery,
    sortBy,
    driversMap,
    vehiclesMap,
    shipmentsMap,
  ]);

  // Pagination Calculations
  const filterKey = `${activeTab}|${statusFilter}|${searchQuery}|${sortBy}|${pageSize}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filteredTrips.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredTrips.length);
  const displayedTrips = useMemo(() => {
    return filteredTrips.slice(startIndex, endIndex);
  }, [filteredTrips, startIndex, endIndex]);

  const getPageNumbers = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
    if (current >= total - 3)
      return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "...", current - 1, current, current + 1, "...", total];
  };

  return (
    <div className="shp-container">
      {/* Toast Notification Matching DashboardShipment */}
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

      {/* Top Header & Metrics Banner */}
      <div className="shp-header">
        <div>
          <h2 className="shp-title">Trip Management</h2>
          <p className="shp-subtitle">
            Track, dispatch, manage manifests and update real-time status across
            the logistics network.
          </p>
        </div>
        <div className="shp-header__actions">
          <button
            type="button"
            className="shp-btn shp-btn--ghost"
            onClick={async () => {
              await fetchData();
              showToast("Trip records refreshed");
            }}
            title="Refresh"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            type="button"
            className="shp-btn shp-btn--ghost"
            onClick={handleExportCSV}
          >
            <FileSpreadsheet size={14} />
            Export CSV
          </button>
          <button
            type="button"
            className="shp-btn shp-btn--primary"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus size={16} />
            Create Trip
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="shp-kpi-grid">
        <div
          className="shp-kpi-card"
          onClick={() => setActiveTab("All")}
          style={{ cursor: "pointer" }}
        >
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon">
              <Package size={16} />
            </span>
            <span className="shp-kpi-card__title">Total Trips</span>
          </div>
          <div className="shp-kpi-card__value">{stats.total}</div>
          <div className="shp-kpi-card__foot">All created manifests</div>
        </div>

        <div
          className="shp-kpi-card"
          onClick={() => setActiveTab("planned")}
          style={{ cursor: "pointer" }}
        >
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--warning">
              <Clock size={16} />
            </span>
            <span className="shp-kpi-card__title">Planned / Scheduled</span>
          </div>
          <div className="shp-kpi-card__value">{stats.planned}</div>
          <div className="shp-kpi-card__foot">Awaiting dispatch</div>
        </div>

        <div
          className="shp-kpi-card"
          onClick={() => setActiveTab("in_transit")}
          style={{ cursor: "pointer" }}
        >
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--info">
              <Truck size={16} />
            </span>
            <span className="shp-kpi-card__title">In Transit & Delivery</span>
          </div>
          <div className="shp-kpi-card__value">{stats.active}</div>
          <div className="shp-kpi-card__foot">Dispatched, transit, arrived</div>
        </div>

        <div
          className="shp-kpi-card"
          onClick={() => setActiveTab("completed")}
          style={{ cursor: "pointer" }}
        >
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--success">
              <CheckCircle2 size={16} />
            </span>
            <span className="shp-kpi-card__title">Completed</span>
          </div>
          <div className="shp-kpi-card__value">{stats.completed}</div>
          <div className="shp-kpi-card__foot">Completed with POD</div>
        </div>

        <div
          className="shp-kpi-card"
          onClick={() => setActiveTab("cancelled")}
          style={{ cursor: "pointer" }}
        >
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--danger">
              <AlertTriangle size={16} />
            </span>
            <span className="shp-kpi-card__title">Failed / Cancelled</span>
          </div>
          <div className="shp-kpi-card__value">{stats.cancelled}</div>
          <div className="shp-kpi-card__foot">Action required</div>
        </div>
      </div>

      {/* Filter & Control Bar */}
      <div className="shp-control-bar">
        <div className="shp-tabs">
          {[
            { key: "All", label: "All Trips", count: stats.total },
            { key: "planned", label: "Planned", count: stats.planned },
            { key: "dispatched", label: "Dispatched", count: stats.dispatched },
            { key: "in_transit", label: "In Transit", count: stats.inTransit },
            { key: "arrived", label: "Arrived", count: stats.arrived },
            { key: "completed", label: "Completed", count: stats.completed },
            { key: "cancelled", label: "Cancelled", count: stats.cancelled },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`shp-tab ${activeTab === tab.key ? "shp-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
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
              placeholder="Search trip, driver, vehicle, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            className="shp-select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">Status: All</option>
            <option value="planned">Planned</option>
            <option value="dispatched">Dispatched</option>
            <option value="in_transit">In Transit</option>
            <option value="arrived">Arrived</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            className="shp-select-filter"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="cost">Sort: Highest Cost</option>
            <option value="distance">Sort: Longest Distance</option>
          </select>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="shp-table-card">
        {/* Loading state */}
        {loading && (
          <div className="shp-empty-state">
            <Loader2 size={24} className="animate-spin text-blue-600 mb-2" />
            <p className="shp-empty-state__title">
              Loading trips from server...
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && fetchError && (
          <div
            className="shp-alert shp-alert--danger"
            style={{ margin: "16px" }}
          >
            <strong>Error:</strong> {fetchError} —{" "}
            <button
              type="button"
              className="shp-btn shp-btn--ghost shp-btn--sm"
              onClick={fetchData}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !fetchError && filteredTrips.length === 0 && (
          <div className="shp-empty-state">
            <p className="shp-empty-state__title">No trip manifests found</p>
            <p className="shp-empty-state__text">
              Try adjusting your filter criteria or create a new trip manifest.
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && !fetchError && filteredTrips.length > 0 && (
          <div className="shp-table-wrap">
            <table className="shp-table">
              <thead>
                <tr>
                  <th>Trip #</th>
                  <th>Shipment ID (SHP)</th>
                  <th>Driver / Fleet</th>
                  <th>Origin → Destination</th>
                  <th>Consolidated Shipments</th>
                  <th>Distance & Cost</th>
                  <th>Schedule Window</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedTrips.map((trip) => {
                  const driverName =
                    trip.driverId?.userId?.name ||
                    trip.driverId?.name ||
                    driversMap[trip.driverId]?.name ||
                    "Unassigned Driver";
                  const vehicleReg =
                    trip.vehicleId?.vregistrationnumber ||
                    trip.vehicleId?.registrationNumber ||
                    vehiclesMap[trip.vehicleId]?.vregistrationnumber ||
                    "Unassigned";

                  return (
                    <tr key={trip._id} className="shp-table__row">
                      {/* Trip # */}
                      <td>
                        <button
                          type="button"
                          className="shp-tracking-link font-mono"
                          onClick={() => setSelectedDetails(trip)}
                        >
                          {trip.tripId || trip._id.slice(-8)}
                        </button>
                        <span className="shp-cell-sub">
                          {formatDate(trip.createdAt)}
                        </span>
                      </td>

                      {/* Shipment ID (SHP) */}
                      <td>
                        {(() => {
                          const shpList = (trip.shipmentIds || []).map(
                            (shp) => {
                              if (typeof shp === "object" && shp !== null) {
                                return (
                                  shp.shipmentId || shp.trackingId || shp._id
                                );
                              }
                              const found = shipmentsMap[shp];
                              return found
                                ? found.shipmentId ||
                                    found.trackingId ||
                                    found._id
                                : shp;
                            },
                          );

                          if (shpList.length === 0) {
                            return <span style={{ color: "#94a3b8" }}>—</span>;
                          }

                          return (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "2px",
                              }}
                            >
                              {shpList.map((id, idx) => (
                                <span
                                  key={idx}
                                  className="shp-tracking-link font-mono"
                                  style={{ fontSize: "12px" }}
                                >
                                  {id}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Driver / Fleet */}
                      <td>
                        <p className="shp-cell-title">{driverName}</p>
                        <span className="shp-cell-sub">{vehicleReg}</span>
                      </td>

                      {/* Origin -> Destination */}
                      <td>
                        <div className="shp-route-flow">
                          <span className="shp-route-city">{trip.origin}</span>
                          <span className="shp-route-arrow">
                            <ArrowRight size={13} />
                          </span>
                          <span className="shp-route-city">
                            {trip.destination}
                          </span>
                        </div>
                        <span className="shp-cell-sub">
                          {trip.stops && trip.stops.length > 0
                            ? `Via: ${trip.stops.map((s) => s.location || s).join(", ")}`
                            : "Direct Route"}
                        </span>
                      </td>

                      {/* Consolidated Shipments */}
                      <td>
                        <p className="shp-cell-title">
                          {trip.shipmentIds?.length || 0} Package(s)
                        </p>
                        <span className="shp-cell-sub">Bundled Cargo</span>
                      </td>

                      {/* Distance & Cost */}
                      <td>
                        <p className="shp-cell-title">
                          ₹{(trip.tripCost || 0).toLocaleString()}
                        </p>
                        <span className="shp-cell-sub">
                          {trip.plannedDistance || 0} km planned
                        </span>
                      </td>

                      {/* Schedule Window */}
                      <td>
                        <p className="shp-cell-title">
                          {formatDate(
                            trip.actualDeparture || trip.plannedDeparture,
                          )}
                        </p>
                        <span className="shp-cell-sub">
                          Arr:{" "}
                          {formatDate(
                            trip.actualArrival || trip.plannedArrival,
                          )}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`shp-badge shp-badge--${getStatusTone(trip.status)}`}
                        >
                          {formatStatus(trip.status)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "right" }}>
                        <div className="shp-action-btns">
                          {/* Quick Lifecycle Button */}
                          {trip.status === "planned" && (
                            <button
                              type="button"
                              className="shp-btn shp-btn--secondary shp-btn--sm"
                              style={{
                                padding: "3px 8px",
                                fontSize: "11px",
                                height: "26px",
                              }}
                              title="Dispatch Trip"
                              onClick={() =>
                                handleTransitionStatus(trip, "dispatched")
                              }
                            >
                              <Navigation size={12} />
                              Dispatch
                            </button>
                          )}

                          {trip.status === "dispatched" && (
                            <button
                              type="button"
                              className="shp-btn shp-btn--primary shp-btn--sm"
                              style={{
                                padding: "3px 8px",
                                fontSize: "11px",
                                height: "26px",
                              }}
                              title="Record Departure"
                              onClick={() => handleDepartTrip(trip)}
                            >
                              <Play size={12} />
                              Depart
                            </button>
                          )}

                          {trip.status === "in_transit" && (
                            <button
                              type="button"
                              className="shp-btn shp-btn--secondary shp-btn--sm"
                              style={{
                                padding: "3px 8px",
                                fontSize: "11px",
                                height: "26px",
                              }}
                              title="Record Arrival"
                              onClick={() => handleArriveTrip(trip)}
                            >
                              <MapPin size={12} />
                              Arrive
                            </button>
                          )}

                          {trip.status === "arrived" && (
                            <button
                              type="button"
                              className="shp-btn shp-btn--primary shp-btn--sm"
                              style={{
                                padding: "3px 8px",
                                fontSize: "11px",
                                height: "26px",
                              }}
                              title="Complete Trip"
                              onClick={() =>
                                handleTransitionStatus(trip, "completed")
                              }
                            >
                              <CheckCircle size={12} />
                              Complete
                            </button>
                          )}

                          {/* View details */}
                          <button
                            type="button"
                            className="shp-icon-btn"
                            title="View Details"
                            onClick={() => setSelectedDetails(trip)}
                          >
                            <Eye size={15} />
                          </button>

                          {/* Cancel */}
                          {trip.status !== "completed" &&
                            trip.status !== "cancelled" && (
                              <button
                                type="button"
                                className="shp-icon-btn shp-icon-btn--danger"
                                title="Cancel Manifest"
                                onClick={() =>
                                  handleTransitionStatus(trip, "cancelled")
                                }
                              >
                                <X size={14} />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer with Pagination */}
        <div className="shp-table-footer">
          <div className="shp-pagination-info">
            {filteredTrips.length === 0 ? (
              <span>No trips to display</span>
            ) : (
              <span>
                Showing <strong>{startIndex + 1}</strong>–
                <strong>{endIndex}</strong> of{" "}
                <strong>{filteredTrips.length}</strong> trips
                {filteredTrips.length !== trips.length && (
                  <span className="shp-pagination-total-hint">
                    {" "}
                    (filtered from {trips.length} total)
                  </span>
                )}
              </span>
            )}
          </div>

          {filteredTrips.length > 0 && (
            <div className="shp-pagination-controls">
              <div className="shp-pagination-size">
                <label htmlFor="shp-trip-page-size">Rows per page:</label>
                <select
                  id="shp-trip-page-size"
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
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} />
                </button>

                <div className="shp-pagination-pages">
                  {getPageNumbers(safeCurrentPage, totalPages).map((p, i) =>
                    p === "..." ? (
                      <span key={i} className="shp-pagination-ellipsis">
                        …
                      </span>
                    ) : (
                      <button
                        key={i}
                        type="button"
                        className={`shp-pagination-btn ${
                          safeCurrentPage === p
                            ? "shp-pagination-btn--active"
                            : ""
                        }`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
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
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                >
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

      {/* Create Trip Modal */}
      <CreateTripModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateTrip}
        drivers={drivers}
        vehicles={vehicles}
        availableShipments={availableShipments}
        isSubmitting={submitting}
      />

      {/* Trip Details Modal */}
      <TripDetailsModal
        isOpen={!!selectedDetails}
        onClose={() => setSelectedDetails(null)}
        trip={selectedDetails}
        onTransitionStatus={handleTransitionStatus}
        onDepartTrip={handleDepartTrip}
        onArriveTrip={handleArriveTrip}
        driversMap={driversMap}
        vehiclesMap={vehiclesMap}
      />
    </div>
  );
}
