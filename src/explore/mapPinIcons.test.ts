import { describe, expect, it } from 'vitest';
import { resolveMapPinIconKey, resolveMapPinIconSvg } from './mapPinIcons';

describe('mapPinIcons', () => {
  it('maps activity and venue sources to distinct icon keys', () => {
    expect(resolveMapPinIconKey('hiking', 'activity')).toBe('hiking-activity');
    expect(resolveMapPinIconKey('hiking', 'venue')).toBe('hiking-venue');
    expect(resolveMapPinIconKey('camping', 'activity')).toBe('camping-activity');
    expect(resolveMapPinIconKey('carpool', 'activity')).toBe('carpool');
    expect(resolveMapPinIconKey('hiking', 'demand')).toBe('demand');
    expect(resolveMapPinIconKey('hiking', 'shop')).toBe('shop');
  });

  it('renders inline SVG markup for Leaflet pins', () => {
    const svg = resolveMapPinIconSvg('hiking', 'activity', '#059669', 18);
    expect(svg).toContain('<svg');
    expect(svg).toContain('stroke="#059669"');
    expect(svg).not.toContain('🥾');
  });
});
