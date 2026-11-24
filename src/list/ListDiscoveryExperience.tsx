import { CrewsBrowsePanel } from '@/crew-discovery/panel/CrewsBrowsePanel';
import { ListFeedActionsProvider } from './browse/ListFeedActionsProvider';
import { browseListCatForBucket, scopeBrowseListStateForListCat } from './browse/browseListMapHandoff';
import { BrowseListCreateFab } from './explorer/BrowseListCreateFab';
import { ListCrewsExplorer } from './explorer/ListCrewsExplorer';
import { ListMyCrewHub } from './explorer/ListMyCrewHub';
import { ListDiscoveryMapColumn } from './explorer/ListDiscoveryMapColumn';
import { ListExplorer } from './explorer/ListExplorer';
import { ListSideMapResizeHandle } from './explorer/ListSideMapResizeHandle';
import {
  useListDiscoveryExperienceModel,
  type ListDiscoveryExperienceProps,
} from './shell/useListDiscoveryExperienceModel';

export type { ListDiscoveryExperienceProps } from './shell/useListDiscoveryExperienceModel';

export const ListDiscoveryExperience = (props: ListDiscoveryExperienceProps) => {
  const {
    surface,
    onCloseMapOverlay,
    overlayImmersive,
    hubListRoot,
    embeddedOnExplore,
    searchResultsChrome,
    exploreSearch,
    suppressListSearch,
    user,
    draftQuery,
    setDraftQuery,
    commitQuery,
    handleSearchCommit,
    syncUrl,
    filters,
    isPeopleCategory,
    memberRoster,
    memberAvailability,
    crewRecommendationsQuery,
    availabilityCatalogItems,
    offerRideshareForAvailabilityItem,
    handleOpenAvailabilityCatalogItem,
    searchScopeCounts,
    mapHref,
    listSearchPlaceholder,
    listSearchScopeHints,
    handleOpenMarkAvailability,
    crewsOpenLens,
    clock,
    filterCount,
    items,
    isLoading,
    exploreSearchMapView,
    exploreSearchMapPool,
    listMapHighlightedId,
    listMapSelectedId,
    handleListMapSelectItem,
    cards,
    isError,
    reloadMap,
    explorerBucket,
    layout,
    venueRegions,
    listCat,
    geoPath,
    clearAllFilters,
    showListMapColumn,
    showListMapColumnPrompt,
    openListMapColumn,
    setListMapHighlightedId,
    sort,
    handleActivityDatePresetChange,
    handleVenueRegionsChange,
    handleClearGeoScope,
    handlePopGeoScope,
    filteredItems,
    sideMapWidth,
    closeListMapColumn,
    handleCreateFabTap,
    createFabLabel,
  } = useListDiscoveryExperienceModel(props);

  return (
    <div className={hubListRoot}>
      {isPeopleCategory ? (
        embeddedOnExplore ? (
          <CrewsBrowsePanel
            embedded
            isDesktop={surface === 'exploreSidebar'}
            query={draftQuery}
            onQueryChange={setDraftQuery}
            onQuerySync={commitQuery}
            onClose={() => syncUrl({ listCat: null, categories: [] })}
            crewBrowseLane={filters.crewBrowseLane}
            crewPeopleFacet={filters.crewPeopleFacet}
            onCrewBrowseLaneChange={(lane) => syncUrl({ crewBrowseLane: lane })}
            onCrewPeopleFacetChange={(facet) => syncUrl({ crewPeopleFacet: facet })}
            memberPeopleNetwork={[]}
            memberPeopleLoading={false}
            memberPeopleError={null}
            onRefreshMemberPeople={() => {}}
            discoveryFriendsGoing={memberRoster.friendsGoing}
            discoveryHostsGoing={memberRoster.hostsGoing}
            discoveryAvailabilityOnMap={memberRoster.availabilityOnMap}
            discoveryFollowed={memberRoster.followed}
            discoveryDirectory={memberRoster.directory}
            discoveryQuota={memberRoster.quota}
            discoveryLoading={memberRoster.loading}
            discoveryError={memberRoster.error}
            onRefreshMemberDiscovery={() => void memberRoster.refresh()}
            availabilityPeople={memberAvailability.people}
            availabilityLoading={memberAvailability.loading}
            availabilityError={memberAvailability.error}
            onRefreshAvailability={() => void memberAvailability.refresh()}
            isSignedIn={Boolean(user)}
            userRole={user?.role}
            availabilityCatalogItems={availabilityCatalogItems}
            exploreCatalogItems={items}
            exploreCatalogLoading={isLoading}
            onOpenAvailabilityCatalogItem={handleOpenAvailabilityCatalogItem}
            onOfferRideshareForAvailabilityItem={offerRideshareForAvailabilityItem}
            crewRecommendationsQuery={crewRecommendationsQuery}
          />
        ) : filters.crewPeopleSurface === 'my' ? (
          <ListMyCrewHub />
        ) : (
          <ListCrewsExplorer
            isSignedIn={Boolean(user)}
            user={user}
            draftQuery={draftQuery}
            committedQuery={filters.query}
            onQueryChange={setDraftQuery}
            onQuerySync={commitQuery}
            onSearchCommit={handleSearchCommit}
            filters={filters}
            venueRegions={venueRegions}
            geoPath={geoPath}
            activityDatePreset={filters.activityDatePreset}
            onActivityDatePresetChange={handleActivityDatePresetChange}
            onVenueRegionsChange={handleVenueRegionsChange}
            onSyncBrowse={(patch) => syncUrl(patch)}
            onOpenIntentOpen={handleOpenMarkAvailability}
            exploreCatalogItems={items}
            exploreCatalogLoading={isLoading}
            availabilityCatalogItems={availabilityCatalogItems}
            crewsOpenLens={crewsOpenLens}
            clock={clock}
            onOpenAvailabilityCatalogItem={handleOpenAvailabilityCatalogItem}
            onOfferRideshareForAvailabilityItem={offerRideshareForAvailabilityItem}
          />
        )
      ) : exploreSearch && exploreSearchMapView && !isPeopleCategory ? (
        <ListDiscoveryMapColumn
          presentation="primary"
          items={exploreSearchMapPool ?? []}
          loading={isLoading}
          highlightedExploreItemId={listMapHighlightedId}
          selectedExploreItemId={listMapSelectedId}
          onSelectItem={handleListMapSelectItem}
          layoutRevision={exploreSearchMapView}
          className="mx-auto w-full max-w-lg rounded-2xl border border-neutral-200"
        />
      ) : (
        <ListFeedActionsProvider>
          <div ref={sideMapWidth.splitRef} className="flex h-full min-h-0 min-w-0 flex-1 flex-row">
            <ListExplorer
              cards={cards}
              loading={isLoading}
              error={isError}
              onRetry={() => void reloadMap()}
              onClose={onCloseMapOverlay}
              embedded={embeddedOnExplore}
              query={draftQuery}
              onQueryChange={setDraftQuery}
              onQuerySync={commitQuery}
              onSearchCommit={handleSearchCommit}
              onClearQuery={() => syncUrl({ query: '' })}
              searchScopeCounts={searchScopeCounts}
              mapHref={mapHref}
              layout={layout}
              onLayoutChange={(next) => syncUrl({ layout: next })}
              bucket={explorerBucket}
              onBucketChange={(next) => {
                const cat = browseListCatForBucket(next);
                syncUrl({
                  listCat: cat,
                  ...scopeBrowseListStateForListCat(filters, cat),
                  query: draftQuery,
                  regions: venueRegions,
                  ...(next === 'places' && layout === 'calendar' ? { layout: 'thumbnails' as const } : {}),
                });
              }}
              hideBucketToggleOnMobile={!embeddedOnExplore || searchResultsChrome}
              suppressSearch={suppressListSearch}
              searchResultsChrome={searchResultsChrome}
              exploreSearchResults={exploreSearch}
              suppressMapListToggle={searchResultsChrome}
              suppressDateSectionHeaders={listCat === 'activities'}
              filters={filters}
              regions={venueRegions}
              filterCount={filterCount}
              onApplyFilters={(state, regions) => syncUrl({ ...state, regions })}
              onClearFilters={clearAllFilters}
              mapColumnVisible={showListMapColumn}
              showMapColumnPrompt={showListMapColumnPrompt}
              onOpenMapColumn={openListMapColumn}
              onMapHover={showListMapColumn ? setListMapHighlightedId : undefined}
              sort={sort}
              onSortChange={(next) => syncUrl({ sort: next })}
              showGuestCatalogPreview={!user && !embeddedOnExplore && !isPeopleCategory}
              listPanelWidthPx={showListMapColumn ? sideMapWidth.listPanelWidth : undefined}
              onTripTopicsChange={(next) => syncUrl({ tripTopics: next, tripAvailabilityOnly: false })}
              onPlaceTopicsChange={(next) => syncUrl({ placeTopics: next })}
              onPriceChange={(next) => syncUrl({ price: next })}
              onHasTripChange={(next) => syncUrl({ hasTrip: next })}
              onFacilityKindsChange={(next) => syncUrl({ facilityKinds: next })}
              onVenueFiltersChange={(next) =>
                syncUrl({ placeTopics: next.placeTopics, facilityKinds: next.facilityKinds })
              }
              onActivityDatePresetChange={handleActivityDatePresetChange}
              onVenueRegionsChange={handleVenueRegionsChange}
              searchPlaceholder={listSearchPlaceholder}
              enableSearchScopeHints={listSearchScopeHints}
              geoPath={geoPath}
              onClearGeoScope={handleClearGeoScope}
              onPopGeoScope={geoPath.length > 1 ? handlePopGeoScope : undefined}
            />
            {showListMapColumn ? (
              <>
                <ListSideMapResizeHandle
                  getStartWidth={sideMapWidth.getStartListWidth}
                  onWidthChange={sideMapWidth.setListPanelWidthClamped}
                  onResizeCommit={sideMapWidth.commitListPanelWidth}
                  ariaValueNow={sideMapWidth.listPanelWidth}
                  ariaValueMax={sideMapWidth.listPanelMaxPx()}
                />
                <ListDiscoveryMapColumn
                  items={filteredItems}
                  loading={isLoading}
                  highlightedExploreItemId={listMapHighlightedId}
                  selectedExploreItemId={listMapSelectedId}
                  onSelectItem={handleListMapSelectItem}
                  onClose={closeListMapColumn}
                  layoutRevision={sideMapWidth.listPanelWidth}
                />
              </>
            ) : null}
          </div>
        </ListFeedActionsProvider>
      )}

      {embeddedOnExplore ||
      overlayImmersive ||
      exploreSearch ||
      (isPeopleCategory && filters.crewPeopleSurface === 'find') ? null : (
        <BrowseListCreateFab onClick={handleCreateFabTap} label={createFabLabel} />
      )}
    </div>
  );
};