import { describe, expect, it } from 'vitest';
import {
  availabilityMatchesFindCrewSearchDates,
  crewBrowseAvailabilityDetailFromPerson,
  crewBrowseAvailabilityDetailFromSlots,
  crewBrowseAvailabilitySocialLabel,
  crewBrowseAvailabilityDateWindows,
  findCrewTrustBadgesFromProfileRole,
  sortAvailabilityPeopleNetworkFirst,
} from './availabilityBrowseCardCopy';

describe('availabilityBrowseCardCopy', () => {
  it('separates activity modalities from flexible schedule kind', () => {
    const slots = [
      {
        startDate: '2026-11-01',
        endDate: '2026-11-03',
        capacity: 'participant' as const,
        modalities: ['hiking', 'camping'] as const,
        scheduleKind: 'open' as const,
      },
      {
        startDate: '2026-11-05',
        endDate: '2026-11-05',
        capacity: 'guide' as const,
        modalities: ['hiking'] as const,
        scheduleKind: 'open' as const,
      },
    ];
    const detail = crewBrowseAvailabilityDetailFromSlots(slots, [], {
      region: 'Dubai',
      destinationSlug: null,
    });
    expect(detail).not.toBeNull();
    expect(detail!.forLabels).toEqual(['Hiking', 'Camping']);
    expect(detail!.forLabels).not.toContain('Open');
    expect(detail!.areaLabels).toEqual(['Dubai']);
    expect(detail!.dateWindows).toHaveLength(2);
    expect(detail!.dateWindows[0]?.text).toMatch(/^Flexible · /);
  });

  it('maps pro and verified trust badges from profile role', () => {
    expect(findCrewTrustBadgesFromProfileRole('professional_guide')).toEqual(['pro', 'verified']);
    expect(findCrewTrustBadgesFromProfileRole('host')).toEqual(['verified']);
    expect(findCrewTrustBadgesFromProfileRole('community_member')).toEqual([]);
  });

  it('shows any activity when no modalities are set', () => {
    const detail = crewBrowseAvailabilityDetailFromPerson({
      kinds: [],
      region: null,
      destinationSlug: null,
      slots: [
        {
          startDate: '2026-11-01',
          endDate: '2026-11-03',
          capacity: 'participant',
          scheduleKind: 'open',
        },
      ],
    });
    expect(detail?.activityOpen).toBe(true);
    expect(detail?.for).toBe('Any activity');
    expect(detail?.areaLabels).toEqual(['Open to areas']);
  });

  it('builds one date line per distinct slot window', () => {
    const windows = crewBrowseAvailabilityDateWindows([
      { startDate: '2026-11-01', endDate: '2026-11-03', capacity: 'participant', scheduleKind: 'open' },
      { startDate: '2026-11-10', endDate: '2026-11-10', capacity: 'participant', scheduleKind: 'fixed' },
    ]);
    expect(windows).toHaveLength(2);
    expect(windows[0]?.kind).toBe('flexible');
    expect(windows[1]?.kind).toBe('fixed');
  });

  it('labels friend before followed and sorts network first', () => {
    const followed = new Set(['f2']);
    expect(crewBrowseAvailabilitySocialLabel({ userId: 'f1', isFriend: true }, followed)).toBe('Friend');
    const sorted = sortAvailabilityPeopleNetworkFirst(
      [
        { userId: 'x', displayName: 'Zoe', kinds: [], slots: [], isFriend: false },
        { userId: 'f2', displayName: 'Followed', kinds: [], slots: [], isFriend: false },
        { userId: 'f1', displayName: 'Buddy', kinds: [], slots: [], isFriend: true },
      ],
      followed
    );
    expect(sorted.map((p) => p.userId)).toEqual(['f1', 'f2', 'x']);
  });

  it('flags date overlap only when search when is set', () => {
    const slots = [{ startDate: '2026-11-26', endDate: '2026-11-28', capacity: 'participant' as const }];
    expect(availabilityMatchesFindCrewSearchDates(slots, 'anyday')).toBe(false);
    expect(availabilityMatchesFindCrewSearchDates(slots, 'week')).toBeTypeOf('boolean');
  });
});