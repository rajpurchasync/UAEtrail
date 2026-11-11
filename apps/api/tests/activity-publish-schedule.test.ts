import { describe, expect, it } from 'vitest';
import { resolvePublishedActivityEndAt } from '../src/lib/activity-publish-schedule.js';

describe('activity-publish-schedule', () => {
  it('stores same-day endTime on start date', () => {
    const endAt = resolvePublishedActivityEndAt(
      { date: '2026-11-10', time: '09:00', endTime: '18:00' },
      'AE'
    );
    expect(endAt).toBeDefined();
    expect(endAt?.toISOString()).toContain('2026-11-10');
  });

  it('stores multi-day endAt on end date', () => {
    const endAt = resolvePublishedActivityEndAt(
      { date: '2026-11-10', time: '09:00', endDate: '2026-11-12', endTime: '18:00' },
      'AE'
    );
    expect(endAt).toBeDefined();
    expect(endAt?.toISOString()).toContain('2026-11-12');
  });
});
