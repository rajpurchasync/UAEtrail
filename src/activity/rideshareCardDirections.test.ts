import { describe, expect, it } from 'vitest';
import { rideshareCardCoversDirections } from './rideshareCardDirections';

const marinaRide = {
  activityType: 'rideshare' as const,
  meetingPoint: 'Dubai Marina Mall parking',
  meetingLat: 25.0782,
  meetingLng: 55.1394,
  startPoint: 'Jebel Jais Viewing Deck',
  startLat: 25.9433,
  startLng: 56.1422,
};

describe('rideshareCardCoversDirections', () => {
  it('covers pickup and a separate drop-off, not an unrelated pin', () => {
    expect(rideshareCardCoversDirections(marinaRide, 25.0782, 55.1394)).toBe(true);
    expect(rideshareCardCoversDirections(marinaRide, 25.9433, 56.1422)).toBe(true);
    expect(rideshareCardCoversDirections(marinaRide, 25.1, 55.2)).toBe(false);
  });

  it('leaves hike directions on Getting there', () => {
    expect(
      rideshareCardCoversDirections(
        { ...marinaRide, activityType: 'hiking' },
        25.9433,
        56.1422
      )
    ).toBe(false);
  });
});
