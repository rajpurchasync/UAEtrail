import { lazy, Suspense } from 'react';
import { CrewsBrowsePanel } from '@/crew-discovery/panel/CrewsBrowsePanel';
import { EXPLORE_CREWS_PANEL_TITLE } from '../../content/exploreCrewsCopy';
import { ExploreDesktopDockedPanelRail } from '../ui/ExploreDesktopDockedPanelRail';
import { ExploreDesktopListDrawer } from '../ui/ExploreDesktopListDrawer';
import { ExploreMobileBrowseOverlay } from '../ui/ExploreMobileBrowseOverlay';
import type { ComponentProps, ReactNode } from 'react';

const ListDiscoveryExperience = lazy(() =>
  import('../../discovery/discoverySessionListExperience').then((module) => ({
    default: module.ListDiscoveryExperience,
  }))
);

type CrewsBrowsePanelComponentProps = ComponentProps<typeof CrewsBrowsePanel>;

type Props = {
  isDesktop: boolean;
  browse: {
    showListPanel: boolean;
    showDesktopCatalogDrawer: boolean;
    listMode: string;
    crewsBrowseOpen: boolean;
    closeListPanel: () => void;
    closeCrewsBrowsePanel: () => void;
  };
  crewsBrowsePanelProps: CrewsBrowsePanelComponentProps;
  mapStage: ReactNode;
  prefetchedCatalogItems?: import('@uaetrail/shared-types').ExploreMapItemDTO[];
};

/** Map stage plus desktop catalog drawer and mobile Crews sheet. */
export const ExploreExperienceBrowsePanels = ({
  isDesktop,
  browse,
  crewsBrowsePanelProps,
  mapStage,
  prefetchedCatalogItems,
}: Props) => {
  const crewsMobileSheet = browse.showListPanel && !isDesktop && browse.listMode === 'crews';
  const desktopCatalog = isDesktop && browse.showDesktopCatalogDrawer;
  const desktopCrewsBrowseRail = isDesktop && browse.crewsBrowseOpen;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 max-lg:flex-col lg:flex-row lg:items-stretch overflow-hidden">
      {desktopCrewsBrowseRail ? (
        <ExploreDesktopDockedPanelRail ariaLabel="Crews">
          <CrewsBrowsePanel
            {...crewsBrowsePanelProps}
            onClose={browse.closeCrewsBrowsePanel}
            closePanelAriaLabel="Close Crews"
            closeButtonVariant="dismiss"
          />
        </ExploreDesktopDockedPanelRail>
      ) : null}
      {desktopCatalog ? (
        <ExploreDesktopListDrawer onClose={browse.closeListPanel}>
          <Suspense fallback={<div className="h-full min-h-0 flex-1 bg-white dark:bg-neutral-950" aria-hidden />}>
            <ListDiscoveryExperience
              surface="exploreSidebar"
              onCloseMapOverlay={browse.closeListPanel}
              prefetchedCatalogItems={prefetchedCatalogItems}
              onOfferRideshareForAvailabilityItem={
                crewsBrowsePanelProps.onOfferRideshareForAvailabilityItem
              }
            />
          </Suspense>
        </ExploreDesktopListDrawer>
      ) : null}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{mapStage}</div>
      {crewsMobileSheet ? (
        <ExploreMobileBrowseOverlay
          open
          onClose={browse.closeListPanel}
          sheetSize="full"
          immersive
          immersiveTitle={EXPLORE_CREWS_PANEL_TITLE}
          onExitImmersive={browse.closeListPanel}
          immersiveBackLabel="Back"
        >
          <CrewsBrowsePanel
            {...crewsBrowsePanelProps}
            onClose={browse.closeListPanel}
            closePanelAriaLabel="Close Crews"
            closeButtonVariant="dismiss"
            mobileSheetChrome
          />
        </ExploreMobileBrowseOverlay>
      ) : null}
    </div>
  );
};
