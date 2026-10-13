import { describe, expect, it } from 'vitest';
import {
  parseBuddiesDiscoverySegment,
  serializeBuddiesDiscoverySegment,
} from './buddiesDiscoverySegment';

describe('buddiesDiscoverySegment', () => {
  it('parses URL segment with available default', () => {
    expect(parseBuddiesDiscoverySegment(null)).toBe('available');
    expect(parseBuddiesDiscoverySegment('available')).toBe('available');
    expect(parseBuddiesDiscoverySegment('going')).toBe('going');
    expect(parseBuddiesDiscoverySegment('connect')).toBe('connect');
  });

  it('maps legacy buddies values', () => {
    expect(parseBuddiesDiscoverySegment('friends')).toBe('going');
    expect(parseBuddiesDiscoverySegment('all')).toBe('connect');
    expect(parseBuddiesDiscoverySegment('looking')).toBe('available');
    expect(parseBuddiesDiscoverySegment('followed')).toBe('going');
  });

  it('serializes non-default segments only', () => {
    expect(serializeBuddiesDiscoverySegment('available')).toBeNull();
    expect(serializeBuddiesDiscoverySegment('going')).toBe('going');
    expect(serializeBuddiesDiscoverySegment('connect')).toBe('connect');
  });
});
