import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('map peek foundation (map surfaces)', () => {
  it('PEEK-FOUND-01: map trip card is standalone — not MapPeekShell / browse headline', () => {
    const trip = read('src/explore/ui/map-peek/MapTripPeekCard.tsx');
    expect(trip).toMatch(/data-map-trip-peek-card/);
    expect(trip).toMatch(/ActivityMapPeekCompactLayout/);
    expect(trip).not.toMatch(/from ['"].*MapPeekShell/);
    expect(trip).not.toMatch(/DiscoveryCardHeadline/);
    expect(trip).not.toMatch(/ActivityDiscoveryPublishedBody/);
    expect(trip).not.toMatch(/DiscoveryBrowsePosterBanner/);
  });

  it('PEEK-FOUND-02: ActivityPeekCard routes map to MapTripPeekCard', () => {
    const facade = read('src/explore/ui/peek/ActivityPeekCard.tsx');
    expect(facade).toMatch(/MapTripPeekCard/);
    expect(facade).toMatch(/if \(!embedMode\)/);
  });

  it('PEEK-FOUND-03: map venue card is standalone', () => {
    const venue = read('src/explore/ui/map-peek/MapVenuePeekCard.tsx');
    expect(venue).toMatch(/data-map-venue-peek-card/);
    expect(venue).toMatch(/PlaceMapPeekCompactLayout/);
    expect(venue).not.toMatch(/from ['"].*MapPeekShell/);
    expect(venue).not.toMatch(/PlacePeekHero/);
  });

  it('PEEK-FOUND-04: compact layout uses view-model resolver', () => {
    const layout = read('src/explore/ui/peek/activity/ActivityMapPeekCompactLayout.tsx');
    expect(layout).toMatch(/resolveActivityMapPeekViewModel/);
  });
});