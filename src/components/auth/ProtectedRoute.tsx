import { UserRole } from '@uaetrail/shared-types';
import { useQuery } from '@tanstack/react-query';
import { Navigate, useLocation } from 'react-router-dom';
import { fetchMeProfile } from '../../hooks/memberProfileApi';
import { useAuth } from '../../context/AuthContext';
import { isSignupProfileComplete } from '../../constants/userProfileOptions';
import { accountRouteByRole, participantHostBookmarkRedirect } from '../../utils/authRouting';
import { isConsumerProfilePath, isPlatformAdmin } from '../../utils/roles';
import { isOperatorConsolePath, WELCOME_PATH } from '../../config/surfacePaths';
import { ADMIN_ACCOUNT_PATH } from '../../config/adminSurfacePaths';
import { buildSignInRedirect } from '../../utils/authReturnContext';
import { GuestGatedSurfaceLayout } from './GuestGatedSurfaceLayout';
import { resolveGuestSurfaceForPath } from '../../utils/guestSurfaceByPath';
import type { ReactElement } from 'react';
import { resolveWelcomeFinishExplorePath } from '../../explore/exploreWelcomeNavigation';
import {
  isSignupProfileGateExemptPath,
  meProfileSignupGateKey,
  needsSignupProfileGate,
} from '../../utils/signupProfileGate';
import { AsyncLoadingState } from '../ui/AsyncLoadingState';

interface ProtectedRouteProps {
  roles?: UserRole[];
  children: ReactElement;
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
    return <AsyncLoadingState variant="page" label="Checking your session" />;
  }

  if (!user) {
    const surface = resolveGuestSurfaceForPath(location.pathname);
    if (surface) {
      return (
        <GuestGatedSurfaceLayout
          title={surface.title}
          feature={surface.feature}
          authReturnPath={`${location.pathname}${location.search}`}
        />
      );
    }
    const { href: signInHref } = buildSignInRedirect(location);
    return (
      <Navigate
        to={signInHref}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (isPlatformAdmin(user.role) && isConsumerProfilePath(location.pathname)) {
    return <Navigate to={ADMIN_ACCOUNT_PATH} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    if (!isPlatformAdmin(user.role) && isOperatorConsolePath(location.pathname)) {
      return <Navigate to={participantHostBookmarkRedirect(location.pathname)} replace />;
    }
    return <Navigate to={accountRouteByRole(user.role)} replace />;
  }

  if (gateEnabled) {
    if (signupGateLoading) {
      return <AsyncLoadingState variant="page" label="Loading your profile" />;
    }
    if (signupComplete === false) {
      return (
        <Navigate
          to={WELCOME_PATH}
          replace
          state={{
            redirectTo: resolveWelcomeFinishExplorePath(location.pathname + location.search),
          }}
        />
      );
    }
  }

  return children;
};
