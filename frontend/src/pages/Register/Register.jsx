import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InputField from "../../components/InputField";
import PasswordInput from "../../components/PasswordInput";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phonenumber: "",
    address: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const validationErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;

    if (!formData.name.trim()) {
      validationErrors.name = "Full Name is required";
    } else if (formData.name.trim().length < 2) {
      validationErrors.name = "Full Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      validationErrors.email = "Email address is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      validationErrors.email = "Please enter a valid email address";
    }

    if (!formData.phonenumber.trim()) {
      validationErrors.phonenumber = "Mobile number is required";
    } else if (
      !phoneRegex.test(formData.phonenumber.replace(/\s+/g, "")) ||
      formData.phonenumber.replace(/\D/g, "").length < 10
    ) {
      validationErrors.phonenumber =
        "Please enter a valid 10-digit mobile number";
    }

    if (!formData.password) {
      validationErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      validationErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      validationErrors.confirmPassword = "Confirm Password is required";
    } else if (formData.password !== formData.confirmPassword) {
      validationErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.agreeTerms) {
      validationErrors.agreeTerms = "You must accept the Terms & Conditions";
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
      const res = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        // Show error message without clearing form or navigating
        setStatusMessage({
          type: "error",
          text: data.message || "Registration failed. Please try again.",
        });
        return;
      }

      // Success — clear form and show success message
      setStatusMessage({
        type: "success",
        text: "Account created successfully! Redirecting to login...",
      });

      setFormData({
        fullName: "",
        email: "",
        phonenumber: "",
        address: "",
        password: "",
        confirmPassword: "",
        agreeTerms: false,
      });

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      // Network/unexpected error — show message, don't reload
      setStatusMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{
        backgroundColor: "var(--bg, #f4f3ee)",
        fontFamily: "var(--primary-text)",
      }}
    >
      {/* Main Split Card Container */}
      <div className="w-full max-w-240 min-h-150 bg-white rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden flex flex-col md:flex-row">
        {/* Left Hero Panel (Blue Banner) */}
        <div className="w-full md:w-[38%] bg-linear-to-br from-[#338cff] to-[#5ca7ff] text-white p-8 md:p-10 flex flex-col justify-between items-center text-center relative overflow-hidden">
          {/* Subtle Geometric Overlay Elements */}
          <div className="absolute top-12 -right-8 w-24 h-24 bg-white/10 rotate-45 rounded-xl pointer-events-none"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none"></div>
          <div className="absolute top-1/2 right-4 w-10 h-10 bg-white/10 rotate-12 rounded-lg pointer-events-none"></div>

          {/* Top Spacing Placeholder */}
          <div className="w-full h-4"></div>

          {/* Hero Content */}
          <div className="my-auto py-8 z-10 flex flex-col items-center">
            <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">
              Welcome Back!
            </h2>
            <p className="text-xs md:text-sm font-light text-white/90 leading-relaxed max-w-60 mb-8">
              To keep connected with us please login with your personal info
            </p>
            <Link
              to="/login"
              id="switch-to-login-btn"
              className="px-10 py-3 rounded-full border-2 border-white text-white font-bold text-xs tracking-wider uppercase hover:bg-white hover:text-[#338cff] transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-sm inline-block"
            >
              SIGN IN
            </Link>
          </div>

          {/* Footer note */}
          <div className="text-[11px] text-white/70 z-10">
            Logistics Management System &copy; 2026
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="w-full md:w-[62%] bg-white p-6 md:p-10 flex flex-col justify-center items-center text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#338cff] mb-2 tracking-tight">
            Create Account
          </h1>

          <p className="text-xs text-slate-400 mb-6 font-normal">
            Enter your personal details to register for a new account
          </p>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`w-full max-w-90 mb-3 p-3 rounded-lg text-xs font-medium flex items-center gap-2 text-left ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {statusMessage.type === "success" ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Register Form */}
          <form
            className="w-full max-w-90 flex flex-col gap-3"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* Full Name */}
            <InputField
              id="register-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Name"
              error={errors.name}
              required
              autoComplete="name"
              disabled={isSubmitting}
              icon={
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
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              }
            />

            {/* Email Address */}
            <InputField
              id="register-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email"
              error={errors.email}
              required
              autoComplete="email"
              disabled={isSubmitting}
              icon={
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
              }
            />

            {/* Mobile Number */}
            <InputField
              id="register-mobile"
              name="phonenumber"
              type="tel"
              value={formData.phonenumber}
              onChange={(e) => {
                const digitsOnly = e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 10);
                handleInputChange({
                  target: {
                    name: "phonenumber",
                    value: digitsOnly,
                    type: "tel",
                  },
                });
              }}
              placeholder="Mobile Number (10 digits)"
              error={errors.phonenumber}
              required
              autoComplete="tel"
              disabled={isSubmitting}
              maxLength={10}
              inputMode="numeric"
              icon={
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
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 1 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              }
            />

            {/* Address */}
            <div className="w-full text-left">
              <div className="relative">
                <span className="absolute top-3 left-3 text-slate-400 pointer-events-none">
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
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <textarea
                  id="register-address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Address"
                  disabled={isSubmitting}
                  rows={3}
                  className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#338cff]/40 focus:border-[#338cff] transition-all duration-200 resize-none ${
                    errors.address
                      ? "border-red-400 bg-red-50 focus:ring-red-300 focus:border-red-400"
                      : "border-slate-200"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                />
              </div>
              {errors.address && (
                <p className="mt-1 text-[11px] text-red-500 font-medium">
                  {errors.address}
                </p>
              )}
            </div>

            {/* Password */}
            <PasswordInput
              id="register-password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
              error={errors.password}
              required
              autoComplete="new-password"
              disabled={isSubmitting}
              icon={
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
              }
            />

            {/* Confirm Password */}
            <PasswordInput
              id="register-confirm-password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm Password"
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
              disabled={isSubmitting}
              icon={
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
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              }
            />

            {/* Terms & Conditions Checkbox */}
            <div className="text-left mt-1">
              <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer select-none leading-tight">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className={`mt-0.5 rounded border-slate-300 text-[#338cff] focus:ring-[#338cff] accent-[#338cff] ${
                    errors.agreeTerms ? "outline-2 outline-red-500" : ""
                  }`}
                />
                <span>
                  I agree to the{" "}
                  <a
                    href="#terms"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(
                        "Terms & Conditions: By registering, you agree to logistics system policies.",
                      );
                    }}
                    className="text-[#338cff] font-semibold hover:underline"
                  >
                    Terms & Conditions
                  </a>
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="mt-1 text-[11px] text-red-500 font-medium">
                  {errors.agreeTerms}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="register-submit-btn"
              disabled={isSubmitting}
              className="mt-3 self-center px-12 py-3 rounded-full bg-[#338cff] hover:bg-[#2678e8] text-white font-bold text-xs tracking-widest uppercase transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_15px_rgba(51,140,255,0.35)] hover:shadow-[0_6px_20px_rgba(51,140,255,0.45)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>CREATING...</span>
                </>
              ) : (
                "SIGN UP"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
