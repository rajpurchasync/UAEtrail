import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  EXPLORE_SEARCH_SCOPES_SHIPPED,
  type ExploreSearchScopeKey,
} from './browse/discoveryListRuntime';
import { browseCategoriesForSearchScope, browseListFilterPatchForSearchScope } from './browse/browseListSearchCommit';

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
  const listDiscoveryModel = () =>
    readFileSync(join(process.cwd(), 'src/list/shell/useListDiscoveryExperienceModel.ts'), 'utf8');
  const listDiscoveryCrewsModel = () =>
    readFileSync(join(process.cwd(), 'src/list/shell/useListDiscoveryCrewsCategoryModel.ts'), 'utf8');
  const listDiscoveryBrowseActionsModel = () =>
    readFileSync(join(process.cwd(), 'src/list/shell/useListDiscoveryBrowseActionsModel.ts'), 'utf8');
  const listDiscoveryBrowseUrlModel = () =>
    readFileSync(join(process.cwd(), 'src/list/shell/useListDiscoveryBrowseUrlModel.ts'), 'utf8');

  it('renders the full-screen explorer instead of poster or map-list rows', () => {
    const experience = readFileSync(join(process.cwd(), 'src/list/ListDiscoveryExperience.tsx'), 'utf8');
    const model = listDiscoveryModel();
    expect(experience).toMatch(/ListExplorer/);
    const explorer = readFileSync(join(process.cwd(), 'src/list/explorer/ListExplorer.tsx'), 'utf8');
    expect(explorer).toMatch(/ListGuestCatalogPreviewNotice/);
    expect(experience).not.toMatch(/BrowseListMapFab/);
    expect(readFileSync(join(process.cwd(), 'src/list/explorer/BrowseListCreateFab.tsx'), 'utf8')).toMatch(
      /LIST_CREATE_FAB/
    );
    expect(readFileSync(join(process.cwd(), 'src/list/browse/listChromeTheme.ts'), 'utf8')).toMatch(
      /MOBILE_DOCK_PRIMARY/
    );
    expect(readFileSync(join(process.cwd(), 'src/list/explorer/ListGuestCatalogPreviewNotice.tsx'), 'utf8')).toMatch(
      /GuestCatalogPreviewBanner/
    );
    expect(experience).toMatch(/showGuestCatalogPreview=\{!user && !embeddedOnExplore/);
    expect(listDiscoveryBrowseUrlModel()).toMatch(/countBrowseListFilters/);
    expect(listDiscoveryCrewsModel()).toMatch(/browseListEntityLinkState/);
    expect(listDiscoveryBrowseUrlModel()).toMatch(/parseBrowseListBucket/);
    expect(model).toMatch(/browseListBucketCategories/);
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
    expect(chrome).toMatch(/aspect-\[3\/2\]/);
    expect(chrome).toMatch(/rounded-xl/);
    expect(chrome).toMatch(/rounded-\[8px\]/);
    expect(readFileSync(join(process.cwd(), 'src/discovery/DiscoveryBrowseThumbnailPoster.tsx'), 'utf8')).toMatch(
      /typeIconBare/
    );
    expect(listing).toMatch(/DiscoveryBrowseListEngagementFooter/);
    expect(listing).toMatch(/hideHostBand/);
    expect(listing).toMatch(/DiscoveryBrowseCardHero/);
    expect(listing).not.toMatch(/overlayContent/);
    expect(listing).toMatch(/resolveVenueBrowseCardCopy/);
    expect(listing).toMatch(/scheduleHint/);
    expect(listing).toMatch(/schedulePath/);
    expect(listing).toMatch(/TitleRating/);
    expect(listing).not.toMatch(/\bNew\b/);
    expect(tripListing).toMatch(/DiscoveryBrowseCardHero/);
    expect(
      readFileSync(join(process.cwd(), 'src/discovery/browse/DiscoveryBrowseCardHero.tsx'), 'utf8')
    ).toMatch(/overlayContent/);
    expect(tripListing).toMatch(/hideHostBand/);
    expect(tripListing).toMatch(/resolveTripBrowseCardCopy/);
    const thumbPoster = readFileSync(
      join(process.cwd(), 'src/discovery/DiscoveryBrowseThumbnailPoster.tsx'),
      'utf8'
    );
    expect(thumbPoster).toMatch(/BrowseCardPhotoShare/);
    expect(thumbPoster).toMatch(/typeIconBare/);
    expect(tripListing).toMatch(/DiscoveryBrowseListEngagementFooter/);
    expect(tripListing).toMatch(/listing.carpool/);
    expect(tripListing).toMatch(/listing.hostName/);
    expect(tripListing).toMatch(/LIST_FEED_CTA_CARPOOL|carpool.label/);
    expect(readFileSync(join(process.cwd(), 'src/list/ListDiscoveryExperience.tsx'), 'utf8')).toMatch(
      /ListFeedActionsProvider/
    );
    expect(readFileSync(join(process.cwd(), 'src/list/browse/ListFeedWireFooterButtons.tsx'), 'utf8')).toMatch(
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
    const searchField = readFileSync(join(process.cwd(), 'src/list/explorer/ListDiscoverySearchField.tsx'), 'utf8');
    expect(searchField).toMatch(/LIST_SEARCH\.shell/);
    expect(searchField.indexOf('{filterSlot}')).toBeGreaterThan(searchField.indexOf('LIST_SEARCH.shell'));
    expect(header).toMatch(/stickySearch/);
    expect(header).toMatch(/ListExplorerViewSwitch/);
    expect(header).toMatch(/ListExplorerBucketToggle/);
    expect(header).toMatch(/ExploreMapProjectionToggle/);
    expect(header).toMatch(/searchCounts/);
  });

  it('filter fab snaps to corners and shows applied count', () => {
    const fab = readFileSync(join(process.cwd(), 'src/list/explorer/ListExplorerFilterFab.tsx'), 'utf8');
    const pop = readFileSync(join(process.cwd(), 'src/list/explorer/ListExplorerFilterPop.tsx'), 'utf8');
    expect(fab).toMatch(/snapListFilterFabCorner/);
    expect(fab).toMatch(/filterCount/);
    expect(fab).toMatch(/ListExplorerFilterPop/);
    expect(pop).toMatch(/LIST_BROWSE_TRIP_TYPE_OPTIONS/);
    expect(pop).toMatch(/Who can attend/);
    expect(pop).not.toMatch(/By facilities/);
    expect(fab).toMatch(/LIST_FILTER_FAB_Z/);
    expect(fab).toMatch(/bucket/);
    expect(pop).toMatch(/LIST_BROWSE_PLACE_TYPE_OPTIONS/);
    expect(pop).toMatch(/bucket === 'places'/);
  });

  it('sort overlay stacks above filter fab', () => {
    const sort = readFileSync(join(process.cwd(), 'src/list/explorer/ListExplorerSortControl.tsx'), 'utf8');
    const theme = readFileSync(join(process.cwd(), 'src/list/browse/listChromeTheme.ts'), 'utf8');
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
      tripAvailabilityOnly: false,
      tripTopics: [],
      placeTopics: [],
    });
  });

  it('explore peopleBrowse re-export shim is gone (EXPLORE-IA)', () => {
    expect(existsSync(join(process.cwd(), 'src/explore/ui/peopleBrowse'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'src/explore/CrewBrowseTab.ts'))).toBe(false);
  });

  it('keeps explore Crews browse panel separate from the list explorer', () => {
    const browsePanels = readFileSync(
      join(process.cwd(), 'src/explore/shell/ExploreExperienceBrowsePanels.tsx'),
      'utf8'
    );
    const crewsBrowsePanel = readFileSync(
      join(process.cwd(), 'src/crew-discovery/panel/CrewsBrowsePanel.tsx'),
      'utf8'
    );
    expect(browsePanels).toMatch(/CrewsBrowsePanel/);
    expect(browsePanels).not.toMatch(/ExploreBrowsePanel/);
    expect(browsePanels).toMatch(/ListDiscoveryExperience/);
    expect(crewsBrowsePanel).toMatch(/from '\.\/crewBrowse'/);
    const crewLookingList = readFileSync(
      join(process.cwd(), 'src/crew-discovery/panel/crewBrowse/CrewBrowseAvailabilityMapList.tsx'),
      'utf8'
    );
    expect(crewLookingList).toMatch(/ExploreListRow/);
    expect(crewsBrowsePanel).not.toMatch(/buildListFeedCards/);
  });

  it('list discover people category uses member discovery roster', () => {
    const experience = readFileSync(join(process.cwd(), 'src/list/ListDiscoveryExperience.tsx'), 'utf8');
    const model = listDiscoveryModel();
    expect(experience).toMatch(/CrewsBrowsePanel/);
    expect(experience).toMatch(/embedded/);
    expect(listDiscoveryBrowseActionsModel()).toMatch(/listCat: 'people'/);
    expect(listDiscoveryCrewsModel()).toMatch(/useCrewDiscoveryRoster/);
  });

  it('explore map pin pool uses discovery selectors via shell composer', () => {
    const browseList = readFileSync(join(process.cwd(), 'src/explore/ui/useExploreBrowseList.ts'), 'utf8');
    expect(browseList).toMatch(/selectExploreLensItems/);
    expect(browseList).toMatch(/selectActivitiesFromMapItems/);
    expect(browseList).not.toMatch(/selectExploreMapPinCatalog/);
    expect(browseList).not.toMatch(/FromExploreCatalog/);
    expect(browseList).not.toMatch(/matchesBuddyMapFilter/);
  });

  it('crew Looking for uses availability catalog read hook', () => {
    const model = listDiscoveryModel();
    const crews = listDiscoveryCrewsModel();
    const bundle = readFileSync(
      join(process.cwd(), 'src/crew-discovery/hooks/useCrewDiscoveryBrowseBundle.ts'),
      'utf8'
    );
    expect(crews).toMatch(/useCrewDiscoveryAvailabilityCatalog/);
    expect(bundle).toMatch(/useCrewDiscoveryAvailabilityCatalog/);
    expect(bundle).not.toMatch(/from ['"]@\/api\/domains\//);
  });

  it('list map feed filters delegate seeking and place merge to discovery modules', () => {
    const filters = readFileSync(join(process.cwd(), 'src/list/browse/browseListFilters.ts'), 'utf8');
    expect(filters).toMatch(/activity-discovery\/catalog\/listAvailabilityCatalog/);
    expect(filters).toMatch(/places-discovery\/catalog\/listCatalog/);
    expect(filters).not.toMatch(/exploreMapItemIsSeeking/);
  });

  it('builds enriched cards through buildListFeedCards', () => {
    const feed = readFileSync(join(process.cwd(), 'src/list/browse/useBrowseListFeed.ts'), 'utf8');
    const experience = readFileSync(join(process.cwd(), 'src/list/ListDiscoveryExperience.tsx'), 'utf8');
    expect(feed).toMatch(/buildListFeedCards/);
    expect(
      readFileSync(join(process.cwd(), 'src/list/shell/useListDiscoveryExperienceModel.ts'), 'utf8')
    ).not.toMatch(/buildBrowseCardsFromMapItems/);
  });

  /** Explore shell may import `explore/search`, map chrome, compose — browse projections use {@link discoveryListRuntime}. */
  it('list browse projection sources import explore only via discoveryRuntime', () => {
    const exploreShellSources = new Set([
      'src/list/ListDiscoveryExperience.tsx',
      'src/list/BrowseListPage.tsx',
      'src/list/shell/useListDiscoveryExperienceModel.ts',
      'src/list/shell/useListDiscoveryExploreSearchFeedModel.ts',
      'src/list/shell/useListDiscoveryComposeBridgeModel.ts',
      'src/list/shell/useListDiscoveryBrowseActionsModel.ts',
      'src/list/shell/useListDiscoveryBrowseUrlModel.ts',
      'src/list/browse/listDiscoverySearchCreateFlowStub.ts',
      'src/list/browse/useListDiscoveryUrlState.ts',
    ]);
    const deepExploreImport =
      /from ['"](?:\.\.\/)+explore\/(?!routing(?:['"]|;)|exploreMapTopicUrlParams(?:['"]|;)|exploreMapItemKind)/;
    const violations: string[] = [];
    for (const file of sources) {
      if (!file.startsWith('src/list/browse/')) continue;
      if (exploreShellSources.has(file)) continue;
      if (file === 'src/list/browse/discoveryListRuntime.ts') continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (deepExploreImport.test(content)) violations.push(file);
    }
    expect(
      violations,
      `Use src/list/browse/discoveryListRuntime.ts (shell-adjacent browse hooks exempt):\n${violations.join('\n')}`
    ).toEqual([]);
  });

  it('discoveryListRuntime is the sole list→explore facade for projections', () => {
    const facade = readFileSync(join(process.cwd(), 'src/list/browse/discoveryListRuntime.ts'), 'utf8');
    expect(facade).toMatch(/export \* from '\.\.\/\.\.\/explore\/discoveryRuntime'/);
    expect(existsSync(join(process.cwd(), 'src/list/browse/discoveryListRuntime.ts'))).toBe(true);
  });

  it('browse logic APIs stay under src/list/browse (no revived explorer browse modules)', () => {
    const banned =
      /\b(parseListExplorer(Layout|Sort|Bucket)|sortListExplorerCards|listCatForListExplorerBucket|listExplorerBucketCategories)\b/;
    const importBanned =
      /from ['"][^'"]*list\/explorer\/(listExplorerSort|listExplorerLayout|listExplorerBucket|listExplorerDateSections|listExplorerFabSnap)/;
    const violations: string[] = [];
    for (const file of sources) {
      if (file.startsWith('src/list/explorer/')) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (banned.test(content)) violations.push(`${file}: legacy listExplorer browse API`);
      if (importBanned.test(content)) violations.push(`${file}: import from retired explorer browse module`);
    }
    expect(violations).toEqual([]);
    expect(readFileSync(join(process.cwd(), 'src/list/explorer/ListExplorerFilterFab.tsx'), 'utf8')).toMatch(
      /browse\/listFilterFabSnap/
    );
    expect(readFileSync(join(process.cwd(), 'src/list/shell/useListDiscoveryExperienceModel.ts'), 'utf8')).toMatch(
      /browse\/browseListBucket/
    );
  });
});
