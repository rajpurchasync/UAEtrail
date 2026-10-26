import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { LIST_DISCOVERY_PATH } from '../config/platform';
import { EXPLORE_MAP_PATH } from '../config/routingCatalog';
import { EXPLORE_BRAND_ACTIVE } from '../config/exploreTheme';
import { ComposeHost } from '../explore/create/ComposeHost';
import { GuestComposeSignInSheet } from '../explore/ui/GuestComposeSignInSheet';
import { useComposeRoute } from '../explore/create/hooks/useComposeRoute';
import { clearComposeWizardSessionForRoute } from '../explore/ui/composeWizardSession';
import { addVenueKindFromRoute, isSeekFixedWizard } from '../explore/compose';
import { useMemberStatus } from '../hooks/useMemberStatus';
import { reloadExploreMap } from '../hooks/useExploreMap';
import { buildSignInRedirect } from '../utils/authReturnContext';
import {
  memberPublishGateHref,
  memberPublishGateInputFromMemberStatus,
} from '../utils/memberPublishGate';
import { browseListFilterPatchForSearchScope } from './listDiscoverySearchCommit';
import { browseListShowsTripTopicRow } from './browseListTripTopics';
import { browseListShowsPlaceTopicRow } from './listVenuePlaceTopics';
import { listDiscoveryHasActiveFilters } from './listDiscoveryMode';
import { buildListFeedCards } from './buildListFeedCards';
import { buildListCategoryPrimaryPills, listCategorySecondaryFiltersActive } from './listCategoryFilterPills';
import { listCategoryResultsLabel } from './listCategoryCopy';
import { resolveListCategoryHeaderFocus, resolveListDiscoveryView } from './listDiscoveryMode';
import { BROWSE_LIST_EMPTY } from './browseListCopy';
import { countExploreSearchScopes } from '../explore/exploreSearchMatches';
import type { ExploreSearchScopeKey } from '../explore/exploreBrowseTaxonomy';
import { useBrowseListFeed } from './useBrowseListFeed';
import { useListDiscoveryUrlState } from './useListDiscoveryUrlState';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';
import { BrowseListCreateFab } from './ui/BrowseListCreateFab';
import { BrowseListPageShell } from './ui/BrowseListPageShell';
import { ListCategoryDedicatedView } from './ui/ListCategoryDedicatedView';
import { ListCategoryFilterBar } from './ui/ListCategoryFilterBar';
import { ListDiscoverHome } from './ui/ListDiscoverHome';
import { PeopleBrowsePanel } from '@/people-discovery/panel/PeopleBrowsePanel';
import { usePeopleDiscoverySeekingActivities } from '@/people-discovery/hooks/usePeopleDiscoverySeekingActivities';
import { ListDiscoveryHeader } from './ui/ListDiscoveryHeader';
import { ListDiscoveryResults } from './ui/ListDiscoveryResults';
import { ListRefineSheet } from './ui/ListRefineSheet';
import { ListFeedActionsProvider } from './ui/ListFeedActionsProvider';
import { useHostActivitySheetBundle } from '../hooks/useHostActivitySheetBundle';
import { BROWSE_DISCOVER_PARAM } from './browseListUrlState';
import { exploreMapPathFromListSearch, listDiscoveryPathFromExploreSearch } from './routing';
import { listDiscoveryEmbeddedOnExplore, type ListDiscoverySurface } from './listDiscoverySurface';
import { useMemberDiscoveryRoster } from '@/people-discovery/hooks/useMemberDiscoveryRoster';
import { useExplorePeopleAvailability } from '@/people-discovery/hooks/usePeopleAvailability';
import { parseExploreAreaSlug } from '../explore/exploreAreaFilter';
import { exploreMapPathAfterPeopleFullScreen } from '../explore/exploreBrowseReturnPath';
import {
  parseMobileBackNavState,
  resolveMobileBackChrome,
} from '../utils/mobileBackNav';

const DiscoverHomeSkeleton = () => (
  <div className="space-y-6" aria-hidden>
    <div className="h-20 animate-pulse rounded-2xl bg-neutral-200" />
    <div className="flex gap-3 overflow-hidden">
      {[0, 1, 2].map((k) => (
        <div key={k} className="w-[14.5rem] shrink-0 overflow-hidden rounded-2xl bg-neutral-200 sm:w-[15.5rem]">
          <div className="aspect-[5/3] w-full bg-neutral-300/80" />
          <div className="space-y-1.5 p-2.5">
            <div className="h-2.5 w-full rounded bg-neutral-300/80" />
            <div className="h-2 w-4/5 rounded bg-neutral-300/80" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const CategoryFeedSkeleton = ({ venues = false }: { venues?: boolean }) => (
  <div className="py-5" aria-hidden>
    {!venues ? (
      <div className="mb-8 flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-200" />
        <div className="h-4 w-32 animate-pulse rounded-lg bg-neutral-200" />
      </div>
    ) : null}
    <div className="aspect-[4/5] w-full animate-pulse rounded-[24px] bg-neutral-200" />
  </div>
);

type ListDiscoveryExperienceProps = {
  surface: ListDiscoverySurface;
  onCloseMapOverlay?: () => void;
};

export const ListDiscoveryExperience = ({ surface, onCloseMapOverlay }: ListDiscoveryExperienceProps) => {
  const embeddedOnExplore = listDiscoveryEmbeddedOnExplore(surface);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const pathname = embeddedOnExplore ? EXPLORE_MAP_PATH : LIST_DISCOVERY_PATH;
  const search = searchParams.toString() ? `?${searchParams.toString()}` : '';

  const {
    canPublish,
    profileComplete,
    isCommunityHost,
    hostTiers,
    loading: hostGateLoading,
    refresh: refreshHostGate,
    tenantId,
  } = useMemberStatus({ enabled: Boolean(user) });

  const hostSheets = useHostActivitySheetBundle({
    tenantId,
    onMapDataChanged: () => reloadExploreMap(queryClient),
  });
  const { inviteShare, listFeedHostActions, hostManageSheet } = hostSheets;

  const navigateMemberPublishGate = useCallback(
    (returnPath: string) =>
      navigate(
        memberPublishGateHref(
          returnPath,
          memberPublishGateInputFromMemberStatus({
            viewerUserId: user?.id ?? null,
            profileComplete,
            canPublish,
            isCommunityHost,
            hostTiers,
          })
        )
      ),
    [navigate, user?.id, profileComplete, canPublish, isCommunityHost, hostTiers]
  );

  const compose = useComposeRoute({
    user,
    navigate,
    pathname,
    search,
    searchParams,
    setSearchParams,
    onOpenComposeMenu: () => {},
    canPublish,
    profileComplete,
    hostGateLoading,
  });

  const reloadFeed = useCallback(async () => {
    await reloadExploreMap(queryClient);
    void refreshHostGate();
  }, [queryClient, refreshHostGate]);

  const browseUrl = useListDiscoveryUrlState({ mapOverlay: embeddedOnExplore });
  const { filters, syncUrl, venueRegions, listCat } = browseUrl;
  const { view, category } = resolveListDiscoveryView(filters, venueRegions, listCat);
  const categoryHeaderFocus = useMemo(
    () => resolveListCategoryHeaderFocus(filters, venueRegions, listCat),
    [filters, venueRegions, listCat]
  );
  const isPeopleCategory = view === 'category' && category === 'people';
  const areaSlug = parseExploreAreaSlug(searchParams);
  const peopleSegment = filters.buddiesSegment;
  const memberRoster = useMemberDiscoveryRoster({
    enabled:
      isPeopleCategory &&
      Boolean(user) &&
      (peopleSegment === 'looking' || peopleSegment === 'going' || peopleSegment === 'connect'),
    search: filters.query,
    activityDatePreset: filters.activityDatePreset,
    omitDirectory: peopleSegment !== 'connect',
  });
  const memberAvailability = useExplorePeopleAvailability({
    enabled: isPeopleCategory && Boolean(user) && peopleSegment === 'available',
    search: filters.query,
    activityDatePreset: filters.activityDatePreset,
    areaSlug,
    mapFilter: 'all',
  });
  const feedFilters =
    isPeopleCategory
      ? { ...filters, categories: [] }
      : view === 'category' && category
        ? { ...filters, categories: [category] }
        : filters;
  const { cards, items, isLoading, isError, refetch: reloadMap, isFetching } = useBrowseListFeed({
    filters: feedFilters,
    venueRegions,
    mapEnabled: !isPeopleCategory || peopleSegment === 'looking',
  });

  const peopleLookingSegment = isPeopleCategory && peopleSegment === 'looking';
  const { seekingActivities } = usePeopleDiscoverySeekingActivities({
    enabled: peopleLookingSegment,
    exploreCatalogFallback: items,
    filters: {
      mapFilter: 'all',
      buddySubtype: 'all',
      outingTopic: 'all',
      query: filters.query,
    },
  });

  const handleOpenSeekingActivity = useCallback(
    (item: { path: string }) => {
      navigate(item.path);
    },
    [navigate]
  );

  const discoverHomeCards = useMemo(() => buildListFeedCards(items, user), [items, user]);

  const [draftQuery, setDraftQuery] = useState(filters.query);
  const [refineOpen, setRefineOpen] = useState(false);
  useEffect(() => {
    setDraftQuery(filters.query);
  }, [filters.query]);

  const searchScopeCounts = useMemo(
    () =>
      countExploreSearchScopes(
        items,
        draftQuery,
        filters.activityDatePreset,
        venueRegions
      ),
    [items, draftQuery, filters.activityDatePreset, venueRegions]
  );

  const categoryPrimaryPills = useMemo(
    () => (category ? buildListCategoryPrimaryPills(category, filters, syncUrl) : []),
    [category, filters, syncUrl]
  );

  const searchTripPills = useMemo(
    () => buildListCategoryPrimaryPills('activities', filters, syncUrl),
    [filters, syncUrl]
  );

  const searchPlacePills = useMemo(
    () => buildListCategoryPrimaryPills('venues', filters, syncUrl),
    [filters, syncUrl]
  );

  const showSearchTripTopicRow = view === 'search' && browseListShowsTripTopicRow(filters.categories);
  const showSearchPlaceTopicRow = view === 'search' && browseListShowsPlaceTopicRow(filters.categories);

  const hasActiveFilters = listDiscoveryHasActiveFilters(filters, venueRegions, listCat);

  const categoryMoreFiltersActive = useMemo(
    () => (category ? listCategorySecondaryFiltersActive(category, filters, venueRegions) : false),
    [category, filters, venueRegions]
  );

  const peopleResultCount = useMemo(() => {
    const seg = filters.buddiesSegment;
    if (seg === 'looking') return seekingActivities.length;
    if (seg === 'available') return memberAvailability.people.length;
    if (seg === 'going') return memberRoster.friendsGoing.length;
    if (seg === 'connect') return memberRoster.directory.length;
    return 0;
  }, [
    filters.buddiesSegment,
    memberAvailability.people.length,
    memberRoster.directory.length,
    memberRoster.friendsGoing.length,
    seekingActivities.length,
  ]);

  const categoryResultsLabel = useMemo(() => {
    if (!categoryHeaderFocus) return null;
    if (categoryHeaderFocus === 'people') {
      if (memberRoster.loading) return null;
      return listCategoryResultsLabel(peopleResultCount, categoryHeaderFocus);
    }
    return listCategoryResultsLabel(cards.length, categoryHeaderFocus);
  }, [categoryHeaderFocus, cards.length, peopleResultCount, memberRoster.loading]);

  const commitQuery = () => {
    syncUrl({ query: draftQuery });
  };

  const handleSearchCommit = (scope?: ExploreSearchScopeKey | null) => {
    if (scope === 'facilities') return;
    if (scope === 'people') {
      syncUrl({
        query: draftQuery,
        listCat: 'people',
        categories: ['people'],
        tripLookingOnly: false,
        tripTopics: [],
        placeTopics: [],
        activityDatePreset: 'anyday',
      });
      return;
    }
    if (scope) {
      const patch = browseListFilterPatchForSearchScope(scope);
      if (patch) {
        const listCatForScope =
          scope === 'activities'
            ? 'activities'
            : scope === 'places' || scope === 'shops'
              ? 'venues'
              : scope === 'agencies'
                ? 'agencies'
                : null;
        syncUrl({ query: draftQuery, listCat: listCatForScope, ...patch });
        return;
      }
    }
    syncUrl({ query: draftQuery });
  };

  const handleClearSearch = () => {
    syncUrl({ query: '' });
  };

  const clearAllFilters = () => {
    syncUrl({
      query: '',
      categories: [],
      listCat: null,
      tripTopics: [],
      placeTopics: [],
      tripLookingOnly: false,
      price: 'all',
      when: 'any',
      activityDatePreset: 'anyday',
      buddiesSegment: 'available',
      regions: [],
    });
    setDraftQuery('');
  };

  const applyRefine = (state: typeof filters, regions: string[]) => {
    syncUrl({ ...state, regions });
  };

  const openCategoryPage = (
    key: BrowseMainCategoryKey,
    patch?: Partial<Pick<typeof filters, 'placeTopics'>>
  ) => {
    syncUrl({
      categories: [key],
      listCat: key,
      tripTopics: [],
      placeTopics: patch?.placeTopics ?? [],
      tripLookingOnly: false,
      price: 'all',
      when: 'any',
      ...(key === 'people' ? { activityDatePreset: 'anyday' as const } : {}),
    });
  };

  const backToHome = useCallback(() => {
    syncUrl({
      categories: [],
      listCat: null,
      tripTopics: [],
      placeTopics: [],
      tripLookingOnly: false,
      price: 'all',
      when: 'any',
      activityDatePreset: 'anyday',
      buddiesSegment: 'available',
      regions: [],
    });
  }, [syncUrl]);

  const categoryBackChrome = useMemo(() => {
    if (!categoryHeaderFocus) return null;
    return resolveMobileBackChrome(location.state, {
      fallbackTo: LIST_DISCOVERY_PATH,
      label: 'Back',
    });
  }, [categoryHeaderFocus, location.state]);

  const handleBackFromCategory = useCallback(() => {
    if (parseMobileBackNavState(location.state) && !embeddedOnExplore) {
      const chrome = resolveMobileBackChrome(location.state, {
        fallbackTo: LIST_DISCOVERY_PATH,
        label: 'Back',
      });
      const target =
        chrome.fallbackTo === EXPLORE_MAP_PATH || chrome.fallbackTo.startsWith('/explore')
          ? exploreMapPathAfterPeopleFullScreen(chrome.fallbackTo)
          : chrome.fallbackTo;
      navigate(target);
      return;
    }
    backToHome();
  }, [embeddedOnExplore, location.state, navigate, backToHome]);

  const mapHref = useMemo(() => {
    if (!embeddedOnExplore) return exploreMapPathFromListSearch(search);
    const params = new URLSearchParams(searchParams);
    params.delete(BROWSE_DISCOVER_PARAM);
    params.delete('list');
    const qs = params.toString();
    return qs ? `${EXPLORE_MAP_PATH}?${qs}` : EXPLORE_MAP_PATH;
  }, [embeddedOnExplore, search, searchParams]);

  const fullScreenDiscoverHref = useMemo(
    () => (embeddedOnExplore ? listDiscoveryPathFromExploreSearch(search) : null),
    [embeddedOnExplore, search]
  );

  const renderFeed = () => {
    if (isPeopleCategory) {
      return (
        <PeopleBrowsePanel
          embedded
          isDesktop={surface === 'exploreSidebar'}
          query={draftQuery}
          onQueryChange={setDraftQuery}
          onQuerySync={commitQuery}
          onClose={() => {}}
          peopleBrowseTab={filters.buddiesSegment}
          onPeopleBrowseTabChange={(tab) => syncUrl({ buddiesSegment: tab })}
          memberPeopleNetwork={[]}
          memberPeopleLoading={false}
          memberPeopleError={null}
          onRefreshMemberPeople={() => {}}
          discoveryFriendsGoing={memberRoster.friendsGoing}
          discoveryHostsGoing={memberRoster.hostsGoing}
          discoverySeekingOnMap={memberRoster.seekingOnMap}
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
          seekingActivities={seekingActivities}
          exploreCatalogItems={items}
          exploreCatalogLoading={isLoading}
          onOpenSeekingActivity={handleOpenSeekingActivity}
        />
      );
    }
    if (isLoading) {
      return view === 'category' ? (
        <CategoryFeedSkeleton venues={category === 'venues'} />
      ) : (
        <DiscoverHomeSkeleton />
      );
    }
    if (isError) {
      return (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-900">Could not load plans right now.</p>
          <button
            type="button"
            onClick={() => void reloadMap()}
            className={`mt-3 min-h-11 rounded-2xl px-4 text-sm font-bold ${EXPLORE_BRAND_ACTIVE}`}
          >
            Try again
          </button>
        </div>
      );
    }
    if (cards.length === 0) {
      return (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-neutral-600">{BROWSE_LIST_EMPTY}</p>
          <button type="button" onClick={clearAllFilters} className="mt-4 text-sm font-semibold text-emerald-700">
            Clear filters
          </button>
        </div>
      );
    }
    if (view === 'category' && category) {
      return (
        <ListFeedActionsProvider {...listFeedHostActions}>
          <ListCategoryDedicatedView category={category} cards={cards} />
        </ListFeedActionsProvider>
      );
    }
    if (view === 'search') {
      return (
        <ListFeedActionsProvider {...listFeedHostActions}>
          <ListDiscoveryResults
            cards={cards}
            showClearAll={hasActiveFilters}
            onClearAll={clearAllFilters}
            placesOnly={browseListShowsPlaceTopicRow(filters.categories) && !browseListShowsTripTopicRow(filters.categories)}
          />
        </ListFeedActionsProvider>
      );
    }
    return (
      <ListDiscoverHome cards={discoverHomeCards} mapItems={items} onOpenCategory={openCategoryPage} />
    );
  };

  const hostWizardOpen = Boolean(compose.hostComposeRoute) && Boolean(user);

  return (
    <>
        <BrowseListPageShell
          surface={surface}
          feedFullBleed={view === 'category'}
          floatingAction={
            embeddedOnExplore ? null : <BrowseListCreateFab onClick={compose.handleCreateTap} />
          }
          chrome={
            <>
              <ListDiscoveryHeader
                surface={surface}
                view={view}
                query={draftQuery}
                onQueryChange={setDraftQuery}
                onQuerySync={commitQuery}
                onSearchCommit={handleSearchCommit}
                onClearQuery={handleClearSearch}
                searchScopeCounts={searchScopeCounts}
                mapHref={mapHref}
                onOpenRefine={() => setRefineOpen(true)}
                showMapLink={embeddedOnExplore || surface === 'standalone'}
                fullScreenDiscoverHref={fullScreenDiscoverHref}
                onCloseMapOverlay={embeddedOnExplore ? onCloseMapOverlay : undefined}
                closeVariant={surface === 'exploreSidebar' ? 'collapse' : 'dismiss'}
                categoryFocus={categoryHeaderFocus}
                categoryResultsLabel={categoryResultsLabel}
                categoryBackLabel={categoryBackChrome?.label}
                categoryBackFallbackTo={categoryBackChrome?.fallbackTo}
                onBackFromCategory={categoryHeaderFocus ? handleBackFromCategory : undefined}
                categoryFilterRow={
                  view === 'category' && category === 'people' ? null : view === 'category' && category ? (
                    <ListCategoryFilterBar
                      embedded
                      category={category}
                      pills={categoryPrimaryPills}
                      moreFiltersActive={categoryMoreFiltersActive}
                      showMoreButton={category !== 'venues'}
                      activityDatePreset={filters.activityDatePreset}
                      onActivityDatePresetChange={(preset) => syncUrl({ activityDatePreset: preset })}
                      venueRegions={venueRegions}
                      onVenueRegionsChange={
                        category === 'venues' ? undefined : (regions) => syncUrl({ regions })
                      }
                      appliedFilters={filters}
                      onMoreFiltersApply={(patch) => syncUrl(patch)}
                    />
                  ) : (
                    <>
                      {showSearchPlaceTopicRow ? (
                        <ListCategoryFilterBar
                          embedded
                          category="venues"
                          pills={searchPlacePills}
                          moreFiltersActive={listCategorySecondaryFiltersActive('venues', filters, venueRegions)}
                          showMoreButton={false}
                          activityDatePreset={filters.activityDatePreset}
                          onActivityDatePresetChange={(preset) => syncUrl({ activityDatePreset: preset })}
                          venueRegions={venueRegions}
                          onVenueRegionsChange={(regions) => syncUrl({ regions })}
                          appliedFilters={filters}
                          onMoreFiltersApply={(patch) => syncUrl(patch)}
                        />
                      ) : null}
                      {showSearchTripTopicRow ? (
                        <ListCategoryFilterBar
                          embedded
                          category="activities"
                          pills={searchTripPills}
                          moreFiltersActive={categoryMoreFiltersActive}
                          showMoreButton={false}
                          activityDatePreset={filters.activityDatePreset}
                          onActivityDatePresetChange={(preset) => syncUrl({ activityDatePreset: preset })}
                          venueRegions={venueRegions}
                          appliedFilters={filters}
                          onMoreFiltersApply={(patch) => syncUrl(patch)}
                        />
                      ) : null}
                    </>
                  )
                }
              />
              <ListRefineSheet
                open={refineOpen}
                onClose={() => setRefineOpen(false)}
                applied={filters}
                regions={venueRegions}
                onApply={applyRefine}
              />
            </>
          }
        >
          {renderFeed()}
          {isFetching && !isLoading ? (
            <p className="mt-4 text-center text-xs font-medium text-neutral-500">Updating…</p>
          ) : null}
        </BrowseListPageShell>

      {inviteShare.sheet}
      {hostManageSheet}

      <ComposeHost
        composeRoute={compose.composeRoute}
        composeMenuOpen={compose.composeMenuOpen}
        hostWizardOpen={hostWizardOpen}
        seekFixedWizardOpen={
          Boolean(compose.seekFixedRoute && isSeekFixedWizard(compose.composeRoute)) && Boolean(user)
        }
        addWizardOpen={Boolean(compose.addRoute) && Boolean(user)}
        seekFlexibleOpen={compose.seekFlexibleOpen && Boolean(user)}
        hostComposeKind={compose.hostComposeRoute?.kind ?? null}
        seekFixedKind={compose.seekFixedRoute?.kind}
        addVenueKind={addVenueKindFromRoute(compose.addRoute)}
        hostingWizardPrefill={null}
        signInHref={buildSignInRedirect({ pathname, search }).href}
        onComposeRouteChange={compose.handleComposeRouteChange}
        onCloseCompose={compose.closeCompose}
        onCloseCreateFlow={compose.closeCompose}
        wizardEnteredFromMenu={compose.wizardEnteredFromMenu}
        onHostingBackToIntent={() => {
          clearComposeWizardSessionForRoute(compose.hostComposeRoute);
          compose.setComposeRoute({ surface: 'menu', intent: 'host' });
        }}
        onSeekingBackToIntent={() => {
          clearComposeWizardSessionForRoute(compose.seekFixedRoute);
          compose.setComposeRoute({ surface: 'menu', intent: 'seek' });
        }}
        onAddBackToIntent={() => {
          clearComposeWizardSessionForRoute(compose.addRoute);
          compose.setComposeRoute({ surface: 'menu', intent: 'add' });
        }}
        onActivityPublished={() => void reloadFeed()}
        onSeekingSubmitted={() => void reloadFeed()}
        onAddSubmitted={() => void reloadFeed()}
        onOpenHostApplication={() => {
          compose.closeCompose();
          navigateMemberPublishGate(`${pathname}${search}`);
        }}
      />

      <GuestComposeSignInSheet
        open={compose.guestComposeSignInOpen}
        onClose={compose.closeGuestComposeSignIn}
        authReturnPath={compose.guestComposeSignInReturnPath}
      />
    </>
  );
};
