import { describe, expect, it } from 'vitest';
import { resolveJoinRequestActivity } from './joinRequestActivity';

describe('resolveJoinRequestActivity', () => {
  it('prefers activity over legacy event', () => {
    const activity = { id: 'a1', title: 'Hike', locationName: 'Wadi' };
    expect(
      resolveJoinRequestActivity({
        id: 'r1',
        status: 'pending',
        createdAt: '',
        activity,
        event: { id: 'x', title: 'Other', locationName: '' },
      })
    ).toEqual(activity);
  });

  it('falls back to legacy event', () => {
    const event = { id: 'a2', title: 'Camp', locationName: 'Liwa' };
    expect(
      resolveJoinRequestActivity({
        id: 'r1',
        status: 'pending',
        createdAt: '',
        event,
      } as Parameters<typeof resolveJoinRequestActivity>[0])
    ).toEqual(event);
  });
});
