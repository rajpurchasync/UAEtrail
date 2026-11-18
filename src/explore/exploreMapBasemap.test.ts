import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveEsriExploreStylePreset, resolveExploreMapTiles } from './exploreMapBasemap';

describe('exploreMapBasemap', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to Esri topo for map style when no provider key is set', () => {
    const tiles = resolveExploreMapTiles('map');
    expect(tiles.provider).toBe('esri');
    expect(tiles.tileUrl).toContain('World_Topo_Map');
    expect(tiles.attribution).toMatch(/Esri/i);
  });

  it('uses MapTiler outdoor when VITE_MAPTILER_API_KEY is set', () => {
    vi.stubEnv('VITE_MAPTILER_API_KEY', 'test-maptiler-key');
    const tiles = resolveExploreMapTiles('map');
    expect(tiles.provider).toBe('maptiler');
    expect(tiles.tileUrl).toContain('api.maptiler.com/maps/streets-v2');
    expect(tiles.tileUrl).toContain('key=test-maptiler-key');
    expect(tiles.labelTileUrl).toBeNull();
  });

  it('uses MapTiler hybrid for satellite style', () => {
    vi.stubEnv('VITE_MAPTILER_API_KEY', 'test-maptiler-key');
    const tiles = resolveExploreMapTiles('satellite');
    expect(tiles.provider).toBe('maptiler');
    expect(tiles.tileUrl).toContain('/maps/hybrid/');
  });

  it('respects VITE_MAP_BASEMAP_PROVIDER=esri even when MapTiler key exists', () => {
    vi.stubEnv('VITE_MAPTILER_API_KEY', 'test-maptiler-key');
    vi.stubEnv('VITE_MAP_BASEMAP_PROVIDER', 'esri');
    const tiles = resolveExploreMapTiles('map');
    expect(tiles.provider).toBe('esri');
  });

  it('VITE_MAP_TILE_URL overrides provider presets', () => {
    vi.stubEnv('VITE_MAP_TILE_URL', 'https://example.com/{z}/{x}/{y}.png');
    const tiles = resolveExploreMapTiles('map');
    expect(tiles.provider).toBe('custom');
    expect(tiles.tileUrl).toBe('https://example.com/{z}/{x}/{y}.png');
  });

  it('resolveEsriExploreStylePreset keeps imagery + reference labels for satellite', () => {
    const preset = resolveEsriExploreStylePreset('satellite');
    expect(preset.tileUrl).toContain('World_Imagery');
    expect(preset.labelTileUrl).toContain('World_Boundaries_and_Places');
  });
});