import { useCallback, useState } from 'react';

/** One open map overlay per wizard — replace parallel `*MapOpen` booleans. */
export const useComposeMapSession = <T extends string>() => {
  const [intent, setIntent] = useState<T | null>(null);

  const openMap = useCallback((next: T) => {
    setIntent(next);
  }, []);

  const closeMap = useCallback(() => {
    setIntent(null);
  }, []);

  return {
    open: intent != null,
    intent,
    openMap,
    closeMap,
  };
};

/** Wizard back: dismiss the map overlay before leaving the step. */
export const dismissComposeMapIfOpen = (open: boolean, closeMap: () => void): boolean => {
  if (!open) return false;
  closeMap();
  return true;
};
