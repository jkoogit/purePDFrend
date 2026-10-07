import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  touchTarget?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  touchTarget = true,
  disabled = false,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? `input-${String(label).toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const touchClass = touchTarget ? 'min-h-[44px] sm:min-h-[36px]' : 'min-h-[36px]';
  const errorBorder = error ? 'border-rose-500 focus:ring-rose-500/40' : 'border-slate-700 focus:border-blue-500 focus:ring-blue-500/30';

  return (
    <div className="w-full space-y-1.5 text-xs">
      {label && (
        <label htmlFor={inputId} className="block font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-slate-400 pointer-events-none inline-flex items-center">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          disabled={disabled}
          className={`w-full bg-slate-900 border rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 text-xs sm:text-sm transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:bg-slate-950 ${leftIcon ? 'pl-9' : ''} ${rightIcon ? 'pr-9' : ''} ${errorBorder} ${touchClass} ${className}`.trim()}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 text-slate-400 inline-flex items-center">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="text-[11px] text-rose-400">{error}</p>}
      {!error && hint && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
};
