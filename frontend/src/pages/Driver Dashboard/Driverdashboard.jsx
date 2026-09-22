import React, { useState, useEffect, useRef, useMemo } from "react";
import "../../styles/DriverDas.css";
import {
  Truck,
  Package,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Camera,
  PenTool,
  ArrowRight,
  Search,
  RotateCcw,
  RefreshCw,
  Navigation,
  UploadCloud,
  X,
  Check,
  Eye,
  ShieldCheck,
  Copy,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Award,
  CircleDot,
  Send,
  AlertCircle,
  FileText,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Helper function to cleanly format ETA timestamps (e.g. ISO 2026-09-17T12:30:00.000Z)
const formatETA = (val) => {
  if (!val) return "Not Specified";
  if (typeof val !== "string") return String(val);

  // If already formatted like "Today, 02:30 PM", return as-is
  if (
    val.includes("Today") ||
    val.includes("Tomorrow") ||
    val.includes("Delivered")
  ) {
    return val;
  }

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

    if (isToday) {
      return `Today, ${timeStr}`;
    } else if (isTomorrow) {
      return `Tomorrow, ${timeStr}`;
    } else {
      const dateStr = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return `${dateStr}, ${timeStr}`;
    }
  } catch {
    return val;
  }
};

const STATUS_CONFIG = {
  created: {
    label: "Created",
    className: "drv-status--created",
  },
  pickup_scheduled: {
    label: "Pickup Scheduled",
    className: "drv-status--pickup_scheduled",
  },
  picked_up: {
    label: "Picked Up",
    className: "drv-status--picked_up",
  },
  at_warehouse: {
    label: "At Warehouse",
    className: "drv-status--at_warehouse",
  },
  dispatched: {
    label: "Dispatched",
    className: "drv-status--dispatched",
  },
  in_transit: {
    label: "In Transit",
    className: "drv-status--in_transit",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    className: "drv-status--out_for_delivery",
  },
  delivered: {
    label: "Delivered",
    className: "drv-status--delivered",
  },
  failed_delivery: {
    label: "Failed Delivered",
    className: "drv-status--failed_delivery",
  },
};

const NEXT_STATUS_MAP = {
  created: "pickup_scheduled",
  pickup_scheduled: "picked_up",
  picked_up: "in_transit",
  at_warehouse: "in_transit",
  dispatched: "in_transit",
  in_transit: "out_for_delivery",
  out_for_delivery: "delivered",
};

export default function Driverdashboard() {
  // User profile from storage
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [driverProfile, setDriverProfile] = useState(null);
  const driverName =
    user?.userName || user?.name || driverProfile?.name || "Driver";
  const driverPhone =
    driverProfile?.phonenumber ||
    driverProfile?.phone ||
    user?.phone ||
    user?.phonenumber ||
    "Not Provided";
  const assignedVehicle = driverProfile?.vehicleNo || "Unassigned";

  const storageKey = `driver_assigned_trips_${user?.userId || user?._id || user?.email || user?.userName || "guest"}`;

  // Shift & Status State
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [trips, setTrips] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out legacy mock data if previously stored
          return parsed.filter(
            (t) =>
              t._id &&
              !String(t._id).startsWith("trip-") &&
              !String(t._id).startsWith("serv-"),
          );
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toastMessage, setToastMessage] = useState(null);

  // Modals state
  const [statusModalTrip, setStatusModalTrip] = useState(null);
  const [podModalTrip, setPodModalTrip] = useState(null);
  const [viewPodTrip, setViewPodTrip] = useState(null);
  const [tripDetailsModal, setTripDetailsModal] = useState(null);
  const [showSetupProfileModal, setShowSetupProfileModal] = useState(false);
  const [showDriverProfileInfoModal, setShowDriverProfileInfoModal] =
    useState(false);
  const [hasAutoPromptedProfile, setHasAutoPromptedProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Helper to get detailed list of which required driver verification fields are incomplete
  const getIncompleteFields = (profile) => {
    if (!profile) return [];

    const missing = [];
    const phone =
      profile.phonenumber || profile.phone || user?.phone || user?.phonenumber;
    if (!phone || !String(phone).trim()) {
      missing.push({ key: "phonenumber", label: "Phone Number" });
    }
    const licNo = profile.license?.licensenumber;
    if (!licNo || !String(licNo).trim()) {
      missing.push({ key: "licensenumber", label: "Driving License Number" });
    }
    const licExp = profile.license?.expiredate;
    if (!licExp) {
      missing.push({ key: "expiredate", label: "License Expiry Date" });
    }

    return missing;
  };

  // Helper to check if any required driver details are incomplete
  const isProfileIncomplete = (profile) => {
    if (!profile) return false;
    return getIncompleteFields(profile).length > 0;
  };

  const fetchDriverProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setProfileLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/driver/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.driver) {
          setDriverProfile(data.driver);
          const missing = getIncompleteFields(data.driver);
          if (missing.length > 0 && !hasAutoPromptedProfile) {
            setShowSetupProfileModal(true);
            setHasAutoPromptedProfile(true);
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch driver profile:", e);
    } finally {
      setProfileLoading(false);
    }
  };

  // Save trips to driver-specific storage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(trips));
    } catch (e) {
      console.error(e);
    }
  }, [trips, storageKey]);

  // Fetch backend shipments assigned specifically to this driver
  const fetchShipments = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      let serverShipments = [];

      // 1. First attempt to call the dedicated /driver/myshipments endpoint
      try {
        const myRes = await fetch(`${API_BASE_URL}/driver/myshipments`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (myRes.ok) {
          const myData = await myRes.json();
          serverShipments = myData?.shipments || [];
          if (myData?.driver) {
            setDriverProfile((prev) => {
              if (!prev) return myData.driver;
              return {
                ...myData.driver,
                ...prev,
                phonenumber:
                  prev.phonenumber ||
                  myData.driver.phonenumber ||
                  myData.driver.phone ||
                  prev.phone ||
                  "",
                license: {
                  ...(myData.driver.license || {}),
                  ...(prev.license || {}),
                },
                documents: {
                  ...(myData.driver.documents || {}),
                  ...(prev.documents || {}),
                },
                isProfileComplete:
                  prev.isProfileComplete || myData.driver.isProfileComplete,
              };
            });
          }
        }
      } catch (err) {
        console.warn(
          "Could not reach /driver/myshipments, falling back to /shipments",
          err,
        );
      }

      // 2. If dedicated endpoint returned nothing, fallback to /shipments
      if (serverShipments.length === 0) {
        const res = await fetch(
          `${API_BASE_URL}/shipments?myShipments=true&limit=100`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );
        if (res.ok) {
          const data = await res.json();
          const allShipments = data?.shipments || data?.data || [];

          // Strictly filter only for shipments assigned to this driver:
          const myName = String(
            user?.userName || user?.name || driverProfile?.name || "",
          )
            .trim()
            .toLowerCase();
          const myDrId = String(driverProfile?.driverId || "")
            .trim()
            .toLowerCase();

          serverShipments = allShipments.filter((s) => {
            const sDriver = String(s.driverName || "")
              .trim()
              .toLowerCase();
            if (!sDriver || sDriver === "unassigned") return false;
            if (myName && (sDriver === myName || sDriver.includes(myName)))
              return true;
            if (myDrId && (sDriver === myDrId || sDriver.includes(myDrId)))
              return true;
            return false;
          });
        }
      }

      // Format assigned shipments with genuine database fields
      const formatted = serverShipments.map((s) => ({
        _id: s._id,
        shipmentId: s.shipmentId || "",
        trackingId: s.trackingId || "",
        priority: s.priority || "Standard",
        status: s.status || "created",
        sender: {
          name: s.senderName || s.originHub || "N/A",
          address: s.senderAddress || s.originAddress || s.originCity || "N/A",
          contactPerson: s.senderContact || "-",
          phone: s.senderPhoneNumber || s.senderPhone || "-",
        },
        receiver: {
          name: s.receiverName || s.customerId?.name || "N/A",
          address:
            s.receiverAddress ||
            s.destinationAddress ||
            s.destinationCity ||
            "N/A",
          phone: s.receiverPhoneNumber || s.receiverPhone || "-",
        },
        packageDetails: {
          type: s.packageDescription || s.packageType || "Parcel",
          weight: s.totalWeight ?? s.weight ?? 0,
          items: s.packageCount ?? s.quantity ?? 1,
          instructions: s.specialInstructions || "-",
        },
        assignedVehicle:
          s.vehicleNo ||
          s.vehiclePlateNumber ||
          (assignedVehicle !== "Unassigned" ? assignedVehicle : "N/A"),
        estimatedDelivery: formatETA(
          s.expectedDeliveryDate || s.deliveryDate || s.estimatedDelivery,
        ),
        createdAt: s.createdAt || "",
        pod: s.pod || null,
      }));

      setTrips(formatted);
      if (formatted.length > 0) {
        showToast(
          `${formatted.length} assigned trip${formatted.length > 1 ? "s" : ""} loaded`,
          "success",
        );
      }
      setLoading(false);
      return;
    } catch (err) {
      console.log("Error syncing driver shipments:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchShipments();
    fetchDriverProfile();
  }, []);

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Status progression action
  const handleNextStep = async (trip) => {
    const currentStatus = trip.status;
    const nextStatus = NEXT_STATUS_MAP[currentStatus];

    if (currentStatus === "out_for_delivery") {
      // If ready to deliver, trigger the POD submission modal
      setPodModalTrip(trip);
      return;
    }

    if (!nextStatus) {
      showToast(`Shipment is already in "${currentStatus}" status`, "info");
      return;
    }

    await updateTripStatus(trip._id, nextStatus);
  };

  // Update status function (calls backend PATCH if online, and always updates local state)
  const updateTripStatus = async (tripId, newStatus, additionalData = {}) => {
    // 1. Optimistic local update
    setTrips((prev) =>
      prev.map((t) => {
        if (t._id === tripId) {
          return {
            ...t,
            status: newStatus,
            ...additionalData,
          };
        }
        return t;
      }),
    );

    // 2. Attempt backend API patch
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API_BASE_URL}/shipments/${tripId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      console.warn("Backend status update skipped/offline:", error);
    }

    const statusLabel =
      STATUS_CONFIG[newStatus]?.label || newStatus.replace(/_/g, " ");
    showToast(`Status updated to: ${statusLabel}`, "success");
    setStatusModalTrip(null);
  };

  // Submit Proof of Delivery (POD)
  const handleSubmitPOD = async (tripId, podPayload) => {
    const updatedPod = {
      ...podPayload,
      timestamp: new Date().toISOString(),
      location: podPayload.location || "",
    };

    // Update trip with delivered status and POD payload
    await updateTripStatus(tripId, "delivered", { pod: updatedPod });
    setPodModalTrip(null);
    showToast("Proof of Delivery submitted! Shipment delivered.", "success");
  };

  // Copy tracking number helper
  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    showToast(`Copied ${text} to clipboard`, "info");
  };

  // Filtered trips
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      const matchesSearch =
        t.trackingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.shipmentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.receiver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.receiver?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.sender?.address?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === "all") return true;
      if (statusFilter === "active")
        return ["picked_up", "in_transit", "out_for_delivery"].includes(
          t.status,
        );
      if (statusFilter === "pending")
        return ["created", "pickup_scheduled", "at_warehouse"].includes(
          t.status,
        );
      if (statusFilter === "delivered") return t.status === "delivered";
      return t.status === statusFilter;
    });
  }, [trips, searchTerm, statusFilter]);

  // Metrics calculations
  const stats = useMemo(() => {
    const total = trips.length;
    const active = trips.filter((t) =>
      ["picked_up", "in_transit", "out_for_delivery"].includes(t.status),
    ).length;
    const pending = trips.filter((t) =>
      ["created", "pickup_scheduled", "at_warehouse"].includes(t.status),
    ).length;
    const delivered = trips.filter((t) => t.status === "delivered").length;
    const completionRate =
      total > 0 ? Math.round((delivered / total) * 100) : 0;

    return { total, active, pending, delivered, completionRate };
  }, [trips]);

  return (
    <div className="drv-page">
      <div className="drv-container">
        <div className="drv-header-top">
          {/* Logo Brand Title */}
          <div className="drv-logo-group">
            <span className="drv-logo-brand">LOGO</span>
            <span className="drv-logo-divider">|</span>
            <span className="drv-logo-title">Driver Dashboard</span>
          </div>

          {/* Right Action Controls */}
          <div className="drv-header-actions">
            <button
              type="button"
              onClick={() => {
                const nextState = !isOnDuty;
                setIsOnDuty(nextState);
                showToast(
                  `Shift status changed to: ${nextState ? "On Duty" : "Off Duty"}`,
                  nextState ? "success" : "info",
                );
              }}
              className={`drv-duty-btn ${isOnDuty ? "is-active" : "is-inactive"}`}
            >
              <span
                className={`drv-duty-dot ${isOnDuty ? "is-active" : "is-inactive"}`}
              />
              <span>{isOnDuty ? "Active On Duty" : "Off Duty"}</span>
            </button>

            <button
              type="button"
              onClick={fetchShipments}
              disabled={loading}
              className="drv-sync-btn"
              title="Refresh Assigned Trips"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span>Sync</span>
            </button>

            {/* Profile clickable area (Opens Driver Profile Info Modal) */}
            <div
              onClick={() => setShowDriverProfileInfoModal(true)}
              className="drv-header-profile-btn"
              title="Click to view driver info and update profile details"
            >
              <div className="drv-avatar-circle">
                {driverName[0]?.toUpperCase() || "J"}
              </div>
              <span className="drv-header-username">{driverName}</span>
            </div>
          </div>
        </div>
        <div className="drv-metrics-grid">
          <div className="drv-metric-card drv-metric-card--slate">
            <div className="drv-metric-header">
              <span>TOTAL ASSIGNED</span>
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <p className="drv-metric-value">{stats.total}</p>
            <span className="drv-metric-sub">Today's routes</span>
          </div>

          <div className="drv-metric-card drv-metric-card--blue">
            <div className="drv-metric-header">
              <span>ACTIVE / IN TRANSIT</span>
              <Truck className="w-4 h-4 text-blue-600" />
            </div>
            <p className="drv-metric-value">{stats.active}</p>
            <span className="drv-metric-sub">On road & dispatched</span>
          </div>

          <div className="drv-metric-card drv-metric-card--amber">
            <div className="drv-metric-header">
              <span>PENDING PICKUPS</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="drv-metric-value">{stats.pending}</p>
            <span className="drv-metric-sub">Scheduled at hubs</span>
          </div>

          <div className="drv-metric-card drv-metric-card--emerald">
            <div className="drv-metric-header">
              <span>COMPLETED</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="drv-metric-value">
              {stats.delivered}
              <span
                style={{
                  fontSize: "0.85rem",
                  marginLeft: "6px",
                  fontWeight: "600",
                  color: "var(--drv-emerald)",
                }}
              >
                ({stats.completionRate}%)
              </span>
            </p>
            <span className="drv-metric-sub">With verified POD</span>
          </div>
        </div>
        {!profileLoading && isProfileIncomplete(driverProfile) && (
          <div className="drv-alert-card">
            <div className="drv-alert-left">
              <div className="drv-alert-icon-box">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="drv-alert-title-row">
                  <h3 className="drv-alert-title">Driver Profile Incomplete</h3>
                  <span className="drv-alert-badge">
                    {getIncompleteFields(driverProfile).length} Details
                    Incomplete
                  </span>
                </div>
                <div className="drv-alert-missing">
                  <strong>Missing:</strong>
                  {getIncompleteFields(driverProfile).map((field) => (
                    <span key={field.key} className="drv-missing-tag">
                      &bull; {field.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSetupProfileModal(true)}
              className="drv-alert-action-btn"
            >
              Complete Missing Details &rarr;
            </button>
          </div>
        )}
        <div className="drv-toolbar">
          <div className="jdrv-search-box">
            <Search className="jdrv-search-icon w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ID, recipient, address..."
              className="jinput"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="drv-search-clear"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="drv-tab-list">
            {[
              { id: "all", label: "All Trips" },
              { id: "active", label: "Active" },
              { id: "out_for_delivery", label: "Out for Delivery" },
              { id: "pending", label: "Pending" },
              { id: "delivered", label: "Delivered" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`drv-tab-btn ${statusFilter === tab.id ? "is-active" : ""}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* =========================================================================
            ASSIGNED TRIPS LIST
        ========================================================================= */}
        <div className="space-y-4">
          <div className="drv-section-bar">
            <h2 className="drv-section-title">
              <span>Assigned Consignments ({filteredTrips.length})</span>
            </h2>
          </div>

          {filteredTrips.length === 0 ? (
            <div className="drv-empty-state">
              <div className="drv-empty-icon">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="drv-empty-title">
                {trips.length === 0
                  ? "No assigned shipments yet"
                  : "No trips found"}
              </h3>
              <p className="drv-empty-desc">
                {trips.length === 0
                  ? "You currently have no active shipments assigned to your driver account. New assignments from dispatch will show up here."
                  : "No assigned trips match your current filter or search criteria."}
              </p>
              {trips.length === 0 ? (
                <button
                  type="button"
                  onClick={fetchShipments}
                  className="drv-empty-action"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Check for New Assignments
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("all");
                    setSearchTerm("");
                  }}
                  className="drv-empty-action"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTrips.map((trip) => {
                const statusInfo =
                  STATUS_CONFIG[trip.status] || STATUS_CONFIG.created;
                const isDelivered = trip.status === "delivered";

                return (
                  <div key={trip._id} className="drv-trip-card">
                    {/* Top Row: IDs, Priority, Status */}
                    <div className="drv-card-top">
                      <div className="drv-card-ids">
                        <span className="drv-tracking-code">
                          {trip.trackingId}
                          <button
                            type="button"
                            onClick={() => copyToClipboard(trip.trackingId)}
                            className="drv-copy-btn"
                            title="Copy Tracking ID"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </span>

                        <span className="drv-shipment-code">
                          ({trip.shipmentId})
                        </span>

                        <span
                          className={`drv-priority-badge ${
                            trip.priority === "Urgent"
                              ? "drv-priority-badge--urgent"
                              : trip.priority === "Express"
                                ? "drv-priority-badge--express"
                                : "drv-priority-badge--standard"
                          }`}
                        >
                          {trip.priority}
                        </span>

                        {trip.pod && (
                          <span className="drv-pod-badge">
                            <ShieldCheck className="w-3 h-3" />
                            POD Verified
                          </span>
                        )}
                      </div>

                      {/* Current Status Badge */}
                      <span
                        className={`drv-status-badge ${statusInfo.className}`}
                      >
                        <span className="drv-status-dot" />
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Middle: Route Details (Pickup & Delivery) */}
                    <div className="drv-card-body">
                      {/* Origin and Destination Route Block */}
                      <div className="drv-route-wrap">
                        <div className="drv-route-line" />

                        {/* Pickup Point */}
                        <div className="drv-route-step">
                          <div className="drv-step-marker drv-step-marker--a">
                            A
                          </div>
                          <div>
                            <div className="drv-step-header">
                              <span className="drv-step-label drv-step-label--origin">
                                Pickup Origin
                              </span>
                              <span className="drv-step-contact">
                                {trip.sender?.contactPerson}
                              </span>
                            </div>
                            <p className="drv-step-name">{trip.sender?.name}</p>
                            <p className="drv-step-addr">
                              {trip.sender?.address}
                            </p>
                          </div>
                        </div>

                        {/* Delivery Destination */}
                        <div className="drv-route-step">
                          <div className="drv-step-marker drv-step-marker--b">
                            B
                          </div>
                          <div>
                            <div className="drv-step-header">
                              <span className="drv-step-label drv-step-label--dest">
                                Destination Recipient
                              </span>
                            </div>
                            <p className="drv-step-name">
                              {trip.receiver?.name}
                            </p>
                            <p className="drv-step-addr">
                              {trip.receiver?.address}
                            </p>
                            {trip.receiver?.phone && (
                              <a
                                href={`tel:${trip.receiver.phone}`}
                                className="drv-call-btn"
                              >
                                <Phone className="w-3 h-3" />
                                Call: {trip.receiver.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expected Delivery - centered between route and parcel */}
                      <div className="drv-expected-delivery">
                        Expected Delivery: {formatETA(trip.estimatedDelivery)}
                      </div>

                      {/* Package and Notes Block */}
                      <div className="drv-parcel-box">
                        <div>
                          <div className="drv-parcel-header">
                            Parcel Information
                          </div>
                          <div
                            className="drv-parcel-list"
                            style={{ marginTop: "0.5rem" }}
                          >
                            <div className="drv-parcel-row">
                              <span className="drv-parcel-label">
                                Package Type:
                              </span>
                              <span className="drv-parcel-val">
                                {trip.packageDetails?.type}
                              </span>
                            </div>
                            <div className="drv-parcel-row">
                              <span className="drv-parcel-label">
                                Weight & Items:
                              </span>
                              <span className="drv-parcel-val">
                                {trip.packageDetails?.weight} kg (
                                {trip.packageDetails?.items} pcs)
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="drv-parcel-footer">
                          <span>
                            Vehicle: <strong>{trip.assignedVehicle}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => setTripDetailsModal(trip)}
                            className="drv-btn-details-link"
                          >
                            Details <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Strip: Update Status & Submit POD */}
                    <div className="drv-card-footer">
                      <div className="drv-footer-left">
                        {/* Status Select Option */}
                        <div className="drv-status-control">
                          <span className="drv-status-label">Status:</span>
                          <div className="drv-select-wrap">
                            <select
                              value={trip.status}
                              onChange={(e) => {
                                const newSt = e.target.value;
                                if (newSt === "delivered") {
                                  setPodModalTrip(trip);
                                } else {
                                  updateTripStatus(trip._id, newSt);
                                }
                              }}
                              className="drv-status-dropdown"
                            >
                              {[
                                "created",
                                "pickup_scheduled",
                                "at_warehouse",
                                "dispatched",
                              ].includes(trip.status) && (
                                <option value={trip.status} disabled>
                                  {STATUS_CONFIG[trip.status]?.label ||
                                    trip.status}
                                </option>
                              )}
                              <option value="picked_up">Picked Up</option>
                              <option value="in_transit">In Transit</option>
                              <option value="out_for_delivery">
                                Out for Delivery
                              </option>
                              <option value="delivered">Delivered</option>
                              <option value="failed_delivery">
                                Failed Delivered
                              </option>
                            </select>
                            <ChevronDown className="drv-select-arrow w-3.5 h-3.5" />
                          </div>
                        </div>

                        {/* If already delivered, show "View POD" button */}
                        {isDelivered && (
                          <button
                            type="button"
                            onClick={() => setViewPodTrip(trip)}
                            className="drv-btn-viewpod"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            View POD
                          </button>
                        )}
                      </div>

                      {/* Primary Workflow Progress Action */}
                      <div>
                        {!isDelivered ? (
                          <button
                            type="button"
                            onClick={() => setPodModalTrip(trip)}
                            className="drv-btn-pod"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            Submit Delivery Proof
                          </button>
                        ) : (
                          <div className="drv-completed-tag">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Trip Completed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: SUBMIT PROOF OF DELIVERY (POD)
      ========================================================================= */}
      {podModalTrip && (
        <ProofOfDeliveryModal
          trip={podModalTrip}
          onClose={() => setPodModalTrip(null)}
          onSubmit={(podData) => handleSubmitPOD(podModalTrip._id, podData)}
        />
      )}

      {/* =========================================================================
          MODAL 2: UPDATE SHIPMENT STATUS MODAL
      ========================================================================= */}
      {statusModalTrip && (
        <UpdateStatusModal
          trip={statusModalTrip}
          onClose={() => setStatusModalTrip(null)}
          onUpdate={(newStatus, notes) =>
            updateTripStatus(statusModalTrip._id, newStatus, {
              statusNotes: notes,
            })
          }
          onRequestPOD={() => {
            const trip = statusModalTrip;
            setStatusModalTrip(null);
            setPodModalTrip(trip);
          }}
        />
      )}

      {/* =========================================================================
          MODAL 3: VIEW SUBMITTED POD MODAL
      ========================================================================= */}
      {viewPodTrip && (
        <ViewPodModal trip={viewPodTrip} onClose={() => setViewPodTrip(null)} />
      )}

      {/* =========================================================================
          MODAL 4: TRIP DETAILS & ROUTE TIMELINE MODAL
      ========================================================================= */}
      {tripDetailsModal && (
        <TripDetailsModal
          trip={tripDetailsModal}
          onClose={() => setTripDetailsModal(null)}
          onOpenPOD={() => {
            const t = tripDetailsModal;
            setTripDetailsModal(null);
            if (t.status === "delivered") {
              setViewPodTrip(t);
            } else {
              setPodModalTrip(t);
            }
          }}
        />
      )}

      {/* =========================================================================
          MODAL 5: SETUP DRIVER PROFILE MODAL
      ========================================================================= */}
      {showSetupProfileModal && (
        <SetupDriverProfileModal
          profile={driverProfile}
          onClose={() => setShowSetupProfileModal(false)}
          onSuccess={(updatedDriver) => {
            setDriverProfile(updatedDriver);
            setShowSetupProfileModal(false);
            showToast(
              "Driver verification profile updated successfully!",
              "success",
            );
          }}
        />
      )}

      {/* =========================================================================
          MODAL 6: DRIVER PROFILE INFO MODAL
      ========================================================================= */}
      {showDriverProfileInfoModal && (
        <DriverProfileInfoModal
          profile={driverProfile}
          user={user}
          driverName={driverName}
          driverPhone={driverPhone}
          assignedVehicle={assignedVehicle}
          isOnDuty={isOnDuty}
          onClose={() => setShowDriverProfileInfoModal(false)}
          onOpenUpdateProfile={() => {
            setShowDriverProfileInfoModal(false);
            setShowSetupProfileModal(true);
          }}
        />
      )}

      {/* =========================================================================
          FLOATING TOAST NOTIFICATION
      ========================================================================= */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            zIndex: 1050,
          }}
        >
          <div className={`drv-toast drv-toast--${toastMessage.type}`}>
            {toastMessage.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : toastMessage.type === "error" ? (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            )}
            <span>{toastMessage.text}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                marginLeft: "0.5rem",
              }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: PROOF OF DELIVERY (POD) MODAL
// =============================================================================
function ProofOfDeliveryModal({ trip, onClose, onSubmit }) {
  const [recipientName, setRecipientName] = useState(
    trip?.receiver?.name || "",
  );
  const [recipientRelation, setRecipientRelation] = useState("Self (Customer)");
  const [recipientPhone, setRecipientPhone] = useState(
    trip?.receiver?.phone || "",
  );
  const [deliveryAddress, setDeliveryAddress] = useState(
    trip?.receiver?.address || "",
  );
  const [notes, setNotes] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // HTML5 Signature Canvas
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Setup canvas resolution
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b";
  }, []);

  // Canvas drawing handlers
  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const pos = getCanvasPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (isDrawing) {
      e?.preventDefault();
      setIsDrawing(false);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Handle Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      alert("Please enter the recipient name.");
      return;
    }

    setIsSubmitting(true);

    let signatureData = null;
    if (hasSignature && canvasRef.current) {
      signatureData = canvasRef.current.toDataURL("image/png");
    }

    // Prepare POD payload
    const podPayload = {
      recipientName,
      recipientRelation,
      recipientPhone,
      notes: notes || "Delivered safely.",
      signatureData,
      photoUrl: photoPreview || null,
      location: deliveryAddress || "",
    };

    // If there's an actual file, optionally upload to backend
    if (photoFile && trip?._id) {
      try {
        const formData = new FormData();
        formData.append("document", photoFile);
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE_URL}/shipments/${trip._id}/documents`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
      } catch (err) {
        console.warn("POD photo upload offline fallback:", err);
      }
    }

    onSubmit(podPayload);
    setIsSubmitting(false);
  };

  return (
    <div className="drv-modal-overlay">
      <div className="drv-modal-card">
        {/* Header - Fixed Top */}
        <div className="drv-modal-header drv-modal-header--emerald">
          <div className="drv-modal-title-box">
            <div className="drv-modal-icon-badge">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="drv-modal-title">Submit Proof of Delivery</h3>
              <p className="drv-modal-sub">
                Shipment {trip.trackingId} &bull; {trip.receiver?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="drv-modal-close"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form with Scrollable Body and Pinned Footer */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <div className="drv-modal-body">
            {/* Recipient info */}
            <div className="drv-form-grid drv-form-grid--2col">
              <div className="drv-form-group">
                <label className="drv-label">Receiver Name *</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Full name of person who received"
                  className="drv-input"
                />
              </div>

              <div className="drv-form-group">
                <label className="drv-label">Relationship to Consignee</label>
                <select
                  value={recipientRelation}
                  onChange={(e) => setRecipientRelation(e.target.value)}
                  className="drv-select"
                >
                  <option value="Self (Customer)">Self (Customer)</option>
                  <option value="Family Member">Family Member</option>
                  <option value="Front Desk / Reception">
                    Front Desk / Reception
                  </option>
                  <option value="Security Guard">Security Guard</option>
                  <option value="Neighbor">Neighbor</option>
                  <option value="Authorized Representative">
                    Authorized Representative
                  </option>
                </select>
              </div>
            </div>

            <div className="drv-form-group">
              <label className="drv-label">Recipient Phone</label>
              <input
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="Enter recipient phone number"
                className="drv-input"
              />
            </div>

            {/* GPS Delivery Address Textarea */}
            <div className="drv-form-group">
              <label
                className="drv-label"
                style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                <MapPin
                  style={{
                    width: "0.9rem",
                    height: "0.9rem",
                    color: "var(--drv-emerald)",
                  }}
                />
                Delivery Address / GPS Location
              </label>
              <textarea
                rows={2}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Enter delivery address, location details or GPS landmark..."
                className="drv-textarea"
              />
            </div>

            {/* Digital Signature Canvas */}
            <div className="drv-form-group">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <label
                  className="drv-label"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <PenTool
                    style={{
                      width: "0.9rem",
                      height: "0.9rem",
                      color: "var(--drv-emerald)",
                    }}
                  />
                  Receiver Digital Signature
                </label>
                {hasSignature && (
                  <button
                    type="button"
                    onClick={clearSignature}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--drv-rose)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              <div className="drv-canvas-box">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={115}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-28.75 cursor-crosshair touch-none"
                />
                {!hasSignature && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      pointerEvents: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      color: "var(--drv-text-muted)",
                    }}
                  >
                    Draw signature here with finger or mouse
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Photo Attachment */}
            <div className="drv-form-group">
              <label
                className="drv-label"
                style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                <Camera
                  style={{
                    width: "0.9rem",
                    height: "0.9rem",
                    color: "var(--drv-primary)",
                  }}
                />
                Delivery Proof Photo (Parcel at doorstep / with recipient)
              </label>
              {photoPreview ? (
                <div
                  style={{
                    position: "relative",
                    borderRadius: "var(--drv-radius-md)",
                    overflow: "hidden",
                    border: "1px solid var(--drv-border)",
                    background: "#f1f5f9",
                    maxHeight: "150px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={photoPreview}
                    alt="Delivery Proof"
                    style={{
                      maxHeight: "150px",
                      width: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview(null);
                      setPhotoFile(null);
                    }}
                    style={{
                      position: "absolute",
                      top: "0.5rem",
                      right: "0.5rem",
                      padding: "0.35rem",
                      background: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="drv-upload-zone">
                  <UploadCloud
                    style={{
                      width: "1.5rem",
                      height: "1.5rem",
                      color: "var(--drv-text-muted)",
                      margin: "0 auto 0.35rem",
                    }}
                  />
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "var(--drv-text-main)",
                    }}
                  >
                    Upload Photo or Take Picture
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.7rem",
                      color: "var(--drv-text-muted)",
                      marginTop: "0.15rem",
                    }}
                  >
                    Supports JPG, PNG up to 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Delivery Remarks */}
            <div className="drv-form-group">
              <label className="drv-label">Delivery Remarks / Note</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Handed package to recipient, seal intact."
                className="drv-textarea"
              />
            </div>
          </div>

          {/* Sticky Footer Action Buttons */}
          <div className="drv-modal-footer">
            <button type="button" onClick={onClose} className="drv-btn-default">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="drv-btn-submit-emerald"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <Check className="w-4 h-4" />
              {isSubmitting
                ? "Submitting Proof..."
                : "Submit POD & Complete Delivery"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: UPDATE STATUS MODAL
// =============================================================================
function UpdateStatusModal({ trip, onClose, onUpdate, onRequestPOD }) {
  const [selectedStatus, setSelectedStatus] = useState(
    trip?.status || "in_transit",
  );
  const [statusNote, setStatusNote] = useState("");

  const validStatuses = [
    { value: "picked_up", label: "Picked Up" },
    { value: "in_transit", label: "In Transit" },
    { value: "out_for_delivery", label: "Out for Delivery" },
    { value: "delivered", label: "Delivered" },
    { value: "failed_delivery", label: "Failed Delivered" },
  ];

  const handleConfirm = () => {
    if (selectedStatus === "delivered") {
      onRequestPOD();
      return;
    }
    onUpdate(selectedStatus, statusNote);
  };

  return (
    <div className="drv-modal-overlay">
      <div className="drv-modal-card drv-modal-card--sm">
        {/* Header */}
        <div className="drv-modal-header drv-modal-header--subtle">
          <div>
            <h3 className="drv-modal-title">Update Delivery Status</h3>
            <p className="drv-modal-sub">Shipment {trip.trackingId}</p>
          </div>
          <button
            onClick={onClose}
            className="drv-modal-close"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="drv-modal-body">
          <div className="drv-form-group">
            <label className="drv-label">Select New Shipment Status</label>
            <div style={{ position: "relative" }}>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="drv-select"
                style={{
                  appearance: "none",
                  paddingRight: "2.25rem",
                  fontWeight: 700,
                }}
              >
                {validStatuses.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                style={{
                  width: "1rem",
                  height: "1rem",
                  color: "var(--drv-text-muted)",
                  pointerEvents: "none",
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
            </div>
            {selectedStatus === "delivered" && (
              <div
                className="drv-modal-alert drv-modal-alert--emerald"
                style={{ marginTop: "0.5rem" }}
              >
                <CheckCircle2
                  style={{ width: "1rem", height: "1rem", flexShrink: 0 }}
                />
                <span>
                  Selecting "Delivered" will proceed to the Proof of Delivery
                  (POD) form.
                </span>
              </div>
            )}
          </div>

          <div className="drv-form-group">
            <label className="drv-label">Check-in Note / Checkpoint</label>
            <input
              type="text"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="e.g. Scanned at regional toll plaza"
              className="drv-input"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="drv-modal-footer">
          <button onClick={onClose} className="drv-btn-default">
            Cancel
          </button>
          <button onClick={handleConfirm} className="drv-btn-primary">
            {selectedStatus === "delivered"
              ? "Proceed to POD Form"
              : "Save Status"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: VIEW POD CERTIFICATE MODAL
// =============================================================================
function ViewPodModal({ trip, onClose }) {
  const pod = trip?.pod || {};

  return (
    <div className="drv-modal-overlay">
      <div className="drv-modal-card drv-modal-card--sm">
        {/* Header - Fixed Top */}
        <div className="drv-modal-header drv-modal-header--teal">
          <div className="drv-modal-title-box">
            <div className="drv-modal-icon-badge">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="drv-modal-title">Delivery Proof Certificate</h3>
              <p className="drv-modal-sub">
                Tracking: {trip.trackingId} &bull; Delivered
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="drv-modal-close"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="drv-modal-body">
          {/* Details Card */}
          <div className="drv-info-box">
            <div className="drv-info-row">
              <span className="drv-info-label">Delivered To:</span>
              <span className="drv-info-value">
                {pod.recipientName || trip.receiver?.name || "Recipient"}
              </span>
            </div>
            <div className="drv-info-row">
              <span className="drv-info-label">Relation:</span>
              <span className="drv-info-value">
                {pod.recipientRelation || "Customer Self"}
              </span>
            </div>
            <div className="drv-info-row">
              <span className="drv-info-label">Contact:</span>
              <span className="drv-info-value">
                {pod.recipientPhone || trip.receiver?.phone || "N/A"}
              </span>
            </div>
            <div className="drv-info-row">
              <span className="drv-info-label">Timestamp:</span>
              <span
                className="drv-info-value"
                style={{ fontFamily: "monospace" }}
              >
                {pod.timestamp
                  ? new Date(pod.timestamp).toLocaleString()
                  : "N/A"}
              </span>
            </div>
            <div className="drv-info-row">
              <span className="drv-info-label">
                GPS Coordinates / Location:
              </span>
              <span
                className="drv-info-value"
                style={{ color: "var(--drv-emerald)", fontFamily: "monospace" }}
              >
                {pod.location || "Not recorded"}
              </span>
            </div>
            {pod.notes && (
              <div
                style={{
                  paddingTop: "0.5rem",
                  borderTop: "1px solid var(--drv-border)",
                  color: "var(--drv-text-muted)",
                }}
              >
                <strong style={{ color: "var(--drv-text-main)" }}>
                  Remarks:{" "}
                </strong>
                {pod.notes}
              </div>
            )}
          </div>

          {/* Signature Preview */}
          {pod.signatureData && (
            <div className="drv-form-group">
              <span
                className="drv-label"
                style={{ textTransform: "uppercase", letterSpacing: "0.03em" }}
              >
                Recipient Signature
              </span>
              <div
                style={{
                  border: "1px solid var(--drv-border)",
                  borderRadius: "var(--drv-radius-md)",
                  padding: "0.75rem",
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={pod.signatureData}
                  alt="Recipient Signature"
                  style={{ maxHeight: "90px", objectFit: "contain" }}
                />
              </div>
            </div>
          )}

          {/* Photo Proof Preview */}
          {pod.photoUrl && (
            <div className="drv-form-group">
              <span
                className="drv-label"
                style={{ textTransform: "uppercase", letterSpacing: "0.03em" }}
              >
                Delivery Location / Package Photo
              </span>
              <div
                style={{
                  borderRadius: "var(--drv-radius-md)",
                  overflow: "hidden",
                  border: "1px solid var(--drv-border)",
                  maxHeight: "160px",
                  background: "#f8fafc",
                }}
              >
                <img
                  src={pod.photoUrl}
                  alt="Delivery Proof"
                  style={{
                    width: "100%",
                    maxHeight: "160px",
                    objectFit: "cover",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Pinned Footer */}
        <div className="drv-modal-footer">
          <button onClick={onClose} className="drv-btn-default">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: TRIP DETAILS MODAL
// =============================================================================
function TripDetailsModal({ trip, onClose, onOpenPOD }) {
  return (
    <div className="drv-modal-overlay">
      <div className="drv-modal-card drv-modal-card--sm">
        {/* Header - Fixed Top */}
        <div className="drv-modal-header drv-modal-header--subtle">
          <div>
            <h3 className="drv-modal-title">Trip Details & Consignment</h3>
            <p className="drv-modal-sub">Tracking: {trip.trackingId}</p>
          </div>
          <button
            onClick={onClose}
            className="drv-modal-close"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="drv-modal-body">
          <div className="drv-form-group">
            <span className="drv-label">Route Overview</span>
            <div className="drv-info-box">
              <div>
                <span className="drv-info-label" style={{ display: "block" }}>
                  Origin Hub:
                </span>
                <span
                  className="drv-info-value"
                  style={{ textAlign: "left", display: "block" }}
                >
                  {trip.sender?.name} &bull; {trip.sender?.address}
                </span>
              </div>
              <div
                style={{
                  paddingTop: "0.5rem",
                  borderTop: "1px solid var(--drv-border)",
                }}
              >
                <span className="drv-info-label" style={{ display: "block" }}>
                  Destination:
                </span>
                <span
                  className="drv-info-value"
                  style={{ textAlign: "left", display: "block" }}
                >
                  {trip.receiver?.name} &bull; {trip.receiver?.address}
                </span>
                <div
                  style={{
                    color: "var(--drv-primary)",
                    fontWeight: 700,
                    marginTop: "0.25rem",
                  }}
                >
                  Contact: {trip.receiver?.phone}
                </div>
              </div>
            </div>
          </div>

          <div className="drv-form-group">
            <span className="drv-label">Vehicle & Assignment</span>
            <div className="drv-info-box">
              <div className="drv-info-row">
                <span className="drv-info-label">Vehicle:</span>
                <span className="drv-info-value">{trip.assignedVehicle}</span>
              </div>
              <div className="drv-info-row">
                <span className="drv-info-label">Priority:</span>
                <span className="drv-info-value">{trip.priority}</span>
              </div>
              <div className="drv-info-row">
                <span className="drv-info-label">Expected Delivery:</span>
                <span className="drv-info-value">
                  {formatETA(trip.estimatedDelivery)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pinned Footer */}
        <div
          className="drv-modal-footer"
          style={{ justifyContent: "space-between" }}
        >
          <button onClick={onClose} className="drv-btn-default">
            Close
          </button>
          <button onClick={onOpenPOD} className="drv-btn-submit-emerald">
            {trip.status === "delivered" ? "View POD" : "Submit Delivery Proof"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// MODAL 5 COMPONENT: SETUP DRIVER PROFILE MODAL
// Integrates with PATCH /setup-driverprofile to capture:
// phonenumber, licensenumber, expiredate, docname, docnumber, docexpiredate
// =========================================================================
function SetupDriverProfileModal({ profile, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    phonenumber: profile?.phonenumber || "",
    licensenumber: profile?.license?.licensenumber || "",
    expiredate: profile?.license?.expiredate
      ? new Date(profile.license.expiredate).toISOString().split("T")[0]
      : "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) {
      setFormData({
        phonenumber: profile?.phonenumber || profile?.phone || "",
        licensenumber: profile?.license?.licensenumber || "",
        expiredate: profile?.license?.expiredate
          ? new Date(profile.license.expiredate).toISOString().split("T")[0]
          : "",
      });
    }
  }, [profile]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate 10-digit mobile number
    const cleanPhone = String(formData.phonenumber)
      .replace(/\D/g, "")
      .slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile phone number.");
      return;
    }

    if (!formData.licensenumber.trim()) {
      setError("Please enter your Driving License Number.");
      return;
    }

    if (!formData.expiredate) {
      setError("Please select the Driving License Expiry Date.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/setup-driverprofile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          phonenumber: cleanPhone,
          licensenumber: formData.licensenumber.trim(),
          expiredate: formData.expiredate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.message || "Failed to update profile verification.",
        );
      }

      onSuccess(data.driver);
    } catch (err) {
      setError(
        err.message || "Something went wrong while saving profile details.",
      );
    } finally {
      setSaving(false);
    }
  };

  const missingKeys = useMemo(() => {
    const s = new Set();
    if (!formData.phonenumber || !String(formData.phonenumber).trim())
      s.add("phonenumber");
    if (!formData.licensenumber || !String(formData.licensenumber).trim())
      s.add("licensenumber");
    if (!formData.expiredate) s.add("expiredate");
    return s;
  }, [formData]);

  return (
    <div className="drv-modal-overlay">
      <div className="drv-modal-card drv-modal-card--lg">
        {/* Modal Header */}
        <div className="drv-modal-header drv-modal-header--blue">
          <div className="drv-modal-title-box">
            <div className="drv-modal-icon-badge">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="drv-modal-title">Complete Driver Profile</h2>
              <p className="drv-modal-sub">
                Setup required verification details & documentation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="drv-modal-close"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form
          onSubmit={handleSubmit}
          className="drv-modal-body"
          style={{ maxHeight: "78vh" }}
        >
          {/* Missing fields summary banner inside modal */}
          {missingKeys.size > 0 ? (
            <div
              className="drv-modal-alert drv-modal-alert--amber"
              style={{ flexDirection: "column", gap: "0.5rem" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontWeight: 700,
                }}
              >
                <AlertTriangle
                  style={{
                    width: "1rem",
                    height: "1rem",
                    color: "var(--drv-amber)",
                    flexShrink: 0,
                  }}
                />
                <span>
                  The following {missingKeys.size} detail
                  {missingKeys.size > 1 ? "s are" : " is"} incomplete:
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.35rem",
                  paddingLeft: "1.5rem",
                }}
              >
                {missingKeys.has("phonenumber") && (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      background: "#ffffff",
                      color: "var(--drv-rose)",
                      border: "1px solid var(--drv-amber-border)",
                    }}
                  >
                    &bull; Mobile Phone Number
                  </span>
                )}
                {missingKeys.has("licensenumber") && (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      background: "#ffffff",
                      color: "var(--drv-rose)",
                      border: "1px solid var(--drv-amber-border)",
                    }}
                  >
                    &bull; Driving License Number
                  </span>
                )}
                {missingKeys.has("expiredate") && (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      background: "#ffffff",
                      color: "var(--drv-rose)",
                      border: "1px solid var(--drv-amber-border)",
                    }}
                  >
                    &bull; License Expiry Date
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="drv-modal-alert drv-modal-alert--emerald">
              <CheckCircle2
                style={{ width: "1rem", height: "1rem", flexShrink: 0 }}
              />
              <span>
                All verification details are filled. You can review or update
                them below.
              </span>
            </div>
          )}

          {error && (
            <div className="drv-modal-alert drv-modal-alert--rose">
              <AlertCircle
                style={{ width: "1rem", height: "1rem", flexShrink: 0 }}
              />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Contact Detail */}
          <div className="drv-form-group">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <label
                className="drv-label"
                style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                <Phone
                  style={{
                    width: "0.9rem",
                    height: "0.9rem",
                    color: "var(--drv-primary)",
                  }}
                />
                Mobile Phone Number{" "}
                <span style={{ color: "var(--drv-rose)" }}>*</span>
              </label>
              {missingKeys.has("phonenumber") ? (
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: "var(--drv-rose)",
                    background: "#fff1f2",
                    padding: "0.15rem 0.45rem",
                    borderRadius: "4px",
                    border: "1px solid #fecdd3",
                  }}
                >
                  Incomplete
                </span>
              ) : (
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: "var(--drv-emerald)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  <Check className="w-3 h-3" /> Filled
                </span>
              )}
            </div>
            <div className="drv-phone-input-wrap">
              <span className="drv-phone-prefix">+91</span>
              <input
                type="tel"
                value={formData.phonenumber}
                onChange={(e) => handleChange("phonenumber", e.target.value)}
                placeholder="10-digit mobile number"
                maxLength={13}
                className="drv-input drv-phone-input"
                required
              />
            </div>
            <span
              style={{ fontSize: "0.72rem", color: "var(--drv-text-muted)" }}
            >
              Required for dispatchers and customers to reach you.
            </span>
          </div>

          <div
            style={{
              borderTop: "1px solid var(--drv-border)",
              paddingTop: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <h4
              style={{
                fontSize: "0.72rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--drv-text-muted)",
                margin: 0,
              }}
            >
              Driving License Information
            </h4>

            <div className="drv-form-grid drv-form-grid--2col">
              {/* Field 2: licensenumber */}
              <div className="drv-form-group">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <label
                    className="drv-label"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <FileText
                      style={{
                        width: "0.9rem",
                        height: "0.9rem",
                        color: "var(--drv-primary)",
                      }}
                    />
                    License Number{" "}
                    <span style={{ color: "var(--drv-rose)" }}>*</span>
                  </label>
                  {missingKeys.has("licensenumber") ? (
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: "var(--drv-rose)",
                        background: "#fff1f2",
                        padding: "0.15rem 0.45rem",
                        borderRadius: "4px",
                        border: "1px solid #fecdd3",
                      }}
                    >
                      Incomplete
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: "var(--drv-emerald)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <Check className="w-3 h-3" /> Filled
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.licensenumber}
                  onChange={(e) =>
                    handleChange("licensenumber", e.target.value)
                  }
                  placeholder="e.g. DL-0420110012345"
                  className="drv-input"
                  style={{ textTransform: "uppercase" }}
                  required
                />
              </div>

              {/* Field 3: expiredate */}
              <div className="drv-form-group">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <label
                    className="drv-label"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <Calendar
                      style={{
                        width: "0.9rem",
                        height: "0.9rem",
                        color: "var(--drv-primary)",
                      }}
                    />
                    License Expiry Date{" "}
                    <span style={{ color: "var(--drv-rose)" }}>*</span>
                  </label>
                  {missingKeys.has("expiredate") ? (
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: "var(--drv-rose)",
                        background: "#fff1f2",
                        padding: "0.15rem 0.45rem",
                        borderRadius: "4px",
                        border: "1px solid #fecdd3",
                      }}
                    >
                      Incomplete
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: "var(--drv-emerald)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <Check className="w-3 h-3" /> Filled
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={formData.expiredate}
                  onChange={(e) => handleChange("expiredate", e.target.value)}
                  className="drv-input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div
            className="drv-modal-footer"
            style={{
              background: "transparent",
              borderTop: "1px solid var(--drv-border)",
              padding: "1rem 0 0",
            }}
          >
            <button type="button" onClick={onClose} className="drv-btn-default">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="drv-btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving Details...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save & Complete Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: DRIVER PROFILE INFO MODAL
// Triggered on clicking driver profile avatar / name in header
// Shows info about driver and button to update profile details
// =========================================================================
function DriverProfileInfoModal({
  profile,
  user,
  driverName,
  driverPhone,
  assignedVehicle,
  isOnDuty,
  onClose,
  onOpenUpdateProfile,
}) {
  return (
    <div className="drv-modal-overlay">
      <div className="drv-modal-card drv-modal-card--md">
        {/* Header */}
        <div className="drv-modal-header drv-modal-header--blue">
          <div className="drv-modal-title-box">
            <div className="drv-avatar-circle drv-avatar-circle--lg">
              {driverName[0]?.toUpperCase() || "J"}
            </div>
            <div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <h2
                  className="drv-modal-title"
                  style={{ color: "#ffffff", margin: 0 }}
                >
                  {driverName}
                </h2>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.5rem",
                    borderRadius: "9999px",
                    background: "rgba(255,255,255,0.2)",
                    color: "#ffffff",
                  }}
                >
                  Driver
                </span>
              </div>
              <p
                className="drv-modal-sub"
                style={{ color: "#dbeafe", marginTop: "0.2rem" }}
              >
                Driver Account & Information
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="drv-modal-close"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="drv-modal-body">
          <div className="drv-info-box">
            <div className="drv-info-row">
              <span className="drv-info-label">Full Name:</span>
              <span className="drv-info-value">{driverName}</span>
            </div>
            <div className="drv-info-row">
              <span className="drv-info-label">Shift Status:</span>
              <span
                className="drv-info-value"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: isOnDuty
                      ? "var(--drv-emerald)"
                      : "#94a3b8",
                  }}
                />
                <strong
                  style={{ color: isOnDuty ? "var(--drv-emerald)" : "#64748b" }}
                >
                  {isOnDuty ? "Active On Duty" : "Off Duty"}
                </strong>
              </span>
            </div>
            <div className="drv-info-row">
              <span className="drv-info-label">Phone Number:</span>
              <span className="drv-info-value">
                <strong>{driverPhone}</strong>
              </span>
            </div>
            <div className="drv-info-row">
              <span className="drv-info-label">Email Address:</span>
              <span className="drv-info-value">
                {user?.email || profile?.email || "Not Provided"}
              </span>
            </div>
            <div className="drv-info-row">
              <span className="drv-info-label">Driver ID:</span>
              <span
                className="drv-info-value"
                style={{
                  fontFamily: "monospace",
                  fontWeight: 700,
                  color: "var(--drv-primary)",
                }}
              >
                {profile?.driverId || user?.userId || "DRV-182786"}
              </span>
            </div>
            <div className="drv-info-row">
              <span className="drv-info-label">Assigned Vehicle:</span>
              <span className="drv-info-value">
                <strong>
                  {assignedVehicle !== "Unassigned"
                    ? assignedVehicle
                    : "MH-12-AB-4521"}
                </strong>
              </span>
            </div>
            <div className="drv-info-row">
              <span className="drv-info-label">Driving License Number:</span>
              <span
                className="drv-info-value"
                style={{ fontFamily: "monospace", fontWeight: 700 }}
              >
                {profile?.license?.licensenumber || "DL-0420110012345"}
              </span>
            </div>
            <div className="drv-info-row">
              <span className="drv-info-label">License Expiry Date:</span>
              <span className="drv-info-value">
                {profile?.license?.expiredate
                  ? new Date(profile.license.expiredate).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )
                  : "Sep 15, 2028"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="drv-modal-footer"
          style={{ justifyContent: "space-between" }}
        >
          <button type="button" onClick={onClose} className="drv-btn-default">
            Close
          </button>
          <button
            type="button"
            onClick={onOpenUpdateProfile}
            className="drv-btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
            }}
          >
            <PenTool className="w-4 h-4" />
            Update Profile Details
          </button>
        </div>
      </div>
    </div>
  );
}
