import { describe, expect, it } from 'vitest';
import type { ExploreCardModel } from '../explore/exploreCardModel';
import {
  resolveActivityDetailPresentation,
  resolveActivityPresentationFromExploreCard,
} from './activityDetailPresentation';
import {
  filterActivityMapPeekActionsForViewer,
  resolveActivityMapPeekActions,
  resolveActivityPeekEngagement,
} from './activityPeekEngagement';

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
    },
    ...overrides,
  }) as ExploreCardModel;

describe('resolveActivityPresentation', () => {
  it('opens crew welcome only for instant RSVP joins', () => {
    const rsvp = resolveActivityDetailPresentation({
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

    const approval = resolveActivityDetailPresentation({
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
    const locked = resolveActivityDetailPresentation({
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
    expect(engagement.mapPeekActions.map((a) => a.id)).toEqual(['request_join', 'view_detail']);
    expect(engagement.showsLegacyJoinFlow).toBe(false);
    expect(engagement.needsJoinContext).toBe(true);
    expect(engagement.skipsJoinContext).toBe(false);
  });
});

describe('filterActivityMapPeekActionsForViewer', () => {
  it('strips message_host when entitlements are absent', () => {
    const filtered = filterActivityMapPeekActionsForViewer([
      { id: 'request_join', prominence: 'primary' },
      { id: 'message_host', prominence: 'secondary' },
    ]);
    expect(filtered.map((a) => a.id)).toEqual(['request_join']);
  });

  it('restores message_host when entitlements allow pre-join DM', () => {
    const filtered = filterActivityMapPeekActionsForViewer(
      [
        { id: 'request_join', prominence: 'primary' },
        { id: 'view_detail', prominence: 'text' },
      ],
      {
        level: 'link_holder',
        entitlements: {
          isProMember: true,
          canViewHostProfileBeforeJoin: true,
          canViewFullBuddyRoster: false,
          canOfferTransport: false,
          canAddLinkedRide: false,
          canMessageHostBeforeJoin: true,
          buddyUserIdsOnActivity: [],
        },
      }
    );
    expect(filtered.map((a) => a.id)).toContain('message_host');
  });
});

describe('resolveActivityMapPeekActions participant fallback', () => {
  it('uses crew chat not DM host for joined members', () => {
    const card = activityCard({
      viewerAccess: {
        exposure: 'full',
        level: 'participant',
        gateReason: null,
        canViewFullActivity: true,
        canOpenDetailPage: true,
        joinMode: 'open',
        canAccessCrewSurfaces: true,
        mapPeekActions: [
          { id: 'open_crew_chat', prominence: 'primary' },
          { id: 'invite_crew', prominence: 'secondary' },
          { id: 'view_detail', prominence: 'text' },
        ],
      },
    });
    expect(resolveActivityMapPeekActions(card).map((a) => a.id)).toEqual([
      'open_crew_chat',
      'invite_crew',
      'view_detail',
    ]);
  });
});
