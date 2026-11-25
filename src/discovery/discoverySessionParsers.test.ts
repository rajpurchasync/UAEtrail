import { describe, expect, it } from 'vitest';
import { parseListCatParam } from './discoverySessionParsers';

describe('discoverySessionParsers', () => {
  it('parseListCatParam maps legacy aliases', () => {
    expect(parseListCatParam('guides')).toBe('people');
    expect(parseListCatParam('shops')).toBe('venues');
    expect(parseListCatParam('trips')).toBe('activities');
    expect(parseListCatParam('venues')).toBe('venues');
    expect(parseListCatParam(null)).toBeNull();
  });
});