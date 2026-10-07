import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/AdminRegistration.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function AdminRegistration() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    secretCode: "",
  });

  const [showSecretCode, setShowSecretCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const validationErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      validationErrors.email = "Email address is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      validationErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      validationErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      validationErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.secretCode.trim()) {
      validationErrors.secretCode = "Secret authorization code is required";
    }

    return validationErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(null);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/admin-signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          secretCode: formData.secretCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMessage({
          type: "error",
          text: data.message || "Admin registration failed. Please try again.",
        });
        return;
      }

      setStatusMessage({
        type: "success",
        text:
          data.message ||
          "Admin account created successfully! Redirecting to login...",
      });

      // Clear form
      setFormData({
        email: "",
        password: "",
        secretCode: "",
      });

      // Redirect to login after 1.8 seconds
      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (err) {
      console.error("Admin signup error:", err);
      setStatusMessage({
        type: "error",
        text: "Unable to connect to the server. Please check your backend.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6"
      style={{
        backgroundColor: "var(--bg, #f4f3ee)",
        fontFamily: "var(--primary-text)",
      }}
    >
      {/* Main Split Card Container */}
      <div className="w-full max-w-230 min-h-135 bg-white rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden flex flex-col md:flex-row">
        {/* Left Hero Panel (Navy / Blue Gradient for Admin) */}
        <div className="w-full md:w-[42%] bg-linear-to-br from-[#1e293b] via-[#0f172a] to-[#1e3a8a] text-white p-8 md:p-10 flex flex-col justify-between items-center text-center relative overflow-hidden">
          {/* Subtle Geometric Overlay Elements */}
          <div className="absolute top-12 -right-8 w-28 h-28 bg-white/5 rotate-45 rounded-2xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-blue-500/10 rounded-full pointer-events-none"></div>
          <div className="absolute top-1/2 right-4 w-12 h-12 bg-white/5 rotate-12 rounded-xl pointer-events-none"></div>

          {/* Top Brand / Shield Badge */}
          <div className="w-full flex items-center justify-center gap-2 pt-2 z-10">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            </div>
            <span className="text-sm font-bold tracking-wider uppercase text-blue-200">
              Admin Portal
            </span>
          </div>

          {/* Hero Content */}
          <div className="my-auto py-8 z-10 flex flex-col items-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3 tracking-tight">
              Administrative Access
            </h2>
            <p className="text-xs md:text-sm font-normal text-slate-300 leading-relaxed max-w-64 mb-6">
              Create a privileged System Administrator account. A valid system
              secret authorization code is required.
            </p>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/10 text-[11px] text-blue-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Elevated Privileges Granted</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-[11px] text-slate-400 z-10">
            Logistics Management System &copy; 2026
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="w-full md:w-[58%] bg-white p-8 md:p-12 flex flex-col justify-center items-center text-center">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Admin Registration
          </h1>

          <p className="text-xs text-slate-500 mb-6 font-normal max-w-sm">
            Please enter your administrator email, password, and the system
            secret authorization code.
          </p>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`w-full max-w-85 mb-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2.5 text-left transition-all ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {statusMessage.type === "success" ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-emerald-600"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-red-600"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Form */}
          <form
            className="w-full max-w-85 flex flex-col gap-4"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* Email Field */}
            <div className="w-full text-left">
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center w-full">
                <div className="absolute left-3.5 flex items-center justify-center text-slate-400 pointer-events-none z-10">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                  className={`w-full py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 bg-[#f4f7fb] rounded-lg border transition-all duration-200 outline-none ${
                    errors.email
                      ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-transparent focus:border-[#338cff] focus:bg-white focus:ring-2 focus:ring-[#338cff]/20"
                  } ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium pl-1">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="w-full text-left">
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center w-full">
                <div className="absolute left-3.5 flex items-center justify-center text-slate-400 pointer-events-none z-10">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="11"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  className={`w-full py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 bg-[#f4f7fb] rounded-lg border transition-all duration-200 outline-none ${
                    errors.password
                      ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-transparent focus:border-[#338cff] focus:bg-white focus:ring-2 focus:ring-[#338cff]/20"
                  } ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500 font-medium pl-1">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Secret Code Field */}
            <div className="w-full text-left">
              <label
                htmlFor="admin-secret-code"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Secret Authorization Code{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center w-full">
                <div className="absolute left-3.5 flex items-center justify-center text-slate-400 pointer-events-none z-10">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 2l-2 2m-1.5 6.1L16 11.5l-1.5-1.5 1.4-1.4L13 5.7a4.95 4.95 0 0 0-7 7L18.3 25l2.7-2.7z"></path>
                    <circle cx="7.5" cy="7.5" r="2.5"></circle>
                  </svg>
                </div>
                <input
                  id="admin-secret-code"
                  name="secretCode"
                  type={showSecretCode ? "text" : "password"}
                  value={formData.secretCode}
                  onChange={handleInputChange}
                  placeholder="Enter system secret code"
                  autoComplete="off"
                  disabled={isSubmitting}
                  className={`w-full py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 bg-[#f4f7fb] rounded-lg border transition-all duration-200 outline-none font-mono ${
                    errors.secretCode
                      ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-transparent focus:border-[#338cff] focus:bg-white focus:ring-2 focus:ring-[#338cff]/20"
                  } ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowSecretCode((prev) => !prev)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  aria-label={
                    showSecretCode ? "Hide secret code" : "Show secret code"
                  }
                >
                  {showSecretCode ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {errors.secretCode && (
                <p className="mt-1 text-xs text-red-500 font-medium pl-1">
                  {errors.secretCode}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-3 self-center w-full px-8 py-3 rounded-full bg-[#1e293b] hover:bg-[#0f172a] text-white font-bold text-xs tracking-widest uppercase transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_15px_rgba(15,23,42,0.35)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.45)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>CREATING ADMIN...</span>
                </>
              ) : (
                "REGISTER AS ADMIN"
              )}
            </button>

            {/* Link to Login */}
            <div className="text-center text-xs text-slate-600 mt-2">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[#338cff] hover:text-[#1e6fdb] font-semibold underline underline-offset-2"
              >
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
