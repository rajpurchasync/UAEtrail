import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { shouldShowMobileBottomNav } from '../config/platform';
import { useComposeImmersiveChrome } from '../explore/create/ComposeImmersiveChromeContext';
import { useAuth } from '../context/AuthContext';

export const useMobileBottomNav = (): boolean => {
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const { immersiveCompose } = useComposeImmersiveChrome();

  return useMemo(
    () =>
      !immersiveCompose && shouldShowMobileBottomNav(pathname, search, Boolean(user)),
    [immersiveCompose, pathname, search, user]
  );
};
