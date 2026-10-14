import { ListDiscoveryExperience } from '../../list/ListDiscoveryExperience';
import { ExploreBrowsePanel, type ExploreBrowsePanelProps } from '../ui/ExploreBrowsePanel';
import { ExploreMobileBrowseOverlay } from '../ui/ExploreMobileBrowseOverlay';
import { PeopleBrowsePanel } from '@/people-discovery/panel/PeopleBrowsePanel';
import type { ComponentProps, ReactNode } from 'react';
type PeopleProps = ComponentProps<typeof PeopleBrowsePanel>;

type BrowsePanelShared = Omit<
  ExploreBrowsePanelProps,
  'listItems' | 'mapPool' | 'onClose' | 'closePanelAriaLabel' | 'closeButtonVariant' | 'mobileSheetChrome'
>;

type Props = {
  isDesktop: boolean;
  browse: {
    showListPanel: boolean;
    listMode: string;
    peopleBrowseOpen: boolean;
    browseOpen: boolean;
    listOpen: boolean;
    closeListPanel: () => void;
    closeDiscoverBrowse: () => void;
    closePeopleBrowsePanel: () => void;
  };
  browsePanelShared: BrowsePanelShared;
  listItems: ExploreBrowsePanelProps['listItems'];
  mapItems: ExploreBrowsePanelProps['listItems'];
  peopleBrowsePanelProps: PeopleProps;
  mapStage: ReactNode;
};

/** Desktop sidebars + mobile full-screen browse/list overlays (R2). */
export const ExploreExperienceBrowsePanels = ({
  isDesktop,
  browse,
  browsePanelShared,
  listItems,
  mapItems,
  peopleBrowsePanelProps,
  mapStage,
}: Props) => {
  const desktopMapListPanel = (
    <ExploreBrowsePanel
      {...browsePanelShared}
      listItems={listItems}
      mapPool={mapItems}
      onClose={browse.closeListPanel}
      closePanelAriaLabel="Close map list"
    />
  );

  const mobileMapListPanel = (
    <ExploreBrowsePanel
      {...browsePanelShared}
      listItems={listItems}
      mapPool={mapItems}
      onClose={browse.closeListPanel}
      closePanelAriaLabel="Close list"
      closeButtonVariant="dismiss"
      mobileSheetChrome
    />
  );

  const mobileListPeopleBrowsePanel = (
    <PeopleBrowsePanel
      {...peopleBrowsePanelProps}
      onClose={browse.closeListPanel}
      closePanelAriaLabel="Close People"
      closeButtonVariant="dismiss"
      mobileSheetChrome
    />
  );

  const discoverBrowse = (
    <ListDiscoveryExperience surface="mapOverlay" onCloseMapOverlay={browse.closeDiscoverBrowse} />
  );

  return (
    <>
      {browse.showListPanel && isDesktop ? (
        <aside className="hidden lg:flex lg:min-h-0 lg:w-[min(400px,32vw)] lg:shrink-0 lg:flex-col lg:overflow-hidden lg:border-r lg:border-neutral-200 lg:bg-neutral-50 lg:px-4 lg:py-4 lg:transition-[width] lg:duration-300">
          {desktopMapListPanel}
        </aside>
      ) : null}

      {mapStage}

      {browse.browseOpen && !isDesktop ? (
        <ExploreMobileBrowseOverlay open onClose={browse.closeDiscoverBrowse} sheetSize="full">
          {discoverBrowse}
        </ExploreMobileBrowseOverlay>
      ) : null}

      {browse.showListPanel && !isDesktop && !browse.browseOpen ? (
        <ExploreMobileBrowseOverlay open onClose={browse.closeListPanel} sheetSize="full">
          {browse.listMode === 'people' ? mobileListPeopleBrowsePanel : mobileMapListPanel}
        </ExploreMobileBrowseOverlay>
      ) : null}

      {isDesktop && browse.browseOpen ? (
        <aside className="hidden lg:flex lg:min-h-0 lg:w-[min(400px,32vw)] lg:shrink-0 lg:flex-col lg:overflow-hidden lg:border-l lg:border-neutral-200 lg:bg-white lg:px-5 lg:py-4 lg:transition-[width] lg:duration-300">
          {discoverBrowse}
        </aside>
      ) : null}

    </>
  );
};
