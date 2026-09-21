import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Eye,
  Trash2,
  Mail,
  Phone,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Truck,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  CheckCircle2,
  MapPin,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Clock,
  Award,
  ShieldAlert,
  Calendar,
  CreditCard,
  AlertCircle,
  Navigation,
  History,
  Activity,
  Bell,
  CheckCheck,
  UserMinus,
  UserPlus,
} from "lucide-react";
import "../../styles/DriverManagement.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const isDriverActive = (d) =>
  (d?.status || "active").toLowerCase() === "active";

const getCountdownText = (dateStr) => {
  if (!dateStr) return { status: "Valid", countdown: "Compliant" };
  const target = new Date(dateStr);
  if (isNaN(target.getTime()))
    return { status: "Valid", countdown: "Compliant" };
  const now = new Date();
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return {
      status: "Expired",
      countdown: `Expired ${Math.abs(diffDays)} days ago`,
    };
  }
  if (diffDays <= 30) {
    return { status: "Expiring Soon", countdown: `${diffDays} days remaining` };
  }
  return { status: "Valid", countdown: `${diffDays} days remaining` };
};

const normalizeDriver = (d) => {
  const name = d.userId?.name || d.name || "Driver";
  const email = d.userId?.email || d.email || "";
  const phone = d.phonenumber ? String(d.phonenumber) : d.phone || "";
  const rawStatus = (d.status || d.userId?.status || "active").toLowerCase();
  const status = rawStatus === "inactive" ? "inactive" : "active";

  const rawAvailability = (d.availability || "").toLowerCase();
  let availability = "available";
  let availabilityStatus = "Available";

  if (status === "inactive" || rawAvailability === "unavailable") {
    availability = "unavailable";
    availabilityStatus = "Unavailable";
  } else if (
    rawAvailability === "assigned" ||
    (d.assignedShipments && d.assignedShipments.length > 0)
  ) {
    availability = "assigned";
    availabilityStatus = "On Trip";
  } else {
    availability = "available";
    availabilityStatus = "Available";
  }

  // License formatting
  const licNum = d.license?.licensenumber || d.license?.number || "";
  const licExp = d.license?.expiredate
    ? new Date(d.license.expiredate).toISOString().split("T")[0]
    : d.license?.expiryDate || "";
  const licIssue = d.license?.issueDate || "";
  const licType = d.license?.type || d.license?.licenseClass || "";
  const licState = d.license?.issuingState || "";

  // Dynamic documents list
  let docList = [];
  if (Array.isArray(d.documentsList) && d.documentsList.length > 0) {
    docList = d.documentsList;
  } else {
    // 1. Driving License
    if (licNum) {
      const dlCalc = licExp
        ? getCountdownText(licExp)
        : { status: "Valid", countdown: "Compliant" };
      docList.push({
        id: `doc_lic_${d._id || d.driverId || "1"}`,
        name: "Driving License",
        number: licNum,
        expiryDate: licExp || "N/A",
        status: dlCalc.status,
        countdown: dlCalc.countdown,
        action: dlCalc.status === "Valid" ? "Compliant" : "Remind Driver",
      });
    }

    // 2. Secondary Document if present in backend
    if (d.documents?.docname || d.documents?.docnumber) {
      const docExp = d.documents.docexpiredate
        ? new Date(d.documents.docexpiredate).toISOString().split("T")[0]
        : "";
      const docCalc = docExp
        ? getCountdownText(docExp)
        : { status: "Valid", countdown: "Compliant" };
      docList.push({
        id: `doc_sec_${d._id || d.driverId || "2"}`,
        name: d.documents.docname || "Document",
        number: d.documents.docnumber || "N/A",
        expiryDate: docExp || "N/A",
        status: docCalc.status,
        countdown: docCalc.countdown,
        action: docCalc.status === "Valid" ? "Compliant" : "Remind Driver",
      });
    }
  }

  return {
    id:
      d.driverId ||
      d.id ||
      (d._id ? `DRV-${String(d._id).slice(-4)}` : "DRV-NEW"),
    _id: d._id ? String(d._id) : undefined,
    driverId: d.driverId,
    userId: d.userId?._id || d.userId,
    name,
    email,
    phone,
    emergencyContact: d.emergencyContact || "",
    address: d.address || "",
    availabilityStatus,
    availability,
    status,
    experienceYears: Number(d.experienceYears) || 0,
    joinDate: d.createdAt
      ? new Date(d.createdAt).toISOString().split("T")[0]
      : d.joinDate || "",
    terminalHub: d.terminalHub || "",
    assignedVehicle: d.assignedVehicle || "",
    license: {
      number: licNum,
      licensenumber: licNum,
      type: licType,
      licenseClass: licType,
      issuingState: licState,
      issueDate: licIssue,
      expiryDate: licExp,
      expiredate: licExp,
      verificationStatus:
        d.license?.verificationStatus || (licNum ? "Verified" : "Pending"),
    },
    documentsList: docList,
    assignedShipments: d.assignedShipments || [],
    deliveryHistory: d.deliveryHistory || [],
    performance: d.performance || {
      onTimeRate: 0,
      rating: 0,
      totalCompletedTrips: 0,
      lifetimeDistanceKm: 0,
      safetyViolations: 0,
      fuelEfficiencyScore: 0,
    },
  };
};

const FLEET_VEHICLES = [
  "KA-01-TR-8821 (BharatBenz 2823C)",
  "TRK-8821 (Volvo FH16 - Heavy 24T)",
  "TRK-9904 (Freightliner Cascadia - 26T)",
  "VAN-4412 (Mercedes Sprinter - 3.5T)",
  "VAN-3310 (Ford Transit 350 - 4.2T)",
  "TRK-5520 (Kenworth T680 - 22T)",
];

// ============================================================================
// 1. DRIVER PROFILE CARD (Matching user's exact requested UI & Image 1)
// ============================================================================
function DriverProfileCard({ driver, onUpdateDriverContact, onToggleStatus }) {
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(driver.phone || "");
  const [email, setEmail] = useState(driver.email || "");
  const [emergencyContact, setEmergencyContact] = useState(
    driver.emergencyContact || "",
  );
  const [address, setAddress] = useState(driver.address || "");

  // Sync state if driver changes
  useEffect(() => {
    setPhone(driver.phone || "");
    setEmail(driver.email || "");
    setEmergencyContact(driver.emergencyContact || "");
    setAddress(driver.address || "");
    setIsEditing(false);
  }, [driver]);

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateDriverContact(driver.id, {
      phone,
      email,
      emergencyContact,
      address,
    });
    setIsEditing(false);
  };

  const getFirstLetter = (name) => {
    if (!name) return "D";
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "1rem",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
          {/* Replaced profile photo with Name first letter as requested */}
          <div className="drv-avatar-initial" title={driver.name}>
            {getFirstLetter(driver.name)}
          </div>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <h2
                style={{
                  fontSize: "1.35rem",
                  color: "var(--color)",
                  margin: 0,
                }}
              >
                {driver.name}
              </h2>
              <span
                className="badge"
                style={
                  isDriverActive(driver)
                    ? {
                        backgroundColor: "#dcfce7",
                        color: "#15803d",
                        border: "1px solid #bbf7d0",
                      }
                    : {
                        backgroundColor: "#fee2e2",
                        color: "#b91c1c",
                        border: "1px solid #fecaca",
                      }
                }
              >
                ● {isDriverActive(driver) ? "Active" : "Inactive"}
              </span>
              <span
                className={`badge ${
                  !isDriverActive(driver)
                    ? "badge-unavailable"
                    : driver.availabilityStatus === "Available" ||
                        driver.availability === "available"
                      ? "badge-available"
                      : driver.availabilityStatus === "On Trip" ||
                          driver.availability === "assigned"
                        ? "badge-assigned"
                        : "badge-unavailable"
                }`}
              >
                ●{" "}
                {!isDriverActive(driver)
                  ? "Unavailable"
                  : driver.availabilityStatus ||
                    (driver.availability === "available"
                      ? "Available"
                      : "On Trip")}
              </span>
            </div>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                margin: "4px 0 0",
              }}
            >
              ID: {driver.id}{" "}
              {driver.joinDate || driver.dateJoined
                ? `• Joined ${driver.joinDate || driver.dateJoined}`
                : ""}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit2 size={14} /> {isEditing ? "Cancel" : "Edit Contact Details"}
          </button>
          {onToggleStatus &&
            (isDriverActive(driver) ? (
              <button
                type="button"
                onClick={() => onToggleStatus(driver)}
                className="btn btn-ghost btn-sm"
                style={{
                  color: "var(--danger, #dc2626)",
                  borderColor: "var(--danger, #dc2626)",
                }}
              >
                <UserMinus size={14} />
                <span>Deactivate</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onToggleStatus(driver)}
                className="btn btn-primary btn-sm"
              >
                <UserPlus size={14} />
                <span>Activate</span>
              </button>
            ))}
        </div>
      </div>

      {isEditing && (
        <form
          onSubmit={handleSave}
          style={{
            backgroundColor: "var(--bg)",
            padding: "1rem",
            borderRadius: "var(--radius-md, 8px)",
            marginBottom: "1rem",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.85rem",
            }}
          >
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: "0.75rem" }}>
            <label className="form-label">Emergency Contact</label>
            <input
              type="text"
              className="form-input"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ marginTop: "0.75rem" }}>
            <label className="form-label">Address</label>
            <input
              type="text"
              className="form-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
              marginTop: "1rem",
            }}
          >
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Save Changes
            </button>
          </div>
        </form>
      )}

      {/* Requirement Points 1 & 2 (Matching Image 1) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {/* Contact Details */}
        <div
          style={{
            backgroundColor: "#fafafa",
            padding: "1rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
          }}
        >
          <h4
            style={{
              fontSize: "0.9rem",
              marginBottom: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              borderBottom: "1px solid var(--border)",
              paddingBottom: "0.35rem",
              color: "#0f172a",
              fontWeight: 700,
            }}
          >
            <Phone size={16} color="var(--primary-color)" /> Contact & Emergency
            Details
          </h4>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              fontSize: "0.85rem",
              color: "#334155",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Phone size={13} color="#64748b" /> Phone:{" "}
              <strong>{driver.phone || "Not provided"}</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Mail size={13} color="#64748b" /> Email:{" "}
              <span>{driver.email || "Not provided"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertCircle size={13} color="var(--cta-but, #ea580c)" />{" "}
              Emergency:{" "}
              <strong>{driver.emergencyContact || "Not provided"}</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <MapPin size={13} color="#64748b" /> Address:{" "}
              <span>{driver.address || "Not provided"}</span>
            </div>
          </div>
        </div>

        {/* Driving License Info */}
        <div
          style={{
            backgroundColor: "#fafafa",
            padding: "1rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
          }}
        >
          <h4
            style={{
              fontSize: "0.9rem",
              marginBottom: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              borderBottom: "1px solid var(--border)",
              paddingBottom: "0.35rem",
              color: "#0f172a",
              fontWeight: 700,
            }}
          >
            <CreditCard size={16} color="var(--primary-color)" /> Driving
            License Information
          </h4>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              fontSize: "0.85rem",
              color: "#334155",
            }}
          >
            <div>
              License No:{" "}
              <span
                style={{
                  fontFamily: "monospace",
                  fontWeight: 700,
                  color: "var(--primary-color)",
                }}
              >
                {driver.license?.number ||
                  driver.license?.licensenumber ||
                  "Not available"}
              </span>
            </div>
            <div>
              Category:{" "}
              <strong>
                {driver.license?.type ||
                  driver.license?.licenseClass ||
                  "Not specified"}
              </strong>
            </div>
            <div>
              Issuing State:{" "}
              <span>{driver.license?.issuingState || "Not specified"}</span>
            </div>
            <div>
              Valid Dates:{" "}
              <span>
                {driver.license?.issueDate || "N/A"} →{" "}
                <strong style={{ color: "var(--cta-but, #ea580c)" }}>
                  {driver.license?.expiryDate ||
                    driver.license?.expiredate ||
                    "N/A"}
                </strong>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              Verification:{" "}
              <span
                className={`badge ${driver.license?.verificationStatus === "Verified" ? "badge-valid" : "badge-unavailable"}`}
              >
                <CheckCircle size={11} /> RTO{" "}
                {driver.license?.verificationStatus || "Pending"}
              </span>
            </div>
          </div>
        </div>

        {/* Live Assigned Shipment Overview Card */}
        {driver.assignedShipments && driver.assignedShipments.length > 0 && (
          <div
            style={{
              backgroundColor: "#f0fdf4",
              padding: "1rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid #bbf7d0",
            }}
          >
            <h4
              style={{
                fontSize: "0.9rem",
                marginBottom: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                borderBottom: "1px solid #bbf7d0",
                paddingBottom: "0.35rem",
                color: "#166534",
                fontWeight: 700,
              }}
            >
              <Truck size={16} color="#16a34a" /> Currently Assigned Manifest
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                fontSize: "0.85rem",
                color: "#1e293b",
              }}
            >
              <div>
                Tracking No:{" "}
                <span
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: "var(--primary-color)",
                  }}
                >
                  {driver.assignedShipments[0].trackingId}
                </span>
              </div>
              <div>
                Customer:{" "}
                <strong>{driver.assignedShipments[0].customerName}</strong>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                Route: <span>{driver.assignedShipments[0].senderCity}</span> →{" "}
                <span>{driver.assignedShipments[0].receiverCity}</span>
              </div>
              <div>
                Status:{" "}
                <span className="badge badge-assigned">
                  {driver.assignedShipments[0].status
                    ?.replace(/_/g, " ")
                    .toUpperCase() || "DISPATCHED"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 2. DOCUMENT EXPIRY TRACKER (Matching Image 2 exact table)
// ============================================================================
function DocumentExpiryTracker({ driver, onSendReminder }) {
  const docs = driver.documentsList || [];

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="drv-doc-table">
        <thead>
          <tr>
            <th>DOCUMENT NAME</th>
            <th>DOCUMENT NUMBER</th>
            <th>EXPIRY DATE</th>
            <th>STATUS</th>
            <th>COUNTDOWN</th>
            <th style={{ textAlign: "right" }}>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {docs.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                style={{
                  textAlign: "center",
                  padding: "2.5rem 1rem",
                  color: "var(--text-muted, #64748b)",
                }}
              >
                <FileText
                  size={26}
                  style={{
                    opacity: 0.4,
                    display: "block",
                    margin: "0 auto 8px",
                  }}
                />
                <p
                  style={{
                    margin: "0 0 4px",
                    fontWeight: 600,
                    color: "#334155",
                  }}
                >
                  No documents found
                </p>
                <span style={{ fontSize: "12px" }}>
                  No compliance or license documents uploaded for this driver.
                </span>
              </td>
            </tr>
          ) : (
            docs.map((doc) => {
              const isExpiring = doc.status === "Expiring Soon";
              const isExpired = doc.status === "Expired";
              const isValid = doc.status === "Valid";

              return (
                <tr key={doc.id || doc.name}>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <FileText
                        size={16}
                        color={
                          isExpired
                            ? "#ef4444"
                            : isExpiring
                              ? "#f59e0b"
                              : "#2563eb"
                        }
                      />
                      <strong style={{ color: "#1e293b" }}>{doc.name}</strong>
                    </div>
                  </td>
                  <td style={{ fontFamily: "monospace", color: "#475569" }}>
                    {doc.number || "—"}
                  </td>
                  <td style={{ color: "#334155", fontWeight: 500 }}>
                    {doc.expiryDate || "—"}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        isValid
                          ? "badge-valid"
                          : isExpiring
                            ? "badge-expiring"
                            : "badge-expired"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontWeight: 600,
                        color: isExpired
                          ? "#dc2626"
                          : isExpiring
                            ? "#d97706"
                            : "#16a34a",
                      }}
                    >
                      <Clock size={13} />
                      {doc.countdown}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {doc.action === "Remind Driver" ? (
                      <button
                        type="button"
                        className="btn-remind"
                        onClick={() => onSendReminder(doc.name)}
                      >
                        <Bell size={13} /> Remind Driver
                      </button>
                    ) : (
                      <span
                        style={{
                          color: "#16a34a",
                          fontWeight: 700,
                          fontSize: "12px",
                        }}
                      >
                        Compliant
                      </span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// 3. ASSIGNED SHIPMENTS TAB
// ============================================================================
function AssignedShipments({ driver, loading, onRefresh, onOpenAssignModal }) {
  const shipments = driver.assignedShipments || [];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#334155" }}>
            Active Dispatched Manifests ({shipments.length})
          </h4>
          {onRefresh && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh assigned shipments from server"
              style={{
                padding: "4px 8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              <span style={{ fontSize: "11px" }}>Sync API</span>
            </button>
          )}
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onOpenAssignModal}
        >
          <Truck size={14} /> Assign New Shipment
        </button>
      </div>

      {loading ? (
        <div className="drv-empty-state" style={{ padding: "3rem 1rem" }}>
          <RefreshCw
            size={24}
            className="animate-spin"
            style={{
              color: "var(--primary-color)",
              margin: "0 auto 10px",
              display: "block",
            }}
          />
          <p className="drv-empty-state__title">
            Loading assigned shipments...
          </p>
          <p className="drv-empty-state__text">
            Fetching live manifests from /drivers/:id/shipments
          </p>
        </div>
      ) : shipments.length === 0 ? (
        <div className="drv-empty-state">
          <Truck className="drv-empty-state__icon" />
          <p className="drv-empty-state__title">No active shipments assigned</p>
          <p className="drv-empty-state__text">
            Driver is ready and available for trip dispatch.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {shipments.map((shp) => (
            <div
              key={shp._id || shp.trackingId}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "14px",
                backgroundColor: "#ffffff",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 700,
                      color: "var(--primary-color)",
                      fontSize: "14px",
                    }}
                  >
                    {shp.trackingId}
                  </span>
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: "12px",
                      marginLeft: "8px",
                    }}
                  >
                    • {shp.customerName}
                  </span>
                  {shp.priority && (
                    <span
                      className="badge"
                      style={{
                        marginLeft: "8px",
                        fontSize: "11px",
                        backgroundColor: "#f1f5f9",
                        color: "#475569",
                      }}
                    >
                      {shp.priority}
                    </span>
                  )}
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span className="badge badge-assigned">
                    {shp.status
                      ? shp.status.replace(/_/g, " ").toUpperCase()
                      : "IN TRANSIT"}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              >
                <span>{shp.senderCity}</span>
                <ArrowRight size={14} color="var(--primary-color)" />
                <span>{shp.receiverCity}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  color: "#64748b",
                  flexWrap: "wrap",
                  gap: "6px",
                }}
              >
                <span>
                  Cargo: <strong>{shp.cargoDesc}</strong> ({shp.weight} kg,{" "}
                  {shp.packageCount} pcs)
                </span>
                <span>
                  Expected Delivery: <strong>{shp.eta || "Scheduled"}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 4. DELIVERY HISTORY TAB
// ============================================================================
function DeliveryHistory({ driver }) {
  const history = driver.deliveryHistory || [];

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#334155" }}>
          Past Trip Logs & Signed Deliveries ({history.length})
        </h4>
      </div>

      {history.length === 0 ? (
        <div className="drv-empty-state">
          <History className="drv-empty-state__icon" />
          <p className="drv-empty-state__title">No past trips recorded yet</p>
          <p className="drv-empty-state__text">
            Completed trips with electronic proof of delivery will be archived
            here.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="drv-table">
            <thead>
              <tr>
                <th>Trip ID / Date</th>
                <th>Route Flow</th>
                <th>Shipment Ref</th>
                <th>Distance</th>
                <th>Status</th>
                <th>Proof of Delivery</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={h.tripId || i} className="drv-table__row">
                  <td>
                    <strong>{h.tripId}</strong>
                    <span className="drv-cell-sub">{h.date}</span>
                  </td>
                  <td>
                    <strong>{h.route}</strong>
                    <span className="drv-cell-sub">To: {h.recipient}</span>
                  </td>
                  <td style={{ fontFamily: "monospace", fontWeight: 600 }}>
                    {h.shipmentTracking}
                  </td>
                  <td>
                    <strong>{h.distanceKm} km</strong>
                  </td>
                  <td>
                    <span className="badge badge-valid">
                      <CheckCircle2 size={10} /> {h.status}
                    </span>
                  </td>
                  <td>
                    {h.podSigned ? (
                      <span
                        style={{
                          color: "#166534",
                          fontWeight: 600,
                          fontSize: "12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Check size={13} /> Verified
                      </span>
                    ) : (
                      <span style={{ color: "#64748b", fontSize: "12px" }}>
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 5. DRIVER PERFORMANCE TAB
// ============================================================================
function DriverPerformance({ driver }) {
  const perf = driver.performance || {
    totalTrips: 0,
    deliveredTrips: 0,
    successRate: 0,
  };

  const totalTrips = perf.totalTrips ?? perf.totalCompletedTrips ?? 0;
  const deliveredTrips = perf.deliveredTrips ?? 0;
  const rawSuccessRate =
    perf.successRate !== undefined
      ? perf.successRate
      : totalTrips > 0
        ? (deliveredTrips / totalTrips) * 100
        : 0;
  const successRate = Number(rawSuccessRate || 0).toFixed(1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ marginBottom: "0.25rem" }}>
        <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#334155" }}>
          Performance Metrics
        </h4>
      </div>

      <div className="drv-score-grid">
        {/* Total Trips */}
        <div className="drv-score-box">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#2563eb",
              marginBottom: "4px",
            }}
          >
            <Truck size={18} />
          </div>
          <span className="drv-score-box__val" style={{ color: "#2563eb" }}>
            {totalTrips}
          </span>
          <span className="drv-score-box__lbl">Total Trips</span>
          <span
            style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}
          >
            All assigned shipments
          </span>
        </div>

        {/* Delivered Trips */}
        <div className="drv-score-box">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#16a34a",
              marginBottom: "4px",
            }}
          >
            <CheckCircle2 size={18} />
          </div>
          <span className="drv-score-box__val" style={{ color: "#16a34a" }}>
            {deliveredTrips}
          </span>
          <span className="drv-score-box__lbl">Delivered Trips</span>
          <span
            style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}
          >
            Successfully delivered
          </span>
        </div>

        {/* Success Rate */}
        <div className="drv-score-box">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#0f172a",
              marginBottom: "4px",
            }}
          >
            <Activity size={18} />
          </div>
          <span
            className="drv-score-box__val"
            style={{
              color:
                Number(successRate) >= 80
                  ? "#16a34a"
                  : Number(successRate) >= 50
                    ? "#ea580c"
                    : "#dc2626",
            }}
          >
            {successRate}%
          </span>
          <span className="drv-score-box__lbl">Success Rate</span>
          <div className="drv-progress-bar">
            <div
              className="drv-progress-bar__fill"
              style={{
                width: `${Math.min(100, Math.max(0, Number(successRate)))}%`,
                backgroundColor:
                  Number(successRate) >= 80
                    ? "#16a34a"
                    : Number(successRate) >= 50
                      ? "#ea580c"
                      : "#dc2626",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. ASSIGN TRIP MODAL
// ============================================================================
function AssignTripModal({ driver, isOpen, onClose, onAssign }) {
  const [tripData, setTripData] = useState({
    tripId: `TRP-${Math.floor(1000 + Math.random() * 9000)}`,
    routeOrigin: "",
    routeDestination: "",
    vehicle: driver?.assignedVehicle || "",
    departureDate: new Date().toISOString().split("T")[0],
    departureTime: "07:00",
    arrivalDate: new Date().toISOString().split("T")[0],
    arrivalTime: "18:00",
    linkedShipmentTracking: "",
    customerName: "",
    cargoDesc: "",
    cargoWeight: "",
  });

  if (!isOpen || !driver) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onAssign(driver.id, {
      tripId: tripData.tripId,
      assignedVehicle:
        tripData.vehicle || driver?.assignedVehicle || "Unassigned",
      routeOrigin: tripData.routeOrigin,
      routeDestination: tripData.routeDestination,
      assignedShipment: {
        trackingId:
          tripData.linkedShipmentTracking ||
          `SHP-${Math.floor(700000 + Math.random() * 99999)}`,
        customerName: tripData.customerName || "Customer",
        senderCity: tripData.routeOrigin,
        receiverCity: tripData.routeDestination,
        cargoDesc: tripData.cargoDesc || "General Cargo",
        weight: Number(tripData.cargoWeight) || 0,
        packageCount: 1,
        status: "dispatched",
        eta: `${tripData.arrivalDate} at ${tripData.arrivalTime}`,
      },
    });
    onClose();
  };

  return (
    <div className="drv-modal-overlay" onClick={onClose}>
      <div
        className="drv-modal drv-modal--md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drv-modal__header">
          <h3 className="drv-modal__title">
            <Truck size={18} color="var(--primary-color)" />
            Assign Trip to {driver.name}
          </h3>
          <button type="button" className="drv-modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "contents" }}>
          <div className="drv-modal__body">
            <div className="drv-form-row">
              <div className="drv-form-group">
                <label>Trip ID</label>
                <input
                  type="text"
                  required
                  value={tripData.tripId}
                  onChange={(e) =>
                    setTripData((p) => ({ ...p, tripId: e.target.value }))
                  }
                />
              </div>
              <div className="drv-form-group">
                <label>Fleet Vehicle</label>
                <select
                  value={tripData.vehicle}
                  onChange={(e) =>
                    setTripData((p) => ({ ...p, vehicle: e.target.value }))
                  }
                >
                  <option value="">Select Fleet Vehicle...</option>
                  {FLEET_VEHICLES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="drv-form-row">
              <div className="drv-form-group">
                <label>Origin Hub</label>
                <input
                  type="text"
                  required
                  placeholder="Origin City / Terminal"
                  value={tripData.routeOrigin}
                  onChange={(e) =>
                    setTripData((p) => ({ ...p, routeOrigin: e.target.value }))
                  }
                />
              </div>
              <div className="drv-form-group">
                <label>Destination Hub</label>
                <input
                  type="text"
                  required
                  placeholder="Destination City / Hub"
                  value={tripData.routeDestination}
                  onChange={(e) =>
                    setTripData((p) => ({
                      ...p,
                      routeDestination: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="drv-form-row">
              <div className="drv-form-group">
                <label>Shipment Tracking #</label>
                <input
                  type="text"
                  placeholder="e.g. SHP-718291"
                  value={tripData.linkedShipmentTracking}
                  onChange={(e) =>
                    setTripData((p) => ({
                      ...p,
                      linkedShipmentTracking: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="drv-form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Industrial Freight Corp"
                  value={tripData.customerName}
                  onChange={(e) =>
                    setTripData((p) => ({ ...p, customerName: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="drv-modal__footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Truck size={14} /> Dispatch & Assign Trip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
// ============================================================================
// MAIN COMPONENT: DashboardDriver
// ============================================================================
export default function DashboardDriver() {
  const navigate = useNavigate();
  const [apiDrivers, setApiDrivers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [detailActiveTab, setDetailActiveTab] = useState("documents");
  const [toastMessage, setToastMessage] = useState(null);

  // Table filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [sortBy, setSortBy] = useState("name");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [deactivatingDriver, setDeactivatingDriver] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch drivers from backend API GET /drivers
  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const authToken = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/drivers`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Server responded with status ${res.status}`,
        );
      }

      const data = await res.json();
      if (data && Array.isArray(data.drivers)) {
        setApiDrivers(data.drivers.map(normalizeDriver));
      } else if (Array.isArray(data)) {
        setApiDrivers(data.map(normalizeDriver));
      } else {
        setApiDrivers([]);
      }
    } catch (err) {
      console.warn("GET /drivers failed or backend offline:", err);
      setApiError(err.message || "Failed to load drivers from server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // Active drivers list from backend API
  const drivers = useMemo(() => {
    return apiDrivers || [];
  }, [apiDrivers]);

  // Backend shipments & performance for selected driver
  const [backendDriverShipments, setBackendDriverShipments] = useState(null);
  const [backendPerformance, setBackendPerformance] = useState(null);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);

  const fetchDriverShipments = useCallback(async (target) => {
    if (!target) {
      setBackendDriverShipments(null);
      setBackendPerformance(null);
      return;
    }

    const authToken = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    setShipmentsLoading(true);

    const driverMongoId = target._id;
    const driverCode = target.driverId || target.id;
    const primaryId =
      driverMongoId && driverMongoId.length === 24 ? driverMongoId : driverCode;

    try {
      let fetchedShipments = null;

      if (primaryId) {
        const res = await fetch(
          `${API_BASE_URL}/drivers/${primaryId}/shipments`,
          {
            method: "GET",
            headers,
          },
        );
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.shipments)) {
            fetchedShipments = data.shipments;
          }
        }
      }

      // If primary lookup returned 0 shipments and secondary driverCode exists and differs, check secondary
      if (
        (!fetchedShipments || fetchedShipments.length === 0) &&
        driverCode &&
        driverCode !== primaryId
      ) {
        try {
          const res2 = await fetch(
            `${API_BASE_URL}/drivers/${driverCode}/shipments`,
            {
              method: "GET",
              headers,
            },
          );
          if (res2.ok) {
            const data2 = await res2.json();
            if (
              data2 &&
              Array.isArray(data2.shipments) &&
              data2.shipments.length > 0
            ) {
              fetchedShipments = data2.shipments;
            }
          }
        } catch {
          // ignore secondary fetch failure
        }
      }

      if (fetchedShipments) {
        setBackendDriverShipments(
          fetchedShipments.map((s) => ({
            _id: s._id,
            shipmentId: s.shipmentId,
            trackingId: s.trackingId || s.shipmentId || "TRK-UNKNOWN",
            customerName: s.receiverName || s.customerName || "Customer",
            senderName: s.senderName,
            senderCity: s.senderCity || s.senderAddress || "Origin Hub",
            receiverCity:
              s.receiverCity || s.receiverAddress || "Destination Hub",
            cargoDesc: s.packageDescription || s.cargoDesc || "General Cargo",
            weight: s.totalWeight || s.weight || 0,
            distanceKm: s.distanceKm || s.distance || 0,
            packageCount: s.packageCount || 1,
            priority: s.priority || "Standard",
            status: s.status || "in_transit",
            eta: s.expectedDeliveryDate
              ? new Date(s.expectedDeliveryDate).toLocaleDateString()
              : "Scheduled",
            vehicleNo: s.vehicleNo,
            tripNo: s.tripNo,
          })),
        );
      } else {
        setBackendDriverShipments([]);
      }
    } catch (err) {
      console.warn("Error fetching /drivers/:id/shipments:", err);
      setBackendDriverShipments([]);
    } finally {
      setShipmentsLoading(false);
    }

    // Performance fetch from /drivers/:id/performance
    if (primaryId) {
      fetch(`${API_BASE_URL}/drivers/${primaryId}/performance`, {
        method: "GET",
        headers,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data.totalTrips === "number") {
            setBackendPerformance({
              totalTrips: data.totalTrips,
              deliveredTrips: data.deliveredTrips,
              successRate:
                data.successRate !== undefined
                  ? Number(data.successRate.toFixed(1))
                  : 0,
            });
          }
        })
        .catch(() => setBackendPerformance(null));
    }
  }, []);

  useEffect(() => {
    if (!selectedDriverId) {
      setBackendDriverShipments(null);
      setBackendPerformance(null);
      return;
    }

    const target = drivers.find(
      (d) => d.id === selectedDriverId || d._id === selectedDriverId,
    );

    if (target) {
      fetchDriverShipments(target);
    } else {
      setBackendDriverShipments(null);
      setBackendPerformance(null);
    }
  }, [drivers, selectedDriverId, fetchDriverShipments]);

  // Selected driver object
  const selectedDriver = useMemo(() => {
    if (!selectedDriverId) return null;
    const base = drivers.find(
      (d) => d.id === selectedDriverId || d._id === selectedDriverId,
    );
    if (!base) return null;

    const allShipments =
      backendDriverShipments !== null
        ? backendDriverShipments
        : base.assignedShipments || [];

    const activeShipments = allShipments.filter(
      (s) => (s.status || "").toLowerCase() !== "delivered",
    );

    const deliveredShipments = allShipments.filter(
      (s) => (s.status || "").toLowerCase() === "delivered",
    );

    const mappedDeliveredHistory = deliveredShipments.map((s) => ({
      tripId:
        s.tripNo || s.shipmentId || `TRP-${String(s._id || "").slice(-4)}`,
      date: s.eta || "Completed",
      route: `${s.senderCity} → ${s.receiverCity}`,
      shipmentTracking: s.trackingId,
      status: "Delivered",
      recipient: s.customerName,
      podSigned: true,
      distanceKm: s.distanceKm || s.weight || 0,
      cargoDesc: s.cargoDesc,
    }));

    const existingHistory = base.deliveryHistory || [];
    const combinedHistory = [
      ...mappedDeliveredHistory,
      ...existingHistory.filter(
        (h) =>
          !mappedDeliveredHistory.some(
            (m) => m.shipmentTracking === h.shipmentTracking,
          ),
      ),
    ];

    return {
      ...base,
      assignedShipments: activeShipments,
      deliveryHistory: combinedHistory,
      performance:
        backendPerformance !== null
          ? backendPerformance
          : base.performance || {
              totalTrips: 0,
              deliveredTrips: 0,
              successRate: 0,
            },
    };
  }, [drivers, selectedDriverId, backendDriverShipments, backendPerformance]);

  // Confirm Status Toggle handler (with backend PATCH /drivers/:id/status integration)
  const handleConfirmStatusToggle = async () => {
    if (deactivatingDriver) {
      const isCurrentlyActive = isDriverActive(deactivatingDriver);
      const newStatus = isCurrentlyActive ? "inactive" : "active";
      const targetMongoId = deactivatingDriver._id;

      let backendSuccess = false;
      if (targetMongoId && targetMongoId.length === 24) {
        try {
          const authToken = localStorage.getItem("token");
          const res = await fetch(
            `${API_BASE_URL}/drivers/${targetMongoId}/status`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
              },
            },
          );
          if (res.ok) {
            backendSuccess = true;
            await fetchDrivers();
          }
        } catch (err) {
          console.warn("PATCH /drivers/:id/status failed:", err);
        }
      }

      if (!backendSuccess) {
        setApiDrivers((prev) => {
          const list = prev || [];
          return list.map((d) => {
            if (d.id === deactivatingDriver.id) {
              return {
                ...d,
                status: newStatus,
                availabilityStatus: isCurrentlyActive
                  ? "Unavailable"
                  : d.assignedShipments?.length > 0
                    ? "On Trip"
                    : "Available",
                availability: isCurrentlyActive
                  ? "unavailable"
                  : d.assignedShipments?.length > 0
                    ? "assigned"
                    : "available",
              };
            }
            return d;
          });
        });
      }

      showToast(`Driver status changed to ${newStatus.toUpperCase()}`);
      setDeactivatingDriver(null);
    }
  };

  // Update contact details handler
  const handleUpdateDriverContact = async (driverId, updatedContact) => {
    const target = drivers.find((d) => d.id === driverId);
    if (target?._id && target._id.length === 24) {
      try {
        const authToken = localStorage.getItem("token");
        await fetch(`${API_BASE_URL}/drivers/${target._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({
            phonenumber: updatedContact.phone,
            phone: updatedContact.phone,
            email: updatedContact.email,
            address: updatedContact.address,
            emergencyContact: updatedContact.emergencyContact,
          }),
        });
      } catch (err) {
        console.warn("PUT /drivers/:id failed:", err);
      }
    }

    setApiDrivers((prev) => {
      const list = prev || [];
      return list.map((d) => {
        if (d.id === driverId) {
          return {
            ...d,
            phone: updatedContact.phone,
            email: updatedContact.email,
            emergencyContact: updatedContact.emergencyContact,
            address: updatedContact.address,
          };
        }
        return d;
      });
    });
    showToast("Driver contact details updated successfully.");
  };

  // Send reminder handler
  const handleSendReminder = (docName) => {
    showToast(
      `Renewal reminder notification sent to ${selectedDriver?.name} for ${docName}.`,
    );
  };

  // Complete shipment handler
  const handleCompleteShipment = async (trackingId, shipmentMongoId) => {
    if (!selectedDriver) return;

    // Call backend PATCH /shipments/:id/status if available
    const targetShipmentId = shipmentMongoId || trackingId;
    if (targetShipmentId) {
      try {
        const authToken = localStorage.getItem("token");
        await fetch(`${API_BASE_URL}/shipments/${targetShipmentId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({ status: "delivered" }),
        });
      } catch (err) {
        console.warn("PATCH /shipments/:id/status failed:", err);
      }
    }

    setBackendDriverShipments((prev) => {
      if (!prev) return [];
      return prev.filter(
        (s) => s.trackingId !== trackingId && s._id !== shipmentMongoId,
      );
    });

    setApiDrivers((prev) => {
      const list = prev || [];
      return list.map((d) => {
        if (d.id === selectedDriver.id || d._id === selectedDriver._id) {
          const currentList = d.assignedShipments || [];
          const completed = currentList.find(
            (s) => s.trackingId === trackingId || s._id === shipmentMongoId,
          );
          const remaining = currentList.filter(
            (s) => s.trackingId !== trackingId && s._id !== shipmentMongoId,
          );
          const newHistory = completed
            ? [
                {
                  tripId: `TRP-${Math.floor(1000 + Math.random() * 9000)}`,
                  date: new Date().toISOString().split("T")[0],
                  route: `${completed.senderCity} → ${completed.receiverCity}`,
                  shipmentTracking: completed.trackingId,
                  status: "Delivered On-Time",
                  recipient: completed.customerName,
                  podSigned: true,
                  distanceKm: 280,
                },
                ...(d.deliveryHistory || []),
              ]
            : d.deliveryHistory;

          return {
            ...d,
            assignedShipments: remaining,
            deliveryHistory: newHistory,
            availabilityStatus:
              remaining.length === 0 ? "Available" : "On Trip",
            availability: remaining.length === 0 ? "available" : "assigned",
          };
        }
        return d;
      });
    });
    showToast(`Shipment ${trackingId} marked delivered.`);
  };

  // Assign trip handler
  const handleAssignTrip = async (driverId, payload) => {
    const target = drivers.find((d) => d.id === driverId || d._id === driverId);
    if (target?._id && target._id.length === 24) {
      try {
        const authToken = localStorage.getItem("token");
        await fetch(`${API_BASE_URL}/drivers/${target._id}/availability`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({ availability: "assigned" }),
        });
      } catch (err) {
        console.warn("PATCH /drivers/:id/availability failed:", err);
      }
    }

    setApiDrivers((prev) => {
      const list = prev || [];
      return list.map((d) => {
        if (d.id === driverId || d._id === driverId) {
          return {
            ...d,
            availabilityStatus: "On Trip",
            availability: "assigned",
            assignedVehicle: payload.assignedVehicle,
            assignedShipments: [
              payload.assignedShipment,
              ...(d.assignedShipments || []),
            ],
          };
        }
        return d;
      });
    });

    setBackendDriverShipments((prev) => [
      payload.assignedShipment,
      ...(prev || []),
    ]);
    showToast(`Trip ${payload.tripId} successfully dispatched.`);
  };

  // KPI calculations
  const stats = useMemo(() => {
    let available = 0;
    let assigned = 0;
    let expiringDocs = 0;

    drivers.forEach((d) => {
      if (
        d.availabilityStatus === "Available" ||
        d.availability === "available"
      ) {
        available++;
      } else {
        assigned++;
      }

      if (d.documentsList?.some((doc) => doc.status !== "Valid")) {
        expiringDocs++;
      }
    });

    return {
      total: drivers.length,
      available,
      assigned,
      expiringDocs,
    };
  }, [drivers]);

  // Filtering
  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      if (
        activeTab === "available" &&
        d.availability !== "available" &&
        d.availabilityStatus !== "Available"
      ) {
        return false;
      }
      if (
        activeTab === "assigned" &&
        d.availability !== "assigned" &&
        d.availabilityStatus !== "On Trip"
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = d.name?.toLowerCase().includes(q);
        const matchId = d.id?.toLowerCase().includes(q);
        const matchPhone = d.phone?.toLowerCase().includes(q);
        const matchLic = (d.license?.number || d.license?.licensenumber || "")
          .toLowerCase()
          .includes(q);
        return matchName || matchId || matchPhone || matchLic;
      }

      return true;
    });
  }, [drivers, activeTab, searchQuery]);

  // =========================================================================
  // VIEW 2: ON-SCREEN DRIVER DETAILS VIEW (When a driver is clicked)
  // Similar to DashboardCustomer when selectedCustomer is set!
  // =========================================================================
  if (selectedDriver) {
    return (
      <div className="drv-container">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            style={{
              position: "fixed",
              bottom: "20px",
              right: "20px",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 18px",
              borderRadius: "10px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              fontSize: "13px",
              fontWeight: 600,
              background: "#064e3b",
              color: "#ffffff",
            }}
          >
            <CheckCircle2 size={16} />
            <span>{toastMessage.text}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Top actions & Back button (matching DashboardCustomer) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedDriverId(null)}
            className="btn btn-ghost btn-sm"
          >
            <ArrowLeft size={14} />
            <span>Back to Drivers</span>
          </button>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsAssignModalOpen(true)}
            >
              <Truck size={14} /> Assign Trip
            </button>
            {isDriverActive(selectedDriver) ? (
              <button
                type="button"
                onClick={() => setDeactivatingDriver(selectedDriver)}
                className="btn btn-ghost btn-sm"
                style={{
                  color: "var(--danger, #dc2626)",
                  borderColor: "var(--danger, #dc2626)",
                }}
              >
                <UserMinus size={14} />
                <span>Deactivate</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setDeactivatingDriver(selectedDriver)}
                className="btn btn-primary btn-sm"
              >
                <UserPlus size={14} />
                <span>Activate</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 1: Driver Profile Card (With Name first letter & edit form) */}
        <DriverProfileCard
          driver={selectedDriver}
          onUpdateDriverContact={handleUpdateDriverContact}
          onToggleStatus={(drv) => setDeactivatingDriver(drv)}
        />

        {/* Card 2: Tabs Container & Content (Matching Image 2 exact structure) */}
        <div className="card">
          <div className="tabs-container">
            <button
              className={`tab-btn ${detailActiveTab === "documents" ? "active" : ""}`}
              onClick={() => setDetailActiveTab("documents")}
            >
              <ShieldAlert size={16} /> Document Expiry Tracking
            </button>
            <button
              className={`tab-btn ${detailActiveTab === "shipments" ? "active" : ""}`}
              onClick={() => setDetailActiveTab("shipments")}
            >
              <Navigation size={16} /> Assigned Shipments (
              {selectedDriver.assignedShipments?.length || 0})
            </button>
            <button
              className={`tab-btn ${detailActiveTab === "history" ? "active" : ""}`}
              onClick={() => setDetailActiveTab("history")}
            >
              <History size={16} /> Delivery History (
              {selectedDriver.deliveryHistory?.length || 0})
            </button>
            <button
              className={`tab-btn ${detailActiveTab === "performance" ? "active" : ""}`}
              onClick={() => setDetailActiveTab("performance")}
            >
              <Activity size={16} /> Driver Performance
            </button>
          </div>

          {detailActiveTab === "documents" && (
            <DocumentExpiryTracker
              driver={selectedDriver}
              onSendReminder={handleSendReminder}
            />
          )}

          {detailActiveTab === "shipments" && (
            <AssignedShipments
              driver={selectedDriver}
              loading={shipmentsLoading}
              onRefresh={() => fetchDriverShipments(selectedDriver)}
              onOpenAssignModal={() => setIsAssignModalOpen(true)}
            />
          )}

          {detailActiveTab === "history" && (
            <DeliveryHistory driver={selectedDriver} />
          )}

          {detailActiveTab === "performance" && (
            <DriverPerformance driver={selectedDriver} />
          )}
        </div>

        {/* Assign Trip Modal */}
        <AssignTripModal
          driver={selectedDriver}
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onAssign={handleAssignTrip}
        />

        {/* Deactivate / Activate Driver Confirmation Modal */}
        {deactivatingDriver && (
          <div
            className="drv-modal-overlay"
            onClick={() => setDeactivatingDriver(null)}
          >
            <div
              className="drv-modal drv-modal--sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="drv-modal__header">
                <div>
                  <h3 className="drv-modal__title">
                    {isDriverActive(deactivatingDriver)
                      ? "Deactivate Driver?"
                      : "Activate Driver?"}
                  </h3>
                  <p className="drv-modal__subtitle">
                    {deactivatingDriver.name} ({deactivatingDriver.id})
                  </p>
                </div>
                <button
                  type="button"
                  className="drv-modal__close"
                  onClick={() => setDeactivatingDriver(null)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="drv-modal__body">
                <p
                  style={{
                    fontSize: "13px",
                    color: "hsla(0, 0%, 0%, 0.75)",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {isDriverActive(deactivatingDriver)
                    ? `Are you sure you want to deactivate ${deactivatingDriver.name}? Their account will be marked as inactive and won't be available for new trip assignments.`
                    : `Are you sure you want to activate ${deactivatingDriver.name}? Their account will be restored to active status.`}
                </p>
              </div>

              <div
                className="drv-modal__footer"
                style={{ justifyContent: "flex-end", gap: "8px" }}
              >
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setDeactivatingDriver(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn ${
                    isDriverActive(deactivatingDriver)
                      ? "btn-ghost"
                      : "btn-primary"
                  }`}
                  style={
                    isDriverActive(deactivatingDriver)
                      ? {
                          color: "var(--danger, #dc2626)",
                          borderColor: "var(--danger, #dc2626)",
                        }
                      : {}
                  }
                  onClick={handleConfirmStatusToggle}
                >
                  {isDriverActive(deactivatingDriver)
                    ? "Deactivate"
                    : "Activate"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: DRIVER DIRECTORY TABLE VIEW
  // =========================================================================
  return (
    <div className="drv-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 18px",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            fontSize: "13px",
            fontWeight: 600,
            background: "#064e3b",
            color: "#ffffff",
          }}
        >
          <CheckCircle2 size={16} />
          <span>{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="drv-header">
        <div>
          <h2 className="drv-title">Driver Management</h2>
          <p className="drv-subtitle">
            Manage commercial drivers, license credentials, document expiry, and
            route dispatching.
          </p>
        </div>

        <div className="drv-header__actions">
          <button
            type="button"
            className="drv-btn drv-btn--ghost"
            disabled={loading}
            onClick={() => {
              fetchDrivers();
              showToast("Driver directory refreshed.");
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{" "}
            Refresh
          </button>
          <button
            type="button"
            className="drv-btn drv-btn--primary"
            onClick={() => navigate("/register-user")}
          >
            <Plus size={16} /> Register Driver
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="drv-kpi-grid">
        <div className="drv-kpi-card">
          <div className="drv-kpi-card__head">
            <span className="drv-kpi-card__icon">
              <Users size={16} />
            </span>
            <span className="drv-kpi-card__title">Total Drivers</span>
          </div>
          <div className="drv-kpi-card__value">{stats.total}</div>
          <div className="drv-kpi-card__foot">
            Registered commercial operators
          </div>
        </div>

        <div className="drv-kpi-card">
          <div className="drv-kpi-card__head">
            <span className="drv-kpi-card__icon drv-kpi-card__icon--success">
              <CheckCircle2 size={16} />
            </span>
            <span className="drv-kpi-card__title">Available Now</span>
          </div>
          <div className="drv-kpi-card__value">{stats.available}</div>
          <div className="drv-kpi-card__foot">Ready for trip dispatch</div>
        </div>

        <div className="drv-kpi-card">
          <div className="drv-kpi-card__head">
            <span className="drv-kpi-card__icon drv-kpi-card__icon--info">
              <Truck size={16} />
            </span>
            <span className="drv-kpi-card__title">Active on Trips</span>
          </div>
          <div className="drv-kpi-card__value">{stats.assigned}</div>
          <div className="drv-kpi-card__foot">
            En-route on transit corridors
          </div>
        </div>

        <div className="drv-kpi-card">
          <div className="drv-kpi-card__head">
            <span className="drv-kpi-card__icon drv-kpi-card__icon--warning">
              <AlertTriangle size={16} />
            </span>
            <span className="drv-kpi-card__title">Doc Expiry Alerts</span>
          </div>
          <div className="drv-kpi-card__value">{stats.expiringDocs}</div>
          <div className="drv-kpi-card__foot">Require renewal attention</div>
        </div>
      </div>

      {/* Filter & Control Bar */}
      <div className="drv-control-bar">
        <div className="drv-tabs">
          {[
            { key: "All", label: "All Drivers", count: stats.total },
            { key: "available", label: "Available", count: stats.available },
            { key: "assigned", label: "On Trip", count: stats.assigned },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`drv-tab ${activeTab === tab.key ? "drv-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span className="drv-tab__count">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="drv-filters-right">
          <div className="drv-search-box">
            <span className="drv-search-icon">
              <Search size={14} />
            </span>
            <input
              type="search"
              placeholder="Search driver, ID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="drv-search-clear"
                onClick={() => setSearchQuery("")}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="drv-table-card">
        <div className="drv-table-wrap">
          <table className="drv-table">
            <thead>
              <tr>
                <th>Driver Name</th>
                <th>Contact Details</th>
                <th>Driving License</th>
                <th>Availability</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && drivers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ textAlign: "center", padding: "36px" }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#64748b",
                      }}
                    >
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Loading drivers from server...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDrivers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ textAlign: "center", padding: "36px" }}
                  >
                    <p style={{ margin: 0, color: "#64748b" }}>
                      No drivers found matching your search.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((drv) => (
                  <tr key={drv.id} className="drv-table__row">
                    {/* Driver Name with avatar initial */}
                    <td>
                      <div className="drv-profile-cell">
                        <div
                          className="drv-avatar"
                          style={{ fontSize: "15px" }}
                        >
                          {drv.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <button
                            type="button"
                            className="drv-name-link"
                            onClick={() => setSelectedDriverId(drv.id)}
                          >
                            {drv.name}
                          </button>
                          <div>
                            <span className="drv-id-badge">{drv.id}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td>
                      <p className="drv-cell-title">{drv.phone}</p>
                      <span className="drv-cell-sub">{drv.email}</span>
                    </td>

                    {/* License */}
                    <td>
                      <p
                        className="drv-cell-title"
                        style={{ fontFamily: "monospace", color: "#1d4ed8" }}
                      >
                        {drv.license?.number || drv.license?.licensenumber}
                      </p>
                      <span className="drv-cell-sub">
                        {drv.license?.type || drv.license?.licenseClass}
                      </span>
                    </td>

                    {/* Availability */}
                    <td>
                      <span
                        className={`badge ${
                          !isDriverActive(drv)
                            ? "badge-expired"
                            : drv.availabilityStatus === "Available" ||
                                drv.availability === "available"
                              ? "badge-available"
                              : "badge-assigned"
                        }`}
                      >
                        ●{" "}
                        {!isDriverActive(drv)
                          ? "Inactive"
                          : drv.availabilityStatus || "Available"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="drv-action-btns">
                        <button
                          type="button"
                          className="drv-icon-btn drv-icon-btn--primary"
                          title="View Driver Details"
                          onClick={() => setSelectedDriverId(drv.id)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          className="drv-icon-btn drv-icon-btn--success"
                          title="Assign Trip"
                          onClick={() => {
                            setSelectedDriverId(drv.id);
                            setIsAssignModalOpen(true);
                          }}
                        >
                          <Truck size={14} />
                        </button>
                        <button
                          type="button"
                          className={`drv-icon-btn ${
                            isDriverActive(drv)
                              ? "drv-icon-btn--danger"
                              : "drv-icon-btn--success"
                          }`}
                          title={
                            isDriverActive(drv)
                              ? "Deactivate Driver"
                              : "Activate Driver"
                          }
                          onClick={() => setDeactivatingDriver(drv)}
                        >
                          {isDriverActive(drv) ? (
                            <UserMinus size={14} />
                          ) : (
                            <UserPlus size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deactivate / Activate Driver Confirmation Modal */}
      {deactivatingDriver && (
        <div
          className="drv-modal-overlay"
          onClick={() => setDeactivatingDriver(null)}
        >
          <div
            className="drv-modal drv-modal--sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drv-modal__header">
              <div>
                <h3 className="drv-modal__title">
                  {isDriverActive(deactivatingDriver)
                    ? "Deactivate Driver?"
                    : "Activate Driver?"}
                </h3>
                <p className="drv-modal__subtitle">
                  {deactivatingDriver.name} ({deactivatingDriver.id})
                </p>
              </div>
              <button
                type="button"
                className="drv-modal__close"
                onClick={() => setDeactivatingDriver(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="drv-modal__body">
              <p
                style={{
                  fontSize: "13px",
                  color: "hsla(0, 0%, 0%, 0.75)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {isDriverActive(deactivatingDriver)
                  ? `Are you sure you want to deactivate ${deactivatingDriver.name}? Their account will be marked as inactive and won't be available for new trip assignments.`
                  : `Are you sure you want to activate ${deactivatingDriver.name}? Their account will be restored to active status.`}
              </p>
            </div>

            <div
              className="drv-modal__footer"
              style={{ justifyContent: "flex-end", gap: "8px" }}
            >
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setDeactivatingDriver(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn ${
                  isDriverActive(deactivatingDriver)
                    ? "btn-ghost"
                    : "btn-primary"
                }`}
                style={
                  isDriverActive(deactivatingDriver)
                    ? {
                        color: "var(--danger, #dc2626)",
                        borderColor: "var(--danger, #dc2626)",
                      }
                    : {}
                }
                onClick={handleConfirmStatusToggle}
              >
                {isDriverActive(deactivatingDriver) ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export {
  DashboardDriver,
  DriverProfileCard,
  DocumentExpiryTracker,
  AssignedShipments,
  DeliveryHistory,
  DriverPerformance,
};
