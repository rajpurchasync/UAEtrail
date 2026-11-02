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

  it('thumbnail grid is at least two columns on mobile', () => {
    const explorer = readFileSync(join(process.cwd(), 'src/list/explorer/ListExplorer.tsx'), 'utf8');
    expect(explorer).toMatch(/grid-cols-2/);
    expect(explorer).toMatch(/ListExplorerThumbnailCard/);
    expect(explorer).toMatch(/ListExplorerFilterFab/);
  });

  it('puts type icon on the thumbnail and keeps search in the header', () => {
    const thumb = readFileSync(join(process.cwd(), 'src/list/explorer/ListExplorerThumbnailCard.tsx'), 'utf8');
    const header = readFileSync(join(process.cwd(), 'src/list/explorer/ListExplorerHeader.tsx'), 'utf8');
    expect(thumb).toMatch(/DiscoveryCardTypeIcon/);
    expect(thumb).toMatch(/SecureAvatar/);
    expect(thumb).toMatch(/meta\.title/);
    expect(thumb).toMatch(/meta\.price/);
    expect(readFileSync(join(process.cwd(), 'src/list/explorer/listExplorerCardMeta.ts'), 'utf8')).toMatch(
      /resolveActivityPublisherChip/
    );
    expect(thumb).not.toMatch(/listTitle \|\| card\.headline/);
    expect(header).toMatch(/ListDiscoverySearchField/);
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
    expect(fab).toMatch(/z-\[1220\]/);
    expect(fab).toMatch(/bucket/);
    expect(pop).toMatch(/listVenuePlaceTopicsForUi/);
    expect(pop).toMatch(/bucket === 'places'/);
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
