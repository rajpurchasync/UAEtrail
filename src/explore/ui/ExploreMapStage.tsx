import { lazy, Suspense, useCallback, useRef, useState, type ReactNode } from 'react';
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
import { List, Plus } from 'lucide-react';
import { UiTooltip } from '../../components/ui/UiTooltip';
import { isGeographyMapSource, type ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { MapBounds, PlaceMapPin } from '../../components/ui/PlacesMap';
import { getMapBounds } from '../../config/regions';
import { MAP_CONFIG, getExploreMapTiles, type ExploreMapStyle } from '../../config/platform';
import { hasSessionExpiredQuery } from '../../config/surfacePaths';
import { EXPLORE_MAP_FLOATING_CHROME_BTN, EXPLORE_Z } from '../../config/exploreTheme';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import type { JoinRequestUiState } from '../../utils/joinRequestUi';
import { ExploreCoachMarks } from './ExploreCoachMarks';
import { ExploreDismissibleNotice } from './ExploreDismissibleNotice';
import { ExploreGuestPreviewLimitBanner } from './ExploreGuestPreviewLimitBanner';
import { ActivityMapPeekHost } from './ActivityMapPeekHost';
import { ExploreMapChromeBar } from './ExploreMapChromeBar';
import { ExploreMapLoadErrorBoundary } from './ExploreMapLoadErrorBoundary';
import { ExploreMapLoadingSkeleton } from './ExploreMapLoadingSkeleton';
import { ExploreMapLocationPrompt } from './ExploreMapLocationPrompt';
import { ExploreMapControlToolbar } from './ExploreMapControlToolbar';
import { PlaceMapPeekHost } from './peek/place/PlaceMapPeekHost';
import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import type { ExplorePanel, MapFilterKey, VenueListFilterKey } from '../routing';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import type { MapRecenterTarget } from '../../lib/mapRecenter';
import type { MapPeekPinAnchor } from '../mapPeekBubbleLayout';

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
  onBrowsePanelChange: (panel: ExplorePanel) => void;
  onMapFilterChange: (filter: MapFilterKey) => void;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  onVenueRegionsChange: (regions: string[]) => void;
  venueFilter?: VenueListFilterKey;
  onVenueFilterChange?: (filter: VenueListFilterKey) => void;
  onOpenPeopleBrowsePanel?: () => void;
  peopleBrowsePanelAvatars?: Array<{ id: string; name: string; avatar?: string | null }>;
  peopleBrowsePanelFriendCount?: number;
  peopleBrowseGuest?: boolean;
  peopleBrowsePossibleCrewCount?: number;
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
  onOpenBrowse: () => void;
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
  linkRideshareTenantId?: string | null;
  onOpenExploreItem?: (exploreItemId: string) => void;
  onGuestGatedAction?: (action: import('@uaetrail/shared-types').ActivityMapPeekActionId) => void;
  joinInvitePeekBanner?: string | null;
  onShareActivity?: () => void;
  /** Desktop overlay — Find crew rail or guest sign-in popup. */
  desktopRightPanelOverlay?: ReactNode;
  /** `rail` = right column; `centered` = modal over map (guest gates). */
  desktopMapOverlayLayout?: 'rail' | 'centered';
  /** Find crew — people pins only, list docked beside the map, no outing filters. */
  peopleMap?: boolean;
  /** Search modal + results — scoped to map pane. */
  mapSearchOverlay?: ReactNode;
  mapSearchOpen?: boolean;
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
  onBrowsePanelChange,
  onMapFilterChange,
  onActivityDatePresetChange,
  onVenueRegionsChange,
  venueFilter,
  onVenueFilterChange,
  onOpenPeopleBrowsePanel,
  peopleBrowsePanelAvatars,
  peopleBrowsePanelFriendCount,
  peopleBrowseGuest = false,
  peopleBrowsePossibleCrewCount = 0,
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
  onOpenBrowse,
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
  linkRideshareTenantId = null,
  onOpenExploreItem,
  onGuestGatedAction,
  joinInvitePeekBanner = null,
  onShareActivity,
  desktopRightPanelOverlay = null,
  desktopMapOverlayLayout = 'rail',
  peopleMap = false,
  mapSearchOverlay = null,
  mapSearchOpen = false,
}: ExploreMapStageProps) => {
  const [searchParams] = useSearchParams();
  const [guestPreviewDismissed, setGuestPreviewDismissed] = useState(() =>
    readExploreGuestMapPreviewDismissed()
  );
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
  const showGuestMapPreviewNotice =
    isGuestMapCatalogPreviewLimited() &&
    !user &&
    !listOpen &&
    !loadError &&
    !guestPreviewDismissed &&
    !guestExplorePreviewLimitReached() &&
    !mapSearchOpen &&
    !hasSessionExpiredQuery(searchParams);
  const dockCrewPanel = Boolean(
    peopleMap && desktopRightPanelOverlay && desktopMapOverlayLayout === 'rail'
  );
  const guestGatedActionForActivity = user ? undefined : onGuestGatedAction;
  const guestGatedActionForPlace =
    user || !onGuestGatedAction ? undefined : () => onGuestGatedAction('view_detail');

  return (
  <div
    className={`explore-map-stage relative flex min-h-0 min-w-0 flex-1 overflow-hidden ${
      dockCrewPanel ? 'flex-row' : 'flex-col'
    }`}
  >
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
          tileAttribution={MAP_CONFIG.exploreTileAttribution}
          labelTileUrl={exploreMapTiles.labelTileUrl}
          onPinClick={onPinClick}
          onVisibleBoundsChange={onVisibleBoundsChange}
          recenterTo={recenterTo}
          exploreMapCenter={exploreMapCenter}
          deviceLocation={deviceLocation}
          className="h-full w-full min-h-[280px]"
          onMapReady={handleMapReady}
          layoutRevision={listOpen || peopleMap}
          onSelectedPinScreenPoint={handleSelectedPinScreenPoint}
        />
        </Suspense>
        </ExploreMapLoadErrorBoundary>
      </div>

      {!listOpen && !isDesktop && user ? <ExploreCoachMarks /> : null}

      {!(isDesktop) && !peopleMap ? (
      <ExploreMapChromeBar
        panel={panel}
        mapFilter={mapFilter}
        venueRegions={venueRegions}
        activityDatePreset={activityDatePreset}
        onBrowsePanelChange={onBrowsePanelChange}
        onMapFilterChange={onMapFilterChange}
        onActivityDatePresetChange={onActivityDatePresetChange}
        onVenueRegionsChange={onVenueRegionsChange}
        venueFilter={venueFilter}
        onVenueFilterChange={onVenueFilterChange}
        onOpenPeopleBrowsePanel={onOpenPeopleBrowsePanel}
        peopleBrowsePanelAvatars={peopleBrowsePanelAvatars}
        peopleBrowsePanelFriendCount={peopleBrowsePanelFriendCount}
        peopleBrowseGuest={peopleBrowseGuest}
        peopleBrowsePossibleCrewCount={peopleBrowsePossibleCrewCount}
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

      {!listOpen && !peopleMap ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--explore-float-base)+var(--explore-map-fab-inset))] z-[1100] grid grid-cols-[1fr_auto] grid-rows-[auto_auto] items-center gap-x-3 px-4 md:hidden"
          style={{ rowGap: 'var(--explore-map-fab-stack-gap)' }}
        >
          <div className="pointer-events-auto col-start-1 row-start-1 self-center justify-self-start">
            <button
              type="button"
              onClick={onOpenBrowse}
              className={EXPLORE_MAP_FLOATING_CHROME_BTN}
            >
              <List
                className="h-6 w-6 shrink-0 text-current"
                strokeWidth={1.25}
                absoluteStrokeWidth
                aria-hidden
              />
              List
            </button>
          </div>
          <div className="pointer-events-auto col-start-2 row-start-1">
            <ExploreMapControlToolbar
              onLocate={onLocateMe}
              locating={locatingDevice}
              mapStyle={exploreMapStyle}
              onToggleMapStyle={onToggleMapStyle}
            />
          </div>
          <div className="pointer-events-auto col-start-2 row-start-2 justify-self-center">
            <UiTooltip label={primaryFabLabel}>
            <button
              type="button"
              onClick={onPrimaryFab}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_4px_20px_rgba(5,150,105,.45)] hover:bg-emerald-700 active:scale-[0.98]"
              aria-label={primaryFabLabel}
            >
              <Plus className="h-6 w-6 shrink-0" strokeWidth={2.5} aria-hidden />
            </button>
            </UiTooltip>
          </div>
        </div>
      ) : null}

      <div
        className="pointer-events-none absolute right-4 z-[1100] hidden md:flex md:flex-col md:items-end"
        style={{
          bottom: peopleMap
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
      {!peopleMap ? (
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
          joinInvitePeekBanner={joinInvitePeekBanner}
          onShareActivity={onShareActivity}
        />
      ) : null}
    </div>

    {dockCrewPanel ? desktopRightPanelOverlay : null}

    {!dockCrewPanel && desktopRightPanelOverlay ? (
      <div
        className={
          desktopMapOverlayLayout === 'centered'
            ? `pointer-events-none absolute inset-0 ${EXPLORE_Z.guestJoinSheet}`
            : 'pointer-events-none absolute inset-0 z-[1200] flex h-full min-h-0 justify-end'
        }
        role="presentation"
      >
        {desktopRightPanelOverlay}
      </div>
    ) : null}

    {mapSearchOverlay ? (
      <div
        className={`pointer-events-none absolute inset-0 min-h-0 ${EXPLORE_Z.browseSheet}`}
        role="presentation"
      >
        {mapSearchOverlay}
      </div>
    ) : null}
  </div>
  );
};
