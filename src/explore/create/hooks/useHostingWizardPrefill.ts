import { useCallback, useMemo, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { SetURLSearchParams } from 'react-router-dom';
import {
  exploreMapItemIsSeeking,
  type ActivityDTO,
  type ExploreMapItemDTO,
} from '@uaetrail/shared-types';
import { hostCompose } from '../../compose';
import { resolveSeekingParentActivityId } from '../../linkActivityRideshareOffer';
import {
  buildRideshareDraftFromSeekingMapItem,
  buildRideshareDraftFromParentActivity,
} from '../../linkRidesharePrefill';
import { PLAN_WITH_QUERY_KEY, parseHostFromActivityId } from '../../routing';
import type { HostingWizardPrefill } from '../../ui/hostingWizardPrefill';
import type { useComposeRoute } from './useComposeRoute';
import type { useHostingFromActivity } from './useHostingFromActivity';

type Compose = ReturnType<typeof useComposeRoute>;
type HostingFrom = ReturnType<typeof useHostingFromActivity>;

/** Host wizard: linked rideshare, offer-for-seeking, Host-from-existing prefill, and open-state. */
export const useHostingWizardPrefill = (input: {
  pathname: string;
  search: string;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  user: { id: string } | null | undefined;
  hostGateLoading: boolean;
  canPublish: boolean;
  navigate: NavigateFunction;
  navigateMemberPublishGate: (returnPath: string) => void;
  compose: Compose;
  hostingFrom: HostingFrom;
  selected: ExploreMapItemDTO | null;
  setSelectedId: (id: string | null) => void;
}) => {
  const { hostingFrom } = input;
  const [rideshareLinkParent, setRideshareLinkParent] = useState<ActivityDTO | null>(null);
  const [rideshareLinkSeeking, setRideshareLinkSeeking] = useState<ExploreMapItemDTO | null>(null);

  const handleCreateLinkedRideshare = useCallback(
    (parent: ActivityDTO) => {
      setRideshareLinkSeeking(null);
      setRideshareLinkParent(parent);
      input.setSelectedId(null);
      input.compose.setComposeRoute(hostCompose('rideshare'));
    },
    [input]
  );

  const handleOfferRideshareForSeeking = useCallback(() => {
    const selected = input.selected;
    if (!selected || !exploreMapItemIsSeeking(selected)) return;

    const returnPath = `${input.pathname}${input.search}`;

    if (!input.user) {
      input.navigate(`/signup?redirect=${encodeURIComponent(returnPath)}`);
      return;
    }
    if (input.hostGateLoading) return;
    if (!input.canPublish) {
      input.navigateMemberPublishGate(returnPath);
      return;
    }

    setRideshareLinkParent(null);
    setRideshareLinkSeeking(selected);
    input.setSelectedId(null);
    input.compose.setComposeRoute(hostCompose('rideshare'));
  }, [input]);

  const hostingWizardPrefill = useMemo((): HostingWizardPrefill | null => {
    if (rideshareLinkParent) {
      return {
        draft: buildRideshareDraftFromParentActivity(rideshareLinkParent),
        linkToParentActivityId: rideshareLinkParent.id,
      };
    }
    if (rideshareLinkSeeking) {
      const parentActivityId = resolveSeekingParentActivityId(rideshareLinkSeeking);
      return {
        draft: buildRideshareDraftFromSeekingMapItem(rideshareLinkSeeking),
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
  }, [rideshareLinkParent, rideshareLinkSeeking, hostingFrom.hostingFromActivityPrefill]);

  const hostFromPending = Boolean(parseHostFromActivityId(input.searchParams));
  const hostWizardOpen =
    Boolean(hostingWizardPrefill) ||
    (Boolean(input.compose.hostComposeRoute) && !hostFromPending);

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
  }, [input, hostingFrom]);

  const onHostingBackToIntent = useCallback(() => {
    hostingFrom.clearHostingFromActivityPrefill();
    setRideshareLinkParent(null);
    setRideshareLinkSeeking(null);
    input.compose.setComposeRoute({ surface: 'menu', intent: 'host' });
  }, [hostingFrom, input]);

  return {
    rideshareLinkParent,
    rideshareLinkSeeking,
    setRideshareLinkParent,
    setRideshareLinkSeeking,
    handleCreateLinkedRideshare,
    handleOfferRideshareForSeeking,
    hostingWizardPrefill,
    hostWizardOpen,
    closeCreateFlow,
    onHostingBackToIntent,
  };
};
