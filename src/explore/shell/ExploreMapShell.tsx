import { ExploreMapStage } from '../ui/ExploreMapStage';
import { PeopleBrowsePanel } from '@/people-discovery/panel/PeopleBrowsePanel';
import type { useExploreExperienceModel } from './useExploreExperienceModel';

type Model = ReturnType<typeof useExploreExperienceModel>;

type Props = Pick<
  Model,
  | 'user'
  | 'tenantId'
  | 'isDesktop'
  | 'browse'
  | 'compose'
  | 'selection'
  | 'selectedId'
  | 'highlightedExploreItemId'
  | 'viewport'
  | 'mapPins'
  | 'exploreMapTiles'
  | 'mapLoading'
  | 'loadError'
  | 'reloadMap'
  | 'handleMapPinClick'
  | 'openPeopleBrowsePanel'
  | 'peopleBrowseMapChip'
  | 'joinInvitePeekBanner'
  | 'handleCloseMapSelection'
  | 'handleOfferRideshareForSeeking'
  | 'primaryFabLabel'
  | 'handleOpenExploreItem'
  | 'searchScopeCounts'
  | 'setExploreSearchModalOpen'
  | 'onVisibleMapBoundsChange'
  | 'peopleBrowsePanelProps'
>;

/** Map stage: filters chrome, pins, peek sheet (R2). */
export const ExploreMapShell = ({
  user,
  tenantId,
  isDesktop,
  browse,
  compose,
  selection,
  selectedId,
  highlightedExploreItemId,
  viewport,
  mapPins,
  exploreMapTiles,
  mapLoading,
  loadError,
  reloadMap,
  handleMapPinClick,
  openPeopleBrowsePanel,
  peopleBrowseMapChip,
  joinInvitePeekBanner,
  handleCloseMapSelection,
  handleOfferRideshareForSeeking,
  primaryFabLabel,
  handleOpenExploreItem,
  searchScopeCounts,
  setExploreSearchModalOpen,
  onVisibleMapBoundsChange,
  peopleBrowsePanelProps,
}: Props) => (
  <ExploreMapStage
    isDesktop={isDesktop}
    listOpen={browse.listOpen}
    panel={browse.panel}
    mapFilter={browse.mapFilter}
    venueRegions={browse.venueRegions}
    activityDatePreset={browse.activityDatePreset}
    onBrowsePanelChange={(next) => browse.applyBrowsePanel(next)}
    onMapFilterChange={browse.applyMapFilter}
    onActivityDatePresetChange={browse.applyActivityDatePreset}
    onVenueRegionsChange={browse.applyVenueRegions}
    onOpenPeopleBrowsePanel={openPeopleBrowsePanel}
    peopleBrowsePanelAvatars={peopleBrowseMapChip.avatars}
    peopleBrowsePanelFriendCount={peopleBrowseMapChip.friendCount}
    searchQuery={browse.query}
    onSearchQueryChange={browse.setQuery}
    onOpenExploreSearch={() => setExploreSearchModalOpen(true)}
    searchScopeCounts={searchScopeCounts}
    exploreMapStyle={viewport.exploreMapStyle}
    exploreMapTiles={exploreMapTiles}
    onToggleMapStyle={viewport.toggleExploreMapStyle}
    mapPins={mapPins}
    selectedId={selectedId}
    highlightedExploreItemId={highlightedExploreItemId}
    recenterTo={viewport.recenterTo}
    exploreMapCenter={viewport.exploreMapCenter}
    onPinClick={handleMapPinClick}
    onVisibleBoundsChange={onVisibleMapBoundsChange}
    loading={mapLoading}
    loadError={loadError}
    onReloadMap={reloadMap}
    venueNotice={selection.venueNotice}
    onDismissVenueNotice={() => selection.setVenueNotice(null)}
    exploreNotice={selection.exploreNotice}
    onDismissExploreNotice={() => selection.setExploreNotice(null)}
    user={user}
    locationPromptOpen={viewport.locationPromptOpen}
    locatingDevice={viewport.locatingDevice}
    onAllowMapLocation={viewport.handleAllowMapLocation}
    onDismissLocationPrompt={viewport.dismissLocationPromptUi}
    onOpenBrowse={browse.openMapListPanel}
    onPrimaryFab={compose.handleCreateTap}
    primaryFabLabel={primaryFabLabel}
    selected={selection.selected}
    selectedCard={selection.selectedCard}
    joinUiState={selection.peekJoinUiState}
    joinStateLoading={selection.peekJoinStateLoading}
    onCloseSelection={handleCloseMapSelection}
    joinInvitePeekBanner={joinInvitePeekBanner}
    onJoin={selection.handleJoin}
    onMessage={selection.handlePeekOrganizerMessage}
    onActivityMapPeekAction={selection.handleActivityMapPeekAction}
    onOfferTransport={selection.handleOfferTransport}
    activityPeekSkipsJoinContext={selection.activityPeekSkipsJoinContext}
    linkRideshareTenantId={tenantId}
    onOpenExploreItem={handleOpenExploreItem}
    onWithdraw={() => selection.joinActions.setShowWithdraw(true)}
    onGuestGatedAction={selection.handleGuestGatedAction}
    desktopPeopleBrowseOverlay={
      isDesktop && browse.peopleBrowseOpen ? (
        <aside
          className="pointer-events-auto flex h-full min-h-0 w-[min(400px,32vw)] max-w-full shrink-0 flex-col overflow-hidden border-l border-neutral-200 bg-white px-5 py-4 shadow-[-12px_0_32px_rgba(15,23,42,0.08)]"
          aria-label="Find crew"
        >
          <PeopleBrowsePanel
            {...peopleBrowsePanelProps}
            onClose={browse.closePeopleBrowsePanel}
            closePanelAriaLabel="Close Find crew"
            closeButtonVariant="dismiss"
          />
        </aside>
      ) : null
    }
  />
);
