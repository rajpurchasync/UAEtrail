import { describe, expect, it } from 'vitest';
import { parseDestinationDetailTabParam } from './destinationDetailTab';

describe('parseDestinationDetailTabParam', () => {
  it('defaults to overview', () => {
    expect(parseDestinationDetailTabParam(null)).toBe('overview');
    expect(parseDestinationDetailTabParam('overview')).toBe('overview');
  });

  it('parses places and activities', () => {
    expect(parseDestinationDetailTabParam('places')).toBe('places');
    expect(parseDestinationDetailTabParam('activities')).toBe('activities');
  });
});
