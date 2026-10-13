import { UserRole } from '@uaetrail/shared-types';
import { useQuery } from '@tanstack/react-query';
import { Navigate, useLocation } from 'react-router-dom';
import { fetchMeProfile } from '../../hooks/memberProfileApi';
import { useAuth } from '../../context/AuthContext';
import { isSignupProfileComplete } from '../../constants/userProfileOptions';
import { accountRouteByRole, participantHostBookmarkRedirect } from '../../utils/authRouting';
import { isPlatformAdmin } from '../../utils/roles';
import { WELCOME_PATH } from '../../config/routingCatalog';
import { isPublishingConsolePath } from '../../config/surfacePaths';
import { buildSignInRedirect } from '../../utils/authReturnContext';
import {
  isSignupProfileGateExemptPath,
  meProfileSignupGateKey,
  needsSignupProfileGate,
} from '../../utils/signupProfileGate';

interface ProtectedRouteProps {
  roles?: UserRole[];
  children: JSX.Element;
}

export const ProtectedRoute = ({ roles, children }: ProtectedRouteProps) => {
  const { user, initializing } = useAuth();
  const location = useLocation();

  const gateEnabled =
    user != null &&
    needsSignupProfileGate(user.role) &&
    !isSignupProfileGateExemptPath(location.pathname);

  const { data: signupComplete, isLoading: signupGateLoading } = useQuery({
    queryKey: user ? meProfileSignupGateKey(user.id) : ['me-profile-signup-gate', 'anonymous'],
    queryFn: async () => {
      const profile = await fetchMeProfile();
      return isSignupProfileComplete(profile);
    },
    enabled: gateEnabled,
    staleTime: 30_000,
  });

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!user) {
    const { href: signInHref } = buildSignInRedirect(location);
    return (
      <Navigate
        to={signInHref}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (roles && !roles.includes(user.role)) {
    if (!isPlatformAdmin(user.role) && isPublishingConsolePath(location.pathname)) {
      return <Navigate to={participantHostBookmarkRedirect(location.pathname)} replace />;
    }
    return <Navigate to={accountRouteByRole(user.role)} replace />;
  }

  if (gateEnabled) {
    if (signupGateLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" />
        </div>
      );
    }
    if (signupComplete === false) {
      return (
        <Navigate
          to={WELCOME_PATH}
          replace
          state={{ redirectTo: location.pathname + location.search }}
        />
      );
    }
  }

  return children;
};
