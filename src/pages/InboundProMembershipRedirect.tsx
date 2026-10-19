import { Navigate, useSearchParams } from 'react-router-dom';
import { PRO_MEMBERSHIP_PATH } from '../config/routingCatalog';

/** Inbound `/become-host` and `/become-organizer` → Pro Membership (not community Host / publish). */
export const InboundProMembershipRedirect = () => {
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  return <Navigate to={`${PRO_MEMBERSHIP_PATH}${qs ? `?${qs}` : ''}`} replace />;
};
