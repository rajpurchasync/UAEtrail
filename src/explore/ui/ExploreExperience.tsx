import { PageMeta } from '../../components/seo/PageMeta';
import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import '../../styles/explore-map-chrome.css';
import { ExploreExperienceBrowsePanels } from '../shell/ExploreExperienceBrowsePanels';
import { ExploreExperienceOverlays } from '../shell/ExploreExperienceOverlays';
import { ExploreMapShell } from '../shell/ExploreMapShell';
import { useBindExploreListMapHover, useBindExploreMapClosePeek } from '../ExploreMapChromeContext';
import { useExploreExperienceModel } from '../shell/useExploreExperienceModel';

export const ExploreExperience = () => {
  const model = useExploreExperienceModel();
  useBindExploreMapClosePeek(model.handleCloseMapSelection);
  useBindExploreListMapHover(model.setHighlightedExploreItemId);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <PageMeta
        title={
          model.myPlanMapMode
            ? 'Your plan on the map'
            : 'Explore hiking, camping, events & shops'
        }
        description={
          model.myPlanMapMode
            ? 'See your upcoming outings on the UAE Trail map.'
            : 'Find live hiking, camping, events, and shops on the map across the UAE.'
        }
        path={EXPLORE_MAP_PATH}
      />

      <div className="relative flex h-full min-h-0 flex-1 max-lg:flex-col lg:flex-row lg:items-stretch">
        <ExploreExperienceBrowsePanels
          isDesktop={model.isDesktop}
          browse={model.browse}
          peopleBrowsePanelProps={model.peopleBrowsePanelProps}
          prefetchedCatalogItems={model.mapItems}
          mapStage={
            <ExploreMapShell
              user={model.user}
              tenantId={model.tenantId}
              isDesktop={model.isDesktop}
              useDesktopGuestGatePanel={model.useDesktopGuestGatePanel}
              browse={model.browse}
              compose={model.compose}
              selection={model.selection}
              selectedId={model.selectedId}
              highlightedExploreItemId={model.highlightedExploreItemId}
              viewport={model.viewport}
              mapPins={model.mapPins}
              exploreMapTiles={model.exploreMapTiles}
              mapLoading={model.mapLoading}
              loadError={model.loadError}
              reloadMap={model.reloadMap}
              handleMapPinClick={model.handleMapPinClick}
              joinInvitePeekBanner={model.joinInvitePeekBanner}
              handleCloseMapSelection={model.handleCloseMapSelection}
              handleOfferRideshareForSeeking={model.handleOfferRideshareForSeeking}
              primaryFabLabel={model.primaryFabLabel}
              handleOpenExploreItem={model.handleOpenExploreItem}
              searchScopeCounts={model.searchScopeCounts}
              setExploreSearchModalOpen={model.setExploreSearchModalOpen}
              exploreSearchModalOpen={model.exploreSearchModalOpen}
              closeExploreSearchModal={model.closeExploreSearchModal}
              handleExploreSearchCommit={model.handleExploreSearchCommit}
              publishedAreas={model.publishedAreas}
              handlePickExploreArea={model.handlePickExploreArea}
              onVisibleMapBoundsChange={model.onVisibleMapBoundsChange}
              peopleBrowsePanelProps={model.peopleBrowsePanelProps}
            />
          }
        />
      </div>

      <ExploreExperienceOverlays
        compose={model.compose}
        selection={model.selection}
        user={model.user}
        hostWizardOpen={model.hostWizardOpen}
        hostingWizardPrefill={model.hostingWizardPrefill}
        pathname={model.pathname}
        search={model.search}
        signInHref={model.signInHref}
        planWithBuddyUserId={model.planWithBuddyUserId}
        composeAreaSlug={model.areaSlug}
        hostRemoveParticipantNotice={model.hostRemoveParticipantNotice}
        rideshareLinkParent={model.rideshareLinkParent}
        rideshareLinkSeeking={model.rideshareLinkSeeking}
        onCloseCreateFlow={model.closeCreateFlow}
        onHostingBackToIntent={model.onHostingBackToIntent}
        onActivityPublished={model.selection.handleActivityPublished}
        onCreateLinkedRideshare={model.handleCreateLinkedRideshare}
        onOpenHostApplication={model.onOpenHostApplication}
        onRefreshHostGate={model.refreshHostGate}
        setRideshareLinkParent={model.setRideshareLinkParent}
        setRideshareLinkSeeking={model.setRideshareLinkSeeking}
        hostManageSheet={model.hostManageSheet}
        tenantId={model.tenantId}
        useDesktopGuestGatePanel={model.useDesktopGuestGatePanel}
      />
    </div>
  );
};
