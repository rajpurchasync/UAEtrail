import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MembershipRole } from '../src/domain/enums.js';

vi.mock('../src/lib/activity-engagement-store.js', () => ({
  hostHasActiveJoinRequestFromUser: vi.fn(),
  hasParticipantToHostLink: vi.fn(),
  hasSharedActivityParticipation: vi.fn(),
  countPublishedActivitiesHostedByUser: vi.fn(),
}));

vi.mock('../src/lib/social-groups-store.js', () => ({
  usersShareActiveGroup: vi.fn(),
}));

vi.mock('../src/lib/buddy-store.js', () => ({
  areAcceptedBuddies: vi.fn(),
}));

import {
  hostHasActiveJoinRequestFromUser,
  hasParticipantToHostLink,
  hasSharedActivityParticipation,
  countPublishedActivitiesHostedByUser,
} from '../src/lib/activity-engagement-store.js';
import { usersShareActiveGroup } from '../src/lib/social-groups-store.js';
import { areAcceptedBuddies } from '../src/lib/buddy-store.js';
import {
  resolveProfileViewerAccess,
  shouldHideFromMapMemberDiscovery,
} from '../src/services/profile-viewer-access.js';

const host = 'host-1';
const attendeeA = 'attendee-a';
const attendeeB = 'attendee-b';
const privateUser = 'private-user';

describe('resolveProfileViewerAccess', () => {
  beforeEach(() => {
    vi.mocked(hostHasActiveJoinRequestFromUser).mockResolvedValue(false);
    vi.mocked(hasParticipantToHostLink).mockResolvedValue(false);
    vi.mocked(hasSharedActivityParticipation).mockResolvedValue(false);
    vi.mocked(usersShareActiveGroup).mockResolvedValue(false);
    vi.mocked(areAcceptedBuddies).mockResolvedValue(false);
  });

  it('denies unrelated viewers of a private profile', async () => {
    const access = await resolveProfileViewerAccess({
      viewerUserId: attendeeA,
      targetUserId: privateUser,
      targetVisibility: 'private',
    });

    expect(access.canViewFullProfile).toBe(false);
    expect(access.level).toBe('denied');
  });

  it('allows accepted co-participants to view a private profile', async () => {
    vi.mocked(hasSharedActivityParticipation).mockResolvedValue(true);

    const access = await resolveProfileViewerAccess({
      viewerUserId: attendeeA,
      targetUserId: privateUser,
      targetVisibility: 'private',
    });

    expect(access.canViewFullProfile).toBe(true);
    expect(access.level).toBe('activity_participant');
  });

  it('allows friends (shared social group) to view a private profile', async () => {
    vi.mocked(usersShareActiveGroup).mockResolvedValue(true);

    const access = await resolveProfileViewerAccess({
      viewerUserId: attendeeA,
      targetUserId: privateUser,
      targetVisibility: 'private',
    });

    expect(access.canViewFullProfile).toBe(true);
    expect(access.level).toBe('group_member');
  });

  it('allows accepted buddies to view a private profile', async () => {
    vi.mocked(areAcceptedBuddies).mockResolvedValue(true);

    const access = await resolveProfileViewerAccess({
      viewerUserId: attendeeA,
      targetUserId: privateUser,
      targetVisibility: 'private',
    });

    expect(access.canViewFullProfile).toBe(true);
    expect(access.level).toBe('accepted_buddy');
  });

  it('allows the activity host to view a private join requester', async () => {
    vi.mocked(hostHasActiveJoinRequestFromUser).mockResolvedValue(true);

    const access = await resolveProfileViewerAccess({
      viewerUserId: host,
      targetUserId: privateUser,
      targetVisibility: 'private',
    });

    expect(access.canViewFullProfile).toBe(true);
    expect(access.level).toBe('host_of_activity');
  });

  it('allows the activity host to view an approved private participant', async () => {
    vi.mocked(hasParticipantToHostLink).mockResolvedValue(true);

    const access = await resolveProfileViewerAccess({
      viewerUserId: host,
      targetUserId: privateUser,
      targetVisibility: 'private',
    });

    expect(access.canViewFullProfile).toBe(true);
    expect(access.level).toBe('host_of_activity');
    expect(hasParticipantToHostLink).toHaveBeenCalledWith({
      hostUserId: host,
      participantUserId: privateUser,
      organizerRoles: expect.arrayContaining([MembershipRole.TENANT_OWNER]),
    });
  });

  it('allows platform admin regardless of visibility', async () => {
    const access = await resolveProfileViewerAccess({
      viewerUserId: attendeeA,
      targetUserId: privateUser,
      targetVisibility: 'private',
      isPlatformAdmin: true,
    });

    expect(access.canViewFullProfile).toBe(true);
    expect(access.level).toBe('platform_admin');
  });

  it('denies guests on public profiles', async () => {
    const access = await resolveProfileViewerAccess({
      viewerUserId: null,
      targetUserId: attendeeB,
      targetVisibility: 'public',
    });

    expect(access.canViewFullProfile).toBe(false);
    expect(access.level).toBe('denied');
  });

  it('allows signed-in strangers public visibility without full profile flag', async () => {
    const access = await resolveProfileViewerAccess({
      viewerUserId: attendeeA,
      targetUserId: attendeeB,
      targetVisibility: 'public',
    });

    expect(access.level).toBe('public');
    expect(access.canViewFullProfile).toBe(false);
  });

  it('allows group co-members when visibility is group_members', async () => {
    vi.mocked(usersShareActiveGroup).mockResolvedValue(true);

    const access = await resolveProfileViewerAccess({
      viewerUserId: attendeeA,
      targetUserId: attendeeB,
      targetVisibility: 'group_members',
    });

    expect(access.canViewFullProfile).toBe(true);
    expect(access.level).toBe('group_member');
  });
});

describe('shouldHideFromMapMemberDiscovery', () => {
  beforeEach(() => {
    vi.mocked(countPublishedActivitiesHostedByUser).mockResolvedValue(0);
  });

  it('hides private users with no hosted activities from member discovery', async () => {
    expect(await shouldHideFromMapMemberDiscovery('user-1', 'private')).toBe(true);
  });

  it('does not hide private hosts who still appear on activity cards', async () => {
    vi.mocked(countPublishedActivitiesHostedByUser).mockResolvedValue(2);
    expect(await shouldHideFromMapMemberDiscovery('host-1', 'private')).toBe(false);
  });

  it('does not hide public profiles', async () => {
    expect(await shouldHideFromMapMemberDiscovery('user-1', 'public')).toBe(false);
  });
});
