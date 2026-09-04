export default function InputField({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  required = false,
  autoComplete,
  disabled = false,
  icon = null,
}) {
  const inputId = id || name;

  return (
    <div className="w-full text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-4.5 flex items-center justify-center text-slate-400 pointer-events-none z-10">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`w-full py-3 pr-4 text-sm text-slate-800 placeholder-slate-400 bg-[#f4f7fb] rounded-lg border transition-all duration-200 outline-none
            ${icon ? 'pl-11' : 'pl-4'}
            ${
              error
                ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-transparent focus:border-[#338cff] focus:bg-white focus:ring-2 focus:ring-[#338cff]/20'
            }
            ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
          `}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500 font-medium pl-1">{error}</p>}
    </div>
  );
}
