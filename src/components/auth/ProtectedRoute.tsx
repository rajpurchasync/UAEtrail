import { UserRole } from '@uaetrail/shared-types';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { accountRouteByRole } from '../../utils/authRouting';

interface ProtectedRouteProps {
  roles?: UserRole[];
  children: JSX.Element;
}

export const ProtectedRoute = ({ roles, children }: ProtectedRouteProps) => {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate to="/signin" replace state={{ from: location.pathname + location.search }} />
    );
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={accountRouteByRole(user.role)} replace />;
  }

  return children;
};
