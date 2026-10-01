import { describe, expect, it } from 'vitest';
import { womenOnlyJoinMessageForActivity } from './activityWomenOnlyJoin';

describe('womenOnlyJoinMessageForActivity', () => {
  it('allows female members on women-only outings', () => {
    expect(womenOnlyJoinMessageForActivity(['Women only'], 'female')).toBeNull();
  });

  it('blocks male members', () => {
    expect(womenOnlyJoinMessageForActivity(['Women only'], 'male')).toMatch(/women only/i);
  });

  it('ignores non-women-only activities', () => {
    expect(womenOnlyJoinMessageForActivity(['No pets'], 'male')).toBeNull();
  });
});
