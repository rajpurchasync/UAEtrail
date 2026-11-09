import { computeActivityDetailExposure } from '@uaetrail/shared-types';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MembershipRole, RequestStatus } from '../src/domain/enums.js';

vi.mock('../src/lib/activity-engagement-store.js', () => ({
  findActivityParticipantByEventAndUser: vi.fn(),
  findActivityRequestByEventAndUser: vi.fn(),
}));

vi.mock('../src/lib/social-groups-store.js', () => ({
  findGroupByActivityId: vi.fn(),
  getGroupMembership: vi.fn(),
}));

vi.mock('../src/lib/tenant-access.js', () => ({
  findTenantMembershipContext: vi.fn(),
}));

vi.mock('../src/lib/activity-invites-store.js', () => ({
  findPendingActivityInviteForInvitee: vi.fn(),
}));

import {
  findActivityParticipantByEventAndUser,
  findActivityRequestByEventAndUser,
} from '../src/lib/activity-engagement-store.js';
import { findGroupByActivityId, getGroupMembership } from '../src/lib/social-groups-store.js';
import { findTenantMembershipContext } from '../src/lib/tenant-access.js';
import { findPendingActivityInviteForInvitee } from '../src/lib/activity-invites-store.js';
import { buildActivityViewerAccess } from '../src/services/activity-viewer-access.js';

const activity = {
  id: 'activity-1',
  tenantId: 'tenant-1',
  hostId: 'host-1',
  createdById: 'host-1',
  joinMode: 'private' as const,
  requirements: ['Private: group or invite only — approval required'],
};

describe('buildActivityViewerAccess', () => {
  beforeEach(() => {
    vi.mocked(findActivityParticipantByEventAndUser).mockResolvedValue(null);
    vi.mocked(findActivityRequestByEventAndUser).mockResolvedValue(null);
    vi.mocked(findGroupByActivityId).mockResolvedValue(null);
    vi.mocked(getGroupMembership).mockResolvedValue(null);
    vi.mocked(findTenantMembershipContext).mockResolvedValue(null);
    vi.mocked(findPendingActivityInviteForInvitee).mockResolvedValue(null);
  });

  it('redacts open map activities for guests', async () => {
    const access = await buildActivityViewerAccess({
      viewerUserId: null,
      activity: { ...activity, joinMode: 'open', requirements: ['Open: anyone can request to join'] },
    });

    expect(access.exposure).toBe('none');
    expect(access.canViewFullActivity).toBe(false);
    expect(access.canOpenDetailPage).toBe(false);
    expect(access.gateReason).toBe('sign_in');
    expect(access.level).toBe('public');
  });

  it('denies anonymous viewers of private activities', async () => {
    const access = await buildActivityViewerAccess({
      viewerUserId: null,
      activity,
    });

    expect(access.exposure).toBe('none');
    expect(access.canViewFullActivity).toBe(false);
    expect(access.canOpenDetailPage).toBe(false);
    expect(access.gateReason).toBe('invite_only');
    expect(access.level).toBe('denied');
  });

  it('allows the host to view a private activity', async () => {
    const access = await buildActivityViewerAccess({
      viewerUserId: 'host-1',
      activity,
    });

    expect(access.canViewFullActivity).toBe(true);
    expect(access.level).toBe('host');
  });

  it('allows waitlisted participants to view a private activity', async () => {
    vi.mocked(findActivityRequestByEventAndUser).mockResolvedValue({
      id: 'req-1',
      activityId: activity.id,
      userId: 'guest-1',
      status: RequestStatus.WAITLISTED,
      note: null,
      selectedPackageIndex: null,
      hostNote: null,
      cancelReason: null,
      cancelMessage: null,
      cancelledAt: null,
      reviewedById: null,
      reviewedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const access = await buildActivityViewerAccess({
      viewerUserId: 'guest-1',
      activity,
    });

    expect(access.canViewFullActivity).toBe(false);
    expect(access.exposure).toBe('redacted');
    expect(access.canAccessCrewSurfaces).toBe(false);
    expect(access.level).toBe('join_request');
  });

  it('allows activity group members to view a private activity', async () => {
    vi.mocked(findGroupByActivityId).mockResolvedValue({
      id: 'group-1',
      type: 'activity',
      name: 'Activity chat',
      adminUserId: 'host-1',
      activityId: activity.id,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(getGroupMembership).mockResolvedValue({
      id: 'member-1',
      groupId: 'group-1',
      userId: 'guest-2',
      role: 'buddy',
      memberType: 'adult',
      displayName: null,
      invitedEmail: null,
      createdByUserId: 'host-1',
      createdAt: new Date(),
      isActive: true,
    });

    const access = await buildActivityViewerAccess({
      viewerUserId: 'guest-2',
      activity,
    });

    expect(access.canViewFullActivity).toBe(false);
    expect(access.exposure).toBe('redacted');
    expect(access.canAccessCrewSurfaces).toBe(false);
    expect(access.level).toBe('activity_group_member');
  });

  it('denies private plans to signed-in members who were not invited', async () => {
    const access = await buildActivityViewerAccess({
      viewerUserId: 'member-with-link-1',
      activity,
    });

    expect(access.exposure).toBe('none');
    expect(access.canViewFullActivity).toBe(false);
    expect(access.canOpenDetailPage).toBe(false);
    expect(access.gateReason).toBe('invite_only');
    expect(access.level).toBe('denied');
  });

  it('lets privately invited members open the plan before they join', async () => {
    vi.mocked(findPendingActivityInviteForInvitee).mockResolvedValue({
      _id: 'inv-1',
      activityId: activity.id,
      fromUserId: 'host-1',
      toUserId: 'friend-1',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const access = await buildActivityViewerAccess({
      viewerUserId: 'friend-1',
      activity,
    });

    expect(access.canOpenDetailPage).toBe(true);
    expect(access.exposure).toBe('redacted');
    expect(access.canAccessCrewSurfaces).toBe(false);
    expect(access.level).toBe('join_request');
  });

  it('allows tenant staff to view a private activity', async () => {
    vi.mocked(findTenantMembershipContext).mockResolvedValue({
      role: MembershipRole.TENANT_ADMIN,
      tenant: { status: 'ACTIVE' as never },
    });

    const access = await buildActivityViewerAccess({
      viewerUserId: 'staff-1',
      activity,
    });

    expect(access.canViewFullActivity).toBe(true);
    expect(access.level).toBe('tenant_staff');
  });

  it('does not treat the creator as the host when someone else hosts', async () => {
    const access = await buildActivityViewerAccess({
      viewerUserId: 'creator-1',
      activity: { ...activity, hostId: 'host-1', hostUserId: 'host-1', createdById: 'creator-1' },
    });

    expect(access.level).not.toBe('host');
  });

  it('lets an accepted guide see the outing without host actions', async () => {
    const access = await buildActivityViewerAccess({
      viewerUserId: 'guide-1',
      activity: {
        ...activity,
        joinMode: 'open',
        requirements: ['Open: anyone can request to join'],
        guides: [{ userId: 'guide-1', status: 'accepted' }],
      },
    });

    expect(access.level).toBe('participant');
    expect(access.canAccessCrewSurfaces).toBe(true);
  });
});

describe('computeActivityDetailExposure (shared policy)', () => {
  it('redacts open map activities for guests', () => {
    const result = computeActivityDetailExposure({
      joinMode: 'open',
      level: 'public',
      viewerUserId: null,
    });
    expect(result.exposure).toBe('none');
    expect(result.canOpenDetailPage).toBe(false);
    expect(result.gateReason).toBe('sign_in');
  });
});

describe('join mode inference fallback', () => {
  it('treats legacy requirements text as private when joinMode is missing', async () => {
    const access = await buildActivityViewerAccess({
      viewerUserId: null,
      activity: {
        ...activity,
        joinMode: undefined,
        requirements: ['Private: group or invite only — approval required'],
      },
    });

    expect(access.joinMode).toBe('private');
    expect(access.canViewFullActivity).toBe(false);
  });
});
