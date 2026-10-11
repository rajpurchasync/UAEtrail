import { describe, expect, it } from 'vitest';
import type { ExploreCardModel } from '../explore/exploreCardModel';
import {
  resolveActivityPeekEngagement,
  resolveActivityPresentation,
  resolveActivityPresentationFromExploreCard,
} from './resolveActivityPresentation';

const activityCard = (overrides: Partial<ExploreCardModel> = {}): ExploreCardModel =>
  ({
    id: 'activity:a1',
    path: '/activity/a1',
    source: 'activity',
    kind: 'hiking',
    tone: 'hiking',
    emoji: '🥾',
    headline: 'Hike',
    listTitle: 'Hike',
    listHost: null,
    subtitle: null,
    price: null,
    spotsLabel: null,
    venueHint: null,
    showJoinHint: false,
    primaryCta: 'Request to join',
    secondaryCta: 'View details',
    showJoinActions: true,
    shareTitle: 'Hike',
    sharePath: '/explore?pin=activity:a1',
    sections: { details: [], aboutLine: null },
    activityId: 'a1',
    activity: { id: 'a1', status: 'published' } as ExploreCardModel['activity'],
    viewerAccess: {
      exposure: 'redacted',
      level: 'public',
      gateReason: 'sign_in',
      canViewFullActivity: false,
      canOpenDetailPage: true,
      joinMode: 'open',
      canAccessCrewSurfaces: false,
      mapPeekActions: [],
    },
    ...overrides,
  }) as ExploreCardModel;

describe('resolveActivityPresentation', () => {
  it('opens crew welcome only for instant RSVP joins', () => {
    const rsvp = resolveActivityPresentation({
      viewerAccess: {
        exposure: 'full',
        level: 'participant',
        gateReason: null,
        canViewFullActivity: true,
        canOpenDetailPage: true,
        joinMode: 'open',
        canAccessCrewSurfaces: true,
      },
      joinUiState: { kind: 'confirmed', requestId: 'r1' },
      participationMode: 'rsvp',
      requirements: [],
      activityPublished: true,
      isHostUser: false,
      isConfirmedParticipant: true,
    });
    expect(rsvp.showCrewWelcomeAfterInstantJoin).toBe(true);

    const approval = resolveActivityPresentation({
      viewerAccess: null,
      joinUiState: { kind: 'open' },
      participationMode: 'approval',
      requirements: [],
      activityPublished: true,
      isHostUser: false,
      isConfirmedParticipant: false,
    });
    expect(approval.showCrewWelcomeAfterInstantJoin).toBe(false);
  });

  it('hides footer chat shortcuts until crew access', () => {
    const locked = resolveActivityPresentation({
      viewerAccess: {
        exposure: 'redacted',
        level: 'join_request',
        gateReason: null,
        canViewFullActivity: false,
        canOpenDetailPage: true,
        joinMode: 'open',
        canAccessCrewSurfaces: false,
      },
      joinUiState: { kind: 'pending', status: 'pending', requestId: 'r1' },
      participationMode: 'rsvp',
      requirements: [],
      activityPublished: true,
      isHostUser: false,
      isConfirmedParticipant: false,
    });
    expect(locked.showParticipantFooterShortcuts).toBe(false);
    expect(locked.showCrewLockedHint).toBe(true);
  });

  it('builds presentation from explore card viewer access', () => {
    const fromCard = resolveActivityPresentationFromExploreCard(activityCard(), {
      joinUiState: { kind: 'open' },
      isHostUser: false,
      isConfirmedParticipant: false,
    });
    expect(fromCard?.canAccessCrewSurfaces).toBe(false);
    expect(fromCard?.showCrewLockedHint).toBe(true);
  });
});

describe('resolveActivityPeekEngagement', () => {
  it('bundles wire actions and legacy join flow flags', () => {
    const engagement = resolveActivityPeekEngagement(activityCard(), { kind: 'open' });
    expect(engagement.mapPeekActions.map((a) => a.id)).toEqual(['request_join', 'message_host']);
    expect(engagement.showsLegacyJoinFlow).toBe(false);
    expect(engagement.needsJoinContext).toBe(true);
    expect(engagement.skipsJoinContext).toBe(false);
  });
});
