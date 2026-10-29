import { PeopleBrowsePanel } from '@/people-discovery/panel/PeopleBrowsePanel';
import { EXPLORE_PEOPLE_BROWSE_PANEL_TITLE } from '../../content/explorePeopleBrowseCopy';
import { ExploreMobileBrowseOverlay } from '../ui/ExploreMobileBrowseOverlay';
import type { ComponentProps, ReactNode } from 'react';

type PeopleProps = ComponentProps<typeof PeopleBrowsePanel>;

type Props = {
  isDesktop: boolean;
  browse: {
    showListPanel: boolean;
    listMode: string;
    peopleBrowseOpen: boolean;
    closeListPanel: () => void;
    closePeopleBrowsePanel: () => void;
  };
  peopleBrowsePanelProps: PeopleProps;
  mapStage: ReactNode;
};

/** Map stage plus mobile People sheet. Catalog list lives on `/list`. */
export const ExploreExperienceBrowsePanels = ({
  isDesktop,
  browse,
  peopleBrowsePanelProps,
  mapStage,
}: Props) => {
  const peopleSheet = browse.showListPanel && !isDesktop && browse.listMode === 'people';

  return (
    <>
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
