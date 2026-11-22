import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('consumerAppSurfacesDataGuard (in-app hubs — not guest marketing)', () => {
  it('CTX-APP-01: explore map + list discovery load catalog from hooks', () => {
    expect(read('src/explore/shell/useExploreMapCatalog.ts')).toMatch(/useExploreMap/);
    expect(read('src/list/useBrowseListFeed.ts')).toMatch(/useExploreMap/);
    expect(read('src/list/ListDiscoveryExperience.tsx')).toMatch(/useBrowseListFeed/);
    expect(read('src/explore/search/ExploreSearchResults.tsx')).toMatch(/useBrowseListFeed/);
  });

  it('CTX-APP-02: booking + hub where suggestions use place/area catalog APIs', () => {
    expect(read('src/explore/search/useExploreSearchWhereSuggestions.ts')).toMatch(/fetchPlaceCatalogRows/);
    expect(read('src/explore/search/useExploreSearchWhereSuggestions.ts')).toMatch(/useExplorePublishedAreas/);
    expect(read('src/explore/search/ExploreSearchResultsChrome.tsx')).toMatch(/useExploreRegionPillOptions/);
  });

  it('CTX-APP-03: plan + host destination pickers merge published areas for emirates', () => {
    expect(read('src/components/plan/PlanAvailabilitySection.tsx')).toMatch(
      /mergeVenueStateFilterOptionsWithAreas/
    );
    expect(read('src/explore/ui/HostingDestinationCascade.tsx')).toMatch(
      /buildPlaceCatalogStateOptions\(countryCode, areas\)/
    );
    expect(read('src/places/placeCatalogDestinationIndex.ts')).toMatch(
      /mergeVenueStateFilterOptionsWithAreas/
    );
  });

  it('CTX-APP-04: profile + crews hubs surface API-fed stats (not fixture cards)', () => {
    expect(read('src/pages/Profile.tsx')).toMatch(/useMeProfileStats/);
    expect(read('src/pages/Profile.tsx')).toMatch(/useParticipantHubData/);
    expect(read('src/list/crews/CrewsHubHome.tsx')).toMatch(/MemberBrowseCardDTO/);
  });

  it('CTX-APP-05: consumer pages avoid static getRegionsForCountry pickers in explore/plan', () => {
    expect(read('src/components/plan/PlanAvailabilitySection.tsx')).not.toMatch(/getRegionsForCountry/);
    expect(read('src/explore/ui/HostingDestinationCascade.tsx')).not.toMatch(/getRegionsForCountry/);
  });

  it('CTX-APP-07: list geo scope chip + map/list handoff preserve geo param', () => {
    expect(read('src/list/explorer/ListExplorerGeoScopeChip.tsx')).toMatch(/formatBrowseGeoPathLabel/);
    expect(read('src/list/ListDiscoveryExperience.tsx')).toMatch(/onClearGeoScope/);
    expect(read('src/list/explorer/ListExplorerHeader.tsx')).toMatch(/ListExplorerGeoScopeChip/);
    expect(read('src/list/routing.ts')).toMatch(/parseBrowseListGeoPath/);
    expect(read('src/list/browseListFilters.ts')).toMatch(/deriveVenueRegionSortOrder/);
    expect(read('src/places-discovery/catalog/listCatalog.ts')).toMatch(/venueRegionOrder/);
  });

  it('CTX-APP-09: explore map URL + feed honor geo scope', () => {
    expect(read('src/explore/exploreBrowseUrlHydrate.ts')).toMatch(/geoPath/);
    expect(read('src/explore/exploreBrowseUrlSync.ts')).toMatch(/BROWSE_GEO_PARAM/);
    expect(read('src/explore/ui/useExploreBrowseList.ts')).toMatch(/exploreItemMatchesBrowseGeoPath/);
    expect(read('src/list/browse/browseGeoPath.ts')).toMatch(/resolveEffectiveBrowseVenueRegions/);
  });

  it('CTX-APP-10: explore map mobile chrome shows geo scope chip', () => {
    expect(read('src/explore/shell/ExploreMapShell.tsx')).toMatch(/applyGeoPath/);
    expect(read('src/explore/ui/ExploreMapMobileLayerChrome.tsx')).toMatch(/ListExplorerGeoScopeChip/);
    expect(read('src/explore/ui/ExploreMapMobileLayerChrome.tsx')).toMatch(/onClearGeoScope/);
  });

  it('CTX-APP-11: browse geo scope hydrates geo tree from registry', () => {
    expect(read('src/list/browse/useBrowseGeoScopeHydration.ts')).toMatch(/fetchGeoTreeIntoStore/);
    expect(read('src/list/ListDiscoveryExperience.tsx')).toMatch(/useBrowseGeoScopeHydration/);
    expect(read('src/explore/shell/useExploreExperienceModel.ts')).toMatch(/useBrowseGeoScopeHydration/);
    expect(read('src/explore/search/ExploreSearchResults.tsx')).toMatch(/useBrowseGeoScopeHydration/);
  });

  it('CTX-APP-13: browse filter + geo state uses URL on list and explore', () => {
    expect(read('src/list/useListDiscoveryUrlState.ts')).toMatch(/parseBrowseListGeoPath/);
    expect(read('src/list/useListDiscoveryUrlState.ts')).toMatch(/serializeBrowseListSearchParams/);
    expect(read('src/explore/exploreBrowseUrlSync.ts')).toMatch(/BROWSE_GEO_PARAM/);
    expect(read('src/explore/ui/useExploreBrowseUrlState.ts')).toMatch(/geoPath/);
    expect(read('src/list/browseListFilters.ts')).toMatch(/deriveVenueRegionSortOrder\(publishedAreas\)/);
  });

  it('CTX-APP-16: venue region filter defers alias matching to locationSearch', () => {
    expect(read('src/utils/venueRegionFilter.ts')).toMatch(/matchesRegionLabel/);
    expect(read('src/utils/locationSearch.ts')).toMatch(/EXPLORE_EMIRATE_REGION_ALIASES/);
    expect(read('src/utils/venueRegionFilter.ts')).not.toMatch(/EXPLORE_EMIRATE_REGION_ALIASES/);
  });

  it('CTX-APP-15: region text helpers use published-area keys', () => {
    expect(read('src/config/regions.ts')).toMatch(/consumerEmirateKeys/);
    expect(read('src/utils/locationSearch.ts')).toMatch(/consumerEmirateKeys/);
    expect(read('src/explore/exploreListSort.ts')).toMatch(/consumerEmirateKeys/);
    expect(read('src/components/plan/PlanAvailabilitySection.tsx')).toMatch(
      /mergeVenueStateFilterOptionsWithAreas/
    );
  });

  it('CTX-APP-14: geo hub browse pane hydrates registry + API items', () => {
    expect(read('src/geo/GeoBrowsePane.tsx')).toMatch(/useBrowseGeoScopeHydration/);
    expect(read('src/geo/GeoBrowsePane.tsx')).not.toMatch(/exploreMapItemFixtures/);
    expect(read('src/geo/GeoBrowsePane.tsx')).toMatch(/filterExploreMapItemsForList/);
  });

  it('CTX-APP-12: desktop browse collapse + map geo chip', () => {
    expect(read('src/list/explorer/ListExplorer.tsx')).toMatch(/BrowsePanelCollapsedRail/);
    expect(read('src/list/explorer/ListExplorer.tsx')).toMatch(/buildBrowseCollapsedRailLabels/);
    expect(read('src/explore/ui/ExploreMapStage.tsx')).toMatch(
      /isDesktop[\s\S]*ListExplorerGeoScopeChip/
    );
    expect(read('src/explore/ui/EmirateFromPinField.tsx')).toMatch(/useVenueStateFilterOptions/);
    expect(read('src/explore/ui/EmirateFromPinField.tsx')).not.toMatch(/getRegionsForCountry\('AE'\)/);
  });

  it('CTX-APP-08: browse cards location tail opens geo-scoped list', () => {
    expect(read('src/discovery/browse/resolveDiscoveryBrowseGeoLink.ts')).toMatch(
      /resolveDiscoveryBrowseGeoListPath/
    );
    expect(read('src/list/browse/venueBrowseCardCopy.ts')).toMatch(/resolveDiscoveryBrowseLocationHref/);
    expect(read('src/list/browse/tripBrowseCardCopy.ts')).toMatch(/resolveDiscoveryBrowseLocationHref/);
    expect(read('src/places-discovery/catalog/places.ts')).toMatch(/venueRegionOrder/);
    expect(read('src/explore/shell/selectExploreLensItems.ts')).toMatch(/venueRegionOrder/);
  });

  it('CTX-APP-06: list geo URL, venue sort order, and Pro emirates follow published areas', () => {
    expect(read('src/list/browseListUrlState.ts')).toMatch(/BROWSE_GEO_PARAM/);
    expect(read('src/list/browseListFilters.ts')).toMatch(/exploreItemMatchesBrowseGeoPath/);
    expect(read('src/explore/exploreListSort.ts')).toMatch(/deriveVenueRegionSortOrder/);
    expect(read('src/explore/ui/useExploreBrowseList.ts')).toMatch(/deriveVenueRegionSortOrder/);
    expect(read('src/components/organisation-console/ProProfileApplicationFlow.tsx')).toMatch(
      /mergeVenueStateFilterOptionsWithAreas/
    );
    expect(read('src/components/organisation-console/ProProfileApplicationFlow.tsx')).not.toMatch(
      /getRegionsForCountry\(DEFAULT_COUNTRY\)/
    );
  });
});