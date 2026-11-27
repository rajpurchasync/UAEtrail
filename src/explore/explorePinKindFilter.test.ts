import { describe, expect, it } from 'vitest';
import {
  parseExplorePinKindFilter,
  serializeExplorePinKindFilter,
} from './explorePinKindFilter';

describe('explorePinKindFilter', () => {
  it('parses canonical pin kinds', () => {
    expect(parseExplorePinKindFilter('activities')).toBe('activities');
    expect(parseExplorePinKindFilter('places')).toBe('places');
    expect(parseExplorePinKindFilter('shops')).toBe('shops');
    expect(parseExplorePinKindFilter(null)).toBe('all');
  });

  it('serializes activities (not legacy trips)', () => {
    expect(serializeExplorePinKindFilter('activities')).toBe('activities');
    expect(serializeExplorePinKindFilter('all')).toBeNull();
  });

  it('rejects retired pinKind tokens', () => {
    expect(parseExplorePinKindFilter('trips')).toBe('all');
    expect(parseExplorePinKindFilter('locations')).toBe('all');
    expect(parseExplorePinKindFilter('looking')).toBe('all');
  });
});
