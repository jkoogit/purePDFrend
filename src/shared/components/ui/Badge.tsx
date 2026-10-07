import React from 'react';

export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  neutral: {
    container: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
    dot: 'bg-slate-400',
  },
  primary: {
    container: 'bg-blue-950/60 text-blue-300 border-blue-800/60',
    dot: 'bg-blue-400',
  },
  success: {
    container: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
    dot: 'bg-emerald-400',
  },
  warning: {
    container: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
    dot: 'bg-amber-400',
  },
  danger: {
    container: 'bg-rose-950/60 text-rose-300 border-rose-800/60',
    dot: 'bg-rose-400',
  },
  info: {
    container: 'bg-sky-950/60 text-sky-300 border-sky-800/60',
    dot: 'bg-sky-400',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[11px] px-2 py-0.5 rounded gap-1',
  md: 'text-xs px-2.5 py-1 rounded-md gap-1.5',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className = '',
  ...props
}) => {
  const v = variantStyles[variant];
  return (
    <span
      className={`inline-flex items-center font-medium border font-mono tracking-tight select-none ${v.container} ${sizeStyles[size]} ${className}`.trim()}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${v.dot}`} aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
};
