import { describe, expect, it } from 'vitest';
import { encodePackingListRequirements, defaultHikingPackingItems } from '@uaetrail/shared-types';
import { assertPackingAckForJoin, composePackingJoinNote } from '../src/domain/activity-packing-ack.js';
import { ApiError } from '../src/lib/api-error.js';

describe('activity packing ack', () => {
  const requirements = encodePackingListRequirements('strict', defaultHikingPackingItems());

  it('rejects strict join without must-haves and signature', () => {
    expect(() => assertPackingAckForJoin({ requirements })).toThrow(ApiError);
    expect(() =>
      assertPackingAckForJoin({
        requirements,
        packingCheckedIds: defaultHikingPackingItems()
          .filter((item) => item.required)
          .map((item) => item.id),
        packingSignature: 'Jane',
      })
    ).toThrow(ApiError);
  });

  it('accepts strict join when must-haves and full name are present', () => {
    const packingCheckedIds = defaultHikingPackingItems()
      .filter((item) => item.required)
      .map((item) => item.id);
    expect(() =>
      assertPackingAckForJoin({
        requirements,
        packingCheckedIds,
        packingSignature: 'Jane Doe',
      })
    ).not.toThrow();
    expect(
      composePackingJoinNote({
        requirements,
        packingCheckedIds,
        packingSignature: 'Jane Doe',
        note: 'See you at 7.',
      })
    ).toMatch(/Signed: Jane Doe/);
  });

  it('skips enforcement in lenient mode', () => {
    const lenient = encodePackingListRequirements('lenient', defaultHikingPackingItems());
    expect(() => assertPackingAckForJoin({ requirements: lenient })).not.toThrow();
  });
});
