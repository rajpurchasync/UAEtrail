import { useCallback, useMemo, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { SetURLSearchParams } from 'react-router-dom';
import {
  exploreMapItemIsSeeking,
  type ActivityDTO,
  type ExploreMapItemDTO,
} from '@uaetrail/shared-types';
import { planHostingCompose } from '../../compose';
import { resolveSeekingParentActivityId } from '../../linkActivityRideshareOffer';
import {
  buildRideshareDraftFromDemandMapItem,
  buildRideshareDraftFromParentActivity,
} from '../../linkRidesharePrefill';
import { PLAN_WITH_QUERY_KEY, parseOrganizeFromActivityId } from '../../routing';
import type { OrganizeWizardPrefill } from '../../ui/organizeWizardPrefill';
import type { useComposeRoute } from './useComposeRoute';
import type { useHostingFromActivity } from './useHostingFromActivity';

type Compose = ReturnType<typeof useComposeRoute>;
type HostingFrom = ReturnType<typeof useHostingFromActivity>;

/** Plan hosting wizard: linked rideshare, offer-for-seeking, reorganize prefill, and open-state. */
export const useHostingWizardPrefill = (input: {
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
  hostingFrom?: HostingFrom;
  /** @deprecated Use {@link hostingFrom}. */
  organizeFrom?: HostingFrom;
  selected: ExploreMapItemDTO | null;
  setSelectedId: (id: string | null) => void;
}) => {
  const hostingFrom = input.hostingFrom ?? input.organizeFrom;
  if (!hostingFrom) {
    throw new Error('useHostingWizardPrefill requires hostingFrom');
  }
  const [rideshareLinkParent, setRideshareLinkParent] = useState<ActivityDTO | null>(null);
  const [rideshareLinkDemand, setRideshareLinkDemand] = useState<ExploreMapItemDTO | null>(null);

  const handleCreateLinkedRideshare = useCallback(
    (parent: ActivityDTO) => {
      setRideshareLinkDemand(null);
      setRideshareLinkParent(parent);
      input.setSelectedId(null);
      input.compose.setComposeRoute(planHostingCompose('rideshare'));
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
    input.compose.setComposeRoute(planHostingCompose('rideshare'));
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

  const hostingWizardPrefill = useMemo((): OrganizeWizardPrefill | null => {
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
    if (hostingFrom.hostingFromActivityPrefill) {
      return {
        draft: hostingFrom.hostingFromActivityPrefill.draft,
        sourceActivityId: hostingFrom.hostingFromActivityPrefill.sourceActivityId,
      };
    }
    return null;
  }, [rideshareLinkParent, rideshareLinkDemand, hostingFrom.hostingFromActivityPrefill]);

  const organizeFromPending = Boolean(parseOrganizeFromActivityId(input.searchParams));
  const hostWizardOpen =
    Boolean(hostingWizardPrefill) ||
    (Boolean(input.compose.planHostingRoute) && !organizeFromPending);
  const planHostingWizardOpen = hostWizardOpen;

  const closeCreateFlow = useCallback(() => {
    input.compose.closeCompose();
    hostingFrom.clearHostingFromActivityPrefill();
    setRideshareLinkParent(null);
    input.setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(PLAN_WITH_QUERY_KEY);
        return next;
      },
      { replace: true }
    );
  }, [input.compose, hostingFrom, input.setSearchParams]);

  const onPlanHostingBackToIntent = useCallback(() => {
    hostingFrom.clearHostingFromActivityPrefill();
    setRideshareLinkParent(null);
    setRideshareLinkDemand(null);
    input.compose.setComposeRoute({ surface: 'menu', intent: 'host' });
  }, [hostingFrom, input.compose.setComposeRoute]);

  return {
    rideshareLinkParent,
    rideshareLinkDemand,
    setRideshareLinkParent,
    setRideshareLinkDemand,
    handleCreateLinkedRideshare,
    handleOfferRideshareForDemand,
    hostingWizardPrefill,
    hostWizardOpen,
    planHostingWizardOpen,
    closeCreateFlow,
    onPlanHostingBackToIntent,
    /** @deprecated Use {@link hostingWizardPrefill}. */
    organizeWizardPrefill: hostingWizardPrefill,
    /** @deprecated Use {@link hostWizardOpen}. */
    organizeWizardOpen: hostWizardOpen,
    /** @deprecated Use {@link onPlanHostingBackToIntent}. */
    onOrganizeBackToIntent: onPlanHostingBackToIntent,
  };
};

/** @deprecated Use {@link useHostingWizardPrefill}. */
export const useExploreRideshareOrganizeLinks = useHostingWizardPrefill;
