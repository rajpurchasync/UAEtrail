import { useEffect, useRef } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import type { CreateFlowBridge } from '../../create/CreateFlowProvider';
import type { HostingWizardPrefill } from '../ui/hostingWizardPrefill';
import type { AddSubmitResult } from '../ui/addFlow';
import type { SeekingSubmitResult } from '../ui/seekingFlow';

type UseExploreCreateFlowBridgeArgs = {
  registerBridge: (next: CreateFlowBridge | null) => void;
  hostingWizardPrefill: HostingWizardPrefill | null | undefined;
  closeCreateFlow: () => void;
  onHostingBackToIntent: () => void;
  rideshareLinkParent: ActivityDTO | null;
  rideshareLinkSeeking: ActivityDTO | null;
  setRideshareLinkParent: (next: ActivityDTO | null) => void;
  setRideshareLinkSeeking: (next: ActivityDTO | null) => void;
  handleCreateLinkedRideshare: CreateFlowBridge['onCreateLinkedRideshare'];
  handleActivityPublished: (activity: ActivityDTO) => Promise<void>;
  handleSeekingSubmitted: (result: SeekingSubmitResult) => void;
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
  rideshareLinkSeeking,
  setRideshareLinkParent,
  setRideshareLinkSeeking,
  handleCreateLinkedRideshare,
  handleActivityPublished,
  handleSeekingSubmitted,
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
    rideshareLinkSeeking,
    setRideshareLinkParent,
    setRideshareLinkSeeking,
    handleCreateLinkedRideshare,
    handleActivityPublished,
    handleSeekingSubmitted,
    handleAddSubmitted,
    refreshHostGate,
  });
  handlersRef.current = {
    closeCreateFlow,
    onHostingBackToIntent,
    rideshareLinkParent,
    rideshareLinkSeeking,
    setRideshareLinkParent,
    setRideshareLinkSeeking,
    handleCreateLinkedRideshare,
    handleActivityPublished,
    handleSeekingSubmitted,
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
        if (handlers.rideshareLinkSeeking && activity.activityType === 'rideshare') {
          handlers.setRideshareLinkSeeking(null);
        }
        void handlers.refreshHostGate();
      },
      onCreateLinkedRideshare: (parent) => handlersRef.current.handleCreateLinkedRideshare?.(parent),
      onAvailabilityFixedSubmitted: (result) => {
        handlersRef.current.handleSeekingSubmitted(result);
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