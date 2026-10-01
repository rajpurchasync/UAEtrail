import { useCallback, useEffect } from 'react';
import { clearFulfillIntentMapItemParams, parseFulfillIntentMapItemId } from '../routing';

type UseExploreFulfillIntentArgs = {
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams, opts?: { replace?: boolean }) => void;
  setSelectedId: (id: string | null) => void;
};

/**
 * Legacy `?fulfillIntent=` deep links are cleared on load.
 * Demand is hosted by the poster — others request to join; third-party fulfill is not used.
 */
export const useExploreFulfillIntent = ({
  searchParams,
  setSearchParams,
  setSelectedId,
}: UseExploreFulfillIntentArgs) => {
  const clearFulfillIntentParam = useCallback(() => {
    if (!parseFulfillIntentMapItemId(searchParams)) return;
    const params = new URLSearchParams(searchParams);
    clearFulfillIntentMapItemParams(params);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const intentMapItemId = parseFulfillIntentMapItemId(searchParams);
    if (!intentMapItemId) return;
    setSelectedId(intentMapItemId);
    clearFulfillIntentParam();
  }, [searchParams, setSelectedId, clearFulfillIntentParam]);

  return {
    fulfillIntentPrefill: null,
    setFulfillIntentPrefill: () => {},
    canFulfillParticipantIntent: false,
    handleFulfillIntent: () => {},
  };
};
