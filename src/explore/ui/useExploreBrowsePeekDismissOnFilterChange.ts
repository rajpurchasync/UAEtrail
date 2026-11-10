import { useEffect, useRef } from 'react';
import { exploreBrowseDismissPeekFingerprint } from '../exploreMapPeekDismiss';

/** Close map peek when browse URL fingerprint changes (filter/tab/panel). */
export const useExploreBrowsePeekDismissOnFilterChange = (
  searchParams: URLSearchParams,
  clearSelection: () => void
): void => {
  const browseDismissPeekRef = useRef<string | null>(null);
  useEffect(() => {
    const fingerprint = exploreBrowseDismissPeekFingerprint(searchParams);
    if (browseDismissPeekRef.current !== null && browseDismissPeekRef.current !== fingerprint) {
      clearSelection();
    }
    browseDismissPeekRef.current = fingerprint;
  }, [searchParams, clearSelection]);
};
