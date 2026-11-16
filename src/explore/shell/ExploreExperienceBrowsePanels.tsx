import { lazy, Suspense } from 'react';
import { PeopleBrowsePanel } from '@/people-discovery/panel/PeopleBrowsePanel';
import { EXPLORE_PEOPLE_BROWSE_PANEL_TITLE } from '../../content/explorePeopleBrowseCopy';
import { ExploreDesktopDockedPanelRail } from '../ui/ExploreDesktopDockedPanelRail';
import { ExploreDesktopListDrawer } from '../ui/ExploreDesktopListDrawer';
import { ExploreMobileBrowseOverlay } from '../ui/ExploreMobileBrowseOverlay';
import type { ComponentProps, ReactNode } from 'react';

const ListDiscoveryExperience = lazy(() =>
  import('../../list/ListDiscoveryExperience').then((module) => ({
    default: module.ListDiscoveryExperience,
  }))
);

type PeopleProps = ComponentProps<typeof PeopleBrowsePanel>;

type Props = {
  isDesktop: boolean;
  browse: {
    showListPanel: boolean;
    showDesktopCatalogDrawer: boolean;
    listMode: string;
    peopleBrowseOpen: boolean;
    closeListPanel: () => void;
    closePeopleBrowsePanel: () => void;
  };
  peopleBrowsePanelProps: PeopleProps;
  mapStage: ReactNode;
  prefetchedCatalogItems?: import('@uaetrail/shared-types').ExploreMapItemDTO[];
};

/** Map stage plus desktop catalog drawer and mobile People sheet. */
export const ExploreExperienceBrowsePanels = ({
  isDesktop,
  browse,
  peopleBrowsePanelProps,
  mapStage,
  prefetchedCatalogItems,
}: Props) => {
  const peopleSheet = browse.showListPanel && !isDesktop && browse.listMode === 'people';
  const desktopCatalog = isDesktop && browse.showDesktopCatalogDrawer;
  const desktopCrewRail = isDesktop && browse.peopleBrowseOpen;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 max-lg:flex-col lg:flex-row lg:items-stretch overflow-hidden">
      {desktopCrewRail ? (
        <ExploreDesktopDockedPanelRail ariaLabel="Find crew">
          <PeopleBrowsePanel
            {...peopleBrowsePanelProps}
            onClose={browse.closePeopleBrowsePanel}
            closePanelAriaLabel="Close Find crew"
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
                peopleBrowsePanelProps.onOfferRideshareForAvailabilityItem
              }
            />
          </Suspense>
        </ExploreDesktopListDrawer>
      ) : null}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{mapStage}</div>
      {peopleSheet ? (
        <ExploreMobileBrowseOverlay
          open
          onClose={browse.closeListPanel}
          sheetSize="full"
          immersive
          immersiveTitle={EXPLORE_PEOPLE_BROWSE_PANEL_TITLE}
          onExitImmersive={browse.closeListPanel}
          immersiveBackLabel="Back"
        >
          <PeopleBrowsePanel
            {...peopleBrowsePanelProps}
            onClose={browse.closeListPanel}
            closePanelAriaLabel="Close People"
            closeButtonVariant="dismiss"
            mobileSheetChrome
          />
        </ExploreMobileBrowseOverlay>
      ) : null}
    </div>
  );
};
