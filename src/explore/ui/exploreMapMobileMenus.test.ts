import { describe, expect, it } from 'vitest';
import {
  EXPLORE_MOBILE_PLACES_MENU,
  inferMobilePlacesMenuKey,
  mobilePlacesMenuToMapFilter,
  mobilePlacesMenuToVenueFilter,
} from './exploreMapMobileMenus';

describe('exploreMapMobileMenus places', () => {
  it('orders Trail, Camping, Facilities, Shopping, Other', () => {
    expect(
      EXPLORE_MOBILE_PLACES_MENU.filter((option) => option.key !== 'all' && option.key !== 'uae').map(
        (option) => option.label
      )
    ).toEqual(['Trail', 'Camping', 'Facilities', 'Shopping', 'Other']);
  });

  it('does not expose spots as a places filter', () => {
    expect(EXPLORE_MOBILE_PLACES_MENU.some((option) => option.key === 'spots')).toBe(false);
    expect(mobilePlacesMenuToMapFilter('camping')).toBe('camping');
    expect(mobilePlacesMenuToMapFilter('facilities')).toBe('facilities');
    expect(mobilePlacesMenuToVenueFilter('facilities')).toBe('facilities');
  });

  it('infers facilities from the wire filter', () => {
    expect(inferMobilePlacesMenuKey('facilities', 'facilities')).toBe('facilities');
    expect(inferMobilePlacesMenuKey('camping', 'camping')).toBe('camping');
  });

  it('maps others to event venue filter', () => {
    expect(mobilePlacesMenuToMapFilter('others')).toBe('others');
    expect(mobilePlacesMenuToVenueFilter('others')).toBe('event');
    expect(inferMobilePlacesMenuKey('others', 'event')).toBe('others');
  });
});
