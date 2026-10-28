import { describe, expect, it } from 'vitest';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { resolveConsumerDetailVenueEyebrow } from './resolveConsumerDetailVenueEyebrow';

const base = (overrides: Partial<ActivityDetailDTO> = {}): ActivityDetailDTO =>
  ({
    id: 'a1',
    activityType: 'rideshare',
    locationId: 'p1',
    ...overrides,
  }) as ActivityDetailDTO;

describe('resolveConsumerDetailVenueEyebrow', () => {
  it('uses trail path when scheduled type is rideshare', () => {
    expect(resolveConsumerDetailVenueEyebrow(base(), '/trail/p1')).toBe('Trail on UAETrail');
  });

  it('prefers linked location catalog kind', () => {
    expect(
      resolveConsumerDetailVenueEyebrow(
        base({ location: { activityType: 'camping', name: 'X' } as ActivityDetailDTO['location'] }),
        '/camp/p1'
      )
    ).toBe('Camp on UAETrail');
  });
});
