import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { resolveMobileBackChrome, type MobileBackChrome } from '../utils/mobileBackNav';

export const useMobileBackChrome = (defaults: {
  fallbackTo: string;
  label: string;
  backBehavior?: 'history' | 'fallback';
}): MobileBackChrome => {
  const { state } = useLocation();
  return useMemo(() => resolveMobileBackChrome(state, defaults), [state, defaults]);
};
