import { describe, expect, it } from 'vitest';
import {
  parseBuddiesDiscoverySegment,
  serializeBuddiesDiscoverySegment,
} from './buddiesDiscoverySegment';

describe('buddiesDiscoverySegment', () => {
  it('parses URL segment with looking default (explore peopleTab)', () => {
    expect(parseBuddiesDiscoverySegment(null)).toBe('looking');
    expect(parseBuddiesDiscoverySegment('available')).toBe('available');
    expect(parseBuddiesDiscoverySegment('going')).toBe('going');
    expect(parseBuddiesDiscoverySegment('connect')).toBe('connect');
  });

  it('maps legacy buddies values', () => {
    expect(parseBuddiesDiscoverySegment('friends')).toBe('going');
    expect(parseBuddiesDiscoverySegment('all')).toBe('connect');
    expect(parseBuddiesDiscoverySegment('looking')).toBe('looking');
    expect(parseBuddiesDiscoverySegment('followed')).toBe('going');
  });

  it('serializes non-default segments only', () => {
    expect(serializeBuddiesDiscoverySegment('looking')).toBeNull();
    expect(serializeBuddiesDiscoverySegment('available')).toBe('available');
    expect(serializeBuddiesDiscoverySegment('going')).toBe('going');
    expect(serializeBuddiesDiscoverySegment('connect')).toBe('connect');
  });
});
