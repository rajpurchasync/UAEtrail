import { useCallback, useMemo, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { SetURLSearchParams } from 'react-router-dom';
import {
  type ActivityDTO,
  type ExploreMapItemDTO,
} from '@uaetrail/shared-types';
import { activityCompose } from '../../compose';
import {
  canOfferRideshareForAvailabilityItem,
  resolveAvailabilityParentActivityId,
} from '../../linkActivityRideshareOffer';
import { launchLinkedRideshareFromParentActivity } from '../../../create/launchLinkedRideshareFromParentActivity';
import { buildRideshareDraftFromAvailabilityMapItem } from '../../linkRidesharePrefill';
import { clearComposeWizardSessionForRoute } from '../../ui/composeWizardSession';
import type { HostingWizardPrefill } from '../../ui/hostingWizardPrefill';
import type { useComposeRoute } from './useComposeRoute';
import type { useHostingFromActivity } from './useHostingFromActivity';
import { parseAvailabilitySlotId, parsePlanWithUserId } from '../../routing';
import {
  clearFindCrewPlanAnchorSession,
  readFindCrewPlanAnchorSession,
} from '@/list/explorer/findCrewPlanAnchor';
import { hostingPrefillFromFindCrewSlot } from '@/list/explorer/hostingPrefillFromFindCrewSlot';

type Compose = ReturnType<typeof useComposeRoute>;
type HostingFrom = ReturnType<typeof useHostingFromActivity>;

/** Host wizard: linked rideshare, offer-for-availability, Host-from-existing prefill. */
export const useHostingWizardPrefill = (input: {
  pathname: string;
  search: string;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  user: { id: string } | null | undefined;
  navigate: NavigateFunction;
  compose: Compose;
  hostingFrom: HostingFrom;
  selected: ExploreMapItemDTO | null;
  setSelectedId: (id: string | null) => void;
}) => {
  const {
    pathname,
    search,
    searchParams,
    user,
    navigate,
    compose,
    hostingFrom,
    selected,
    setSelectedId,
  } = input;
  const setComposeRoute = compose.setComposeRoute;
  const closeCompose = compose.closeCompose;
  const activityComposeRoute = compose.activityComposeRoute;
  const clearHostingFromActivityPrefill = hostingFrom.clearHostingFromActivityPrefill;
  const hostingFromActivityPrefill = hostingFrom.hostingFromActivityPrefill;
  const [rideshareLinkAvailability, setRideshareLinkAvailability] = useState<ExploreMapItemDTO | null>(
    null
  );

  const handleCreateLinkedRideshare = useCallback(
    (parent: ActivityDTO) => {
      setRideshareLinkAvailability(null);
      setSelectedId(null);
      launchLinkedRideshareFromParentActivity(navigate, parent, { pathname, search });
    },
    [navigate, pathname, search, setSelectedId]
  );

  const beginOfferRideshareForAvailabilityItem = useCallback(
    (item: ExploreMapItemDTO) => {
      if (!canOfferRideshareForAvailabilityItem(item)) return;

      const returnPath = `${pathname}${search}`;

      if (!user) {
        navigate(`/signup?redirect=${encodeURIComponent(returnPath)}`);
        return;
      }

      setRideshareLinkAvailability(item);
      setSelectedId(null);
      setComposeRoute(activityCompose('rideshare'));
    },
    [navigate, pathname, search, setComposeRoute, setSelectedId, user]
  );

  const handleOfferRideshareForAvailability = useCallback(() => {
    if (!selected) return;
    beginOfferRideshareForAvailabilityItem(selected);
  }, [beginOfferRideshareForAvailabilityItem, selected]);

  const planWithFriendUserId = parsePlanWithUserId(searchParams);
  const availabilitySlotId = parseAvailabilitySlotId(searchParams);

  const findCrewPlanPrefill = useMemo((): HostingWizardPrefill | null => {
    if (!planWithFriendUserId || !availabilitySlotId) return null;
    const slot = readFindCrewPlanAnchorSession(planWithFriendUserId, availabilitySlotId);
    if (!slot) return null;
    return hostingPrefillFromFindCrewSlot(slot);
  }, [availabilitySlotId, planWithFriendUserId]);

  const hostingWizardPrefill = useMemo((): HostingWizardPrefill | null => {
    if (rideshareLinkAvailability) {
      const parentActivityId = resolveAvailabilityParentActivityId(rideshareLinkAvailability);
      return {
        draft: buildRideshareDraftFromAvailabilityMapItem(rideshareLinkAvailability),
        linkToParentActivityId: parentActivityId ?? undefined,
      };
    }
    if (hostingFromActivityPrefill) {
      return {
        draft: hostingFromActivityPrefill.draft,
        sourceActivityId: hostingFromActivityPrefill.sourceActivityId,
      };
    }
    if (findCrewPlanPrefill) {
      return findCrewPlanPrefill;
    }
    return null;
  }, [findCrewPlanPrefill, rideshareLinkAvailability, hostingFromActivityPrefill]);

  const closeCreateFlow = useCallback(() => {
    clearHostingFromActivityPrefill();
    setRideshareLinkAvailability(null);
    if (planWithFriendUserId && availabilitySlotId) {
      clearFindCrewPlanAnchorSession(planWithFriendUserId, availabilitySlotId);
    }
    closeCompose();
  }, [
    availabilitySlotId,
    clearHostingFromActivityPrefill,
    closeCompose,
    planWithFriendUserId,
  ]);

  const onHostingBackToIntent = useCallback(() => {
    clearComposeWizardSessionForRoute(activityComposeRoute);
    clearHostingFromActivityPrefill();
    setRideshareLinkAvailability(null);
    setComposeRoute({ surface: 'menu', composeKind: 'activity' });
  }, [clearHostingFromActivityPrefill, activityComposeRoute, setComposeRoute]);

  return {
    rideshareLinkAvailability,
    setRideshareLinkAvailability,
    handleCreateLinkedRideshare,
    handleOfferRideshareForAvailability,
    offerRideshareForAvailabilityItem: beginOfferRideshareForAvailabilityItem,
    hostingWizardPrefill,
    closeCreateFlow,
    onHostingBackToIntent,
  };
};