import { useLocation, useNavigate } from 'react-router-dom';
import { exploreMapMobileBackState } from '../../utils/mobileBackNav';
import { listPeopleDiscoveryPath } from '../../list/routing';
import { ExploreMapStage } from '../ui/ExploreMapStage';
import { ExploreDesktopGuestGatePanel } from '../ui/ExploreDesktopGuestGatePanel';
import { ExploreBrowseSearchModal } from '../ui/ExploreBrowseSearchModal';
import { guestExplorePreviewCanSearch } from '../guestMapPreviewPolicy';
import {
  ACTIVITY_JOIN_CTA_SELECTOR,
  AUTH_RESUME_JOIN_QUERY,
} from '../../utils/authReturnContext';
import { resolveExploreGuestAuthReturnPath } from '../exploreGuestAuthReturn';
import type { useExploreExperienceModel } from './useExploreExperienceModel';

type Model = ReturnType<typeof useExploreExperienceModel>;

type Props = Pick<
  Model,
  | 'user'
  | 'tenantId'
  | 'isDesktop'
  | 'useDesktopGuestGatePanel'
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
  | 'handlePrimaryFabTap'
  | 'handleOpenExploreItem'
  | 'searchScopeCounts'
  | 'setExploreSearchModalOpen'
  | 'exploreSearchModalOpen'
  | 'closeExploreSearchModal'
  | 'handleExploreSearchCommit'
  | 'publishedAreas'
  | 'handlePickExploreArea'
  | 'onVisibleMapBoundsChange'
>;

/** Map stage: filters chrome, pins, peek sheet (R2). */
export const ExploreMapShell = ({
  user,
  tenantId,
  isDesktop,
  useDesktopGuestGatePanel,
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
  handleOfferRideshareForSeeking: _handleOfferRideshareForSeeking,
  primaryFabLabel,
  handlePrimaryFabTap,
  handleOpenExploreItem,
  searchScopeCounts,
  setExploreSearchModalOpen,
  exploreSearchModalOpen,
  closeExploreSearchModal,
  handleExploreSearchCommit,
  publishedAreas,
  handlePickExploreArea,
  onVisibleMapBoundsChange,
}: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const joinActions = selection.joinActions;
  const browseReturnPath = `${location.pathname}${location.search}`;
  const guestAuthReturnPath = resolveExploreGuestAuthReturnPath({
    guestSheetSurface: joinActions.guestSheetSurface,
    guestSheetIntent: joinActions.guestSheetIntent,
    pendingPeekAction: joinActions.guestPendingPeekAction,
    activity: selection.selected?.activity ?? null,
    browseReturnPath,
  });

  const desktopGuestJoinGateOpen = useDesktopGuestGatePanel && joinActions.guestSheetOpen;
  const desktopGuestComposeGateOpen = useDesktopGuestGatePanel && compose.guestComposeSignInOpen;
  const desktopBrowseSplit =
    isDesktop && (browse.showDesktopCatalogDrawer || browse.peopleBrowseOpen);
  const mapLayoutRevision = desktopBrowseSplit || browse.listOpen || browse.peopleBrowseOpen;

  let desktopRightPanelOverlay = null;
  if (desktopGuestComposeGateOpen) {
    desktopRightPanelOverlay = (
      <ExploreDesktopGuestGatePanel
        feature="post-on-map"
        onClose={compose.closeGuestComposeSignIn}
        authReturnPath={compose.guestComposeSignInReturnPath ?? undefined}
        ariaLabel="Sign up to post on the map"
      />
    );
  } else if (desktopGuestJoinGateOpen) {
    const browseGateIntent =
      joinActions.guestSheetSurface === 'browse' ? joinActions.guestBrowseGateIntent : null;
    desktopRightPanelOverlay = (
      <ExploreDesktopGuestGatePanel
        intent={browseGateIntent ?? 'join-activity'}
        onClose={joinActions.closeGuestSheet}
        authReturnPath={guestAuthReturnPath}
        authFocusSelector={
          guestAuthReturnPath?.includes(`${AUTH_RESUME_JOIN_QUERY}=1`)
            ? ACTIVITY_JOIN_CTA_SELECTOR
            : undefined
        }
      />
    );
  }

  return (
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
      venueFilter={browse.venueFilter}
      onVenueFilterChange={browse.applyVenueFilter}
      tripMapTopics={browse.tripMapTopics}
      placeMapTopics={browse.placeMapTopics}
      priceFilter={browse.priceFilter}
      hasTrip={browse.hasTrip}
      facilityKinds={browse.facilityKinds}
      onTripTopicsChange={browse.applyTripMapTopics}
      onPlaceTopicsChange={browse.applyPlaceMapTopics}
      onPriceFilterChange={browse.applyPriceFilter}
      onHasTripChange={browse.applyHasTrip}
      onFacilityKindsChange={browse.applyFacilityKinds}
      onVenueFiltersChange={browse.applyVenueFilters}
      onOpenCrewsPage={() => {
        handleCloseMapSelection();
        navigate(listPeopleDiscoveryPath(), {
          state: exploreMapMobileBackState(browseReturnPath),
        });
      }}
      onOpenPeopleBrowsePanel={
        user ? openPeopleBrowsePanel : () => selection.handleGuestGatedAction('view_detail')
      }
      peopleBrowsePanelAvatars={user ? peopleBrowseMapChip?.avatars ?? [] : []}
      peopleBrowsePanelFriendCount={peopleBrowseMapChip?.friendCount ?? 0}
      peopleBrowseGuest={!user}
      peopleBrowsePossibleCrewCount={peopleBrowseMapChip?.crewCount ?? 0}
      searchQuery={browse.query}
      onSearchQueryChange={browse.setQuery}
      onOpenExploreSearch={() => {
        if (!user && !guestExplorePreviewCanSearch()) {
          selection.handleGuestPreviewLimitGate();
          return;
        }
        setExploreSearchModalOpen(true);
      }}
      searchScopeCounts={searchScopeCounts}
      exploreMapStyle={viewport.exploreMapStyle}
      exploreMapTiles={exploreMapTiles}
      onToggleMapStyle={viewport.toggleExploreMapStyle}
      onLocateMe={viewport.handleLocateMe}
      mapPins={
        browse.peopleBrowseOpen ? mapPins.filter((pin) => pin.activityMode === 'seeking') : mapPins
      }
      peopleMap={browse.peopleBrowseOpen}
      mapLayoutRevision={mapLayoutRevision}
      selectedId={selectedId}
      highlightedExploreItemId={highlightedExploreItemId}
      recenterTo={viewport.recenterTo}
      exploreMapCenter={viewport.exploreMapCenter}
      deviceLocation={viewport.deviceLocationPointer}
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
      onPrimaryFab={handlePrimaryFabTap}
      primaryFabLabel={primaryFabLabel}
      selected={selection.selected}
      selectedCard={selection.selectedCard}
      joinUiState={selection.peekJoinUiState}
      joinStateLoading={selection.peekJoinStateLoading}
      onCloseSelection={handleCloseMapSelection}
      joinInvitePeekBanner={joinInvitePeekBanner}
      onJoin={selection.handleJoin}
      onMessage={selection.handlePeekHostMessage}
      onActivityMapPeekAction={selection.handleActivityMapPeekAction}
      onOfferTransport={selection.handleOfferTransport}
      activityPeekSkipsJoinContext={selection.activityPeekSkipsJoinContext}
      linkRideshareTenantId={tenantId}
      onOpenExploreItem={handleOpenExploreItem}
      onWithdraw={() => selection.joinActions.setShowWithdraw(true)}
      onGuestGatedAction={selection.handleGuestGatedAction}
      onShareActivity={selection.handleSharePeek}
      desktopRightPanelOverlay={desktopRightPanelOverlay}
      mapSearchOpen={exploreSearchModalOpen}
      mapSearchOverlay={
        exploreSearchModalOpen ? (
          <ExploreBrowseSearchModal
            open
            onClose={closeExploreSearchModal}
            query={browse.query}
            onQueryChange={browse.setQuery}
            onCommit={handleExploreSearchCommit}
            scopeCounts={searchScopeCounts}
            publishedAreas={publishedAreas}
            onPickArea={handlePickExploreArea}
            signedIn={Boolean(user)}
          />
        ) : null
      }
    />
  );
};
