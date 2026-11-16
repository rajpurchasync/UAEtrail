import { useEffect, useRef } from 'react';
import type { ActivityDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { CreateFlowBridge } from '../../create/CreateFlowProvider';
import type { HostingWizardPrefill } from '../ui/hostingWizardPrefill';
import type { AddSubmitResult } from '../ui/addFlow';
import type { AvailabilityFixedSubmitResult } from '../ui/availabilityFlowEngine';

type UseExploreCreateFlowBridgeArgs = {
  registerBridge: (next: CreateFlowBridge | null) => void;
  hostingWizardPrefill: HostingWizardPrefill | null | undefined;
  closeCreateFlow: () => void;
  onHostingBackToIntent: () => void;
  rideshareLinkParent: ActivityDTO | null;
  rideshareLinkAvailability: ExploreMapItemDTO | null;
  setRideshareLinkParent: (next: ActivityDTO | null) => void;
  setRideshareLinkAvailability: (next: ExploreMapItemDTO | null) => void;
  handleCreateLinkedRideshare: CreateFlowBridge['onCreateLinkedRideshare'];
  handleActivityPublished: (activity: ActivityDTO) => Promise<void>;
  handleAvailabilityFixedSubmitted: (result: AvailabilityFixedSubmitResult) => void;
  handleAddSubmitted: (result: AddSubmitResult) => void;
  planWithBuddyUserId: string | null;
  composeAreaSlug: string | null;
  facilityOnPlaceId: string | null;
  tenantId: string | null | undefined;
  refreshHostGate: () => void;
};

/** Registers explore hosting/seeking/add handlers with the product `CreateFlowProvider`. */
export const useExploreCreateFlowBridge = ({
  registerBridge,
  hostingWizardPrefill,
  closeCreateFlow,
  onHostingBackToIntent,
  rideshareLinkParent,
  rideshareLinkAvailability,
  setRideshareLinkParent,
  setRideshareLinkAvailability,
  handleCreateLinkedRideshare,
  handleActivityPublished,
  handleAvailabilityFixedSubmitted,
  handleAddSubmitted,
  planWithBuddyUserId,
  composeAreaSlug,
  facilityOnPlaceId,
  tenantId,
  refreshHostGate,
}: UseExploreCreateFlowBridgeArgs): void => {
  const handlersRef = useRef({
    closeCreateFlow,
    onHostingBackToIntent,
    rideshareLinkParent,
    rideshareLinkAvailability,
    setRideshareLinkParent,
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
    rideshareLinkParent,
    rideshareLinkAvailability,
    setRideshareLinkParent,
    setRideshareLinkAvailability,
    handleCreateLinkedRideshare,
    handleActivityPublished,
    handleAvailabilityFixedSubmitted,
    handleAddSubmitted,
    refreshHostGate,
  };

  useEffect(() => {
    registerBridge({
      hostingWizardPrefill,
      onCloseCreateFlow: () => handlersRef.current.closeCreateFlow(),
      onHostingBackToIntent: () => handlersRef.current.onHostingBackToIntent(),
      onActivityPublished: async (activity) => {
        const handlers = handlersRef.current;
        await handlers.handleActivityPublished(activity);
        if (handlers.rideshareLinkParent && activity.activityType === 'rideshare') {
          handlers.setRideshareLinkParent(null);
        }
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
      planWithBuddyUserId,
      composeAreaSlug,
      facilityOnPlaceId,
      tenantId,
    });
    return () => registerBridge(null);
  }, [
    registerBridge,
    hostingWizardPrefill,
    planWithBuddyUserId,
    composeAreaSlug,
    facilityOnPlaceId,
    tenantId,
  ]);
};