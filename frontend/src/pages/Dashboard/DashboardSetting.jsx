import React, { useState, useEffect, useMemo } from "react";
import {
  User,
  Users,
  ShieldCheck,
  Bell,
  Save,
  UserCircle,
  Camera,
  Lock,
  ShieldAlert,
  Search,
  Plus,
  Trash2,
  Shield,
  Truck,
  Navigation2,
  Key,
  ChevronRight,
  BellRing,
  AlertTriangle,
  FileCheck,
  FileText,
  Mail,
  MessageSquare,
  Webhook,
  X,
  Loader2,
  RefreshCw,
  Building2,
  Landmark,
  MapPin,
  LayoutDashboard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ── Profile Tab ─────────────────────────────────────────────────────────────
function ProfileTabSection({ onShowToast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    status: "",
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/user/profile`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const user = data.user;
          const localUser = JSON.parse(localStorage.getItem("user") || "{}");
          setFormData({
            name: user.name || localUser.name || "",
            email: user.email || localUser.email || "",
            role: user.role || localUser.role || "",
            status: user.status || localUser.status || "active",
          });
        }
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role.trim(),
        status: formData.status.trim(),
      };

      const res = await fetch(`${API_BASE_URL}/user/profile`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        onShowToast("Profile updated successfully!");
        if (data.user) {
          setFormData({
            name: data.user.name || formData.name,
            email: data.user.email || formData.email,
            role: data.user.role || formData.role,
            status: data.user.status || formData.status,
          });
          const localUser = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem(
            "user",
            JSON.stringify({ ...localUser, ...data.user }),
          );
        }
      } else {
        onShowToast(data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      onShowToast("Error updating profile. Check server connection.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span>Loading profile from backend...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveProfile} className="space-y-6">
      {/* Personal Info Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-blue-600 shrink-0" />
            <span>Personal Information</span>
          </h3>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer self-start sm:self-auto w-full sm:w-auto"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <Save className="w-4 h-4 shrink-0" />
            )}
            <span>Save Profile</span>
          </button>
        </div>

        {/* Avatar Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8 pb-6 border-b border-slate-100">
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold ring-4 ring-blue-50 shadow-md">
              {formData.name ? formData.name.charAt(0).toUpperCase() : "U"}
            </div>
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-semibold text-slate-900">
              {formData.name || "User"}
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {formData.role || "User"}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-medium ${
                  (formData.status || "active").toLowerCase() === "active"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${
                    (formData.status || "active").toLowerCase() === "active"
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }`}
                ></span>
                <span className="capitalize">
                  {formData.status || "Active"}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter name"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Role
            </label>
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleChange}
              placeholder="Role"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status || "active"}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition capitalize"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>
    </form>
  );
}

// ── Company Info Tab ────────────────────────────────────────────────────────
function CompanyInfoTabSection({ onShowToast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    cin: "",
    gstin: "",
    pan: "",
    hsnSacCode: "",
    headOffice: "",
    phone: "",
    email: "",
    web: "",
    bankDetails: {
      bankName: "",
      accountName: "",
      accountNumber: "",
      ifscCode: "",
      branch: "",
    },
  });

  const fetchCompanyInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/company-info`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const ci = data.company || data.companyInfo;
        if (ci) {
          setFormData({
            name: ci.name || "",
            tagline: ci.tagline || "",
            cin: ci.cin || "",
            gstin: ci.gstin || "",
            pan: ci.pan || "",
            hsnSacCode: ci.hsnSacCode || "",
            headOffice: ci.headOffice || "",
            phone: ci.phone || "",
            email: ci.email || "",
            web: ci.web || "",
            bankDetails: {
              bankName: ci.bankDetails?.bankName || "",
              accountName: ci.bankDetails?.accountName || "",
              accountNumber: ci.bankDetails?.accountNumber || "",
              ifscCode: ci.bankDetails?.ifscCode || "",
              branch: ci.bankDetails?.branch || "",
            },
          });
        }
      }
    } catch (err) {
      console.error("Fetch company info error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("bank_")) {
      const field = name.replace("bank_", "");
      setFormData((prev) => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSaveCompanyInfo = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/company-info`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        const ci = data.company || data.companyInfo;
        if (ci) {
          setFormData({
            name: ci.name || "",
            tagline: ci.tagline || "",
            cin: ci.cin || "",
            gstin: ci.gstin || "",
            pan: ci.pan || "",
            hsnSacCode: ci.hsnSacCode || "",
            headOffice: ci.headOffice || "",
            phone: ci.phone || "",
            email: ci.email || "",
            web: ci.web || "",
            bankDetails: {
              bankName: ci.bankDetails?.bankName || "",
              accountName: ci.bankDetails?.accountName || "",
              accountNumber: ci.bankDetails?.accountNumber || "",
              ifscCode: ci.bankDetails?.ifscCode || "",
              branch: ci.bankDetails?.branch || "",
            },
          });
        }
        onShowToast("Company information updated successfully in database!");
      } else {
        onShowToast(data.message || "Failed to update company info.");
      }
    } catch (err) {
      console.error("Save company info error:", err);
      onShowToast("Error updating company info. Check server connection.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span>Loading company details from backend...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveCompanyInfo} className="space-y-6">
      {/* Corporate Registration Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
            <span>Company Identification & Registration</span>
          </h3>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer self-start sm:self-auto w-full sm:w-auto"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <Save className="w-4 h-4 shrink-0" />
            )}
            <span>Save Company Info</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Company Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Tagline / Business Description
            </label>
            <input
              type="text"
              name="tagline"
              value={formData.tagline}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Corporate Identification Number (CIN)
            </label>
            <input
              type="text"
              name="cin"
              value={formData.cin}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              GSTIN
            </label>
            <input
              type="text"
              name="gstin"
              value={formData.gstin}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              PAN Number
            </label>
            <input
              type="text"
              name="pan"
              value={formData.pan}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              HSN / SAC Code
            </label>
            <input
              type="text"
              name="hsnSacCode"
              value={formData.hsnSacCode}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>
        </div>
      </div>

      {/* Head Office & Contact Details Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Head Office & Contact Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Head Office Address
            </label>
            <textarea
              rows={2}
              name="headOffice"
              value={formData.headOffice}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Phone Number(s)
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Billing Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Official Website
            </label>
            <input
              type="text"
              name="web"
              value={formData.web}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>
        </div>
      </div>

      {/* Official Bank Account Details Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
          <Landmark className="w-5 h-5 text-blue-600" />
          Official Bank Account Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Bank Name
            </label>
            <input
              type="text"
              name="bank_bankName"
              value={formData.bankDetails.bankName}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Account Holder Name
            </label>
            <input
              type="text"
              name="bank_accountName"
              value={formData.bankDetails.accountName}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Account Number
            </label>
            <input
              type="text"
              name="bank_accountNumber"
              value={formData.bankDetails.accountNumber}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              IFSC Code
            </label>
            <input
              type="text"
              name="bank_ifscCode"
              value={formData.bankDetails.ifscCode}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Bank Branch
            </label>
            <input
              type="text"
              name="bank_branch"
              value={formData.bankDetails.branch}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>
        </div>
      </div>

      {/* Bottom Save Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? "Saving Company Info..." : "Save Company Info"}</span>
        </button>
      </div>
    </form>
  );
}

// ── Users Tab ───────────────────────────────────────────────────────────────
function UsersTabSection({
  users,
  loading,
  onDeleteUser,
  onToggleStatus,
  onOpenAddUser,
}) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter((u) => {
    const status = (u.status || "active").toLowerCase();
    const matchesFilter = filter === "all" || status === filter.toLowerCase();
    const nameStr = (u.name || "").toLowerCase();
    const emailStr = (u.email || "").toLowerCase();
    const matchesSearch =
      nameStr.includes(search.toLowerCase()) ||
      emailStr.includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const activeCount = users.filter(
    (u) => (u.status || "active").toLowerCase() === "active",
  ).length;
  const pendingCount = users.filter(
    (u) =>
      (u.status || "").toLowerCase() === "inactive" ||
      (u.status || "").toLowerCase() === "pending",
  ).length;

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
              filter === "all"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("active")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
              filter === "active"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("pending")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
              filter === "pending"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Inactive/Pending ({pendingCount})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user by name or email..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>
          <button
            type="button"
            onClick={() => navigate("/register-user")}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold px-4 py-2 sm:py-1.5 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading users from backend index.js...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No users found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">User Profile</th>
                  <th className="py-3 px-5">Role</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredUsers.map((user) => {
                  const initial = (user.name || "U").charAt(0).toUpperCase();
                  const isStatusActive =
                    (user.status || "active").toLowerCase() === "active";
                  return (
                    <tr
                      key={user._id || user.id}
                      className="hover:bg-slate-50/80 transition"
                    >
                      <td className="py-3.5 px-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {initial}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">
                            {user.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-medium text-slate-700">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-200/60 rounded text-xs text-slate-800 font-semibold">
                          {user.role || "User"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <button
                          type="button"
                          onClick={() =>
                            onToggleStatus(user._id || user.id, user.status)
                          }
                          title="Click to toggle status"
                          className="cursor-pointer"
                        >
                          {isStatusActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>{" "}
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 hover:bg-amber-200 transition">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>{" "}
                              Inactive
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => onDeleteUser(user._id || user.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Roles Tab ───────────────────────────────────────────────────────────────
function RolesTabSection() {
  const rolesList = [
    {
      id: "admin",
      title: "Admin",
      bgBadge: "bg-blue-100 text-blue-800",
      icon: <Shield className="w-5 h-5 text-blue-600" />,
      features: ["Full system access"],
    },
    {
      id: "logistics_manager",
      title: "Logistics Manager",
      bgBadge: "bg-emerald-100 text-emerald-800",
      icon: <Truck className="w-5 h-5 text-emerald-600" />,
      features: [
        "Operations planning",
        "Resource assignment",
        "Performance/reports",
      ],
    },
    {
      id: "dispatcher",
      title: "Dispatcher",
      bgBadge: "bg-amber-100 text-amber-800",
      icon: <Navigation2 className="w-5 h-5 text-amber-600" />,
      features: [
        "Shipment creation",
        "Driver/vehicle assignment",
        "Trip creation",
        "Operational status",
      ],
    },
    {
      id: "warehouse_manager",
      title: "Warehouse Manager",
      bgBadge: "bg-purple-100 text-purple-800",
      icon: <Key className="w-5 h-5 text-purple-600" />,
      features: [
        "Incoming packages",
        "Sorting & Storage",
        "Scanning & Dispatch",
      ],
    },
  ];

  const sidebarMatrix = [
    {
      name: "Dashboard",
      admin: true,
      manager: true,
      dispatcher: true,
      warehouse: true,
    },
    {
      name: "Customers",
      admin: true,
      manager: false,
      dispatcher: false,
      warehouse: false,
    },
    {
      name: "Shipments",
      admin: true,
      manager: true,
      dispatcher: true,
      warehouse: true,
    },
    {
      name: "Vehicles",
      admin: true,
      manager: true,
      dispatcher: true,
      warehouse: false,
    },
    {
      name: "Drivers",
      admin: true,
      manager: true,
      dispatcher: true,
      warehouse: false,
    },
    {
      name: "Warehouses",
      admin: true,
      manager: false,
      dispatcher: false,
      warehouse: true,
    },
    {
      name: "Trips",
      admin: true,
      manager: true,
      dispatcher: true,
      warehouse: false,
    },
    {
      name: "Deliveries",
      admin: true,
      manager: true,
      dispatcher: true,
      warehouse: true,
    },
    {
      name: "POD",
      admin: true,
      manager: false,
      dispatcher: false,
      warehouse: false,
    },
    {
      name: "Invoices",
      admin: true,
      manager: false,
      dispatcher: false,
      warehouse: false,
    },
    {
      name: "Reports",
      admin: true,
      manager: true,
      dispatcher: false,
      warehouse: false,
    },
    {
      name: "Notifications",
      admin: true,
      manager: true,
      dispatcher: true,
      warehouse: true,
    },
    {
      name: "Settings",
      admin: true,
      manager: "Profile",
      dispatcher: "Profile",
      warehouse: "Profile",
    },
  ];

  const renderCell = (val) => {
    if (val === true) {
      return (
        <span className="inline-flex items-center justify-center text-emerald-600 font-bold text-base">
          ✓
        </span>
      );
    }
    if (val === false) {
      return <span className="text-slate-400 font-medium">—</span>;
    }
    return (
      <span className="inline-block px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
        {val}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Role Structure Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {rolesList.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-blue-500 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center font-bold shadow-xs">
                  {r.icon}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${r.bgBadge}`}
                >
                  Active Role
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-2">
                {r.title}
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {r.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Role-Based Sidebar Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600" />
              Role-Based Sidebar Access Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              System access privileges and navigation visibility matrix across
              all application roles.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-5">Sidebar Module</th>
                <th className="py-3 px-5 text-center">Admin</th>
                <th className="py-3 px-5 text-center">Logistics Manager</th>
                <th className="py-3 px-5 text-center">Dispatcher</th>
                <th className="py-3 px-5 text-center">Warehouse Manager</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800 font-medium">
              {sidebarMatrix.map((row) => (
                <tr key={row.name} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-5 font-semibold text-slate-900">
                    {row.name}
                  </td>
                  <td className="py-3 px-5 text-center">
                    {renderCell(row.admin)}
                  </td>
                  <td className="py-3 px-5 text-center">
                    {renderCell(row.manager)}
                  </td>
                  <td className="py-3 px-5 text-center">
                    {renderCell(row.dispatcher)}
                  </td>
                  <td className="py-3 px-5 text-center">
                    {renderCell(row.warehouse)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Helper to format Resource Details / Ref cleanly without ObjectIds ─────
const formatResourceDetails = (log) => {
  if (!log) return { primary: "—", secondary: null, fullText: "—" };

  const resource = String(log.resource || "").trim();
  const resLower = resource.toLowerCase();
  const actionUpper = String(log.action || "").toUpperCase();
  const rawName = String(log.resourceName || "").trim();
  const rawId = String(log.resourceId || "").trim();
  const isObjectId = (val) =>
    /^[0-9a-fA-F]{24}$/.test(String(val || "").trim());

  const getShortHex = (val) => {
    const s = String(val || "").trim();
    return isObjectId(s) ? s.slice(-6).toUpperCase() : s;
  };

  // 1. Customer: always display CUST Id (e.g. CUST-817633)
  if (resLower === "customer" || actionUpper.includes("CUSTOMER")) {
    const custIdMatch = (rawId + " " + rawName).match(/CUST-[A-Za-z0-9]+/i);
    let resolvedCustId = "";
    if (custIdMatch) {
      resolvedCustId = custIdMatch[0].toUpperCase();
    } else if (rawId && !isObjectId(rawId)) {
      resolvedCustId = rawId.startsWith("CUST-") ? rawId : `CUST-${rawId}`;
    } else {
      const fallbackHex = getShortHex(rawId || rawName);
      resolvedCustId = fallbackHex ? `CUST-${fallbackHex}` : "CUST-Ref";
    }

    let custName = "";
    if (rawName && !isObjectId(rawName) && rawName !== resolvedCustId) {
      const cleaned = rawName
        .replace(new RegExp(resolvedCustId, "gi"), "")
        .replace(/[()]/g, "")
        .trim();
      if (cleaned) custName = cleaned;
    }

    return {
      primary: resolvedCustId,
      secondary: custName || null,
      fullText: custName ? `${resolvedCustId} (${custName})` : resolvedCustId,
    };
  }

  // 2. Shipment: always clean Shipment ID (e.g. SHP-xxxx)
  if (resLower === "shipment" || actionUpper.includes("SHIPMENT")) {
    let shpRef = rawName;
    if (!shpRef || isObjectId(shpRef)) {
      if (rawId && !isObjectId(rawId)) {
        shpRef = rawId;
      } else {
        const short = getShortHex(rawId || rawName);
        shpRef = short ? `SHP-${short}` : "Shipment";
      }
    }

    let sub = null;
    if (
      rawId &&
      rawId !== shpRef &&
      !isObjectId(rawId) &&
      !shpRef.includes(rawId)
    ) {
      sub = `ID: ${rawId}`;
    }

    return {
      primary: shpRef,
      secondary: sub,
      fullText: sub ? `${shpRef} (${sub})` : shpRef,
    };
  }

  // 3. User: display clean user name/role without ID: ${rawId} or predefined data
  if (
    resLower === "user" ||
    actionUpper.includes("USER") ||
    actionUpper.includes("ADMIN")
  ) {
    let userName = rawName;
    if (
      !userName ||
      isObjectId(userName) ||
      userName.startsWith("User #") ||
      userName.startsWith("USR-")
    ) {
      userName =
        !isObjectId(rawId) && rawId && !rawId.startsWith("USR-")
          ? rawId
          : actionUpper.includes("ADMIN")
            ? "Admin User"
            : "User";
    }
    return {
      primary: userName,
      secondary: null,
      fullText: userName,
    };
  }

  // 4. Other Resources: never display raw 24-character ObjectIds
  let primary = rawName;
  if (!primary || isObjectId(primary)) {
    if (rawId && !isObjectId(rawId)) {
      primary = rawId;
    } else {
      const short = getShortHex(rawId || rawName);
      if (resLower === "driver") primary = `Driver #${short}`;
      else if (resLower === "vehicle" || resLower === "vechile")
        primary = `Vehicle #${short}`;
      else if (resLower === "warehouse") primary = `Warehouse #${short}`;
      else if (resLower === "trip") primary = `TRIP-${short}`;
      else if (resLower === "delivery") primary = `DEL-${short}`;
      else if (resLower === "pod") primary = `POD #${short}`;
      else if (resLower === "invoice") primary = `INV-${short}`;
      else primary = `${resource || "Resource"} #${short}`;
    }
  }

  let secondary = null;
  if (
    rawId &&
    rawId !== primary &&
    !isObjectId(rawId) &&
    !primary.startsWith(rawId) &&
    !primary.includes(rawId)
  ) {
    secondary = `ID: ${rawId}`;
  }

  return {
    primary: primary || "—",
    secondary,
    fullText: secondary ? `${primary} (${secondary})` : primary || "—",
  };
};

// ── Audit Logs Tab ─────────────────────────────────────────────────────────
function AuditLogsTabSection({ onShowToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [resourceFilter, setResourceFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/audit-logs`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to load audit logs");
      }
    } catch (err) {
      console.error("Fetch audit logs error:", err);
      setError("Network error connecting to backend API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const actionOptions = useMemo(() => {
    const set = new Set();
    logs.forEach((l) => {
      if (l.action) set.add(l.action);
    });
    return Array.from(set).sort();
  }, [logs]);

  const resourceOptions = useMemo(() => {
    const set = new Set();
    logs.forEach((l) => {
      if (l.resource) set.add(l.resource);
    });
    return Array.from(set).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== "All" && log.action !== actionFilter) return false;
      if (resourceFilter !== "All" && log.resource !== resourceFilter)
        return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const act = (log.action || "").toLowerCase();
        const resName = (log.resource || "").toLowerCase();
        const resId = (log.resourceId || "").toLowerCase();
        const userName = (log.user?.name || "").toLowerCase();
        const userEmail = (log.user?.email || "").toLowerCase();
        const details = formatResourceDetails(log);
        const detailText = details.fullText.toLowerCase();

        return (
          act.includes(q) ||
          resName.includes(q) ||
          resId.includes(q) ||
          detailText.includes(q) ||
          userName.includes(q) ||
          userEmail.includes(q)
        );
      }
      return true;
    });
  }, [logs, actionFilter, resourceFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredLogs.length);
  const displayedLogs = useMemo(() => {
    return filteredLogs.slice(startIndex, endIndex);
  }, [filteredLogs, startIndex, endIndex]);

  const handleExportCSV = () => {
    const headers = [
      "Timestamp",
      "User Name",
      "User Email",
      "Role",
      "Action",
      "Resource",
      "Resource ID",
    ];

    const rows = filteredLogs.map((l) => {
      const dateStr = l.timestamp
        ? new Date(l.timestamp).toLocaleString("en-IN")
        : "";
      const details = formatResourceDetails(l);
      const userEmail =
        l.user?.email &&
        !l.user.email.includes("system@") &&
        !l.user.email.includes("routeflow.io")
          ? l.user.email
          : "";
      return [
        `"${dateStr}"`,
        `"${l.user?.name || "System"}"`,
        `"${userEmail}"`,
        `"${l.user?.role || "System"}"`,
        `"${l.action || ""}"`,
        `"${l.resource || ""}"`,
        `"${details.primary || ""}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `system_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onShowToast)
      onShowToast(`Exported ${filteredLogs.length} audit records to CSV`);
  };

  const getActionBadgeColor = (action = "") => {
    const act = action.toUpperCase();
    if (
      act.includes("CREATE") ||
      act.includes("INBOUND") ||
      act.includes("COMPLETED")
    ) {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
    if (
      act.includes("UPDATE") ||
      act.includes("ASSIGN") ||
      act.includes("OUTBOUND")
    ) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    if (
      act.includes("DELETE") ||
      act.includes("CANCEL") ||
      act.includes("FAILED")
    ) {
      return "bg-rose-100 text-rose-800 border-rose-200";
    }
    return "bg-amber-100 text-amber-800 border-amber-200";
  };

  return (
    <div className="space-y-6">
      {/* Overview KPI Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Logged Events
            </span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {logs.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Recorded audit entries</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Resource Modules
            </span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {resourceOptions.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Monitored system areas</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Action Types
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {actionOptions.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Distinct operation triggers
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto flex-1">
          <div className="relative flex-1 lg:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, action, resource ID..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-2.5 sm:px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-auto"
            >
              <option value="All">Action: All ({logs.length})</option>
              {actionOptions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>

            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="px-2.5 sm:px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-auto"
            >
              <option value="All">Resource: All</option>
              {resourceOptions.map((res) => (
                <option key={res} value={res}>
                  {res}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto justify-end pt-1 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <button
            type="button"
            onClick={fetchAuditLogs}
            className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading system audit logs from backend...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 bg-rose-50 border border-rose-200 m-4 rounded-xl">
            <strong>Error:</strong> {error} —{" "}
            <button
              onClick={fetchAuditLogs}
              className="underline font-semibold hover:text-rose-800"
            >
              Retry
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No audit logs found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Timestamp</th>
                  <th className="py-3 px-5">Performed By</th>
                  <th className="py-3 px-5">Action</th>
                  <th className="py-3 px-5">Target Resource</th>
                  <th className="py-3 px-5 text-right">
                    Resource Details / Ref
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displayedLogs.map((log) => {
                  const dateStr = log.timestamp
                    ? new Date(log.timestamp).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    : "—";

                  const initial = (log.user?.name || "S")
                    .charAt(0)
                    .toUpperCase();

                  return (
                    <tr
                      key={log._id}
                      className="hover:bg-slate-50/80 transition"
                    >
                      <td className="py-3.5 px-5 font-mono text-slate-600">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                            {initial}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {log.user?.name || "System"}
                            </div>
                            {log.user?.email &&
                              !log.user.email.includes("system@") &&
                              !log.user.email.includes("routeflow.io") && (
                                <div className="text-[10.5px] text-slate-500">
                                  {log.user.email}
                                </div>
                              )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-block px-2.5 py-1 border rounded-md text-[11px] font-mono font-bold ${getActionBadgeColor(
                            log.action,
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-800">
                        {log.resource}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {(() => {
                          const details = formatResourceDetails(log);
                          return (
                            <>
                              <div className="font-semibold text-slate-900">
                                {details.primary}
                              </div>
                              {details.secondary && (
                                <div className="text-[10.5px] font-mono text-slate-500 mt-0.5">
                                  {details.secondary}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Pagination */}
        {!loading && !error && filteredLogs.length > 0 && (
          <div className="px-4 sm:px-5 py-3.5 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="text-center sm:text-left">
              Showing <strong>{startIndex + 1}</strong> to{" "}
              <strong>{endIndex}</strong> of{" "}
              <strong>{filteredLogs.length}</strong> entries
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
              >
                Previous
              </button>
              <span className="font-semibold px-1">
                Page {safeCurrentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={safeCurrentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main DashboardSetting Component ─────────────────────────────────────────
export default function DashboardSetting() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Logistics Manager",
    hub: "Pune Main Logistics Hub (MH-12)",
    status: "active",
  });
  const [addingUser, setAddingUser] = useState(false);

  // Fetch Users from Backend
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users)) {
          setUsers(data.users);
        }
      }
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleShowToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  // Delete User from Backend
  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => (u._id || u.id) !== id));
        handleShowToast("User deleted successfully!");
      } else {
        const data = await res.json();
        handleShowToast(data.message || "Failed to delete user.");
      }
    } catch (err) {
      console.error("Delete user error:", err);
      handleShowToast("Error deleting user.");
    }
  };

  // Toggle User Status in Backend
  const handleToggleUserStatus = async (id, currentStatus) => {
    const newStatus =
      (currentStatus || "active").toLowerCase() === "active"
        ? "inactive"
        : "active";
    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            (u._id || u.id) === id ? { ...u, status: newStatus } : u,
          ),
        );
        handleShowToast(`User status updated to ${newStatus}!`);
      } else {
        const data = await res.json();
        handleShowToast(data.message || "Failed to update user status.");
      }
    } catch (err) {
      console.error("Toggle user status error:", err);
      handleShowToast("Error updating status.");
    }
  };

  // Create User in Backend
  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email || !newUserForm.password) {
      handleShowToast("Name, Email, and Password are required!");
      return;
    }

    setAddingUser(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newUserForm),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        setUsers((prev) => [data.user, ...prev]);
        setIsModalOpen(false);
        setNewUserForm({
          name: "",
          email: "",
          password: "",
          role: "Logistics Manager",
          hub: "Pune Main Logistics Hub (MH-12)",
          status: "active",
        });
        handleShowToast("New user added successfully!");
      } else {
        handleShowToast(data.message || "Failed to create user.");
      }
    } catch (err) {
      console.error("Create user error:", err);
      handleShowToast("Error creating user. Check server logs.");
    } finally {
      setAddingUser(false);
    }
  };

  const loggedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = (loggedUser.role || "Admin").trim();
  const isAdmin =
    userRole.toLowerCase() === "admin" || userRole === "Super Admin";

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage("")}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
              {isAdmin
                ? "System Configuration"
                : "User Profile & Account Settings"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-2 sm:line-clamp-none">
              {isAdmin
                ? "Manage profile parameters, team member permissions, role matrix, and automated notifications."
                : "Manage your personal profile parameters and warehouse location preferences."}
            </p>
          </div>
        </div>

        {/* Module Navigation Tabs (Admin Only) */}
        {isAdmin && (
          <div className="w-full overflow-x-auto no-scrollbar border-b border-slate-200/80 pb-2 -mx-1 px-1">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition shrink-0 cursor-pointer ${
                  activeTab === "profile"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Profile</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("company")}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition shrink-0 cursor-pointer ${
                  activeTab === "company"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Company Info</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition shrink-0 cursor-pointer ${
                  activeTab === "users"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Users</span>
                  <span
                    className={`ml-1 text-[11px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-semibold transition ${
                      activeTab === "users"
                        ? "bg-blue-700 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {users.length}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("roles")}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition shrink-0 cursor-pointer ${
                  activeTab === "roles"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Roles</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("audit")}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition shrink-0 cursor-pointer ${
                  activeTab === "audit"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Audit Logs</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Active Tab View */}
        {(!isAdmin || activeTab === "profile") && (
          <ProfileTabSection onShowToast={handleShowToast} />
        )}

        {isAdmin && activeTab === "company" && (
          <CompanyInfoTabSection onShowToast={handleShowToast} />
        )}

        {isAdmin && activeTab === "users" && (
          <UsersTabSection
            users={users}
            loading={loadingUsers}
            onDeleteUser={handleDeleteUser}
            onToggleStatus={handleToggleUserStatus}
            onOpenAddUser={() => navigate("/register-user")}
          />
        )}

        {isAdmin && activeTab === "roles" && <RolesTabSection />}

        {isAdmin && activeTab === "audit" && (
          <AuditLogsTabSection onShowToast={handleShowToast} />
        )}
      </main>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-4 sm:p-6 space-y-4 sm:space-y-5 animate-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 shrink-0" />
                <span>Add New System User</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateUserSubmit}
              className="space-y-3.5 sm:space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, name: e.target.value })
                  }
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, email: e.target.value })
                  }
                  placeholder="e.g. rajesh@routeflow.io"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={newUserForm.password}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, password: e.target.value })
                  }
                  placeholder="Create password"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Role
                  </label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, role: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Logistics Manager">Logistics Manager</option>
                    <option value="Dispatcher">Dispatcher</option>
                    <option value="Warehouse Manager">Warehouse Manager</option>
                    <option value="Driver">Driver</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Assigned Hub
                  </label>
                  <input
                    type="text"
                    value={newUserForm.hub}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, hub: e.target.value })
                    }
                    placeholder="e.g. Pune Hub"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>
              </div>

              <div className="pt-2 sm:pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingUser}
                  className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  {addingUser ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Add User</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
