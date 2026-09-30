import { lazy, Suspense, type ReactNode } from 'react';
import { List, LocateFixed, Plus } from 'lucide-react';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { PlaceMapPin } from '../../components/ui/PlacesMap';
import { getMapBounds } from '../../config/regions';
import { MAP_CONFIG, getExploreMapTiles, type ExploreMapStyle } from '../../config/platform';
import {
  EXPLORE_FLOATING_CONTROL,
  EXPLORE_SHEET,
  EXPLORE_Z,
} from '../../config/exploreTheme';
import type { ExploreCardModel } from '../exploreCardModel';
import type { JoinRequestUiState } from '../../utils/joinRequestUi';
import { ExploreCoachMarks } from './ExploreCoachMarks';
import { ExploreDismissibleNotice } from './ExploreDismissibleNotice';
import { ExploreGuestJoinBanner } from './ExploreGuestJoinBanner';
import { ExploreItemSheet } from './ExploreItemSheet';
import { ExploreMapFilterBar } from './ExploreMapFilterBar';
import { ExploreMapLoadingSkeleton } from './ExploreMapLoadingSkeleton';
import { ExploreMapLocationPrompt } from './ExploreMapLocationPrompt';
import { ExploreMapStyleToggle } from './ExploreMapStyleToggle';
import { ExplorePlaceMapPreview } from './ExplorePlaceMapPreview';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import type { ExploreActivityDatePreset, MapFilterKey } from '../routing';

type ExploreMapTiles = ReturnType<typeof getExploreMapTiles>;

const PlacesMap = lazy(() =>
  import('../../components/ui/PlacesMap').then((m) => ({ default: m.PlacesMap }))
);

export type ExploreMapStageProps = {
  isDesktop: boolean;
  listOpen: boolean;
  showListPanel: boolean;
  mapFilter: MapFilterKey;
  browseFilterKeys?: MapFilterKey[];
  placesMode?: boolean;
  onMapFilterChange: (next: MapFilterKey) => void;
  activityDatePreset: ExploreActivityDatePreset;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  venueRegions?: string[];
  onVenueRegionsChange?: (regions: string[]) => void;
  exploreMapStyle: ExploreMapStyle;
  exploreMapTiles: ExploreMapTiles;
  onToggleMapStyle: () => void;
  mapPins: PlaceMapPin[];
  selectedId: string | null;
  recenterTo: { lat: number; lng: number } | null;
  exploreMapCenter: { lat: number; lng: number };
  onPinClick: (pin: PlaceMapPin) => void;
  loading: boolean;
  loadError: string | null;
  onReloadMap: () => void;
  venueNotice: string | null;
  onDismissVenueNotice: () => void;
  demandNotice: string | null;
  onDismissDemandNotice: () => void;
  user: { id: string } | null;
  locationPromptOpen: boolean;
  locatingDevice: boolean;
  onAllowMapLocation: () => void;
  onDismissLocationPrompt: () => void;
  onOpenBrowse: () => void;
  onLocateMe: () => void;
  onPrimaryFab: () => void;
  primaryFabLabel: string;
  selected: ExploreMapItemDTO | null;
  selectedCard: ExploreCardModel | null;
  joinUiState: JoinRequestUiState | undefined;
  joinStateLoading: boolean;
  canFulfillParticipantIntent: boolean;
  onCloseSelection: () => void;
  onJoin: () => void;
  onMessage: () => void;
  onFulfillIntent?: () => void;
  onManage?: () => void;
  onWithdraw: () => void;
  showCarpoolLink?: boolean;
  onLinkCarpool?: () => void;
  carpoolLinkLoading?: boolean;
  onCloseMobileBrowse: () => void;
  mobileBrowseSheet: ReactNode;
};

export const ExploreMapStage = ({
  isDesktop,
  listOpen,
  showListPanel,
  mapFilter,
  browseFilterKeys,
  placesMode = false,
  onMapFilterChange,
  activityDatePreset,
  onActivityDatePresetChange,
  venueRegions = [],
  onVenueRegionsChange,
  exploreMapStyle,
  exploreMapTiles,
  onToggleMapStyle,
  mapPins,
  selectedId,
  recenterTo,
  exploreMapCenter,
  onPinClick,
  loading,
  loadError,
  onReloadMap,
  venueNotice,
  onDismissVenueNotice,
  demandNotice,
  onDismissDemandNotice,
  user,
  locationPromptOpen,
  locatingDevice,
  onAllowMapLocation,
  onDismissLocationPrompt,
  onOpenBrowse,
  onLocateMe,
  onPrimaryFab,
  primaryFabLabel,
  selected,
  selectedCard,
  joinUiState,
  joinStateLoading,
  canFulfillParticipantIntent,
  onCloseSelection,
  onJoin,
  onMessage,
  onFulfillIntent,
  onManage,
  onWithdraw,
  showCarpoolLink = false,
  onLinkCarpool,
  carpoolLinkLoading = false,
  onCloseMobileBrowse,
  mobileBrowseSheet,
}: ExploreMapStageProps) => (
  <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
    <div className="relative min-h-0 flex-1">
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-[#eef2f6]" />}>
          <PlacesMap
            key={exploreMapStyle}
            pins={mapPins}
            bounds={getMapBounds()}
            fill
            allowEmpty
            exploreMode
            showLegend={false}
            selectedExploreItemId={selectedId ?? undefined}
            tileUrl={exploreMapTiles.tileUrl}
            tileAttribution={MAP_CONFIG.exploreTileAttribution}
            labelTileUrl={exploreMapTiles.labelTileUrl}
            onPinClick={onPinClick}
            recenterTo={recenterTo}
            exploreMapCenter={exploreMapCenter}
            className="h-full w-full"
            minHeight={0}
          />
        </Suspense>
      </div>

      <ExploreGuestJoinBanner />
      {!listOpen && !isDesktop ? <ExploreCoachMarks /> : null}

      {(!listOpen || isDesktop) && (
        <ExploreMapFilterBar
          mapFilter={mapFilter}
          onFilterChange={onMapFilterChange}
          activityDatePreset={activityDatePreset}
          onActivityDatePresetChange={onActivityDatePresetChange}
          allowedKeys={browseFilterKeys}
          filterEmojiContext={placesMode ? 'venue' : 'activity'}
          showDateFilter={!placesMode}
          showStateFilter={placesMode}
          venueRegions={venueRegions}
          onVenueRegionsChange={onVenueRegionsChange}
        />
      )}

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

      {demandNotice ? (
        <ExploreDismissibleNotice message={demandNotice} onDismiss={onDismissDemandNotice} />
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

      {loading ? <ExploreMapLoadingSkeleton /> : null}

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
        <div className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--explore-float-base)+0.75rem)] z-[1100] flex items-end justify-between gap-3 px-4 lg:hidden">
          <button
            type="button"
            onClick={onOpenBrowse}
            className={`${EXPLORE_FLOATING_CONTROL} pointer-events-auto inline-flex gap-2 px-4 py-2.5 text-sm font-semibold text-gray-900`}
          >
            <List className="h-4 w-4" aria-hidden />
            List
          </button>
          <div className="pointer-events-auto flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={onLocateMe}
              disabled={locatingDevice}
              className={`${EXPLORE_FLOATING_CONTROL} inline-flex h-11 w-11 items-center justify-center text-emerald-700 disabled:opacity-60`}
              aria-label="Center map on my location"
            >
              <LocateFixed className="h-5 w-5" strokeWidth={2.25} />
            </button>
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

      <div className="pointer-events-none absolute bottom-6 right-4 z-[1100] hidden lg:flex lg:flex-col lg:items-center lg:gap-3">
        <button
          type="button"
          onClick={onLocateMe}
          disabled={locatingDevice}
          className={`${EXPLORE_FLOATING_CONTROL} pointer-events-auto inline-flex h-11 w-11 items-center justify-center text-emerald-700 disabled:opacity-60`}
          aria-label="Center map on my location"
        >
          <LocateFixed className="h-5 w-5" strokeWidth={2.25} />
        </button>
        <ExploreMapStyleToggle style={exploreMapStyle} onToggle={onToggleMapStyle} />
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

      {selectedCard && selected?.source === 'venue' && selected ? (
        <ExplorePlaceMapPreview
          item={selected}
          onClose={onCloseSelection}
        />
      ) : selectedCard ? (
        <ExploreItemSheet
          card={selectedCard}
          onClose={onCloseSelection}
          onJoin={onJoin}
          onMessage={onMessage}
          onFulfillIntent={canFulfillParticipantIntent ? onFulfillIntent : undefined}
          onManage={onManage}
          showCarpoolLink={showCarpoolLink}
          onLinkCarpool={onLinkCarpool}
          carpoolLinkLoading={carpoolLinkLoading}
          joinUiState={selectedCard.showHostActions ? undefined : joinUiState}
          onWithdraw={onWithdraw}
          joinStateLoading={joinStateLoading}
        />
      ) : null}
    </div>

    {showListPanel && !isDesktop ? (
      <ExploreResponsiveSheet
        open
        onClose={onCloseMobileBrowse}
        zClass={EXPLORE_Z.browseSheet}
        maxWidthClass="lg:max-w-lg"
        showHandle={false}
        panelClassName={`${EXPLORE_SHEET.browseHeight} px-4 pt-2 lg:px-5 lg:pt-3`}
      >
        {mobileBrowseSheet}
      </ExploreResponsiveSheet>
    ) : null}
  </div>
);
