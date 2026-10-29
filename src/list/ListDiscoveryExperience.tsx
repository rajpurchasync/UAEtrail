import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { LIST_DISCOVERY_PATH } from '../config/platform';
import { EXPLORE_MAP_PATH } from '../config/routingCatalog';
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
import { countExploreSearchScopes } from '../explore/exploreSearchMatches';
import type { ExploreSearchScopeKey } from '../explore/exploreBrowseTaxonomy';
import { useBrowseListFeed } from './useBrowseListFeed';
import { useListDiscoveryUrlState } from './useListDiscoveryUrlState';
import { BrowseListCreateFab } from './ui/BrowseListCreateFab';
import { PeopleBrowsePanel } from '@/people-discovery/panel/PeopleBrowsePanel';
import { usePeopleDiscoverySeekingActivities } from '@/people-discovery/hooks/usePeopleDiscoverySeekingActivities';
import { useHostActivitySheetBundle } from '../hooks/useHostActivitySheetBundle';
import { exploreMapPathFromListSearch } from './routing';
import { listDiscoveryEmbeddedOnExplore, type ListDiscoverySurface } from './listDiscoverySurface';
import { useMemberDiscoveryRoster } from '@/people-discovery/hooks/useMemberDiscoveryRoster';
import { useExplorePeopleAvailability } from '@/people-discovery/hooks/usePeopleAvailability';
import { parseExploreAreaSlug } from '../explore/exploreAreaFilter';
import { listExplorerEntityLinkState } from './explorer/listExplorerNavState';
import { countListExplorerFilters } from './explorer/listExplorerLayout';
import {
  listExplorerBucketCategories,
  parseListExplorerBucket,
  serializeListExplorerBucket,
} from './explorer/listExplorerBucket';
import { ListExplorer } from './explorer/ListExplorer';

type ListDiscoveryExperienceProps = {
  surface: ListDiscoverySurface;
  onCloseMapOverlay?: () => void;
  overlayImmersive?: boolean;
  onImmersiveSubtitleChange?: (subtitle: string | null) => void;
};

export const ListDiscoveryExperience = ({
  surface,
  onCloseMapOverlay,
  overlayImmersive = false,
  onImmersiveSubtitleChange,
}: ListDiscoveryExperienceProps) => {
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
  const { inviteShare, hostManageSheet } = hostSheets;

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
  const { filters, syncUrl, venueRegions, listCat, layout } = browseUrl;
  const isPeopleCategory = listCat === 'people';
  const explorerBucket = parseListExplorerBucket(listCat);
  const [draftQuery, setDraftQuery] = useState(filters.query);
  useEffect(() => {
    setDraftQuery(filters.query);
  }, [filters.query]);
  const areaSlug = parseExploreAreaSlug(searchParams);
  const peopleSegment = filters.buddiesSegment;
  const memberRoster = useMemberDiscoveryRoster({
    enabled:
      isPeopleCategory &&
      Boolean(user) &&
      (peopleSegment === 'looking' || peopleSegment === 'going' || peopleSegment === 'connect'),
    search: draftQuery,
    activityDatePreset: filters.activityDatePreset,
    omitDirectory: peopleSegment !== 'connect',
  });
  const memberAvailability = useExplorePeopleAvailability({
    enabled: isPeopleCategory && Boolean(user) && peopleSegment === 'available',
    search: draftQuery,
    activityDatePreset: filters.activityDatePreset,
    areaSlug,
    mapFilter: 'all',
  });
  const { cards, items, isLoading, isError, refetch: reloadMap } = useBrowseListFeed({
    filters: isPeopleCategory
      ? { ...filters, query: draftQuery, categories: [] }
      : {
          ...filters,
          query: draftQuery,
          categories:
            listCat === 'agencies' ? ['agencies'] : listExplorerBucketCategories(explorerBucket),
        },
    venueRegions,
    mapEnabled: !isPeopleCategory || peopleSegment === 'looking',
  });

  const { seekingActivities } = usePeopleDiscoverySeekingActivities({
    enabled: isPeopleCategory && peopleSegment === 'looking',
    exploreCatalogFallback: items,
    filters: {
      mapFilter: 'all',
      buddySubtype: 'all',
      outingTopic: 'all',
      query: draftQuery,
    },
  });

  const handleOpenSeekingActivity = useCallback(
    (item: { path: string }) => {
      const returnTo = `${location.pathname}${location.search}`;
      navigate(item.path, { state: listExplorerEntityLinkState(returnTo) });
    },
    [location.pathname, location.search, navigate]
  );

  const searchScopeCounts = useMemo(
    () => countExploreSearchScopes(items, draftQuery, filters.activityDatePreset, venueRegions),
    [items, draftQuery, filters.activityDatePreset, venueRegions]
  );

  const filterCount = countListExplorerFilters(filters, venueRegions, explorerBucket);

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
    if (scope === 'activities') {
      syncUrl({ query: draftQuery, listCat: null, categories: [] });
      return;
    }
    if (scope === 'places' || scope === 'shops') {
      const patch = browseListFilterPatchForSearchScope(scope);
      syncUrl({
        query: draftQuery,
        listCat: 'venues',
        categories: [],
        tripTopics: [],
        tripLookingOnly: false,
        placeTopics: patch?.placeTopics ?? [],
      });
      return;
    }
    if (scope === 'agencies') {
      syncUrl({ query: draftQuery, listCat: 'agencies', categories: ['agencies'] });
      return;
    }
    syncUrl({ query: draftQuery, listCat: serializeListExplorerBucket(explorerBucket) });
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
      regions: [],
    });
    setDraftQuery('');
  };

  useEffect(() => {
    onImmersiveSubtitleChange?.(null);
  }, [onImmersiveSubtitleChange]);

  const mapHref = useMemo(() => {
    if (onCloseMapOverlay) return EXPLORE_MAP_PATH;
    return exploreMapPathFromListSearch(search);
  }, [onCloseMapOverlay, search]);

  const hostWizardOpen = Boolean(compose.hostComposeRoute) && Boolean(user);

  return (
    <>
      {isPeopleCategory ? (
        <PeopleBrowsePanel
          embedded
          isDesktop={surface === 'exploreSidebar'}
          query={draftQuery}
          onQueryChange={setDraftQuery}
          onQuerySync={commitQuery}
          onClose={() => syncUrl({ listCat: null, categories: [] })}
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
      ) : (
        <ListExplorer
          cards={cards}
          loading={isLoading}
          error={isError}
          onRetry={() => void reloadMap()}
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
          onBucketChange={(next) =>
            syncUrl({
              query: draftQuery,
              listCat: serializeListExplorerBucket(next),
              categories: [],
            })
          }
          filters={filters}
          regions={venueRegions}
          filterCount={filterCount}
          onApplyFilters={(state, regions) => syncUrl({ ...state, regions })}
          onClearFilters={clearAllFilters}
        />
      )}

      {embeddedOnExplore || overlayImmersive ? null : <BrowseListCreateFab onClick={compose.handleCreateTap} />}

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
