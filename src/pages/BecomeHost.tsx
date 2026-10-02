import { Navigate, useSearchParams } from 'react-router-dom';
import { PRO_MEMBERSHIP_PATH } from '../config/routingCatalog';

/** Legacy route — professional host onboarding lives under Pro Membership. */
export const BecomeHost = () => {
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  return <Navigate to={`${PRO_MEMBERSHIP_PATH}${qs ? `?${qs}` : ''}`} replace />;
};
