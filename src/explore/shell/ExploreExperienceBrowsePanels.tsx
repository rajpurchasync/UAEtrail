import { useCallback, useMemo, useState } from 'react';
import { ExploreBrowsePanel, type ExploreBrowsePanelProps } from '../ui/ExploreBrowsePanel';
import { ExploreMobileBrowseOverlay } from '../ui/ExploreMobileBrowseOverlay';
import { PeopleBrowsePanel } from '@/people-discovery/panel/PeopleBrowsePanel';
import { EXPLORE_PEOPLE_BROWSE_PANEL_TITLE } from '../../content/explorePeopleBrowseCopy';
import { EXPLORE_SEARCH_PROMPT } from '../exploreBrowseTaxonomy';
import {
  MOBILE_BROWSE_SHEET_EXPAND_HINT,
  useMobileBrowseSheetImmersive,
} from '../../hooks/useMobileBrowseSheetImmersive';
import { discoverBrowseHomeFilterPatch } from '../../list/discoverBrowseHomePatch';
import { LIST_CATEGORY_PAGE_TITLE } from '../../list/listCategoryCopy';
import { resolveListCategoryHeaderFocus, resolveListDiscoveryView } from '../../list/listDiscoveryMode';
import { ListDiscoveryExperience } from '../../list/ListDiscoveryExperience';
import { useListDiscoveryUrlState } from '../../list/useListDiscoveryUrlState';
import type { ComponentProps, ReactNode } from 'react';

const DISCOVER_BROWSE_SHEET_TITLE = 'Discover';
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
  const {
    immersive: discoverImmersive,
    enterImmersive: enterDiscoverImmersive,
    exitImmersive: exitDiscoverImmersive,
  } = useMobileBrowseSheetImmersive(browse.browseOpen && !isDesktop);
  const {
    immersive: listImmersive,
    enterImmersive: enterListImmersive,
    exitImmersive: exitListImmersive,
  } = useMobileBrowseSheetImmersive(browse.showListPanel && !isDesktop && !browse.browseOpen);

  const isPeopleListSheet = browse.listMode === 'people';

  const mapOverlayDiscoverOpen = browse.browseOpen && !isDesktop;
  const discoverBrowseUrl = useListDiscoveryUrlState({ mapOverlay: mapOverlayDiscoverOpen });
  const discoverCategoryFocus = useMemo(
    () =>
      mapOverlayDiscoverOpen
        ? resolveListCategoryHeaderFocus(
            discoverBrowseUrl.filters,
            discoverBrowseUrl.venueRegions,
            discoverBrowseUrl.listCat
          )
        : null,
    [mapOverlayDiscoverOpen, discoverBrowseUrl.filters, discoverBrowseUrl.venueRegions, discoverBrowseUrl.listCat]
  );
  const discoverView = useMemo(
    () =>
      mapOverlayDiscoverOpen
        ? resolveListDiscoveryView(
            discoverBrowseUrl.filters,
            discoverBrowseUrl.venueRegions,
            discoverBrowseUrl.listCat
          ).view
        : 'home',
    [mapOverlayDiscoverOpen, discoverBrowseUrl.filters, discoverBrowseUrl.venueRegions, discoverBrowseUrl.listCat]
  );
  const [discoverImmersiveSubtitle, setDiscoverImmersiveSubtitle] = useState<string | null>(null);

  const discoverImmersiveTitle = useMemo(() => {
    if (discoverCategoryFocus) return LIST_CATEGORY_PAGE_TITLE[discoverCategoryFocus];
    if (discoverView === 'home') return DISCOVER_BROWSE_SHEET_TITLE;
    return DISCOVER_BROWSE_SHEET_TITLE;
  }, [discoverCategoryFocus, discoverView]);

  const handleDiscoverImmersiveBack = useCallback(() => {
    if (discoverImmersive && discoverCategoryFocus) {
      discoverBrowseUrl.syncUrl(discoverBrowseHomeFilterPatch());
      return;
    }
    exitDiscoverImmersive();
  }, [discoverImmersive, discoverCategoryFocus, discoverBrowseUrl, exitDiscoverImmersive]);

  const closeDiscoverSheet = useCallback(() => {
    exitDiscoverImmersive();
    setDiscoverImmersiveSubtitle(null);
    browse.closeDiscoverBrowse();
  }, [browse, exitDiscoverImmersive]);

  const closeListSheet = useCallback(() => {
    exitListImmersive();
    browse.closeListPanel();
  }, [browse, exitListImmersive]);

  /** Full-screen list / Find crew — back returns to the map, not the peek sheet. */
  const handleListImmersiveBack = useCallback(() => {
    closeListSheet();
  }, [closeListSheet]);

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
      mobileSheetChrome
      overlayImmersive={listImmersive}
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
    <ListDiscoveryExperience
      surface="mapOverlay"
      onCloseMapOverlay={browse.closeDiscoverBrowse}
      overlayImmersive={discoverImmersive}
      onImmersiveSubtitleChange={discoverImmersive ? setDiscoverImmersiveSubtitle : undefined}
    />
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
        <ExploreMobileBrowseOverlay
          open
          onClose={closeDiscoverSheet}
          sheetSize="full"
          onExpand={enterDiscoverImmersive}
          expandHint={MOBILE_BROWSE_SHEET_EXPAND_HINT}
          immersive={discoverImmersive}
          immersiveTitle={discoverImmersiveTitle}
          immersiveSubtitle={discoverImmersiveSubtitle}
          onExitImmersive={handleDiscoverImmersiveBack}
          immersiveBackLabel="Back"
        >
          {discoverBrowse}
        </ExploreMobileBrowseOverlay>
      ) : null}

      {browse.showListPanel && !isDesktop && !browse.browseOpen ? (
        <ExploreMobileBrowseOverlay
          open
          onClose={closeListSheet}
          sheetSize="full"
          onExpand={enterListImmersive}
          expandHint={MOBILE_BROWSE_SHEET_EXPAND_HINT}
          immersive={listImmersive}
          immersiveTitle={
            isPeopleListSheet ? EXPLORE_PEOPLE_BROWSE_PANEL_TITLE : EXPLORE_SEARCH_PROMPT
          }
          onExitImmersive={handleListImmersiveBack}
          immersiveBackLabel="Back"
        >
          {isPeopleListSheet ? mobileListPeopleBrowsePanel : mobileMapListPanel}
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
