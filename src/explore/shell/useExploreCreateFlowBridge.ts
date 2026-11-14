import { useEffect } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import type { CreateFlowBridge } from '../../create/CreateFlowProvider';
import type { HostingWizardPrefill } from '../ui/hostingWizardPrefill';
import type { AddSubmitResult } from '../ui/addFlow';
import type { SeekingSubmitResult } from '../ui/seekingFlow';

type UseExploreCreateFlowBridgeArgs = {
  registerBridge: (next: CreateFlowBridge | null) => void;
  hostingWizardPrefill: HostingWizardPrefill | null | undefined;
  hostWizardOpen: boolean;
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
  hostWizardOpen,
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
  useEffect(() => {
    registerBridge({
      hostingWizardPrefill,
      hostWizardOpen,
      onCloseCreateFlow: closeCreateFlow,
      onHostingBackToIntent,
      onActivityPublished: async (activity) => {
        await handleActivityPublished(activity);
        if (rideshareLinkParent && activity.activityType === 'rideshare') {
          setRideshareLinkParent(null);
        }
        if (rideshareLinkSeeking && activity.activityType === 'rideshare') {
          setRideshareLinkSeeking(null);
        }
        void refreshHostGate();
      },
      onCreateLinkedRideshare: handleCreateLinkedRideshare,
      onSeekingSubmitted: (result) => {
        handleSeekingSubmitted(result);
        void refreshHostGate();
      },
      onAddSubmitted: handleAddSubmitted,
      planWithBuddyUserId,
      composeAreaSlug,
      facilityOnPlaceId,
      tenantId,
    });
    return () => registerBridge(null);
  }, [
    registerBridge,
    hostingWizardPrefill,
    hostWizardOpen,
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
  ]);
};