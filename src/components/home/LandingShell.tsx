import { ReactNode } from 'react';

  /** One horizontal gutter for all landing sections — mobile px-5, desktop container. */
export const landingShellClass =
  'box-border w-full max-w-7xl px-5 md:mx-auto md:px-6 lg:px-8';

interface LandingShellProps {
  children: ReactNode;
  className?: string;
}

export const LandingShell = ({ children, className = '' }: LandingShellProps) => (
  <div className={`${landingShellClass} ${className}`.trim()}>{children}</div>
);
