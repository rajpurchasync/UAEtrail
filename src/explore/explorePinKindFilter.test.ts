import { describe, expect, it } from 'vitest';
import {
  parseExplorePinKindFilter,
  serializeExplorePinKindFilter,
} from './explorePinKindFilter';

describe('explorePinKindFilter', () => {
  it('parses legacy trips wire as activities', () => {
    expect(parseExplorePinKindFilter('trips')).toBe('activities');
    expect(parseExplorePinKindFilter('activities')).toBe('activities');
    expect(parseExplorePinKindFilter(null)).toBe('all');
  });

  it('serializes activities (not legacy trips)', () => {
    expect(serializeExplorePinKindFilter('activities')).toBe('activities');
    expect(serializeExplorePinKindFilter('all')).toBeNull();
  });

  it('parses legacy locations (area hub pins) as Spots', () => {
    expect(parseExplorePinKindFilter('locations')).toBe('places');
  });
});
