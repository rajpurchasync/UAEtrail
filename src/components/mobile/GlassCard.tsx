import { HTMLAttributes, ReactNode } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
  padding?: boolean;
}

export const GlassCard = ({
  children,
  interactive = false,
  padding = false,
  className = '',
  ...props
}: GlassCardProps) => (
  <div
    className={`glass-card ${interactive ? 'glass-card-interactive cursor-pointer' : ''} ${
      padding ? 'p-4' : ''
    } ${className}`}
    {...props}
  >
    {children}
  </div>
);
