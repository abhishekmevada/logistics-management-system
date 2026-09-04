import { useState } from 'react';

export default function PasswordInput({
  label,
  id,
  name,
  value,
  onChange,
  placeholder = 'Password',
  error = '',
  required = false,
  autoComplete = 'current-password',
  disabled = false,
  icon = null,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || name;

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="w-full text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-4 flex items-center justify-center text-slate-400 pointer-events-none z-10">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`w-full py-3 text-sm text-slate-800 placeholder-slate-400 bg-[#f4f7fb] rounded-lg border transition-all duration-200 outline-none
            ${icon ? 'pl-11' : 'pl-4'}
            pr-11
            ${
              error
                ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-transparent focus:border-[#338cff] focus:bg-white focus:ring-2 focus:ring-[#338cff]/20'
            }
            ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
          `}
        />
        <button
          type="button"
          onClick={toggleVisibility}
          className="absolute right-3.5 flex items-center justify-center text-slate-400 hover:text-[#338cff] transition-colors p-1 rounded z-10 cursor-pointer"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {showPassword ? (
            /* Eye Off Icon */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          ) : (
            /* Eye Icon */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          )}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500 font-medium pl-1">{error}</p>}
    </div>
  );
}
