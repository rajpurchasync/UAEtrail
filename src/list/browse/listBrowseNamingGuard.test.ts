import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('listBrowseNamingGuard', () => {
  it('BROWSE-NAME-01: trip/venue browse cards live under src/list/browse (not ListExplorer*ListingCard)', () => {
    expect(existsSync(join(process.cwd(), 'src/list/browse/TripBrowseCard.tsx'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/list/browse/VenueBrowseCard.tsx'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/list/browse/BrowseThumbnailCard.tsx'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/list/browse/BrowseCompactRow.tsx'))).toBe(true);
    expect(existsSync(join(process.cwd(), 'src/list/explorer/ListExplorerTripListingCard.tsx'))).toBe(
      false
    );
    expect(existsSync(join(process.cwd(), 'src/list/explorer/ListExplorerVenueListingCard.tsx'))).toBe(
      false
    );
    expect(existsSync(join(process.cwd(), 'src/list/explorer/ListExplorerListRow.tsx'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'src/list/explorer/ListExplorerThumbnailCard.tsx'))).toBe(
      false
    );
  });

  it('BROWSE-NAME-02: ListExplorer shell composes browse cards', () => {
    const explorer = read('src/list/explorer/ListExplorer.tsx');
    expect(explorer).toMatch(/BrowseThumbnailCard/);
    expect(explorer).toMatch(/BrowseCompactRow/);
    expect(explorer).not.toMatch(/ListExplorerTripListingCard/);
    expect(explorer).not.toMatch(/ListExplorerListRow/);
  });

  it('BROWSE-NAME-03: browse bucket uses browse copy + chrome (not listing poster names)', () => {
    const trip = read('src/list/browse/TripBrowseCard.tsx');
    expect(trip).toMatch(/resolveTripBrowseCardCopy/);
    expect(trip).toMatch(/BROWSE_CARD_SHELL/);
    expect(trip).toMatch(/BrowseItemLink/);
    expect(trip).not.toMatch(/resolveListTripListingCopy/);
    expect(trip).not.toMatch(/LIST_EXPLORER_LISTING_/);
    const venue = read('src/list/browse/VenueBrowseCard.tsx');
    expect(venue).toMatch(/resolveVenueBrowseCardCopy/);
  });

  it('BROWSE-NAME-04: L1 poster + trip footers live in discovery / browse (not list explorer)', () => {
    expect(existsSync(join(process.cwd(), 'src/discovery/DiscoveryBrowsePosterBanner.tsx'))).toBe(
      true
    );
    const peek = read('src/explore/ui/map-peek/MapPeekShell.tsx');
    expect(peek).toMatch(/discovery\/DiscoveryBrowsePosterBanner/);
    const trip = read('src/list/browse/TripBrowseCard.tsx');
    expect(trip).toMatch(/BrowseCardJoinFooter/);
    expect(trip).toMatch(/BrowseActivityStatusChips/);
    expect(trip).not.toMatch(/ListExplorerListingJoinFooter/);
  });

  it('BROWSE-NAME-05: browse/discovery card meta lives under browse (not listExplorerCardMeta imports)', () => {
    expect(existsSync(join(process.cwd(), 'src/list/browse/browseCardMeta.ts'))).toBe(true);
    const poster = read('src/discovery/DiscoveryBrowsePosterBanner.tsx');
    expect(poster).toMatch(/browseCardMeta/);
    expect(poster).not.toMatch(/listExplorerCardMeta/);
    const peekTitle = read('src/explore/ui/map-peek/MapPeekBrowseTitle.tsx');
    expect(peekTitle).toMatch(/browseCardTitle/);
    expect(peekTitle).not.toMatch(/listExplorerCardTitle/);
    const row = read('src/list/browse/BrowseCompactRow.tsx');
    expect(row).toMatch(/from '\.\/browseCardMeta'/);
    const shim = read('src/list/explorer/listExplorerCardMeta.ts');
    expect(shim).toMatch(/@deprecated/);
    expect(shim).toMatch(/browse\/browseCardMeta/);
  });

  it('BROWSE-NAME-06: venue browse copy lives under browse (not listVenuePosterPresentation)', () => {
    expect(existsSync(join(process.cwd(), 'src/list/browse/venueBrowseCardCopy.ts'))).toBe(true);
    const venue = read('src/list/browse/VenueBrowseCard.tsx');
    expect(venue).toMatch(/from '\.\/venueBrowseCardCopy'/);
    expect(venue).not.toMatch(/listVenuePosterPresentation/);
    expect(read('src/list/browse/venueBrowseCardCopy.ts')).toMatch(/resolveVenueBrowseCardCopy/);
  });

  it('BROWSE-NAME-07: catalog identity/location labels live in browseCatalogLabels', () => {
    const meta = read('src/list/browse/browseCardMeta.ts');
    expect(meta).toMatch(/browseCatalogHeaderLocationLine/);
    expect(meta).not.toMatch(/listVenuePosterPresentation/);
    const venueCopy = read('src/list/browse/venueBrowseCardCopy.ts');
    expect(venueCopy).toMatch(/browseCatalogEntityName/);
    expect(venueCopy).not.toMatch(/resolveCatalogHeaderAreaLocationLine/);
    const peekHero = read('src/explore/ui/peek/place/PlacePeekHero.tsx');
    expect(peekHero).toMatch(/browseCatalogEntityName/);
    expect(peekHero).not.toMatch(/listVenuePosterPresentation/);
  });

  it('BROWSE-NAME-08: venue browse copy has no listVenuePosterPresentation import', () => {
    const venueCopy = read('src/list/browse/venueBrowseCardCopy.ts');
    expect(venueCopy).toMatch(/resolveVenueBrowseCardFactLabels/);
    expect(venueCopy).not.toMatch(/listVenuePosterPresentation/);
    expect(existsSync(join(process.cwd(), 'src/list/browse/venueBrowseFacts.ts'))).toBe(true);
    const facts = read('src/list/browse/venueBrowseFacts.ts');
    expect(facts).toMatch(/resolveVenueBrowseCardFactLabels/);
    expect(facts).toMatch(/browseCatalogEntityName/);
  });

  it('BROWSE-NAME-09: browse/discovery surfaces omit travel-distance chips (trail km stays on hike facts)', () => {
    const poster = read('src/discovery/DiscoveryBrowsePosterBanner.tsx');
    expect(poster).not.toMatch(/ListExplorerDistanceChip/);
    expect(poster).not.toMatch(/usePlaceDistanceLabel/);
    expect(poster).not.toMatch(/showDistance/);
    const row = read('src/list/browse/BrowseCompactRow.tsx');
    expect(row).not.toMatch(/ListExplorerDistanceChip/);
    const hikeFacts = read('src/list/browse/venueBrowseFacts.ts');
    expect(hikeFacts).toMatch(/resolveHikingTrailDistanceLabel/);
    expect(hikeFacts).toMatch(/resolveHikingPlaceFactLabels/);
  });
});