import { describe, expect, it } from 'vitest';
import { parseBrowseGeoPath, serializeBrowseGeoPath } from './browseGeoPath';

describe('browseGeoPath', () => {
  it('parses slash-separated geo ids', () => {
    expect(parseBrowseGeoPath('dubai/hatta/wadi-hub')).toEqual(['dubai', 'hatta', 'wadi-hub']);
    expect(parseBrowseGeoPath('  a / b / ')).toEqual(['a', 'b']);
    expect(parseBrowseGeoPath(null)).toEqual([]);
  });

  it('serializes a geo drill path', () => {
    expect(serializeBrowseGeoPath(['dubai', 'hatta'])).toBe('dubai/hatta');
    expect(serializeBrowseGeoPath([])).toBeNull();
  });
});
