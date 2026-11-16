import { useCallback, useMemo, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { SetURLSearchParams } from 'react-router-dom';
import {
  type ActivityDTO,
  type ExploreMapItemDTO,
} from '@uaetrail/shared-types';
import { hostCompose } from '../../compose';
import {
  canOfferRideshareForAvailabilityItem,
  resolveAvailabilityParentActivityId,
} from '../../linkActivityRideshareOffer';
import {
  buildRideshareDraftFromAvailabilityMapItem,
  buildRideshareDraftFromParentActivity,
} from '../../linkRidesharePrefill';
import { clearComposeWizardSessionForRoute } from '../../ui/composeWizardSession';
import type { HostingWizardPrefill } from '../../ui/hostingWizardPrefill';
import type { useComposeRoute } from './useComposeRoute';
import type { useHostingFromActivity } from './useHostingFromActivity';

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
    user,
    navigate,
    compose,
    hostingFrom,
    selected,
    setSelectedId,
  } = input;
  const setComposeRoute = compose.setComposeRoute;
  const closeCompose = compose.closeCompose;
  const hostComposeRoute = compose.hostComposeRoute;
  const clearHostingFromActivityPrefill = hostingFrom.clearHostingFromActivityPrefill;
  const hostingFromActivityPrefill = hostingFrom.hostingFromActivityPrefill;
  const [rideshareLinkParent, setRideshareLinkParent] = useState<ActivityDTO | null>(null);
  const [rideshareLinkAvailability, setRideshareLinkAvailability] = useState<ExploreMapItemDTO | null>(
    null
  );

  const handleCreateLinkedRideshare = useCallback(
    (parent: ActivityDTO) => {
      setRideshareLinkAvailability(null);
      setRideshareLinkParent(parent);
      setSelectedId(null);
      setComposeRoute(hostCompose('rideshare'));
    },
    [setComposeRoute, setSelectedId]
  );

  const beginOfferRideshareForAvailabilityItem = useCallback(
    (item: ExploreMapItemDTO) => {
      if (!canOfferRideshareForAvailabilityItem(item)) return;

      const returnPath = `${pathname}${search}`;

      if (!user) {
        navigate(`/signup?redirect=${encodeURIComponent(returnPath)}`);
        return;
      }

      setRideshareLinkParent(null);
      setRideshareLinkAvailability(item);
      setSelectedId(null);
      setComposeRoute(hostCompose('rideshare'));
    },
    [navigate, pathname, search, setComposeRoute, setSelectedId, user]
  );

  const handleOfferRideshareForAvailability = useCallback(() => {
    if (!selected) return;
    beginOfferRideshareForAvailabilityItem(selected);
  }, [beginOfferRideshareForAvailabilityItem, selected]);

  const hostingWizardPrefill = useMemo((): HostingWizardPrefill | null => {
    if (rideshareLinkParent) {
      return {
        draft: buildRideshareDraftFromParentActivity(rideshareLinkParent),
        linkToParentActivityId: rideshareLinkParent.id,
      };
    }
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
    return null;
  }, [rideshareLinkParent, rideshareLinkAvailability, hostingFromActivityPrefill]);

  const closeCreateFlow = useCallback(() => {
    clearHostingFromActivityPrefill();
    setRideshareLinkParent(null);
    setRideshareLinkAvailability(null);
    closeCompose();
  }, [clearHostingFromActivityPrefill, closeCompose]);

  const onHostingBackToIntent = useCallback(() => {
    clearComposeWizardSessionForRoute(hostComposeRoute);
    clearHostingFromActivityPrefill();
    setRideshareLinkParent(null);
    setRideshareLinkAvailability(null);
    setComposeRoute({ surface: 'menu', intent: 'host' });
  }, [clearHostingFromActivityPrefill, hostComposeRoute, setComposeRoute]);

  return {
    rideshareLinkParent,
    rideshareLinkAvailability,
    setRideshareLinkParent,
    setRideshareLinkAvailability,
    handleCreateLinkedRideshare,
    handleOfferRideshareForAvailability,
    offerRideshareForAvailabilityItem: beginOfferRideshareForAvailabilityItem,
    hostingWizardPrefill,
    closeCreateFlow,
    onHostingBackToIntent,
  };
};