import { describe, expect, it } from 'vitest';
import {
  inferMobilePlacesMenuKey,
  mobilePlacesMenuToMapFilter,
  mobilePlacesMenuToVenueFilter,
} from './exploreMapMobileMenus';

describe('exploreMapMobileMenus places', () => {
  it('maps spots and camping to the same wire filter but distinct menu keys', () => {
    expect(mobilePlacesMenuToMapFilter('spots')).toBe('camping');
    expect(mobilePlacesMenuToMapFilter('camping')).toBe('camping');
    expect(mobilePlacesMenuToVenueFilter('spots')).toBe('camping');
    expect(mobilePlacesMenuToVenueFilter('camping')).toBe('camping');
  });

  it('infers menu highlight from last preferred key when wire filter is camping', () => {
    expect(inferMobilePlacesMenuKey('camping', 'camping', 'camping')).toBe('camping');
    expect(inferMobilePlacesMenuKey('camping', 'camping', 'spots')).toBe('spots');
    expect(inferMobilePlacesMenuKey('camping', 'camping')).toBe('spots');
  });

  it('maps others to event venue filter', () => {
    expect(mobilePlacesMenuToMapFilter('others')).toBe('others');
    expect(mobilePlacesMenuToVenueFilter('others')).toBe('event');
    expect(inferMobilePlacesMenuKey('others', 'event')).toBe('others');
  });
});
