import { useLocation } from 'react-router-dom';
import { ExploreMapStage } from '../ui/ExploreMapStage';
import { ExploreDesktopGuestGatePanel } from '../ui/ExploreDesktopGuestGatePanel';
import { ExploreBookingSearchModal } from '../search/ExploreBookingSearchModal';
import { guestExplorePreviewCanSearch } from '../guestMapPreviewPolicy';
import {
  ACTIVITY_JOIN_CTA_SELECTOR,
  AUTH_RESUME_JOIN_QUERY,
} from '../../utils/authReturnContext';
import { resolveExploreGuestAuthReturnPath } from '../exploreGuestAuthReturn';
import { isComposeWizardRoute } from '../compose';
import { exploreMapItemIsAvailabilityCatalog } from '@uaetrail/shared-types';
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
  | 'catalogListCount'
  | 'exploreMapTiles'
  | 'mapLoading'
  | 'loadError'
  | 'reloadMap'
  | 'handleMapPinClick'
  | 'openCrewsBrowsePanel'
  | 'crewsBrowseMapChip'
  | 'joinInvitePeekBanner'
  | 'handleCloseMapSelection'
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
  catalogListCount,
  exploreMapTiles,
  mapLoading,
  loadError,
  reloadMap,
  handleMapPinClick,
  openCrewsBrowsePanel,
  crewsBrowseMapChip,
  joinInvitePeekBanner,
  handleCloseMapSelection,
  primaryFabLabel,
  handlePrimaryFabTap,
  handleOpenExploreItem,
  searchScopeCounts,
  setExploreSearchModalOpen,
  exploreSearchModalOpen,
  closeExploreSearchModal,
  handleExploreSearchCommit: _handleExploreSearchCommit,
  publishedAreas: _publishedAreas,
  handlePickExploreArea: _handlePickExploreArea,
  onVisibleMapBoundsChange,
}: Props) => {
  const location = useLocation();
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
  const composeWizardActive =
    Boolean(user) && isComposeWizardRoute(compose.composeRoute);
  const desktopGuestComposeGateOpen =
    useDesktopGuestGatePanel && compose.guestComposeSignInOpen && !composeWizardActive;
  const desktopBrowseSplit =
    isDesktop && (browse.showDesktopCatalogDrawer || browse.crewsBrowseOpen);
  const mapLayoutRevision = desktopBrowseSplit || browse.listOpen || browse.crewsBrowseOpen;

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
      catalogListCount={catalogListCount}
      projectionMode="map"
      onSelectMapView={() => {
        if (browse.listOpen) browse.closeListPanel();
      }}
      onSelectListView={browse.openMapListPanel}
      onMapFilterChange={browse.applyMapFilter}
      onActivityDatePresetChange={browse.applyActivityDatePreset}
      onVenueRegionsChange={browse.applyVenueRegions}
      geoPath={browse.geoPath}
      onClearGeoScope={() => browse.applyGeoPath([])}
      onPopGeoScope={
        browse.geoPath.length > 1
          ? () => browse.applyGeoPath(browse.geoPath.slice(0, -1))
          : undefined
      }
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
      onOpenCrewsBrowsePanel={
        user ? openCrewsBrowsePanel : () => selection.handleGuestGatedAction('view_detail')
      }
      crewsBrowseMapAvatars={user ? crewsBrowseMapChip?.avatars ?? [] : []}
      crewsBrowseMapFriendCount={crewsBrowseMapChip?.friendCount ?? 0}
      crewsBrowseMapGuest={!user}
      crewsBrowseMapCrewCount={crewsBrowseMapChip?.crewCount ?? 0}
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
        browse.crewsBrowseOpen
          ? mapPins.filter((pin) =>
              exploreMapItemIsAvailabilityCatalog({
                source: pin.source,
                id: pin.id,
                activityMode:
                  pin.activityMode === 'hosted' ? 'hosted' : null,
              })
            )
          : mapPins
      }
      crewsBrowseMap={browse.crewsBrowseOpen}
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
      onOfferRideshare={
        selection.showAvailabilityPeekOfferRideshare
          ? selection.handleOfferRideshareForAvailability
          : undefined
      }
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
          <ExploreBookingSearchModal
            open
            overlayContained
            onClose={closeExploreSearchModal}
            scopeCounts={searchScopeCounts}
            signedIn={Boolean(user)}
            onGuestBlocked={() => selection.handleGuestPreviewLimitGate()}
          />
        ) : null
      }
    />
  );
};
