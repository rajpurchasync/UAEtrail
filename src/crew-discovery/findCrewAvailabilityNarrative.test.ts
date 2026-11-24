import { describe, expect, it } from 'vitest';
import { crewBrowseAvailabilityDetailFromPerson } from './availabilityBrowseCardCopy';
import { findCrewAvailabilityNarrativeFromDetail } from './findCrewAvailabilityNarrative';

describe('findCrewAvailabilityNarrative', () => {
  it('bold activity headline sits separate from hiking detail (Omar-style)', () => {
    const slots = [
      {
        startDate: '2026-11-24',
        endDate: '2026-11-30',
        capacity: 'participant' as const,
        modalities: ['hiking'] as const,
        scheduleKind: 'open' as const,
      },
    ];
    const detail = crewBrowseAvailabilityDetailFromPerson({
      kinds: ['hiking'],
      region: 'Ras Al Khaimah',
      areaSlug: null,
      slots,
    });
    const narrative = findCrewAvailabilityNarrativeFromDetail(detail!, slots);
    expect(narrative.activity.headline).toBe('Available to go');
    expect(narrative.activity.detail).toMatch(/Hiking/);
    expect(narrative.destinationValues).toEqual(['Ras Al Khaimah']);
    expect(narrative.dateRows[0]?.scheduleLabel).toBe('Flexible');
  });

  it('prefers slot destinationRegions over doc region', () => {
    const slots = [
      {
        startDate: '2026-11-01',
        endDate: '2026-11-03',
        capacity: 'participant' as const,
        modalities: ['hiking'] as const,
        scheduleKind: 'open' as const,
        destinationRegions: ['Dubai', 'Sharjah'],
      },
    ];
    const detail = crewBrowseAvailabilityDetailFromPerson({
      kinds: ['hiking'],
      region: 'Ajman',
      areaSlug: null,
      slots,
    });
    const narrative = findCrewAvailabilityNarrativeFromDetail(detail!, slots);
    expect(narrative.destinationValues).toEqual(['Dubai', 'Sharjah']);
  });

  it('lists multiple destinations and date windows', () => {
    const slots = [
      {
        startDate: '2026-11-01',
        endDate: '2026-11-03',
        capacity: 'participant' as const,
        modalities: ['hiking', 'camping'] as const,
        scheduleKind: 'open' as const,
      },
      {
        startDate: '2026-11-10',
        endDate: '2026-11-10',
        capacity: 'participant' as const,
        modalities: ['hiking'] as const,
        scheduleKind: 'fixed' as const,
      },
    ];
    const detail = crewBrowseAvailabilityDetailFromPerson({
      kinds: ['hiking', 'camping'],
      region: 'Dubai',
      areaSlug: 'sharjah',
      slots,
    });
    const narrative = findCrewAvailabilityNarrativeFromDetail(detail!, slots);
    expect(narrative.destinationValues.length).toBeGreaterThanOrEqual(2);
    expect(narrative.dateRows.length).toBe(2);
    expect(narrative.dateRows[0]?.scheduleLabel).toBe('Flexible');
    expect(narrative.dateRows[1]?.scheduleLabel).toBe('Fixed');
  });

  it('projects logistics line from slot wire', () => {
    const slots = [
      {
        startDate: '2026-11-26',
        endDate: '2026-11-26',
        capacity: 'participant' as const,
        modalities: ['hiking'] as const,
        scheduleKind: 'fixed' as const,
        partySize: 2,
        transportMode: 'needs_carpool' as const,
        carpoolSeatsNeeded: 2,
      },
    ];
    const detail = crewBrowseAvailabilityDetailFromPerson({
      kinds: ['hiking'],
      region: 'Dubai',
      areaSlug: null,
      slots,
    });
    const narrative = findCrewAvailabilityNarrativeFromDetail(detail!, slots);
    expect(narrative.logisticsLine).toBe('Party of 2 · Needs carpool · 2 seats');
  });

  it('uses From / To for rideshare slots', () => {
    const slots = [
      {
        startDate: '2026-11-26',
        endDate: '2026-11-26',
        capacity: 'participant' as const,
        modalities: ['rideshare'] as const,
        scheduleKind: 'fixed' as const,
        title: 'Dubai → Hatta',
      },
    ];
    const detail = crewBrowseAvailabilityDetailFromPerson({
      kinds: ['rideshare'],
      region: 'Dubai',
      areaSlug: 'dubai',
      slots,
    });
    const narrative = findCrewAvailabilityNarrativeFromDetail(detail!, slots);
    expect(narrative.activity.headline).toMatch(/rideshare/i);
    expect(narrative.destinationLabel).toBe('From');
    expect(narrative.destinationValues[0]).toBe('Dubai');
    expect(narrative.toValue).toBe('Hatta');
  });
});