/** List surfaces — CreateFlow bridge, FAB, availability compose, offer-rideshare launcher. */

import { useMemo, useState } from 'react';
import type { NavigateFunction, SetURLSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { useCreateFlowOptional } from '../../create/CreateFlowProvider';
import {
  listDiscoverySearchComposeStub,
  listDiscoverySearchRegisterBridgeStub,
} from '../browse/listDiscoverySearchCreateFlowStub';
import { useMemberStatus } from '../../hooks/useMemberStatus';
import {
  useDiscoveryCreateFabActions,
  useDiscoveryExperienceComposeBridge,
  useHostingFromActivity,
  useHostingWizardPrefill,
} from '../../discovery/discoveryPortExploreComposeSurface';
import type { BrowseListCreateFabHints } from '../browse/browseListCopy';
import { parseListPlanWithUserId } from '../browse/listComposeQuery';

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
  locationPathname: _locationPathname,
  locationSearch,
  createFabContext,
}: ListDiscoveryComposeBridgeInput) => {
  const createFlowCtx = useCreateFlowOptional();
  const compose = createFlowCtx?.compose ?? listDiscoverySearchComposeStub();
  const registerBridge = createFlowCtx?.registerBridge ?? listDiscoverySearchRegisterBridgeStub;

  const queryClient = useQueryClient();
  const { refresh: refreshHostGate, tenantId } = useMemberStatus({ enabled: Boolean(user) });

  const { createFabLabel, handleCreateFabTap, handleOpenMarkAvailability } = useDiscoveryCreateFabActions({
    compose,
    pathname,
    fabSearch: locationSearch,
    createFabContext,
  });

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

  useDiscoveryExperienceComposeBridge({
    enabled: !embeddedOnExplore && Boolean(createFlowCtx),
    registerBridge,
    queryClient,
    refreshHostGate,
    hostingWizardPrefill: hostingLauncher.hostingWizardPrefill,
    closeCreateFlow: hostingLauncher.closeCreateFlow,
    onHostingBackToIntent: hostingLauncher.onHostingBackToIntent,
    rideshareLinkAvailability: hostingLauncher.rideshareLinkAvailability,
    setRideshareLinkAvailability: hostingLauncher.setRideshareLinkAvailability,
    handleCreateLinkedRideshare: hostingLauncher.handleCreateLinkedRideshare,
    planWithFriendUserId,
    composeDestinationSlug: null,
    facilityOnPlaceId: null,
    tenantId,
  });

  const offerRideshareForAvailabilityItem = useMemo(
    () => (embeddedOnExplore ? embeddedOfferRideshare : hostingLauncher.offerRideshareForAvailabilityItem),
    [embeddedOnExplore, embeddedOfferRideshare, hostingLauncher.offerRideshareForAvailabilityItem]
  );

  return {
    handleCreateFabTap,
    handleOpenMarkAvailability,
    createFabLabel,
    offerRideshareForAvailabilityItem,
  };
};