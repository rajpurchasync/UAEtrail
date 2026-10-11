import { describe, expect, it } from 'vitest';
import { HIKING_ACTIVITY_EMOJI, HIKING_VENUE_EMOJI, resolveMapPinEmoji } from '@uaetrail/shared-types';
import {
  buildMapColocatedPinIconHtml,
  buildMapPinFaceHtml,
  buildVenueMapPinHtml,
  resolveMapPinIconHtml,
} from './mapPinIcons';

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
  });

  it('renders venue map chips with labels from zoom 9', () => {
    const withLabel = buildVenueMapPinHtml({
      kind: 'camping',
      label: 'Al Qudra Lakes',
      mapZoom: 10,
    });
    expect(withLabel.html).toContain('uaetrail-map-venue-chip');
    expect(withLabel.html).toContain('uaetrail-map-venue-pin-badge');
    expect(withLabel.html).not.toContain('uaetrail-map-pin-face');
    expect(withLabel.html).toContain('Al Qudra Lakes');

    const iconOnly = buildVenueMapPinHtml({ kind: 'hiking', mapZoom: 8 });
    expect(iconOnly.html).toContain('uaetrail-map-venue-pin-badge');
    expect(iconOnly.html).not.toContain('uaetrail-map-venue-pin-label');
  });

  it('renders catalog venues as chips in colocated clusters, not emoji circles', () => {
    const { html } = buildMapColocatedPinIconHtml([
      {
        kind: 'hiking',
        source: 'venue',
        ringColor: '#047857',
        exploreItemId: 'venue:a',
        stackCount: 2,
      },
      {
        kind: 'camping',
        source: 'venue',
        ringColor: '#b45309',
        exploreItemId: 'venue:b',
        stackCount: 1,
      },
    ]);
    expect(html).toContain('uaetrail-map-venue-chip--colocated');
    expect(html).toContain('uaetrail-map-venue-pin-badge--hiking');
    expect(html).toContain('uaetrail-map-venue-pin-badge--camping');
    expect(html).not.toContain('uaetrail-map-pin-face');
  });

  it('keeps emoji circles for colocated activities', () => {
    const { html } = buildMapColocatedPinIconHtml([
      {
        kind: 'hiking',
        source: 'activity',
        ringColor: '#059669',
        exploreItemId: 'act:1',
        stackCount: 1,
      },
      {
        kind: 'camping',
        source: 'activity',
        ringColor: '#d97706',
        exploreItemId: 'act:2',
        stackCount: 1,
      },
    ]);
    expect(html).toContain('uaetrail-map-pin-face');
    expect(html).not.toContain('uaetrail-map-venue-chip--colocated');
  });

  it('shows indicative count badge for a single item at one pin', () => {
    const html = buildMapPinFaceHtml({
      kind: 'hiking',
      source: 'activity',
      ringColor: '#059669',
      size: 40,
      fontSizePx: 18,
      ringWidth: 2.5,
      stackCount: 1,
    });
    expect(html).toContain('uaetrail-map-cluster-badge');
    expect(html).toContain('>1<');
  });

  it('renders hosted vs seeking mode corner badges on activity pins', () => {
    const hosted = buildMapPinFaceHtml({
      kind: 'hiking',
      source: 'activity',
      ringColor: '#059669',
      size: 40,
      fontSizePx: 18,
      ringWidth: 2.5,
      stackCount: 1,
      activityMode: 'hosted',
    });
    expect(hosted).toContain('uaetrail-map-activity-mode-badge--hosted');

    const seeking = buildMapPinFaceHtml({
      kind: 'hiking',
      source: 'activity',
      ringColor: '#7c3aed',
      size: 40,
      fontSizePx: 18,
      ringWidth: 2.5,
      stackCount: 1,
      activityMode: 'seeking',
    });
    expect(seeking).toContain('uaetrail-map-activity-mode-badge--seeking');
  });
});
