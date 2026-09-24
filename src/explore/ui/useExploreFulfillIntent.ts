import { useCallback, useEffect, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  clearFulfillIntentMapItemParams,
  exploreFulfillIntentReturnPath,
  parseFulfillIntentMapItemId,
} from '../routing';
import { createDraftFromDemand, type CreateActivityDraft } from './organizeFlow';

type FulfillPrefill = {
  draft: CreateActivityDraft;
  participantIntentId: string;
};

type UseExploreFulfillIntentArgs = {
  items: ExploreMapItemDTO[];
  loading: boolean;
  user: { id: string } | null | undefined;
  hostGateLoading: boolean;
  canPublish: boolean;
  navigate: NavigateFunction;
  pathname: string;
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams, opts?: { replace?: boolean }) => void;
  setSelectedId: (id: string | null) => void;
  selected: ExploreMapItemDTO | null;
};

export const useExploreFulfillIntent = ({
  items,
  loading,
  user,
  hostGateLoading,
  canPublish,
  navigate,
  pathname,
  searchParams,
  setSearchParams,
  setSelectedId,
  selected,
}: UseExploreFulfillIntentArgs) => {
  const [fulfillIntentPrefill, setFulfillIntentPrefill] = useState<FulfillPrefill | null>(null);

  const clearFulfillIntentParam = useCallback(() => {
    if (!parseFulfillIntentMapItemId(searchParams)) return;
    const params = new URLSearchParams(searchParams);
    clearFulfillIntentMapItemParams(params);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const openFulfillIntentFlow = useCallback(
    (item: ExploreMapItemDTO) => {
      if (!item.participantIntentId) return;
      setFulfillIntentPrefill({
        draft: createDraftFromDemand(item),
        participantIntentId: item.participantIntentId,
      });
      setSelectedId(null);
    },
    [setSelectedId]
  );

  useEffect(() => {
    const intentMapItemId = parseFulfillIntentMapItemId(searchParams);
    if (!intentMapItemId || loading) return;

    const item = items.find((entry) => entry.id === intentMapItemId);
    if (!item || item.source !== 'demand' || !item.participantIntentId || item.convertedActivityId) {
      clearFulfillIntentParam();
      return;
    }

    setSelectedId(intentMapItemId);

    if (!user) return;
    if (item.requesterUserId === user.id) {
      clearFulfillIntentParam();
      return;
    }
    if (hostGateLoading) return;

    const returnPath = exploreFulfillIntentReturnPath(intentMapItemId, searchParams, pathname);

    if (!canPublish) {
      navigate(`/become-host?redirect=${encodeURIComponent(returnPath)}`);
      return;
    }

    openFulfillIntentFlow(item);
    clearFulfillIntentParam();
  }, [
    searchParams,
    loading,
    items,
    user,
    hostGateLoading,
    canPublish,
    navigate,
    pathname,
    clearFulfillIntentParam,
    openFulfillIntentFlow,
    setSelectedId,
  ]);

  const canFulfillParticipantIntent = Boolean(
    selected?.source === 'demand' &&
      selected.participantIntentId &&
      !selected.convertedActivityId &&
      selected.requesterUserId &&
      (!user || selected.requesterUserId !== user.id)
  );

  const handleFulfillIntent = useCallback(() => {
    if (!selected?.participantIntentId) return;

    const returnPath = exploreFulfillIntentReturnPath(selected.id, searchParams, pathname);

    if (!user) {
      navigate(`/signup?redirect=${encodeURIComponent(returnPath)}`);
      return;
    }
    if (hostGateLoading) return;
    if (!canPublish) {
      navigate(`/become-host?redirect=${encodeURIComponent(returnPath)}`);
      return;
    }
    openFulfillIntentFlow(selected);
  }, [
    selected,
    searchParams,
    pathname,
    user,
    hostGateLoading,
    canPublish,
    navigate,
    openFulfillIntentFlow,
  ]);

  return {
    fulfillIntentPrefill,
    setFulfillIntentPrefill,
    canFulfillParticipantIntent,
    handleFulfillIntent,
  };
};
