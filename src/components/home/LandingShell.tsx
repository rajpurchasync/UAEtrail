import { ReactNode } from 'react';

  /** One horizontal gutter for all landing sections — uses `--landing-pad-inline` (index.css). */
export const landingShellClass = 'landing-shell-gutter';

interface LandingShellProps {
  children: ReactNode;
  className?: string;
}

export const LandingShell = ({ children, className = '' }: LandingShellProps) => (
  <div className={`${landingShellClass} ${className}`.trim()}>{children}</div>
);
