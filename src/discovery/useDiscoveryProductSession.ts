import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useProductLocation, useProductSearchParams } from '../routing/useEffectiveLocation';
import { useDiscoveryGuestMapReload } from './useDiscoveryGuestMapReload';

/**
 * B-UNIFY — shared routing/auth/query spine for map-first and list discovery orchestration.
 * Explore and list experience models compose surface-specific state on top of this.
 */
export const useDiscoveryProductSession = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useProductLocation();
  const { pathname, search, state: locationState } = location;
  const [searchParams, setSearchParams] = useProductSearchParams();

  useDiscoveryGuestMapReload(user, queryClient);

  const fabSearch = useMemo(
    () => (searchParams.toString() ? `?${searchParams.toString()}` : search),
    [searchParams, search]
  );

  const serializedSearch = useMemo(
    () => (searchParams.toString() ? `?${searchParams.toString()}` : ''),
    [searchParams]
  );

  return {
    user,
    navigate,
    queryClient,
    location,
    locationState,
    pathname,
    search,
    searchParams,
    setSearchParams,
    isSignedIn: Boolean(user),
    fabSearch,
    serializedSearch,
  };
};