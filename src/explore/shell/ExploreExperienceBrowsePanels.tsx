import { lazy, Suspense } from 'react';
import { PeopleBrowsePanel } from '@/people-discovery/panel/PeopleBrowsePanel';
import { EXPLORE_PEOPLE_BROWSE_PANEL_TITLE } from '../../content/explorePeopleBrowseCopy';
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
};

/** Map stage plus desktop catalog drawer and mobile People sheet. */
export const ExploreExperienceBrowsePanels = ({
  isDesktop,
  browse,
  peopleBrowsePanelProps,
  mapStage,
}: Props) => {
  const peopleSheet = browse.showListPanel && !isDesktop && browse.listMode === 'people';
  const desktopCatalog = isDesktop && browse.showDesktopCatalogDrawer;

  return (
    <>
      {desktopCatalog ? (
        <ExploreDesktopListDrawer onClose={browse.closeListPanel}>
          <Suspense fallback={<div className="h-full min-h-0 flex-1 bg-neutral-50" aria-hidden />}>
            <ListDiscoveryExperience
              surface="exploreSidebar"
              onCloseMapOverlay={browse.closeListPanel}
            />
          </Suspense>
        </ExploreDesktopListDrawer>
      ) : null}
      {mapStage}
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
    </>
  );
};
