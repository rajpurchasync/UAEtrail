import { useCallback, useMemo, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { SetURLSearchParams } from 'react-router-dom';
import {
  exploreMapItemIsSeeking,
  type ActivityDTO,
  type ExploreMapItemDTO,
} from '@uaetrail/shared-types';
import {
  resolveSeekingParentActivityId,
} from '../linkActivityRideshareOffer';
import { buildRideshareDraftFromDemandMapItem, buildRideshareDraftFromParentActivity } from '../linkRidesharePrefill';
import type { OrganizeWizardPrefill } from '../ui/organizeWizardPrefill';
import type { useExploreComposeRoute } from '../ui/useExploreComposeRoute';
import type { useExploreOrganizeFromActivity } from '../ui/useExploreOrganizeFromActivity';
import { PLAN_WITH_QUERY_KEY, parseOrganizeFromActivityId } from '../routing';

type Compose = ReturnType<typeof useExploreComposeRoute>;
type OrganizeFrom = ReturnType<typeof useExploreOrganizeFromActivity>;

/** Rideshare link state + organize wizard prefill (R2 shell). */
export const useExploreRideshareOrganizeLinks = (input: {
  pathname: string;
  search: string;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  user: { id: string } | null | undefined;
  hostGateLoading: boolean;
  canPublish: boolean;
  navigate: NavigateFunction;
  navigateOrganizePublishGate: (returnPath: string) => void;
  compose: Compose;
  organizeFrom: OrganizeFrom;
  selected: ExploreMapItemDTO | null;
  setSelectedId: (id: string | null) => void;
}) => {
  const [rideshareLinkParent, setRideshareLinkParent] = useState<ActivityDTO | null>(null);
  const [rideshareLinkDemand, setRideshareLinkDemand] = useState<ExploreMapItemDTO | null>(null);

  const handleCreateLinkedRideshare = useCallback(
    (parent: ActivityDTO) => {
      setRideshareLinkDemand(null);
      setRideshareLinkParent(parent);
      input.setSelectedId(null);
      input.compose.setComposeRoute({ intent: 'organize', kind: 'rideshare' });
    },
    [input.compose.setComposeRoute, input.setSelectedId]
  );

  const handleOfferRideshareForDemand = useCallback(() => {
    const selected = input.selected;
    if (!selected || !exploreMapItemIsSeeking(selected)) return;

    const returnPath = `${input.pathname}${input.search}`;

    if (!input.user) {
      input.navigate(`/signup?redirect=${encodeURIComponent(returnPath)}`);
      return;
    }
    if (input.hostGateLoading) return;
    if (!input.canPublish) {
      input.navigateOrganizePublishGate(returnPath);
      return;
    }

    setRideshareLinkParent(null);
    setRideshareLinkDemand(selected);
    input.setSelectedId(null);
    input.compose.setComposeRoute({ intent: 'organize', kind: 'rideshare' });
  }, [
    input.selected,
    input.pathname,
    input.search,
    input.user,
    input.hostGateLoading,
    input.canPublish,
    input.navigate,
    input.navigateOrganizePublishGate,
    input.compose.setComposeRoute,
    input.setSelectedId,
  ]);

  const organizeWizardPrefill = useMemo((): OrganizeWizardPrefill | null => {
    if (rideshareLinkParent) {
      return {
        draft: buildRideshareDraftFromParentActivity(rideshareLinkParent),
        linkToParentActivityId: rideshareLinkParent.id,
      };
    }
    if (rideshareLinkDemand) {
      const parentActivityId = resolveSeekingParentActivityId(rideshareLinkDemand);
      return {
        draft: buildRideshareDraftFromDemandMapItem(rideshareLinkDemand),
        linkToParentActivityId: parentActivityId ?? undefined,
      };
    }
    if (input.organizeFrom.organizeFromPrefill) {
      return {
        draft: input.organizeFrom.organizeFromPrefill.draft,
        sourceActivityId: input.organizeFrom.organizeFromPrefill.sourceActivityId,
      };
    }
    return null;
  }, [rideshareLinkParent, rideshareLinkDemand, input.organizeFrom.organizeFromPrefill]);

  const organizeFromPending = Boolean(parseOrganizeFromActivityId(input.searchParams));
  const organizeWizardOpen =
    Boolean(organizeWizardPrefill) ||
    (Boolean(input.compose.organizeRoute) && !organizeFromPending);

  const closeCreateFlow = useCallback(() => {
    input.compose.closeCompose();
    input.organizeFrom.clearOrganizeFromPrefill();
    setRideshareLinkParent(null);
    input.setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(PLAN_WITH_QUERY_KEY);
        return next;
      },
      { replace: true }
    );
  }, [input.compose, input.organizeFrom, input.setSearchParams]);

  const onOrganizeBackToIntent = useCallback(() => {
    input.organizeFrom.clearOrganizeFromPrefill();
    setRideshareLinkParent(null);
    setRideshareLinkDemand(null);
    input.compose.setComposeRoute({ surface: 'menu', intent: 'organize' });
  }, [input.organizeFrom, input.compose.setComposeRoute]);

  return {
    rideshareLinkParent,
    rideshareLinkDemand,
    setRideshareLinkParent,
    setRideshareLinkDemand,
    handleCreateLinkedRideshare,
    handleOfferRideshareForDemand,
    organizeWizardPrefill,
    organizeWizardOpen,
    closeCreateFlow,
    onOrganizeBackToIntent,
  };
};
