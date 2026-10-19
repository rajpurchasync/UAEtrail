import { describe, expect, it } from 'vitest';
import type { DiscoveryCardKind, DiscoveryCardSource } from '@uaetrail/shared-types';
import type { MapPinKind, MapPinSource } from '../components/ui/mapPinTypes';

/** Map pin UI types must stay aliases of shared explore presentation types. */
const assertSameUnion = <A extends string, B extends string>(
  _a: A extends B ? (B extends A ? true : never) : never
) => true;

describe('explorePinTypes', () => {
  it('MapPinKind and MapPinSource match shared-types DiscoveryCardKind/Source', () => {
    assertSameUnion<DiscoveryCardKind, MapPinKind>(true);
    assertSameUnion<DiscoveryCardSource, MapPinSource>(true);
    expect(true).toBe(true);
  });
});
