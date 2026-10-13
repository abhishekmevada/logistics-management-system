import React, { useState } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import PasswordInput from "../../components/PasswordInput";

export default function ResetPassword() {
  const location = useLocation();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Protect route: redirect to /forgot-password if not verified via OTP
  if (!location.state?.verified) {
    return <Navigate to="/forgot-password" replace />;
  }

  const { resetToken } = location.state;

  // Dynamic password criteria validation checks
  const criteria = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for active field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const validationErrors = {};

    // New password validation
    if (!formData.password) {
      validationErrors.password = "New password is required";
    } else {
      if (!criteria.length) {
        validationErrors.password =
          "Password must contain at least 8 characters";
      } else if (!criteria.uppercase) {
        validationErrors.password =
          "Password must include at least one uppercase letter";
      } else if (!criteria.lowercase) {
        validationErrors.password =
          "Password must include at least one lowercase letter";
      } else if (!criteria.number) {
        validationErrors.password = "Password must include at least one number";
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      validationErrors.confirmPassword = "Confirm password is required";
    } else if (formData.password !== formData.confirmPassword) {
      validationErrors.confirmPassword = "Passwords do not match";
    }

    return validationErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("http://localhost:5000/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetToken,
          newPassword: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ form: data.message });
        return;
      }

      setIsSuccess(true);
      setFormData({ password: "", confirmPassword: "" });
      setErrors({});
    } catch (err) {
      setErrors({ form: "Failed to reset password. Please try again." });
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
      {/* Main Authentication Card */}
      <div className="w-full max-w-115 bg-white rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.06)] p-8 md:p-10 text-center border border-slate-100">
        {!isSuccess ? (
          <>
            {/* Heading & Subtitle */}
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">
              Create New Password
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mb-6 font-normal leading-relaxed">
              Your new password must be different from your previous password.
            </p>

            {/* Reset Password Form */}
            <form
              className="flex flex-col gap-4 text-left"
              onSubmit={handleSubmit}
              noValidate
            >
              {/* Form level error */}
              {errors.form && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium">
                  {errors.form}
                </div>
              )}

              {/* New Password */}
              <PasswordInput
                label="New Password"
                id="reset-password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter new password"
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

              {/* Password Dynamic Requirements Checklist */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-600">
                <p className="font-semibold text-slate-700 mb-2">
                  Password must contain:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {/* 8 characters */}
                  <div
                    className={`flex items-center gap-1.5 transition-colors duration-200 ${criteria.length ? "text-[#338cff] font-semibold" : "text-slate-500"}`}
                  >
                    {criteria.length ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 text-[#338cff]"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center shrink-0"></div>
                    )}
                    <span>At least 8 characters</span>
                  </div>

                  {/* One uppercase letter */}
                  <div
                    className={`flex items-center gap-1.5 transition-colors duration-200 ${criteria.uppercase ? "text-[#338cff] font-semibold" : "text-slate-500"}`}
                  >
                    {criteria.uppercase ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 text-[#338cff]"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center shrink-0"></div>
                    )}
                    <span>One uppercase letter</span>
                  </div>

                  {/* One lowercase letter */}
                  <div
                    className={`flex items-center gap-1.5 transition-colors duration-200 ${criteria.lowercase ? "text-[#338cff] font-semibold" : "text-slate-500"}`}
                  >
                    {criteria.lowercase ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 text-[#338cff]"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center shrink-0"></div>
                    )}
                    <span>One lowercase letter</span>
                  </div>

                  {/* One number */}
                  <div
                    className={`flex items-center gap-1.5 transition-colors duration-200 ${criteria.number ? "text-[#338cff] font-semibold" : "text-slate-500"}`}
                  >
                    {criteria.number ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 text-[#338cff]"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center shrink-0"></div>
                    )}
                    <span>One number</span>
                  </div>
                </div>
              </div>

              {/* Confirm New Password */}
              <PasswordInput
                label="Confirm New Password"
                id="reset-confirm-password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your new password"
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

              {/* Reset Password Button */}
              <button
                type="submit"
                id="reset-password-submit-btn"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-6 rounded-full bg-[#338cff] hover:bg-[#2678e8] text-white font-bold text-xs tracking-widest uppercase transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_15px_rgba(51,140,255,0.35)] hover:shadow-[0_6px_20px_rgba(51,140,255,0.45)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>RESETTING PASSWORD...</span>
                  </>
                ) : (
                  "RESET PASSWORD"
                )}
              </button>
            </form>

            {/* Back to Login Link */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <Link
                to="/login"
                id="back-to-login-link"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#338cff] transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                <span>Back to Login</span>
              </Link>
            </div>
          </>
        ) : (
          /* Success State */
          <div className="py-4 flex flex-col items-center animate-fade-in">
            <div className="w-16 h-16 bg-blue-50 text-[#338cff] rounded-full flex items-center justify-center mb-4 border border-blue-200 shadow-sm">
              <svg
                width="32"
                height="32"
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
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">
              Password Reset Successfully
            </h2>
            <p className="text-xs md:text-sm text-slate-500 max-w-75 mb-6 font-normal">
              Your password has been updated successfully. You can now use your
              new password to sign in.
            </p>

            <Link
              to="/login"
              id="success-back-to-login-btn"
              className="w-full py-3 px-6 rounded-full bg-[#338cff] hover:bg-[#2678e8] text-white font-bold text-xs tracking-widest uppercase transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_15px_rgba(51,140,255,0.35)] hover:shadow-[0_6px_20px_rgba(51,140,255,0.45)] flex items-center justify-center gap-2"
            >
              BACK TO LOGIN
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
