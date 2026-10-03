import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Warehouse as WarehouseIcon,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Download,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  Box,
  Layers,
  MapPin,
  Calendar,
  User,
  Check,
  ChevronRight,
  AlertCircle,
  X,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from "lucide-react";
import "../../styles/WarehouseManagement.css";
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

const getCurrentUserId = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u._id || u.userId || u.id || null;
  } catch {
    return null;
  }
};

export default function Warehouse() {
  // Master API States
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [warehouseLocations, setWarehouseLocations] = useState([]);
  const [storageItems, setStorageItems] = useState([]);
  const [inboundShipments, setInboundShipments] = useState([]);
  const [outboundShipments, setOutboundShipments] = useState([]);
  const [inboundHistory, setInboundHistory] = useState([]);
  const [outboundHistory, setOutboundHistory] = useState([]);

  // Loading States
  const [loading, setLoading] = useState(false);
  const [submittingWarehouse, setSubmittingWarehouse] = useState(false);
  const [submittingLocation, setSubmittingLocation] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [submittingStorage, setSubmittingStorage] = useState(false);
  const [submittingDispatch, setSubmittingDispatch] = useState(false);

  // Active View Tabs
  const [activeMainTab, setActiveMainTab] = useState("locations");
  const [historyTab, setHistoryTab] = useState("inbound");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All");
  const [selectedZoneFilter, setSelectedZoneFilter] = useState("All");

  // Toast feedback notification (same as DashboardShipment.jsx)
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (text, type = "success") => {
    setToastMessage({ text, message: text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Modals
  const [createWarehouseModalOpen, setCreateWarehouseModalOpen] =
    useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [viewingWarehouse, setViewingWarehouse] = useState(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [viewShipmentModal, setViewShipmentModal] = useState(null);
  const [editPackageLocationModal, setEditPackageLocationModal] =
    useState(null);

  // Warehouse Form State
  const [warehouseFormData, setWarehouseFormData] = useState({
    name: "",
    address: "",
    location: "",
    totalCapacity: "",
    status: "Active",
  });
  const [warehouseFormErrors, setWarehouseFormErrors] = useState({});

  // Location Form State
  const [locationFormData, setLocationFormData] = useState({
    warehouseId: "",
    warlocZone: "Zone A",
    warlocRack: "Rack A-01",
    warlocBin: "Bin A-01-01",
    warlocCapacity: 100,
    warlocStatus: "available",
  });
  const [locationFormErrors, setLocationFormErrors] = useState({});

  // Scanner Flow State
  const [scannerStep, setScannerStep] = useState("scan");
  const [scannerInputCode, setScannerInputCode] = useState("");
  const [scannedPackage, setScannedPackage] = useState(null);
  const [assignedLocationId, setAssignedLocationId] = useState("");
  const [dispatchScanCode, setDispatchScanCode] = useState("");
  const [dispatchScanError, setDispatchScanError] = useState("");
  const [locationAssignError, setLocationAssignError] = useState("");

  // ───────────────────────────────────────────────────────────────────────────
  //  API CALLS
  // ───────────────────────────────────────────────────────────────────────────

  // 1. GET /warehouse-list
  const fetchWarehouses = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/warehouse-list`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.listwarehouse)
          ? data.listwarehouse
          : [];
        setWarehouses(list);
        if (list.length > 0) {
          setSelectedWarehouseId((prev) => prev || list[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to load warehouses:", err);
    }
  }, []);

  // 2. GET /warehouse-location-get/:id
  const fetchLocations = useCallback(async (whId) => {
    if (!whId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/warehouse-location-get/${whId}`,
        {
          headers: getAuthHeaders(),
        },
      );
      if (res.ok) {
        const data = await res.json();
        setWarehouseLocations(
          Array.isArray(data.warhouseloclist) ? data.warhouseloclist : [],
        );
      }
    } catch (err) {
      console.error("Failed to load warehouse locations:", err);
    }
  }, []);

  // 3. GET /warehouse/:id/storage
  const fetchStorage = useCallback(async (whId) => {
    if (!whId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/warehouse/${whId}/storage`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setStorageItems(
          Array.isArray(data.warehouseStorage) ? data.warehouseStorage : [],
        );
      }
    } catch (err) {
      console.error("Failed to load storage items:", err);
    }
  }, []);

  // 4. GET /shipments
  const fetchShipments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/shipments?limit=1000`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const allShipments = Array.isArray(data.shipments)
          ? data.shipments
          : [];
        const inbounds = allShipments.filter(
          (s) => s.status === "picked_up" || s.status === "at_warehouse",
        );
        const outbounds = allShipments.filter(
          (s) => s.status === "at_warehouse" || s.status === "dispatched",
        );
        setInboundShipments(inbounds);
        setOutboundShipments(outbounds);
      }
    } catch (err) {
      console.error("Failed to load shipments:", err);
    }
  }, []);

  // 5. GET /warehouses/:warehouseId/inbound-history & outbound-history
  const fetchHistory = useCallback(async (whId) => {
    if (!whId) return;
    try {
      const [inRes, outRes] = await Promise.all([
        fetch(`${API_BASE_URL}/warehouses/${whId}/inbound-history`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_BASE_URL}/warehouses/${whId}/outbound-history`, {
          headers: getAuthHeaders(),
        }),
      ]);
      if (inRes.ok) {
        const inData = await inRes.json();
        setInboundHistory(
          Array.isArray(inData.warehouseTransaction)
            ? inData.warehouseTransaction
            : [],
        );
      }
      if (outRes.ok) {
        const outData = await outRes.json();
        setOutboundHistory(
          Array.isArray(outData.warehouseTransaction)
            ? outData.warehouseTransaction
            : [],
        );
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  }, []);

  // Load initial datasets
  useEffect(() => {
    fetchWarehouses();
    fetchShipments();
  }, [fetchWarehouses, fetchShipments]);

  // Load warehouse-scoped datasets when selectedWarehouseId changes
  useEffect(() => {
    if (selectedWarehouseId) {
      fetchLocations(selectedWarehouseId);
      fetchStorage(selectedWarehouseId);
      fetchHistory(selectedWarehouseId);
    }
  }, [selectedWarehouseId, fetchLocations, fetchStorage, fetchHistory]);

  // Selected warehouse object
  const activeWarehouse = useMemo(() => {
    return (
      warehouses.find((w) => w._id === selectedWarehouseId) ||
      warehouses[0] ||
      null
    );
  }, [warehouses, selectedWarehouseId]);

  // Available Zones from loaded warehouse locations
  const availableZones = useMemo(() => {
    const zones = Array.from(
      new Set(warehouseLocations.map((l) => l.warlocZone)),
    ).filter(Boolean);
    return zones.length > 0 ? zones : ["Zone A", "Zone B", "Zone C"];
  }, [warehouseLocations]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalWarehousesCount = warehouses.filter(
      (w) => w.warStatus?.toLowerCase() === "active",
    ).length;
    const totalCap = warehouses.reduce((sum, w) => {
      const raw = w.warCapacity ?? w.capacity ?? 0;
      const cleaned =
        typeof raw === "string" ? raw.replace(/[^0-9.-]+/g, "") : raw;
      const val = Number(cleaned);
      return sum + (Number.isFinite(val) ? val : 0);
    }, 0);
    const activeStoredCount = storageItems.filter(
      (i) => i.warstorStatus === "store",
    ).length;
    const storageUsedPercentage =
      totalCap > 0 ? Math.round((activeStoredCount / totalCap) * 100) : 0;
    const inboundTodaySum = inboundShipments.length;
    const outboundTodaySum = outboundShipments.length;

    return {
      totalWarehouses: totalWarehousesCount,
      totalCapacity: totalCap,
      storageUsedPercent: `${storageUsedPercentage}%`,
      inboundToday: inboundTodaySum,
      outboundToday: outboundTodaySum,
    };
  }, [warehouses, storageItems, inboundShipments, outboundShipments]);

  // Refresh all data
  const handleRefresh = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchWarehouses(),
        fetchShipments(),
        selectedWarehouseId
          ? fetchLocations(selectedWarehouseId)
          : Promise.resolve(),
        selectedWarehouseId
          ? fetchStorage(selectedWarehouseId)
          : Promise.resolve(),
        selectedWarehouseId
          ? fetchHistory(selectedWarehouseId)
          : Promise.resolve(),
      ]);
      showToast("Warehouse data refreshed from server");
    } catch {
      showToast("Failed to refresh data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Export CSVs
  const exportWarehouseCSV = () => {
    const headers = [
      "Warehouse ID",
      "Name",
      "City/Location",
      "Address",
      "Capacity",
      "Status",
    ];
    const rows = warehouses.map((w) => [
      `"${w.warehouseId || ""}"`,
      `"${w.warName || ""}"`,
      `"${w.warCity || ""}"`,
      `"${w.warAddress || ""}"`,
      w.warCapacity || 0,
      `"${w.warStatus || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `warehouses_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Warehouse CSV exported successfully!");
  };

  const exportPackagesCSV = () => {
    const headers = [
      "Tracking ID",
      "Shipment ID",
      "Warehouse",
      "Zone",
      "Rack",
      "Bin",
      "Stored At",
      "Status",
    ];
    const rows = storageItems.map((p) => {
      const s = p.shipmentId || {};
      const l = p.locationId || {};
      return [
        `"${s.trackingId || ""}"`,
        `"${s.shipmentId || ""}"`,
        `"${p.warehouseId?.warName || ""}"`,
        `"${l.warlocZone || ""}"`,
        `"${l.warlocRack || ""}"`,
        `"${l.warlocBin || ""}"`,
        `"${p.storeAt ? new Date(p.storeAt).toLocaleString() : ""}"`,
        `"${p.warstorStatus || ""}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `storage_inventory_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Storage Inventory CSV exported successfully!");
  };

  // ───────────────────────────────────────────────────────────────────────────
  //  WAREHOUSE MODAL ACTIONS (POST /warehouse-create, PATCH /warehouse-update)
  // ───────────────────────────────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setEditingWarehouse(null);
    setWarehouseFormData({
      name: "",
      address: "",
      location: "",
      totalCapacity: "",
      status: "Active",
    });
    setWarehouseFormErrors({});
    setCreateWarehouseModalOpen(true);
  };

  const handleOpenEditModal = (wh) => {
    setEditingWarehouse(wh);
    setWarehouseFormData({
      name: wh.warName || "",
      address: wh.warAddress || "",
      location: wh.warCity || "",
      totalCapacity: wh.warCapacity || "",
      status: wh.warStatus?.toLowerCase() === "active" ? "Active" : "Inactive",
    });
    setWarehouseFormErrors({});
    setCreateWarehouseModalOpen(true);
  };

  const handleWarehouseFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!warehouseFormData.name.trim())
      errors.name = "Warehouse name is required";
    if (!warehouseFormData.address.trim())
      errors.address = "Warehouse address is required";
    if (!warehouseFormData.location.trim())
      errors.location = "Location / City is required";
    if (
      !warehouseFormData.totalCapacity ||
      Number(warehouseFormData.totalCapacity) <= 0
    ) {
      errors.totalCapacity = "Total capacity must be a positive number";
    }

    if (Object.keys(errors).length > 0) {
      setWarehouseFormErrors(errors);
      return;
    }

    const payload = {
      warName: warehouseFormData.name.trim(),
      warAddress: warehouseFormData.address.trim(),
      warCity: warehouseFormData.location.trim(),
      warCapacity: Number(warehouseFormData.totalCapacity),
      warStatus: warehouseFormData.status.toLowerCase(),
    };

    setSubmittingWarehouse(true);
    try {
      if (editingWarehouse && editingWarehouse._id) {
        // PATCH /warehouse-update/:id
        const res = await fetch(
          `${API_BASE_URL}/warehouse-update/${editingWarehouse._id}`,
          {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
          },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(data.message || "Failed to update warehouse");
        showToast(data.message || "Warehouse updated successfully!");
      } else {
        // POST /warehouse-create
        const res = await fetch(`${API_BASE_URL}/warehouse-create`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(data.message || "Failed to create warehouse");
        showToast(data.message || "Warehouse created successfully!");
      }

      await fetchWarehouses();
      setCreateWarehouseModalOpen(false);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmittingWarehouse(false);
    }
  };

  // PATCH /warehouse-update-status/:id
  const handleWarehouseStatusToggle = async (whId, currentStatus) => {
    const newStatus =
      currentStatus?.toLowerCase() === "active" ? "inactive" : "active";
    try {
      const res = await fetch(
        `${API_BASE_URL}/warehouse-update-status/${whId}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ warStatus: newStatus }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to update status");
      showToast(`Warehouse marked as ${newStatus}`);
      fetchWarehouses();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  //  LOCATION MANAGEMENT (POST, PATCH /warehouse-location*)
  // ───────────────────────────────────────────────────────────────────────────
  const handleOpenAddLocationModal = (targetWhId) => {
    setEditingLocation(null);
    setLocationFormData({
      warehouseId:
        targetWhId || selectedWarehouseId || warehouses[0]?._id || "",
      warlocZone: "Zone A",
      warlocRack: "Rack A-01",
      warlocBin: "Bin A-01-01",
      warlocCapacity: 100,
      warlocStatus: "available",
    });
    setLocationFormErrors({});
    setLocationModalOpen(true);
  };

  const handleOpenEditLocationModal = (loc) => {
    setEditingLocation(loc);
    setLocationFormData({
      warehouseId: loc.warehouseId,
      warlocZone: loc.warlocZone,
      warlocRack: loc.warlocRack,
      warlocBin: loc.warlocBin,
      warlocCapacity: loc.warlocCapacity,
      warlocStatus: loc.warlocStatus || "available",
    });
    setLocationFormErrors({});
    setLocationModalOpen(true);
  };

  const handleLocationFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!locationFormData.warehouseId)
      errors.warehouseId = "Warehouse is required";
    if (!locationFormData.warlocZone.trim())
      errors.warlocZone = "Zone is required";
    if (!locationFormData.warlocRack.trim())
      errors.warlocRack = "Rack is required";
    if (!locationFormData.warlocBin.trim())
      errors.warlocBin = "Bin is required";
    if (
      !locationFormData.warlocCapacity ||
      Number(locationFormData.warlocCapacity) <= 0
    )
      errors.warlocCapacity = "Capacity must be greater than 0";

    if (Object.keys(errors).length > 0) {
      setLocationFormErrors(errors);
      return;
    }

    setSubmittingLocation(true);
    try {
      if (editingLocation && editingLocation._id) {
        // PATCH /warehouse-location-update/:id
        const res = await fetch(
          `${API_BASE_URL}/warehouse-location-update/${editingLocation._id}`,
          {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              warlocZone: locationFormData.warlocZone.trim(),
              warlocRack: locationFormData.warlocRack.trim(),
              warlocBin: locationFormData.warlocBin.trim(),
              warlocCapacity: String(locationFormData.warlocCapacity),
              warlocStatus: locationFormData.warlocStatus,
            }),
          },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(data.message || "Failed to update location");
        showToast(data.message || "Location updated successfully!");
      } else {
        // POST /warehouse-location
        const res = await fetch(`${API_BASE_URL}/warehouse-location`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            warehouseId: locationFormData.warehouseId,
            warlocZone: locationFormData.warlocZone.trim(),
            warlocRack: locationFormData.warlocRack.trim(),
            warlocBin: locationFormData.warlocBin.trim(),
            warlocCapacity: String(locationFormData.warlocCapacity),
            warlocStatus: locationFormData.warlocStatus,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(data.message || "Failed to create location");
        showToast(data.message || "Warehouse location saved successfully!");
      }

      await fetchLocations(locationFormData.warehouseId);
      setLocationModalOpen(false);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmittingLocation(false);
    }
  };

  // PATCH /warehouse-location-status/:id
  const handleLocationStatusToggle = async (locId, currentStatus) => {
    const nextStatus = currentStatus === "available" ? "full" : "available";
    try {
      const res = await fetch(
        `${API_BASE_URL}/warehouse-location-status/${locId}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ warlocStatus: nextStatus }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to toggle status");
      showToast(`Location marked as ${nextStatus}`);
      if (selectedWarehouseId) fetchLocations(selectedWarehouseId);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  //  SCANNER FLOW (GET /warehouse-scane/:id, POST /warehouse/inbound, PATCH /warehouse/outbound)
  // ───────────────────────────────────────────────────────────────────────────
  const handleOpenScanner = (prefillCode = "") => {
    setActiveMainTab("scanner");
    setScannerInputCode(prefillCode);
    setScannerStep(prefillCode ? "verify" : "scan");
    setScannedPackage(null);
    setDispatchScanCode("");
    setDispatchScanError("");
    setLocationAssignError("");
    setAssignedLocationId("");

    if (prefillCode) {
      verifyScannedCode(prefillCode);
    }
  };

  // GET /warehouse-scane/:id or GET /warehouse/storage/tracking/:id
  const verifyScannedCode = async (codeToVerify) => {
    let rawCode = (codeToVerify || scannerInputCode).trim();
    if (!rawCode) return;

    if (rawCode.includes("/warehouse-scan/")) {
      rawCode =
        rawCode.split("/warehouse-scan/")[1]?.split(/[?#/]/)[0] || rawCode;
    }
    const code = rawCode.trim();
    if (!code) return;

    setVerifyingCode(true);
    try {
      // 1. Try intake scan via /warehouse-scane/:id (expects shipment status === "picked_up")
      const res = await fetch(
        `${API_BASE_URL}/warehouse-scane/${encodeURIComponent(code)}`,
      );
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.findshipment) {
        const s = data.findshipment;
        setScannedPackage({
          _id: s._id,
          trackingId: s.trackingId,
          shipmentId: s.shipmentId || s._id,
          customer: s.receiverName || s.senderName || "Valued Customer",
          origin: s.pickupAddress || "Pickup Point",
          destination: s.deliveryAddress || "Delivery Depot",
          packageCount: s.packageCount || 1,
          weight: `${s.totalWeight || 0} kg`,
          status: s.status,
          isOutboundReady: false,
        });
        setScannerStep("valid");
        return;
      }

      // 2. If already in warehouse, check /warehouse/storage/tracking/:trackingId for outbound dispatch
      const storageRes = await fetch(
        `${API_BASE_URL}/warehouse/storage/tracking/${encodeURIComponent(code)}`,
        { headers: getAuthHeaders() },
      );
      const storageData = await storageRes.json().catch(() => ({}));

      if (storageRes.ok && storageData.findWarehouseStorage) {
        const ws = storageData.findWarehouseStorage;
        const s = ws.shipmentId || {};
        setScannedPackage({
          _id: s._id,
          storageId: ws._id,
          trackingId: s.trackingId || code,
          shipmentId: s.shipmentId || s._id,
          customer: s.receiverName || s.senderName || "Valued Customer",
          origin: ws.warehouseId?.warName || "Warehouse",
          destination: s.deliveryAddress || "Delivery Address",
          packageCount: s.packageCount || 1,
          weight: `${s.totalWeight || 0} kg`,
          status: s.status || "at_warehouse",
          warehouseId: ws.warehouseId?._id || ws.warehouseId,
          warehouseName: ws.warehouseId?.warName || "Assigned Warehouse",
          locationStr: ws.locationId
            ? `${ws.locationId.warlocZone} / ${ws.locationId.warlocRack} / ${ws.locationId.warlocBin}`
            : "Assigned Bin",
          isOutboundReady: true,
        });
        setScannerStep("valid");
        return;
      }

      // Neither found
      showToast(
        data.message ||
          storageData.message ||
          "Shipment not found or not eligible for intake",
        "error",
      );
      setScannerStep("invalid");
    } catch (err) {
      showToast(err.message || "Failed to scan shipment", "error");
      setScannerStep("invalid");
    } finally {
      setVerifyingCode(false);
    }
  };

  // POST /warehouse/inbound
  const handleStorePackage = async () => {
    if (!scannedPackage?._id) {
      showToast("No verified shipment to store", "error");
      return;
    }

    const whId = selectedWarehouseId || warehouses[0]?._id;
    if (!whId) {
      showToast("Please create or select a warehouse first", "error");
      return;
    }

    let locId = assignedLocationId;
    if (!locId && warehouseLocations.length > 0) {
      locId = warehouseLocations[0]._id;
    }

    if (!locId) {
      setLocationAssignError(
        "No storage location found. Please add a location (Zone/Rack/Bin) to this warehouse first.",
      );
      return;
    }
    setLocationAssignError("");

    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      showToast(
        "Please log in as a registered user to process inbound freight",
        "error",
      );
      return;
    }

    setSubmittingStorage(true);
    try {
      const res = await fetch(`${API_BASE_URL}/warehouse/inbound`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          warehouseId: whId,
          shipmentId: scannedPackage._id,
          locationId: locId,
          wartansactonProcessBy: currentUserId,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to store package");

      showToast(data.message || "Shipment Stored in Warehouse Successfully!");
      setScannerStep("storage");
      fetchStorage(whId);
      fetchShipments();
      fetchHistory(whId);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmittingStorage(false);
    }
  };

  // PATCH /warehouse/outbound
  const executeDispatch = async (shipmentId) => {
    if (!shipmentId) return;
    setSubmittingDispatch(true);
    try {
      const res = await fetch(`${API_BASE_URL}/warehouse/outbound`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ shipmentId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data.message || "Failed to dispatch shipment");

      showToast(data.message || "Shipment Out of Warehouse Successfully!");
      setScannerStep("dispatch-success");
      if (selectedWarehouseId) {
        fetchStorage(selectedWarehouseId);
        fetchHistory(selectedWarehouseId);
      }
      fetchShipments();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmittingDispatch(false);
    }
  };

  const handleDispatchQRVerify = () => {
    let rawCode = dispatchScanCode.trim();
    if (!rawCode) {
      setDispatchScanError("Please enter or scan tracking code");
      return;
    }

    if (rawCode.includes("/warehouse-scan/")) {
      rawCode =
        rawCode.split("/warehouse-scan/")[1]?.split(/[?#/]/)[0] || rawCode;
    }
    const code = rawCode.trim();

    if (
      code.toLowerCase() !== scannedPackage?.trackingId?.toLowerCase() &&
      code.toLowerCase() !== scannedPackage?.shipmentId?.toLowerCase()
    ) {
      setDispatchScanError(
        "Verification failed: code does not match this shipment",
      );
      return;
    }

    setDispatchScanError("");
    executeDispatch(scannedPackage._id);
  };

  // Helper resolvers for shipment origin & destination
  const getShipmentOrigin = (s) => {
    if (!s) return "N/A";
    const city = s.senderCity || s.originCity || "";
    const state = s.senderState || "";
    const cityState = [city, state].filter(Boolean).join(", ");
    const address = s.senderAddress || s.pickupAddress || s.originAddress || "";
    const pin = s.senderpincode ? `${s.senderpincode}` : "";

    if (cityState && address) {
      if (city && address.toLowerCase().includes(city.toLowerCase())) {
        return pin ? `${address} - ${pin}` : address;
      }
      const full = `${address}, ${cityState}`;
      return pin ? `${full} - ${pin}` : full;
    }

    if (cityState) {
      return pin ? `${cityState} - ${pin}` : cityState;
    }

    if (address) {
      return pin ? `${address} - ${pin}` : address;
    }

    return (
      s.origin ||
      (typeof s.tripNo === "object" ? s.tripNo?.origin : "") ||
      "N/A"
    );
  };

  const getShipmentDestination = (s) => {
    if (!s) return "N/A";
    const city = s.receiverCity || s.destinationCity || "";
    const state = s.receiverState || "";
    const cityState = [city, state].filter(Boolean).join(", ");
    const address = s.receiverAddress || s.deliveryAddress || "";
    const pin = s.receiverpincode ? `${s.receiverpincode}` : "";

    if (cityState && address) {
      if (city && address.toLowerCase().includes(city.toLowerCase())) {
        return pin ? `${address} - ${pin}` : address;
      }
      const full = `${address}, ${cityState}`;
      return pin ? `${full} - ${pin}` : full;
    }

    if (cityState) {
      return pin ? `${cityState} - ${pin}` : cityState;
    }

    if (address) {
      return pin ? `${address} - ${pin}` : address;
    }

    return (
      s.destination ||
      (typeof s.tripNo === "object" ? s.tripNo?.destination : "") ||
      "N/A"
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  //  FILTERED LISTS
  // ───────────────────────────────────────────────────────────────────────────
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((w) => {
      const q = (searchQuery || "").toLowerCase();
      const matchSearch =
        (w.warName || "").toLowerCase().includes(q) ||
        (w.warehouseId || "").toLowerCase().includes(q) ||
        (w.warCity || "").toLowerCase().includes(q) ||
        (w.warAddress || "").toLowerCase().includes(q);
      const matchStatus =
        selectedStatusFilter === "All" ||
        w.warStatus?.toLowerCase() === selectedStatusFilter.toLowerCase();
      const matchLoc =
        selectedWarehouseFilter === "All" ||
        w.warName === selectedWarehouseFilter ||
        w.warCity === selectedWarehouseFilter;
      return matchSearch && matchStatus && matchLoc;
    });
  }, [warehouses, searchQuery, selectedStatusFilter, selectedWarehouseFilter]);

  const filteredInbound = useMemo(() => {
    return inboundShipments.filter((s) => {
      const q = (searchQuery || "").toLowerCase();
      const originStr = getShipmentOrigin(s).toLowerCase();
      const matchSearch =
        (s.trackingId || "").toLowerCase().includes(q) ||
        (s.senderName || "").toLowerCase().includes(q) ||
        (s.receiverName || "").toLowerCase().includes(q) ||
        (s.pickupAddress || "").toLowerCase().includes(q) ||
        (s.senderAddress || "").toLowerCase().includes(q) ||
        (s.senderCity || "").toLowerCase().includes(q) ||
        (s.senderState || "").toLowerCase().includes(q) ||
        originStr.includes(q);
      const matchStatus =
        selectedStatusFilter === "All" || s.status === selectedStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [inboundShipments, searchQuery, selectedStatusFilter]);

  const filteredOutbound = useMemo(() => {
    return outboundShipments.filter((s) => {
      const q = (searchQuery || "").toLowerCase();
      const destStr = getShipmentDestination(s).toLowerCase();
      const matchSearch =
        (s.trackingId || "").toLowerCase().includes(q) ||
        (s.receiverName || "").toLowerCase().includes(q) ||
        (s.senderName || "").toLowerCase().includes(q) ||
        (s.deliveryAddress || "").toLowerCase().includes(q) ||
        (s.receiverAddress || "").toLowerCase().includes(q) ||
        (s.receiverCity || "").toLowerCase().includes(q) ||
        (s.receiverState || "").toLowerCase().includes(q) ||
        destStr.includes(q);
      const matchStatus =
        selectedStatusFilter === "All" || s.status === selectedStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [outboundShipments, searchQuery, selectedStatusFilter]);

  const filteredStorage = useMemo(() => {
    return storageItems.filter((p) => {
      const s = p.shipmentId || {};
      const l = p.locationId || {};
      const q = (searchQuery || "").toLowerCase();
      const matchSearch =
        (s.trackingId || "").toLowerCase().includes(q) ||
        (s.receiverName || "").toLowerCase().includes(q) ||
        (l.warlocZone || "").toLowerCase().includes(q) ||
        (l.warlocRack || "").toLowerCase().includes(q) ||
        (l.warlocBin || "").toLowerCase().includes(q);
      const matchZone =
        selectedZoneFilter === "All" || l.warlocZone === selectedZoneFilter;
      return matchSearch && matchZone;
    });
  }, [storageItems, searchQuery, selectedZoneFilter]);

  const filteredInboundHistory = useMemo(() => {
    return inboundHistory.filter((h) => {
      const q = (searchQuery || "").toLowerCase();
      const s = h.shipmentId || {};
      return (
        (s.trackingId || "").toLowerCase().includes(q) ||
        (s.receiverName || "").toLowerCase().includes(q) ||
        (s.senderName || "").toLowerCase().includes(q)
      );
    });
  }, [inboundHistory, searchQuery]);

  const filteredOutboundHistory = useMemo(() => {
    return outboundHistory.filter((h) => {
      const q = (searchQuery || "").toLowerCase();
      const s = h.shipmentId || {};
      return (
        (s.trackingId || "").toLowerCase().includes(q) ||
        (s.receiverName || "").toLowerCase().includes(q) ||
        (s.deliveryAddress || "").toLowerCase().includes(q)
      );
    });
  }, [outboundHistory, searchQuery]);

  const renderStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "active":
      case "available":
      case "delivered":
        return <span className="shp-badge shp-badge--success">{status}</span>;
      case "stored":
      case "store":
        return <span className="shp-badge shp-badge--info">Stored</span>;
      case "picked_up":
      case "received":
        return <span className="shp-badge shp-badge--info">Picked Up</span>;
      case "at_warehouse":
        return (
          <span className="shp-badge shp-badge--warning">At Warehouse</span>
        );
      case "dispatched":
        return <span className="shp-badge shp-badge--info">Dispatched</span>;
      case "full":
        return <span className="shp-badge shp-badge--danger">Full</span>;
      case "inactive":
      case "remove":
      default:
        return (
          <span className="shp-badge shp-badge--outline">
            {status || "N/A"}
          </span>
        );
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="shp-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            background:
              toastMessage.type === "error"
                ? "#e11d48"
                : toastMessage.type === "info"
                  ? "#0284c7"
                  : "#0f172a",
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
          {toastMessage.type === "error" ? (
            <AlertCircle size={16} className="text-rose-400" />
          ) : toastMessage.type === "info" ? (
            <AlertCircle size={16} className="text-blue-300" />
          ) : (
            <Check size={16} className="text-emerald-400" />
          )}
          <span>{toastMessage.text || toastMessage.message}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              marginLeft: "6px",
              padding: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="shp-header">
        <div>
          <h2 className="shp-title">Warehouse Management</h2>
          <p className="shp-subtitle">
            Facility locations, inventory control, and barcode intake / dispatch
            operations across the logistics network.
          </p>
        </div>
        <div className="shp-header__actions">
          <button
            type="button"
            className="shp-btn shp-btn--ghost"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh server data"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Sync
          </button>
          <button
            type="button"
            className="shp-btn shp-btn--secondary"
            onClick={exportWarehouseCSV}
            title="Export CSV"
          >
            <FileSpreadsheet size={14} />
            Export CSV
          </button>
          <button
            type="button"
            className="shp-btn shp-btn--secondary"
            onClick={() => handleOpenAddLocationModal("")}
          >
            <Plus size={14} />
            Add Location
          </button>
          <button
            type="button"
            className="shp-btn shp-btn--primary"
            onClick={handleOpenCreateModal}
          >
            <Plus size={16} />
            Create Warehouse
          </button>
        </div>
      </div>

      {/* ── Summary KPI Cards Grid ─────────────────────────────── */}
      <div className="shp-kpi-grid">
        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon">
              <Building2 size={16} />
            </span>
            <span className="shp-kpi-card__title">Active Facilities</span>
          </div>
          <div className="shp-kpi-card__value">
            {summaryMetrics.totalWarehouses}
          </div>
          <div className="shp-kpi-card__foot">
            Of {warehouses.length} registered
          </div>
        </div>

        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--success">
              <Layers size={16} />
            </span>
            <span className="shp-kpi-card__title">Total Capacity</span>
          </div>
          <div className="shp-kpi-card__value">
            {Number(
              String(summaryMetrics.totalCapacity || 0).replace(
                /[^0-9.-]+/g,
                "",
              ) || 0,
            ).toLocaleString()}
          </div>
          <div className="shp-kpi-card__foot">Packages max volume</div>
        </div>

        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--info">
              <Box size={16} />
            </span>
            <span className="shp-kpi-card__title">Storage Stored</span>
          </div>
          <div className="shp-kpi-card__value">{storageItems.length}</div>
          <div className="shp-kpi-card__foot">
            {summaryMetrics.storageUsedPercent} total usage
          </div>
        </div>

        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--warning">
              <ArrowDownLeft size={16} />
            </span>
            <span className="shp-kpi-card__title">Inbound Freight</span>
          </div>
          <div className="shp-kpi-card__value">
            {summaryMetrics.inboundToday}
          </div>
          <div className="shp-kpi-card__foot">Pending / received</div>
        </div>

        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--danger">
              <ArrowUpRight size={16} />
            </span>
            <span className="shp-kpi-card__title">Outbound Shipments</span>
          </div>
          <div className="shp-kpi-card__value">
            {summaryMetrics.outboundToday}
          </div>
          <div className="shp-kpi-card__foot">At warehouse / dispatched</div>
        </div>
      </div>

      {/* ── Control Bar & Filters ──────────────────────────────── */}
      <div className="shp-control-bar">
        <div className="shp-tabs">
          {[
            {
              id: "locations",
              label: "Warehouses & Facilities",
              count: warehouses.length,
            },
            {
              id: "inbound",
              label: "Inbound Freight",
              count: inboundShipments.length,
            },
            {
              id: "outbound",
              label: "Outbound Dispatches",
              count: outboundShipments.length,
            },
            {
              id: "storage",
              label: "Storage Inventory",
              count: storageItems.length,
            },
            {
              id: "history",
              label: "Activity Logs",
              count: inboundHistory.length + outboundHistory.length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`shp-tab ${activeMainTab === tab.id ? "shp-tab--active" : ""}`}
              onClick={() => setActiveMainTab(tab.id)}
            >
              {tab.label}
              <span className="shp-tab__count">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="shp-filters-right">
          {/* Active Warehouse Dropdown */}
          <select
            className="shp-select-filter"
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            title="Select Active Warehouse"
          >
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>
                WH: {w.warName} ({w.warehouseId || "WH"})
              </option>
            ))}
            {warehouses.length === 0 && <option value="">No Warehouses</option>}
          </select>

          {/* Search Box */}
          <div className="shp-search-box">
            <span className="shp-search-icon">
              <Search size={14} />
            </span>
            <input
              type="search"
              placeholder="Search tracking, city, rack..."
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

          {/* Status Filter */}
          <select
            className="shp-select-filter"
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
          >
            <option value="All">Status: All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="picked_up">Picked Up</option>
            <option value="at_warehouse">At Warehouse</option>
            <option value="dispatched">Dispatched</option>
          </select>

          {activeMainTab === "storage" && (
            <select
              className="shp-select-filter"
              value={selectedZoneFilter}
              onChange={(e) => setSelectedZoneFilter(e.target.value)}
            >
              <option value="All">Zone: All</option>
              {availableZones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          TAB 1: WAREHOUSES & LOCATIONS OVERVIEW
      ───────────────────────────────────────────────────────────────────── */}
      {activeMainTab === "locations" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Registered Warehouses */}
          <div className="shp-table-card">
            <div
              style={{
                padding: "16px 20px",
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
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  Registered Warehouses
                </h3>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "12px",
                    color: "hsla(0, 0%, 0%, 0.65)",
                  }}
                >
                  Manage warehouse facilities, capacities, address details, and
                  active status.
                </p>
              </div>
              <span className="shp-badge shp-badge--outline">
                {filteredWarehouses.length} of {warehouses.length} facilities
              </span>
            </div>

            <div className="shp-table-wrap">
              <table className="shp-table">
                <thead>
                  <tr>
                    <th>Warehouse ID</th>
                    <th>Name & Address</th>
                    <th>City</th>
                    <th>Total Capacity</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWarehouses.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="shp-empty-state">
                          <p className="shp-empty-state__title">
                            No Warehouses Found
                          </p>
                          <p className="shp-empty-state__text">
                            Click "Create Warehouse" to add your first facility.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredWarehouses.map((wh) => (
                      <tr key={wh._id} className="shp-table__row">
                        <td>
                          <button
                            type="button"
                            className="shp-tracking-link"
                            onClick={() => {
                              setSelectedWarehouseId(wh._id);
                              setViewingWarehouse(wh);
                            }}
                          >
                            {wh.warehouseId}
                          </button>
                        </td>
                        <td>
                          <p className="shp-cell-title">{wh.warName}</p>
                          <span className="shp-cell-sub" title={wh.warAddress}>
                            {wh.warAddress}
                          </span>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <MapPin
                              size={13}
                              style={{ color: "#64748b", flexShrink: 0 }}
                            />
                            <span className="shp-cell-title">{wh.warCity}</span>
                          </div>
                        </td>
                        <td>
                          <p className="shp-cell-title">
                            {Number(
                              String(wh.warCapacity ?? 0).replace(
                                /[^0-9.-]+/g,
                                "",
                              ) || 0,
                            ).toLocaleString()}{" "}
                            pkgs
                          </p>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {renderStatusBadge(wh.warStatus)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="shp-action-btns">
                            <button
                              type="button"
                              className="shp-icon-btn"
                              onClick={() =>
                                handleWarehouseStatusToggle(
                                  wh._id,
                                  wh.warStatus,
                                )
                              }
                              title="Toggle active status"
                            >
                              {wh.warStatus?.toLowerCase() === "active" ? (
                                <ToggleRight
                                  size={16}
                                  style={{ color: "#16a34a" }}
                                />
                              ) : (
                                <ToggleLeft
                                  size={16}
                                  style={{ color: "#94a3b8" }}
                                />
                              )}
                            </button>
                            <button
                              type="button"
                              className="shp-btn shp-btn--secondary shp-btn--xs"
                              onClick={() => {
                                setSelectedWarehouseId(wh._id);
                                handleOpenAddLocationModal(wh._id);
                              }}
                              title="Add storage location"
                            >
                              <Plus size={12} />
                              <span>Slot</span>
                            </button>
                            <button
                              type="button"
                              className="shp-icon-btn"
                              onClick={() => {
                                setSelectedWarehouseId(wh._id);
                                setViewingWarehouse(wh);
                              }}
                              title="View warehouse details"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              className="shp-icon-btn"
                              onClick={() => handleOpenEditModal(wh)}
                              title="Edit warehouse info"
                            >
                              <Edit2 size={14} />
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

          {/* Warehouse Locations Sub-Section */}
          <div className="shp-table-card">
            <div
              style={{
                padding: "16px 20px",
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
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#0f172a",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Layers size={16} style={{ color: "var(--primary-color)" }} />
                  <span>
                    Storage Locations for{" "}
                    {activeWarehouse?.warName || "Selected Warehouse"}
                  </span>
                </h3>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "12px",
                    color: "hsla(0, 0%, 0%, 0.65)",
                  }}
                >
                  Zones, racks, and bins configured via{" "}
                  <code>/warehouse-location</code>.
                </p>
              </div>
              <button
                type="button"
                className="shp-btn shp-btn--primary shp-btn--sm"
                onClick={() => handleOpenAddLocationModal(selectedWarehouseId)}
              >
                <Plus size={13} />
                <span>Add Slot / Bin</span>
              </button>
            </div>

            <div className="shp-table-wrap">
              <table className="shp-table">
                <thead>
                  <tr>
                    <th>Zone</th>
                    <th>Rack</th>
                    <th>Bin</th>
                    <th>Capacity</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouseLocations.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="shp-empty-state">
                          <p className="shp-empty-state__title">
                            No Locations Configured
                          </p>
                          <p className="shp-empty-state__text">
                            No locations configured for this warehouse yet.
                            Click "+ Add Slot / Bin" to configure.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    warehouseLocations.map((loc) => (
                      <tr key={loc._id} className="shp-table__row">
                        <td>
                          <span className="shp-badge shp-badge--info font-mono">
                            {loc.warlocZone}
                          </span>
                        </td>
                        <td>
                          <span className="shp-cell-title font-mono">
                            {loc.warlocRack}
                          </span>
                        </td>
                        <td>
                          <span
                            className="shp-cell-title font-mono"
                            style={{ fontWeight: 700 }}
                          >
                            {loc.warlocBin}
                          </span>
                        </td>
                        <td>
                          <span className="shp-cell-title">
                            {loc.warlocCapacity} pkgs
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {renderStatusBadge(loc.warlocStatus)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="shp-action-btns">
                            <button
                              type="button"
                              className="shp-btn shp-btn--secondary shp-btn--xs"
                              onClick={() =>
                                handleLocationStatusToggle(
                                  loc._id,
                                  loc.warlocStatus,
                                )
                              }
                            >
                              Toggle Status
                            </button>
                            <button
                              type="button"
                              className="shp-icon-btn"
                              onClick={() => handleOpenEditLocationModal(loc)}
                              title="Edit slot"
                            >
                              <Edit2 size={13} />
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
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          TAB 2: INBOUND SHIPMENTS TABLE
      ───────────────────────────────────────────────────────────────────── */}
      {activeMainTab === "inbound" && (
        <div className="shp-table-card">
          <div
            style={{
              padding: "16px 20px",
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
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Inbound Shipments
              </h3>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "12px",
                  color: "hsla(0, 0%, 0%, 0.65)",
                }}
              >
                Shipments with status <code>picked_up</code> ready to intake or{" "}
                <code>at_warehouse</code>.
              </p>
            </div>
            <span className="shp-badge shp-badge--outline">
              {filteredInbound.length} inbound shipments
            </span>
          </div>

          <div className="shp-table-wrap">
            <table className="shp-table">
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Customer</th>
                  <th>Origin / Pickup</th>
                  <th style={{ textAlign: "center" }}>Package Count</th>
                  <th>Weight</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInbound.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="shp-empty-state">
                        <p className="shp-empty-state__title">
                          No Inbound Shipments
                        </p>
                        <p className="shp-empty-state__text">
                          There are currently no inbound shipments destined for
                          this warehouse.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInbound.map((s) => (
                    <tr key={s._id} className="shp-table__row">
                      <td>
                        <button
                          type="button"
                          className="shp-tracking-link"
                          onClick={() => setViewShipmentModal(s)}
                        >
                          {s.trackingId}
                        </button>
                      </td>
                      <td>
                        <p className="shp-cell-title">
                          {s.receiverName || s.senderName || "Customer"}
                        </p>
                        <span className="shp-cell-sub">
                          {s.shipmentId || "—"}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "6px",
                          }}
                        >
                          <MapPin
                            size={13}
                            style={{
                              color: "var(--primary-color)",
                              marginTop: "2px",
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <p className="shp-cell-title" style={{ margin: 0 }}>
                              {getShipmentOrigin(s)}
                            </p>
                            {(s.senderAddress || s.pickupAddress) && (
                              <span
                                className="shp-cell-sub"
                                title={`${s.senderAddress || s.pickupAddress}${
                                  s.senderpincode ? ` - ${s.senderpincode}` : ""
                                }`}
                              >
                                {s.senderAddress || s.pickupAddress}
                                {s.senderpincode ? ` - ${s.senderpincode}` : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className="shp-cell-title">
                          {s.packageCount || 1} pkgs
                        </span>
                      </td>
                      <td>
                        <span className="shp-cell-sub">
                          {s.totalWeight || 0} kg
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {renderStatusBadge(s.status)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div
                          className="shp-action-btns"
                          style={{ justifyContent: "flex-end" }}
                        >
                          {s.status === "picked_up" && (
                            <span
                              className="shp-badge shp-badge--warning"
                              style={{
                                gap: "4px",
                                fontSize: "11px",
                                marginRight: "6px",
                              }}
                              title="Please scan the QR code attached to the physical shipment to verify and receive it."
                            >
                              <QrCode size={12} />
                              Scan QR
                            </span>
                          )}
                          <button
                            type="button"
                            className="shp-icon-btn"
                            onClick={() => setViewShipmentModal(s)}
                            title="View shipment details"
                          >
                            <Eye size={14} />
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
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          TAB 3: OUTBOUND SHIPMENTS TABLE
      ───────────────────────────────────────────────────────────────────── */}
      {activeMainTab === "outbound" && (
        <div className="shp-table-card">
          <div
            style={{
              padding: "16px 20px",
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
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Outbound Shipments
              </h3>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "12px",
                  color: "hsla(0, 0%, 0%, 0.65)",
                }}
              >
                Shipments stored at warehouse ready for gate dispatch or
                dispatched.
              </p>
            </div>
            <span className="shp-badge shp-badge--outline">
              {filteredOutbound.length} outbound shipments
            </span>
          </div>

          <div className="shp-table-wrap">
            <table className="shp-table">
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Customer</th>
                  <th>Delivery Destination</th>
                  <th style={{ textAlign: "center" }}>Package Count</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOutbound.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="shp-empty-state">
                        <p className="shp-empty-state__title">
                          No Outbound Shipments
                        </p>
                        <p className="shp-empty-state__text">
                          No shipments currently staged for outbound dispatch.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOutbound.map((s) => (
                    <tr key={s._id} className="shp-table__row">
                      <td>
                        <button
                          type="button"
                          className="shp-tracking-link"
                          onClick={() => setViewShipmentModal(s)}
                        >
                          {s.trackingId}
                        </button>
                      </td>
                      <td>
                        <p className="shp-cell-title">
                          {s.receiverName || s.senderName || "Customer"}
                        </p>
                        <span className="shp-cell-sub">
                          {s.shipmentId || "—"}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "6px",
                          }}
                        >
                          <MapPin
                            size={13}
                            style={{
                              color: "#e11d48",
                              marginTop: "2px",
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <p className="shp-cell-title" style={{ margin: 0 }}>
                              {getShipmentDestination(s)}
                            </p>
                            {(s.receiverAddress || s.deliveryAddress) && (
                              <span
                                className="shp-cell-sub"
                                title={`${s.receiverAddress || s.deliveryAddress}${
                                  s.receiverpincode
                                    ? ` - ${s.receiverpincode}`
                                    : ""
                                }`}
                              >
                                {s.receiverAddress || s.deliveryAddress}
                                {s.receiverpincode
                                  ? ` - ${s.receiverpincode}`
                                  : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className="shp-cell-title">
                          {s.packageCount || 1} pkgs
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {renderStatusBadge(s.status)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div
                          className="shp-action-btns"
                          style={{ justifyContent: "flex-end" }}
                        >
                          {s.status === "at_warehouse" ? (
                            <button
                              type="button"
                              onClick={() => executeDispatch(s._id)}
                              disabled={submittingDispatch}
                              className="shp-btn shp-btn--warning shp-btn--xs"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Truck size={12} />
                              <span>Dispatch</span>
                            </button>
                          ) : (
                            <span
                              className="shp-badge shp-badge--info"
                              style={{ gap: "4px", fontSize: "11px" }}
                            >
                              <Check size={12} />
                              <span>Dispatched</span>
                            </span>
                          )}
                          <button
                            type="button"
                            className="shp-icon-btn"
                            onClick={() => setViewShipmentModal(s)}
                            title="View shipment details"
                          >
                            <Eye size={14} />
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
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          TAB 4: STORAGE INVENTORY (/warehouse/:id/storage)
      ───────────────────────────────────────────────────────────────────── */}
      {activeMainTab === "storage" && (
        <div className="shp-table-card">
          <div
            style={{
              padding: "16px 20px",
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
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Warehouse Storage Inventory
              </h3>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "12px",
                  color: "hsla(0, 0%, 0%, 0.65)",
                }}
              >
                Inventory in{" "}
                <strong>{activeWarehouse?.warName || "Facility"}</strong>
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={exportPackagesCSV}
                className="shp-btn shp-btn--secondary shp-btn--sm"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="shp-table-wrap">
            <table className="shp-table">
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Customer</th>
                  <th>Zone</th>
                  <th>Rack</th>
                  <th>Bin</th>
                  <th>Stored Date</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStorage.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="shp-empty-state">
                        <p className="shp-empty-state__title">
                          No Packages in Storage
                        </p>
                        <p className="shp-empty-state__text">
                          No active packages are currently stored in this
                          warehouse facility.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStorage.map((p) => {
                    const s = p.shipmentId || {};
                    const l = p.locationId || {};
                    return (
                      <tr key={p._id} className="shp-table__row">
                        <td>
                          <button
                            type="button"
                            className="shp-tracking-link"
                            onClick={() => s._id && setViewShipmentModal(s)}
                          >
                            {s.trackingId || "N/A"}
                          </button>
                        </td>
                        <td>
                          <p className="shp-cell-title">
                            {s.receiverName || s.senderName || "Customer"}
                          </p>
                          <span className="shp-cell-sub">
                            {s.shipmentId || "—"}
                          </span>
                        </td>
                        <td>
                          <span className="shp-badge shp-badge--info font-mono">
                            {l.warlocZone || "Zone A"}
                          </span>
                        </td>
                        <td>
                          <span className="shp-cell-title font-mono">
                            {l.warlocRack || "Rack A-01"}
                          </span>
                        </td>
                        <td>
                          <span
                            className="shp-cell-title font-mono"
                            style={{ fontWeight: 700 }}
                          >
                            {l.warlocBin || "Bin A-01-01"}
                          </span>
                        </td>
                        <td>
                          <span className="shp-cell-sub">
                            {p.storeAt
                              ? new Date(p.storeAt).toLocaleDateString()
                              : "Just now"}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {renderStatusBadge(p.warstorStatus)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div
                            className="shp-action-btns"
                            style={{ justifyContent: "flex-end" }}
                          >
                            {p.warstorStatus === "store" && s._id && (
                              <button
                                type="button"
                                onClick={() => executeDispatch(s._id)}
                                disabled={submittingDispatch}
                                className="shp-btn shp-btn--warning shp-btn--xs"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <Truck size={12} />
                                <span>Dispatch</span>
                              </button>
                            )}
                            <button
                              type="button"
                              className="shp-icon-btn"
                              onClick={() => s._id && setViewShipmentModal(s)}
                              title="View details"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          TAB 5: INBOUND & OUTBOUND HISTORY
      ───────────────────────────────────────────────────────────────────── */}
      {activeMainTab === "history" && (
        <div className="shp-table-card">
          <div
            style={{
              padding: "16px 20px",
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
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Warehouse Transaction Audit Trail
              </h3>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "12px",
                  color: "hsla(0, 0%, 0%, 0.65)",
                }}
              >
                Historical records for{" "}
                <strong>{activeWarehouse?.warName || "Facility"}</strong>.
              </p>
            </div>

            <div className="shp-tabs" style={{ marginBottom: 0 }}>
              <button
                type="button"
                onClick={() => setHistoryTab("inbound")}
                className={`shp-tab ${historyTab === "inbound" ? "shp-tab--active" : ""}`}
              >
                Inbound History ({inboundHistory.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab("outbound")}
                className={`shp-tab ${historyTab === "outbound" ? "shp-tab--active" : ""}`}
              >
                Outbound History ({outboundHistory.length})
              </button>
            </div>
          </div>

          {historyTab === "inbound" ? (
            <div className="shp-table-wrap">
              <table className="shp-table">
                <thead>
                  <tr>
                    <th>Tracking ID</th>
                    <th>Customer</th>
                    <th>Slot (Zone/Rack/Bin)</th>
                    <th>Processed By</th>
                    <th>Date & Time</th>
                    <th style={{ textAlign: "center" }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInboundHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="shp-empty-state">
                          <p className="shp-empty-state__title">
                            No Inbound History
                          </p>
                          <p className="shp-empty-state__text">
                            No inbound intake records found for this facility.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredInboundHistory.map((h) => {
                      const s = h.shipmentId || {};
                      const l = h.locationId || {};
                      const u = h.wartansactonProcessBy || {};
                      return (
                        <tr key={h._id} className="shp-table__row">
                          <td>
                            <button
                              type="button"
                              className="shp-tracking-link"
                              onClick={() => s._id && setViewShipmentModal(s)}
                            >
                              {s.trackingId || "N/A"}
                            </button>
                          </td>
                          <td>
                            <p className="shp-cell-title">
                              {s.receiverName || s.senderName || "Customer"}
                            </p>
                            <span className="shp-cell-sub">
                              {s.shipmentId || "—"}
                            </span>
                          </td>
                          <td>
                            <span className="shp-cell-title font-mono">
                              {l.warlocZone
                                ? `${l.warlocZone} / ${l.warlocRack} / ${l.warlocBin}`
                                : "Assigned"}
                            </span>
                          </td>
                          <td>
                            <span className="shp-cell-title">
                              {u.name || "Operator"}
                            </span>
                          </td>
                          <td>
                            <span className="shp-cell-sub">
                              {h.wartransactionDate
                                ? new Date(
                                    h.wartransactionDate,
                                  ).toLocaleString()
                                : "N/A"}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span className="shp-badge shp-badge--success">
                              Inbound
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="shp-table-wrap">
              <table className="shp-table">
                <thead>
                  <tr>
                    <th>Tracking ID</th>
                    <th>Customer</th>
                    <th>Slot</th>
                    <th>Processed By</th>
                    <th>Date & Time</th>
                    <th style={{ textAlign: "center" }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOutboundHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="shp-empty-state">
                          <p className="shp-empty-state__title">
                            No Outbound History
                          </p>
                          <p className="shp-empty-state__text">
                            No outbound dispatch records found for this
                            facility.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOutboundHistory.map((h) => {
                      const s = h.shipmentId || {};
                      const l = h.locationId || {};
                      const u = h.wartansactonProcessBy || {};
                      return (
                        <tr key={h._id} className="shp-table__row">
                          <td>
                            <button
                              type="button"
                              className="shp-tracking-link"
                              onClick={() => s._id && setViewShipmentModal(s)}
                            >
                              {s.trackingId || "N/A"}
                            </button>
                          </td>
                          <td>
                            <p className="shp-cell-title">
                              {s.receiverName || s.senderName || "Customer"}
                            </p>
                            <span className="shp-cell-sub">
                              {s.shipmentId || "—"}
                            </span>
                          </td>
                          <td>
                            <span className="shp-cell-title font-mono">
                              {l.warlocZone
                                ? `${l.warlocZone} / ${l.warlocRack} / ${l.warlocBin}`
                                : "Slot"}
                            </span>
                          </td>
                          <td>
                            <span className="shp-cell-title">
                              {u.name || "Operator"}
                            </span>
                          </td>
                          <td>
                            <span className="shp-cell-sub">
                              {h.wartransactionDate
                                ? new Date(
                                    h.wartransactionDate,
                                  ).toLocaleString()
                                : "N/A"}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span className="shp-badge shp-badge--info">
                              Outbound
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          MODAL 1: CREATE / EDIT WAREHOUSE
      ───────────────────────────────────────────────────────────────────── */}
      {createWarehouseModalOpen && (
        <div className="shp-modal-overlay">
          <div className="shp-modal shp-modal--md">
            <div className="shp-modal__header">
              <div>
                <h3 className="shp-modal__title">
                  {editingWarehouse
                    ? "Edit Warehouse Facility"
                    : "Create New Warehouse"}
                </h3>
                <p className="shp-modal__subtitle">
                  Configure facility details, location, and operational
                  capacity.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateWarehouseModalOpen(false)}
                className="shp-modal__close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleWarehouseFormSubmit}>
              <div className="shp-modal__form">
                <div className="shp-form-group">
                  <label>Warehouse Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Central Logistics Hub"
                    value={warehouseFormData.name}
                    onChange={(e) =>
                      setWarehouseFormData({
                        ...warehouseFormData,
                        name: e.target.value,
                      })
                    }
                  />
                  {warehouseFormErrors.name && (
                    <p
                      style={{
                        color: "var(--danger)",
                        fontSize: "11px",
                        margin: "2px 0 0",
                      }}
                    >
                      {warehouseFormErrors.name}
                    </p>
                  )}
                </div>

                <div className="shp-form-group">
                  <label>Address *</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Plot No 42, Industrial Area Phase II, Near Cargo Terminal"
                    value={warehouseFormData.address}
                    onChange={(e) =>
                      setWarehouseFormData({
                        ...warehouseFormData,
                        address: e.target.value,
                      })
                    }
                    style={{ resize: "none" }}
                  />
                  {warehouseFormErrors.address && (
                    <p
                      style={{
                        color: "var(--danger)",
                        fontSize: "11px",
                        margin: "2px 0 0",
                      }}
                    >
                      {warehouseFormErrors.address}
                    </p>
                  )}
                </div>

                <div className="shp-form-row">
                  <div className="shp-form-group">
                    <label>Location / City *</label>
                    <input
                      type="text"
                      placeholder="e.g. Delhi"
                      value={warehouseFormData.location}
                      onChange={(e) =>
                        setWarehouseFormData({
                          ...warehouseFormData,
                          location: e.target.value,
                        })
                      }
                    />
                    {warehouseFormErrors.location && (
                      <p
                        style={{
                          color: "var(--danger)",
                          fontSize: "11px",
                          margin: "2px 0 0",
                        }}
                      >
                        {warehouseFormErrors.location}
                      </p>
                    )}
                  </div>

                  <div className="shp-form-group">
                    <label>Total Capacity (Packages) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 10000"
                      value={warehouseFormData.totalCapacity}
                      onChange={(e) =>
                        setWarehouseFormData({
                          ...warehouseFormData,
                          totalCapacity: e.target.value,
                        })
                      }
                    />
                    {warehouseFormErrors.totalCapacity && (
                      <p
                        style={{
                          color: "var(--danger)",
                          fontSize: "11px",
                          margin: "2px 0 0",
                        }}
                      >
                        {warehouseFormErrors.totalCapacity}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shp-form-group">
                  <label>Facility Status</label>
                  <select
                    value={warehouseFormData.status}
                    onChange={(e) =>
                      setWarehouseFormData({
                        ...warehouseFormData,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="shp-modal__footer">
                <button
                  type="button"
                  onClick={() => setCreateWarehouseModalOpen(false)}
                  disabled={submittingWarehouse}
                  className="shp-btn shp-btn--secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWarehouse}
                  className="shp-btn shp-btn--primary"
                >
                  {submittingWarehouse && (
                    <RefreshCw size={13} className="animate-spin" />
                  )}
                  {submittingWarehouse
                    ? "Submitting..."
                    : editingWarehouse
                      ? "Save Changes"
                      : "Create Warehouse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          MODAL 2: ADD / EDIT LOCATION (POST /warehouse-location)
      ───────────────────────────────────────────────────────────────────── */}
      {locationModalOpen && (
        <div className="shp-modal-overlay">
          <div className="shp-modal shp-modal--md">
            <div className="shp-modal__header">
              <div>
                <h3 className="shp-modal__title">
                  {editingLocation
                    ? "Edit Storage Location"
                    : "Add Storage Location"}
                </h3>
                <p className="shp-modal__subtitle">
                  Configure Zone, Rack, and Bin slot coordinates within the
                  facility.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLocationModalOpen(false)}
                className="shp-modal__close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLocationFormSubmit}>
              <div className="shp-modal__form">
                <div className="shp-form-group">
                  <label>Warehouse Facility *</label>
                  <select
                    value={locationFormData.warehouseId}
                    onChange={(e) =>
                      setLocationFormData({
                        ...locationFormData,
                        warehouseId: e.target.value,
                      })
                    }
                  >
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.warName} ({w.warCity})
                      </option>
                    ))}
                  </select>
                  {locationFormErrors.warehouseId && (
                    <p
                      style={{
                        color: "var(--danger)",
                        fontSize: "11px",
                        margin: "2px 0 0",
                      }}
                    >
                      {locationFormErrors.warehouseId}
                    </p>
                  )}
                </div>

                <div
                  className="shp-form-row"
                  style={{ gridTemplateColumns: "1fr 1fr 1fr" }}
                >
                  <div className="shp-form-group">
                    <label>Zone *</label>
                    <input
                      type="text"
                      placeholder="Zone A"
                      value={locationFormData.warlocZone}
                      onChange={(e) =>
                        setLocationFormData({
                          ...locationFormData,
                          warlocZone: e.target.value,
                        })
                      }
                    />
                    {locationFormErrors.warlocZone && (
                      <p
                        style={{
                          color: "var(--danger)",
                          fontSize: "11px",
                          margin: "2px 0 0",
                        }}
                      >
                        {locationFormErrors.warlocZone}
                      </p>
                    )}
                  </div>

                  <div className="shp-form-group">
                    <label>Rack *</label>
                    <input
                      type="text"
                      placeholder="Rack A-01"
                      value={locationFormData.warlocRack}
                      onChange={(e) =>
                        setLocationFormData({
                          ...locationFormData,
                          warlocRack: e.target.value,
                        })
                      }
                    />
                    {locationFormErrors.warlocRack && (
                      <p
                        style={{
                          color: "var(--danger)",
                          fontSize: "11px",
                          margin: "2px 0 0",
                        }}
                      >
                        {locationFormErrors.warlocRack}
                      </p>
                    )}
                  </div>

                  <div className="shp-form-group">
                    <label>Bin *</label>
                    <input
                      type="text"
                      placeholder="Bin A-01-01"
                      value={locationFormData.warlocBin}
                      onChange={(e) =>
                        setLocationFormData({
                          ...locationFormData,
                          warlocBin: e.target.value,
                        })
                      }
                    />
                    {locationFormErrors.warlocBin && (
                      <p
                        style={{
                          color: "var(--danger)",
                          fontSize: "11px",
                          margin: "2px 0 0",
                        }}
                      >
                        {locationFormErrors.warlocBin}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shp-form-row">
                  <div className="shp-form-group">
                    <label>Slot Capacity *</label>
                    <input
                      type="number"
                      value={locationFormData.warlocCapacity}
                      onChange={(e) =>
                        setLocationFormData({
                          ...locationFormData,
                          warlocCapacity: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="shp-form-group">
                    <label>Slot Status</label>
                    <select
                      value={locationFormData.warlocStatus}
                      onChange={(e) =>
                        setLocationFormData({
                          ...locationFormData,
                          warlocStatus: e.target.value,
                        })
                      }
                    >
                      <option value="available">Available</option>
                      <option value="full">Full</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="shp-modal__footer">
                <button
                  type="button"
                  onClick={() => setLocationModalOpen(false)}
                  disabled={submittingLocation}
                  className="shp-btn shp-btn--secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLocation}
                  className="shp-btn shp-btn--primary"
                >
                  {submittingLocation && (
                    <RefreshCw size={13} className="animate-spin" />
                  )}
                  {submittingLocation ? "Saving..." : "Save Location Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          MODAL 3: VIEW WAREHOUSE DETAILS
      ───────────────────────────────────────────────────────────────────── */}
      {viewingWarehouse && (
        <div className="shp-modal-overlay">
          <div className="shp-modal shp-modal--lg">
            <div className="shp-modal__header">
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: "var(--primary-color)",
                    fontSize: "14px",
                    backgroundColor: "#e3f2fd",
                    padding: "3px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {viewingWarehouse.warehouseId || "WH"}
                </span>
                <div>
                  <h3 className="shp-modal__title">
                    {viewingWarehouse.warName}
                  </h3>
                  <p className="shp-modal__subtitle">
                    {viewingWarehouse.warCity} • {viewingWarehouse.warAddress}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingWarehouse(null)}
                className="shp-modal__close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="shp-modal__body">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: "12px",
                }}
              >
                <div className="shp-form-card" style={{ padding: "12px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "hsla(0, 0%, 0%, 0.6)",
                      textTransform: "uppercase",
                    }}
                  >
                    Total Capacity
                  </span>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    {Number(
                      String(viewingWarehouse.warCapacity ?? 0).replace(
                        /[^0-9.-]+/g,
                        "",
                      ) || 0,
                    ).toLocaleString()}{" "}
                    pkgs
                  </p>
                </div>
                <div className="shp-form-card" style={{ padding: "12px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "hsla(0, 0%, 0%, 0.6)",
                      textTransform: "uppercase",
                    }}
                  >
                    Facility Status
                  </span>
                  <div style={{ marginTop: "4px" }}>
                    {renderStatusBadge(viewingWarehouse.warStatus)}
                  </div>
                </div>
                <div className="shp-form-card" style={{ padding: "12px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "hsla(0, 0%, 0%, 0.6)",
                      textTransform: "uppercase",
                    }}
                  >
                    Locations
                  </span>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--success)",
                    }}
                  >
                    {warehouseLocations.length} slots
                  </p>
                </div>
                <div className="shp-form-card" style={{ padding: "12px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "hsla(0, 0%, 0%, 0.6)",
                      textTransform: "uppercase",
                    }}
                  >
                    Stored Packages
                  </span>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--primary-color)",
                    }}
                  >
                    {storageItems.length} pkgs
                  </p>
                </div>
              </div>

              <div>
                <h4
                  style={{
                    margin: "0 0 10px",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#0f172a",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Layers size={14} style={{ color: "var(--primary-color)" }} />
                  <span>Configured Storage Slots</span>
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: "10px",
                    maxHeight: "260px",
                    overflowY: "auto",
                  }}
                >
                  {warehouseLocations.map((loc) => (
                    <div
                      key={loc._id}
                      className="shp-form-card"
                      style={{ padding: "10px", gap: "6px" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          borderBottom: "1px solid var(--border)",
                          paddingBottom: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "12px",
                            color: "#0f172a",
                          }}
                        >
                          {loc.warlocZone}
                        </span>
                        <span
                          className="shp-badge shp-badge--outline"
                          style={{ fontSize: "10px", padding: "2px 6px" }}
                        >
                          {loc.warlocStatus}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "11.5px",
                          fontFamily: "monospace",
                          color: "#475569",
                          lineHeight: "1.4",
                        }}
                      >
                        <p style={{ margin: 0 }}>
                          Rack: <strong>{loc.warlocRack}</strong>
                        </p>
                        <p style={{ margin: 0 }}>
                          Bin: <strong>{loc.warlocBin}</strong>
                        </p>
                        <p style={{ margin: 0 }}>
                          Cap: <strong>{loc.warlocCapacity}</strong> pkgs
                        </p>
                      </div>
                    </div>
                  ))}
                  {warehouseLocations.length === 0 && (
                    <div
                      className="shp-empty-state"
                      style={{ gridColumn: "1 / -1", padding: "20px" }}
                    >
                      <p className="shp-empty-state__text">
                        No storage slots configured yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="shp-modal__footer">
              <div className="shp-modal__footer-right">
                <button
                  type="button"
                  onClick={() => setViewingWarehouse(null)}
                  className="shp-btn shp-btn--secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          MODAL 4: VIEW SHIPMENT DETAILS
      ───────────────────────────────────────────────────────────────────── */}
      {viewShipmentModal && (
        <div className="shp-modal-overlay">
          <div className="shp-modal shp-modal--sm">
            <div className="shp-modal__header">
              <div>
                <h3 className="shp-modal__title">Shipment Details</h3>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: "var(--primary-color)",
                    fontSize: "12.5px",
                    display: "inline-block",
                    marginTop: "2px",
                  }}
                >
                  {viewShipmentModal.trackingId}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewShipmentModal(null)}
                className="shp-modal__close"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="shp-modal__body"
              style={{ gap: "10px", fontSize: "12.5px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span style={{ color: "hsla(0, 0%, 0%, 0.6)" }}>Customer:</span>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>
                  {viewShipmentModal.receiverName ||
                    viewShipmentModal.senderName ||
                    "Valued Customer"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span style={{ color: "hsla(0, 0%, 0%, 0.6)" }}>
                  Origin / Pickup:
                </span>
                <span
                  style={{
                    fontWeight: 500,
                    color: "#334155",
                    maxWidth: "220px",
                    textAlign: "right",
                  }}
                >
                  {getShipmentOrigin(viewShipmentModal)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span style={{ color: "hsla(0, 0%, 0%, 0.6)" }}>
                  Destination:
                </span>
                <span
                  style={{
                    fontWeight: 500,
                    color: "#334155",
                    maxWidth: "220px",
                    textAlign: "right",
                  }}
                >
                  {getShipmentDestination(viewShipmentModal)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span style={{ color: "hsla(0, 0%, 0%, 0.6)" }}>
                  Package Count:
                </span>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>
                  {viewShipmentModal.packageCount || 1} packages
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                }}
              >
                <span style={{ color: "hsla(0, 0%, 0%, 0.6)" }}>Status:</span>
                <span>{renderStatusBadge(viewShipmentModal.status)}</span>
              </div>
            </div>

            <div className="shp-modal__footer">
              <div className="shp-modal__footer-right">
                <button
                  type="button"
                  onClick={() => setViewShipmentModal(null)}
                  className="shp-btn shp-btn--secondary"
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
