import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  touchTarget?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-500 text-white border-transparent shadow-sm active:bg-blue-700',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 active:bg-slate-850',
  outline: 'bg-transparent hover:bg-slate-800/60 text-slate-300 border-slate-700 hover:text-white',
  ghost: 'bg-transparent hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 border-transparent',
  danger: 'bg-rose-600 hover:bg-rose-500 text-white border-transparent shadow-sm active:bg-rose-700',
  success: 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent shadow-sm active:bg-emerald-700',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-xs px-2.5 py-1 min-h-[30px] rounded-lg gap-1.5',
  md: 'text-xs sm:text-sm px-3.5 py-1.5 min-h-[38px] rounded-lg gap-2',
  lg: 'text-sm sm:text-base px-5 py-2.5 min-h-[44px] rounded-xl gap-2.5',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  touchTarget = true,
  disabled = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium border transition-colors select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50';
  const touchClass = touchTarget ? 'min-h-[44px] sm:min-h-0' : '';
  const variantClass = variantStyles[variant];
  const sizeClass = sizeStyles[size];

  return (
    <button
      className={`${baseClasses} ${variantClass} ${sizeClass} ${touchClass} ${className}`.trim()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      ) : (
        leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && (
        <span className="inline-flex shrink-0 items-center">{rightIcon}</span>
      )}
    </button>
  );
};
