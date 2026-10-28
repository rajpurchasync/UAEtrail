import { describe, expect, it } from 'vitest';
import { resolvePlaceConsumerDetailHeaderChrome } from './resolvePlaceConsumerDetailHeaderChrome';

describe('resolvePlaceConsumerDetailHeaderChrome', () => {
  it('uses place catalog titles, not outing kind labels', () => {
    expect(resolvePlaceConsumerDetailHeaderChrome('trail')).toEqual({
      emoji: '⛰️',
      label: 'Trail',
      mark: 'trail',
    });
    expect(resolvePlaceConsumerDetailHeaderChrome('camp').label).toBe('Camp spot');
    expect(resolvePlaceConsumerDetailHeaderChrome('event').label).toBe('Venue');
  });
});
