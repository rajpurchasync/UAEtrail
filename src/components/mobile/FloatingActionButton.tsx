import { ButtonHTMLAttributes, ReactNode } from 'react';

interface FloatingActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  icon: ReactNode;
  label: string;
  /** Pill shape with visible text beside the icon */
  extended?: boolean;
  text?: string;
}

/** Fixed circular (or extended pill) action — sits above the bottom tab bar on mobile. */
export const FloatingActionButton = ({
  icon,
  label,
  extended = false,
  text,
  className = '',
  children,
  ...props
}: FloatingActionButtonProps) => (
  <button
    type="button"
    aria-label={label}
    className={`app-fab ${extended ? 'app-fab--extended' : ''} ${className}`}
    {...props}
  >
    {icon}
    {extended && text ? <span>{text}</span> : null}
    {children}
  </button>
);
