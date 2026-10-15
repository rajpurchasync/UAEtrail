import { describe, expect, it } from 'vitest';
import {
  buildMemberBrowseRowFromAvailability,
  buildMemberBrowseRowFromGoing,
  buildMemberBrowseRowsFromDirectory,
  buildMemberBrowseRowFromSeeking,
  filterDirectoryBrowseCards,
} from './memberBrowseRowModel';

describe('memberBrowseRowModel', () => {
  it('filters directory cards already shown on Going tab', () => {
    const directory = [
      { id: 'a', displayName: 'A', avatarUrl: null, city: null },
      { id: 'b', displayName: 'B', avatarUrl: null, city: null },
    ];
    const friendsGoing = [
      {
        userId: 'a',
        displayName: 'A',
        avatarUrl: null,
        cityLabel: null,
        activitiesAttended: 0,
        relationship: 'friend' as const,
        buddyRequestState: 'none' as const,
        canMessage: true,
        canSendBuddyRequest: false,
        upcomingTrip: null,
      },
    ];
    expect(filterDirectoryBrowseCards(directory, friendsGoing, [])).toEqual([directory[1]]);
  });

  it('tags availability rows without discover quota', () => {
    const row = buildMemberBrowseRowFromAvailability({
      userId: 'u1',
      displayName: 'Sam',
      kinds: ['hike'],
      slots: [{ startDate: '2026-10-10', endDate: '2026-10-12' }],
      isBuddy: false,
    });
    expect(row.profileHref).toBe('/member/u1?source=available');
    expect(row.profileHref).not.toContain('discover=1');
  });

  it('tags directory rows with discover lens', () => {
    const rows = buildMemberBrowseRowsFromDirectory({
      directory: [{ id: 'u2', displayName: 'Zoe', avatarUrl: null, city: 'Dubai' }],
      friendsGoing: [],
      hostsGoing: [],
      quota: { windowDays: 30, limit: 3, used: 0, remaining: 3 },
    });
    expect(rows[0]?.profileHref).toContain('discover=1');
  });

  it('maps going rows to friends lens', () => {
    const row = buildMemberBrowseRowFromGoing({
      userId: 'f1',
      displayName: 'Friend',
      avatarUrl: null,
      cityLabel: null,
      activitiesAttended: 1,
      relationship: 'friend',
      buddyRequestState: 'none',
      canMessage: true,
      canSendBuddyRequest: false,
      upcomingTrip: null,
    });
    expect(row.profileHref).toBe('/member/f1?source=friends');
  });

  it('maps seeking rows to host lens + map action', () => {
    const row = buildMemberBrowseRowFromSeeking({
      userId: 'h1',
      displayName: 'Host',
      avatarUrl: null,
      participantIntentId: 'pi1',
      seekingTitle: 'Hike crew',
      exploreItemId: 'activity:act1',
    });
    expect(row.profileHref).toBe('/member/h1?source=host');
    expect(row.actionHref).toMatch(/pin=activity(%3A|:)act1/);
  });
});
