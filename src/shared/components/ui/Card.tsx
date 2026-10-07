import React from 'react';

export type CardVariant = 'default' | 'subtle' | 'bordered';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-slate-900 border-slate-800 text-slate-100',
  subtle: 'bg-slate-950/60 border-slate-800/80 text-slate-200',
  bordered: 'bg-transparent border-slate-700 text-slate-200',
};

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  interactive = false,
  className = '',
  ...props
}) => {
  const base = 'rounded-xl border transition-colors';
  const hoverClass = interactive ? 'hover:border-slate-600 hover:bg-slate-900/90 cursor-pointer' : '';

  return (
    <div className={`${base} ${variantStyles[variant]} ${hoverClass} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-4 pb-2 border-b border-slate-800/80 flex flex-col gap-1 ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`text-sm sm:text-base font-semibold text-slate-100 ${className}`.trim()} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-xs text-slate-400 ${className}`.trim()} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-4 space-y-3 ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 ${className}`.trim()} {...props}>
    {children}
  </div>
);
