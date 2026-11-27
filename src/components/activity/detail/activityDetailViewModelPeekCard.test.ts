import { describe, expect, it } from 'vitest';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { resolveActivityDetailPeekParityCard } from './activityDetailViewModelPeekCard';

const activity = {
  id: 'a1',
  activityType: 'hiking',
  title: 'Hike',
  status: 'published',
} as ActivityDetailDTO;

describe('resolveActivityDetailPeekParityCard', () => {
  it('returns null for preview or non-public detail', () => {
    expect(resolveActivityDetailPeekParityCard(activity, true, true, null, null)).toBeNull();
    expect(resolveActivityDetailPeekParityCard(activity, false, false, null, null)).toBeNull();
  });

  it('builds a discovery card for public consumer detail', () => {
    const card = resolveActivityDetailPeekParityCard(activity, false, true, null, null);
    expect(card).not.toBeNull();
    expect(card?.id).toBe('activity:a1');
  });
});