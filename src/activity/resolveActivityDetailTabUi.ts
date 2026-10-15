import type { ActivityPresentationTabsDTO } from '@uaetrail/shared-types';
import type { ActivityDetailTabId } from './activityDetailTab';

export type ActivityDetailTabUi = {
  showMobileTabs: boolean;
  showPlanTransportTeaser: boolean;
  showPlaceCrewBody: boolean;
  showPlaceLockedOnMobile: boolean;
  showCrewLockedHint: boolean;
  showParticipantFooterShortcuts: boolean;
  showHostManageHub: boolean;
  showTransportEncouragementOnTab: (tab: ActivityDetailTabId) => boolean;
};

export type ResolveActivityDetailTabUiInput = {
  wireTabs: ActivityPresentationTabsDTO | null;
  previewMode: boolean;
  isEmbedded: boolean;
  onMobileTabChange?: (tab: ActivityDetailTabId) => void;
  canAccessCrewSurfaces: boolean;
  showCrewLockedHint: boolean;
  showParticipantFooterShortcuts: boolean;
  rideshareEnabled: boolean;
  hasLinkedRideshare: boolean;
};

/** Map wire `presentation.tabs` (+ layout overrides) to detail tab chrome (AD-PRES-02). */
export const resolveActivityDetailTabUi = (
  input: ResolveActivityDetailTabUiInput
): ActivityDetailTabUi => {
  const tabNavEligible = Boolean(input.onMobileTabChange) && !input.previewMode;

  if (!input.wireTabs) {
    const showMobileTabs = tabNavEligible && !input.isEmbedded;
    const showPlaceCrewBody = input.canAccessCrewSurfaces;
    return {
      showMobileTabs,
      showPlanTransportTeaser: showMobileTabs,
      showPlaceCrewBody,
      showPlaceLockedOnMobile: showMobileTabs && !showPlaceCrewBody,
      showCrewLockedHint: input.showCrewLockedHint,
      showParticipantFooterShortcuts: input.showParticipantFooterShortcuts,
      showHostManageHub: true,
      showTransportEncouragementOnTab: (tab) =>
        showMobileTabs &&
        tab === 'transport' &&
        !input.hasLinkedRideshare &&
        !input.rideshareEnabled,
    };
  }

  const showMobileTabs =
    input.wireTabs.plan.useTabChrome && tabNavEligible && !input.isEmbedded;

  return {
    showMobileTabs,
    showPlanTransportTeaser: input.wireTabs.plan.showTransportTeaser && showMobileTabs,
    showPlaceCrewBody: input.wireTabs.place.showCrewMapAndMeeting,
    showPlaceLockedOnMobile: input.wireTabs.place.showLockedPlaceholder && showMobileTabs,
    showCrewLockedHint: input.wireTabs.buddies.showCrewLockedHint,
    showParticipantFooterShortcuts: input.wireTabs.buddies.showParticipantShortcuts,
    showHostManageHub: input.wireTabs.buddies.showHostManageHub,
    showTransportEncouragementOnTab: (tab) =>
      showMobileTabs &&
      tab === 'transport' &&
      input.wireTabs!.transport.showParticipantEmptyEncouragement,
  };
};
