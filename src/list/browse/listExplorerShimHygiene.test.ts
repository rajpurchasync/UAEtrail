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

const RETIRED_BROWSE_SHIMS = [
  'src/list/explorer/DiscoveryBrowsePosterBanner.tsx',
  'src/list/explorer/DiscoveryPosterOverlayNav.tsx',
  'src/list/explorer/ListExplorerItemLink.tsx',
  'src/list/explorer/ListExplorerListingJoinFooter.tsx',
  'src/list/explorer/ListExplorerActivityStatusChips.tsx',
  'src/list/explorer/listExplorerCardMeta.ts',
  'src/list/explorer/listExplorerListingChrome.tsx',
  'src/list/explorer/placeDistance.ts',
  'src/list/browse/BrowseCardJoinFooter.tsx',
  'src/list/listTripPosterPresentation.ts',
  'src/list/listVenuePosterPresentation.ts',
  'src/list/explorer/listExplorerLayout.ts',
  'src/list/explorer/listExplorerLayout.test.ts',
  'src/list/explorer/listExplorerFabSnap.ts',
  'src/list/browseListMapHandoff.ts',
  'src/list/browseListMapHandoff.test.ts',
  'src/list/browseCollapsedRailLabels.ts',
  'src/list/listDiscoverySearchCommit.ts',
  'src/list/listDiscoverySearchCommit.test.ts',
  'src/list/browseAudienceFilter.ts',
  'src/list/browseAudienceFilter.test.ts',
  'src/list/browseGeoPath.ts',
  'src/list/browseGeoPath.test.ts',
  'src/list/browseListTripTopics.ts',
  'src/list/browseListTripTopics.test.ts',
  'src/list/browsePosterCover.ts',
  'src/list/browsePosterCover.test.ts',
  'src/list/browseListTaxonomy.ts',
  'src/list/listVenuePlaceTopics.ts',
  'src/list/listVenuePlaceTopics.test.ts',
  'src/list/listVenuePlaceTopicFilter.ts',
  'src/list/useBrowseGeoScopeHydration.ts',
  'src/list/browseListFilters.ts',
  'src/list/browseListFilters.test.ts',
  'src/list/browseListUrlState.ts',
  'src/list/browseListUrlState.test.ts',
  'src/list/discoveryListRuntime.ts',
  'src/list/explorer/listExplorerDateSections.ts',
  'src/list/explorer/listExplorerDateSections.test.ts',
  'src/list/explorer/listExplorerBucket.ts',
  'src/list/explorer/listExplorerSort.ts',
  'src/list/explorer/listExplorerSort.test.ts',
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

  it('BROWSE-SHIM-02: retired browse shims stay absent', () => {
    const revived: string[] = [];
    for (const file of RETIRED_BROWSE_SHIMS) {
      if (existsSync(join(process.cwd(), file))) revived.push(file);
    }
    expect(revived).toEqual([]);
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