import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Map as LeafletMap } from 'leaflet';
import { SessionExpiredNotice } from '../../components/auth/SessionExpiredNotice';
import { ExploreGuestMapPreviewNotice } from './ExploreGuestMapPreviewNotice';
import {
  isGuestMapCatalogPreviewLimited,
  guestExplorePreviewLimitReached,
  readExploreGuestMapPreviewDismissed,
  writeExploreGuestMapPreviewDismissed,
} from '../guestMapPreviewPolicy';
import { Plus } from 'lucide-react';
import { isGeographyMapSource, type ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { MapBounds, PlaceMapPin } from '../../components/ui/PlacesMap';
import { getMapBounds } from '../../config/regions';
import { getExploreMapTiles, type ExploreMapStyle } from '../../config/platform';
import { hasSessionExpiredQuery } from '../../config/surfacePaths';
import { EXPLORE_Z } from '../../config/exploreTheme';
import { ExploreMapMobileDock } from './ExploreMapMobileDock';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import type { JoinRequestUiState } from '../../utils/joinRequestUi';
import { ExploreDismissibleNotice } from './ExploreDismissibleNotice';
import { ExploreGuestPreviewLimitBanner } from './ExploreGuestPreviewLimitBanner';
import { ActivityMapPeekHost } from './ActivityMapPeekHost';
import { ExploreMapChromeBar } from './ExploreMapChromeBar';
import { ListExplorerGeoScopeChip } from '../../list/explorer/ListExplorerGeoScopeChip';
import { ExploreMapLoadErrorBoundary } from './ExploreMapLoadErrorBoundary';
import { ExploreMapLoadingSkeleton } from './ExploreMapLoadingSkeleton';
import { ExploreMapLocationPrompt } from './ExploreMapLocationPrompt';
import { ExploreMapControlToolbar } from './ExploreMapControlToolbar';
import { PlaceMapPeekHost } from './peek/place/PlaceMapPeekHost';
import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import type { PlaceKind } from '@uaetrail/shared-types';
import type { ExplorePanel, MapFilterKey, VenueListFilterKey } from '../routing';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import type { PlaceMapTopicKey, TripMapTopicKey } from '../exploreMapQuickTopicFilters';
import type { ExplorePriceFilter, ExploreVenueFilterPatch } from '../exploreOptionalFilters';
import type { MapRecenterTarget } from '../../lib/mapRecenter';
import type { MapPeekPinAnchor } from '../mapPeekBubbleLayout';
import {
  ExploreMapRecommendedSheet,
  type ExploreMapRecommendedSheetSnap,
} from './ExploreMapRecommendedSheet';

const PlacesMap = lazy(() =>
  import('../../components/ui/PlacesMap').then((module) => ({ default: module.PlacesMap }))
);

type ExploreMapTiles = ReturnType<typeof getExploreMapTiles>;

export type ExploreMapStageProps = {
  isDesktop: boolean;
  listOpen: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onSearchCommit?: (scope?: ExploreSearchScopeKey | null) => void;
  searchScopeCounts?: ExploreSearchScopeCounts;
  onOpenExploreSearch?: () => void;
  panel: ExplorePanel;
  mapFilter: MapFilterKey;
  venueRegions: string[];
  activityDatePreset: ExploreActivityDatePreset;
  catalogListCount: number;
  projectionMode: 'map' | 'list';
  onSelectMapView: () => void;
  onSelectListView: () => void;
  onMapFilterChange: (filter: MapFilterKey) => void;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  onVenueRegionsChange: (regions: string[]) => void;
  geoPath?: readonly string[];
  onClearGeoScope?: () => void;
  onPopGeoScope?: () => void;
  venueFilter?: VenueListFilterKey;
  onVenueFilterChange?: (filter: VenueListFilterKey) => void;
  tripMapTopics: TripMapTopicKey[];
  placeMapTopics: PlaceMapTopicKey[];
  priceFilter: ExplorePriceFilter;
  hasTrip: boolean;
  facilityKinds: PlaceKind[];
  onTripTopicsChange: (next: TripMapTopicKey[]) => void;
  onPlaceTopicsChange: (next: PlaceMapTopicKey[]) => void;
  onPriceFilterChange: (next: ExplorePriceFilter) => void;
  onHasTripChange: (next: boolean) => void;
  onFacilityKindsChange: (next: PlaceKind[]) => void;
  onVenueFiltersChange: (next: ExploreVenueFilterPatch) => void;
  onOpenCrewsBrowsePanel?: () => void;
  crewsBrowseMapAvatars?: Array<{ id: string; name: string; avatar?: string | null }>;
  crewsBrowseMapFriendCount?: number;
  crewsBrowseMapGuest?: boolean;
  crewsBrowseMapCrewCount?: number;
  exploreMapStyle: ExploreMapStyle;
  exploreMapTiles: ExploreMapTiles;
  onToggleMapStyle: () => void;
  onLocateMe: () => void;
  mapPins: PlaceMapPin[];
  selectedId: string | null;
  highlightedExploreItemId?: string | null;
  recenterTo: MapRecenterTarget | null;
  exploreMapCenter: { lat: number; lng: number };
  deviceLocation?: { lat: number; lng: number } | null;
  onPinClick: (pin: PlaceMapPin) => void;
  onVisibleBoundsChange?: (bounds: MapBounds) => void;
  loading: boolean;
  loadError: string | null;
  onReloadMap: () => void;
  venueNotice: string | null;
  onDismissVenueNotice: () => void;
  exploreNotice: string | null;
  onDismissExploreNotice: () => void;
  user: { id: string } | null;
  locationPromptOpen: boolean;
  locatingDevice: boolean;
  onAllowMapLocation: () => void;
  onDismissLocationPrompt: () => void;
  onPrimaryFab: () => void;
  primaryFabLabel: string;
  selected: ExploreMapItemDTO | null;
  selectedCard: DiscoveryCardModel | null;
  joinUiState: JoinRequestUiState | undefined;
  joinStateLoading: boolean;
  onCloseSelection: () => void;
  onJoin: () => void;
  onMessage: () => void;
  onWithdraw: () => void;
  activityPeekSkipsJoinContext?: boolean;
  onActivityMapPeekAction?: (actionId: import('@uaetrail/shared-types').ActivityMapPeekActionId) => void;
  onOfferTransport?: () => void;
  onOfferRideshare?: () => void;
  linkRideshareTenantId?: string | null;
  onOpenExploreItem?: (exploreItemId: string) => void;
  onGuestGatedAction?: (action: import('@uaetrail/shared-types').ActivityMapPeekActionId) => void;
  joinInvitePeekBanner?: string | null;
  onShareActivity?: () => void;
  /** Desktop overlay — guest sign-in gates centered over the map. */
  desktopRightPanelOverlay?: ReactNode;
  /** Find crew — people pins only, list docked beside the map, no outing filters. */
  crewsBrowseMap?: boolean;
  /** Search modal + results — scoped to map pane. */
  mapSearchOverlay?: ReactNode;
  mapSearchOpen?: boolean;
  /** Leaflet invalidateSize when left rails or list/crew modes change width. */
  mapLayoutRevision?: boolean;
  /** Discover layer — client-ranked map recommendations (v0). */
  mapRecommendationItems?: ExploreMapItemDTO[];
  mapRecommendationSignalsByItemId?: Map<string, import('@uaetrail/shared-types').DiscoverRecommendationSignal[]>;
  onOpenMapRecommendation?: (itemId: string) => void;
};

export const ExploreMapStage = ({
  isDesktop,
  listOpen,
  searchQuery,
  onSearchQueryChange,
  onSearchCommit,
  searchScopeCounts,
  onOpenExploreSearch,
  panel,
  mapFilter,
  venueRegions,
  activityDatePreset,
  catalogListCount,
  projectionMode,
  onSelectMapView,
  onSelectListView,
  onMapFilterChange,
  onActivityDatePresetChange,
  onVenueRegionsChange,
  geoPath = [],
  onClearGeoScope,
  onPopGeoScope,
  venueFilter,
  onVenueFilterChange: _onVenueFilterChange,
  tripMapTopics,
  placeMapTopics,
  priceFilter,
  hasTrip,
  facilityKinds,
  onTripTopicsChange,
  onPlaceTopicsChange,
  onPriceFilterChange,
  onHasTripChange,
  onFacilityKindsChange,
  onVenueFiltersChange,
  onOpenCrewsBrowsePanel: _onOpenCrewsBrowsePanel,
  crewsBrowseMapAvatars: _crewsBrowseMapAvatars,
  crewsBrowseMapFriendCount: _crewsBrowseMapFriendCount,
  crewsBrowseMapGuest: _crewsBrowseMapGuest = false,
  crewsBrowseMapCrewCount: _crewsBrowseMapCrewCount = 0,
  exploreMapStyle,
  exploreMapTiles,
  onToggleMapStyle,
  onLocateMe,
  mapPins,
  selectedId,
  highlightedExploreItemId = null,
  recenterTo,
  exploreMapCenter,
  deviceLocation = null,
  onPinClick,
  onVisibleBoundsChange,
  loading,
  loadError,
  onReloadMap,
  venueNotice,
  onDismissVenueNotice,
  exploreNotice,
  onDismissExploreNotice,
  user,
  locationPromptOpen,
  locatingDevice,
  onAllowMapLocation,
  onDismissLocationPrompt,
  onPrimaryFab,
  primaryFabLabel,
  selected,
  selectedCard,
  joinUiState,
  joinStateLoading,
  onCloseSelection,
  onJoin,
  onMessage,
  onWithdraw,
  activityPeekSkipsJoinContext: _activityPeekSkipsJoinContext = false,
  onActivityMapPeekAction,
  onOfferTransport,
  onOfferRideshare,
  linkRideshareTenantId = null,
  onOpenExploreItem,
  onGuestGatedAction,
  joinInvitePeekBanner = null,
  onShareActivity,
  desktopRightPanelOverlay = null,
  crewsBrowseMap = false,
  mapSearchOverlay = null,
  mapSearchOpen = false,
  mapLayoutRevision = false,
  mapRecommendationItems = [],
  mapRecommendationSignalsByItemId,
  onOpenMapRecommendation,
}: ExploreMapStageProps) => {
  const [searchParams] = useSearchParams();
  const [recommendSnap, setRecommendSnap] = useState<ExploreMapRecommendedSheetSnap>('half');
  const [guestPreviewDismissed, setGuestPreviewDismissed] = useState(() =>
    readExploreGuestMapPreviewDismissed()
  );

  useEffect(() => {
    if (mapRecommendationItems.length > 0) {
      setRecommendSnap((prev) => (prev === 'hidden' ? prev : 'half'));
    }
  }, [mapRecommendationItems.length]);
  const [pinAnchor, setPinAnchor] = useState<MapPeekPinAnchor | null>(null);
  const handleSelectedPinScreenPoint = useCallback((point: MapPeekPinAnchor | null) => {
    setPinAnchor(point);
  }, []);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const handleMapReady = useCallback((map: LeafletMap | null) => {
    leafletMapRef.current = map;
  }, []);
  const handleZoomIn = useCallback(() => {
    leafletMapRef.current?.zoomIn();
  }, []);
  const handleZoomOut = useCallback(() => {
    leafletMapRef.current?.zoomOut();
  }, []);
  const showMapRecommendations =
    mapRecommendationItems.length > 0 &&
    onOpenMapRecommendation != null &&
    !listOpen &&
    !crewsBrowseMap &&
    !mapSearchOpen &&
    !selectedCard &&
    !loadError;

  const showGuestMapPreviewNotice =
    isGuestMapCatalogPreviewLimited() &&
    !user &&
    !listOpen &&
    !loadError &&
    !guestPreviewDismissed &&
    !guestExplorePreviewLimitReached() &&
    !mapSearchOpen &&
    !hasSessionExpiredQuery(searchParams);
  const guestGatedActionForActivity = user ? undefined : onGuestGatedAction;
  const guestGatedActionForPlace =
    user || !onGuestGatedAction ? undefined : () => onGuestGatedAction('view_detail');

  return (
  <div className="explore-map-stage relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
    <div className="relative z-0 min-h-0 min-w-0 flex-1 isolate overflow-hidden">
      <div className="absolute inset-0 z-0 min-h-[280px]">
        <ExploreMapLoadErrorBoundary onRetry={onReloadMap}>
        <Suspense fallback={<div className="h-full min-h-[280px] w-full bg-[#2a3441]" aria-hidden />}>
        <PlacesMap
          pins={mapPins}
          bounds={getMapBounds()}
          fill
          allowEmpty
          exploreMode
          showLegend={false}
          selectedExploreItemId={selectedId ?? undefined}
          highlightedExploreItemId={highlightedExploreItemId ?? undefined}
          tileUrl={exploreMapTiles.tileUrl}
          tileAttribution={exploreMapTiles.attribution}
          labelTileUrl={exploreMapTiles.labelTileUrl}
          onPinClick={onPinClick}
          onVisibleBoundsChange={onVisibleBoundsChange}
          recenterTo={recenterTo}
          exploreMapCenter={exploreMapCenter}
          deviceLocation={deviceLocation}
          className="h-full w-full min-h-[280px]"
          onMapReady={handleMapReady}
          layoutRevision={mapLayoutRevision || listOpen || crewsBrowseMap}
          onSelectedPinScreenPoint={handleSelectedPinScreenPoint}
          onDismissMapPeek={selectedId ? onCloseSelection : undefined}
          exploreMapStyle={exploreMapStyle}
        />
        </Suspense>
        </ExploreMapLoadErrorBoundary>
      </div>

      {isDesktop && !crewsBrowseMap && geoPath.length > 0 && onClearGeoScope ? (
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 px-3 pt-3 lg:px-4 ${EXPLORE_Z.mapFilters}`}
        >
          <div className="pointer-events-auto max-w-md">
            <ListExplorerGeoScopeChip
              geoPath={geoPath}
              onClear={onClearGeoScope}
              onPopLevel={onPopGeoScope}
            />
          </div>
        </div>
      ) : null}

      {!(isDesktop) && !crewsBrowseMap ? (
      <ExploreMapChromeBar
        panel={panel}
        mapFilter={mapFilter}
        onMapFilterChange={onMapFilterChange}
        venueRegions={venueRegions}
        activityDatePreset={activityDatePreset}
        catalogListCount={catalogListCount}
        projectionMode={projectionMode}
        onSelectMapView={onSelectMapView}
        onSelectListView={onSelectListView}
        onActivityDatePresetChange={onActivityDatePresetChange}
        onVenueRegionsChange={onVenueRegionsChange}
        geoPath={geoPath}
        onClearGeoScope={onClearGeoScope}
        onPopGeoScope={onPopGeoScope}
        venueFilter={venueFilter}
        tripMapTopics={tripMapTopics}
        placeMapTopics={placeMapTopics}
        priceFilter={priceFilter}
        hasTrip={hasTrip}
        facilityKinds={facilityKinds}
        onTripTopicsChange={onTripTopicsChange}
        onPlaceTopicsChange={onPlaceTopicsChange}
        onPriceFilterChange={onPriceFilterChange}
        onHasTripChange={onHasTripChange}
        onFacilityKindsChange={onFacilityKindsChange}
        onVenueFiltersChange={onVenueFiltersChange}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        onSearchCommit={onSearchCommit}
        searchScopeCounts={searchScopeCounts}
        onOpenExploreSearch={onOpenExploreSearch}
      />
      ) : null}

      {user && !listOpen ? (
        <ExploreMapLocationPrompt
          open={locationPromptOpen}
          loading={locatingDevice}
          onAllow={onAllowMapLocation}
          onDismiss={onDismissLocationPrompt}
        />
      ) : null}

      {venueNotice ? (
        <ExploreDismissibleNotice message={venueNotice} onDismiss={onDismissVenueNotice} />
      ) : null}

      {exploreNotice ? (
        <ExploreDismissibleNotice message={exploreNotice} onDismiss={onDismissExploreNotice} />
      ) : null}

      <SessionExpiredNotice variant="overlay" />

      {showGuestMapPreviewNotice ? (
        <ExploreGuestMapPreviewNotice
          onDismiss={() => {
            writeExploreGuestMapPreviewDismissed();
            setGuestPreviewDismissed(true);
          }}
        />
      ) : null}

      {!user && !listOpen && !loadError && guestExplorePreviewLimitReached() ? (
        <ExploreGuestPreviewLimitBanner />
      ) : null}

      {loadError ? (
        <div className="absolute left-4 right-4 top-32 z-[1100] rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-medium text-amber-900 shadow">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={onReloadMap}
            className="mt-2 rounded-lg bg-amber-100 px-3 py-1.5 text-[11px] font-semibold text-amber-950 hover:bg-amber-200"
          >
            Retry map
          </button>
        </div>
      ) : null}

      {loading && mapPins.length === 0 ? <ExploreMapLoadingSkeleton /> : null}

      {showMapRecommendations ? (
        <ExploreMapRecommendedSheet
          items={mapRecommendationItems}
          snap={recommendSnap}
          onSnapChange={setRecommendSnap}
          onOpenItem={onOpenMapRecommendation}
          onOpenList={onSelectListView}
          signalsByItemId={mapRecommendationSignalsByItemId}
        />
      ) : null}

      {!listOpen && !crewsBrowseMap ? (
        <ExploreMapMobileDock
          onPrimaryFab={onPrimaryFab}
          primaryFabLabel={primaryFabLabel}
          onLocateMe={onLocateMe}
          locatingDevice={locatingDevice}
          exploreMapStyle={exploreMapStyle}
          onToggleMapStyle={onToggleMapStyle}
        />
      ) : null}

      <div
        className="pointer-events-none absolute right-4 z-[1100] hidden md:flex md:flex-col md:items-end"
        style={{
          bottom: crewsBrowseMap
            ? 'var(--explore-map-desktop-fab-bottom)'
            : 'calc(var(--explore-map-desktop-fab-bottom) + var(--explore-map-desktop-primary-fab-height) + var(--explore-map-fab-stack-gap) + var(--explore-map-desktop-zoom-clearance))',
        }}
      >
        <ExploreMapControlToolbar
          showZoom
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onLocate={onLocateMe}
          locating={locatingDevice}
          mapStyle={exploreMapStyle}
          onToggleMapStyle={onToggleMapStyle}
        />
      </div>
      {!crewsBrowseMap ? (
      <div
        className="pointer-events-none absolute right-4 z-[1100] hidden md:block"
        style={{ bottom: 'var(--explore-map-desktop-fab-bottom)' }}
      >
        <button
          type="button"
          onClick={onPrimaryFab}
          className="pointer-events-auto inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(5,150,105,.35)] hover:bg-emerald-700 active:scale-[0.98]"
          aria-label={primaryFabLabel}
        >
          <Plus className="h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden />
          {primaryFabLabel}
        </button>
      </div>
      ) : null}

      {selectedCard && selected && isGeographyMapSource(selected.source) ? (
        <PlaceMapPeekHost
          item={selected}
          onClose={onCloseSelection}
          onGuestGatedAction={guestGatedActionForPlace}
          pinAnchor={pinAnchor}
          pinKey={selected.id}
          viewer={
            deviceLocation
              ? { lat: deviceLocation.lat, lng: deviceLocation.lng }
              : null
          }
        />
      ) : selectedCard ? (
        <ActivityMapPeekHost
          card={selectedCard}
          pinAnchor={pinAnchor}
          pinKey={selected?.id ?? null}
          onClose={onCloseSelection}
          onGuestGatedAction={guestGatedActionForActivity}
          onJoin={onJoin}
          onMessage={onMessage}
          linkRideshareTenantId={linkRideshareTenantId}
          onOpenExploreItem={onOpenExploreItem}
          joinUiState={joinUiState}
          onWithdraw={onWithdraw}
          joinStateLoading={joinStateLoading}
          onActivityMapPeekAction={onActivityMapPeekAction}
          onOfferTransport={onOfferTransport}
          onOfferRideshare={onOfferRideshare}
          joinInvitePeekBanner={joinInvitePeekBanner}
          onShareActivity={onShareActivity}
        />
      ) : null}
    </div>

    {desktopRightPanelOverlay ? (
      <div
        className={`pointer-events-none absolute inset-0 ${EXPLORE_Z.guestJoinSheet}`}
        role="presentation"
      >
        {desktopRightPanelOverlay}
      </div>
    ) : null}

    {mapSearchOverlay ? (
      <div
        className={`pointer-events-auto absolute inset-0 min-h-0 ${EXPLORE_Z.browseSheet}`}
        role="presentation"
      >
        {mapSearchOverlay}
      </div>
    ) : null}
  </div>
  );
};
