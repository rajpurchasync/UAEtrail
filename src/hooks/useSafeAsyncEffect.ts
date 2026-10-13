import { useEffect } from 'react';

export type IsActiveGuard = () => boolean;

/** Run async work with an isActive() guard to avoid setState after unmount. */
export const useSafeAsyncEffect = (
  effect: (isActive: () => boolean) => Promise<void>,
  deps: readonly unknown[]
): void => {
  useEffect(() => {
    let active = true;
    const isActive = () => active;
    void effect(isActive);
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls deps
  }, deps);
};
