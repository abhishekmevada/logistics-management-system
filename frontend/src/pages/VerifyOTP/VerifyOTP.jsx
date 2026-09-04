import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || 'your email address';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timer, setTimer] = useState(30);
  const [resendSuccess, setResendSuccess] = useState(false);

  const inputRefs = useRef([]);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (value, index) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    // Take the last character if multiple characters are entered
    newOtp[index] = value ? value.slice(-1) : '';
    setOtp(newOtp);

    if (error) {
      setError('');
    }

    // Auto-advance focus to next input if digit entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move to previous input on backspace if current is empty
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    // Extract only digits
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);

    if (digits.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || '';
      }
      setOtp(newOtp);
      if (error) setError('');

      // Focus the appropriate input box
      const targetIndex = Math.min(digits.length, 5);
      inputRefs.current[targetIndex]?.focus();
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;

    setTimer(30);
    setResendSuccess(true);
    setError('');
    setOtp(['', '', '', '', '', '']);

    // Focus first input
    inputRefs.current[0]?.focus();

    // Clear success message after 4 seconds
    setTimeout(() => {
      setResendSuccess(false);
    }, 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const otpCode = otp.join('');

    if (otpCode.length < 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Simulate API verification
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Navigate to Reset Password page
      navigate('/reset-password', {
        state: { email, verified: true },
      });
    } catch (err) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg, #f4f3ee)', fontFamily: 'var(--primary-text)' }}>
      {/* Main Authentication Card */}
      <div className="w-full max-w-[460px] bg-white rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.06)] p-8 md:p-10 text-center border border-slate-100">
        
        {/* Heading & Subtitle */}
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">
          Verify Your Account
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mb-2 font-normal leading-relaxed">
          We've sent a 6-digit verification code to your email address.
        </p>

        {/* Display Email */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold mb-6 max-w-full truncate">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#338cff] shrink-0">
            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
          </svg>
          <span className="truncate">{email}</span>
        </div>

        {/* Resend Success Alert */}
        {resendSuccess && (
          <div className="mb-4 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium animate-fade-in">
            A new verification code has been sent to your email!
          </div>
        )}

        {/* OTP Verification Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* 6 OTP Input Boxes */}
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 mb-4" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e.key ? e : { key: '' }, index)}
                disabled={isSubmitting}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-extrabold text-slate-800 bg-[#f4f7fb] rounded-xl border transition-all duration-200 outline-none
                  ${
                    error
                      ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-slate-200 focus:border-[#338cff] focus:bg-white focus:ring-2 focus:ring-[#338cff]/20'
                  }
                  ${digit ? 'border-[#338cff] bg-white' : ''}
                  ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}
                `}
                aria-label={`OTP Digit ${index + 1}`}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-xs text-red-500 font-medium mb-4 animate-shake">
              {error}
            </p>
          )}

          {/* Resend OTP Section */}
          <div className="text-xs text-slate-500 mb-6 font-normal">
            {timer > 0 ? (
              <p>
                Resend OTP in{' '}
                <span className="font-bold text-[#338cff]">
                  {timer}s
                </span>
              </p>
            ) : (
              <p className="flex items-center justify-center gap-1.5 flex-wrap">
                <span>Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="font-bold text-[#338cff] hover:text-[#2678e8] hover:underline cursor-pointer transition-colors"
                >
                  Resend OTP
                </button>
              </p>
            )}
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            id="verify-otp-submit-btn"
            disabled={isSubmitting}
            className="w-full py-3 px-6 rounded-full bg-[#338cff] hover:bg-[#2678e8] text-white font-bold text-xs tracking-widest uppercase transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-[0_4px_15px_rgba(51,140,255,0.35)] hover:shadow-[0_6px_20px_rgba(51,140,255,0.45)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>VERIFYING...</span>
              </>
            ) : (
              'VERIFY OTP'
            )}
          </button>
        </form>

        {/* Back to Login Link & Change Email */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-[#338cff] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Change Email</span>
          </Link>

          <Link
            to="/login"
            className="font-semibold text-slate-500 hover:text-[#338cff] transition-colors"
          >
            Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
}
