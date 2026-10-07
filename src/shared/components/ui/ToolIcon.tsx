import React from 'react';

export type ToolIconSize = 'sm' | 'md' | 'lg';

export interface ToolIconProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label?: string;
  active?: boolean;
  size?: ToolIconSize;
  badge?: string | number;
}

const sizeStyles: Record<ToolIconSize, { button: string; icon: string }> = {
  sm: {
    button: 'w-7 h-7 rounded-md p-1',
    icon: 'text-sm w-3.5 h-3.5',
  },
  md: {
    button: 'w-8 h-8 sm:w-9 sm:h-9 rounded-lg p-1.5 min-h-[36px]',
    icon: 'text-base w-4 h-4',
  },
  lg: {
    button: 'w-10 h-10 sm:w-11 sm:h-11 rounded-xl p-2 min-h-[44px]',
    icon: 'text-lg w-5 h-5',
  },
};

export const ToolIcon: React.FC<ToolIconProps> = ({
  icon,
  label,
  active = false,
  size = 'md',
  badge,
  disabled = false,
  className = '',
  ...props
}) => {
  const s = sizeStyles[size];
  const activeClass = active
    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60';

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center transition-all cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${s.button} ${activeClass} ${className}`.trim()}
      {...props}
    >
      <span className={`inline-flex items-center justify-center shrink-0 ${s.icon}`}>
        {icon}
      </span>
      {badge !== undefined && (
        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center leading-tight">
          {badge}
        </span>
      )}
    </button>
  );
};
