import { describe, expect, it } from 'vitest';
import { HIKING_ACTIVITY_EMOJI, HIKING_VENUE_EMOJI, resolveMapPinEmoji } from '@uaetrail/shared-types';
import {
  buildMapClusterIconHtml,
  buildMapCollidedPinIconHtml,
  buildMapColocatedPinIconHtml,
  buildMapPinFaceHtml,
  buildVenueMapPinHtml,
  colocatedPinCanvasMetrics,
  resolveClusterClickExploreItemId,
  resolveColocatedExploreItemIdFromPointer,
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

  it('buildMapCollidedPinIconHtml stacks type glyphs with a total count', () => {
    const { html, size } = buildMapCollidedPinIconHtml(
      [
        {
          kind: 'shop',
          source: 'shop',
          ringColor: '#2563eb',
          exploreItemId: 'shop:1',
          stackCount: 1,
        },
        {
          kind: 'hiking',
          source: 'venue',
          ringColor: '#047857',
          exploreItemId: 'venue:1',
          stackCount: 1,
        },
      ],
      4
    );
    expect(size).toBe(48);
    expect(html).toContain('uaetrail-map-pin-collided');
    expect(html).toContain('uaetrail-map-pin-collided-icons');
    expect(html).toContain('uaetrail-map-pin-collided-icons--2');
    expect(html).toContain('uaetrail-map-venue-pin-badge--hiking');
    expect(html).toContain('uaetrail-map-cluster-badge');
    expect(html).toContain('>4<');
    expect(html).not.toContain('uaetrail-map-pin-multi');
  });

  it('scales collided emoji down when three or more glyphs share the face', () => {
    const { html } = buildMapCollidedPinIconHtml(
      [
        {
          kind: 'running',
          source: 'activity',
          ringColor: '#047857',
          exploreItemId: 'a:1',
          stackCount: 1,
        },
        {
          kind: 'camping',
          source: 'activity',
          ringColor: '#b45309',
          exploreItemId: 'a:2',
          stackCount: 1,
        },
        {
          kind: 'hiking',
          source: 'activity',
          ringColor: '#047857',
          exploreItemId: 'a:3',
          stackCount: 1,
        },
      ],
      3
    );
    expect(html).toContain('uaetrail-map-pin-collided-icons--3');
    expect(html).toContain('font-size:10px');
    expect(html).toContain('width:12px;height:12px');
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

  it('omits count badge for a single item at one pin', () => {
    const html = buildMapPinFaceHtml({
      kind: 'hiking',
      source: 'activity',
      ringColor: '#059669',
      size: 32,
      fontSizePx: 18,
      ringWidth: 2.5,
      stackCount: 1,
    });
    expect(html).not.toContain('uaetrail-map-cluster-badge');
  });

  it('resolveColocatedExploreItemIdFromPointer picks nearest fan slot', () => {
    const { canvas, orbit } = colocatedPinCanvasMetrics(2);
    const entries = [{ exploreItemId: 'hike' }, { exploreItemId: 'ride' }];
    const center = canvas / 2;
    const topY = center - orbit;
    expect(
      resolveColocatedExploreItemIdFromPointer(entries, center, topY, canvas, canvas)
    ).toBe('hike');
    const bottomY = center + orbit;
    expect(
      resolveColocatedExploreItemIdFromPointer(entries, center, bottomY, canvas, canvas)
    ).toBe('ride');
  });

  it('shows a count badge when several activity pins share a cluster', () => {
    const stacked = buildMapPinFaceHtml({
      kind: 'hiking',
      source: 'activity',
      ringColor: '#059669',
      size: 32,
      fontSizePx: 18,
      ringWidth: 2.5,
      stackCount: 3,
    });
    expect(stacked).toContain('uaetrail-map-cluster-badge');
    expect(stacked).toContain('>3<');
  });

  it('buildMapClusterIconHtml shows how many pins sit in the cluster', () => {
    const html = buildMapClusterIconHtml('hiking', 'activity', '#059669', 4, 'act-1');
    expect(html).toContain('uaetrail-map-pin-face');
    expect(html).toContain('uaetrail-map-cluster-badge');
    expect(html).toContain('>4<');
    expect(html).toContain('data-explore-item-id="act-1"');

    const selectedHtml = buildMapClusterIconHtml('hiking', 'activity', '#059669', 4, 'act-1', true);
    expect(selectedHtml).toContain('uaetrail-map-pin-marker--selected');
  });

  it('buildMapCollidedPinIconHtml bobs when a stacked type is selected', () => {
    const { html } = buildMapCollidedPinIconHtml(
      [
        {
          kind: 'running',
          source: 'activity',
          ringColor: '#047857',
          exploreItemId: 'a:1',
          stackCount: 1,
          selected: true,
        },
        {
          kind: 'camping',
          source: 'activity',
          ringColor: '#b45309',
          exploreItemId: 'a:2',
          stackCount: 1,
        },
      ],
      2
    );
    expect(html).toContain('uaetrail-map-pin-marker--selected');
  });

  it('resolveClusterClickExploreItemId prefers data-explore-item-id on the clicked slot', () => {
    const entries = [
      { exploreItemId: 'camp-1' },
      { exploreItemId: 'hike-1' },
    ];
    const target = document.createElement('span');
    target.setAttribute('data-explore-item-id', 'camp-1');
    expect(
      resolveClusterClickExploreItemId(entries, { target } as unknown as MouseEvent)
    ).toBe('camp-1');
  });

  it('resolveClusterClickExploreItemId uses sole bucket id for single-face clusters', () => {
    expect(resolveClusterClickExploreItemId([{ exploreItemId: 'only-one' }], null)).toBe('only-one');
  });
});
