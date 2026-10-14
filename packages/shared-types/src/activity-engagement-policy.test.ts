import { describe, expect, it } from 'vitest';
import { RSVP_PARTICIPATION_REQUIREMENT } from './activity-participation-mode.js';
import {
  projectActivityMapPeekActions,
  resolveActivityEngagementPolicy,
} from './activity-engagement-policy.js';

const guestAccess = {
  exposure: 'redacted' as const,
  level: 'public' as const,
  gateReason: 'sign_in' as const,
  canOpenDetailPage: true,
  canAccessCrewSurfaces: false,
  mapPeekActions: [],
  entitlements: null,
};

describe('resolveActivityEngagementPolicy', () => {
  it('aligns guest peek intents with detail plan join footer', () => {
    const policy = resolveActivityEngagementPolicy({
      viewerAccess: guestAccess,
      isHostUser: false,
      activityPublished: true,
      participationMode: 'approval',
      requirements: ['Host approval required to join'],
      meetingLat: 25.1,
      meetingLng: 55.2,
      myParticipation: null,
      myRequest: null,
    });

    expect(policy.intents.map((i) => i.id)).toEqual(['request_join', 'view_detail']);
    expect(policy.presentation.footerByTab.plan).toBe('plan_join');
    expect(policy.capabilities.joinEngagement).toBe('open');
    expect(policy.strips.maskRosterToFriendsOnly).toBe(true);
    expect(policy.strips.pendingJoinInviteCount).toBe(0);
  });

  it('surfaces pending join-invite count on strips for host viewers', () => {
    const policy = resolveActivityEngagementPolicy({
      viewerAccess: {
        ...guestAccess,
        level: 'host',
        gateReason: null,
        canAccessCrewSurfaces: true,
      },
      isHostUser: true,
      activityPublished: true,
      participationMode: 'approval',
      requirements: ['Host approval required to join'],
      pendingJoinInviteCount: 2,
      myParticipation: null,
      myRequest: null,
    });
    expect(policy.strips.pendingJoinInviteCount).toBe(2);
  });

  it('exposes cancel request on map peek while join is pending', () => {
    const policy = resolveActivityEngagementPolicy({
      viewerAccess: {
        ...guestAccess,
        level: 'join_request',
        gateReason: null,
        canOpenDetailPage: true,
        canAccessCrewSurfaces: false,
      },
      isHostUser: false,
      activityPublished: true,
      participationMode: 'approval',
      joinRequestStatus: 'pending',
      myParticipation: null,
      myRequest: { status: 'pending', canWithdraw: true },
    });

    expect(policy.capabilities.joinEngagement).toBe('pending');
    expect(policy.intents.map((i) => i.id)).toEqual([
      'pending_join',
      'withdraw_join',
      'view_detail',
    ]);
  });

  it('exposes crew intents and detail invite footer for confirmed participants', () => {
    const policy = resolveActivityEngagementPolicy({
      viewerAccess: {
        ...guestAccess,
        level: 'participant',
        gateReason: null,
        canAccessCrewSurfaces: true,
        entitlements: {
          isProMember: true,
          canViewHostProfileBeforeJoin: true,
          canViewFullBuddyRoster: true,
          canOfferTransport: true,
          canAddLinkedRide: false,
          canMessageHostBeforeJoin: true,
          buddyUserIdsOnActivity: [],
        },
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

    expect(policy.intents.map((i) => i.id)).toEqual([
      'open_crew_chat',
      'invite_crew',
      'withdraw_join',
      'offer_rideshare',
      'view_detail',
    ]);
    expect(policy.presentation.footerByTab.buddies).toBe('plan_join');
    expect(policy.strips.showJoinedStatusChipOnPeek).toBe(true);
    expect(policy.strips.maskRosterToFriendsOnly).toBe(false);
  });

  it('projectActivityMapPeekActions merges message_host for entitled pre-join viewers', () => {
    const policy = resolveActivityEngagementPolicy({
      viewerAccess: {
        ...guestAccess,
        level: 'public',
        gateReason: null,
        entitlements: {
          isProMember: true,
          canViewHostProfileBeforeJoin: true,
          canViewFullBuddyRoster: true,
          canOfferTransport: false,
          canAddLinkedRide: false,
          canMessageHostBeforeJoin: true,
          buddyUserIdsOnActivity: [],
        },
      },
      isHostUser: false,
      activityPublished: true,
      myParticipation: null,
      myRequest: null,
    });

    const projected = projectActivityMapPeekActions(
      policy,
      policy.capabilities.canMessageHostBeforeJoin
        ? {
            isProMember: true,
            canViewHostProfileBeforeJoin: true,
            canViewFullBuddyRoster: true,
            canOfferTransport: false,
            canAddLinkedRide: false,
            canMessageHostBeforeJoin: true,
            buddyUserIdsOnActivity: [],
          }
        : null,
      'public'
    );

    expect(projected.map((a) => a.id)).toEqual([
      'request_join',
      'view_detail',
      'message_host',
    ]);
  });
});
