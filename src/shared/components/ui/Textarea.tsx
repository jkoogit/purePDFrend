import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  error?: string;
  hint?: string;
  showCount?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  hint,
  showCount = false,
  maxLength,
  value,
  disabled = false,
  className = '',
  rows = 3,
  id,
  ...props
}) => {
  const textareaId = id || (label ? `textarea-${String(label).toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const currentLength = typeof value === 'string' ? value.length : 0;
  const errorBorder = error ? 'border-rose-500 focus:ring-rose-500/40' : 'border-slate-700 focus:border-blue-500 focus:ring-blue-500/30';

  return (
    <div className="w-full space-y-1.5 text-xs">
      <div className="flex justify-between items-center">
        {label && (
          <label htmlFor={textareaId} className="block font-medium text-slate-300">
            {label}
          </label>
        )}
        {showCount && maxLength && (
          <span className="text-[11px] text-slate-500 font-mono">
            {currentLength} / {maxLength}
          </span>
        )}
      </div>
      <textarea
        id={textareaId}
        rows={rows}
        maxLength={maxLength}
        value={value}
        disabled={disabled}
        className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 text-xs sm:text-sm transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:bg-slate-950 resize-y ${errorBorder} ${className}`.trim()}
        {...props}
      />
      {error && <p className="text-[11px] text-rose-400">{error}</p>}
      {!error && hint && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
};
