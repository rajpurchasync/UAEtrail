import { describe, expect, it } from 'vitest';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { activityForecastIsoDates } from './activityForecastDates';

describe('activityForecastIsoDates', () => {
  it('returns start only when no end date', () => {
    const activity = { date: '2026-11-12' } as ActivityDetailDTO;
    expect(activityForecastIsoDates(activity)).toEqual(['2026-11-12']);
  });

  it('returns inclusive range when multi-day', () => {
    const activity = { date: '2026-11-12', endDate: '2026-11-14' } as ActivityDetailDTO;
    expect(activityForecastIsoDates(activity)).toEqual(['2026-11-12', '2026-11-13', '2026-11-14']);
  });
});
