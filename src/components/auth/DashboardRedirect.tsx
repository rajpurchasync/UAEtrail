import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  adminDashboardRedirect,
  organizerDashboardRedirect,
  visitorDashboardRedirect
} from '../../utils/authRouting';

/** Sends participants to mobile routes; staff keep their consoles. */
export const DashboardRedirect = () => {
  const { user } = useAuth();
  const location = useLocation();
  const subpath = location.pathname.replace(/^\/dashboard\/?/, '') || 'overview';
  const search = location.search;

  if (!user) return <Navigate to="/signin" replace state={{ from: location.pathname + search }} />;

  if (user.role === 'visitor') {
    return <Navigate to={`${visitorDashboardRedirect(subpath)}${search}`} replace />;
  }
  if (user.role === 'platform_admin') {
    return <Navigate to={`${adminDashboardRedirect(subpath)}${search}`} replace />;
  }
  if (user.role === 'merchant_admin') {
    return <Navigate to={`/merchant/dashboard${search}`} replace />;
  }
  if (user.role === 'tenant_owner' || user.role === 'tenant_admin' || user.role === 'tenant_guide') {
    return <Navigate to={`${organizerDashboardRedirect(subpath)}${search}`} replace />;
  }

  return <Navigate to={`/profile${search}`} replace />;
};
