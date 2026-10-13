import "../../styles/WarehouseSacn.css";
import "../../styles/DriverDas.css";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import {
  Package,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Truck,
  Copy,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Box,
  ChevronDown,
  RefreshCw,
  ScanLine,
  X,
  Loader2,
} from "lucide-react";

// ── Status config (same as DriverDashboard) ────────────────────────────────
const STATUS_CONFIG = {
  created: { label: "Created", className: "drv-status--created" },
  pickup_scheduled: {
    label: "Pickup Scheduled",
    className: "drv-status--pickup_scheduled",
  },
  picked_up: { label: "Picked Up", className: "drv-status--picked_up" },
  at_warehouse: {
    label: "At Warehouse",
    className: "drv-status--at_warehouse",
  },
  dispatched: { label: "Dispatched", className: "drv-status--dispatched" },
  in_transit: { label: "In Transit", className: "drv-status--in_transit" },
  out_for_delivery: {
    label: "Out for Delivery",
    className: "drv-status--out_for_delivery",
  },
  delivered: { label: "Delivered", className: "drv-status--delivered" },
  failed_delivery: {
    label: "Failed Delivery",
    className: "drv-status--failed_delivery",
  },
};

// ── Date formatter (same as DriverDashboard formatETA) ─────────────────────
const formatDate = (val) => {
  if (!val) return "Not specified";
  if (typeof val !== "string") return String(val);

  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;

    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow =
      d.getDate() === tomorrow.getDate() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getFullYear() === tomorrow.getFullYear();

    const timeStr = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    if (isToday) return `Today, ${timeStr}`;
    if (isTomorrow) return `Tomorrow, ${timeStr}`;

    const dateStr = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${dateStr}, ${timeStr}`;
  } catch {
    return val;
  }
};

// ── Vehicle, Trip & Driver formatters ──────────────────────────────────────
const getVehicleInfo = (v, trip) => {
  const vehicle =
    v && typeof v === "object"
      ? v
      : trip?.vehicleId && typeof trip.vehicleId === "object"
        ? trip.vehicleId
        : null;

  if (!vehicle) {
    if (typeof v === "string" && !/^[0-9a-fA-F]{24}$/.test(v.trim())) {
      return { name: "", regNo: v, display: v };
    }
    return { name: "", regNo: "", display: "N/A" };
  }

  const name =
    vehicle.vmodel || vehicle.model || vehicle.vtype || vehicle.type || "";
  const regNo =
    vehicle.vregistrationnumber ||
    vehicle.registrationNumber ||
    vehicle.regNumber ||
    vehicle.vregnumber ||
    "";

  let display = "N/A";
  if (name && regNo) {
    display = `${name} (${regNo})`;
  } else if (name) {
    display = name;
  } else if (regNo) {
    display = regNo;
  }
  return { name, regNo, display };
};

const getTripInfo = (t) => {
  if (!t) return { tripId: "N/A", display: "N/A" };
  if (typeof t === "object") {
    const tripId =
      t.tripId ||
      t.tripNumber ||
      (t._id && !/^[0-9a-fA-F]{24}$/.test(t._id) ? t._id : "N/A");
    return { tripId: tripId || "N/A", display: tripId || "N/A" };
  }
  if (typeof t === "string" && !/^[0-9a-fA-F]{24}$/.test(t.trim())) {
    return { tripId: t, display: t };
  }
  return { tripId: "N/A", display: "N/A" };
};

const getDriverInfo = (d, trip) => {
  const driver =
    d && typeof d === "object"
      ? d
      : trip?.driverId && typeof trip.driverId === "object"
        ? trip.driverId
        : null;

  if (!driver) {
    if (typeof d === "string" && !/^[0-9a-fA-F]{24}$/.test(d.trim())) {
      return { driverId: "", name: d, display: d };
    }
    return { driverId: "", name: "", display: "N/A" };
  }

  const driverId = driver.driverId || driver.id || "";
  const name =
    driver.userId?.name ||
    driver.name ||
    driver.driverName ||
    driver.userName ||
    "";

  let display = "N/A";
  if (driverId && name) {
    display = `${driverId} - ${name}`;
  } else if (driverId) {
    display = driverId;
  } else if (name) {
    display = name;
  }
  return { driverId, name, display };
};

// ═══════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function WarehouseScan() {
  const { trackingId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [noti, setNoti] = useState(null);
  const [shipmentData, setShipmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ── Copy to clipboard ────────────────────────────────────────────────────
  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    showToast(`Copied ${text}`, "info");
  };

  // ── Fetch shipment (BACKEND UNCHANGED) ───────────────────────────────────
  const fetchShipmentDate = async () => {
    setLoading(true);
    setNoti(null);
    try {
      const res = await fetch(
        `http://localhost:5000/warehouse-scane/${trackingId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setNoti(data.message || "Failed to fetch shipment");
        setShipmentData(null);
        return;
      }

      setShipmentData(data.findshipment);
    } catch (error) {
      setNoti(error instanceof Error ? error.message : "Something went wrong");
      setShipmentData(null);
    } finally {
      setLoading(false);
    }
  };

  // ── Update shipment status ───────────────────────────────────────────────
  const handleStatusUpdate = async (newStatus) => {
    if (!shipmentData?._id) return;
    setStatusUpdating(true);
    try {
      const res = await fetch(
        `http://localhost:5000/shipments/${shipmentData._id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      if (res.ok) {
        setShipmentData((prev) => ({ ...prev, status: newStatus }));
        const label =
          STATUS_CONFIG[newStatus]?.label || newStatus.replace(/_/g, " ");
        showToast(`Status updated to: ${label}`, "success");
      } else {
        const errData = await res.json();
        showToast(errData.message || "Failed to update status", "error");
      }
    } catch {
      showToast("Could not update status", "error");
    } finally {
      setStatusUpdating(false);
    }
  };

  // ── Inbound Storage Form State & Handlers ────────────────────────────────
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [processedByUserName, setProcessedByUserName] = useState("");
  const [inboundSubmitting, setInboundSubmitting] = useState(false);
  const [inboundError, setInboundError] = useState("");

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    if (currentUser.userName || currentUser.name) {
      setProcessedByUserName(currentUser.userName || currentUser.name);
    }
  }, [currentUser]);

  const fetchWarehouses = async () => {
    setLoadingWarehouses(true);
    setInboundError("");
    try {
      const res = await fetch("http://localhost:5000/warehouse-list", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.listwarehouse) {
        setWarehouses(data.listwarehouse);
        if (data.listwarehouse.length > 0) {
          const firstWhId = data.listwarehouse[0]._id;
          setSelectedWarehouseId(firstWhId);
          fetchLocations(firstWhId);
        }
      } else {
        setInboundError(data.message || "Failed to load warehouses");
      }
    } catch {
      setInboundError("Could not connect to server to fetch warehouses");
    } finally {
      setLoadingWarehouses(false);
    }
  };

  const fetchLocations = async (whId) => {
    if (!whId) {
      setLocations([]);
      setSelectedLocationId("");
      return;
    }
    setLoadingLocations(true);
    try {
      const res = await fetch(
        `http://localhost:5000/warehouse-location-get/${whId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();
      if (res.ok && data.warhouseloclist) {
        setLocations(data.warhouseloclist);
        if (data.warhouseloclist.length > 0) {
          setSelectedLocationId(data.warhouseloclist[0]._id);
        } else {
          setSelectedLocationId("");
        }
      } else {
        setLocations([]);
        setSelectedLocationId("");
      }
    } catch {
      setLocations([]);
      setSelectedLocationId("");
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleWarehouseChange = (whId) => {
    setSelectedWarehouseId(whId);
    setSelectedLocationId("");
    fetchLocations(whId);
  };

  const handleOpenInboundForm = () => {
    setShowInboundModal(true);
    setInboundError("");
    if (!processedByUserName) {
      setProcessedByUserName(
        currentUser.userName || currentUser.name || "Admin User",
      );
    }
    fetchWarehouses();
  };

  const handleInboundSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedWarehouseId) {
      setInboundError("Please select a warehouse facility.");
      return;
    }
    if (!selectedLocationId) {
      setInboundError("Please select a storage location slot.");
      return;
    }
    if (!processedByUserName.trim()) {
      setInboundError("Please provide the user name processing this intake.");
      return;
    }

    setInboundSubmitting(true);
    setInboundError("");

    try {
      const payload = {
        warehouseId: selectedWarehouseId,
        shipmentId: shipmentData?._id || shipmentData?.shipmentId,
        locationId: selectedLocationId,
        wartansactonProcessBy:
          currentUser.userId || currentUser._id || processedByUserName.trim(),
      };

      const res = await fetch("http://localhost:5000/warehouse/inbound", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.message || "Failed to receive shipment into warehouse",
        );
      }

      showToast(
        data.message || "Shipment Stored in Warehouse Successfully!",
        "success",
      );
      setShipmentData((prev) => ({ ...prev, status: "at_warehouse" }));
      setShowInboundModal(false);
    } catch (err) {
      setInboundError(err.message || "Something went wrong.");
      showToast(err.message || "Inbound storage failed", "error");
    } finally {
      setInboundSubmitting(false);
    }
  };

  useEffect(() => {
    fetchShipmentDate();
  }, [trackingId]);

  // ── Derived values ───────────────────────────────────────────────────────
  const s = shipmentData;
  const statusInfo = s
    ? STATUS_CONFIG[s.status] || STATUS_CONFIG.created
    : null;

  const vehicleInfo = s
    ? getVehicleInfo(s.vehicleNo, s.tripNo)
    : { name: "", regNo: "", display: "N/A" };
  const tripInfo = s
    ? getTripInfo(s.tripNo)
    : { tripId: "N/A", display: "N/A" };
  const driverInfo = s
    ? getDriverInfo(s.driverName, s.tripNo)
    : { driverId: "", name: "", display: "N/A" };

  // ═════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="wh-page">
      <div className="wh-container">
        {/* ────────────────────────────────────────────────────────────────
            HEADER BAR (same pattern as drv-header-top)
        ──────────────────────────────────────────────────────────────── */}
        <div className="wh-header">
          <div className="wh-logo-group">
            <img
              src="/Athenura.png"
              alt="Athenura"
              className="wh-logo-img"
            />
            <span className="wh-logo-divider" aria-hidden="true" />
            <div className="wh-logo-title-group">
              <span className="wh-logo-title">Shipment Verification</span>
              <span className="wh-logo-badge">Warehouse</span>
            </div>
          </div>

          <div className="wh-header-actions">
            <button
              type="button"
              onClick={fetchShipmentDate}
              disabled={loading}
              className="wh-pill-btn"
              title="Refresh Data"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span>Sync</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="wh-pill-btn"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* ── Toast Notification ────────────────────────────────────────── */}
        {toastMessage && (
          <div className="wh-toast-wrap">
            <div className={`wh-toast wh-toast--${toastMessage.type}`}>
              {toastMessage.type === "success" && (
                <CheckCircle2
                  className="w-4 h-4"
                  style={{ color: "#059669" }}
                />
              )}
              {toastMessage.type === "error" && (
                <AlertCircle className="w-4 h-4" style={{ color: "#e11d48" }} />
              )}
              {toastMessage.type === "info" && (
                <Copy className="w-4 h-4" style={{ color: "#2563eb" }} />
              )}
              {toastMessage.text}
            </div>
          </div>
        )}

        {/* ── Error Banner ──────────────────────────────────────────────── */}
        {noti && (
          <div className="wh-error-card">
            <div className="wh-error-icon">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="wh-error-text">
              <strong>Error:&nbsp;</strong>
              {noti}
            </div>
          </div>
        )}

        {/* ── Loading State ─────────────────────────────────────────────── */}
        {loading && (
          <div className="wh-loading-state">
            <div className="wh-spinner" />
            <p className="wh-loading-text">Scanning shipment {trackingId}...</p>
          </div>
        )}

        {/* ── Empty / Not Found ─────────────────────────────────────────── */}
        {!loading && !s && !noti && (
          <div className="wh-empty-state">
            <div className="wh-empty-icon">
              <ScanLine className="w-6 h-6" />
            </div>
            <h3 className="wh-empty-title">No shipment found</h3>
            <p className="wh-empty-desc">
              The tracking ID <strong>{trackingId}</strong> did not match any
              shipment in the system. Please verify the code and scan again.
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            SHIPMENT DETAIL VIEW (only when data loaded)
        ════════════════════════════════════════════════════════════════ */}
        {!loading && s && (
          <>
            {/* ── Tracking Banner ──────────────────────────────────────── */}
            <div className="wh-tracking-banner">
              <div className="wh-tracking-left">
                <div className="wh-tracking-icon-box">
                  <Package className="w-5 h-5" />
                </div>
                <div className="wh-tracking-info">
                  <h2>
                    {s.trackingId}
                    <button
                      type="button"
                      onClick={() => copyToClipboard(s.trackingId)}
                      className="wh-copy-btn"
                      title="Copy Tracking ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </h2>
                  <p>
                    Shipment {s.shipmentId} &bull; Trip {tripInfo.display}
                  </p>
                </div>
              </div>

              {/* Priority + Status badges (reuses DriverDas.css classes) */}
              <div className="wh-status-row">
                <span
                  className={`drv-priority-badge ${
                    s.priority === "Urgent"
                      ? "drv-priority-badge--urgent"
                      : s.priority === "Express"
                        ? "drv-priority-badge--express"
                        : "drv-priority-badge--standard"
                  }`}
                >
                  {s.priority}
                </span>
                <span className={`drv-status-badge ${statusInfo.className}`}>
                  <span className="drv-status-dot" />
                  {statusInfo.label}
                </span>
              </div>
            </div>

            {/* ── Quick Stats (same as drv-metrics-grid) ───────────────── */}
            <div className="wh-stats-grid">
              <div className="wh-stat-card wh-stat-card--blue">
                <span className="wh-stat-label">Packages</span>
                <span className="wh-stat-value">{s.packageCount ?? "–"}</span>
              </div>
              <div className="wh-stat-card wh-stat-card--amber">
                <span className="wh-stat-label">Total Weight</span>
                <span className="wh-stat-value">{s.totalWeight ?? "–"} kg</span>
              </div>
              <div className="wh-stat-card wh-stat-card--emerald">
                <span className="wh-stat-label">Vehicle</span>
                <span
                  className="wh-stat-value"
                  style={{
                    fontSize:
                      vehicleInfo.name && vehicleInfo.regNo
                        ? "0.82rem"
                        : "1.05rem",
                    lineHeight: 1.25,
                    wordBreak: "break-word",
                  }}
                  title={vehicleInfo.display}
                >
                  {vehicleInfo.name && vehicleInfo.regNo ? (
                    <>
                      <span>{vehicleInfo.name}</span>
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          color: "#059669",
                          marginTop: "2px",
                        }}
                      >
                        {vehicleInfo.regNo}
                      </span>
                    </>
                  ) : (
                    vehicleInfo.display
                  )}
                </span>
              </div>
              <div className="wh-stat-card wh-stat-card--purple">
                <span className="wh-stat-label">Trip No</span>
                <span className="wh-stat-value" title={tripInfo.display}>
                  {tripInfo.display}
                </span>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                CARD: Route Details (A → B)
                Same visual as drv-route-wrap / drv-route-step
            ══════════════════════════════════════════════════════════════ */}
            <div className="wh-detail-card">
              <div className="wh-section-header">
                <div className="wh-section-icon wh-section-icon--blue">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="wh-section-title">Route Details</h3>
              </div>

              <div className="wh-card-body">
                <div className="wh-route-wrap">
                  <div className="wh-route-line" />

                  {/* ── Point A: Sender (Origin) ──────────────────────── */}
                  <div className="wh-route-step">
                    <div className="wh-step-marker wh-step-marker--a">A</div>
                    <div>
                      <div className="wh-step-label">Pickup Origin</div>
                      <p className="wh-step-name">{s.senderName}</p>
                      <p className="wh-step-addr">
                        {s.senderAddress}, {s.senderCity}, {s.senderState} –{" "}
                        {s.senderpincode}
                      </p>
                      <div className="wh-step-meta">
                        <span className="wh-meta-chip">
                          <Phone className="w-3 h-3" />
                          <a href={`tel:${s.senderPhoneNumber}`}>
                            {s.senderPhoneNumber}
                          </a>
                        </span>
                        <span className="wh-meta-chip">
                          <Mail className="w-3 h-3" />
                          <a href={`mailto:${s.senderEmail}`}>
                            {s.senderEmail}
                          </a>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Point B: Receiver (Destination) ───────────────── */}
                  <div className="wh-route-step">
                    <div className="wh-step-marker wh-step-marker--b">B</div>
                    <div>
                      <div
                        className="wh-step-label"
                        style={{ color: "#059669" }}
                      >
                        Destination Recipient
                      </div>
                      <p className="wh-step-name">{s.receiverName}</p>
                      <p className="wh-step-addr">
                        {s.receiverAddress}, {s.receiverCity}, {s.receiverState}{" "}
                        – {s.receiverpincode}
                      </p>
                      <div className="wh-step-meta">
                        <span className="wh-meta-chip">
                          <Phone className="w-3 h-3" />
                          <a href={`tel:${s.receiverPhoneNumber}`}>
                            {s.receiverPhoneNumber}
                          </a>
                        </span>
                        <span className="wh-meta-chip">
                          <Mail className="w-3 h-3" />
                          <a href={`mailto:${s.receiverEmail}`}>
                            {s.receiverEmail}
                          </a>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                CARD: Package Information
                Same visual as drv-parcel-box
            ══════════════════════════════════════════════════════════════ */}
            <div className="wh-detail-card">
              <div className="wh-section-header">
                <div className="wh-section-icon wh-section-icon--amber">
                  <Box className="w-4 h-4" />
                </div>
                <h3 className="wh-section-title">Package Information</h3>
              </div>

              <div className="wh-card-body">
                <div className="wh-info-grid wh-info-grid--2col">
                  <div className="wh-info-item">
                    <span className="wh-info-label">Description</span>
                    <span className="wh-info-value">
                      {s.packageDescription || "N/A"}
                    </span>
                  </div>
                  <div className="wh-info-item">
                    <span className="wh-info-label">Package Count</span>
                    <span className="wh-info-value">
                      {s.packageCount ?? "N/A"} pcs
                    </span>
                  </div>
                  <div className="wh-info-item">
                    <span className="wh-info-label">Total Weight</span>
                    <span className="wh-info-value">
                      {s.totalWeight ?? "N/A"} kg
                    </span>
                  </div>
                  <div className="wh-info-item">
                    <span className="wh-info-label">
                      Dimensions (L × W × H)
                    </span>
                    <span className="wh-info-value">
                      {s.dimensions ? (
                        <span className="wh-dimensions-row">
                          <span className="wh-dim-pill">
                            {s.dimensions.length} cm
                          </span>
                          <span className="wh-dim-sep">×</span>
                          <span className="wh-dim-pill">
                            {s.dimensions.width} cm
                          </span>
                          <span className="wh-dim-sep">×</span>
                          <span className="wh-dim-pill">
                            {s.dimensions.height} cm
                          </span>
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                CARD: Schedule & Dates
            ══════════════════════════════════════════════════════════════ */}
            <div className="wh-detail-card">
              <div className="wh-section-header">
                <div className="wh-section-icon wh-section-icon--purple">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="wh-section-title">Schedule &amp; Dates</h3>
              </div>

              <div className="wh-card-body">
                <div className="wh-info-grid wh-info-grid--2col">
                  <div className="wh-info-item">
                    <span className="wh-info-label">Pickup Date</span>
                    <span className="wh-info-value">
                      {formatDate(s.pickupDate)}
                    </span>
                  </div>
                  <div className="wh-info-item">
                    <span className="wh-info-label">Expected Delivery</span>
                    <span className="wh-info-value">
                      {formatDate(s.expectedDeliveryDate)}
                    </span>
                  </div>
                  <div className="wh-info-item">
                    <span className="wh-info-label">Created At</span>
                    <span className="wh-info-value">
                      {formatDate(s.createdAt)}
                    </span>
                  </div>
                  <div className="wh-info-item">
                    <span className="wh-info-label">Last Updated</span>
                    <span className="wh-info-value">
                      {formatDate(s.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                CARD: Transport Details
            ══════════════════════════════════════════════════════════════ */}
            <div className="wh-detail-card">
              <div className="wh-section-header">
                <div className="wh-section-icon wh-section-icon--cyan">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="wh-section-title">Transport Details</h3>
              </div>

              <div className="wh-card-body">
                <div className="wh-info-grid wh-info-grid--2col">
                  <div className="wh-info-item">
                    <span className="wh-info-label">Vehicle</span>
                    <span className="wh-info-value">
                      {vehicleInfo.name && vehicleInfo.regNo ? (
                        <>
                          <span style={{ fontWeight: 600 }}>
                            {vehicleInfo.name}
                          </span>
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.8rem",
                              color: "#64748b",
                              fontWeight: 500,
                              marginTop: "2px",
                            }}
                          >
                            Reg: {vehicleInfo.regNo}
                          </span>
                        </>
                      ) : (
                        vehicleInfo.display
                      )}
                    </span>
                  </div>
                  <div className="wh-info-item">
                    <span className="wh-info-label">Trip Number</span>
                    <span className="wh-info-value">{tripInfo.display}</span>
                  </div>
                  <div className="wh-info-item">
                    <span className="wh-info-label">Driver</span>
                    <span className="wh-info-value">
                      {driverInfo.driverId && driverInfo.name ? (
                        <>
                          <span style={{ fontWeight: 600 }}>
                            {driverInfo.name}
                          </span>
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.8rem",
                              color: "#64748b",
                              fontWeight: 500,
                              marginTop: "2px",
                            }}
                          >
                            ID: {driverInfo.driverId}
                          </span>
                        </>
                      ) : (
                        driverInfo.display
                      )}
                    </span>
                  </div>
                  <div className="wh-info-item">
                    <span className="wh-info-label">Priority</span>
                    <span className="wh-info-value">
                      {s.priority || "Standard"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                CARD FOOTER: Status Update Actions
                Same pattern as drv-card-footer
            ══════════════════════════════════════════════════════════════ */}
            <div className="wh-detail-card">
              <div className="wh-action-footer">
                <div className="wh-action-info">
                  <span className="wh-action-title">
                    Warehouse Inbound Storage
                  </span>
                  <span className="wh-action-desc">
                    Receive package and record warehouse storage location
                  </span>
                </div>

                {/* Primary action button */}
                {s.status !== "at_warehouse" ? (
                  <button
                    type="button"
                    onClick={handleOpenInboundForm}
                    disabled={inboundSubmitting}
                    className="wh-btn-action wh-btn-action--emerald"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Received at Warehouse
                  </button>
                ) : (
                  <div className="wh-completed-tag">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Received at Warehouse</span>
                  </div>
                )}
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                MODAL FORM: Inbound Shipment Storage (POST /warehouse/inbound)
            ══════════════════════════════════════════════════════════════ */}
            {showInboundModal && (
              <div
                className="wh-modal-overlay"
                onClick={() => setShowInboundModal(false)}
              >
                <div
                  className="wh-modal-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="wh-modal-header">
                    <div className="wh-modal-title-group">
                      <div className="wh-modal-icon-badge">
                        <Box className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="wh-modal-title">
                          Receive Shipment at Warehouse
                        </h3>
                        <p className="wh-modal-subtitle">
                          Assign warehouse facility and storage location slot
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInboundModal(false)}
                      className="wh-modal-close-btn"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleInboundSubmit}>
                    <div className="wh-modal-body">
                      {inboundError && (
                        <div
                          className="wh-error-card"
                          style={{ padding: "0.75rem 1rem" }}
                        >
                          <div
                            className="wh-error-icon"
                            style={{ width: "1.5rem", height: "1.5rem" }}
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                          </div>
                          <div
                            className="wh-error-text"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {inboundError}
                          </div>
                        </div>
                      )}

                      {/* 1. Shipment ID (Read-only SHP) */}
                      <div className="wh-form-group">
                        <label className="wh-form-label">
                          <span>Shipment ID</span>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              color: "#94a3b8",
                              fontWeight: 500,
                            }}
                          >
                            Read-only (SHP)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={s.shipmentId || ""}
                          readOnly
                          className="wh-form-input"
                        />
                      </div>

                      {/* 2. Warehouse Selection */}
                      <div className="wh-form-group">
                        <label className="wh-form-label">
                          <span>
                            Warehouse Facility{" "}
                            <span style={{ color: "#ef4444" }}>*</span>
                          </span>
                          {loadingWarehouses && (
                            <span
                              style={{ fontSize: "0.68rem", color: "#3b82f6" }}
                            >
                              Loading facilities...
                            </span>
                          )}
                        </label>
                        <select
                          value={selectedWarehouseId}
                          onChange={(e) =>
                            handleWarehouseChange(e.target.value)
                          }
                          disabled={loadingWarehouses}
                          className="wh-form-select"
                          required
                        >
                          <option value="">
                            -- Select Destination Warehouse --
                          </option>
                          {warehouses.map((w) => (
                            <option key={w._id} value={w._id}>
                              {w.warName} ({w.warehouseId || "WH"}){" "}
                              {w.warCity ? `– ${w.warCity}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 3. Location Slot Selection */}
                      <div className="wh-form-group">
                        <label className="wh-form-label">
                          <span>
                            Storage Location Slot{" "}
                            <span style={{ color: "#ef4444" }}>*</span>
                          </span>
                          {loadingLocations && (
                            <span
                              style={{ fontSize: "0.68rem", color: "#3b82f6" }}
                            >
                              Loading locations...
                            </span>
                          )}
                        </label>
                        <select
                          value={selectedLocationId}
                          onChange={(e) =>
                            setSelectedLocationId(e.target.value)
                          }
                          disabled={loadingLocations || locations.length === 0}
                          className="wh-form-select"
                          required
                        >
                          <option value="">
                            {loadingLocations
                              ? "Loading storage slots..."
                              : locations.length === 0
                                ? "No locations configured for this warehouse"
                                : "-- Select Zone / Rack / Bin Slot --"}
                          </option>
                          {locations.map((loc) => (
                            <option key={loc._id} value={loc._id}>
                              {loc.warlocZone} • {loc.warlocRack} •
                              {loc.warlocBin}{" "}
                              {loc.warlocStatus ? `(${loc.warlocStatus})` : ""}
                            </option>
                          ))}
                        </select>
                        {locations.length === 0 &&
                          !loadingLocations &&
                          selectedWarehouseId && (
                            <p
                              style={{
                                fontSize: "0.7rem",
                                color: "#d97706",
                                margin: "0.2rem 0 0",
                                fontWeight: 600,
                              }}
                            >
                              Note: No locations configured for this warehouse.
                              Please configure locations in Warehouse
                              Management.
                            </p>
                          )}
                      </div>

                      {/* 4. Processed By Username */}
                      <div className="wh-form-group">
                        <label className="wh-form-label">
                          <span>
                            Processed By User Name{" "}
                            <span style={{ color: "#ef4444" }}>*</span>
                          </span>
                        </label>
                        <input
                          type="text"
                          value={processedByUserName}
                          onChange={(e) =>
                            setProcessedByUserName(e.target.value)
                          }
                          placeholder="e.g. Admin User / Warehouse Staff"
                          className="wh-form-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="wh-modal-footer">
                      <button
                        type="button"
                        onClick={() => setShowInboundModal(false)}
                        disabled={inboundSubmitting}
                        className="wh-btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={
                          inboundSubmitting ||
                          !selectedWarehouseId ||
                          !selectedLocationId
                        }
                        className="wh-btn-action wh-btn-action--emerald"
                      >
                        {inboundSubmitting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Receiving Package...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm &amp; Receive Inbound</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
