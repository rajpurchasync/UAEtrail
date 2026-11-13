import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { joinAuthPath } from '../config/routingCatalog';

type GeoGuestDrillLinkProps = {
  to: string;
  state?: object;
  className?: string;
  children: ReactNode;
  authReturnPath?: string;
  /** Hero crumbs and inline labels — default is block card rows. */
  inline?: boolean;
};

/** Geo hierarchy drill-down — guests see the row but auth before navigation. */
export const GeoGuestDrillLink = ({
  to,
  state,
  className,
  children,
  authReturnPath,
  inline = false,
}: GeoGuestDrillLinkProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return (
      <Link to={to} state={state} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={`${inline ? 'inline p-0 font-inherit' : 'text-left'} ${className ?? ''}`}
      onClick={() => navigate(joinAuthPath(authReturnPath ?? to))}
    >
      {children}
    </button>
  );
};
