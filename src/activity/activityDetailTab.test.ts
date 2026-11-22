import { describe, expect, it } from 'vitest';
import { parseActivityDetailTabParam } from './activityDetailTab';

describe('parseActivityDetailTabParam', () => {
  it('defaults to plan', () => {
    expect(parseActivityDetailTabParam(null)).toBe('plan');
    expect(parseActivityDetailTabParam('')).toBe('plan');
    expect(parseActivityDetailTabParam('nope')).toBe('plan');
  });

  it('parses section tabs', () => {
    expect(parseActivityDetailTabParam('place')).toBe('place');
    expect(parseActivityDetailTabParam('buddies')).toBe('crew');
    expect(parseActivityDetailTabParam('transport')).toBe('transport');
  });
});
