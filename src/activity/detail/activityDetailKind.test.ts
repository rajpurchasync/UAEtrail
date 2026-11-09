import { describe, expect, it } from 'vitest';
import { resolveActivityDetailKind } from './activityDetailKind';

describe('resolveActivityDetailKind', () => {
  it('maps scheduled activity types to consumer page templates', () => {
    expect(resolveActivityDetailKind({ activityType: 'hiking' })).toBe('hiking');
    expect(resolveActivityDetailKind({ activityType: 'camping' })).toBe('camping');
    expect(resolveActivityDetailKind({ activityType: 'rideshare' })).toBe('rideshare');
    expect(resolveActivityDetailKind({ activityType: 'event' })).toBe('event');
  });
});
