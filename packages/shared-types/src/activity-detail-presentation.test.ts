import { describe, expect, it } from 'vitest';
import { RSVP_PARTICIPATION_REQUIREMENT } from './activity-participation-mode.js';
import { buildActivityPresentationDTO } from './activity-detail-presentation.js';

const guestAccess = {
  exposure: 'redacted' as const,
  level: 'public' as const,
  gateReason: 'sign_in' as const,
  canOpenDetailPage: true,
  canAccessCrewSurfaces: false,
  mapPeekActions: [],
  entitlements: null,
};

describe('buildActivityPresentationDTO', () => {
  it('locks place tab and plan join footers for guests on published activities', () => {
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

    expect(presentation.engagement.showCrewLockedHint).toBe(true);
    expect(presentation.engagement.joinEngagement).toBe('open');
    expect(presentation.footerByTab.place).toBe('plan_join');
    expect(presentation.sections.showMeetingPoint).toBe(false);
  });

  it('exposes one sections policy for the public page and embed', () => {
    const presentation = buildActivityPresentationDTO({
      viewerAccess: {
        ...guestAccess,
        level: 'participant',
        gateReason: null,
        canAccessCrewSurfaces: true,
      },
      isHostUser: false,
      activityPublished: true,
      meetingLat: 25.1,
      meetingLng: 55.2,
      myParticipation: { participantId: 'p1' },
      myRequest: null,
      confirmedParticipantCount: 2,
      participantPreviewCount: 1,
    });

    expect(presentation.sections).toEqual({
      showHostProfile: true,
      participants: 'roster',
      showMeetingPoint: true,
      canOpenParticipantRoster: true,
    });
    expect(presentation.engagement.canAccessCrewSurfaces).toBe(true);
  });

  it('keeps section policy when embedded (tab chrome flags stay off)', () => {
    const presentation = buildActivityPresentationDTO({
      viewerAccess: {
        ...guestAccess,
        level: 'host',
        gateReason: null,
        canAccessCrewSurfaces: true,
      },
      isHostUser: true,
      isEmbedded: true,
      activityPublished: true,
      meetingLat: 25.1,
      meetingLng: 55.2,
      myParticipation: null,
      myRequest: null,
    });

    expect(presentation.sections.showMeetingPoint).toBe(true);
    expect(presentation.sections.showHostProfile).toBe(true);
    expect(presentation.engagement.showCrewLockedHint).toBe(false);
    expect(presentation.footerByTab.plan).toBeDefined();
  });

  it('exposes crew surfaces and invite footer for confirmed participants', () => {
    const presentation = buildActivityPresentationDTO({
      viewerAccess: {
        ...guestAccess,
        level: 'participant',
        gateReason: null,
        canAccessCrewSurfaces: true,
      },
      isHostUser: false,
      activityPublished: true,
      participationMode: 'rsvp',
      requirements: [RSVP_PARTICIPATION_REQUIREMENT],
      meetingLat: 25.1,
      meetingLng: 55.2,
      myParticipation: { participantId: 'p1' },
      myRequest: null,
    });

    expect(presentation.engagement.canAccessCrewSurfaces).toBe(true);
    expect(presentation.engagement.showParticipantFooterShortcuts).toBe(true);
    expect(presentation.footerByTab.crew).toBe('plan_join');
    expect(presentation.footerByTab.place).toBe('plan_join');
  });
});
