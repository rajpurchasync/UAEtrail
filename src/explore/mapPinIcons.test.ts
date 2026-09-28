import { describe, expect, it } from 'vitest';
import { HIKING_ACTIVITY_EMOJI, HIKING_VENUE_EMOJI, resolveMapPinEmoji } from '@uaetrail/shared-types';
import { resolveMapPinIconHtml } from './mapPinIcons';

describe('mapPinIcons', () => {
  it('uses shared resolveMapPinEmoji for activity vs venue hiking', () => {
    expect(resolveMapPinEmoji('hiking', 'activity')).toBe(HIKING_ACTIVITY_EMOJI);
    expect(resolveMapPinEmoji('hiking', 'venue')).toBe(HIKING_VENUE_EMOJI);
  });

  it('renders emoji markup for Leaflet pins', () => {
    const activityHtml = resolveMapPinIconHtml('hiking', 'activity', 18);
    expect(activityHtml).toContain(HIKING_ACTIVITY_EMOJI);
    expect(activityHtml).toContain('uaetrail-map-pin-emoji');
    expect(activityHtml).not.toContain('<svg');

    const venueHtml = resolveMapPinIconHtml('hiking', 'venue', 18);
    expect(venueHtml).toContain(HIKING_VENUE_EMOJI);
    expect(venueHtml).not.toContain(HIKING_ACTIVITY_EMOJI);
  });
});
