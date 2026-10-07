import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Shield,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const RegisterUser = () => {
  const navigate = useNavigate();
  const { addUser } = useApp();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field-specific error upon edit
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) {
      setServerError("");
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address.";
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    }

    if (!formData.role) {
      newErrors.role = "Please select a role.";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setServerError("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const userToCreate = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role: formData.role.trim(),
    };

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userToCreate),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.message || "Failed to register user.");
        return;
      }
      addUser(userToCreate);
      setSuccessMessage("User created successfully.");

      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "",
      });
      setErrors({});
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please check your network.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/setting");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-4 sm:py-8 md:py-12 px-3 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-xl sm:max-w-2xl">
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-gray-100 bg-linear-to-r from-gray-50 via-white to-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="p-1.5 -ml-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition sm:hidden"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-base sm:text-xl font-bold text-gray-900 tracking-tight">
                  Create User
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Create a new user account
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 md:p-8">
            {successMessage && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl font-medium flex items-center gap-2.5 sm:gap-3">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                <span className="wrap-break-words">{successMessage}</span>
              </div>
            )}
            {serverError && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-xl font-medium flex items-center gap-2.5 sm:gap-3">
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0" />
                <span className="wrap-break-words">{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* 1. Name */}
              <div>
                <label
                  htmlFor="user-name"
                  className="block text-[11px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
                >
                  Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    id="user-name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter user's full name"
                    className={`w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-gray-50/80 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                      errors.name
                        ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20"
                        : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* 2. Email */}
              <div>
                <label
                  htmlFor="user-email"
                  className="block text-[11px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
                >
                  Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    id="user-email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter user's email address"
                    className={`w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-gray-50/80 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                      errors.email
                        ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20"
                        : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* 3. Password */}
              <div>
                <label
                  htmlFor="user-password"
                  className="block text-[11px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
                >
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="user-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    className={`w-full pl-9 sm:pl-10 pr-10 sm:pr-11 py-2 sm:py-2.5 bg-gray-50/80 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                      errors.password
                        ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20"
                        : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-lg transition"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              {/* 4. Role */}
              <div>
                <label
                  htmlFor="user-role"
                  className="block text-[11px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
                >
                  Role <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    name="role"
                    id="user-role"
                    value={formData.role}
                    onChange={handleChange}
                    className={`w-full pl-9 sm:pl-10 pr-10 py-2 sm:py-2.5 bg-gray-50/80 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${
                      errors.role
                        ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20"
                        : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"
                    } ${!formData.role ? "text-gray-400" : "text-gray-900"}`}
                  >
                    <option value="" disabled>
                      Select a role
                    </option>
                    <option value="Admin">Admin</option>
                    <option value="Logistics Manager">Logistics Manager</option>
                    <option value="Dispatcher">Dispatcher</option>
                    <option value="Warehouse Manager">Warehouse Manager</option>
                    <option value="Driver">Driver</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.role && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.role}</span>
                  </p>
                )}
              </div>

              {/* Action Buttons: Submit & Cancel */}
              <div className="pt-3 sm:pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 border-t border-gray-100">
                <button
                  type="button"
                  id="cancel-create-user-btn"
                  onClick={handleCancel}
                  className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 hover:bg-gray-100 active:bg-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-create-user-btn"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md sm:shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>
                    {isSubmitting ? "Creating User..." : "Create User"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default RegisterUser;
