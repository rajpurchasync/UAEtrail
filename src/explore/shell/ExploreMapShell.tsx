import { ExploreMapStage } from '../ui/ExploreMapStage';
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
  | 'handleOfferRideshareForDemand'
  | 'primaryFabLabel'
  | 'handleOpenExploreItem'
  | 'searchScopeCounts'
  | 'setExploreSearchModalOpen'
  | 'onVisibleMapBoundsChange'
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
  handleOfferRideshareForDemand,
  primaryFabLabel,
  handleOpenExploreItem,
  searchScopeCounts,
  setExploreSearchModalOpen,
  onVisibleMapBoundsChange,
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
    highlightedExploreItemId={null}
    recenterTo={viewport.recenterTo}
    exploreMapCenter={viewport.exploreMapCenter}
    onPinClick={handleMapPinClick}
    onVisibleBoundsChange={onVisibleMapBoundsChange}
    loading={mapLoading}
    loadError={loadError}
    onReloadMap={reloadMap}
    venueNotice={selection.venueNotice}
    onDismissVenueNotice={() => selection.setVenueNotice(null)}
    demandNotice={selection.demandNotice}
    onDismissDemandNotice={() => selection.setDemandNotice(null)}
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
    onMessage={selection.handleDemandMessage}
    onActivityMapPeekAction={selection.handleActivityMapPeekAction}
    onOfferTransport={selection.handleOfferTransport}
    activityPeekSkipsJoinContext={selection.activityPeekSkipsJoinContext}
    linkRideshareTenantId={tenantId}
    onDemandRemove={
      selection.selectedCard?.showDemandOwnerActions ? selection.requestDemandRemove : undefined
    }
    onDemandFullManage={
      selection.selectedCard?.showDemandOwnerActions ? selection.handleDemandManage : undefined
    }
    onDemandLinkRideshare={
      selection.selectedCard?.showDemandLinkRideshare ? handleOfferRideshareForDemand : undefined
    }
    onOpenExploreItem={handleOpenExploreItem}
    onWithdraw={() => selection.joinActions.setShowWithdraw(true)}
    onGuestGatedAction={selection.handleGuestGatedAction}
  />
);
