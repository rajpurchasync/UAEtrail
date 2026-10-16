import { PageMeta } from '../../components/seo/PageMeta';
import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import { ExploreExperienceBrowsePanels } from '../shell/ExploreExperienceBrowsePanels';
import { ExploreExperienceOverlays } from '../shell/ExploreExperienceOverlays';
import { ExploreMapShell } from '../shell/ExploreMapShell';
import { useExploreExperienceModel } from '../shell/useExploreExperienceModel';

export const ExploreExperience = () => {
  const model = useExploreExperienceModel();

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <PageMeta
        title={
          model.myTripsMode
            ? 'Your plan on the map'
            : 'Explore hiking, camping, events & shops'
        }
        description={
          model.myTripsMode
            ? 'See your upcoming outings on the UAE Trail map.'
            : 'Find live hiking, camping, events, and shops on the map across the UAE.'
        }
        path={EXPLORE_MAP_PATH}
      />

      <div className="relative flex h-full min-h-0 flex-1 max-lg:flex-col lg:flex-row lg:items-stretch">
        <ExploreExperienceBrowsePanels
          isDesktop={model.isDesktop}
          browse={model.browse}
          browsePanelShared={model.browsePanelShared}
          listItems={model.listItems}
          mapItems={model.mapItems}
          peopleBrowsePanelProps={model.peopleBrowsePanelProps}
          mapStage={
            <ExploreMapShell
              user={model.user}
              tenantId={model.tenantId}
              isDesktop={model.isDesktop}
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
              openPeopleBrowsePanel={model.openPeopleBrowsePanel}
              peopleBrowseMapChip={model.peopleBrowseMapChip}
              joinInvitePeekBanner={model.joinInvitePeekBanner}
              handleCloseMapSelection={model.handleCloseMapSelection}
              handleOfferRideshareForDemand={model.handleOfferRideshareForDemand}
              primaryFabLabel={model.primaryFabLabel}
              handleOpenExploreItem={model.handleOpenExploreItem}
              searchScopeCounts={model.searchScopeCounts}
              setExploreSearchModalOpen={model.setExploreSearchModalOpen}
              onVisibleMapBoundsChange={model.onVisibleMapBoundsChange}
              peopleBrowsePanelProps={model.peopleBrowsePanelProps}
            />
          }
        />
      </div>

      <ExploreExperienceOverlays
        compose={model.compose}
        selection={model.selection}
        hostWizardOpen={model.hostWizardOpen}
        hostingWizardPrefill={model.hostingWizardPrefill}
        pathname={model.pathname}
        search={model.search}
        signInHref={model.signInHref}
        planWithBuddyUserId={model.planWithBuddyUserId}
        composeAreaSlug={model.areaSlug}
        hostRemoveParticipantNotice={model.hostRemoveParticipantNotice}
        rideshareLinkParent={model.rideshareLinkParent}
        rideshareLinkDemand={model.rideshareLinkDemand}
        onCloseCreateFlow={model.closeCreateFlow}
        onPlanHostingBackToIntent={model.onPlanHostingBackToIntent}
        onActivityPublished={model.selection.handleActivityPublished}
        onCreateLinkedRideshare={model.handleCreateLinkedRideshare}
        onOpenHostApplication={model.onOpenHostApplication}
        onRefreshHostGate={model.refreshHostGate}
        setRideshareLinkParent={model.setRideshareLinkParent}
        setRideshareLinkDemand={model.setRideshareLinkDemand}
        exploreSearchModalOpen={model.exploreSearchModalOpen}
        onCloseExploreSearchModal={() => model.setExploreSearchModalOpen(false)}
        browseQuery={model.browse.query}
        onBrowseQueryChange={model.browse.setQuery}
        onExploreSearchCommit={model.handleExploreSearchCommit}
        searchScopeCounts={model.searchScopeCounts}
        publishedAreas={model.publishedAreas}
        onPickExploreArea={model.handlePickExploreArea}
        inviteShareSheet={model.inviteShareSheet}
        hostManageSheet={model.hostManageSheet}
        tenantId={model.tenantId}
      />
    </div>
  );
};
