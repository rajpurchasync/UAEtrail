import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'tint' | 'destructive' | 'plain';

const variants: Record<Variant, string> = {
  primary: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 active:bg-emerald-700',
  secondary: 'glass text-neutral-900 active:bg-white/80',
  tint: 'bg-emerald-600/12 text-emerald-700 active:bg-emerald-600/20',
  destructive: 'bg-red-500 text-white shadow-md shadow-red-500/20 active:bg-red-600',
  plain: 'bg-transparent text-emerald-600 active:bg-emerald-50',
};

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
}

export const AppButton = ({
  variant = 'primary',
  fullWidth,
  className = '',
  children,
  ...props
}: AppButtonProps) => (
  <button
    type="button"
    className={`ios-btn ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    {...props}
  >
    {children}
  </button>
);
