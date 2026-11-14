import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

const LEGACY_LISTING_FILES = [
  'src/list/explorer/ListExplorerTripListingCard.tsx',
  'src/list/explorer/ListExplorerVenueListingCard.tsx',
  'src/list/explorer/ListExplorerThumbnailCard.tsx',
  'src/list/explorer/ListExplorerListRow.tsx',
  'src/list/explorer/ListExplorerDistanceChip.tsx',
];

const EXPLORER_DEPRECATED_SHIMS = [
  'src/list/explorer/DiscoveryBrowsePosterBanner.tsx',
  'src/list/explorer/DiscoveryPosterOverlayNav.tsx',
  'src/list/explorer/ListExplorerItemLink.tsx',
  'src/list/explorer/ListExplorerListingJoinFooter.tsx',
  'src/list/explorer/ListExplorerActivityStatusChips.tsx',
  'src/list/explorer/listExplorerCardMeta.ts',
  'src/list/explorer/listExplorerListingChrome.tsx',
  'src/list/browse/BrowseCardJoinFooter.tsx',
];

const LIST_DEPRECATED_SHIMS = [
  'src/list/listTripPosterPresentation.ts',
  'src/list/listVenuePosterPresentation.ts',
];

const SHIM_CONSUMERS_OUTSIDE_EXPLORER = [
  'src/list/browse/TripBrowseCard.tsx',
  'src/list/browse/VenueBrowseCard.tsx',
  'src/list/browse/BrowseCompactRow.tsx',
  'src/explore/ui/map-peek/MapPeekShell.tsx',
  'src/discovery/DiscoveryBrowseThumbnailPoster.tsx',
];

describe('listExplorerShimHygiene', () => {
  it('BROWSE-SHIM-01: deleted ListExplorer listing/distance files stay absent', () => {
    for (const file of LEGACY_LISTING_FILES) {
      expect(existsSync(join(process.cwd(), file))).toBe(false);
    }
  });

  it('BROWSE-SHIM-02: list/explorer browse shims remain thin deprecated re-exports', () => {
    for (const file of EXPLORER_DEPRECATED_SHIMS) {
      const source = read(file);
      expect(source).toMatch(/@deprecated/i);
      expect(source.split('\n').length).toBeLessThan(16);
    }
    for (const file of LIST_DEPRECATED_SHIMS) {
      const source = read(file);
      expect(source).toMatch(/@deprecated/i);
      expect(source.split('\n').length).toBeLessThan(36);
      expect(source).not.toMatch(/export const resolve|formatListFeedPosterTitleLines/);
    }
    expect(read('src/list/explorer/ListExplorerListingJoinFooter.tsx')).toMatch(
      /DiscoveryBrowseListEngagementFooter/
    );
  });

  it('BROWSE-SHIM-03: product surfaces do not import list/explorer browse shims', () => {
    const patterns = [
      /list\/explorer\/DiscoveryBrowsePosterBanner/,
      /list\/explorer\/DiscoveryPosterOverlayNav/,
      /list\/explorer\/ListExplorerItemLink/,
      /list\/explorer\/ListExplorerListingJoinFooter/,
      /list\/explorer\/listExplorerListingChrome/,
    ];
    for (const file of SHIM_CONSUMERS_OUTSIDE_EXPLORER) {
      const source = read(file);
      for (const pattern of patterns) {
        expect(source).not.toMatch(pattern);
      }
    }
  });
});