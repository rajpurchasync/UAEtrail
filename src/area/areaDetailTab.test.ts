import { describe, expect, it } from 'vitest';
import { parseAreaDetailTabParam } from './areaDetailTab';

describe('parseAreaDetailTabParam', () => {
  it('defaults to overview', () => {
    expect(parseAreaDetailTabParam(null)).toBe('overview');
    expect(parseAreaDetailTabParam('overview')).toBe('overview');
  });

  it('parses places and activities', () => {
    expect(parseAreaDetailTabParam('places')).toBe('places');
    expect(parseAreaDetailTabParam('activities')).toBe('activities');
  });
});
