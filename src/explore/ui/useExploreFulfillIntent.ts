import { useCallback, useEffect } from 'react';
import { clearFulfillIntentMapItemParams, parseFulfillIntentMapItemId } from '../routing';

type UseExploreFulfillIntentArgs = {
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams, opts?: { replace?: boolean }) => void;
  setSelectedId: (id: string | null) => void;
};

/**
 * Legacy `?fulfillIntent=` deep links: select the pin once, then strip the query param.
 * Third-party fulfill / prefill wizards are not used (demand host is the poster).
 */
export const useExploreFulfillIntent = ({
  searchParams,
  setSearchParams,
  setSelectedId,
}: UseExploreFulfillIntentArgs): void => {
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
};
