import { describe, expect, it } from 'vitest';
import { resolvePlaceDetailHeaderChrome } from './resolvePlaceDetailHeaderChrome';

describe('resolvePlaceDetailHeaderChrome', () => {
  it('maps place kinds to header chrome', () => {
    expect(resolvePlaceDetailHeaderChrome('trail')).toEqual({
      emoji: '⛰️',
      label: 'Trail',
      mark: 'trail',
    });
    expect(resolvePlaceDetailHeaderChrome('camp').label).toBe('Camp spot');
    expect(resolvePlaceDetailHeaderChrome('event').label).toBe('Venue');
  });
});
