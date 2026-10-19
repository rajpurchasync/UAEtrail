import { Navigate, useSearchParams } from 'react-router-dom';
import { PRO_MEMBERSHIP_PATH } from '../config/routingCatalog';

/** Leftover inbound `/become-host` and `/become-organizer` → Pro Membership (not community Host / publish). */
export const LegacyProMembershipRedirect = () => {
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  return <Navigate to={`${PRO_MEMBERSHIP_PATH}${qs ? `?${qs}` : ''}`} replace />;
};
