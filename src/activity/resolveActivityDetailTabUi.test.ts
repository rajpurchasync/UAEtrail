import { describe, expect, it } from 'vitest';
import { buildActivityPresentationDTO } from '@uaetrail/shared-types';
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
      requirements: ['Organizer approval required to join'],
      meetingLat: 25.1,
      meetingLng: 55.2,
      myParticipation: null,
      myRequest: null,
    });

    const ui = resolveActivityDetailTabUi({
      wireTabs: presentation.tabs,
      previewMode: false,
      isEmbedded: false,
      onMobileTabChange: () => {},
      canAccessCrewSurfaces: false,
      showCrewLockedHint: true,
      showParticipantFooterShortcuts: false,
      rideshareEnabled: false,
      hasLinkedRideshare: false,
    });

    expect(ui.showMobileTabs).toBe(true);
    expect(ui.showPlanTransportTeaser).toBe(true);
    expect(ui.showPlaceLockedOnMobile).toBe(true);
    expect(ui.showPlaceCrewBody).toBe(false);
    expect(ui.showCrewLockedHint).toBe(presentation.tabs.buddies.showCrewLockedHint);
    expect(ui.showTransportEncouragementOnTab('transport')).toBe(
      presentation.tabs.transport.showParticipantEmptyEncouragement
    );
    expect(ui.showTransportEncouragementOnTab('plan')).toBe(false);
  });

  it('disables tab chrome when embedded even if wire says useTabChrome', () => {
    const presentation = buildActivityPresentationDTO({
      viewerAccess: guestAccess,
      isHostUser: false,
      activityPublished: true,
      myParticipation: null,
      myRequest: null,
    });

    const ui = resolveActivityDetailTabUi({
      wireTabs: presentation.tabs,
      previewMode: false,
      isEmbedded: true,
      onMobileTabChange: () => {},
      canAccessCrewSurfaces: true,
      showCrewLockedHint: false,
      showParticipantFooterShortcuts: false,
      rideshareEnabled: false,
      hasLinkedRideshare: false,
    });

    expect(ui.showMobileTabs).toBe(false);
    expect(ui.showPlanTransportTeaser).toBe(false);
  });

  it('falls back to local crew flags when wire tabs are missing', () => {
    const ui = resolveActivityDetailTabUi({
      wireTabs: null,
      previewMode: false,
      isEmbedded: false,
      onMobileTabChange: () => {},
      canAccessCrewSurfaces: true,
      showCrewLockedHint: false,
      showParticipantFooterShortcuts: true,
      rideshareEnabled: false,
      hasLinkedRideshare: false,
    });

    expect(ui.showMobileTabs).toBe(true);
    expect(ui.showPlaceCrewBody).toBe(true);
    expect(ui.showParticipantFooterShortcuts).toBe(true);
    expect(ui.showTransportEncouragementOnTab('transport')).toBe(true);
  });
});
