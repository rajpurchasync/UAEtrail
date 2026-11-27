import { useEffect, useRef } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { reloadExploreMap } from '../hooks/useExploreMap';

type SessionUser = { id: string } | null | undefined;

/** B-UNIFY — guest→signed-in map catalog refresh (explore + list discovery shells). */
export const useDiscoveryGuestMapReload = (user: SessionUser, queryClient: QueryClient) => {
  const wasGuestRef = useRef(!user);
  useEffect(() => {
    if (user && wasGuestRef.current) {
      wasGuestRef.current = false;
      void reloadExploreMap(queryClient);
    }
    if (!user) {
      wasGuestRef.current = true;
    }
  }, [user, queryClient]);
};