import { describe, expect, it } from 'vitest';
import {
  buildMemberBrowseRowFromAvailability,
  buildMemberBrowseRowFromGoing,
  buildMemberBrowseRowFromRosterAvailability,
  buildMemberBrowseRowsFromDirectory,
  filterAvailabilityByCapacity,
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
      kinds: ['hiking'],
      slots: [{ startDate: '2026-10-10', endDate: '2026-10-12' }],
      isBuddy: false,
    });
    expect(row.profileHref).toBe('/member/u1?source=available');
    expect(row.profileHref).not.toContain('discover=1');
  });

  it('filters guide capacity on availability roster (not legacy kinds)', () => {
    const people = [
      {
        userId: 'g1',
        displayName: 'Guide',
        kinds: ['hiking'] as const,
        slots: [
          {
            startDate: '2026-11-01',
            endDate: '2026-11-01',
            capacity: 'guide' as const,
            modalities: ['hiking'] as const,
          },
        ],
        isBuddy: false,
      },
      {
        userId: 'p1',
        displayName: 'Pat',
        kinds: ['hiking'] as const,
        slots: [{ startDate: '2026-11-02', endDate: '2026-11-02', capacity: 'participant' as const }],
        isBuddy: false,
      },
      {
        userId: 'stale',
        displayName: 'Stale kinds',
        kinds: ['guide'] as const,
        slots: [{ startDate: '2026-11-03', endDate: '2026-11-03', capacity: 'participant' as const }],
        isBuddy: false,
      },
    ];
    expect(filterAvailabilityByCapacity(people, 'guide').map((p) => p.userId)).toEqual(['g1']);
    const row = buildMemberBrowseRowFromAvailability(people[0]!);
    expect(row.badge?.label).toBe('Guide');

    const withTerms = buildMemberBrowseRowFromAvailability({
      ...people[0]!,
      slots: [
        {
          startDate: '2026-11-01',
          endDate: '2026-11-01',
          capacity: 'guide',
          modalities: ['hiking'],
          engagementTerms: { pricingKind: 'free', tourShape: 'private' },
        },
      ],
    });
    expect(withTerms.footnote).toBe('Free · Private');
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

  it('maps availability roster rows to host lens + map action', () => {
    const row = buildMemberBrowseRowFromRosterAvailability({
      userId: 'h1',
      displayName: 'Host',
      avatarUrl: null,
      availabilityTitle: 'Hike crew',
      exploreItemId: 'availability:h1:slot-1',
    });
    expect(row.profileHref).toBe('/member/h1?source=host');
    expect(row.actionHref).toMatch(/pin=availability(%3A|:)h1/);
  });
});
