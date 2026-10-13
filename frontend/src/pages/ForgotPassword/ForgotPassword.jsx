import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InputField from "../../components/InputField";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    if (error) {
      setError("");
    }
  };

  const validate = () => {
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      setError("Email address is required");
      return false;
    }
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("http://localhost:5000/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        return;
      }
      navigate("/verify-otp", {
        state: { email: email.trim() },
      });
    } catch (err) {
      setError("Failed to send verification code. Please try again.");
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
        {/* Heading & Subtitle */}
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">
          Forgot Password?
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mb-6 font-normal leading-relaxed">
          Enter your registered email address and we'll send you a verification
          code.
        </p>

        {/* Form */}
        <form
          className="flex flex-col gap-4 text-left"
          onSubmit={handleSubmit}
          noValidate
        >
          <InputField
            label="Email Address"
            id="forgot-password-email"
            name="email"
            type="email"
            value={email}
            onChange={handleInputChange}
            placeholder="Enter your registered email"
            error={error}
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
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              </svg>
            }
          />

          {/* Send OTP Button */}
          <button
            type="submit"
            id="send-otp-submit-btn"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-6 rounded-full bg-[#338cff] hover:bg-[#2678e8] text-white font-bold text-xs tracking-widest uppercase transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_15px_rgba(51,140,255,0.35)] hover:shadow-[0_6px_20px_rgba(51,140,255,0.45)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>SENDING OTP...</span>
              </>
            ) : (
              "SEND OTP"
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
      </div>
    </div>
  );
}
