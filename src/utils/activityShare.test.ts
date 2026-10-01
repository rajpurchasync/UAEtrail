import { describe, expect, it } from 'vitest';
import { buildActivitySharePayload } from './activityShare';

describe('buildActivitySharePayload', () => {
  it('builds path and message with url', () => {
    const payload = buildActivitySharePayload({
      id: 'act-1',
      title: 'Friday hike',
      activityType: 'hiking',
      date: '2026-11-01',
    });
    expect(payload.path).toBe('/activity/act-1');
    expect(payload.messageWithUrl).toContain('Friday hike');
    expect(payload.messageWithUrl).toContain('/activity/act-1');
  });
});
