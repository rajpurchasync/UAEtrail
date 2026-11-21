import { describe, expect, it } from 'vitest';
import { resolvePlanCalendarRowOpenAction } from './planCalendarOpen';

describe('resolvePlanCalendarRowOpenAction', () => {
  it('treats available as non-navigating indicator', () => {
    expect(resolvePlanCalendarRowOpenAction({ kind: 'available' })).toEqual({ type: 'indicator' });
  });

  it('navigates joined and pending to activity detail', () => {
    const joined = {
      kind: 'joined' as const,
      title: 'Hike',
      href: '/activity/a1',
      activityId: 'a1',
      whenLine: 'Oct 1',
      locationLine: 'Wadi',
    };
    expect(resolvePlanCalendarRowOpenAction(joined)).toEqual({
      type: 'navigate',
      href: '/activity/a1',
    });
  });

  it('navigates hosting and map availability slots to manage href', () => {
    expect(
      resolvePlanCalendarRowOpenAction({
        kind: 'hosting',
        title: 'Camp',
        href: '/plan?peek=h1',
        activityId: 'h1',
      })
    ).toEqual({ type: 'navigate', href: '/plan?peek=h1' });
    expect(
      resolvePlanCalendarRowOpenAction({
        kind: 'mapSlot',
        title: 'On the map',
        href: '/plan',
        slotId: 'slot-1',
      })
    ).toEqual({ type: 'navigate', href: '/plan' });
  });
});
