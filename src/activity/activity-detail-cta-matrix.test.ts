/**
 * Dynamic CTA matrix — runtime fixtures (AD-CTA-01). Source of truth: shared-types policy + these tests.
 * @see docs/SYSTEM_COHERENCE.md §6.2 (narrative); not experiment plan markdown.
 */
import { describe, expect, it } from 'vitest';
import {
  computeActivityViewerEntitlements,
  projectActivityMapPeekActions,
  resolveActivityEngagementPolicy,
  APPROVAL_PARTICIPATION_REQUIREMENT,
  RSVP_PARTICIPATION_REQUIREMENT,
  type ActivityViewerAccessDTO,
} from '@uaetrail/shared-types';

describe('activity detail CTA matrix — runtime (AD-CTA-01)', () => {
  const meeting = { meetingLat: 25.1, meetingLng: 55.2 };

  const viewerAccess = (
    level: ActivityViewerAccessDTO['level'],
    entitlements: ReturnType<typeof computeActivityViewerEntitlements>,
    canAccessCrewSurfaces: boolean
  ): ActivityViewerAccessDTO => ({
    exposure: canAccessCrewSurfaces ? 'full' : 'redacted',
    level,
    gateReason: null,
    canOpenDetailPage: true,
    canAccessCrewSurfaces,
    mapPeekActions: [],
    entitlements,
  });

  const peekIds = (
    policy: ReturnType<typeof resolveActivityEngagementPolicy>,
    entitlements: ReturnType<typeof computeActivityViewerEntitlements> | null,
    level: ActivityViewerAccessDTO['level']
  ) => projectActivityMapPeekActions(policy, entitlements, level).map((a) => a.id);

  it('AD-CTA-01:A-pre-crew-free peek footer matches detail for fixture state', () => {
    const entitlements = computeActivityViewerEntitlements({
      isProMember: false,
      isFriendOfHost: false,
      level: 'public',
      canAccessCrewSurfaces: false,
      friendUserIdsOnActivity: [],
    });
    const policy = resolveActivityEngagementPolicy({
      ...meeting,
      viewerAccess: viewerAccess('public', entitlements, false),
      isHostUser: false,
      activityPublished: true,
      participationMode: 'approval',
      requirements: [APPROVAL_PARTICIPATION_REQUIREMENT],
      myParticipation: null,
      myRequest: null,
    });

    expect(peekIds(policy, entitlements, 'public')).toEqual(['request_join', 'view_detail']);
    expect(policy.presentation.footerByTab.plan).toBe('plan_join');
    expect(policy.strips.maskRosterToFriendsOnly).toBe(true);
    expect(policy.strips.showJoinedStatusChipOnPeek).toBe(false);
  });

  it('AD-CTA-01:B-pre-crew-pro peek footer matches detail for fixture state', () => {
    const entitlements = computeActivityViewerEntitlements({
      isProMember: true,
      isFriendOfHost: false,
      level: 'public',
      canAccessCrewSurfaces: false,
      friendUserIdsOnActivity: [],
    });
    const policy = resolveActivityEngagementPolicy({
      ...meeting,
      viewerAccess: viewerAccess('public', entitlements, false),
      isHostUser: false,
      activityPublished: true,
      participationMode: 'approval',
      requirements: [APPROVAL_PARTICIPATION_REQUIREMENT],
      myParticipation: null,
      myRequest: null,
    });

    expect(peekIds(policy, entitlements, 'public')).toEqual([
      'request_join',
      'view_detail',
      'message_host',
    ]);
    expect(policy.presentation.footerByTab.plan).toBe('plan_join');
    expect(policy.strips.maskRosterToFriendsOnly).toBe(false);
    expect(policy.capabilities.canViewHostProfileBeforeJoin).toBe(true);
  });

  it('AD-CTA-01:C-in-crew-participant peek footer matches detail for fixture state', () => {
    const entitlements = computeActivityViewerEntitlements({
      isProMember: true,
      isFriendOfHost: false,
      level: 'participant',
      canAccessCrewSurfaces: true,
      friendUserIdsOnActivity: [],
    });
    const policy = resolveActivityEngagementPolicy({
      ...meeting,
      viewerAccess: viewerAccess('participant', entitlements, true),
      isHostUser: false,
      activityPublished: true,
      participationMode: 'rsvp',
      requirements: [RSVP_PARTICIPATION_REQUIREMENT],
      myParticipation: { participantId: 'p1' },
      myRequest: null,
    });

    expect(peekIds(policy, entitlements, 'participant')).toEqual([
      'open_crew_chat',
      'invite_crew',
      'withdraw_join',
      'offer_rideshare',
      'view_detail',
    ]);
    expect(policy.presentation.footerByTab.crew).toBe('plan_join');
    expect(policy.strips.showJoinedStatusChipOnPeek).toBe(true);
    expect(policy.strips.showOfferRideInLogistics).toBe(true);
  });

  it('AD-CTA-01:D-host-empty peek footer matches detail for fixture state', () => {
    const entitlements = computeActivityViewerEntitlements({
      isProMember: true,
      isFriendOfHost: false,
      level: 'host',
      canAccessCrewSurfaces: true,
      friendUserIdsOnActivity: [],
    });
    const policy = resolveActivityEngagementPolicy({
      ...meeting,
      viewerAccess: viewerAccess('host', entitlements, true),
      isHostUser: true,
      activityPublished: true,
      participationMode: 'rsvp',
      requirements: [RSVP_PARTICIPATION_REQUIREMENT],
      myParticipation: null,
      myRequest: null,
    });

    expect(peekIds(policy, entitlements, 'host')).toEqual([
      'share_activity',
      'manage_activity',
      'link_rideshare',
      'view_detail',
    ]);
    expect(policy.presentation.footerByTab.plan).toBe('plan_host_share');
    expect(policy.strips.showHostSelfProfileLink).toBe(true);
    expect(policy.strips.showJoinedStatusChipOnPeek).toBe(false);
  });

  it('AD-CTA-01:E-host-with-joiners peek footer matches detail for fixture state', () => {
    const entitlements = computeActivityViewerEntitlements({
      isProMember: true,
      isFriendOfHost: false,
      level: 'host',
      canAccessCrewSurfaces: true,
      friendUserIdsOnActivity: ['u-joiner'],
    });
    const policy = resolveActivityEngagementPolicy({
      ...meeting,
      viewerAccess: viewerAccess('host', entitlements, true),
      isHostUser: true,
      activityPublished: true,
      participationMode: 'rsvp',
      requirements: [RSVP_PARTICIPATION_REQUIREMENT],
      myParticipation: null,
      myRequest: null,
      confirmedParticipantCount: 2,
    });

    const peek = peekIds(policy, entitlements, 'host');
    expect(peek).toEqual([
      'open_crew_chat',
      'share_activity',
      'manage_activity',
      'link_rideshare',
      'view_detail',
    ]);
    expect(policy.presentation.footerByTab.plan).toBe('plan_host_share');
  });
});
