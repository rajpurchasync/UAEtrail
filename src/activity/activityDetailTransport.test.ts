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
  it('is always true so Transport tab stays visible (reach-by + sustainability)', () => {
    expect(activityHasTransportDetailContent(base())).toBe(true);
    expect(
      activityHasTransportDetailContent({ ...base(), rideshareEnabled: true })
    ).toBe(true);
  });
});
