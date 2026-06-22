import { ButtonHTMLAttributes, ReactNode } from 'react';

interface FloatingActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  icon: ReactNode;
  label: string;
}

/** Fixed circular action — sits above the bottom tab bar on mobile. */
export const FloatingActionButton = ({
  icon,
  label,
  className = '',
  children,
  ...props
}: FloatingActionButtonProps) => (
  <button type="button" aria-label={label} className={`app-fab ${className}`} {...props}>
    {icon}
    {children}
  </button>
);
