import React, { useState, useEffect, useMemo } from "react";
import {
  FileCheck,
  ShieldCheck,
  Search,
  RefreshCw,
  Eye,
  Calendar,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  AlertTriangle,
  Download,
  Camera,
  PenTool,
  Printer,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
  ArrowRight,
  Clock,
  Package,
  Truck,
  ExternalLink,
  Check,
  FileText,
} from "lucide-react";
import "../../styles/ShipmentManagement.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const WORKFLOW_STEPS = [
  "Created",
  "Dispatched",
  "In Transit",
  "Out for Delivery",
  "Delivered",
];

export default function DashboardPod() {
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filters & Controls
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedDetails, setSelectedDetails] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchPods = async () => {
    setLoading(true);
    setFetchError(null);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/pods`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.pods)) {
        setPods(data.pods);
      } else {
        setPods([]);
        if (!res.ok) {
          setFetchError(
            data.message || "Failed to load Proof of Delivery records",
          );
        }
      }
    } catch (err) {
      console.warn("Error fetching POD list:", err);
      setFetchError("Unable to connect to the server to fetch POD records.");
      setPods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPods();
  }, []);

  // Compute KPI Statistics
  const stats = useMemo(() => {
    const total = pods.length;
    const otpVerified = pods.filter((p) => p.otpVerified !== false).length;
    const withPhoto = pods.filter((p) => Boolean(p.photoUrl || p.photo)).length;
    const withSignature = pods.filter((p) =>
      Boolean(p.signatureUrl || p.signatureData),
    ).length;
    return { total, otpVerified, withPhoto, withSignature };
  }, [pods]);

  // Tab and Secondary Filtering
  const filteredAndSortedPods = useMemo(() => {
    let result = pods.filter((p) => {
      // 1. Tab filter
      if (activeTab === "OTP Verified" && p.otpVerified === false) {
        return false;
      }
      if (activeTab === "With Photo" && !Boolean(p.photoUrl || p.photo)) {
        return false;
      }
      if (
        activeTab === "With Signature" &&
        !Boolean(p.signatureUrl || p.signatureData)
      ) {
        return false;
      }

      // 2. Verification dropdown filter
      if (verificationFilter === "OTP" && p.otpVerified === false) {
        return false;
      }
      if (verificationFilter === "Standard" && p.otpVerified !== false) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const shp = p.shipmentId || {};
        const q = searchQuery.toLowerCase().trim();

        const trackingId = String(
          shp.trackingId || shp.shipmentId || p.shipmentId || "",
        ).toLowerCase();
        const recName = String(
          p.receiver?.name || p.recipientName || shp.receiverName || "",
        ).toLowerCase();
        const recPhone = String(
          p.receiver?.phone ||
            p.recipientPhone ||
            shp.receiverPhoneNumber ||
            "",
        ).toLowerCase();
        const drvName = String(
          p.submittedBy?.name || shp.driverName?.userId?.name || "",
        ).toLowerCase();
        const address = String(
          p.deliveryAddress || p.location || shp.receiverAddress || "",
        ).toLowerCase();

        const matches =
          trackingId.includes(q) ||
          recName.includes(q) ||
          recPhone.includes(q) ||
          drvName.includes(q) ||
          address.includes(q);

        if (!matches) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "oldest") {
        const dateA = new Date(a.deliveryDate || a.createdAt || 0);
        const dateB = new Date(b.deliveryDate || b.createdAt || 0);
        return dateA - dateB;
      }
      if (sortBy === "recipient") {
        const nameA = String(a.receiver?.name || a.recipientName || "");
        const nameB = String(b.receiver?.name || b.recipientName || "");
        return nameA.localeCompare(nameB);
      }
      if (sortBy === "tracking") {
        const trkA = String(a.shipmentId?.trackingId || a.shipmentId || "");
        const trkB = String(b.shipmentId?.trackingId || b.shipmentId || "");
        return trkA.localeCompare(trkB);
      }
      // default: newest
      const dateA = new Date(a.deliveryDate || a.createdAt || 0);
      const dateB = new Date(b.deliveryDate || b.createdAt || 0);
      return dateB - dateA;
    });

    return result;
  }, [pods, activeTab, verificationFilter, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPods.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(
    startIndex + rowsPerPage,
    filteredAndSortedPods.length,
  );
  const displayedPods = useMemo(() => {
    return filteredAndSortedPods.slice(startIndex, endIndex);
  }, [filteredAndSortedPods, startIndex, endIndex]);

  // Helper date formatter
  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    if (pods.length === 0) {
      showToast("No POD records to export", "info");
      return;
    }

    const headers = [
      "Tracking ID",
      "Recipient Name",
      "Relation",
      "Recipient Phone",
      "Confirmed Address",
      "Delivery Date",
      "Delivery Time",
      "OTP Verified",
      "Signature Collected",
      "Photo Proof Captured",
      "Delivered By",
      "Remarks",
    ];

    const rows = pods.map((p) => {
      const shp = p.shipmentId || {};
      const trk = shp.trackingId || shp.shipmentId || p.shipmentId || "—";
      const name =
        p.receiver?.name || p.recipientName || shp.receiverName || "—";
      const rel = p.receiver?.relationship || p.recipientRelation || "Customer";
      const phone =
        p.receiver?.phone || p.recipientPhone || shp.receiverPhoneNumber || "—";
      const addr =
        p.deliveryAddress || p.location || shp.receiverAddress || "—";
      const d = p.deliveryDate || p.createdAt;
      const dateStr = d ? new Date(d).toLocaleDateString() : "—";
      const timeStr = d ? new Date(d).toLocaleTimeString() : "—";
      const otp = p.otpVerified !== false ? "YES" : "NO";
      const sig = Boolean(p.signatureUrl || p.signatureData) ? "YES" : "NO";
      const photo = Boolean(p.photoUrl || p.photo) ? "YES" : "NO";
      const driver =
        p.submittedBy?.name || shp.driverName?.userId?.name || "Driver";
      const notes = p.notes || "";

      return [
        `"${trk}"`,
        `"${name}"`,
        `"${rel}"`,
        `"${phone}"`,
        `"${addr.replace(/"/g, '""')}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${otp}"`,
        `"${sig}"`,
        `"${photo}"`,
        `"${driver}"`,
        `"${notes.replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      encodeURIComponent([headers.join(","), ...rows].join("\n"));

    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute(
      "download",
      `proof_of_deliveries_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported POD records successfully");
  };

  const generateCertificateHtml = (details) => {
    if (!details) return "";
    const shp = details.shipmentId || {};
    const trackingId =
      shp.trackingId || shp.shipmentId || details.shipmentId || "POD-REC";
    const recipientName =
      details.receiver?.name ||
      details.recipientName ||
      shp.receiverName ||
      "—";
    const recipientRelation =
      details.receiver?.relationship ||
      details.recipientRelation ||
      "Self (Customer)";
    const recipientPhone =
      details.receiver?.phone ||
      details.recipientPhone ||
      shp.receiverPhoneNumber ||
      "—";
    const deliveryAddress =
      details.deliveryAddress || details.location || shp.receiverAddress || "—";
    const deliveryDateFormatted =
      details.deliveryDate || details.createdAt
        ? formatDate(details.deliveryDate || details.createdAt)
        : "—";
    const isOtp = details.otpVerified !== false;
    const driverName =
      details.submittedBy?.name ||
      shp.driverName?.userId?.name ||
      "Assigned Fleet Driver";
    const driverContact =
      details.submittedBy?.email || shp.driverName?.phonenumber || "—";
    const vehicleNo =
      shp.vehicleNo?.vregistrationnumber ||
      shp.vehicleNo ||
      "Fleet Delivery Vehicle";
    const notes = details.notes || "Consignment received in good condition.";
    const sig = details.signatureUrl || details.signatureData || "";
    const photo = details.photoUrl || details.photo || "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Proof of Delivery - ${trackingId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
    body { background: #f8fafc; padding: 24px 16px; color: #0f172a; }
    .cert-wrap { max-width: 820px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 36px 40px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
    .cert-top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 24px; }
    .cert-brand h1 { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
    .cert-brand p { font-size: 13px; color: #64748b; margin-top: 4px; }
    .cert-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; text-transform: uppercase; }
    .cert-trk { font-family: monospace; font-size: 14px; font-weight: 700; color: #0284c7; margin-top: 8px; text-align: right; }
    .cert-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .cert-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 18px; }
    .cert-card-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    .cert-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; line-height: 1.4; }
    .cert-row:last-child { margin-bottom: 0; }
    .cert-label { color: #64748b; font-weight: 500; min-width: 120px; }
    .cert-value { color: #0f172a; font-weight: 600; text-align: right; word-break: break-word; }
    .cert-proofs { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .proof-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; background: #ffffff; text-align: center; }
    .proof-title { font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 10px; }
    .proof-img-wrap { min-height: 140px; max-height: 200px; display: flex; align-items: center; justify-content: center; background: #f8fafc; border-radius: 6px; border: 1px dashed #cbd5e1; overflow: hidden; padding: 8px; }
    .proof-img { max-width: 100%; max-height: 180px; object-fit: contain; }
    .no-proof { color: #94a3b8; font-size: 12px; font-style: italic; }
    .cert-foot { border-top: 1px solid #e2e8f0; padding-top: 18px; font-size: 11.5px; color: #64748b; text-align: center; line-height: 1.5; }
    .cert-seal { margin-top: 10px; font-weight: 700; color: #059669; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .cert-wrap { box-shadow: none; border: none; padding: 15px; }
    }
  </style>
</head>
<body>
  <div class="cert-wrap">
    <div class="cert-top">
      <div class="cert-brand">
        <h1>PROOF OF DELIVERY</h1>
        <p>Logistics Management Platform &bull; Delivery Receipt Certificate</p>
      </div>
      <div>
        <div class="cert-badge">&#10003; DELIVERED & VERIFIED</div>
        <div class="cert-trk">AWB: ${trackingId}</div>
      </div>
    </div>

    <div class="cert-grid">
      <div class="cert-card">
        <div class="cert-card-title">Consignee & Delivery Information</div>
        <div class="cert-row"><span class="cert-label">Recipient:</span><span class="cert-value">${recipientName}</span></div>
        <div class="cert-row"><span class="cert-label">Relationship:</span><span class="cert-value">${recipientRelation}</span></div>
        <div class="cert-row"><span class="cert-label">Contact Phone:</span><span class="cert-value">${recipientPhone}</span></div>
        <div class="cert-row"><span class="cert-label">Delivery Address:</span><span class="cert-value">${deliveryAddress}</span></div>
        <div class="cert-row"><span class="cert-label">Completion Date:</span><span class="cert-value">${deliveryDateFormatted}</span></div>
        <div class="cert-row"><span class="cert-label">Handoff Mode:</span><span class="cert-value" style="color: ${isOtp ? "#059669" : "#0284c7"}; font-weight: 700;">${isOtp ? "Verified 2-Factor OTP" : "Direct Delivery"}</span></div>
      </div>

      <div class="cert-card">
        <div class="cert-card-title">Personnel & Transit Information</div>
        <div class="cert-row"><span class="cert-label">Fleet Driver:</span><span class="cert-value">${driverName}</span></div>
        <div class="cert-row"><span class="cert-label">Driver Contact:</span><span class="cert-value">${driverContact}</span></div>
        <div class="cert-row"><span class="cert-label">Assigned Vehicle:</span><span class="cert-value">${vehicleNo}</span></div>
        <div class="cert-row"><span class="cert-label">Internal Record:</span><span class="cert-value">${details._id || "—"}</span></div>
        <div class="cert-row"><span class="cert-label">Delivery Remarks:</span><span class="cert-value" style="font-style: italic;">"${notes}"</span></div>
      </div>
    </div>

    <div class="cert-proofs">
      <div class="proof-box">
        <div class="proof-title">Recipient Digital Signature</div>
        <div class="proof-img-wrap">
          ${sig ? `<img src="${sig}" alt="Signature" class="proof-img" />` : `<span class="no-proof">No digital signature recorded</span>`}
        </div>
      </div>

      <div class="proof-box">
        <div class="proof-title">Location / Parcel Photo Proof</div>
        <div class="proof-img-wrap">
          ${photo ? `<img src="${photo}" alt="Drop-off Photo" class="proof-img" />` : `<span class="no-proof">No drop-off photo captured</span>`}
        </div>
      </div>
    </div>

    <div class="cert-foot">
      <p>This digital certificate confirms that the consignment referenced above was delivered to and accepted by the recipient.</p>
      <div class="cert-seal">&#128274; Digitally Authenticated &bull; Generated on ${new Date().toLocaleString("en-IN")}</div>
    </div>
  </div>
</body>
</html>`;
  };

  const handleDownloadCertificate = (details) => {
    if (!details) return;
    const shp = details.shipmentId || {};
    const trackingId =
      shp.trackingId || shp.shipmentId || details.shipmentId || "shipment";
    const html = generateCertificateHtml(details);
    const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `POD_Certificate_${trackingId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`POD Certificate downloaded for ${trackingId}`);
  };

  const handlePrintCertificate = (details) => {
    if (!details) return;
    const html = generateCertificateHtml(details);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      handleDownloadCertificate(details);
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      try {
        printWindow.print();
      } catch (e) {
        console.warn("Print trigger error:", e);
      }
    }, 350);
  };

  return (
    <div className="shp-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            background: toastMessage.type === "error" ? "#e11d48" : "#0f172a",
            color: "#ffffff",
            padding: "10px 18px",
            borderRadius: "8px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="shp-header">
        <div>
          <h2 className="shp-title">Proof of Delivery (POD)</h2>
          <p className="shp-subtitle">
            Review verified delivery certificates, customer signatures, photo
            proofs, and drop-off timestamps.
          </p>
        </div>
        <div className="shp-header__actions">
          <button
            type="button"
            className="shp-btn shp-btn--ghost"
            onClick={async () => {
              await fetchPods();
              showToast("POD certificates refreshed");
            }}
            title="Refresh POD records"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            className="shp-btn shp-btn--secondary"
            onClick={handleExportCSV}
            title="Export CSV"
          >
            <FileSpreadsheet size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── KPI Cards Summary ─────────────────────────────────── */}
      <div className="shp-kpi-grid">
        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon">
              <FileCheck size={16} />
            </span>
            <span className="shp-kpi-card__title">Total PODs</span>
          </div>
          <div className="shp-kpi-card__value">{stats.total}</div>
          <div className="shp-kpi-card__foot">All signed receipts</div>
        </div>

        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--success">
              <ShieldCheck size={16} />
            </span>
            <span className="shp-kpi-card__title">OTP Verified</span>
          </div>
          <div className="shp-kpi-card__value">{stats.otpVerified}</div>
          <div className="shp-kpi-card__foot">Secure 2-factor handoff</div>
        </div>

        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--info">
              <Camera size={16} />
            </span>
            <span className="shp-kpi-card__title">With Photo Proof</span>
          </div>
          <div className="shp-kpi-card__value">{stats.withPhoto}</div>
          <div className="shp-kpi-card__foot">Visual drop-off proof</div>
        </div>

        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--warning">
              <PenTool size={16} />
            </span>
            <span className="shp-kpi-card__title">With Signature</span>
          </div>
          <div className="shp-kpi-card__value">{stats.withSignature}</div>
          <div className="shp-kpi-card__foot">Signed on glass</div>
        </div>
      </div>

      {/* ── Filter & Control Bar ───────────────────────────────── */}
      <div className="shp-control-bar">
        <div className="shp-tabs no-scrollbar">
          {[
            { key: "All", label: "All PODs", count: stats.total },
            {
              key: "OTP Verified",
              label: "OTP Verified",
              count: stats.otpVerified,
            },
            {
              key: "With Photo",
              label: "Photo Proof",
              count: stats.withPhoto,
            },
            {
              key: "With Signature",
              label: "Signed",
              count: stats.withSignature,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`shp-tab ${activeTab === tab.key ? "shp-tab--active" : ""}`}
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1);
              }}
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
              placeholder="Search tracking, recipient, driver, address..."
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
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <select
            className="shp-select-filter"
            value={verificationFilter}
            onChange={(e) => {
              setVerificationFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All">Verification: All</option>
            <option value="OTP">OTP Verified</option>
            <option value="Standard">Standard Delivery</option>
          </select>

          <select
            className="shp-select-filter"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="tracking">Sort: Tracking ID</option>
            <option value="recipient">Sort: Recipient Name</option>
          </select>
        </div>
      </div>

      {/* ── Main Data Table ────────────────────────────────────── */}
      <div className="shp-table-card">
        {loading && (
          <div className="shp-empty-state">
            <RefreshCw
              className="w-6 h-6 animate-spin text-blue-600"
              style={{ margin: "0 auto 8px" }}
            />
            <p className="shp-empty-state__title">
              Loading POD certificates...
            </p>
          </div>
        )}

        {!loading && fetchError && (
          <div
            className="shp-alert shp-alert--danger"
            style={{ margin: "16px" }}
          >
            <strong>Error:</strong> {fetchError} —{" "}
            <button
              type="button"
              className="shp-btn shp-btn--ghost shp-btn--sm"
              onClick={fetchPods}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !fetchError && filteredAndSortedPods.length === 0 && (
          <div className="shp-empty-state">
            <p className="shp-empty-state__title">
              No Proof of Delivery records found
            </p>
            <p className="shp-empty-state__text">
              {searchQuery
                ? "Try adjusting your search query or switching active tab."
                : "Proof of Delivery documents will appear here once drivers successfully hand off parcels."}
            </p>
          </div>
        )}

        {!loading && !fetchError && filteredAndSortedPods.length > 0 && (
          <div className="shp-table-wrap">
            <table className="shp-table">
              <thead>
                <tr>
                  <th>Tracking #</th>
                  <th>Recipient Details</th>
                  <th>Drop-off Address</th>
                  <th>Delivery Window</th>
                  <th>Verification</th>
                  <th>Captured Proof</th>
                  <th>Fleet Driver</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedPods.map((p) => {
                  const shp = p.shipmentId || {};
                  const trackingId =
                    shp.trackingId || shp.shipmentId || p.shipmentId || "—";
                  const recName =
                    p.receiver?.name ||
                    p.recipientName ||
                    shp.receiverName ||
                    "Recipient";
                  const recRelation =
                    p.receiver?.relationship ||
                    p.recipientRelation ||
                    "Customer";
                  const recPhone =
                    p.receiver?.phone ||
                    p.recipientPhone ||
                    shp.receiverPhoneNumber ||
                    "—";
                  const address =
                    p.deliveryAddress ||
                    p.location ||
                    shp.receiverAddress ||
                    "—";
                  const d = p.deliveryDate || p.createdAt;
                  const isOtp = p.otpVerified !== false;
                  const hasSig = Boolean(p.signatureUrl || p.signatureData);
                  const hasPhoto = Boolean(p.photoUrl || p.photo);
                  const drvName =
                    p.submittedBy?.name ||
                    shp.driverName?.userId?.name ||
                    "Driver";

                  return (
                    <tr key={p._id} className="shp-table__row">
                      {/* Tracking ID */}
                      <td>
                        <button
                          type="button"
                          className="shp-tracking-link"
                          onClick={() => setSelectedDetails(p)}
                        >
                          {trackingId}
                        </button>
                        <span
                          className="shp-priority-pill"
                          style={{ marginLeft: "6px" }}
                        >
                          POD
                        </span>
                      </td>

                      {/* Recipient Details */}
                      <td>
                        <p className="shp-cell-title">{recName}</p>
                        <span className="shp-cell-sub">
                          {recRelation} &bull; {recPhone}
                        </span>
                      </td>

                      {/* Delivery Address */}
                      <td style={{ maxWidth: "230px" }}>
                        <p
                          className="shp-cell-title"
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontWeight: 500,
                          }}
                          title={address}
                        >
                          {address}
                        </p>
                        <span className="shp-cell-sub">Confirmed Location</span>
                      </td>

                      {/* Timestamp */}
                      <td>
                        <p className="shp-cell-title">
                          {d ? formatDate(d) : "—"}
                        </p>
                        <span className="shp-cell-sub">Handoff Timestamp</span>
                      </td>

                      {/* OTP Status */}
                      <td>
                        {isOtp ? (
                          <span
                            className="shp-badge shp-badge--success"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <ShieldCheck size={12} />
                            OTP Verified
                          </span>
                        ) : (
                          <span className="shp-badge shp-badge--info">
                            Direct Delivery
                          </span>
                        )}
                      </td>

                      {/* Proof Assets (Signature & Photo) */}
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          {hasSig && (
                            <span
                              title="Signature Collected"
                              style={{
                                display: "inline-flex",
                                padding: "4px 6px",
                                background: "#fef3c7",
                                borderRadius: "4px",
                                color: "#b45309",
                                fontSize: "11px",
                                fontWeight: 600,
                                gap: "4px",
                                alignItems: "center",
                              }}
                            >
                              <PenTool size={12} />
                              Sign
                            </span>
                          )}
                          {hasPhoto && (
                            <span
                              title="Location Photo Captured"
                              style={{
                                display: "inline-flex",
                                padding: "4px 6px",
                                background: "#e0e7ff",
                                borderRadius: "4px",
                                color: "#4338ca",
                                fontSize: "11px",
                                fontWeight: 600,
                                gap: "4px",
                                alignItems: "center",
                              }}
                            >
                              <Camera size={12} />
                              Photo
                            </span>
                          )}
                          {!hasSig && !hasPhoto && (
                            <span
                              style={{ fontSize: "12px", color: "#94a3b8" }}
                            >
                              Paper POD
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Delivered By */}
                      <td>
                        <p className="shp-cell-title">{drvName}</p>
                        <span className="shp-cell-sub">
                          {p.submittedBy?.email || "Fleet Agent"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "right" }}>
                        <div className="shp-action-btns">
                          <button
                            type="button"
                            className="shp-icon-btn"
                            title="View POD Details"
                            onClick={() => setSelectedDetails(p)}
                          >
                            <Eye size={15} />
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

        {/* ── Table Footer & Pagination ─────────────────────────── */}
        <div className="shp-table-footer">
          <div className="shp-pagination-info">
            {filteredAndSortedPods.length === 0 ? (
              <span>No PODs to display</span>
            ) : (
              <span>
                Showing <strong>{startIndex + 1}</strong>–
                <strong>{endIndex}</strong> of{" "}
                <strong>{filteredAndSortedPods.length}</strong> certificates
                {filteredAndSortedPods.length !== pods.length && (
                  <span className="shp-pagination-total-hint">
                    {" "}
                    (filtered from {pods.length} total)
                  </span>
                )}
              </span>
            )}
          </div>

          {filteredAndSortedPods.length > 0 && (
            <div className="shp-pagination-controls">
              <div className="shp-pagination-size">
                <label htmlFor="shp-pod-page-size-select">Rows per page:</label>
                <select
                  id="shp-pod-page-size-select"
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={8}>8</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="shp-pagination-nav">
                <button
                  type="button"
                  className="shp-page-btn"
                  title="First Page"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                >
                  <ChevronsLeft size={15} />
                </button>
                <button
                  type="button"
                  className="shp-page-btn"
                  title="Previous Page"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={15} />
                </button>

                <span className="shp-page-indicator">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  className="shp-page-btn"
                  title="Next Page"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                >
                  <ChevronRight size={15} />
                </button>
                <button
                  type="button"
                  className="shp-page-btn"
                  title="Last Page"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  <ChevronsRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── View POD Details Modal (Identical Structure to ShipmentDetailsModal) ── */}
      {selectedDetails && (
        <div className="shp-modal-overlay">
          <div className="shp-modal shp-modal--xl">
            {/* Modal Header */}
            <div className="shp-modal__header shp-details-modal-header">
              <div className="shp-details-head">
                <div className="shp-details-head__main">
                  <span className="shp-details-head__tracking">
                    {selectedDetails.shipmentId?.trackingId ||
                      selectedDetails.shipmentId?.shipmentId ||
                      selectedDetails.shipmentId ||
                      "POD-REC"}
                  </span>
                  <div className="shp-details-head__badges">
                    <span className="shp-badge shp-badge--success">
                      Delivered
                    </span>
                    {selectedDetails.otpVerified !== false ? (
                      <span className="shp-badge shp-badge--outline">
                        <ShieldCheck size={12} style={{ marginRight: "4px" }} />
                        OTP Verified Handoff
                      </span>
                    ) : (
                      <span className="shp-badge shp-badge--outline">
                        Direct Delivery
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="shp-modal__close shp-modal__close--mobile"
                  onClick={() => setSelectedDetails(null)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="shp-modal__actions-top">
                <button
                  type="button"
                  className="shp-btn shp-btn--primary shp-btn--sm"
                  onClick={() => handleDownloadCertificate(selectedDetails)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  title="Download Certificate"
                >
                  <Download size={13} />
                  Download Certificate
                </button>
                <button
                  type="button"
                  className="shp-btn shp-btn--secondary shp-btn--sm"
                  onClick={() => handlePrintCertificate(selectedDetails)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  title="Print / Save PDF"
                >
                  <Printer size={13} />
                  Print
                </button>
                <button
                  type="button"
                  className="shp-modal__close shp-modal__close--desktop"
                  onClick={() => setSelectedDetails(null)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="shp-modal__body">
              {/* Delivery Progress Stepper */}
              <div
                className="shp-stepper-card"
                style={{ marginBottom: "18px" }}
              >
                <h4 className="shp-section-title">
                  Delivery Lifecycle Workflow
                </h4>
                <div className="shp-profile-stepper-wrap no-scrollbar">
                  <div className="shp-stepper">
                    {WORKFLOW_STEPS.map((step) => (
                      <div
                        key={step}
                        className="shp-stepper__step shp-stepper__step--completed"
                      >
                        <div className="shp-stepper__circle">
                          <Check size={14} strokeWidth={2.5} />
                        </div>
                        <span className="shp-stepper__label">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2-Column Details Grid */}
              <div className="shp-details-grid">
                {/* Column 1: Details Cards */}
                <div className="shp-details-col">
                  {/* Recipient Details Card */}
                  <div className="shp-card">
                    <h5 className="shp-card__title">
                      Consignee & Recipient Information
                    </h5>
                    <div className="shp-card__content">
                      <div className="shp-kv">
                        <span className="shp-kv__label">Recipient Name</span>
                        <span
                          className="shp-kv__value"
                          style={{ fontWeight: 600 }}
                        >
                          {selectedDetails.receiver?.name ||
                            selectedDetails.recipientName ||
                            selectedDetails.shipmentId?.receiverName ||
                            "—"}
                        </span>
                      </div>

                      <div className="shp-kv">
                        <span className="shp-kv__label">Relationship</span>
                        <span className="shp-kv__value">
                          {selectedDetails.receiver?.relationship ||
                            selectedDetails.recipientRelation ||
                            "Self (Customer)"}
                        </span>
                      </div>

                      <div className="shp-kv">
                        <span className="shp-kv__label">Contact Phone</span>
                        <span className="shp-kv__value">
                          {selectedDetails.receiver?.phone ||
                            selectedDetails.recipientPhone ||
                            selectedDetails.shipmentId?.receiverPhoneNumber ||
                            "—"}
                        </span>
                      </div>

                      <div className="shp-kv">
                        <span className="shp-kv__label">Confirmed Address</span>
                        <span
                          className="shp-kv__value"
                          style={{ color: "#059669", fontWeight: 500 }}
                        >
                          {selectedDetails.deliveryAddress ||
                            selectedDetails.location ||
                            selectedDetails.shipmentId?.receiverAddress ||
                            "—"}
                        </span>
                      </div>

                      <div className="shp-kv">
                        <span className="shp-kv__label">
                          Delivery Date & Time
                        </span>
                        <span
                          className="shp-kv__value"
                          style={{ fontFamily: "monospace" }}
                        >
                          {selectedDetails.deliveryDate ||
                          selectedDetails.createdAt
                            ? formatDate(
                                selectedDetails.deliveryDate ||
                                  selectedDetails.createdAt,
                              )
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Personnel & Vehicle Card */}
                  <div className="shp-card">
                    <h5 className="shp-card__title">
                      Delivering Personnel & Logistics
                    </h5>
                    <div className="shp-card__content">
                      <div className="shp-kv">
                        <span className="shp-kv__label">Authorized Driver</span>
                        <span className="shp-kv__value">
                          {selectedDetails.submittedBy?.name ||
                            selectedDetails.shipmentId?.driverName?.userId
                              ?.name ||
                            "Assigned Fleet Driver"}
                        </span>
                      </div>

                      <div className="shp-kv">
                        <span className="shp-kv__label">Driver Contact</span>
                        <span className="shp-kv__value">
                          {selectedDetails.submittedBy?.email ||
                            selectedDetails.shipmentId?.driverName
                              ?.phonenumber ||
                            "—"}
                        </span>
                      </div>

                      <div className="shp-kv">
                        <span className="shp-kv__label">Assigned Vehicle</span>
                        <span className="shp-kv__value">
                          {selectedDetails.shipmentId?.vehicleNo
                            ?.vregistrationnumber ||
                            selectedDetails.shipmentId?.vehicleNo ||
                            "Fleet Van / Truck"}
                        </span>
                      </div>

                      {selectedDetails.notes && (
                        <div className="shp-kv">
                          <span className="shp-kv__label">
                            Delivery Remarks
                          </span>
                          <span
                            className="shp-kv__value"
                            style={{ fontStyle: "italic" }}
                          >
                            "{selectedDetails.notes}"
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 2: Signature and Photo Cards */}
                <div className="shp-details-col">
                  {/* Recipient Signature Card */}
                  <div className="shp-card">
                    <h5
                      className="shp-card__title"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <PenTool size={15} className="text-amber-600" />
                      Recipient Glass Signature
                    </h5>
                    {selectedDetails.signatureUrl ||
                    selectedDetails.signatureData ? (
                      <div
                        style={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          padding: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minHeight: "110px",
                        }}
                      >
                        <img
                          src={
                            selectedDetails.signatureUrl ||
                            selectedDetails.signatureData
                          }
                          alt="Recipient Signature"
                          style={{
                            maxHeight: "110px",
                            maxWidth: "100%",
                            objectFit: "contain",
                          }}
                        />
                      </div>
                    ) : (
                      <p className="shp-text-muted">
                        No digital signature recorded.
                      </p>
                    )}
                  </div>

                  {/* Delivery Location Photo Proof Card */}
                  <div className="shp-card">
                    <h5
                      className="shp-card__title"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Camera size={15} className="text-indigo-600" />
                      Delivery Location & Parcel Photo Proof
                    </h5>
                    {selectedDetails.photoUrl || selectedDetails.photo ? (
                      <div
                        style={{
                          backgroundColor: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          maxHeight: "220px",
                        }}
                      >
                        <img
                          src={
                            selectedDetails.photoUrl || selectedDetails.photo
                          }
                          alt="Delivery Photo Proof"
                          style={{
                            width: "100%",
                            maxHeight: "220px",
                            objectFit: "contain",
                          }}
                        />
                      </div>
                    ) : (
                      <p className="shp-text-muted">
                        No drop-off photo captured for this delivery.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="shp-modal__footer shp-pod-modal-footer">
              <button
                type="button"
                className="shp-btn shp-btn--ghost shp-pod-btn-close"
                onClick={() => setSelectedDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
