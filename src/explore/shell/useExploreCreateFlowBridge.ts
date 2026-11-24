import { useEffect, useRef } from 'react';
import type { ActivityDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { CreateFlowBridge } from '../../create/CreateFlowProvider';
import type { HostingWizardPrefill } from '../ui/hostingWizardPrefill';
import type { AddSubmitResult } from '../ui/addFlow';
import type { AvailabilityFixedSubmitResult } from '../ui/intentFixedFlowEngine';

type UseExploreCreateFlowBridgeArgs = {
  registerBridge: (next: CreateFlowBridge | null) => void;
  hostingWizardPrefill: HostingWizardPrefill | null | undefined;
  closeCreateFlow: () => void;
  onHostingBackToIntent: () => void;
  rideshareLinkAvailability: ExploreMapItemDTO | null;
  setRideshareLinkAvailability: (next: ExploreMapItemDTO | null) => void;
  handleCreateLinkedRideshare: CreateFlowBridge['onCreateLinkedRideshare'];
  handleActivityPublished: (activity: ActivityDTO) => Promise<void>;
  handleAvailabilityFixedSubmitted: (result: AvailabilityFixedSubmitResult) => void;
  handleAddSubmitted: (result: AddSubmitResult) => void;
  planWithFriendUserId: string | null;
  composeDestinationSlug: string | null;
  facilityOnPlaceId: string | null;
  tenantId: string | null | undefined;
  refreshHostGate: () => void;
  /** When false, clears bridge registration (e.g. list embedded on explore). */
  enabled?: boolean;
};

/** Registers explore hosting/availability/add handlers with the product `CreateFlowProvider`. */
export const useExploreCreateFlowBridge = ({
  registerBridge,
  hostingWizardPrefill,
  closeCreateFlow,
  onHostingBackToIntent,
  rideshareLinkAvailability,
  setRideshareLinkAvailability,
  handleCreateLinkedRideshare,
  handleActivityPublished,
  handleAvailabilityFixedSubmitted,
  handleAddSubmitted,
  planWithFriendUserId,
  composeDestinationSlug,
  facilityOnPlaceId,
  tenantId,
  refreshHostGate,
  enabled = true,
}: UseExploreCreateFlowBridgeArgs): void => {
  const handlersRef = useRef({
    closeCreateFlow,
    onHostingBackToIntent,
    rideshareLinkAvailability,
    setRideshareLinkAvailability,
    handleCreateLinkedRideshare,
    handleActivityPublished,
    handleAvailabilityFixedSubmitted,
    handleAddSubmitted,
    refreshHostGate,
  });
  handlersRef.current = {
    closeCreateFlow,
    onHostingBackToIntent,
    rideshareLinkAvailability,
    setRideshareLinkAvailability,
    handleCreateLinkedRideshare,
    handleActivityPublished,
    handleAvailabilityFixedSubmitted,
    handleAddSubmitted,
    refreshHostGate,
  };

  useEffect(() => {
    if (!enabled) {
      registerBridge(null);
      return () => registerBridge(null);
    }
    registerBridge({
      hostingWizardPrefill,
      onCloseCreateFlow: () => handlersRef.current.closeCreateFlow(),
      onHostingBackToIntent: () => handlersRef.current.onHostingBackToIntent(),
      onActivityPublished: async (activity) => {
        const handlers = handlersRef.current;
        await handlers.handleActivityPublished(activity);
        if (handlers.rideshareLinkAvailability && activity.activityType === 'rideshare') {
          handlers.setRideshareLinkAvailability(null);
        }
        void handlers.refreshHostGate();
      },
      onCreateLinkedRideshare: (parent) => handlersRef.current.handleCreateLinkedRideshare?.(parent),
      onAvailabilityFixedSubmitted: (result) => {
        handlersRef.current.handleAvailabilityFixedSubmitted(result);
        void handlersRef.current.refreshHostGate();
      },
      onAddSubmitted: (result) => handlersRef.current.handleAddSubmitted(result),
      planWithFriendUserId,
      composeDestinationSlug,
      facilityOnPlaceId,
      tenantId,
    });
    return () => registerBridge(null);
  }, [
    registerBridge,
    hostingWizardPrefill,
    planWithFriendUserId,
    composeDestinationSlug,
    facilityOnPlaceId,
    tenantId,
    enabled,
  ]);
};