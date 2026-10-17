import { describe, expect, it } from 'vitest';
import { resolvePlanCalendarRowOpenAction } from './planCalendarOpen';

describe('resolvePlanCalendarRowOpenAction', () => {
  it('treats available as non-navigating indicator', () => {
    expect(resolvePlanCalendarRowOpenAction({ kind: 'available' })).toEqual({ type: 'indicator' });
  });

  it('opens joined and pending via peek', () => {
    const joined = {
      kind: 'joined' as const,
      title: 'Hike',
      href: '/activity/a1',
      activityId: 'a1',
      whenLine: 'Oct 1',
      locationLine: 'Wadi',
    };
    expect(resolvePlanCalendarRowOpenAction(joined)).toEqual({
      type: 'joined_peek',
      activityId: 'a1',
    });
  });

  it('navigates hosting and seeking to manage href', () => {
    expect(
      resolvePlanCalendarRowOpenAction({
        kind: 'hosting',
        title: 'Camp',
        href: '/plan?peek=h1',
        activityId: 'h1',
      })
    ).toEqual({ type: 'navigate', href: '/plan?peek=h1' });
  });
});
