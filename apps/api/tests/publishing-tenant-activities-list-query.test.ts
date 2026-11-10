import { describe, expect, it } from 'vitest';
import {
  parsePublishingListDate,
  publishingTenantActivitiesListQuerySchema,
} from '../src/lib/publishing-tenant-activities-list-query.js';

describe('publishingTenantActivitiesListQuerySchema', () => {
  it('parses date window + outside flag for plan hosting hub', () => {
    const parsed = publishingTenantActivitiesListQuerySchema.parse({
      page: '1',
      pageSize: '20',
      status: 'published',
      startAtGte: '2026-03-01',
      startAtLt: '2026-04-01',
      windowOutside: '1',
      upcomingFromToday: 'true',
      order: 'asc',
    });
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
    expect(parsed.status).toBe('published');
    expect(parsed.windowOutside).toBe(true);
    expect(parsed.upcomingFromToday).toBe(true);
  });

  it('parsePublishingListDate uses local calendar day', () => {
    const d = parsePublishingListDate('2026-03-10');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(10);
  });
});
