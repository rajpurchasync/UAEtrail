import { describe, expect, it } from 'vitest';
import { describeExploreMapLoadError } from './exploreMapErrors';

describe('describeExploreMapLoadError', () => {
  it('detects backend unavailable errors', () => {
    expect(describeExploreMapLoadError(new Error('Failed to fetch'))).toContain('Server unavailable');
    expect(describeExploreMapLoadError(new Error('ECONNREFUSED'))).toContain('Server unavailable');
  });

  it('falls back to a generic map message', () => {
    expect(describeExploreMapLoadError(new Error('Unexpected 500'))).toContain('Map data could not load');
  });
});
