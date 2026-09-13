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
} from "lucide-react";
import { useApp } from "../../context/AppContext";

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

const getStatusBadgeClass = (status) => {
  const s = status?.toLowerCase() || "";
  if (s.includes("delivered")) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }
  if (s.includes("out for delivery")) {
    return "bg-purple-50 text-purple-700 border border-purple-200";
  }
  if (s.includes("in transit") || s.includes("transit")) {
    return "bg-blue-50 text-blue-700 border border-blue-200";
  }
  if (
    s.includes("dispatched") ||
    s.includes("picked up") ||
    s.includes("warehouse")
  ) {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }
  if (s.includes("failed") || s.includes("cancelled")) {
    return "bg-rose-50 text-rose-700 border border-rose-200";
  }
  return "bg-gray-50 text-gray-700 border border-gray-200";
};

export const DashboardCustomer = () => {
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

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
    } catch (error) {
      // Offline fallback: save to local context
      addCustomer(formData);
      setIsAddModalOpen(false);
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
        return;
      } else {
        setFormErrors({
          name: data.message || "Failed to update customer on server",
        });
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
      <div className="space-y-6">
        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <button
            onClick={handleBackToCustomers}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Customer Management
          </button>
          <span>/</span>
          <span className="text-gray-900 font-semibold">
            {selectedCustomer.name}
          </span>
        </div>

        {/* Back button */}
        <div>
          <button
            onClick={handleBackToCustomers}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors cursor-pointer py-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Customers</span>
          </button>
        </div>

        {/* Customer Profile Header Banner */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {selectedCustomer.name}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-medium text-gray-500">
                {selectedCustomer.id}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  selectedCustomer.status === "Active"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    selectedCustomer.status === "Active"
                      ? "bg-emerald-500"
                      : "bg-rose-500"
                  }`}
                />
                {selectedCustomer.status}
              </span>
            </div>
          </div>

          {/* Edit & Deactivate action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleOpenEdit(selectedCustomer)}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Edit Customer
            </button>
            {selectedCustomer.status === "Active" ? (
              <button
                onClick={() => setDeactivatingCustomer(selectedCustomer)}
                className="px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Deactivate
              </button>
            ) : (
              <button
                onClick={() => setDeactivatingCustomer(selectedCustomer)}
                className="px-4 py-2 border border-emerald-200 hover:bg-emerald-50 text-emerald-600 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Activate
              </button>
            )}
          </div>
        </div>

        {/* Customer Profile Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-xs font-semibold text-gray-500">Shipments</div>
            <div className="text-3xl font-black text-gray-900 mt-2">
              {customerShipments.length}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-xs font-semibold text-gray-500">Delivered</div>
            <div className="text-3xl font-black text-emerald-600 mt-2">
              {
                customerShipments.filter((s) =>
                  s.status?.toLowerCase().includes("delivered"),
                ).length
              }
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-xs font-semibold text-gray-500">
              In Transit
            </div>
            <div className="text-3xl font-black text-blue-600 mt-2">
              {
                customerShipments.filter((s) =>
                  s.status?.toLowerCase().includes("transit"),
                ).length
              }
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-xs font-semibold text-gray-500">
              Out for Delivery
            </div>
            <div className="text-3xl font-black text-purple-600 mt-2">
              {
                customerShipments.filter((s) =>
                  s.status?.toLowerCase().includes("out for delivery"),
                ).length
              }
            </div>
          </div>
        </div>

        {/* Customer Information & Addresses Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Information Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              Customer Information
            </h3>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <span className="text-xs text-gray-400 font-medium block">
                  Name
                </span>
                <span className="font-semibold text-gray-900 mt-0.5 block">
                  {selectedCustomer.name}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-medium block">
                  Email
                </span>
                <span className="font-semibold text-gray-900 mt-0.5 block">
                  {selectedCustomer.email}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-medium block">
                  Phone
                </span>
                <span className="font-semibold text-gray-900 mt-0.5 block">
                  {selectedCustomer.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Addresses Card */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Addresses</h3>
              <button
                onClick={() => setIsAddAddressOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Address</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                selectedCustomer.addresses || [
                  {
                    id: "1",
                    label: "Ahmedabad Warehouse",
                    address: selectedCustomer.pickupAddress,
                  },
                  {
                    id: "2",
                    label: "Mumbai Office",
                    address: selectedCustomer.deliveryAddress,
                  },
                  {
                    id: "3",
                    label: "Surat Branch",
                    address: "Ring Road Commercial Complex, Surat",
                  },
                ]
              ).map((addr) => (
                <div
                  key={addr.id}
                  className="p-4 bg-gray-50/80 border border-gray-200 rounded-xl space-y-1.5 hover:bg-gray-100/70 transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-blue-600">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <h4 className="font-bold text-xs text-gray-900 truncate">
                      {addr.label}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {addr.address || "Address on file"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shipment History */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-base font-bold text-gray-900">
              Shipment History
            </h3>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={shipmentSearchQuery}
                  onChange={(e) => setShipmentSearchQuery(e.target.value)}
                  placeholder="Search Tracking No..."
                  className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="relative">
                <select
                  value={shipmentStatusFilter}
                  onChange={(e) => setShipmentStatusFilter(e.target.value)}
                  className="pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                >
                  <option value="All">Status</option>
                  <option value="Order Placed">Order Placed</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Table: Tracking No. | Pickup | Delivery | Status | Actions */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-162.5">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider pb-2">
                  <th className="py-2.5 px-3">Tracking No.</th>
                  <th className="py-2.5 px-3">Pickup</th>
                  <th className="py-2.5 px-3">Delivery</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                {loadingShipments ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Loading customer shipments...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredShipments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-gray-400 italic"
                    >
                      No shipments found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredShipments.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-3 font-mono font-bold text-blue-600">
                        {s.id}
                      </td>
                      <td className="py-3.5 px-3 text-gray-700 font-medium">
                        {s.pickup}
                      </td>
                      <td className="py-3.5 px-3 text-gray-700 font-medium">
                        {s.delivery}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(
                            s.status,
                          )}`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => setViewingShipment(s)}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          View Shipment
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Shipment Details
                    </h3>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      {viewingShipment.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingShipment(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Route Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">
                    Origin
                  </span>
                  <span className="font-semibold text-gray-800 mt-0.5 block">
                    {viewingShipment.pickup}
                  </span>
                  {viewingShipment.senderName && (
                    <span className="text-[11px] text-gray-500 mt-0.5 block truncate">
                      From: {viewingShipment.senderName}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">
                    Destination
                  </span>
                  <span className="font-semibold text-gray-800 mt-0.5 block">
                    {viewingShipment.delivery}
                  </span>
                  {viewingShipment.receiverName && (
                    <span className="text-[11px] text-gray-500 mt-0.5 block truncate">
                      To: {viewingShipment.receiverName}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">
                    Date
                  </span>
                  <span className="font-semibold text-gray-800 mt-0.5 block">
                    {viewingShipment.date}
                  </span>
                  {viewingShipment.weight && (
                    <span className="text-[11px] text-gray-500 mt-0.5 block">
                      Weight: {viewingShipment.weight}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">
                    Status
                  </span>
                  <span
                    className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(
                      viewingShipment.status,
                    )}`}
                  >
                    {viewingShipment.status}
                  </span>
                </div>
              </div>

              {/* 5-Step Timeline */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  Shipment Status Timeline
                </h4>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {timelineSteps.map((step, idx) => {
                    const currentIdx = getStepIndex(viewingShipment.status);
                    const isCompleted = idx < currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <div
                        key={step.step}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCompleted
                              ? "bg-emerald-500 text-white shadow-xs"
                              : isCurrent
                                ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs"
                                : "border-2 border-gray-200 text-gray-400 bg-white"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            step.step
                          )}
                        </div>
                        <div
                          className={`text-[11px] font-semibold leading-tight ${
                            isCompleted
                              ? "text-gray-900"
                              : isCurrent
                                ? "text-blue-600"
                                : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setViewingShipment(null)}
                  className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Address Modal */}
        {isAddAddressOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">
                  Add New Address
                </h3>
                <button
                  onClick={() => setIsAddAddressOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {addressError && (
                <p className="text-xs text-rose-500 font-semibold">
                  {addressError}
                </p>
              )}

              <form onSubmit={handleSaveAddress} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Facility / Branch Name *
                  </label>
                  <input
                    type="text"
                    value={newAddressForm.label}
                    onChange={(e) =>
                      setNewAddressForm({
                        ...newAddressForm,
                        label: e.target.value,
                      })
                    }
                    placeholder="e.g. Surat Branch, Pune DC"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Full Physical Address *
                  </label>
                  <textarea
                    rows={2}
                    value={newAddressForm.address}
                    onChange={(e) =>
                      setNewAddressForm({
                        ...newAddressForm,
                        address: e.target.value,
                      })
                    }
                    placeholder="Enter street, industrial zone, city, pincode"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsAddAddressOpen(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 shadow-sm"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {editingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">
                  Edit Customer ({editingCustomer.name})
                </h3>
                <button
                  onClick={() => setEditingCustomer(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  />
                  {formErrors.name && (
                    <p className="text-xs text-rose-500 mt-1">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                    />
                    {formErrors.email && (
                      <p className="text-xs text-rose-500 mt-1">
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                    />
                    {formErrors.phone && (
                      <p className="text-xs text-rose-500 mt-1">
                        {formErrors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Address *
                  </label>
                  <textarea
                    rows={2}
                    value={formData.pickupAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pickupAddress: e.target.value,
                      })
                    }
                    placeholder="Enter full physical address"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  />
                  {formErrors.pickupAddress && (
                    <p className="text-xs text-rose-500 mt-1">
                      {formErrors.pickupAddress}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setEditingCustomer(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 shadow-sm cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Deactivate / Activate Confirmation Modal */}
        {deactivatingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    deactivatingCustomer.status === "Active"
                      ? "bg-rose-50 text-rose-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {deactivatingCustomer.status === "Active"
                      ? "Deactivate Customer?"
                      : "Activate Customer?"}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    {deactivatingCustomer.id}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                {deactivatingCustomer.status === "Active"
                  ? `Are you sure you want to deactivate ${deactivatingCustomer.name}? Their account will be marked as inactive.`
                  : `Are you sure you want to activate ${deactivatingCustomer.name}? Their account will be marked as active.`}
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeactivatingCustomer(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStatusToggle}
                  className={`px-5 py-2 text-white text-xs font-semibold rounded-xl shadow-sm ${
                    deactivatingCustomer.status === "Active"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
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
    <div className="space-y-6">
      {/* 1. Header Card matching Wireframe */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Customer Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage customer accounts, addresses and logistics activity.
          </p>
        </div>

        <div>
          <button
            type="button"
            id="main-add-customer-btn"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* 2. Four Stat Cards matching Wireframe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500">
            Total Customers
          </div>
          <div className="text-3xl font-black text-gray-900 mt-2">
            {totalCustomers}
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500">
            Active Customers
          </div>
          <div className="text-3xl font-black text-gray-900 mt-2">
            {activeCustomers}
          </div>
        </div>

        {/* Inactive Customers */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500">
            Inactive Customers
          </div>
          <div className="text-3xl font-black text-gray-900 mt-2">
            {inactiveCustomers}
          </div>
        </div>

        {/* Shipments */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500">Shipments</div>
          <div className="text-3xl font-black text-gray-900 mt-2">
            {totalShipments}
          </div>
        </div>
      </div>

      {/* 3. Customer Directory Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">
              Customer Directory
            </h2>
            {loading ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                Syncing...
              </span>
            ) : apiCustomers !== null ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                API Connected
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full cursor-help"
                title={apiError || "Backend not connected. Showing local data."}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Offline Mode
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                id="directory-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers..."
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Status Dropdown Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Refresh from API button */}
            <button
              type="button"
              onClick={() => fetchCustomers()}
              disabled={loading}
              title="Refresh customer data from backend"
              className="p-2 bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Customer Directory Table matching wireframe: Customer | Contact | Customer ID | Shipments | Status | Actions */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-175">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider pb-2">
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Customer ID</th>
                <th className="py-3 px-3 text-center">Shipments</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
              {loading && customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto mb-2" />
                    <p className="font-semibold text-gray-700 text-sm">
                      Loading customers from backend server...
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      GET {API_BASE_URL}/customers
                    </p>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-1.5" />
                    <p className="font-semibold text-gray-700">
                      No customers found
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Try adjusting your search or status filter.
                    </p>
                  </td>
                </tr>
              ) : (
                displayedCustomers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50/70 transition-colors group"
                  >
                    {/* Customer */}
                    <td className="py-3.5 px-3 font-semibold text-gray-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <button
                          onClick={() => handleViewCustomer(c)}
                          className="hover:text-blue-600 transition-colors font-bold text-left cursor-pointer"
                        >
                          {c.name}
                        </button>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-3 text-gray-600">
                      <div className="space-y-0.5 text-xs">
                        <div className="text-gray-800 font-medium">
                          {c.email}
                        </div>
                        <div className="text-gray-400">{c.phone}</div>
                      </div>
                    </td>

                    {/* Customer ID */}
                    <td className="py-3.5 px-3 font-mono font-medium text-gray-600">
                      {c.id}
                    </td>

                    {/* Shipments */}
                    <td className="py-3.5 px-3 text-center font-bold text-gray-900">
                      {c.shipmentCount ||
                        (c.shipments ? c.shipments.length : 0)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          c.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            c.status === "Active"
                              ? "bg-emerald-500"
                              : "bg-rose-500"
                          }`}
                        />
                        {c.status}
                      </span>
                    </td>

                    {/* Actions: View */}
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        id={`view-cust-${c.id}`}
                        onClick={() => handleViewCustomer(c)}
                        className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-gray-600">
          <div>
            {filteredCustomers.length === 0 ? (
              <span>No customers to display</span>
            ) : (
              <span>
                Showing <strong className="font-semibold text-gray-900">{startIndex + 1}</strong>–<strong className="font-semibold text-gray-900">{endIndex}</strong> of{" "}
                <strong className="font-semibold text-gray-900">{filteredCustomers.length}</strong> customers
                {filteredCustomers.length !== customers.length && (
                  <span className="text-gray-400 font-normal">
                    {" "}(filtered from {customers.length} total)
                  </span>
                )}
              </span>
            )}
          </div>

          {filteredCustomers.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {/* Rows per page selector */}
              <div className="flex items-center gap-2">
                <label htmlFor="customer-page-size" className="text-gray-500 font-medium text-xs">
                  Rows per page:
                </label>
                <select
                  id="customer-page-size"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="First Page"
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Previous Page"
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 mx-1">
                  {getPageNumbers(safeCurrentPage, totalPages).map((pageNum, idx) =>
                    pageNum === "..." ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-xs">
                        …
                      </span>
                    ) : (
                      <button
                        key={`cust-page-${pageNum}`}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-8 h-8 px-2 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          safeCurrentPage === pageNum
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-2xs"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ),
                  )}
                </div>

                <button
                  type="button"
                  title="Next Page"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Last Page"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Add New Customer
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                />
                {formErrors.name && (
                  <p className="text-xs text-rose-500 mt-1">
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  />
                  {formErrors.email && (
                    <p className="text-xs text-rose-500 mt-1">
                      {formErrors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="98765 43210"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  />
                  {formErrors.phone && (
                    <p className="text-xs text-rose-500 mt-1">
                      {formErrors.phone}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Address
                </label>
                <textarea
                  rows={2}
                  value={formData.pickupAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, pickupAddress: e.target.value })
                  }
                  placeholder="Primary warehouse or facility location"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500  focus:outline-none"
                  style={{ resize: "none", height: "100px" }}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 shadow-sm cursor-pointer"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCustomer;
