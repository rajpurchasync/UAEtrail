import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
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

  it('keeps discover home on navigation previews (not category feed poster)', () => {
    const home = readFileSync(join(process.cwd(), 'src/list/ui/ListDiscoverHome.tsx'), 'utf8');
    expect(home).toMatch(/ListDiscoverRailPreviewCard/);
    expect(home).not.toMatch(/ListFeedPosterCard/);
  });

  it('uses half-image discover rail without category full-hero overlay', () => {
    const preview = readFileSync(join(process.cwd(), 'src/list/ui/ListDiscoverRailPreviewCard.tsx'), 'utf8');
    expect(preview).toMatch(/mediaHalf/);
    expect(preview).not.toMatch(/ListPosterCategoryOverlay/);
    expect(preview).not.toMatch(/aspect-\[4\/5\]/);
    expect(preview).not.toMatch(/ListFeedPosterCard/);
  });

  it('routes category browse through Instagram-style feed poster', () => {
    const categoryFeed = readFileSync(join(process.cwd(), 'src/list/ui/ListCategoryImageFeed.tsx'), 'utf8');
    expect(categoryFeed).toMatch(/ListFeedPosterCard/);
    expect(categoryFeed).toMatch(/ListFeedVenuePosterCard/);
  });

  it('keeps venue category posters with catalog entity header (not activity host avatar)', () => {
    const venuePoster = readFileSync(
      join(process.cwd(), 'src/list/ui/feed/ListFeedVenuePosterCard.tsx'),
      'utf8'
    );
    expect(venuePoster).toMatch(/resolveListVenuePosterCopy/);
    expect(venuePoster).toMatch(/ListFeedCatalogEntityHeader/);
    expect(venuePoster).not.toMatch(/ListFeedPosterOptionsMenu/);
    expect(venuePoster).not.toMatch(/SecureAvatar/);
  });

  it('keeps category schedule on hero via LIST_FEED overlay (not a white strip below)', () => {
    const poster = readFileSync(join(process.cwd(), 'src/list/ui/feed/ListFeedPosterCard.tsx'), 'utf8');
    const overlay = readFileSync(join(process.cwd(), 'src/list/ui/poster/ListPosterCategoryOverlay.tsx'), 'utf8');
    expect(poster).toMatch(/ListPosterCategoryOverlay/);
    expect(overlay).toMatch(/LIST_FEED\.overlayFactsGrid/);
    expect(overlay).toMatch(/LIST_FEED\.overlayFooterStack/);
    expect(poster).not.toMatch(/ListPosterDiscoverScheduleBody/);
  });

  it('keeps discover home schedule below the half-hero image', () => {
    const preview = readFileSync(join(process.cwd(), 'src/list/ui/ListDiscoverRailPreviewCard.tsx'), 'utf8');
    expect(preview).toMatch(/ListPosterDiscoverScheduleBody/);
    expect(preview).toMatch(/ListPosterDiscoverHeroRequirements/);
    expect(preview).not.toMatch(/ListPosterCategoryOverlay/);
  });

  it('shows requirement tags below category facts panel (discover rails use ListPosterDiscoverHeroRequirements)', () => {
    const overlay = readFileSync(join(process.cwd(), 'src/list/ui/poster/ListPosterCategoryOverlay.tsx'), 'utf8');
    expect(overlay).toMatch(/labelRequirement/);
    expect(overlay).toMatch(/requirementLabels/);
  });

  it('routes search results through the same category image feed', () => {
    const results = readFileSync(join(process.cwd(), 'src/list/ui/ListDiscoveryResults.tsx'), 'utf8');
    expect(results).toMatch(/ListCategoryImageFeed/);
    expect(results).not.toMatch(/ListFeedPosterCard/);
  });

  it('scopes join actions provider to category and search feeds only', () => {
    const experience = readFileSync(join(process.cwd(), 'src/list/ListDiscoveryExperience.tsx'), 'utf8');
    expect(experience).toMatch(/ListFeedActionsProvider/);
    expect(experience).toMatch(/useHostActivitySheetBundle/);
    expect(experience).toMatch(/hostManageSheet/);
    expect(experience).toMatch(/ListCategoryDedicatedView/);
    expect(experience).not.toMatch(/<ListFeedActionsProvider>\s*<BrowseListPageShell/);
  });

  it('map list compact rows use optional list feed actions for L1 footers', () => {
    const exploreShell = readFileSync(join(process.cwd(), 'src/explore/ui/ExploreExperience.tsx'), 'utf8');
    const listRow = readFileSync(join(process.cwd(), 'src/explore/ui/ExploreListRow.tsx'), 'utf8');
    expect(exploreShell).toMatch(/mobileMapListPanel[\s\S]*ListFeedActionsProvider[\s\S]*listFeedHostActions/);
    expect(listRow).toMatch(/ExploreListRowWireFooter/);
  });

  it('forbids legacy rail poster variant strings', () => {
    const violations: string[] = [];
    for (const file of sources) {
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

  it('people search scope opens member discovery list category (not demand)', () => {
    expect(browseListFilterPatchForSearchScope('people')).toEqual({
      categories: ['people'],
      tripLookingOnly: false,
      tripTopics: [],
      placeTopics: [],
    });
  });

  it('keeps explore People panel separate from map list and discover browse', () => {
    const experience = readFileSync(join(process.cwd(), 'src/explore/ui/ExploreExperience.tsx'), 'utf8');
    const peoplePanel = readFileSync(join(process.cwd(), 'src/explore/ui/PeopleBrowsePanel.tsx'), 'utf8');
    const mapListPanel = readFileSync(join(process.cwd(), 'src/explore/ui/ExploreBrowsePanel.tsx'), 'utf8');
    expect(experience).toMatch(/PeopleBrowsePanel/);
    expect(experience).toMatch(/ListDiscoveryExperience/);
    expect(experience).toMatch(/ExploreBrowsePanel/);
    expect(mapListPanel).toMatch(/ExploreListRow/);
    expect(mapListPanel).toMatch(/PANEL_TABS/);
    expect(peoplePanel).toMatch(/from '\.\/peopleBrowse'/);
    expect(peoplePanel).not.toMatch(/ExploreListRow/);
    expect(peoplePanel).not.toMatch(/buildListFeedCards/);
  });

  it('list discover people category uses member discovery roster (not map poster feed)', () => {
    const experience = readFileSync(join(process.cwd(), 'src/list/ListDiscoveryExperience.tsx'), 'utf8');
    expect(experience).toMatch(/PeopleBrowsePanel/);
    expect(experience).toMatch(/embedded/);
    expect(experience).toMatch(/listCat: 'people'/);
    expect(experience).toMatch(/useMemberDiscoveryRoster/);
    expect(experience).toMatch(/PeopleBrowseTabContent|PeopleBrowsePanel/);
  });

  it('builds enriched cards through buildListFeedCards', () => {
    const feed = readFileSync(join(process.cwd(), 'src/list/useBrowseListFeed.ts'), 'utf8');
    const experience = readFileSync(join(process.cwd(), 'src/list/ListDiscoveryExperience.tsx'), 'utf8');
    const exploreShell = readFileSync(join(process.cwd(), 'src/explore/ui/ExploreExperience.tsx'), 'utf8');
    expect(feed).toMatch(/buildListFeedCards/);
    expect(experience).toMatch(/buildListFeedCards/);
    expect(experience).not.toMatch(/buildBrowseCardsFromMapItems/);
    expect(exploreShell).toMatch(/ExploreBrowsePanel/);
    expect(exploreShell).not.toMatch(/usePosterFeed=\{true\}/);
  });

  it('search results use topic pills only (no duplicate removable chip row)', () => {
    const experience = readFileSync(join(process.cwd(), 'src/list/ListDiscoveryExperience.tsx'), 'utf8');
    expect(experience).not.toMatch(/ListActiveFilterChipsRow/);
    expect(experience).toMatch(/searchTripPills/);
    expect(experience).toMatch(/searchPlacePills/);
  });

  it('poster requirement pills use stored requirements, not peek inference', () => {
    const presentation = readFileSync(join(process.cwd(), 'src/list/listPosterPresentation.ts'), 'utf8');
    const standard = readFileSync(join(process.cwd(), 'src/list/listFeedPosterStandard.ts'), 'utf8');
    expect(standard).toMatch(/extractExploreRequirementBadges/);
    expect(presentation).toMatch(/resolveListFeedPosterRequirementLabels/);
    expect(presentation).not.toMatch(/card\.requirementBadges/);
  });
});
