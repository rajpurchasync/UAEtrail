import { describe, expect, it } from 'vitest';
import {
  parseBuddiesDiscoverySegment,
  serializeBuddiesDiscoverySegment,
} from './buddiesDiscoverySegment';

describe('buddiesDiscoverySegment', () => {
  it('parses URL segment with going default', () => {
    expect(parseBuddiesDiscoverySegment(null)).toBe('going');
    expect(parseBuddiesDiscoverySegment('looking')).toBe('looking');
    expect(parseBuddiesDiscoverySegment('followed')).toBe('followed');
  });

  it('serializes non-default segments only', () => {
    expect(serializeBuddiesDiscoverySegment('going')).toBeNull();
    expect(serializeBuddiesDiscoverySegment('looking')).toBe('looking');
  });
});
