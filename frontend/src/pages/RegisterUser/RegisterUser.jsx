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
    }
  };

  const handleCancel = () => {
    navigate("/dashboard");
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Create User
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Create a new user account
          </p>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl font-medium flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
          {serverError && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl font-medium flex items-center gap-3">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  name="name"
                  id="user-name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter user's full name"
                  className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.name
                      ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20"
                      : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"
                  }`}
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* 2. Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  name="email"
                  id="user-email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter user's email address"
                  className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20"
                      : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* 3. Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="user-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className={`w-full pl-10 pr-11 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.password
                      ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20"
                      : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                  <XCircle className="w-3.5 h-3.5" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* 4. Role */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Role <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Shield className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  name="role"
                  id="user-role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all appearance-none ${
                    errors.role
                      ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20"
                      : "border-gray-200 focus:ring-blue-500/20 focus:border-blue-500"
                  } ${!formData.role ? "text-gray-400" : "text-gray-900"}`}
                >
                  <option value="" disabled>
                    Select a role
                  </option>
                  {/* <option value="Customer">Customer</option> */}
                  <option value="Admin">Admin</option>
                  <option value="Logistics Manager">Logistics Manager</option>
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="Warehouse Manager">Warehouse Manager</option>
                  <option value="Driver">Driver</option>
                </select>
              </div>
              {errors.role && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  {errors.role}
                </p>
              )}
            </div>

            {/* Action Buttons: Submit & Cancel */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                id="cancel-create-user-btn"
                onClick={handleCancel}
                className="px-5 py-2.5 border border-gray-300 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-create-user-btn"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default RegisterUser;
