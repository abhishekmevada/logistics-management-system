import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InputField from "../../components/InputField";
import PasswordInput from "../../components/PasswordInput";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
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

    if (!formData.email.trim()) {
      validationErrors.email = "Email address is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      validationErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      validationErrors.password = "Password is required";
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
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors(data.message);
      }
      navigate("/dashboard");

      setFormData((prev) => ({ ...prev, password: "" }));
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: "Invalid email or password. Please try again.",
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
      <div className="w-full max-w-230 min-h-135 bg-white rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden flex flex-col md:flex-row">
        {/* Left Hero Panel (Blue Banner) */}
        <div className="w-full md:w-[40%] bg-linear-to-br from-[#338cff] to-[#5ca7ff] text-white p-8 md:p-10 flex flex-col justify-between items-center text-center relative overflow-hidden">
          {/* Subtle Geometric Overlay Elements */}
          <div className="absolute top-12 -right-8 w-24 h-24 bg-white/10 rotate-45 rounded-xl pointer-events-none"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none"></div>
          <div className="absolute top-1/2 right-4 w-10 h-10 bg-white/10 rotate-12 rounded-lg pointer-events-none"></div>

          {/* Top Spacing Placeholder */}
          <div className="w-full h-4"></div>

          {/* Hero Content */}
          <div className="my-auto py-8 z-10 flex flex-col items-center">
            <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">
              Hello, User!
            </h2>
            <p className="text-xs md:text-sm font-medium text-white/90 leading-relaxed max-w-60 mb-8">
              Enter your personal details and start your logistics journey with
              us
            </p>
            <Link
              to="/register"
              id="switch-to-register-btn"
              className="px-10 py-3 rounded-full border-2 border-white text-white font-bold text-xs tracking-wider uppercase hover:bg-white hover:text-[#338cff] transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-sm inline-block"
            >
              SIGN UP
            </Link>
          </div>

          {/* Footer note */}
          <div className="text-[11px] text-white/70 z-10">
            Logistics Management System &copy; 2026
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="w-full md:w-[60%] bg-white p-8 md:p-12 flex flex-col justify-center items-center text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#338cff] mb-2 tracking-tight">
            Sign In
          </h1>

          <p className="text-xs text-slate-400 mb-8 font-normal">
            Sign in to access your dashboard and logistics management tools
          </p>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`w-full max-w-85 mb-4 p-3 rounded-lg text-xs font-medium flex items-center gap-2 text-left ${
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

          {/* Form */}
          <form
            className="w-full max-w-85 flex flex-col gap-4"
            onSubmit={handleSubmit}
            noValidate
          >
            <InputField
              id="login-email"
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

            <PasswordInput
              id="login-password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
              error={errors.password}
              required
              autoComplete="current-password"
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs text-slate-600 mt-1">
              {/* <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="rounded border-slate-300 text-[#338cff] focus:ring-[#338cff] accent-[#338cff]"
                />
                <span>Remember me</span>
              </label> */}

              <Link
                to="/forgot-password"
                className="text-slate-500 hover:text-[#338cff] transition-colors"
              >
                Forgot your password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="login-submit-btn"
              disabled={isSubmitting}
              className="mt-4 self-center px-12 py-3 rounded-full bg-[#338cff] hover:bg-[#2678e8] text-white font-bold text-xs tracking-widest uppercase transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_15px_rgba(51,140,255,0.35)] hover:shadow-[0_6px_20px_rgba(51,140,255,0.45)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>SIGNING IN...</span>
                </>
              ) : (
                "SIGN IN"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
