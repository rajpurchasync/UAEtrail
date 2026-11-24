/** List surfaces — CreateFlow bridge, FAB, availability compose, offer-rideshare launcher. */

import { useCallback, useMemo, useState } from 'react';
import type { NavigateFunction, SetURLSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { useCreateFlowOptional } from '../../create/CreateFlowProvider';
import {
  listDiscoverySearchComposeStub,
  listDiscoverySearchRegisterBridgeStub,
} from '../browse/listDiscoverySearchCreateFlowStub';
import { useMemberStatus } from '../../hooks/useMemberStatus';
import { reloadExploreMap } from '../../hooks/useExploreMap';
import { useExploreCreateFlowBridge } from '../../explore/shell/useExploreCreateFlowBridge';
import { resolveCreateEntryPreset } from '../../explore/create/composeFabEntry';
import { intentOpenCompose } from '../../explore/compose';
import type { BrowseListCreateFabHints } from '../browse/browseListCopy';
import { useHostingFromActivity } from '../../explore/create/hooks/useHostingFromActivity';
import { useHostingWizardPrefill } from '../../explore/create/hooks/useHostingWizardPrefill';
import { parseListPlanWithUserId } from '../browse/listComposeQuery';
import { resolveBrowseListCreateFabLabel } from '../browse/browseListCopy';

export type ListDiscoveryComposeBridgeInput = {
  exploreSearch: boolean;
  embeddedOnExplore: boolean;
  embeddedOfferRideshare?: (item: ExploreMapItemDTO) => void;
  user: { id: string; role?: string } | null | undefined;
  pathname: string;
  search: string;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  navigate: NavigateFunction;
  locationPathname: string;
  locationSearch: string;
  createFabContext: BrowseListCreateFabHints;
};

export const useListDiscoveryComposeBridgeModel = ({
  exploreSearch: _exploreSearch,
  embeddedOnExplore,
  embeddedOfferRideshare,
  user,
  pathname,
  search,
  searchParams,
  setSearchParams,
  navigate,
  locationPathname,
  locationSearch,
  createFabContext,
}: ListDiscoveryComposeBridgeInput) => {
  const createFlowCtx = useCreateFlowOptional();
  const compose = createFlowCtx?.compose ?? listDiscoverySearchComposeStub();
  const registerBridge = createFlowCtx?.registerBridge ?? listDiscoverySearchRegisterBridgeStub;

  const queryClient = useQueryClient();
  const { refresh: refreshHostGate, tenantId } = useMemberStatus({ enabled: Boolean(user) });

  const reloadFeed = useCallback(async () => {
    await reloadExploreMap(queryClient);
    void refreshHostGate();
  }, [queryClient, refreshHostGate]);

  const createFabLabel = useMemo(
    () => resolveBrowseListCreateFabLabel(locationPathname, locationSearch, createFabContext),
    [locationPathname, locationSearch, createFabContext]
  );

  const handleCreateFabTap = useCallback(() => {
    compose.handleCreateTap(
      resolveCreateEntryPreset(locationPathname, locationSearch, createFabContext)
    );
  }, [compose, locationPathname, locationSearch, createFabContext]);

  const handleOpenMarkAvailability = useCallback(() => {
    compose.handleCreateTap(intentOpenCompose());
  }, [compose]);

  const hostingFrom = useHostingFromActivity({
    user,
    tenantId,
    searchParams,
    setSearchParams,
    setComposeRoute: compose.setComposeRoute,
    hostComposeKind: compose.activityComposeRoute?.kind ?? null,
  });

  const [, setListSelectedId] = useState<string | null>(null);
  const planWithFriendUserId = parseListPlanWithUserId(searchParams);

  const hostingLauncher = useHostingWizardPrefill({
    pathname,
    search,
    searchParams,
    setSearchParams,
    user,
    navigate,
    compose,
    hostingFrom,
    selected: null,
    setSelectedId: setListSelectedId,
  });

  useExploreCreateFlowBridge({
    enabled: !embeddedOnExplore && Boolean(createFlowCtx),
    registerBridge,
    hostingWizardPrefill: hostingLauncher.hostingWizardPrefill,
    closeCreateFlow: hostingLauncher.closeCreateFlow,
    onHostingBackToIntent: hostingLauncher.onHostingBackToIntent,
    rideshareLinkAvailability: hostingLauncher.rideshareLinkAvailability,
    setRideshareLinkAvailability: hostingLauncher.setRideshareLinkAvailability,
    handleCreateLinkedRideshare: hostingLauncher.handleCreateLinkedRideshare,
    handleActivityPublished: reloadFeed,
    handleAvailabilityFixedSubmitted: () => void reloadFeed(),
    handleAddSubmitted: () => void reloadFeed(),
    planWithFriendUserId,
    composeDestinationSlug: null,
    facilityOnPlaceId: null,
    tenantId,
    refreshHostGate,
  });

  const offerRideshareForAvailabilityItem = embeddedOnExplore
    ? embeddedOfferRideshare
    : hostingLauncher.offerRideshareForAvailabilityItem;

  return {
    handleCreateFabTap,
    handleOpenMarkAvailability,
    createFabLabel,
    offerRideshareForAvailabilityItem,
  };
};