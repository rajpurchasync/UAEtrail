import { useMemo } from 'react';
import { useProductLocation } from '../routing/useEffectiveLocation';
import { shouldShowMobileBottomNav } from '../config/platform';
import { useComposeImmersiveChrome } from '@/discovery/discoveryPortExploreComposeImmersiveChrome';
import { useAuth } from '../context/AuthContext';

export const useMobileBottomNav = (): boolean => {
  const { user } = useAuth();
  const { pathname, search } = useProductLocation();
  const { immersiveCompose } = useComposeImmersiveChrome();

  return useMemo(
    () =>
      !immersiveCompose && shouldShowMobileBottomNav(pathname, search, Boolean(user)),
    [immersiveCompose, pathname, search, user]
  );
};
