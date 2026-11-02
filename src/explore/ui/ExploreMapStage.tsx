import { lazy, Suspense, type ReactNode } from 'react';
import { List, Plus } from 'lucide-react';
import { isGeographyMapSource, type ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { MapBounds, PlaceMapPin } from '../../components/ui/PlacesMap';
import { getMapBounds } from '../../config/regions';
import { MAP_CONFIG, getExploreMapTiles, type ExploreMapStyle } from '../../config/platform';
import { EXPLORE_FLOATING_CONTROL } from '../../config/exploreTheme';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import type { JoinRequestUiState } from '../../utils/joinRequestUi';
import { ExploreCoachMarks } from './ExploreCoachMarks';
import { ExploreDismissibleNotice } from './ExploreDismissibleNotice';
import { ActivityMapPeekHost } from './ActivityMapPeekHost';
import { ExploreMapChromeBar } from './ExploreMapChromeBar';
import { ExploreMapLoadErrorBoundary } from './ExploreMapLoadErrorBoundary';
import { ExploreMapLoadingSkeleton } from './ExploreMapLoadingSkeleton';
import { ExploreMapLocationPrompt } from './ExploreMapLocationPrompt';
import { ExploreMapLocateButton } from './ExploreMapLocateButton';
import { ExploreMapStyleToggle } from './ExploreMapStyleToggle';
import { PlaceMapPeekHost } from './peek/place/PlaceMapPeekHost';
import type { ExploreSearchScopeCounts, ExploreSearchScopeKey } from '../exploreBrowseTaxonomy';
import type { ExplorePanel, MapFilterKey, VenueListFilterKey } from '../routing';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import type { MapRecenterTarget } from '../../lib/mapRecenter';

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
  onOpenPeopleBrowsePanel: () => void;
  peopleBrowsePanelAvatars?: Array<{ id: string; name: string; avatar?: string | null }>;
  peopleBrowsePanelFriendCount?: number;
  exploreMapStyle: ExploreMapStyle;
  exploreMapTiles: ExploreMapTiles;
  onToggleMapStyle: () => void;
  onLocateMe: () => void;
  mapPins: PlaceMapPin[];
  selectedId: string | null;
  highlightedExploreItemId?: string | null;
  recenterTo: MapRecenterTarget | null;
  exploreMapCenter: { lat: number; lng: number };
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
  /** Desktop Find crew sheet over the map (keeps mapStage a direct flex child in the explore row). */
  desktopPeopleBrowseOverlay?: ReactNode;
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
  exploreMapStyle,
  exploreMapTiles,
  onToggleMapStyle,
  onLocateMe,
  mapPins,
  selectedId,
  highlightedExploreItemId = null,
  recenterTo,
  exploreMapCenter,
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
  desktopPeopleBrowseOverlay = null,
}: ExploreMapStageProps) => {
  const guestGatedActionForActivity = user ? undefined : onGuestGatedAction;
  const guestGatedActionForPlace =
    user || !onGuestGatedAction ? undefined : () => onGuestGatedAction('view_detail');

  return (
  <div className="explore-map-stage relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
    <div className="relative z-0 min-h-0 flex-1 isolate overflow-hidden">
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
          className="h-full w-full min-h-[280px]"
          showDesktopZoomControl={isDesktop}
          layoutRevision={listOpen}
        />
        </Suspense>
        </ExploreMapLoadErrorBoundary>
      </div>

      {!listOpen && !isDesktop && user ? <ExploreCoachMarks /> : null}

      {!(isDesktop && listOpen) ? (
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

      {!listOpen && isDesktop ? (
        <button
          type="button"
          onClick={onOpenBrowse}
          className={`${EXPLORE_FLOATING_CONTROL} pointer-events-auto absolute left-0 top-1/2 z-[1100] hidden -translate-y-1/2 rounded-l-none border-l-0 px-2.5 py-3 lg:inline-flex`}
          aria-label="Show activities list"
        >
          <List className="h-4 w-4" aria-hidden />
        </button>
      ) : null}

      {!listOpen ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--explore-float-base)+var(--explore-map-fab-inset))] z-[1100] flex items-end justify-between gap-3 px-4 lg:hidden">
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenBrowse}
              className={`${EXPLORE_FLOATING_CONTROL} inline-flex gap-2 px-4 py-2.5 text-sm font-semibold text-gray-900`}
            >
              <List className="h-4 w-4" aria-hidden />
              List
            </button>
          </div>
          <div
            className="pointer-events-auto flex flex-col items-center"
            style={{ gap: 'var(--explore-map-fab-stack-gap)' }}
          >
            <ExploreMapLocateButton onLocate={onLocateMe} locating={locatingDevice} />
            <ExploreMapStyleToggle style={exploreMapStyle} onToggle={onToggleMapStyle} />
            <button
              type="button"
              onClick={onPrimaryFab}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_4px_20px_rgba(5,150,105,.45)] hover:bg-emerald-700 active:scale-[0.98]"
              aria-label={primaryFabLabel}
            >
              <Plus className="h-6 w-6 shrink-0" strokeWidth={2.5} aria-hidden />
            </button>
          </div>
        </div>
      ) : null}

      <div
        className="pointer-events-none absolute right-4 z-[1100] hidden lg:flex lg:flex-col lg:items-end"
        style={{
          bottom: 'var(--explore-map-desktop-fab-bottom)',
          gap: 'var(--explore-map-fab-stack-gap)',
        }}
      >
        <ExploreMapLocateButton
          onLocate={onLocateMe}
          locating={locatingDevice}
          className={`${EXPLORE_FLOATING_CONTROL} explore-float-glyph h-11 w-11 justify-center`}
        />
        <ExploreMapStyleToggle
          style={exploreMapStyle}
          onToggle={onToggleMapStyle}
          className={`${EXPLORE_FLOATING_CONTROL} explore-float-glyph h-11 w-11 justify-center`}
        />
        <button
          type="button"
          onClick={onPrimaryFab}
          className="pointer-events-auto inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-base font-bold text-white shadow-[0_4px_20px_rgba(5,150,105,.45)] hover:bg-emerald-700 active:scale-[0.98]"
          aria-label={primaryFabLabel}
        >
          <Plus className="h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden />
          {primaryFabLabel}
        </button>
      </div>

      {selectedCard && selected && isGeographyMapSource(selected.source) ? (
        <PlaceMapPeekHost
          item={selected}
          onClose={onCloseSelection}
          onGuestGatedAction={guestGatedActionForPlace}
        />
      ) : selectedCard ? (
        <ActivityMapPeekHost
          card={selectedCard}
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

    {desktopPeopleBrowseOverlay ? (
      <div
        className="pointer-events-none absolute inset-0 z-[1200] flex justify-end"
        role="presentation"
      >
        {desktopPeopleBrowseOverlay}
      </div>
    ) : null}
  </div>
  );
};
