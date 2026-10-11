import { describe, expect, it } from 'vitest';
import { activityHasTransportDetailContent } from './activityDetailTransport';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';

const base = (): ActivityDetailDTO =>
  ({
    id: 'a1',
    title: 'Hike',
    status: 'published',
  }) as ActivityDetailDTO;

describe('activityHasTransportDetailContent', () => {
  it('is false without rideshare or linked parent', () => {
    expect(activityHasTransportDetailContent(base())).toBe(false);
  });

  it('is true when rideshare is enabled', () => {
    expect(activityHasTransportDetailContent({ ...base(), rideshareEnabled: true })).toBe(true);
  });

  it('is true when a linked parent outing exists', () => {
    expect(
      activityHasTransportDetailContent({
        ...base(),
        linkedParentActivity: { id: 'p1', title: 'Main hike', activityType: 'hiking' },
      })
    ).toBe(true);
  });
});
