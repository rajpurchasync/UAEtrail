import { describe, expect, it } from 'vitest';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import {
  resolveActivityDetailVenueEyebrow,
  resolveActivityDetailVenueKindLabel,
} from './resolveActivityDetailVenueEyebrow';

const base = (overrides: Partial<ActivityDetailDTO> = {}): ActivityDetailDTO =>
  ({
    id: 'a1',
    activityType: 'rideshare',
    locationId: 'p1',
    ...overrides,
  }) as ActivityDetailDTO;

describe('resolveActivityDetailVenueEyebrow', () => {
  it('uses trail path when scheduled type is rideshare', () => {
    expect(resolveActivityDetailVenueEyebrow(base(), '/trail/p1')).toBe('Trail on UAETrail');
    expect(resolveActivityDetailVenueKindLabel(base(), '/trail/p1')).toBe('Trail');
  });

  it('prefers linked location catalog kind', () => {
    expect(
      resolveActivityDetailVenueEyebrow(
        base({ location: { activityType: 'camping', name: 'X' } as ActivityDetailDTO['location'] }),
        '/camp/p1'
      )
    ).toBe('Camp on UAETrail');
  });
});
