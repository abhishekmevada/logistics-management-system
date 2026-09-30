import React, { useState, useMemo, useEffect } from "react";
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Eye,
  FileText,
  Calendar,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MapPin,
  Phone,
  User,
  Download,
  AlertCircle,
  Plus,
  ArrowRight,
} from "lucide-react";
import "../../styles/ShipmentManagement.css";
import "../../styles/DashboardDelivery.css";

const FAILURE_REASONS = [
  "Customer Not Available / Phone Unreachable",
  "Incorrect / Incomplete Delivery Address",
  "Customer Refused Delivery / Cancelled Order",
  "COD Amount Not Ready",
  "Premises Closed / Entry Denied by Security",
  "Customer Requested Re-attempt on Another Day",
  "Severe Weather / Road Inaccessible",
  "Damaged Package / Parcel Issue",
  "Other",
];

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const mapBackendDelivery = (d) => {
  const shp =
    d.shipmentId && typeof d.shipmentId === "object" ? d.shipmentId : {};
  const cust =
    shp.customerId && typeof shp.customerId === "object" ? shp.customerId : {};
  const drv =
    shp.driverName && typeof shp.driverName === "object" ? shp.driverName : {};
  const drvUser =
    drv.userId && typeof drv.userId === "object" ? drv.userId : {};
  const veh =
    shp.vehicleNo && typeof shp.vehicleNo === "object" ? shp.vehicleNo : {};

  // Status mapping: backend "failed" maps to frontend "failed_delivery"
  let normalizedStatus = d.status || shp.status || "pending";
  if (normalizedStatus === "failed") normalizedStatus = "failed_delivery";

  // Recipient / Customer
  const customerName =
    shp.receiverName || cust.name || shp.senderName || "Customer";
  const phone =
    shp.receiverPhoneNumber ||
    shp.receiverPhone ||
    cust.phonenumber ||
    shp.senderPhoneNumber ||
    "—";
  const address =
    shp.receiverAddress ||
    shp.deliveryAddress ||
    cust.address ||
    "Destination Address";
  const city = shp.receiverCity || shp.destinationCity || "—";
  const pincode = shp.receiverpincode || "";

  // Driver & Vehicle
  const driverName =
    drvUser.name ||
    drv.name ||
    (drv.driverId ? `Driver (${drv.driverId})` : "Unassigned");
  const driverPhone = drv.phonenumber || drv.phone || "—";
  const vehicleNo =
    veh.vregistrationnumber || veh.registrationNumber
      ? `${veh.vregistrationnumber || veh.registrationNumber} (${
          veh.vmodel || veh.vehicleName || "Vehicle"
        })`
      : "—";

  // Dates
  const expDate = d.reattemptDate
    ? new Date(d.reattemptDate).toISOString().split("T")[0]
    : shp.expectedDeliveryDate
      ? new Date(shp.expectedDeliveryDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

  // Notes
  const notesList = [];
  if (d.notes) {
    notesList.push({
      id: "note_" + d._id,
      text: d.notes,
      author: driverName || "Delivery System",
      time: new Date(d.updatedAt || d.createdAt || Date.now()).toLocaleString(),
    });
  }

  // Audit history
  const historyList = [];
  if (d.status === "failed") {
    historyList.push({
      id: "h_fail_" + d._id,
      status: "failed_delivery",
      title: `Delivery Attempt ${d.attemptNumber || 1} Failed`,
      timestamp: new Date(d.updatedAt || Date.now()).toLocaleString(),
      author: driverName,
      reason: d.reason || "Delivery could not be completed",
      notes: d.notes || "Driver logged unsuccessful delivery attempt.",
    });
  }

  if (d.status === "delivered") {
    historyList.push({
      id: "h_deliv_" + d._id,
      status: "delivered",
      title: "Package Successfully Delivered",
      timestamp: new Date(
        d.deliveredAt || d.updatedAt || Date.now(),
      ).toLocaleString(),
      author: driverName,
      notes: d.notes
        ? `Delivery notes: ${d.notes}`
        : "Delivered to recipient with acknowledgment.",
    });
  }

  if (d.status === "reattempt_scheduled") {
    historyList.push({
      id: "h_reattempt_" + d._id,
      status: "reattempt_scheduled",
      title: "Delivery Re-attempt Scheduled",
      timestamp: new Date(d.updatedAt || Date.now()).toLocaleString(),
      author: "Dispatcher",
      notes: `Re-attempt queued for ${expDate}.`,
    });
  }

  historyList.push({
    id: "h_created_" + d._id,
    status: "pending",
    title: "Consignment Dispatched to Hub",
    timestamp: new Date(d.createdAt || Date.now()).toLocaleString(),
    author: "Hub Operations",
    notes: `Tracking registered: ${shp.trackingId || "N/A"}`,
  });

  return {
    _id: d._id,
    id: d._id || `DLV-${shp.shipmentId || "001"}`,
    deliveryId: d._id,
    shipmentObjectId: shp._id || d.shipmentId,
    trackingId:
      shp.trackingId || `TRK-${String(d._id).slice(-8).toUpperCase()}`,
    shipmentCode: shp.shipmentId || "N/A",
    customerName,
    phone,
    address,
    city,
    pincode,
    driverName,
    driverPhone,
    vehicleNo,
    priority: shp.priority || "Standard",
    packageType: shp.packageDescription || "Parcel Consignment",
    weight: shp.totalWeight ? `${shp.totalWeight} kg` : "1.0 kg",
    paymentMode: "Prepaid",
    amount: "₹0",
    status: normalizedStatus,
    attemptCount: d.attemptNumber || 1,
    maxAttempts: 3,
    expectedDate: expDate,
    reattemptDate: d.reattemptDate || null,
    reattemptNotes: d.notes || "",
    failedReason: d.reason || "",
    failedNotes: d.notes || "",
    deliveredAt: d.deliveredAt
      ? new Date(d.deliveredAt).toLocaleString()
      : null,
    notes: notesList,
    history: historyList,
  };
};

const formatDateTime = (val) => {
  if (!val) return "—";
  try {
    const dt = new Date(val);
    if (isNaN(dt.getTime())) return String(val);
    return dt.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(val);
  }
};

export default function DashboardDelivery() {
  const [loading, setLoading] = useState(false);

  // ── Deliveries State ───────────────────────────────────────────────────────
  const [deliveries, setDeliveries] = useState([]);

  // ── Drivers State (from backend database) ──────────────────────────────────
  const [driversList, setDriversList] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  // Fetch drivers from backend database
  const fetchDrivers = async () => {
    setLoadingDrivers(true);
    const token = localStorage.getItem("token");
    try {
      // 1. Try /drivernames first (returns active/available drivers populated with userId.name)
      const res = await fetch(`${API_BASE_URL}/drivernames`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.result)
          ? data.result
          : Array.isArray(data.drivers)
            ? data.drivers
            : [];
        if (list.length > 0) {
          const formatted = list.map((d) => ({
            id: d._id || d.driverId,
            driverId: d.driverId || "",
            name: d.name || d.userId?.name || "Driver",
            availability: d.availability || "available",
          }));
          setDriversList(formatted);
          setLoadingDrivers(false);
          return;
        }
      }

      // 2. Fallback to /drivers if needed
      const resDrivers = await fetch(`${API_BASE_URL}/drivers`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (resDrivers.ok) {
        const data = await resDrivers.json();
        const list = Array.isArray(data.drivers)
          ? data.drivers
          : Array.isArray(data.result)
            ? data.result
            : [];
        if (list.length > 0) {
          const formatted = list.map((d) => ({
            id: d._id || d.driverId,
            driverId: d.driverId || "",
            name: d.userId?.name || d.name || "Driver",
            availability: d.availability || "available",
          }));
          setDriversList(formatted);
          setLoadingDrivers(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Could not fetch drivers from backend:", err);
    } finally {
      setLoadingDrivers(false);
    }
  };

  // Fetch from backend index.js GET /deliveries
  const fetchDeliveries = async (isManual = false) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/deliveries`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (
        res.ok &&
        Array.isArray(data.deliveries) &&
        data.deliveries.length > 0
      ) {
        const mapped = data.deliveries.map(mapBackendDelivery);
        setDeliveries(mapped);
        if (isManual) {
          showToast(
            `Synced ${mapped.length} deliveries from server`,
            "success",
          );
        }
        return;
      }
    } catch (err) {
      console.warn("Could not fetch /deliveries from backend:", err);
      if (isManual) {
        showToast("Server unavailable.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.removeItem("rf_delivery_management_data");
    } catch {}
    fetchDeliveries();
    fetchDrivers();
  }, []);

  // ── Filters & Tabs ─────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("all"); // all | pending | out_for_delivery | delivered | failed_delivery | reattempt_scheduled
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Toast Notification ─────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Modal States ───────────────────────────────────────────────────────────
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [confirmDeliveryModalOpen, setConfirmDeliveryModalOpen] =
    useState(false);
  const [recordFailedModalOpen, setRecordFailedModalOpen] = useState(false);
  const [scheduleReattemptModalOpen, setScheduleReattemptModalOpen] =
    useState(false);
  const [markOutModalOpen, setMarkOutModalOpen] = useState(false);

  // ── Form States ────────────────────────────────────────────────────────────
  // Confirm Delivery Form
  const [deliveredTo, setDeliveredTo] = useState("Directly to Customer");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [deliveryProofNotes, setDeliveryProofNotes] = useState("");

  // Record Failed Form
  const [failedReason, setFailedReason] = useState(FAILURE_REASONS[0]);
  const [failedNotes, setFailedNotes] = useState("");
  const [scheduleImmediately, setScheduleImmediately] = useState(false);
  const [immediateReattemptDate, setImmediateReattemptDate] = useState("");

  // Schedule Re-attempt Form
  const [reattemptDate, setReattemptDate] = useState("");
  const [reattemptDriver, setReattemptDriver] = useState("");

  // Mark Out For Delivery Form
  const [outDriver, setOutDriver] = useState("");
  const [outVehicle, setOutVehicle] = useState("");

  // ── KPI Computations ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = deliveries.length;
    const pending = deliveries.filter((d) => d.status === "pending").length;
    const outForDelivery = deliveries.filter(
      (d) => d.status === "out_for_delivery",
    ).length;
    const delivered = deliveries.filter((d) => d.status === "delivered").length;
    const failed = deliveries.filter(
      (d) => d.status === "failed_delivery",
    ).length;
    const reattempt = deliveries.filter(
      (d) => d.status === "reattempt_scheduled",
    ).length;

    return { total, pending, outForDelivery, delivered, failed, reattempt };
  }, [deliveries]);

  // ── Filtered Deliveries ───────────────────────────────────────────────────
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((item) => {
      // Tab filter
      if (activeTab !== "all" && item.status !== activeTab) {
        return false;
      }

      // Priority filter
      if (
        priorityFilter !== "all" &&
        item.priority.toLowerCase() !== priorityFilter.toLowerCase()
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.id.toLowerCase().includes(q) ||
          item.trackingId.toLowerCase().includes(q) ||
          item.customerName.toLowerCase().includes(q) ||
          item.address.toLowerCase().includes(q) ||
          item.city.toLowerCase().includes(q) ||
          item.driverName.toLowerCase().includes(q) ||
          item.phone.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [deliveries, activeTab, priorityFilter, searchQuery]);

  // ── Pagination Computations ────────────────────────────────────────────────
  const totalPages = Math.max(
    1,
    Math.ceil(filteredDeliveries.length / pageSize),
  );
  const paginatedDeliveries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDeliveries.slice(start, start + pageSize);
  }, [filteredDeliveries, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, priorityFilter, searchQuery, pageSize]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getNowFormatted = () => {
    const now = new Date();
    return now.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="dlv-badge dlv-badge--pending">● Pending</span>;
      case "out_for_delivery":
        return (
          <span className="dlv-badge dlv-badge--out_for_delivery">
            <Truck className="w-3 h-3" /> Out for Delivery
          </span>
        );
      case "delivered":
        return (
          <span className="dlv-badge dlv-badge--delivered">
            <CheckCircle2 className="w-3 h-3" /> Delivered
          </span>
        );
      case "failed_delivery":
        return (
          <span className="dlv-badge dlv-badge--failed">
            <AlertTriangle className="w-3 h-3" /> Failed Delivery
          </span>
        );
      case "reattempt_scheduled":
        return (
          <span className="dlv-badge dlv-badge--reattempt">
            <RefreshCw className="w-3 h-3" /> Re-attempt Scheduled
          </span>
        );
      default:
        return <span className="shp-badge shp-badge--outline">{status}</span>;
    }
  };

  // ── Actions Handlers ───────────────────────────────────────────────────────

  // 1. Mark as Out for Delivery
  const handleOpenMarkOut = (delivery) => {
    setSelectedDelivery(delivery);
    setOutDriver(delivery.driverName || "Rajesh Kumar");
    setOutVehicle(delivery.vehicleNo || "MH-02-AB-1234 (Tata Ace)");
    setMarkOutModalOpen(true);
  };

  const handleConfirmMarkOut = async (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    const timeNow = getNowFormatted();
    const updatedAttempt =
      selectedDelivery.attemptCount === 0 ? 1 : selectedDelivery.attemptCount;

    const newHistoryEntry = {
      id: "h_" + Date.now(),
      status: "out_for_delivery",
      title: `Marked Out for Delivery (Attempt ${updatedAttempt})`,
      timestamp: timeNow,
      author: outDriver || "Dispatcher",
      notes: `Vehicle: ${outVehicle}. Dispatched for final delivery.`,
    };

    // Optimistic local update
    setDeliveries((prev) =>
      prev.map((item) =>
        item.id === selectedDelivery.id
          ? {
              ...item,
              status: "out_for_delivery",
              driverName: outDriver,
              vehicleNo: outVehicle,
              attemptCount: updatedAttempt,
              history: [newHistoryEntry, ...item.history],
            }
          : item,
      ),
    );

    // Call backend PATCH /shipments/:id/status
    const token = localStorage.getItem("token");
    const shipmentId =
      selectedDelivery.shipmentObjectId ||
      selectedDelivery._id ||
      selectedDelivery.id;

    if (token && shipmentId) {
      try {
        await fetch(`${API_BASE_URL}/shipments/${shipmentId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "out_for_delivery" }),
        });
        fetchDeliveries();
      } catch (err) {
        console.warn("Backend status update skipped:", err);
      }
    }

    setMarkOutModalOpen(false);
    showToast(`${selectedDelivery.trackingId} is now Out for Delivery!`);
  };

  // 2. Confirm Successful Delivery
  const handleOpenConfirmDelivery = (delivery) => {
    setSelectedDelivery(delivery);
    setDeliveredTo("Directly to Customer");
    setReceiverName(delivery.customerName);
    setReceiverPhone(delivery.phone);
    setDeliveryProofNotes("Recipient signature verified on driver terminal.");
    setConfirmDeliveryModalOpen(true);
  };

  const handleConfirmDeliverySubmit = async (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    const timeNow = getNowFormatted();
    const newHistoryEntry = {
      id: "h_" + Date.now(),
      status: "delivered",
      title: "Package Successfully Delivered",
      timestamp: timeNow,
      author: selectedDelivery.driverName || "Driver",
      notes: `Delivered to ${deliveredTo} (${receiverName || selectedDelivery.customerName}). Proof: ${deliveryProofNotes || "None"}`,
    };

    setDeliveries((prev) =>
      prev.map((item) =>
        item.id === selectedDelivery.id
          ? {
              ...item,
              status: "delivered",
              deliveredAt: timeNow,
              deliveredTo,
              receiverName: receiverName || item.customerName,
              proofNotes: deliveryProofNotes,
              history: [newHistoryEntry, ...item.history],
            }
          : item,
      ),
    );

    // Call backend PATCH /shipments/:id/status
    const token = localStorage.getItem("token");
    const shipmentId =
      selectedDelivery.shipmentObjectId ||
      selectedDelivery._id ||
      selectedDelivery.id;

    if (token && shipmentId) {
      try {
        await fetch(`${API_BASE_URL}/shipments/${shipmentId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "delivered" }),
        });
        fetchDeliveries();
      } catch (err) {
        console.warn("Backend status update skipped:", err);
      }
    }

    setConfirmDeliveryModalOpen(false);
    showToast(`Delivery confirmed for ${selectedDelivery.trackingId}!`);
  };

  // 3. Record Failed Delivery
  const handleOpenRecordFailed = (delivery) => {
    setSelectedDelivery(delivery);
    setFailedReason(FAILURE_REASONS[0]);
    setFailedNotes("");
    setScheduleImmediately(false);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setImmediateReattemptDate(tomorrow.toISOString().split("T")[0]);
    setRecordFailedModalOpen(true);
  };

  const handleRecordFailedSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    const timeNow = getNowFormatted();
    const newAttempt = selectedDelivery.attemptCount || 1;

    const failHistoryEntry = {
      id: "h_fail_" + Date.now(),
      status: "failed_delivery",
      title: `Delivery Attempt ${newAttempt} Failed`,
      timestamp: timeNow,
      author: selectedDelivery.driverName || "Driver",
      reason: failedReason,
      notes: failedNotes || "Delivery attempt could not be fulfilled.",
    };

    let updatedHistory = [failHistoryEntry, ...selectedDelivery.history];
    let nextStatus = "failed_delivery";
    let nextExpectedDate = selectedDelivery.expectedDate;

    if (scheduleImmediately && immediateReattemptDate) {
      nextStatus = "reattempt_scheduled";
      nextExpectedDate = immediateReattemptDate;
      const reattemptHistoryEntry = {
        id: "h_reattempt_" + Date.now(),
        status: "reattempt_scheduled",
        title: `Re-attempt Scheduled for ${immediateReattemptDate}`,
        timestamp: timeNow,
        author: "Dispatcher",
        notes: `Scheduled next attempt for ${immediateReattemptDate}.`,
      };
      updatedHistory = [reattemptHistoryEntry, ...updatedHistory];
    }

    setDeliveries((prev) =>
      prev.map((item) =>
        item.id === selectedDelivery.id
          ? {
              ...item,
              status: nextStatus,
              failedReason,
              failedNotes,
              expectedDate: nextExpectedDate,
              reattemptDate:
                scheduleImmediately && immediateReattemptDate
                  ? immediateReattemptDate
                  : item.reattemptDate,
              history: updatedHistory,
            }
          : item,
      ),
    );

    setSelectedDelivery((prev) =>
      prev
        ? {
            ...prev,
            status: nextStatus,
            failedReason,
            failedNotes,
            expectedDate: nextExpectedDate,
            reattemptDate:
              scheduleImmediately && immediateReattemptDate
                ? immediateReattemptDate
                : prev.reattemptDate,
            history: updatedHistory,
          }
        : null,
    );

    // Call backend PATCH /delivery-fail-note/:shipmentId
    const token = localStorage.getItem("token");
    const shipmentId =
      selectedDelivery.shipmentObjectId ||
      selectedDelivery._id ||
      selectedDelivery.id;

    if (token && shipmentId) {
      try {
        await fetch(`${API_BASE_URL}/delivery-fail-note/${shipmentId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason: failedReason,
            notes: failedNotes,
          }),
        });

        if (scheduleImmediately && immediateReattemptDate) {
          const deliveryId =
            selectedDelivery.deliveryId || selectedDelivery._id;
          await fetch(
            `${API_BASE_URL}/delivery-reattempt-scheduled/${deliveryId}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                reattemptDate: immediateReattemptDate,
              }),
            },
          );
        }
        fetchDeliveries();
      } catch (err) {
        console.warn("Backend failure record update skipped:", err);
      }
    }

    setRecordFailedModalOpen(false);
    showToast(
      scheduleImmediately
        ? `Failure recorded & re-attempt scheduled for ${selectedDelivery.trackingId}`
        : `Failure recorded for ${selectedDelivery.trackingId}`,
      "error",
    );
  };

  // 4. Schedule Delivery Re-attempt
  const handleOpenScheduleReattempt = (delivery) => {
    setSelectedDelivery(delivery);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    const hh = String(tomorrow.getHours()).padStart(2, "0");
    const min = String(tomorrow.getMinutes()).padStart(2, "0");
    setReattemptDate(`${yyyy}-${mm}-${dd}T${hh}:${min}`);

    const defaultDriver =
      delivery.driverName ||
      (driversList.length > 0 ? driversList[0].name : "Rajesh Kumar");
    setReattemptDriver(defaultDriver);
    setScheduleReattemptModalOpen(true);
  };

  const handleScheduleReattemptSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    const timeNow = getNowFormatted();
    const nextAttemptCount = (selectedDelivery.attemptCount || 1) + 1;

    let formattedDisplayDateTime = reattemptDate;
    try {
      const dt = new Date(reattemptDate);
      if (!isNaN(dt.getTime())) {
        formattedDisplayDateTime = dt.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } catch {}

    const newHistoryEntry = {
      id: "h_" + Date.now(),
      status: "reattempt_scheduled",
      title: `Delivery Re-attempt Scheduled (Attempt ${nextAttemptCount}/${selectedDelivery.maxAttempts})`,
      timestamp: timeNow,
      author: "Dispatcher",
      notes: `Re-attempt set for ${formattedDisplayDateTime}. Assigned to: ${reattemptDriver}.`,
    };

    setDeliveries((prev) =>
      prev.map((item) =>
        item.id === selectedDelivery.id
          ? {
              ...item,
              status: "reattempt_scheduled",
              reattemptDate,
              expectedDate: reattemptDate.includes("T")
                ? reattemptDate.split("T")[0]
                : reattemptDate,
              driverName: reattemptDriver,
              attemptCount: nextAttemptCount,
              history: [newHistoryEntry, ...item.history],
            }
          : item,
      ),
    );

    setSelectedDelivery((prev) =>
      prev
        ? {
            ...prev,
            status: "reattempt_scheduled",
            reattemptDate,
            expectedDate: reattemptDate.includes("T")
              ? reattemptDate.split("T")[0]
              : reattemptDate,
            driverName: reattemptDriver,
            attemptCount: nextAttemptCount,
            history: [newHistoryEntry, ...prev.history],
          }
        : null,
    );

    // Call backend PATCH /delivery-reattempt-scheduled/:deliveryId
    const token = localStorage.getItem("token");
    const deliveryId =
      selectedDelivery.deliveryId ||
      selectedDelivery._id ||
      selectedDelivery.id;

    if (token && deliveryId) {
      try {
        const selectedDriverObj = driversList.find(
          (d) => d.name === reattemptDriver,
        );
        await fetch(
          `${API_BASE_URL}/delivery-reattempt-scheduled/${deliveryId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              reattemptDate,
              driverName: reattemptDriver,
              driverId: selectedDriverObj?.driverId || selectedDriverObj?.id,
            }),
          },
        );
        fetchDeliveries();
      } catch (err) {
        console.warn("Backend reattempt update skipped:", err);
      }
    }

    setScheduleReattemptModalOpen(false);
    showToast(
      `Re-attempt scheduled for ${selectedDelivery.trackingId}!`,
      "info",
    );
  };

  // View Details & History
  const handleOpenDetails = (delivery) => {
    setSelectedDelivery(delivery);
    setDetailsModalOpen(true);
  };

  // Export deliveries list to CSV
  const handleExportCSV = () => {
    const headers = [
      "Delivery ID",
      "Tracking ID",
      "Customer",
      "Phone",
      "Address",
      "City",
      "Driver",
      "Vehicle",
      "Status",
      "Attempts",
      "Expected Date",
      "COD Amount",
    ];

    const rows = filteredDeliveries.map((d) => [
      d.id,
      d.trackingId,
      `"${d.customerName}"`,
      d.phone,
      `"${d.address}"`,
      d.city,
      `"${d.driverName}"`,
      `"${d.vehicleNo}"`,
      d.status,
      `${d.attemptCount}/${d.maxAttempts}`,
      d.expectedDate,
      d.amount,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Delivery_Manifest_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Delivery manifest exported successfully!");
  };

  return (
    <div className="shp-container">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`dlv-toast ${
            toast.type === "error"
              ? "dlv-toast--error"
              : toast.type === "info"
                ? "dlv-toast--info"
                : "dlv-toast--success"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="shp-header">
        <div>
          <h2 className="shp-title">Delivery Management</h2>
          <p className="shp-subtitle">
            Monitor pending dispatches, track out for delivery parcels, record
            successful or failed attempts, and schedule delivery re-attempts.
          </p>
        </div>
        <div className="shp-header__actions">
          <button
            type="button"
            className="shp-btn shp-btn--secondary"
            onClick={() => {
              fetchDeliveries(true);
              fetchDrivers();
            }}
            disabled={loading || loadingDrivers}
            title="Sync deliveries and drivers with backend"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading || loadingDrivers ? "animate-spin" : ""}`}
            />
            <span>{loading || loadingDrivers ? "Syncing..." : "Refresh"}</span>
          </button>
          <button
            type="button"
            className="shp-btn shp-btn--secondary"
            onClick={handleExportCSV}
          >
            <Download className="w-4 h-4" /> Export Manifest
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="shp-kpi-grid">
        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon">
              <Package className="w-4 h-4 text-blue-600" />
            </span>
            <span className="shp-kpi-card__title">Total Deliveries</span>
          </div>
          <div className="shp-kpi-card__value">{stats.total}</div>
          <div className="shp-kpi-card__foot">All active parcels</div>
        </div>

        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--warning">
              <Clock className="w-4 h-4 text-amber-600" />
            </span>
            <span className="shp-kpi-card__title">Pending Deliveries</span>
          </div>
          <div className="shp-kpi-card__value">{stats.pending}</div>
          <div className="shp-kpi-card__foot">Ready for route dispatch</div>
        </div>

        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--info">
              <Truck className="w-4 h-4 text-blue-600" />
            </span>
            <span className="shp-kpi-card__title">Out for Delivery</span>
          </div>
          <div className="shp-kpi-card__value">{stats.outForDelivery}</div>
          <div className="shp-kpi-card__foot">Currently on the road</div>
        </div>

        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--success">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </span>
            <span className="shp-kpi-card__title">Successfully Delivered</span>
          </div>
          <div className="shp-kpi-card__value">{stats.delivered}</div>
          <div className="shp-kpi-card__foot">Proof of delivery captured</div>
        </div>

        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--danger">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </span>
            <span className="shp-kpi-card__title">Failed Deliveries</span>
          </div>
          <div className="shp-kpi-card__value">{stats.failed}</div>
          <div className="shp-kpi-card__foot">Requires resolution</div>
        </div>

        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon">
              <RefreshCw className="w-4 h-4 text-purple-600" />
            </span>
            <span className="shp-kpi-card__title">Re-attempts Scheduled</span>
          </div>
          <div className="shp-kpi-card__value">{stats.reattempt}</div>
          <div className="shp-kpi-card__foot">Queued for next attempt</div>
        </div>
      </div>

      {/* Control Bar: Tabs & Search Filters */}
      <div className="shp-control-bar">
        {/* Status Tabs */}
        <div className="shp-tabs">
          <button
            type="button"
            className={`shp-tab ${activeTab === "all" ? "shp-tab--active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Deliveries
            <span className="shp-tab__count">{stats.total}</span>
          </button>
          <button
            type="button"
            className={`shp-tab ${
              activeTab === "pending" ? "shp-tab--active" : ""
            }`}
            onClick={() => setActiveTab("pending")}
          >
            Pending
            <span className="shp-tab__count">{stats.pending}</span>
          </button>
          <button
            type="button"
            className={`shp-tab ${
              activeTab === "out_for_delivery" ? "shp-tab--active" : ""
            }`}
            onClick={() => setActiveTab("out_for_delivery")}
          >
            Out for Delivery
            <span className="shp-tab__count">{stats.outForDelivery}</span>
          </button>
          <button
            type="button"
            className={`shp-tab ${
              activeTab === "delivered" ? "shp-tab--active" : ""
            }`}
            onClick={() => setActiveTab("delivered")}
          >
            Delivered
            <span className="shp-tab__count">{stats.delivered}</span>
          </button>
          <button
            type="button"
            className={`shp-tab ${
              activeTab === "failed_delivery" ? "shp-tab--active" : ""
            }`}
            onClick={() => setActiveTab("failed_delivery")}
          >
            Failed Delivery
            <span className="shp-tab__count">{stats.failed}</span>
          </button>
          <button
            type="button"
            className={`shp-tab ${
              activeTab === "reattempt_scheduled" ? "shp-tab--active" : ""
            }`}
            onClick={() => setActiveTab("reattempt_scheduled")}
          >
            Re-attempts
            <span className="shp-tab__count">{stats.reattempt}</span>
          </button>
        </div>

        {/* Right Search & Filters */}
        <div className="shp-filters-right">
          <div className="shp-search-box">
            <Search
              className="shp-search-icon"
              style={{ height: "18px", left: "0px" }}
            />
            <input
              type="text"
              placeholder="Search tracking, recipient, driver…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="shp-search-clear"
                onClick={() => setSearchQuery("")}
              >
                ✕
              </button>
            )}
          </div>

          <select
            className="shp-select-filter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="express">Express</option>
            <option value="high">High</option>
            <option value="standard">Standard</option>
          </select>
        </div>
      </div>

      {/* Deliveries Data Table Card */}
      <div className="shp-table-card">
        <div className="shp-table-wrap">
          <table className="shp-table">
            <thead>
              <tr>
                <th>Delivery / Tracking</th>
                <th>Recipient & Destination</th>
                <th>Driver & Vehicle</th>
                <th>Priority & Type</th>
                <th>Expected Date</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && deliveries.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="shp-empty-state">
                      <RefreshCw className="w-8 h-8 mx-auto text-blue-600 animate-spin mb-2" />
                      <div className="shp-empty-state__title">
                        Loading Deliveries from Server...
                      </div>
                      <div className="shp-empty-state__text">
                        Fetching latest delivery records from /deliveries API
                      </div>
                    </div>
                  </td>
                </tr>
              ) : paginatedDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="shp-empty-state">
                      <Package className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                      <div className="shp-empty-state__title">
                        No Deliveries Found
                      </div>
                      <div className="shp-empty-state__text">
                        Try changing the status tab, clearing your search query,
                        or resetting sample data.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDeliveries.map((item) => (
                  <tr key={item.id} className="shp-table__row">
                    {/* Tracking ID & Attempts */}
                    <td>
                      <button
                        type="button"
                        className="shp-tracking-link"
                        onClick={() => handleOpenDetails(item)}
                        title="Click to view details & timeline"
                      >
                        {item.trackingId}
                      </button>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`dlv-attempt-tag ${
                            item.attemptCount > 1 ? "dlv-attempt-tag--warn" : ""
                          }`}
                        >
                          Attempt {item.attemptCount}/{item.maxAttempts}
                        </span>
                      </div>
                    </td>

                    {/* Recipient & Destination */}
                    <td>
                      <p className="shp-cell-title">{item.customerName}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{item.phone}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="truncate max-w-55">
                          {item.address}, {item.city}
                        </span>
                      </div>
                    </td>

                    {/* Driver & Vehicle */}
                    <td>
                      <p className="shp-cell-title">
                        {item.driverName || "Unassigned"}
                      </p>
                      <span className="shp-cell-sub">
                        {item.vehicleNo || "—"}
                      </span>
                    </td>

                    {/* Priority & Package Type */}
                    <td>
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`shp-priority-pill ${
                            item.priority.toLowerCase() === "express"
                              ? "bg-purple-100 text-purple-800"
                              : item.priority.toLowerCase() === "high"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {item.priority}
                        </span>
                        <span className="text-xs text-gray-600">
                          {item.packageType} ({item.weight})
                        </span>
                        {item.amount && item.amount !== "₹0" && (
                          <span className="text-xs font-semibold text-emerald-700">
                            COD: {item.amount}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Expected Date */}
                    <td>
                      <div className="text-xs font-medium text-gray-800">
                        {item.expectedDate}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td>{renderStatusBadge(item.status)}</td>

                    {/* Action Buttons */}
                    <td>
                      <div className="shp-action-btns">
                        {/* 1. Mark Out for Delivery (if pending or reattempt_scheduled) */}
                        {(item.status === "pending" ||
                          item.status === "reattempt_scheduled") && (
                          <button
                            type="button"
                            className="shp-icon-btn dlv-action-btn-info"
                            title="Mark Out for Delivery"
                            onClick={() => handleOpenMarkOut(item)}
                          >
                            <Truck className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* 2. Confirm Delivery (if out_for_delivery) */}
                        {item.status === "out_for_delivery" && (
                          <button
                            type="button"
                            className="shp-icon-btn dlv-action-btn-success"
                            title="Confirm Successful Delivery"
                            onClick={() => handleOpenConfirmDelivery(item)}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* 3. Record Failed Delivery (if out_for_delivery) */}
                        {item.status === "out_for_delivery" && (
                          <button
                            type="button"
                            className="shp-icon-btn dlv-action-btn-danger"
                            title="Record Failed Delivery Reason"
                            onClick={() => handleOpenRecordFailed(item)}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* 4. Schedule Re-attempt (if failed_delivery) */}
                        {item.status === "failed_delivery" && (
                          <button
                            type="button"
                            className="shp-icon-btn dlv-action-btn-purple"
                            title="Schedule Delivery Re-attempt"
                            onClick={() => handleOpenScheduleReattempt(item)}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* 4. View Details & History */}
                        <button
                          type="button"
                          className="shp-icon-btn"
                          title="View Details & History Timeline"
                          onClick={() => handleOpenDetails(item)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="shp-table-footer">
          <div className="shp-pagination-info">
            Showing{" "}
            <strong>
              {filteredDeliveries.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
            </strong>{" "}
            to{" "}
            <strong>
              {Math.min(currentPage * pageSize, filteredDeliveries.length)}
            </strong>{" "}
            of <strong>{filteredDeliveries.length}</strong> deliveries
          </div>

          <div className="shp-pagination-controls">
            <div className="shp-pagination-size">
              <span>Rows per page:</span>
              <select
                className="shp-pagination-select"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>

            <div className="shp-pagination-nav">
              <button
                type="button"
                className="shp-pagination-btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(1)}
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="shp-pagination-btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs px-2 font-medium">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                className="shp-pagination-btn"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="shp-pagination-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ────────────────────────────────────────────────────────── */}

      {/* 1. MARK OUT FOR DELIVERY MODAL */}
      {markOutModalOpen && selectedDelivery && (
        <div className="shp-modal-overlay">
          <div className="shp-modal shp-modal--md">
            <div className="shp-modal__header">
              <div>
                <h3 className="shp-modal__title">Mark Out for Delivery</h3>
                <p className="shp-modal__subtitle">
                  Dispatch {selectedDelivery.trackingId} for door-to-door
                  delivery
                </p>
              </div>
              <button
                type="button"
                className="shp-modal__close"
                onClick={() => setMarkOutModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmMarkOut} className="shp-modal__form">
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-900 mb-2">
                <p className="font-semibold">{selectedDelivery.customerName}</p>
                <p className="text-blue-800">
                  {selectedDelivery.address}, {selectedDelivery.city} (
                  {selectedDelivery.pincode})
                </p>
              </div>

              <div className="shp-form-group">
                <label>
                  Assigned Delivery Driver{" "}
                  {loadingDrivers && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted, #64748b)",
                      }}
                    >
                      (Loading from database...)
                    </span>
                  )}
                </label>
                <select
                  required
                  value={outDriver}
                  onChange={(e) => setOutDriver(e.target.value)}
                  disabled={loadingDrivers}
                >
                  {loadingDrivers ? (
                    <option value="">Loading drivers from database...</option>
                  ) : (
                    <>
                      <option value="">-- Choose Driver --</option>
                      {outDriver &&
                        !driversList.some((d) => d.name === outDriver) && (
                          <option value={outDriver}>
                            {outDriver} (Current)
                          </option>
                        )}
                      {driversList.map((drv) => (
                        <option key={drv.id || drv.name} value={drv.name}>
                          {drv.name}
                          {drv.driverId ? ` (${drv.driverId})` : ""}
                          {drv.availability ? ` • ${drv.availability}` : ""}
                        </option>
                      ))}
                      {driversList.length === 0 && (
                        <>
                          <option value="Rajesh Kumar">Rajesh Kumar</option>
                          <option value="Suresh Verma">Suresh Verma</option>
                          <option value="Amit Sharma">Amit Sharma</option>
                          <option value="Vikram Patel">Vikram Patel</option>
                          <option value="Pooja Nair">Pooja Nair</option>
                        </>
                      )}
                    </>
                  )}
                </select>
              </div>

              <div className="shp-form-group">
                <label>Vehicle Details</label>
                <input
                  type="text"
                  required
                  value={outVehicle}
                  onChange={(e) => setOutVehicle(e.target.value)}
                  placeholder="e.g. MH-02-AB-1234 (Tata Ace)"
                />
              </div>

              <div className="shp-modal__footer mt-4">
                <button
                  type="button"
                  className="shp-btn shp-btn--secondary"
                  onClick={() => setMarkOutModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="shp-btn shp-btn--primary">
                  <Truck className="w-4 h-4" /> Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CONFIRM SUCCESSFUL DELIVERY MODAL */}
      {confirmDeliveryModalOpen && selectedDelivery && (
        <div className="shp-modal-overlay">
          <div className="shp-modal shp-modal--md">
            <div className="shp-modal__header">
              <div>
                <h3 className="shp-modal__title">
                  Confirm Successful Delivery
                </h3>
                <p className="shp-modal__subtitle">
                  Record delivery proof and recipient acknowledgment for{" "}
                  {selectedDelivery.trackingId}
                </p>
              </div>
              <button
                type="button"
                className="shp-modal__close"
                onClick={() => setConfirmDeliveryModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleConfirmDeliverySubmit}
              className="shp-modal__form"
            >
              <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-xs text-emerald-900 mb-2">
                <div className="flex justify-between">
                  <span className="font-semibold">
                    {selectedDelivery.customerName}
                  </span>
                  <span>Amount: {selectedDelivery.amount}</span>
                </div>
                <p className="text-emerald-800 mt-1">
                  {selectedDelivery.address}, {selectedDelivery.city}
                </p>
              </div>

              <div className="shp-form-group">
                <label>Delivered To</label>
                <select
                  value={deliveredTo}
                  onChange={(e) => setDeliveredTo(e.target.value)}
                >
                  <option value="Directly to Customer">
                    Directly to Customer
                  </option>
                  <option value="Family Member / Colleague">
                    Family Member / Colleague
                  </option>
                  <option value="Security Gate / Reception">
                    Security Gate / Reception
                  </option>
                  <option value="Safe Place / Porch">Safe Place / Porch</option>
                  <option value="Neighbor">Neighbor</option>
                </select>
              </div>

              <div className="shp-form-group">
                <label>Received By (Name)</label>
                <input
                  type="text"
                  required
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Name of person who received the parcel"
                />
              </div>

              <div className="shp-form-group">
                <label>Receiver Contact / Phone</label>
                <input
                  type="text"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  placeholder="Optional contact number"
                />
              </div>

              <div className="shp-form-group">
                <label>Proof of Delivery / Remarks</label>
                <textarea
                  rows={2}
                  value={deliveryProofNotes}
                  onChange={(e) => setDeliveryProofNotes(e.target.value)}
                  placeholder="e.g. Signature verified, OTP confirmed, or guard badge number."
                />
              </div>

              <div className="shp-modal__footer mt-4">
                <button
                  type="button"
                  className="shp-btn shp-btn--secondary"
                  onClick={() => setConfirmDeliveryModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="shp-btn shp-btn--primary bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirm & Close Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. RECORD FAILED DELIVERY MODAL */}
      {recordFailedModalOpen && selectedDelivery && (
        <div className="shp-modal-overlay">
          <div className="shp-modal shp-modal--md">
            <div className="shp-modal__header">
              <div>
                <h3 className="shp-modal__title text-rose-700">
                  Record Failed Delivery Reason
                </h3>
                <p className="shp-modal__subtitle">
                  Log reason for unsuccessful delivery of{" "}
                  {selectedDelivery.trackingId}
                </p>
              </div>
              <button
                type="button"
                className="shp-modal__close"
                onClick={() => setRecordFailedModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleRecordFailedSubmit}
              className="shp-modal__form"
            >
              <div className="bg-rose-50 border border-rose-200 rounded p-3 text-xs text-rose-900 mb-2">
                <span className="font-semibold">
                  Attempt {selectedDelivery.attemptCount || 1} of{" "}
                  {selectedDelivery.maxAttempts}
                </span>{" "}
                — {selectedDelivery.customerName} ({selectedDelivery.phone})
              </div>

              <div className="shp-form-group">
                <label>Select Failure Reason</label>
                <select
                  value={failedReason}
                  onChange={(e) => setFailedReason(e.target.value)}
                >
                  {FAILURE_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              <div className="shp-form-group">
                <label>Driver Remarks & Field Notes</label>
                <textarea
                  rows={3}
                  required
                  value={failedNotes}
                  onChange={(e) => setFailedNotes(e.target.value)}
                  placeholder="Provide specific details (e.g. called customer at 12:15 PM, gate locked, no response to doorbell)."
                />
              </div>

              {/* Schedule re-attempt immediately option */}
              <div className="border border-gray-200 rounded p-3 bg-gray-50 flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-800">
                  <input
                    type="checkbox"
                    checked={scheduleImmediately}
                    onChange={(e) => setScheduleImmediately(e.target.checked)}
                  />
                  <span>Schedule Delivery Re-attempt Immediately</span>
                </label>

                {scheduleImmediately && (
                  <div className="mt-2">
                    <div className="shp-form-group">
                      <label className="text-[11px]">
                        Re-attempt Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={immediateReattemptDate}
                        onChange={(e) =>
                          setImmediateReattemptDate(e.target.value)
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="shp-modal__footer mt-4">
                <button
                  type="button"
                  className="shp-btn shp-btn--secondary"
                  onClick={() => setRecordFailedModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="shp-btn shp-btn--primary bg-rose-600 hover:bg-rose-700"
                >
                  <AlertTriangle className="w-4 h-4" /> Save Failure Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. SCHEDULE DELIVERY RE-ATTEMPT MODAL */}
      {scheduleReattemptModalOpen && selectedDelivery && (
        <div className="shp-modal-overlay">
          <div className="shp-modal shp-modal--md">
            <div className="shp-modal__header">
              <div>
                <h3 className="shp-modal__title">
                  Schedule Delivery Re-attempt
                </h3>
                <p className="shp-modal__subtitle">
                  Configure next delivery run for {selectedDelivery.trackingId}
                </p>
              </div>
              <button
                type="button"
                className="shp-modal__close"
                onClick={() => setScheduleReattemptModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleScheduleReattemptSubmit}
              className="shp-modal__form"
            >
              <div className="bg-purple-50 border border-purple-200 rounded p-3 text-xs text-purple-900 mb-2">
                <div className="font-semibold">
                  Previous Reason:{" "}
                  {selectedDelivery.failedReason || "Customer Unavailable"}
                </div>
                <div className="text-purple-800 mt-1">
                  Recipient: {selectedDelivery.customerName} (
                  {selectedDelivery.phone})
                </div>
              </div>

              <div className="shp-form-group">
                <label>Next Re-attempt Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={reattemptDate}
                  onChange={(e) => setReattemptDate(e.target.value)}
                />
              </div>

              <div className="shp-form-group">
                <label>
                  Assigned Driver{" "}
                  {loadingDrivers && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted, #64748b)",
                      }}
                    >
                      (Loading from database...)
                    </span>
                  )}
                </label>
                <select
                  required
                  value={reattemptDriver}
                  onChange={(e) => setReattemptDriver(e.target.value)}
                  disabled={loadingDrivers}
                >
                  {loadingDrivers ? (
                    <option value="">Loading drivers from database...</option>
                  ) : (
                    <>
                      <option value="">-- Choose Driver --</option>
                      {reattemptDriver &&
                        !driversList.some(
                          (d) => d.name === reattemptDriver,
                        ) && (
                          <option value={reattemptDriver}>
                            {reattemptDriver} (Current)
                          </option>
                        )}
                      {driversList.map((drv) => (
                        <option key={drv.id || drv.name} value={drv.name}>
                          {drv.name}
                          {drv.driverId ? ` (${drv.driverId})` : ""}
                          {drv.availability ? ` • ${drv.availability}` : ""}
                        </option>
                      ))}
                      {driversList.length === 0 && (
                        <>
                          <option value="Rajesh Kumar">Rajesh Kumar</option>
                          <option value="Suresh Verma">Suresh Verma</option>
                          <option value="Amit Sharma">Amit Sharma</option>
                          <option value="Vikram Patel">Vikram Patel</option>
                          <option value="Pooja Nair">Pooja Nair</option>
                        </>
                      )}
                    </>
                  )}
                </select>
              </div>

              <div className="shp-modal__footer mt-4">
                <button
                  type="button"
                  className="shp-btn shp-btn--secondary"
                  onClick={() => setScheduleReattemptModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="shp-btn shp-btn--primary bg-purple-600 hover:bg-purple-700"
                >
                  <Calendar className="w-4 h-4" /> Save Re-attempt Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DETAILS & DELIVERY HISTORY DRAWER / MODAL */}
      {detailsModalOpen && selectedDelivery && (
        <div className="shp-modal-overlay">
          <div className="shp-modal shp-modal--lg">
            <div className="shp-modal__header">
              <div className="shp-details-head">
                <span className="shp-details-head__tracking">
                  {selectedDelivery.trackingId}
                </span>
                {renderStatusBadge(selectedDelivery.status)}
                <span className="dlv-attempt-tag">
                  Attempt {selectedDelivery.attemptCount}/
                  {selectedDelivery.maxAttempts}
                </span>
              </div>
              <button
                type="button"
                className="shp-modal__close"
                onClick={() => setDetailsModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="shp-modal__body">
              {/* Stepper Progress */}
              <div className="shp-stepper-card">
                <div className="shp-stepper">
                  <div
                    className={`shp-stepper__step ${
                      selectedDelivery.status !== "pending"
                        ? "shp-stepper__step--completed"
                        : "shp-stepper__step--current"
                    }`}
                  >
                    <div className="shp-stepper__circle">1</div>
                    <span className="shp-stepper__label">Hub Dispatch</span>
                  </div>

                  <div
                    className={`shp-stepper__step ${
                      selectedDelivery.status === "delivered"
                        ? "shp-stepper__step--completed"
                        : selectedDelivery.status === "out_for_delivery"
                          ? "shp-stepper__step--current"
                          : ""
                    }`}
                  >
                    <div className="shp-stepper__circle">2</div>
                    <span className="shp-stepper__label">Out for Delivery</span>
                  </div>

                  <div
                    className={`shp-stepper__step ${
                      selectedDelivery.status === "delivered"
                        ? "shp-stepper__step--completed"
                        : selectedDelivery.status === "failed_delivery"
                          ? "shp-stepper__step--current"
                          : ""
                    }`}
                  >
                    <div className="shp-stepper__circle">3</div>
                    <span className="shp-stepper__label">
                      {selectedDelivery.status === "delivered"
                        ? "Delivered"
                        : selectedDelivery.status === "failed_delivery"
                          ? "Failed Attempt"
                          : selectedDelivery.status === "reattempt_scheduled"
                            ? "Re-attempt Queued"
                            : "Final Outcome"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Details Cards */}
              <div className="shp-details-grid">
                {/* Left Card: Recipient Information */}
                <div className="shp-card">
                  <div className="shp-card__header">
                    <User className="w-4 h-4 text-blue-600" />
                    <h4 className="shp-card__title">Recipient Details</h4>
                  </div>
                  <div>
                    <p className="shp-address-name">
                      {selectedDelivery.customerName}
                    </p>
                    <p className="shp-address-text">
                      {selectedDelivery.address}
                    </p>
                    <p className="shp-address-text">
                      {selectedDelivery.city} - {selectedDelivery.pincode}
                    </p>
                    <div className="shp-address-contact">
                      <span>Phone: {selectedDelivery.phone}</span>
                      <span>
                        Payment Mode:{" "}
                        <strong>{selectedDelivery.paymentMode}</strong> (
                        {selectedDelivery.amount})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Card: Driver & Vehicle */}
                <div className="shp-card">
                  <div className="shp-card__header">
                    <Truck className="w-4 h-4 text-amber-600" />
                    <h4 className="shp-card__title">Transit & Driver</h4>
                  </div>
                  <div className="shp-kv-grid">
                    <div className="shp-kv">
                      <span className="shp-kv__label">Driver Name</span>
                      <span className="shp-kv__value">
                        {selectedDelivery.driverName || "Unassigned"}
                      </span>
                    </div>
                    <div className="shp-kv">
                      <span className="shp-kv__label">Driver Phone</span>
                      <span className="shp-kv__value">
                        {selectedDelivery.driverPhone || "—"}
                      </span>
                    </div>
                    <div className="shp-kv">
                      <span className="shp-kv__label">Vehicle</span>
                      <span className="shp-kv__value">
                        {selectedDelivery.vehicleNo || "—"}
                      </span>
                    </div>
                    <div className="shp-kv">
                      <span className="shp-kv__label">Expected Date</span>
                      <span className="shp-kv__value">
                        {selectedDelivery.expectedDate || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Re-attempt Schedule Details (if re-attempt is scheduled or recorded) */}
              {(selectedDelivery.status === "reattempt_scheduled" ||
                Boolean(selectedDelivery.reattemptDate) ||
                selectedDelivery.history?.some(
                  (h) => h.status === "reattempt_scheduled",
                )) && (
                <div
                  className="shp-card"
                  style={{
                    border: "1.5px solid #fde68a",
                    background: "#fffbeb",
                    marginTop: "0.25rem",
                  }}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                    <div className="shp-card__header mb-0">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <h4
                        className="shp-card__title"
                        style={{ color: "#92400e", fontWeight: 700 }}
                      >
                        Re-attempt Schedule Details
                      </h4>
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        background: "#fef3c7",
                        color: "#92400e",
                        padding: "0.2rem 0.55rem",
                        borderRadius: "9999px",
                        fontWeight: 600,
                        border: "1px solid #fde68a",
                      }}
                    >
                      Attempt #{selectedDelivery.attemptCount || 2} of{" "}
                      {selectedDelivery.maxAttempts || 3}
                    </span>
                  </div>

                  <div className="shp-kv-grid mt-3">
                    <div className="shp-kv">
                      <span
                        className="shp-kv__label"
                        style={{ color: "#92400e" }}
                      >
                        Rescheduled Delivery Date & Time
                      </span>
                      <span
                        className="shp-kv__value flex items-center gap-1.5"
                        style={{ color: "#78350f", fontWeight: 700 }}
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        {formatDateTime(
                          selectedDelivery.reattemptDate ||
                            selectedDelivery.expectedDate,
                        )}
                      </span>
                    </div>

                    <div className="shp-kv">
                      <span
                        className="shp-kv__label"
                        style={{ color: "#92400e" }}
                      >
                        Assigned Driver for Re-attempt
                      </span>
                      <span
                        className="shp-kv__value"
                        style={{ color: "#78350f", fontWeight: 600 }}
                      >
                        {selectedDelivery.driverName || "Unassigned"}
                      </span>
                    </div>

                    {selectedDelivery.failedReason && (
                      <div className="shp-kv">
                        <span
                          className="shp-kv__label"
                          style={{ color: "#be123c" }}
                        >
                          Previous Attempt Failure Reason
                        </span>
                        <span
                          className="shp-kv__value"
                          style={{ color: "#9f1239", fontWeight: 600 }}
                        >
                          {selectedDelivery.failedReason}
                        </span>
                      </div>
                    )}

                    {(selectedDelivery.failedNotes ||
                      selectedDelivery.reattemptNotes) && (
                      <div className="shp-kv">
                        <span
                          className="shp-kv__label"
                          style={{ color: "#92400e" }}
                        >
                          Failure / Dispatcher Instructions
                        </span>
                        <span
                          className="shp-kv__value"
                          style={{ color: "#78350f" }}
                        >
                          {selectedDelivery.reattemptNotes ||
                            selectedDelivery.failedNotes}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Delivery Notes Section */}
              <div className="shp-card">
                <div className="shp-card__header">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <h4 className="shp-card__title">
                    Delivery Instructions & Notes
                  </h4>
                </div>

                {!selectedDelivery.notes ||
                selectedDelivery.notes.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">
                    No special instructions logged.
                  </p>
                ) : (
                  <div className="dlv-notes-list">
                    {selectedDelivery.notes.map((note) => (
                      <div key={note.id} className="dlv-note-card">
                        <div className="dlv-note-header">
                          <span className="dlv-note-author">{note.author}</span>
                          <span>{note.time}</span>
                        </div>
                        <p className="dlv-note-text">{note.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivery History & Audit Trail */}
              <div className="shp-card">
                <div className="shp-card__header">
                  <RefreshCw className="w-4 h-4 text-emerald-600" />
                  <h4 className="shp-card__title">
                    Delivery History & Audit Trail
                  </h4>
                </div>

                <div className="dlv-timeline">
                  {selectedDelivery.history.map((h) => {
                    const isDelivered = h.status === "delivered";
                    const isFailed = h.status === "failed_delivery";
                    const isOut = h.status === "out_for_delivery";
                    const isReattempt = h.status === "reattempt_scheduled";

                    return (
                      <div key={h.id} className="dlv-timeline-item">
                        <span
                          className={`dlv-timeline-dot ${
                            isDelivered
                              ? "dlv-timeline-dot--delivered"
                              : isFailed
                                ? "dlv-timeline-dot--failed"
                                : isOut
                                  ? "dlv-timeline-dot--out"
                                  : isReattempt
                                    ? "dlv-timeline-dot--reattempt"
                                    : ""
                          }`}
                        />
                        <div className="dlv-timeline-title">{h.title}</div>
                        <div className="dlv-timeline-meta">
                          <span>{h.timestamp}</span>
                          <span>•</span>
                          <span>By: {h.author}</span>
                        </div>
                        {h.reason && (
                          <div className="mt-1">
                            <span className="dlv-timeline-reason">
                              Reason: {h.reason}
                            </span>
                          </div>
                        )}
                        {h.notes && (
                          <div className="dlv-timeline-body">{h.notes}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="shp-modal__footer">
              <div className="flex items-center gap-2">
                {selectedDelivery.status === "out_for_delivery" && (
                  <>
                    <button
                      type="button"
                      className="shp-btn shp-btn--primary bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        setDetailsModalOpen(false);
                        handleOpenConfirmDelivery(selectedDelivery);
                      }}
                    >
                      <Check className="w-4 h-4" /> Confirm Delivered
                    </button>
                    <button
                      type="button"
                      className="shp-btn shp-btn--secondary text-rose-600 border-rose-300 hover:bg-rose-50"
                      onClick={() => {
                        setDetailsModalOpen(false);
                        handleOpenRecordFailed(selectedDelivery);
                      }}
                    >
                      <AlertTriangle className="w-4 h-4" /> Mark Failed
                    </button>
                  </>
                )}
                {selectedDelivery.status === "pending" && (
                  <button
                    type="button"
                    className="shp-btn shp-btn--primary"
                    onClick={() => {
                      setDetailsModalOpen(false);
                      handleOpenMarkOut(selectedDelivery);
                    }}
                  >
                    <Truck className="w-4 h-4" /> Dispatch Out for Delivery
                  </button>
                )}
                {selectedDelivery.status === "failed_delivery" && (
                  <button
                    type="button"
                    className="shp-btn shp-btn--primary bg-purple-600 hover:bg-purple-700"
                    onClick={() => {
                      setDetailsModalOpen(false);
                      handleOpenScheduleReattempt(selectedDelivery);
                    }}
                  >
                    <Calendar className="w-4 h-4" /> Schedule Re-attempt
                  </button>
                )}
                {selectedDelivery.status === "reattempt_scheduled" && (
                  <>
                    <button
                      type="button"
                      className="shp-btn shp-btn--primary"
                      onClick={() => {
                        setDetailsModalOpen(false);
                        handleOpenMarkOut(selectedDelivery);
                      }}
                    >
                      <Truck className="w-4 h-4" /> Dispatch Out for Delivery
                    </button>
                    <button
                      type="button"
                      className="shp-btn shp-btn--secondary text-purple-700 border-purple-300 hover:bg-purple-50"
                      onClick={() => {
                        setDetailsModalOpen(false);
                        handleOpenScheduleReattempt(selectedDelivery);
                      }}
                    >
                      <Calendar className="w-4 h-4" /> Reschedule Re-attempt
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="shp-btn shp-btn--secondary"
                  onClick={() => setDetailsModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
