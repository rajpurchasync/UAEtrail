/**
 * Locks the dynamic CTA product spec in docs before implementation (AD-ARCH-04, AD-CTA-01).
 * @see docs/experiment/activity-detail-tabs-implementation-plan.md §6
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  computeActivityViewerEntitlements,
  projectActivityMapPeekActions,
  resolveActivityEngagementPolicy,
  RSVP_PARTICIPATION_REQUIREMENT,
  type ActivityViewerAccessDTO,
} from '@uaetrail/shared-types';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

const PROGRAM_DOC = 'docs/experiment/activity-detail-tabs-implementation-plan.md';

describe('activity detail CTA matrix — doc governance (AD-ARCH-04)', () => {
  const plan = () => read(PROGRAM_DOC);

  it('program doc contains full §6 dynamic CTA spec', () => {
    const doc = plan();
    expect(doc).toMatch(/## 6\. Dynamic CTAs/);
    expect(doc).toMatch(/### 6\.0 Activity peek layout/);
    expect(doc).toMatch(/### 6\.2 State matrix/);
    expect(doc).toMatch(/#### A — General participant/);
    expect(doc).toMatch(/#### B — \*\*Pro\*\* participant/);
    expect(doc).toMatch(/#### C — General participant, \*\*after\*\*/);
    expect(doc).toMatch(/#### D — Host, published, \*\*no joiners\*\*/);
    expect(doc).toMatch(/#### E — Host, published, \*\*with joiners\*\*/);
    expect(doc).toMatch(/### 6\.2\.1 Cross-cutting rules/);
    expect(doc).toMatch(/### 6\.2\.2 Member profile CTAs/);
    expect(doc).toMatch(/### 6\.2\.3 Host manage surface/);
    expect(doc).toMatch(/### 6\.2\.4 Peek ↔ detail parity checklist/);
    expect(doc).toMatch(/### 6\.3 Wire action vocabulary/);
    expect(doc).toMatch(/### 6\.7 Implementation sequence/);
    expect(doc).toMatch(/share_activity/);
    expect(doc).toMatch(/manage_activity/);
    expect(doc).toMatch(/withdraw_join/);
    expect(doc).toMatch(/offer_rideshare/);
  });

  it('decisions D16–D18 reference dynamic CTA matrix', () => {
    const doc = plan();
    expect(doc).toMatch(/\| D16 \|/);
    expect(doc).toMatch(/\| D17 \|/);
    expect(doc).toMatch(/\| D18 \|/);
  });
});

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
      buddyUserIdsOnActivity: [],
    });
    const policy = resolveActivityEngagementPolicy({
      ...meeting,
      viewerAccess: viewerAccess('public', entitlements, false),
      isHostUser: false,
      activityPublished: true,
      participationMode: 'approval',
      requirements: ['Host approval required to join'],
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
      buddyUserIdsOnActivity: [],
    });
    const policy = resolveActivityEngagementPolicy({
      ...meeting,
      viewerAccess: viewerAccess('public', entitlements, false),
      isHostUser: false,
      activityPublished: true,
      participationMode: 'approval',
      requirements: ['Host approval required to join'],
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
      buddyUserIdsOnActivity: [],
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
    expect(policy.presentation.footerByTab.buddies).toBe('plan_join');
    expect(policy.strips.showJoinedStatusChipOnPeek).toBe(true);
    expect(policy.strips.showOfferRideInLogistics).toBe(true);
  });

  it('AD-CTA-01:D-host-empty peek footer matches detail for fixture state', () => {
    const entitlements = computeActivityViewerEntitlements({
      isProMember: true,
      isFriendOfHost: false,
      level: 'host',
      canAccessCrewSurfaces: true,
      buddyUserIdsOnActivity: [],
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
      buddyUserIdsOnActivity: ['u-joiner'],
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
