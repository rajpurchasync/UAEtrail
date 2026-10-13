import { describe, expect, it } from 'vitest';
import { parsePlaceDetailTabParam } from './placeDetailTab';

describe('parsePlaceDetailTabParam', () => {
  it('defaults to overview', () => {
    expect(parsePlaceDetailTabParam(null)).toBe('overview');
    expect(parsePlaceDetailTabParam('')).toBe('overview');
    expect(parsePlaceDetailTabParam('overview')).toBe('overview');
  });

  it('parses canonical tabs', () => {
    expect(parsePlaceDetailTabParam('facts')).toBe('facts');
    expect(parsePlaceDetailTabParam('transport')).toBe('transport');
    expect(parsePlaceDetailTabParam('guide')).toBe('guide');
  });

  it('aliases legacy location tab to transport', () => {
    expect(parsePlaceDetailTabParam('location')).toBe('transport');
  });
});
