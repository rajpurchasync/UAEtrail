import { describe, expect, it } from 'vitest';
import {
  APPROVAL_PARTICIPATION_REQUIREMENT,
  buildActivityPresentationDTO,
} from '@uaetrail/shared-types';
import { resolveActivityDetailTabUi } from './resolveActivityDetailTabUi';

const guestAccess = {
  exposure: 'redacted' as const,
  level: 'public' as const,
  gateReason: 'sign_in' as const,
  canOpenDetailPage: true,
  canAccessCrewSurfaces: false,
  mapPeekActions: [],
  entitlements: null,
};

describe('resolveActivityDetailTabUi', () => {
  it('uses wire tabs when presentation is present', () => {
    const presentation = buildActivityPresentationDTO({
      viewerAccess: guestAccess,
      isHostUser: false,
      activityPublished: true,
      participationMode: 'approval',
      requirements: [APPROVAL_PARTICIPATION_REQUIREMENT],
      meetingLat: 25.1,
      meetingLng: 55.2,
      myParticipation: null,
      myRequest: null,
    });

    const ui = resolveActivityDetailTabUi({
      publicDetail: true,
      isHostUser: false,
      showMeetingPoint: presentation.sections.showMeetingPoint,
      previewMode: false,
      isEmbedded: false,
      onMobileTabChange: () => {},
      showCrewLockedHint: presentation.engagement.showCrewLockedHint,
      showParticipantFooterShortcuts: false,
      rideshareEnabled: false,
      hasLinkedRideshare: false,
    });

    expect(ui.showMobileTabs).toBe(false);
    expect(ui.showPlaceLockedOnMobile).toBe(false);
    expect(ui.showPlaceCrewBody).toBe(presentation.sections.showMeetingPoint);
    expect(ui.showCrewLockedHint).toBe(presentation.engagement.showCrewLockedHint);
    expect(ui.showHostManageHub).toBe(false);
    expect(ui.showTransportEncouragementOnTab('transport')).toBe(false);
    expect(ui.showTransportEncouragementOnTab('plan')).toBe(false);
  });

  it('does not show a tab bar when embedded', () => {
    const presentation = buildActivityPresentationDTO({
      viewerAccess: guestAccess,
      isHostUser: false,
      activityPublished: true,
      myParticipation: null,
      myRequest: null,
    });

    const ui = resolveActivityDetailTabUi({
      publicDetail: false,
      isHostUser: false,
      showMeetingPoint: presentation.sections.showMeetingPoint,
      previewMode: false,
      isEmbedded: true,
      onMobileTabChange: () => {},
      showCrewLockedHint: false,
      showParticipantFooterShortcuts: false,
      rideshareEnabled: false,
      hasLinkedRideshare: false,
    });

    expect(ui.showMobileTabs).toBe(false);
  });

  it('uses engagement flags and sections for crew chrome', () => {
    const ui = resolveActivityDetailTabUi({
      publicDetail: true,
      isHostUser: true,
      showMeetingPoint: true,
      previewMode: false,
      isEmbedded: false,
      onMobileTabChange: () => {},
      showCrewLockedHint: false,
      showParticipantFooterShortcuts: true,
      rideshareEnabled: false,
      hasLinkedRideshare: false,
    });

    expect(ui.showMobileTabs).toBe(false);
    expect(ui.showPlaceCrewBody).toBe(true);
    expect(ui.showParticipantFooterShortcuts).toBe(true);
    expect(ui.showHostManageHub).toBe(true);
    expect(ui.showTransportEncouragementOnTab('transport')).toBe(false);
  });
});
