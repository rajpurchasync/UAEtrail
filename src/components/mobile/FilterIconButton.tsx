import { ButtonHTMLAttributes, ReactNode } from 'react';

interface FilterIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  active?: boolean;
  badge?: number;
}

/** Standard icon-only filter trigger. */
export const FilterIconButton = ({
  children,
  active,
  badge,
  className = '',
  ...props
}: FilterIconButtonProps) => (
  <button
    type="button"
    className={`app-icon-btn relative ${active ? 'ring-emerald-500/40 ring-2' : ''} ${className}`}
    {...props}
  >
    {children}
    {badge !== undefined && badge > 0 && (
      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-emerald-600 text-white text-[10px] font-semibold flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
);
