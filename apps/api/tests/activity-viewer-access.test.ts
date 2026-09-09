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

import {
  findActivityParticipantByEventAndUser,
  findActivityRequestByEventAndUser,
} from '../src/lib/activity-engagement-store.js';
import { findGroupByActivityId, getGroupMembership } from '../src/lib/social-groups-store.js';
import { findTenantMembershipContext } from '../src/lib/tenant-access.js';
import {
  resolveActivityViewerAccess,
} from '../src/services/activity-viewer-access.js';

const activity = {
  id: 'activity-1',
  tenantId: 'tenant-1',
  hostId: 'host-1',
  createdById: 'host-1',
  joinMode: 'private' as const,
  requirements: ['Private: group or invite only — approval required'],
};

describe('resolveActivityViewerAccess', () => {
  beforeEach(() => {
    vi.mocked(findActivityParticipantByEventAndUser).mockResolvedValue(null);
    vi.mocked(findActivityRequestByEventAndUser).mockResolvedValue(null);
    vi.mocked(findGroupByActivityId).mockResolvedValue(null);
    vi.mocked(getGroupMembership).mockResolvedValue(null);
    vi.mocked(findTenantMembershipContext).mockResolvedValue(null);
  });

  it('allows anyone to view open activities', async () => {
    const access = await resolveActivityViewerAccess({
      viewerUserId: null,
      activity: { ...activity, joinMode: 'open', requirements: ['Open: anyone can request to join'] },
    });

    expect(access.canViewFullActivity).toBe(true);
    expect(access.level).toBe('public');
  });

  it('denies anonymous viewers of private activities', async () => {
    const access = await resolveActivityViewerAccess({
      viewerUserId: null,
      activity,
    });

    expect(access.canViewFullActivity).toBe(false);
    expect(access.level).toBe('denied');
  });

  it('allows the host to view a private activity', async () => {
    const access = await resolveActivityViewerAccess({
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
      organizerNote: null,
      cancelReason: null,
      cancelMessage: null,
      cancelledAt: null,
      reviewedById: null,
      reviewedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const access = await resolveActivityViewerAccess({
      viewerUserId: 'guest-1',
      activity,
    });

    expect(access.canViewFullActivity).toBe(true);
    expect(access.level).toBe('join_request');
  });

  it('allows activity group members to view a private activity', async () => {
    vi.mocked(findGroupByActivityId).mockResolvedValue({
      id: 'group-1',
      type: 'activity',
      name: 'Trip chat',
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

    const access = await resolveActivityViewerAccess({
      viewerUserId: 'guest-2',
      activity,
    });

    expect(access.canViewFullActivity).toBe(true);
    expect(access.level).toBe('activity_group_member');
  });

  it('allows tenant staff to view a private activity', async () => {
    vi.mocked(findTenantMembershipContext).mockResolvedValue({
      role: MembershipRole.TENANT_ADMIN,
      tenant: { status: 'ACTIVE' as never },
    });

    const access = await resolveActivityViewerAccess({
      viewerUserId: 'staff-1',
      activity,
    });

    expect(access.canViewFullActivity).toBe(true);
    expect(access.level).toBe('tenant_staff');
  });
});

describe('join mode inference fallback', () => {
  it('treats legacy requirements text as private when joinMode is missing', async () => {
    const access = await resolveActivityViewerAccess({
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
