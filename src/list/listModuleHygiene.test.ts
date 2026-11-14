import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  EXPLORE_SEARCH_SCOPES_SHIPPED,
  type ExploreSearchScopeKey,
} from '../explore/exploreBrowseTaxonomy';
import { browseCategoriesForSearchScope, browseListFilterPatchForSearchScope } from './listDiscoverySearchCommit';

const LIST_ROOT = join(process.cwd(), 'src/list');

const collectListSources = (): string[] => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if ((entry.endsWith('.ts') || entry.endsWith('.tsx')) && !entry.endsWith('.test.ts')) {
        files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
      }
    }
  };
  walk(LIST_ROOT);
  return files;
};

describe('list module hygiene', () => {
  const sources = collectListSources();

  it('renders the full-screen explorer instead of poster or map-list rows', () => {
    const experience = readFileSync(join(process.cwd(), 'src/list/ListDiscoveryExperience.tsx'), 'utf8');
    expect(experience).toMatch(/ListExplorer/);
    const explorer = readFileSync(join(process.cwd(), 'src/list/explorer/ListExplorer.tsx'), 'utf8');
    expect(explorer).toMatch(/ListGuestCatalogPreviewNotice/);
    expect(readFileSync(join(process.cwd(), 'src/list/ui/BrowseListMapFab.tsx'), 'utf8')).toMatch(
      /LIST_MAP_FLOAT/
    );
    expect(readFileSync(join(process.cwd(), 'src/list/ui/BrowseListCreateFab.tsx'), 'utf8')).toMatch(
      /LIST_CREATE_FAB/
    );
    expect(readFileSync(join(process.cwd(), 'src/list/listChromeTheme.ts'), 'utf8')).toMatch(
      /MOBILE_DOCK_PRIMARY/
    );
    expect(readFileSync(join(process.cwd(), 'src/list/ui/ListGuestCatalogPreviewNotice.tsx'), 'utf8')).toMatch(
      /GuestCatalogPreviewBanner/
    );
    expect(experience).toMatch(/showGuestCatalogPreview=\{!user && !embeddedOnExplore/);
    expect(experience).toMatch(/countListExplorerFilters/);
    expect(experience).toMatch(/listExplorerEntityLinkState/);
    expect(experience).toMatch(/parseListExplorerBucket/);
    expect(experience).toMatch(/listExplorerBucketCategories/);
    expect(experience).not.toMatch(/ListDiscoverHome/);
    expect(experience).not.toMatch(/ListFeedPosterCard/);
    expect(experience).not.toMatch(/ListCategoryDedicatedView/);
    expect(experience).not.toMatch(/ExploreBrowsePanel/);
  });

  it('old poster, rail, and map-list UI files are gone', () => {
    const gone = [
      'src/explore/ui/ExploreBrowsePanel.tsx',
      'src/explore/shell/useExploreBrowsePanelShared.ts',
      'src/list/ui/ListDiscoverHome.tsx',
      'src/list/ui/ListDiscoveryHeader.tsx',
      'src/list/ui/ListRefineSheet.tsx',
      'src/list/listDiscoveryMode.ts',
      'src/list/listDiscoverRails.ts',
      'src/list/listFeedTheme.ts',
    ];
    expect(gone.filter((file) => existsSync(join(process.cwd(), file)))).toEqual([]);
  });

  it('thumbnail grid is one column for trip and venue listing cards', () => {
    const explorer = readFileSync(join(process.cwd(), 'src/list/explorer/ListExplorer.tsx'), 'utf8');
    expect(explorer).toMatch(/grid-cols-1/);
    expect(explorer).not.toMatch(/grid-cols-2/);
    expect(explorer).toMatch(/BrowseThumbnailCard/);
    expect(explorer).toMatch(/ListExplorerFilterFab/);
  });

  it('puts type icon on the thumbnail and keeps search in the header', () => {
    const thumb = readFileSync(join(process.cwd(), 'src/list/browse/BrowseThumbnailCard.tsx'), 'utf8');
    const listing = readFileSync(join(process.cwd(), 'src/list/browse/VenueBrowseCard.tsx'), 'utf8');
    const tripListing = readFileSync(join(process.cwd(), 'src/list/browse/TripBrowseCard.tsx'), 'utf8');
    const chrome = readFileSync(join(process.cwd(), 'src/list/browse/browseCardChrome.tsx'), 'utf8');
    const header = readFileSync(join(process.cwd(), 'src/list/explorer/ListExplorerHeader.tsx'), 'utf8');
    expect(thumb).toMatch(/VenueBrowseCard/);
    expect(thumb).toMatch(/TripBrowseCard/);
    expect(chrome).toMatch(/ShareButton/);
    expect(chrome).toMatch(/iconOnly/);
    expect(chrome).toMatch(/aspect-\[5\/2\]/);
    expect(chrome).toMatch(/rounded-xl/);
    expect(chrome).toMatch(/rounded-\[8px\]/);
    expect(listing).toMatch(/typeIconBare/);
    expect(listing).toMatch(/ExploreWishlistSaveButton/);
    expect(listing).toMatch(/LIST_FEED_CTA_GET_DIRECTIONS/);
    expect(listing).toMatch(/LIST_FEED_CTA_WISHLIST/);
    expect(listing).toMatch(/BROWSE_CARD_FOOTER/);
    expect(listing).toMatch(/compact/);
    expect(listing).toMatch(/overlayContent/);
    expect(listing).toMatch(/resolveVenueBrowseCardCopy/);
    expect(listing).toMatch(/scheduleHint/);
    expect(listing).toMatch(/schedulePath/);
    expect(listing).toMatch(/TitleRating/);
    expect(listing).not.toMatch(/\bNew\b/);
    expect(tripListing).toMatch(/typeIconBare/);
    expect(tripListing).toMatch(/overlayContent/);
    expect(tripListing).toMatch(/hideHostBand/);
    expect(tripListing).toMatch(/resolveTripBrowseCardCopy/);
    expect(tripListing).toMatch(/BrowseCardPhotoShare/);
    expect(tripListing).toMatch(/BrowseCardJoinFooter/);
    expect(tripListing).toMatch(/listing.carpool/);
    expect(tripListing).toMatch(/listing.hostName/);
    expect(tripListing).toMatch(/LIST_FEED_CTA_CARPOOL|carpool.label/);
    expect(readFileSync(join(process.cwd(), 'src/list/ListDiscoveryExperience.tsx'), 'utf8')).toMatch(
      /ListFeedActionsProvider/
    );
    expect(readFileSync(join(process.cwd(), 'src/list/ui/ListFeedWireFooterButtons.tsx'), 'utf8')).toMatch(
      /listing/
    );
    const banner = readFileSync(
      join(process.cwd(), 'src/discovery/DiscoveryBrowsePosterBanner.tsx'),
      'utf8'
    );
    expect(banner).toMatch(/DiscoveryCardTypeIcon/);
    expect(banner).toMatch(/typeIconBare/);
    expect(banner).toMatch(/showOverlayMeta/);
    expect(banner).toMatch(/overlayContent/);
    expect(banner).toMatch(/hideHostBand/);
    expect(banner).toMatch(/SecureAvatar/);
    expect(banner).toMatch(/meta\.price/);
    expect(readFileSync(join(process.cwd(), 'src/list/browse/browseCardMeta.ts'), 'utf8')).toMatch(
      /resolveActivityPublisherChip/
    );
    expect(thumb).not.toMatch(/listTitle \|\| card\.headline/);
    expect(header).toMatch(/ListDiscoverySearchField/);
    expect(header).toMatch(/filterSlot/);
    expect(header).toMatch(/mt-2\.5/);
    const searchField = readFileSync(join(process.cwd(), 'src/list/ui/ListDiscoverySearchField.tsx'), 'utf8');
    expect(searchField).toMatch(/LIST_SEARCH\.shell/);
    expect(searchField.indexOf('{filterSlot}')).toBeGreaterThan(searchField.indexOf('LIST_SEARCH.shell'));
    expect(header).toMatch(/stickySearch/);
    expect(header).toMatch(/ListExplorerViewSwitch/);
    expect(header).toMatch(/ListExplorerBucketToggle/);
    expect(header).toMatch(/searchCounts/);
  });

  it('filter fab snaps to corners and shows applied count', () => {
    const fab = readFileSync(join(process.cwd(), 'src/list/explorer/ListExplorerFilterFab.tsx'), 'utf8');
    const pop = readFileSync(join(process.cwd(), 'src/list/explorer/ListExplorerFilterPop.tsx'), 'utf8');
    expect(fab).toMatch(/snapListFilterFabCorner/);
    expect(fab).toMatch(/filterCount/);
    expect(fab).toMatch(/ListExplorerFilterPop/);
    expect(fab).toMatch(/LIST_FILTER_FAB_Z/);
    expect(fab).toMatch(/bucket/);
    expect(pop).toMatch(/listVenuePlaceTopicsForUi/);
    expect(pop).toMatch(/bucket === 'places'/);
  });

  it('sort overlay stacks above filter fab', () => {
    const sort = readFileSync(join(process.cwd(), 'src/list/explorer/ListExplorerSortControl.tsx'), 'utf8');
    const theme = readFileSync(join(process.cwd(), 'src/list/listChromeTheme.ts'), 'utf8');
    expect(sort).toMatch(/LIST_OVERLAY_Z/);
    expect(theme).toMatch(/LIST_FILTER_FAB_Z/);
    expect(theme).toMatch(/LIST_OVERLAY_Z/);
  });

  it('forbids leftover poster/rail strings in list sources', () => {
    const violations: string[] = [];
    for (const file of sources) {
      if (file.includes('/explorer/')) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/variant\s*=\s*["']rail["']/.test(content)) violations.push(file);
      if (/BrowsePosterCard/.test(content)) violations.push(file);
    }
    expect(violations).toEqual([]);
  });

  it('maps every shipped explore search scope to list categories', () => {
    for (const scope of EXPLORE_SEARCH_SCOPES_SHIPPED) {
      expect(browseCategoriesForSearchScope(scope)).not.toBeNull();
    }
    expect(browseCategoriesForSearchScope('facilities' as ExploreSearchScopeKey)).toBeNull();
  });

  it('people search scope opens member discovery list category', () => {
    expect(browseListFilterPatchForSearchScope('people')).toEqual({
      categories: ['people'],
      tripLookingOnly: false,
      tripTopics: [],
      placeTopics: [],
    });
  });

  it('explore peopleBrowse re-export shim is gone (EXPLORE-IA)', () => {
    expect(existsSync(join(process.cwd(), 'src/explore/ui/peopleBrowse'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'src/explore/peopleBrowseTab.ts'))).toBe(false);
  });

  it('keeps explore People panel separate from the list explorer', () => {
    const browsePanels = readFileSync(
      join(process.cwd(), 'src/explore/shell/ExploreExperienceBrowsePanels.tsx'),
      'utf8'
    );
    const peoplePanel = readFileSync(
      join(process.cwd(), 'src/people-discovery/panel/PeopleBrowsePanel.tsx'),
      'utf8'
    );
    expect(browsePanels).toMatch(/PeopleBrowsePanel/);
    expect(browsePanels).not.toMatch(/ExploreBrowsePanel/);
    expect(browsePanels).toMatch(/ListDiscoveryExperience/);
    expect(peoplePanel).toMatch(/from '\.\/peopleBrowse'/);
    const peopleLookingList = readFileSync(
      join(process.cwd(), 'src/people-discovery/panel/peopleBrowse/PeopleBrowseLookingList.tsx'),
      'utf8'
    );
    expect(peopleLookingList).toMatch(/ExploreListRow/);
    expect(peoplePanel).not.toMatch(/buildListFeedCards/);
  });

  it('list discover people category uses member discovery roster', () => {
    const experience = readFileSync(join(process.cwd(), 'src/list/ListDiscoveryExperience.tsx'), 'utf8');
    expect(experience).toMatch(/PeopleBrowsePanel/);
    expect(experience).toMatch(/embedded/);
    expect(experience).toMatch(/listCat: 'people'/);
    expect(experience).toMatch(/useMemberDiscoveryRoster/);
  });

  it('explore map pin pool uses discovery selectors via shell composer', () => {
    const browseList = readFileSync(join(process.cwd(), 'src/explore/ui/useExploreBrowseList.ts'), 'utf8');
    expect(browseList).toMatch(/selectExploreMapPinCatalog/);
    expect(browseList).toMatch(/selectActivitiesFromExploreCatalog/);
    expect(browseList).not.toMatch(/matchesBuddyMapFilter/);
  });

  it('people Looking for uses dedicated seeking-activities read hook', () => {
    const experience = readFileSync(join(process.cwd(), 'src/list/ListDiscoveryExperience.tsx'), 'utf8');
    const bundle = readFileSync(
      join(process.cwd(), 'src/people-discovery/hooks/usePeopleDiscoveryBrowseBundle.ts'),
      'utf8'
    );
    expect(experience).toMatch(/usePeopleDiscoverySeekingActivities/);
    expect(bundle).toMatch(/usePeopleDiscoverySeekingActivities/);
    expect(bundle).not.toMatch(/from ['"]@\/api\/domains\//);
  });

  it('list map feed filters delegate seeking and place merge to discovery modules', () => {
    const filters = readFileSync(join(process.cwd(), 'src/list/browseListFilters.ts'), 'utf8');
    expect(filters).toMatch(/activity-discovery\/catalog\/listSeeking/);
    expect(filters).toMatch(/places-discovery\/catalog\/listCatalog/);
    expect(filters).not.toMatch(/exploreMapItemIsSeeking/);
  });

  it('builds enriched cards through buildListFeedCards', () => {
    const feed = readFileSync(join(process.cwd(), 'src/list/useBrowseListFeed.ts'), 'utf8');
    const experience = readFileSync(join(process.cwd(), 'src/list/ListDiscoveryExperience.tsx'), 'utf8');
    expect(feed).toMatch(/buildListFeedCards/);
    expect(experience).not.toMatch(/buildBrowseCardsFromMapItems/);
  });
});
