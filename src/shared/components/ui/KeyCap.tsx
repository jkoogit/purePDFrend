import React from 'react';

export type KeyCapVariant = 'dark' | 'light' | 'outline';
export type KeyCapSize = 'sm' | 'md';

export interface KeyCapProps extends React.HTMLAttributes<HTMLSpanElement> {
  keys: string | string[];
  variant?: KeyCapVariant;
  size?: KeyCapSize;
}

const variantStyles: Record<KeyCapVariant, string> = {
  dark: 'bg-slate-800 text-slate-200 border-slate-700 border-b-slate-900 shadow-sm',
  light: 'bg-slate-200 text-slate-800 border-slate-300 border-b-slate-400 shadow-sm',
  outline: 'bg-transparent text-slate-300 border-slate-600 border-b-slate-700',
};

const sizeStyles: Record<KeyCapSize, string> = {
  sm: 'text-[10px] px-1.5 py-0.5 min-w-[20px] rounded border-b-2',
  md: 'text-xs px-2 py-0.5 min-w-[24px] rounded-md border-b-2',
};

export const KeyCap: React.FC<KeyCapProps> = ({
  keys,
  variant = 'dark',
  size = 'sm',
  className = '',
  ...props
}) => {
  const keyList = Array.isArray(keys) ? keys : keys.split('+').map((k) => k.trim());

  return (
    <span className={`inline-flex items-center gap-1 select-none font-mono ${className}`.trim()} {...props}>
      {keyList.map((k, idx) => (
        <React.Fragment key={idx}>
          <kbd
            className={`inline-flex items-center justify-center font-semibold text-center border ${variantStyles[variant]} ${sizeStyles[size]}`}
          >
            {k}
          </kbd>
          {idx < keyList.length - 1 && <span className="text-slate-500 text-[10px]">+</span>}
        </React.Fragment>
      ))}
    </span>
  );
};
