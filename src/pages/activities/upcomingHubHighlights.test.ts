import { describe, expect, it } from 'vitest';
import { buildUpcomingHubHighlights, UPCOMING_HUB_HIGHLIGHT_MAX } from './upcomingHubHighlights';

describe('buildUpcomingHubHighlights', () => {
  it('merges joined and hosted by date and caps at five', () => {
    const joined = [
      {
        kind: 'confirmed' as const,
        date: '2099-02-01',
        activity: { id: 'j1', title: 'Join', date: '2099-02-01' },
      },
    ];
    const hosted = [
      {
        id: 'h1',
        title: 'Host',
        date: '2099-01-01',
        activityType: 'hiking',
        status: 'published',
      },
    ];
    const highlights = buildUpcomingHubHighlights(joined as never, hosted as never);
    expect(highlights).toHaveLength(2);
    expect(highlights[0].kind).toBe('hosted');
    expect(highlights.length).toBeLessThanOrEqual(UPCOMING_HUB_HIGHLIGHT_MAX);
  });
});
