import { describe, expect, it } from 'vitest';
import {
  explorePeopleBrowseDiscoverQuotaLine,
  formatPeopleBrowseKindsList,
  peopleBrowseAvailabilityDateLine,
  peopleBrowseAvailabilitySchedule,
  peopleBrowseAvailabilitySentence,
  peopleBrowseAvailabilityWhenPhrase,
  peopleBrowseGoingCopyParts,
} from './explorePeopleBrowseCopy';

const NOW = new Date('2026-10-09T12:00:00');

describe('explorePeopleBrowseCopy', () => {
  it('formats kind lists naturally', () => {
    expect(formatPeopleBrowseKindsList(['Hiking'])).toBe('Hiking');
    expect(formatPeopleBrowseKindsList(['Hiking', 'Camping'])).toBe('Hiking and Camping');
    expect(formatPeopleBrowseKindsList(['Hiking', 'Camping', 'Events'])).toBe(
      'Hiking, Camping, and Events'
    );
  });

  it('narrates availability with one clear when-phrase (no stacked dates + weeks)', () => {
    expect(
      peopleBrowseAvailabilitySentence('Maya Hassan', ['Camping', 'Hiking'], [], NOW)
    ).toBe('Maya is available for Camping and Hiking soon.');

    expect(
      peopleBrowseAvailabilitySentence(
        'Maya Hassan',
        ['Camping', 'Hiking'],
        [{ startDate: '2026-10-10', endDate: '2026-10-13', timeBand: 'any' }],
        NOW
      )
    ).toBe('Maya is available for Camping and Hiking this week.');

    expect(
      peopleBrowseAvailabilitySentence(
        'Samira Khan',
        ['Hiking'],
        [{ startDate: '2026-10-12', endDate: '2026-10-15', timeBand: 'any' }],
        NOW
      )
    ).toBe('Samira is available for Hiking this week.');

    expect(
      peopleBrowseAvailabilityWhenPhrase(
        [
          { startDate: '2026-10-11', endDate: '2026-10-11', timeBand: 'any' },
          { startDate: '2026-10-14', endDate: '2026-10-14', timeBand: 'any' },
        ],
        NOW
      )
    ).toBeNull();
    expect(
      peopleBrowseAvailabilitySentence(
        'Omar Hassan',
        ['Hiking'],
        [
          { startDate: '2026-10-11', endDate: '2026-10-11', timeBand: 'any' },
          { startDate: '2026-10-14', endDate: '2026-10-14', timeBand: 'any' },
        ],
        NOW
      )
    ).toBe('Omar is available for Hiking.');
    expect(
      peopleBrowseAvailabilityDateLine([
        { startDate: '2026-10-11', endDate: '2026-10-11', timeBand: 'any' },
        { startDate: '2026-10-14', endDate: '2026-10-14', timeBand: 'any' },
      ])
    ).toMatch(/·/);

    const oneDay = peopleBrowseAvailabilitySchedule(
      [{ startDate: '2026-10-11', endDate: '2026-10-11', timeBand: 'morning' }],
      NOW
    );
    expect(oneDay.whenPhrase).toBe('this week');
    expect(
      peopleBrowseAvailabilityDateLine([
        { startDate: '2026-10-10', endDate: '2026-10-13', timeBand: 'any' },
      ])
    ).toMatch(/Oct/);

    const multiWeekRange = peopleBrowseAvailabilitySchedule(
      [{ startDate: '2026-10-11', endDate: '2026-10-25', timeBand: 'any' }],
      NOW
    );
    expect(multiWeekRange.whenPhrase).toBe('over the next few weeks');
  });

  it('explains discovery quota in plain language', () => {
    expect(
      explorePeopleBrowseDiscoverQuotaLine({
        windowDays: 30,
        limit: 3,
        used: 0,
        remaining: 3,
      })
    ).toBe('You can open up to 3 new profiles from Everyone this month.');

    expect(
      explorePeopleBrowseDiscoverQuotaLine({
        windowDays: 30,
        limit: 3,
        used: 2,
        remaining: 1,
      })
    ).toBe('1 profile open left this month (2 of 3 used).');

    expect(
      explorePeopleBrowseDiscoverQuotaLine({
        windowDays: 30,
        limit: 3,
        used: 3,
        remaining: 0,
      })
    ).toBe("You've used all 3 free profile opens this month.");
  });

  it('builds going copy parts', () => {
    const parts = peopleBrowseGoingCopyParts('Omar Hassan', {
      activityId: 'a1',
      exploreItemId: 'activity:a1',
      title: 'Shawka hike',
      date: '2026-10-11',
      time: null,
      role: 'joining',
    });
    expect(parts.prefix).toContain('Omar is going on');
    expect(parts.outingLabel).toBe('Shawka hike');
    expect(parts.suffix).toContain('on');
  });
});
