import type { ActivityPresentationTabsDTO } from '@uaetrail/shared-types';
import type { ActivityDetailTabId } from './activityDetailTab';

export type ActivityDetailTabUi = {
  showMobileTabs: boolean;
  showPlaceCrewBody: boolean;
  showPlaceLockedOnMobile: boolean;
  showCrewLockedHint: boolean;
  showParticipantFooterShortcuts: boolean;
  showHostManageHub: boolean;
  showTransportEncouragementOnTab: (tab: ActivityDetailTabId) => boolean;
};

export type ResolveActivityDetailTabUiInput = {
  wireTabs: ActivityPresentationTabsDTO | null;
  /** Public `/activity/:id` — no tab bar. */
  publicDetail: boolean;
  /** Crew meeting map from `presentation.sections`. */
  showMeetingPoint: boolean;
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

  const showMobileTabs = !input.publicDetail && tabNavEligible && !input.isEmbedded;
  const showPlaceCrewBody = input.showMeetingPoint;

  if (!input.wireTabs) {
    return {
      showMobileTabs,
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

  return {
    showMobileTabs,
    showPlaceCrewBody,
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
