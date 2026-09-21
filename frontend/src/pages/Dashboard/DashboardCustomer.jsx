import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Eye,
  UserMinus,
  UserPlus,
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
  CheckCircle2,
  MapPin,
  FileText,
  Download,
  RefreshCw,
  Loader2,
  Package,
  Clock,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import "../../styles/ShipmentManagement.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const normalizeCustomer = (c) => ({
  id: c.customerId || (c._id ? String(c._id) : `CUST-${Date.now()}`),
  _id: c._id,
  name: c.name || "Unnamed Customer",
  email: c.email || "",
  phone: c.phonenumber ? String(c.phonenumber) : c.phone || "",
  status:
    c.status && c.status.toLowerCase() === "active"
      ? "Active"
      : c.status && c.status.toLowerCase() === "inactive"
        ? "Inactive"
        : "Active",
  verified: c.verified ?? true,
  pickupAddress: c.pickupAddress || c.address || "",
  deliveryAddress: c.deliveryAddress || c.address || "",
  addresses:
    Array.isArray(c.addresses) && c.addresses.length > 0
      ? c.addresses
      : [
          {
            id: `ADDR-${c._id || c.customerId || "1"}`,
            type: "Pickup",
            label: "Primary Facility",
            address: c.address || c.pickupAddress || "Address on file",
            isDefault: true,
          },
        ],
  shipmentCount: c.shipmentCount || (c.shipments ? c.shipments.length : 0),
  activeShipments: c.activeShipments || 0,
  deliveredShipments: c.deliveredShipments || 0,
  pendingShipments: c.pendingShipments || 0,
  shipments: c.shipments || [],
  invoices: c.invoices || [],
});

const formatShipmentStatus = (status) => {
  if (!status) return "In Transit";
  const s = status.toLowerCase().trim().replace(/_/g, " ");
  if (s.includes("delivered")) return "Delivered";
  if (s.includes("out for delivery")) return "Out for Delivery";
  if (s.includes("in transit") || s.includes("transit")) return "In Transit";
  if (s.includes("dispatched")) return "Dispatched";
  if (s.includes("picked up")) return "Picked Up";
  if (s.includes("warehouse")) return "At Warehouse";
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
    s.includes("dispatched")
  )
    return "info";
  if (
    s.includes("order placed") ||
    s.includes("created") ||
    s.includes("scheduled") ||
    s.includes("picked up") ||
    s.includes("warehouse")
  )
    return "warning";
  return "outline";
};

export const DashboardCustomer = ({ searchTerm: externalSearch = "" }) => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { id: routeCustomerId } = useParams();
  const {
    customers: contextCustomers,
    addCustomer,
    updateCustomer,
    addCustomerAddress,
    toggleCustomerStatus,
  } = useApp();

  // Backend API Customers State
  const [apiCustomers, setApiCustomers] = useState(null);
  const [backendTotalShipments, setBackendTotalShipments] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Active customer list (API data prioritized, falls back to context)
  const customers = useMemo(() => {
    if (apiCustomers !== null) return apiCustomers;
    return contextCustomers || [];
  }, [apiCustomers, contextCustomers]);

  // Fetch customers from backend GET /customers
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const authToken = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/customers?limit=1000`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Server responded with ${res.status}`,
        );
      }

      const data = await res.json();
      if (data && Array.isArray(data.customers)) {
        setApiCustomers(data.customers.map(normalizeCustomer));
        if (typeof data.totalShipments === "number") {
          setBackendTotalShipments(data.totalShipments);
        }
      } else {
        setApiCustomers(contextCustomers);
      }
    } catch (err) {
      console.warn("GET /customers failed or backend offline:", err);
      setApiError(err.message || "Failed to connect to backend server");
    } finally {
      setLoading(false);
    }
  }, [contextCustomers]);

  // Fetch total shipments count directly from backend
  const fetchTotalShipments = useCallback(async () => {
    try {
      const authToken = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/shipments?limit=1`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data?.pagination?.totalRecords === "number") {
          setBackendTotalShipments(data.pagination.totalRecords);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchTotalShipments();
  }, [fetchCustomers, fetchTotalShipments]);

  // Selected customer state for Profile view (derived from route or internal state)
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    routeCustomerId || null,
  );

  // Toast feedback notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toastNode = toastMessage && (
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
  );

  // Sync with route param if present
  const selectedCustomer = useMemo(() => {
    const idToFind = routeCustomerId || selectedCustomerId;
    if (!idToFind) return null;
    return (
      customers.find(
        (c) =>
          c.id?.toLowerCase() === idToFind.toLowerCase() ||
          c._id?.toLowerCase() === idToFind.toLowerCase() ||
          String(c.customerId || "").toLowerCase() === idToFind.toLowerCase(),
      ) || null
    );
  }, [customers, routeCustomerId, selectedCustomerId]);

  // Main Directory Search & Filter state
  const [searchQuery, setSearchQuery] = useState(externalSearch || "");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    if (externalSearch !== undefined) {
      setSearchQuery(externalSearch);
    }
  }, [externalSearch]);

  // Directory Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Shipment History Search & Filter in Profile view
  const [shipmentSearchQuery, setShipmentSearchQuery] = useState("");
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState("All");

  // Shipment View Modal in Profile
  const [viewingShipment, setViewingShipment] = useState(null);

  // Add / Edit Customer Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deactivatingCustomer, setDeactivatingCustomer] = useState(null);

  // Add Address Modal state in Profile
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    label: "",
    address: "",
    type: "Pickup",
  });
  const [addressError, setAddressError] = useState("");

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    pickupAddress: "",
  });
  const [formErrors, setFormErrors] = useState({});

  // Summary counts matching exact reference data
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "Active").length;
  const inactiveCustomers = customers.filter(
    (c) => c.status === "Inactive",
  ).length;
  const totalShipments = useMemo(() => {
    if (typeof backendTotalShipments === "number") {
      return backendTotalShipments;
    }
    return customers.reduce(
      (sum, c) =>
        sum + (c.shipmentCount ?? (c.shipments ? c.shipments.length : 0)),
      0,
    );
  }, [backendTotalShipments, customers]);

  // Filtered customer list for Directory
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesStatus =
        statusFilter === "All" ||
        c.status.toLowerCase() === statusFilter.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesStatus;

      const matchesName = c.name?.toLowerCase().includes(q);
      const matchesEmail = c.email?.toLowerCase().includes(q);
      const matchesPhone = c.phone?.toLowerCase().includes(q);
      const matchesId = c.id?.toLowerCase().includes(q);

      return (
        matchesStatus &&
        (matchesName || matchesEmail || matchesPhone || matchesId)
      );
    });
  }, [customers, statusFilter, searchQuery]);

  // Directory Pagination Calculations
  const filterKey = `${statusFilter}|${searchQuery}|${pageSize}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredCustomers.length);
  const displayedCustomers = useMemo(() => {
    return filteredCustomers.slice(startIndex, endIndex);
  }, [filteredCustomers, startIndex, endIndex]);

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

  // Backend Shipments for selected customer
  const [backendShipments, setBackendShipments] = useState(null);
  const [loadingShipments, setLoadingShipments] = useState(false);

  useEffect(() => {
    if (!selectedCustomer) {
      setBackendShipments(null);
      setLoadingShipments(false);
      return;
    }

    const targetId = selectedCustomer._id || selectedCustomer.id;
    if (!targetId) return;

    setLoadingShipments(true);
    const authToken = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/customers/${targetId}/shipments`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.shipments)) {
          if (data.shipments.length > 0) {
            const mapped = data.shipments.map((s) => ({
              id:
                s.trackingId ||
                s.shipmentId ||
                (s._id ? String(s._id) : "TRK-UNKNOWN"),
              pickup: s.senderCity || s.senderAddress || "Origin Warehouse",
              delivery:
                s.receiverCity || s.receiverAddress || "Destination Hub",
              date: s.createdAt
                ? new Date(s.createdAt).toISOString().split("T")[0]
                : "Recent",
              status: formatShipmentStatus(s.status),
              rawStatus: s.status,
              senderName: s.senderName,
              receiverName: s.receiverName,
              weight: s.weight ? `${s.weight} kg` : "",
              price: s.totalAmount || s.price,
            }));
            setBackendShipments(mapped);
          } else {
            setBackendShipments(
              selectedCustomer?.shipments &&
                selectedCustomer.shipments.length > 0
                ? selectedCustomer.shipments
                : [],
            );
          }
        } else {
          setBackendShipments(null);
        }
      })
      .catch(() => setBackendShipments(null))
      .finally(() => setLoadingShipments(false));
  }, [selectedCustomer]);

  const customerShipments = useMemo(() => {
    if (backendShipments !== null) {
      return backendShipments;
    }
    return selectedCustomer?.shipments || [];
  }, [backendShipments, selectedCustomer]);

  // Filtered shipments for Selected Customer Profile
  const filteredShipments = useMemo(() => {
    if (!customerShipments) return [];
    return customerShipments.filter((s) => {
      const matchesStatus =
        shipmentStatusFilter === "All" ||
        s.status.toLowerCase().includes(shipmentStatusFilter.toLowerCase());

      const q = shipmentSearchQuery.toLowerCase().trim();
      if (!q) return matchesStatus;

      const matchesTracking = s.id?.toLowerCase().includes(q);
      const matchesPickup = s.pickup?.toLowerCase().includes(q);
      const matchesDelivery = s.delivery?.toLowerCase().includes(q);

      return (
        matchesStatus && (matchesTracking || matchesPickup || matchesDelivery)
      );
    });
  }, [customerShipments, shipmentStatusFilter, shipmentSearchQuery]);

  // View customer profile directly in dashboard main
  const handleViewCustomer = (cust) => {
    setSelectedCustomerId(cust.id);
    setShipmentSearchQuery("");
    setShipmentStatusFilter("All");
  };

  // Back to customers directory in dashboard main
  const handleBackToCustomers = () => {
    setSelectedCustomerId(null);
  };

  // Open Add modal
  const handleOpenAdd = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      pickupAddress: "",
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      pickupAddress: customer.pickupAddress || customer.address || "",
    });
    setFormErrors({});
  };

  // Validation
  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Customer name is required.";
    if (!formData.email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = "Please enter a valid email address.";
    }
    if (!formData.phone.trim()) errs.phone = "Phone number is required.";
    if (!formData.pickupAddress?.trim()) {
      errs.pickupAddress = "Address is required.";
    }
    return errs;
  };

  // Submit Add
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    try {
      const authToken = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          pickupAddress:
            formData.pickupAddress.trim() ||
            formData.deliveryAddress.trim() ||
            "Address on file",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFormErrors({
          name: data.message || "Failed to create customer on server",
        });
        return;
      }

      await fetchCustomers();
      setIsAddModalOpen(false);
      showToast(`Customer "${formData.name.trim()}" added successfully!`);
    } catch (error) {
      // Offline fallback: save to local context
      addCustomer(formData);
      setIsAddModalOpen(false);
      showToast(`Customer "${formData.name.trim()}" added locally!`);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    const targetId = editingCustomer._id || editingCustomer.id;

    try {
      const authToken = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/customers/${targetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phonenumber: formData.phone.trim(),
          phone: formData.phone.trim(),
          address: formData.pickupAddress.trim(),
          pickupAddress: formData.pickupAddress.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        updateCustomer(editingCustomer.id, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          pickupAddress: formData.pickupAddress.trim(),
          deliveryAddress: formData.pickupAddress.trim(),
        });
        await fetchCustomers();
        setEditingCustomer(null);
        showToast(`Customer "${formData.name.trim()}" updated successfully!`);
        return;
      } else {
        setFormErrors({
          name: data.message || "Failed to update customer on server",
        });
        showToast(data.message || "Failed to update customer", "error");
        return;
      }
    } catch (error) {
      // Offline fallback: save to local context
      updateCustomer(editingCustomer.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        pickupAddress: formData.pickupAddress.trim(),
      });
      setEditingCustomer(null);
      showToast(`Customer "${formData.name.trim()}" updated locally!`);
    }
  };

  // Confirm Status Toggle
  const handleConfirmStatusToggle = async () => {
    if (deactivatingCustomer) {
      const targetId = deactivatingCustomer._id || deactivatingCustomer.id;
      const newStatus =
        deactivatingCustomer.status?.toLowerCase() === "active"
          ? "inactive"
          : "active";
      try {
        const authToken = localStorage.getItem("token");
        const res = await fetch(
          `${API_BASE_URL}/customers/${targetId}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
            body: JSON.stringify({ status: newStatus }),
          },
        );

        if (res.ok) {
          await fetchCustomers();
        } else {
          toggleCustomerStatus(deactivatingCustomer.id);
        }
      } catch {
        toggleCustomerStatus(deactivatingCustomer.id);
      }
      showToast(`Customer status changed to ${newStatus.toUpperCase()}`);
      setDeactivatingCustomer(null);
    }
  };

  // Save new address inside customer profile
  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (!newAddressForm.label.trim()) {
      setAddressError("Please provide an address label (e.g. Surat Branch).");
      return;
    }
    if (!newAddressForm.address.trim()) {
      setAddressError("Please provide the physical address.");
      return;
    }

    addCustomerAddress(selectedCustomer.id, newAddressForm);
    setNewAddressForm({ label: "", address: "", type: "Pickup" });
    setAddressError("");
    setIsAddAddressOpen(false);
    showToast("New facility address added successfully!");
  };

  // Timeline helper
  const timelineSteps = [
    { label: "Order Placed", step: 1 },
    { label: "Dispatched", step: 2 },
    { label: "In Transit", step: 3 },
    { label: "Out for Delivery", step: 4 },
    { label: "Delivered", step: 5 },
  ];

  const getStepIndex = (status) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("delivered")) return 4;
    if (s.includes("out for delivery") || s.includes("out_for_delivery"))
      return 3;
    if (
      s.includes("in transit") ||
      s.includes("in_transit") ||
      s.includes("transit")
    )
      return 2;
    if (
      s.includes("dispatched") ||
      s.includes("picked_up") ||
      s.includes("picked up") ||
      s.includes("warehouse")
    )
      return 1;
    if (
      s.includes("order placed") ||
      s.includes("placed") ||
      s.includes("created") ||
      s.includes("scheduled")
    )
      return 0;
    return 2;
  };

  // =========================================================================
  // VIEW 2: CUSTOMER PROFILE (When a customer is selected)
  // =========================================================================
  if (selectedCustomer) {
    return (
      <div className="shp-container">
        {toastNode}
        {/* Top actions & Back button */}
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
            onClick={handleBackToCustomers}
            className="shp-btn shp-btn--ghost shp-btn--sm"
          >
            <ArrowLeft size={14} />
            <span>Back to Customers</span>
          </button>

          <div className="shp-header__actions">
            <button
              type="button"
              onClick={() => handleOpenEdit(selectedCustomer)}
              className="shp-btn shp-btn--secondary shp-btn--sm"
            >
              <Edit2 size={13} />
              <span>Edit Customer</span>
            </button>
            {selectedCustomer.status === "Active" ? (
              <button
                type="button"
                onClick={() => setDeactivatingCustomer(selectedCustomer)}
                className="shp-btn shp-btn--secondary shp-btn--sm"
                style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
              >
                <UserMinus size={13} />
                <span>Deactivate</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setDeactivatingCustomer(selectedCustomer)}
                className="shp-btn shp-btn--primary shp-btn--sm"
              >
                <UserPlus size={13} />
                <span>Activate</span>
              </button>
            )}
          </div>
        </div>

        {/* Customer Profile Header Banner */}
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
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                className="shp-avatar"
                style={{ width: 44, height: 44, fontSize: 18 }}
              >
                {selectedCustomer.name.charAt(0).toUpperCase()}
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
                    style={{ margin: 0, fontSize: "20px" }}
                  >
                    {selectedCustomer.name}
                  </h2>
                  <span
                    className={`shp-badge shp-badge--${
                      selectedCustomer.status === "Active" ? "success" : "danger"
                    }`}
                  >
                    {selectedCustomer.status}
                  </span>
                  {selectedCustomer.verified && (
                    <span
                      className="shp-badge shp-badge--outline"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <CheckCircle2 size={12} color="var(--success)" /> Verified
                      Account
                    </span>
                  )}
                </div>
                <p
                  className="shp-subtitle"
                  style={{ fontFamily: "monospace", marginTop: "4px" }}
                >
                  Customer ID: {selectedCustomer.id}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Profile Stat Cards */}
        <div className="shp-kpi-grid">
          <div className="shp-kpi-card">
            <div className="shp-kpi-card__head">
              <span className="shp-kpi-card__icon">
                <Package size={16} />
              </span>
              <span className="shp-kpi-card__title">Total Shipments</span>
            </div>
            <div className="shp-kpi-card__value">
              {customerShipments.length}
            </div>
            <div className="shp-kpi-card__foot">All customer orders</div>
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
                customerShipments.filter((s) =>
                  s.status?.toLowerCase().includes("delivered"),
                ).length
              }
            </div>
            <div className="shp-kpi-card__foot">Completed with POD</div>
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
                customerShipments.filter((s) =>
                  s.status?.toLowerCase().includes("transit"),
                ).length
              }
            </div>
            <div className="shp-kpi-card__foot">On road or depot</div>
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
                customerShipments.filter((s) =>
                  s.status?.toLowerCase().includes("out for delivery"),
                ).length
              }
            </div>
            <div className="shp-kpi-card__foot">Final delivery attempt</div>
          </div>
        </div>

        {/* Customer Information & Addresses Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "16px",
          }}
        >
          {/* Customer Information Card */}
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
                  <span className="shp-kv__value">{selectedCustomer.name}</span>
                </div>
                <div className="shp-kv">
                  <span className="shp-kv__label">Account Status</span>
                  <span className="shp-kv__value">{selectedCustomer.status}</span>
                </div>
                <div className="shp-kv">
                  <span className="shp-kv__label">Email Address</span>
                  <span
                    className="shp-kv__value"
                    style={{ wordBreak: "break-all" }}
                  >
                    {selectedCustomer.email || "—"}
                  </span>
                </div>
                <div className="shp-kv">
                  <span className="shp-kv__label">Phone Number</span>
                  <span className="shp-kv__value">
                    {selectedCustomer.phone || "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Addresses Card */}
          <div className="shp-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div className="shp-card__header">
                <span className="shp-card__icon shp-card__icon--dest">
                  <MapPin size={16} />
                </span>
                <h5 className="shp-card__title">Registered Addresses</h5>
              </div>
              <button
                type="button"
                onClick={() => setIsAddAddressOpen(true)}
                className="shp-btn shp-btn--primary shp-btn--xs"
              >
                <Plus size={13} />
                <span>Add Address</span>
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "10px",
                marginTop: "4px",
              }}
            >
              {(
                selectedCustomer.addresses || [
                  {
                    id: "1",
                    label: "Primary Pickup",
                    address: selectedCustomer.pickupAddress,
                  },
                  {
                    id: "2",
                    label: "Primary Delivery",
                    address: selectedCustomer.deliveryAddress,
                  },
                ]
              ).map((addr) => (
                <div
                  key={addr.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "10px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
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
                    <MapPin size={13} />
                    <strong style={{ fontSize: "12px", color: "#000000" }}>
                      {addr.label}
                    </strong>
                  </div>
                  <p
                    style={{
                      fontSize: "11.5px",
                      color: "hsla(0, 0%, 0%, 0.65)",
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {addr.address || "Address on file"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shipment History */}
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
            <h3
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 700,
                fontFamily: "var(--primary-text)",
              }}
            >
              Customer Shipment History
            </h3>

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
                  value={shipmentSearchQuery}
                  onChange={(e) => setShipmentSearchQuery(e.target.value)}
                  placeholder="Search Tracking No, route..."
                />
                {shipmentSearchQuery && (
                  <button
                    type="button"
                    className="shp-search-clear"
                    onClick={() => setShipmentSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <select
                value={shipmentStatusFilter}
                onChange={(e) => setShipmentStatusFilter(e.target.value)}
                className="shp-select-filter"
              >
                <option value="All">All Statuses</option>
                <option value="Order Placed">Order Placed</option>
                <option value="Dispatched">Dispatched</option>
                <option value="In Transit">In Transit</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>

          <div className="shp-table-wrap">
            <table className="shp-table">
              <thead>
                <tr>
                  <th>Tracking No.</th>
                  <th>Pickup Origin</th>
                  <th>Destination</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingShipments ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ textAlign: "center", padding: "30px" }}
                    >
                      <Loader2
                        size={20}
                        className="animate-spin"
                        style={{
                          margin: "0 auto 6px",
                          color: "var(--primary-color)",
                        }}
                      />
                      <span>Loading customer shipments...</span>
                    </td>
                  </tr>
                ) : filteredShipments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        padding: "30px",
                        color: "hsla(0,0%,0%,0.5)",
                        fontStyle: "italic",
                      }}
                    >
                      No shipments found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredShipments.map((s) => (
                    <tr key={s.id} className="shp-table__row">
                      <td>
                        <button
                          type="button"
                          className="shp-tracking-link"
                          onClick={() => setViewingShipment(s)}
                        >
                          {s.id}
                        </button>
                      </td>
                      <td>
                        <p className="shp-cell-title">{s.pickup}</p>
                        {s.senderName && (
                          <span className="shp-cell-sub">
                            From: {s.senderName}
                          </span>
                        )}
                      </td>
                      <td>
                        <p className="shp-cell-title">{s.delivery}</p>
                        {s.receiverName && (
                          <span className="shp-cell-sub">
                            To: {s.receiverName}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          className={`shp-badge shp-badge--${getStatusTone(
                            s.status,
                          )}`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => setViewingShipment(s)}
                          className="shp-btn shp-btn--ghost shp-btn--xs"
                        >
                          <Eye size={13} />
                          <span>View Shipment</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Shipment Modal with 5-Step Timeline */}
        {viewingShipment && (
          <div className="shp-modal-overlay">
            <div className="shp-modal shp-modal--lg">
              <div className="shp-modal__header">
                <div>
                  <h3 className="shp-modal__title">Shipment Details</h3>
                  <p className="shp-modal__subtitle">
                    Tracking #{viewingShipment.id}
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
                {/* Stepper visualization */}
                <div className="shp-stepper-card">
                  <h4 className="shp-section-title">
                    Shipment Lifecycle Workflow
                  </h4>
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
                  <div className="shp-card">
                    <h5 className="shp-card__title">Origin & Destination</h5>
                    <div className="shp-kv-grid">
                      <div className="shp-kv">
                        <span className="shp-kv__label">Origin</span>
                        <span className="shp-kv__value">
                          {viewingShipment.pickup}
                        </span>
                        {viewingShipment.senderName && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "hsla(0,0%,0%,0.6)",
                            }}
                          >
                            From: {viewingShipment.senderName}
                          </span>
                        )}
                      </div>
                      <div className="shp-kv">
                        <span className="shp-kv__label">Destination</span>
                        <span className="shp-kv__value">
                          {viewingShipment.delivery}
                        </span>
                        {viewingShipment.receiverName && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "hsla(0,0%,0%,0.6)",
                            }}
                          >
                            To: {viewingShipment.receiverName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shp-card">
                    <h5 className="shp-card__title">Cargo & Timeline</h5>
                    <div className="shp-kv-grid">
                      <div className="shp-kv">
                        <span className="shp-kv__label">Expected Date</span>
                        <span className="shp-kv__value">
                          {viewingShipment.date || "N/A"}
                        </span>
                      </div>
                      <div className="shp-kv">
                        <span className="shp-kv__label">Current Status</span>
                        <span
                          className={`shp-badge shp-badge--${getStatusTone(
                            viewingShipment.status,
                          )}`}
                        >
                          {viewingShipment.status}
                        </span>
                      </div>
                      {viewingShipment.weight && (
                        <div className="shp-kv">
                          <span className="shp-kv__label">Cargo Weight</span>
                          <span className="shp-kv__value">
                            {viewingShipment.weight}
                          </span>
                        </div>
                      )}
                    </div>
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

        {/* Add Address Modal */}
        {isAddAddressOpen && (
          <div className="shp-modal-overlay">
            <div className="shp-modal shp-modal--sm">
              <div className="shp-modal__header">
                <div>
                  <h3 className="shp-modal__title">Add New Address</h3>
                  <p className="shp-modal__subtitle">
                    Customer: {selectedCustomer.name}
                  </p>
                </div>
                <button
                  type="button"
                  className="shp-modal__close"
                  onClick={() => setIsAddAddressOpen(false)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {addressError && (
                <div
                  className="shp-alert shp-alert--danger"
                  style={{ margin: "16px 20px 0" }}
                >
                  {addressError}
                </div>
              )}

              <form onSubmit={handleSaveAddress} className="shp-modal__form">
                <div className="shp-form-group">
                  <label>Facility / Branch Name *</label>
                  <input
                    type="text"
                    required
                    value={newAddressForm.label}
                    onChange={(e) =>
                      setNewAddressForm({
                        ...newAddressForm,
                        label: e.target.value,
                      })
                    }
                    placeholder="e.g. Surat Branch, Pune DC"
                  />
                </div>

                <div className="shp-form-group">
                  <label>Full Physical Address *</label>
                  <textarea
                    rows={3}
                    required
                    value={newAddressForm.address}
                    onChange={(e) =>
                      setNewAddressForm({
                        ...newAddressForm,
                        address: e.target.value,
                      })
                    }
                    placeholder="Enter street, industrial zone, city, pincode"
                  />
                </div>

                <div
                  className="shp-modal__footer"
                  style={{ margin: "8px -20px -20px -20px" }}
                >
                  <button
                    type="button"
                    className="shp-btn shp-btn--ghost"
                    onClick={() => setIsAddAddressOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="shp-btn shp-btn--primary">
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {editingCustomer && (
          <div className="shp-modal-overlay">
            <div className="shp-modal shp-modal--md">
              <div className="shp-modal__header">
                <div>
                  <h3 className="shp-modal__title">Edit Customer Details</h3>
                  <p className="shp-modal__subtitle">
                    {editingCustomer.name} ({editingCustomer.id})
                  </p>
                </div>
                <button
                  type="button"
                  className="shp-modal__close"
                  onClick={() => setEditingCustomer(null)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="shp-modal__form">
                <div className="shp-form-group">
                  <label>Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                  {formErrors.name && (
                    <span style={{ color: "var(--danger)", fontSize: "11px" }}>
                      {formErrors.name}
                    </span>
                  )}
                </div>

                <div className="shp-form-row">
                  <div className="shp-form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                    {formErrors.email && (
                      <span
                        style={{ color: "var(--danger)", fontSize: "11px" }}
                      >
                        {formErrors.email}
                      </span>
                    )}
                  </div>
                  <div className="shp-form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                    {formErrors.phone && (
                      <span
                        style={{ color: "var(--danger)", fontSize: "11px" }}
                      >
                        {formErrors.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shp-form-group">
                  <label>Default Address *</label>
                  <textarea
                    rows={2}
                    required
                    value={formData.pickupAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pickupAddress: e.target.value,
                      })
                    }
                    placeholder="Enter full physical address"
                  />
                  {formErrors.pickupAddress && (
                    <span style={{ color: "var(--danger)", fontSize: "11px" }}>
                      {formErrors.pickupAddress}
                    </span>
                  )}
                </div>

                <div
                  className="shp-modal__footer"
                  style={{ margin: "8px -20px -20px -20px" }}
                >
                  <button
                    type="button"
                    className="shp-btn shp-btn--ghost"
                    onClick={() => setEditingCustomer(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="shp-btn shp-btn--primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Deactivate / Activate Confirmation Modal */}
        {deactivatingCustomer && (
          <div className="shp-modal-overlay">
            <div className="shp-modal shp-modal--sm">
              <div className="shp-modal__header">
                <div>
                  <h3 className="shp-modal__title">
                    {deactivatingCustomer.status === "Active"
                      ? "Deactivate Customer?"
                      : "Activate Customer?"}
                  </h3>
                  <p className="shp-modal__subtitle">
                    {deactivatingCustomer.name} ({deactivatingCustomer.id})
                  </p>
                </div>
                <button
                  type="button"
                  className="shp-modal__close"
                  onClick={() => setDeactivatingCustomer(null)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="shp-modal__body">
                <p
                  style={{
                    fontSize: "13px",
                    color: "hsla(0, 0%, 0%, 0.75)",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {deactivatingCustomer.status === "Active"
                    ? `Are you sure you want to deactivate ${deactivatingCustomer.name}? Their account will be marked as inactive and won't be able to schedule new dispatches.`
                    : `Are you sure you want to activate ${deactivatingCustomer.name}? Their account will be restored to active status.`}
                </p>
              </div>

              <div className="shp-modal__footer">
                <button
                  type="button"
                  className="shp-btn shp-btn--ghost"
                  onClick={() => setDeactivatingCustomer(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`shp-btn ${
                    deactivatingCustomer.status === "Active"
                      ? "shp-btn--secondary"
                      : "shp-btn--primary"
                  }`}
                  style={
                    deactivatingCustomer.status === "Active"
                      ? { color: "var(--danger)", borderColor: "var(--danger)" }
                      : {}
                  }
                  onClick={handleConfirmStatusToggle}
                >
                  {deactivatingCustomer.status === "Active"
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
  // VIEW 1: MAIN CUSTOMER DASHBOARD SECTION (Directory & Stats)
  // =========================================================================
  return (
    <div className="shp-container">
      {toastNode}
      {/* 1. Header matching DashboardShipment */}
      <div className="shp-header">
        <div>
          <h2 className="shp-title">Customer Management</h2>
          <p className="shp-subtitle">
            Manage customer accounts, addresses, and logistics activity across the network.
          </p>
        </div>

        <div className="shp-header__actions">
          <button
            type="button"
            className="shp-btn shp-btn--ghost"
            onClick={async () => {
              await fetchCustomers();
              showToast("Customer records refreshed");
            }}
            disabled={loading}
            title="Refresh customer data from backend"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            id="main-add-customer-btn"
            onClick={handleOpenAdd}
            className="shp-btn shp-btn--primary"
          >
            <Plus size={16} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards matching DashboardShipment */}
      <div className="shp-kpi-grid">
        {/* Total Customers */}
        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--info">
              <Users size={16} />
            </span>
            <span className="shp-kpi-card__title">Total Customers</span>
          </div>
          <div className="shp-kpi-card__value">{totalCustomers}</div>
          <div className="shp-kpi-card__foot">All registered customer accounts</div>
        </div>

        {/* Active Customers */}
        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--success">
              <CheckCircle2 size={16} />
            </span>
            <span className="shp-kpi-card__title">Active Customers</span>
          </div>
          <div className="shp-kpi-card__value">{activeCustomers}</div>
          <div className="shp-kpi-card__foot">Eligible for scheduling dispatches</div>
        </div>

        {/* Inactive Customers */}
        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--warning">
              <AlertTriangle size={16} />
            </span>
            <span className="shp-kpi-card__title">Inactive Customers</span>
          </div>
          <div className="shp-kpi-card__value">{inactiveCustomers}</div>
          <div className="shp-kpi-card__foot">Deactivated or suspended accounts</div>
        </div>

        {/* Shipments */}
        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--info">
              <Truck size={16} />
            </span>
            <span className="shp-kpi-card__title">Shipments</span>
          </div>
          <div className="shp-kpi-card__value">{totalShipments}</div>
          <div className="shp-kpi-card__foot">Associated logistics dispatches</div>
        </div>
      </div>

      {/* 3. Filter & Control Bar */}
      <div className="shp-control-bar">
        <div className="shp-tabs">
          {[
            { key: "All", label: "All Customers", count: totalCustomers },
            { key: "Active", label: "Active", count: activeCustomers },
            { key: "Inactive", label: "Inactive", count: inactiveCustomers },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`shp-tab ${statusFilter === tab.key ? "shp-tab--active" : ""}`}
              onClick={() => {
                setStatusFilter(tab.key);
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
              id="directory-search-input"
              placeholder="Search customers..."
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="shp-select-filter"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {loading ? (
            <span className="shp-badge shp-badge--info">
              <Loader2 size={12} className="animate-spin" />
              Syncing...
            </span>
          ) : apiCustomers !== null ? (
            <span className="shp-badge shp-badge--success" title="API Connected">
              ● API Connected
            </span>
          ) : (
            <span
              className="shp-badge shp-badge--warning"
              title={apiError || "Backend not connected. Showing local data."}
            >
              ● Offline Mode
            </span>
          )}
        </div>
      </div>

      {/* 4. Customer Directory Table Card */}
      <div className="shp-table-card">
        {/* Loading state */}
        {loading && customers.length === 0 && (
          <div className="shp-empty-state">
            <Loader2
              size={24}
              className="animate-spin"
              style={{ margin: "0 auto 8px" }}
            />
            <p className="shp-empty-state__title">Loading customers...</p>
            <p className="shp-empty-state__text">GET {API_BASE_URL}/customers</p>
          </div>
        )}

        {/* Empty state */}
        {customers.length > 0 && filteredCustomers.length === 0 && (
          <div className="shp-empty-state">
            <Users size={32} style={{ margin: "0 auto 8px", opacity: 0.35 }} />
            <p className="shp-empty-state__title">No customers found</p>
            <p className="shp-empty-state__text">
              Try adjusting your search query or status filter.
            </p>
          </div>
        )}

        {/* Table Content */}
        {filteredCustomers.length > 0 && (
          <div className="shp-table-wrap">
            <table className="shp-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Customer ID</th>
                  <th style={{ textAlign: "center" }}>Shipments</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedCustomers.map((c) => (
                  <tr key={c.id} className="shp-table__row">
                    {/* Customer */}
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <div className="shp-avatar">
                          {c.name ? c.name.charAt(0).toUpperCase() : "C"}
                        </div>
                        <div>
                          <button
                            type="button"
                            className="shp-tracking-link"
                            onClick={() => handleViewCustomer(c)}
                          >
                            {c.name}
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td>
                      <p className="shp-cell-title">{c.email || "—"}</p>
                      <span className="shp-cell-sub">{c.phone || "—"}</span>
                    </td>

                    {/* Customer ID */}
                    <td>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "12px",
                          color: "var(--text-muted)",
                        }}
                      >
                        {c.id}
                      </span>
                    </td>

                    {/* Shipments */}
                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: "13px" }}>
                        {c.shipmentCount ||
                          (c.shipments ? c.shipments.length : 0)}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ textAlign: "center" }}>
                      <span
                        className={`shp-badge shp-badge--${getStatusTone(c.status)}`}
                      >
                        {c.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: "right" }}>
                      <div className="shp-action-btns">
                        <button
                          type="button"
                          id={`view-cust-${c.id}`}
                          className="shp-icon-btn"
                          title="View Customer Profile"
                          onClick={() => handleViewCustomer(c)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          className="shp-icon-btn"
                          title="Edit Customer"
                          onClick={() => handleOpenEdit(c)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className={`shp-icon-btn ${c.status === "Active" ? "shp-icon-btn--danger" : ""}`}
                          title={
                            c.status === "Active"
                              ? "Deactivate Customer"
                              : "Activate Customer"
                          }
                          onClick={() => setDeactivatingCustomer(c)}
                        >
                          {c.status === "Active" ? (
                            <UserMinus size={14} />
                          ) : (
                            <UserPlus size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Pagination Footer */}
        <div className="shp-table-footer">
          <div className="shp-pagination-info">
            {filteredCustomers.length === 0 ? (
              <span>No customers to display</span>
            ) : (
              <span>
                Showing <strong>{startIndex + 1}</strong>–<strong>{endIndex}</strong> of{" "}
                <strong>{filteredCustomers.length}</strong> customers
                {filteredCustomers.length !== customers.length && (
                  <span className="shp-pagination-total-hint">
                    {" "}(filtered from {customers.length} total)
                  </span>
                )}
              </span>
            )}
          </div>

          {filteredCustomers.length > 0 && (
            <div className="shp-pagination-controls">
              <div className="shp-pagination-size">
                <label htmlFor="customer-page-size">Rows per page:</label>
                <select
                  id="customer-page-size"
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
                          key={`cust-page-${pageNum}`}
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

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="shp-modal-overlay">
          <div className="shp-modal shp-modal--md">
            <div className="shp-modal__header">
              <div>
                <h3 className="shp-modal__title">Add New Customer</h3>
                <p className="shp-modal__subtitle">
                  Create a new customer account for booking and dispatching shipments.
                </p>
              </div>
              <button
                type="button"
                className="shp-modal__close"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="shp-modal__form">
              <div className="shp-form-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Acme Corporation"
                />
                {formErrors.name && (
                  <span style={{ color: "var(--danger)", fontSize: "11px" }}>
                    {formErrors.name}
                  </span>
                )}
              </div>

              <div className="shp-form-row">
                <div className="shp-form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="name@example.com"
                  />
                  {formErrors.email && (
                    <span style={{ color: "var(--danger)", fontSize: "11px" }}>
                      {formErrors.email}
                    </span>
                  )}
                </div>
                <div className="shp-form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="98765 43210"
                  />
                  {formErrors.phone && (
                    <span style={{ color: "var(--danger)", fontSize: "11px" }}>
                      {formErrors.phone}
                    </span>
                  )}
                </div>
              </div>

              <div className="shp-form-group">
                <label>Primary Facility Address *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.pickupAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pickupAddress: e.target.value,
                    })
                  }
                  placeholder="Primary warehouse or facility location"
                />
                {formErrors.pickupAddress && (
                  <span style={{ color: "var(--danger)", fontSize: "11px" }}>
                    {formErrors.pickupAddress}
                  </span>
                )}
              </div>

              <div
                className="shp-modal__footer"
                style={{ margin: "8px -20px -20px -20px" }}
              >
                <button
                  type="button"
                  className="shp-btn shp-btn--ghost"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="shp-btn shp-btn--primary">
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal (when triggered from directory table) */}
      {editingCustomer && (
        <div className="shp-modal-overlay">
          <div className="shp-modal shp-modal--md">
            <div className="shp-modal__header">
              <div>
                <h3 className="shp-modal__title">Edit Customer Details</h3>
                <p className="shp-modal__subtitle">
                  {editingCustomer.name} ({editingCustomer.id})
                </p>
              </div>
              <button
                type="button"
                className="shp-modal__close"
                onClick={() => setEditingCustomer(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="shp-modal__form">
              <div className="shp-form-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                {formErrors.name && (
                  <span style={{ color: "var(--danger)", fontSize: "11px" }}>
                    {formErrors.name}
                  </span>
                )}
              </div>

              <div className="shp-form-row">
                <div className="shp-form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                  {formErrors.email && (
                    <span style={{ color: "var(--danger)", fontSize: "11px" }}>
                      {formErrors.email}
                    </span>
                  )}
                </div>
                <div className="shp-form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                  {formErrors.phone && (
                    <span style={{ color: "var(--danger)", fontSize: "11px" }}>
                      {formErrors.phone}
                    </span>
                  )}
                </div>
              </div>

              <div className="shp-form-group">
                <label>Default Address *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.pickupAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pickupAddress: e.target.value,
                    })
                  }
                  placeholder="Enter full physical address"
                />
                {formErrors.pickupAddress && (
                  <span style={{ color: "var(--danger)", fontSize: "11px" }}>
                    {formErrors.pickupAddress}
                  </span>
                )}
              </div>

              <div
                className="shp-modal__footer"
                style={{ margin: "8px -20px -20px -20px" }}
              >
                <button
                  type="button"
                  className="shp-btn shp-btn--ghost"
                  onClick={() => setEditingCustomer(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="shp-btn shp-btn--primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate / Activate Confirmation Modal (when triggered from directory table) */}
      {deactivatingCustomer && (
        <div className="shp-modal-overlay">
          <div className="shp-modal shp-modal--sm">
            <div className="shp-modal__header">
              <div>
                <h3 className="shp-modal__title">
                  {deactivatingCustomer.status === "Active"
                    ? "Deactivate Customer?"
                    : "Activate Customer?"}
                </h3>
                <p className="shp-modal__subtitle">
                  {deactivatingCustomer.name} ({deactivatingCustomer.id})
                </p>
              </div>
              <button
                type="button"
                className="shp-modal__close"
                onClick={() => setDeactivatingCustomer(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="shp-modal__body">
              <p
                style={{
                  fontSize: "13px",
                  color: "hsla(0, 0%, 0%, 0.75)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {deactivatingCustomer.status === "Active"
                  ? `Are you sure you want to deactivate ${deactivatingCustomer.name}? Their account will be marked as inactive and won't be able to schedule new dispatches.`
                  : `Are you sure you want to activate ${deactivatingCustomer.name}? Their account will be restored to active status.`}
              </p>
            </div>

            <div className="shp-modal__footer">
              <button
                type="button"
                className="shp-btn shp-btn--ghost"
                onClick={() => setDeactivatingCustomer(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`shp-btn ${
                  deactivatingCustomer.status === "Active"
                    ? "shp-btn--secondary"
                    : "shp-btn--primary"
                }`}
                style={
                  deactivatingCustomer.status === "Active"
                    ? { color: "var(--danger)", borderColor: "var(--danger)" }
                    : {}
                }
                onClick={handleConfirmStatusToggle}
              >
                {deactivatingCustomer.status === "Active"
                  ? "Deactivate"
                  : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCustomer;
