import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { LIST_DISCOVERY_PATH } from '../config/platform';
import { EXPLORE_MAP_PATH } from '../config/routingCatalog';
import { EXPLORE_BRAND_ACTIVE } from '../config/exploreTheme';
import { ExploreComposeHost } from '../explore/ui/ExploreComposeHost';
import { useExploreComposeRoute } from '../explore/ui/useExploreComposeRoute';
import { isAddWizard, isFindWizard } from '../explore/compose';
import { useHostStatus } from '../hooks/useHostStatus';
import { reloadExploreMap } from '../hooks/useExploreMap';
import { buildSignInRedirect } from '../utils/authReturnContext';
import {
  organizePublishGateHref,
  organizePublishGateInputFromHostGate,
} from '../utils/organizePublishGate';
import { buildListActiveFilterChips } from './listActiveFilterChips';
import { browseCategoriesForSearchScope } from './listDiscoverySearchCommit';
import { buildListCategoryPrimaryPills, listCategorySecondaryFiltersActive } from './listCategoryFilterPills';
import { resolveListDiscoveryView } from './listDiscoveryMode';
import { BROWSE_LIST_EMPTY } from './browseListCopy';
import { countExploreSearchScopes } from '../explore/exploreSearchMatches';
import type { ExploreSearchScopeKey } from '../explore/exploreBrowseTaxonomy';
import { buildBrowseCardsFromMapItems } from './buildBrowseCardsFromMapItems';
import { useBrowseListFeed } from './useBrowseListFeed';
import { useListDiscoveryUrlState } from './useListDiscoveryUrlState';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';
import { BrowseListCreateFab } from './ui/BrowseListCreateFab';
import { BrowseListPageShell } from './ui/BrowseListPageShell';
import { ListCategoryDedicatedView } from './ui/ListCategoryDedicatedView';
import { ListCategoryFilterBar } from './ui/ListCategoryFilterBar';
import { ListActiveFilterChipsRow } from './ui/ListActiveFilterChipsRow';
import { ListDiscoverHome } from './ui/ListDiscoverHome';
import { ListDiscoveryHeader } from './ui/ListDiscoveryHeader';
import { ListDiscoveryResults } from './ui/ListDiscoveryResults';
import { ListRefineSheet } from './ui/ListRefineSheet';
import { ListFeedActionsProvider } from './ui/ListFeedActionsProvider';
import { exploreMapPathFromListSearch } from './routing';

import { listDiscoveryEmbeddedOnExplore, type ListDiscoverySurface } from './listDiscoverySurface';

const FeedSkeleton = () => (
  <div className="space-y-6" aria-hidden>
    <div className="aspect-[4/5] animate-pulse rounded-3xl bg-neutral-200" />
    <div className="flex gap-3">
      {[0, 1, 2].map((k) => (
        <div key={k} className="h-44 w-36 shrink-0 animate-pulse rounded-2xl bg-neutral-200" />
      ))}
    </div>
  </div>
);

const CategoryFeedSkeleton = () => (
  <div className="py-5" aria-hidden>
    <div className="mb-8 flex items-center gap-3">
      <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-200" />
      <div className="h-4 w-32 animate-pulse rounded-lg bg-neutral-200" />
    </div>
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
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const pathname = embeddedOnExplore ? EXPLORE_MAP_PATH : LIST_DISCOVERY_PATH;
  const search = searchParams.toString() ? `?${searchParams.toString()}` : '';

  const {
    canPublish,
    signupProfileComplete,
    isCommunityHost,
    hostTiers,
    loading: hostGateLoading,
    refresh: refreshHostGate,
  } = useHostStatus({ enabled: Boolean(user) });

  const navigateOrganizePublishGate = useCallback(
    (returnPath: string) =>
      navigate(
        organizePublishGateHref(
          returnPath,
          organizePublishGateInputFromHostGate({
            viewerUserId: user?.id ?? null,
            signupProfileComplete,
            canPublish,
            isCommunityHost,
            hostTiers,
          })
        )
      ),
    [navigate, user?.id, signupProfileComplete, canPublish, isCommunityHost, hostTiers]
  );

  const compose = useExploreComposeRoute({
    user,
    navigate,
    searchParams,
    setSearchParams,
    onOpenComposeMenu: () => {},
    canPublish,
    signupProfileComplete,
    hostGateLoading,
  });

  const reloadFeed = useCallback(async () => {
    await reloadExploreMap(queryClient);
    void refreshHostGate();
  }, [queryClient, refreshHostGate]);

  const browseUrl = useListDiscoveryUrlState({ mapOverlay: embeddedOnExplore });
  const { filters, syncUrl, venueRegions } = browseUrl;
  const { cards, items, isLoading, isError, refetch: reloadMap, isFetching } = useBrowseListFeed({
    filters,
    venueRegions,
  });

  const discoverHomeCards = useMemo(
    () => buildBrowseCardsFromMapItems(items, user),
    [items, user]
  );

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

  const { view, category } = resolveListDiscoveryView(filters, venueRegions);
  const chips = useMemo(
    () => buildListActiveFilterChips(filters, venueRegions),
    [filters, venueRegions]
  );

  const categoryPrimaryPills = useMemo(
    () => (category ? buildListCategoryPrimaryPills(category, filters, syncUrl) : []),
    [category, filters, syncUrl]
  );

  const categoryMoreFiltersActive = useMemo(
    () => (category ? listCategorySecondaryFiltersActive(category, filters, venueRegions) : false),
    [category, filters, venueRegions]
  );

  const commitQuery = () => {
    syncUrl({ query: draftQuery });
  };

  const handleSearchCommit = (scope?: ExploreSearchScopeKey | null) => {
    if (scope === 'facilities') return;
    const categories = scope ? browseCategoriesForSearchScope(scope) : undefined;
    if (categories) {
      syncUrl({ query: draftQuery, categories });
      return;
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
      tripTopic: 'all',
      tripLookingOnly: false,
      price: 'all',
      when: 'any',
      activityDatePreset: 'anyday',
      regions: [],
    });
    setDraftQuery('');
  };

  const applyRefine = (state: typeof filters, regions: string[]) => {
    syncUrl({ ...state, regions });
  };

  const handleClearChip = (chip: (typeof chips)[number]) => {
    if (chip.clear.regions !== undefined) {
      syncUrl({ ...chip.clear, regions: chip.clear.regions });
      return;
    }
    syncUrl(chip.clear);
    if (chip.clear.query === '') setDraftQuery('');
  };

  const openCategoryPage = (key: BrowseMainCategoryKey) => {
    syncUrl({
      categories: [key],
      tripTopic: 'all',
      tripLookingOnly: false,
      price: 'all',
      when: 'any',
    });
  };

  const backToHome = () => {
    syncUrl({
      categories: [],
      tripTopic: 'all',
      tripLookingOnly: false,
      price: 'all',
      when: 'any',
      activityDatePreset: 'anyday',
      regions: [],
    });
  };

  const mapHref = useMemo(() => {
    if (!embeddedOnExplore) return exploreMapPathFromListSearch(search);
    const params = new URLSearchParams(searchParams);
    params.delete('list');
    const qs = params.toString();
    return qs ? `${EXPLORE_MAP_PATH}?${qs}` : EXPLORE_MAP_PATH;
  }, [embeddedOnExplore, search, searchParams]);

  const renderFeed = () => {
    if (isLoading) {
      return view === 'category' ? <CategoryFeedSkeleton /> : <FeedSkeleton />;
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
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-black/[0.04]">
          <p className="text-sm font-medium text-neutral-600">{BROWSE_LIST_EMPTY}</p>
          <button type="button" onClick={clearAllFilters} className="mt-4 text-sm font-semibold text-emerald-700">
            Clear filters
          </button>
        </div>
      );
    }
    if (view === 'category' && category) {
      return <ListCategoryDedicatedView category={category} cards={cards} />;
    }
    if (view === 'search') {
      return (
        <ListDiscoveryResults cards={cards} chipsCount={chips.length} onClearAll={clearAllFilters} />
      );
    }
    return (
      <ListDiscoverHome
        cards={discoverHomeCards}
        mapItems={items}
        onOpenCategory={openCategoryPage}
      />
    );
  };

  const organizeWizardOpen = Boolean(compose.organizeRoute);

  return (
    <>
      <ListFeedActionsProvider>
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
                showMapLink={surface === 'standalone'}
                onCloseMapOverlay={embeddedOnExplore ? onCloseMapOverlay : undefined}
                closeVariant={surface === 'exploreSidebar' ? 'collapse' : 'dismiss'}
                categoryFocus={view === 'category' ? category : null}
                onBackFromCategory={view === 'category' ? backToHome : undefined}
                categoryFilterRow={
                  view === 'category' && category ? (
                    <ListCategoryFilterBar
                      embedded
                      category={category}
                      pills={categoryPrimaryPills}
                      moreFiltersActive={categoryMoreFiltersActive}
                      activityDatePreset={filters.activityDatePreset}
                      onActivityDatePresetChange={(preset) => syncUrl({ activityDatePreset: preset })}
                      venueRegions={venueRegions}
                      onVenueRegionsChange={(regions) => syncUrl({ regions })}
                      tripTopic={filters.tripTopic}
                      tripLookingOnly={filters.tripLookingOnly}
                      onTripPlanTypeChange={(patch) => syncUrl(patch)}
                      appliedFilters={filters}
                      onMoreFiltersApply={(patch) => syncUrl(patch)}
                    />
                  ) : null
                }
                searchActiveFiltersRow={
                  view === 'search' && chips.length > 0 ? (
                    <div className="mt-2">
                      <ListActiveFilterChipsRow chips={chips} onClear={handleClearChip} />
                    </div>
                  ) : null
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
      </ListFeedActionsProvider>

      <ExploreComposeHost
        exploreCompose={compose.exploreCompose}
        composeMenuOpen={compose.composeMenuOpen}
        organizeWizardOpen={organizeWizardOpen}
        findWizardOpen={Boolean(compose.findRoute && isFindWizard(compose.exploreCompose))}
        addWizardOpen={Boolean(compose.addRoute && isAddWizard(compose.exploreCompose))}
        organizeKind={compose.organizeRoute?.kind ?? null}
        findKind={compose.findRoute?.kind}
        addKind={compose.addRoute?.kind ?? null}
        organizeWizardPrefill={null}
        signInHref={buildSignInRedirect({ pathname, search }).href}
        onComposeRouteChange={compose.handleComposeRouteChange}
        onCloseCompose={compose.closeCompose}
        onCloseCreateFlow={compose.closeCompose}
        onOrganizeBackToIntent={() => compose.setComposeRoute({ surface: 'menu', intent: 'organize' })}
        onFindBackToIntent={() => compose.setComposeRoute({ surface: 'menu', intent: 'find' })}
        onAddBackToIntent={() => compose.setComposeRoute({ surface: 'menu', intent: 'add' })}
        onActivityPublished={() => void reloadFeed()}
        onDemandSubmitted={() => void reloadFeed()}
        onContributeSubmitted={() => void reloadFeed()}
        onOpenHostApplication={() => {
          compose.closeCompose();
          navigateOrganizePublishGate(`${pathname}${search}`);
        }}
      />
    </>
  );
};
