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
  /** Public `/activity/:id`. Embed and preview are not. */
  publicDetail: boolean;
  isHostUser: boolean;
  /** Crew meeting map from `presentation.sections`. */
  showMeetingPoint: boolean;
  previewMode: boolean;
  isEmbedded: boolean;
  onMobileTabChange?: (tab: ActivityDetailTabId) => void;
  showCrewLockedHint: boolean;
  showParticipantFooterShortcuts: boolean;
  rideshareEnabled: boolean;
  hasLinkedRideshare: boolean;
};

/**
 * Detail chrome from `presentation.sections` and `presentation.engagement`.
 * The public page, embed, and preview do not render a tab bar.
 */
export const resolveActivityDetailTabUi = (
  input: ResolveActivityDetailTabUiInput
): ActivityDetailTabUi => {
  const tabNavEligible = Boolean(input.onMobileTabChange) && !input.previewMode;
  const showMobileTabs = !input.publicDetail && tabNavEligible && !input.isEmbedded;
  const showPlaceCrewBody = input.showMeetingPoint;

  return {
    showMobileTabs,
    showPlaceCrewBody,
    showPlaceLockedOnMobile: showMobileTabs && !showPlaceCrewBody,
    showCrewLockedHint: input.showCrewLockedHint,
    showParticipantFooterShortcuts: input.showParticipantFooterShortcuts,
    showHostManageHub: input.isHostUser && input.publicDetail,
    showTransportEncouragementOnTab: (tab) =>
      showMobileTabs &&
      tab === 'transport' &&
      !input.hasLinkedRideshare &&
      !input.rideshareEnabled,
  };
};
