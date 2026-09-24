import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { shouldShowMobileBottomNav } from '../config/platform';
import { useAuth } from '../context/AuthContext';

export const useMobileBottomNav = (): boolean => {
  const { user } = useAuth();
  const { pathname, search } = useLocation();

  return useMemo(
    () => shouldShowMobileBottomNav(pathname, search, Boolean(user)),
    [pathname, search, user]
  );
};
