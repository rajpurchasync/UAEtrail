import { APP_SCROLL_BODY_CLASS } from '../../config/layoutScroll';
import type { ExploreClockStyle, ExploreMapItemDTO } from '@uaetrail/shared-types';
import type {
  CrewBrowseLane,
  CrewPeopleFacet,
  CrewProfessionalKind,
} from '@/crew-discovery/crewBrowseState';
import type { ExploreActivityDatePreset } from '@/discovery/discoveryPortExploreOptionalFilterWire';
import type { BrowseListFilterState } from '@/discovery/discoveryPortListBrowseFilters';
import { crewsHubHomePath } from '@/discovery/discoverySession';
import { LIST_APP_BAR, LIST_CHROME } from '@/discovery/discoveryPortListBrowseCard';
import { FIND_CREW_SEARCH_TITLE } from './findCrewSearchCopy';
const EXPLORE_SEARCH_PAGE_COLUMN = `${LIST_CHROME.maxWidth} mx-auto w-full min-w-0`;
import { MobileBackButton } from '@/components/mobile/MobileBackButton';
import { FindCrewSearchChrome } from './FindCrewSearchChrome';
import { FindCrewResultsSection } from './FindCrewResultsSection';
import type { CrewsAvailableOpenLens } from '@/discovery/discoveryPortListFindCrew';

type ListCrewsExplorerProps = {
  isSignedIn: boolean;
  user: { id: string } | null | undefined;
  draftQuery: string;
  committedQuery: string;
  onQueryChange: (value: string) => void;
  onQuerySync: () => void;
  onSearchCommit?: () => void;
  filters: BrowseListFilterState;
  venueRegions: string[];
  geoPath: string[];
  activityDatePreset: ExploreActivityDatePreset;
  onActivityDatePresetChange: (preset: ExploreActivityDatePreset) => void;
  onVenueRegionsChange: (regions: string[]) => void;
  onSyncBrowse: (patch: {
    crewBrowseLane?: CrewBrowseLane;
    crewPeopleFacet?: CrewPeopleFacet;
    crewProfessionalKind?: CrewProfessionalKind;
    tripAvailabilityOnly?: boolean;
  }) => void;
  /** Intent compose — kept on props for explore drawer parity guards; no top CTA on this surface. */
  onOpenIntentOpen: () => void;
  exploreCatalogItems: ExploreMapItemDTO[];
  exploreCatalogLoading: boolean;
  availabilityCatalogItems: ExploreMapItemDTO[];
  crewsOpenLens: CrewsAvailableOpenLens;
  clock: ExploreClockStyle;
  onOpenAvailabilityCatalogItem: (item: ExploreMapItemDTO) => void;
  onOfferRideshareForAvailabilityItem?: (item: ExploreMapItemDTO) => void;
};

const handleFindCrewSearchSubmit =
  (onQuerySync: () => void, onSearchCommit?: () => void) => () => {
    onQuerySync();
    onSearchCommit?.();
  };

/** Find crew — booking search + crew-only results (no product tab header). */
export const ListCrewsExplorer = ({
  user,
  isSignedIn,
  draftQuery,
  committedQuery,
  onQueryChange,
  onQuerySync,
  onSearchCommit,
  filters,
  venueRegions,
  geoPath,
  activityDatePreset,
  onActivityDatePresetChange,
  onVenueRegionsChange,
  onSyncBrowse,
  onOpenIntentOpen,
  exploreCatalogItems,
  exploreCatalogLoading,
  availabilityCatalogItems,
  crewsOpenLens,
  clock,
  onOpenAvailabilityCatalogItem,
  onOfferRideshareForAvailabilityItem,
}: ListCrewsExplorerProps) => {
  void onOpenIntentOpen;
  return (
  <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
    <header
      className={`sticky top-0 z-20 shrink-0 ${LIST_CHROME.chromeBg} ${LIST_CHROME.chromeBorder}`}
    >
      <div className={`${EXPLORE_SEARCH_PAGE_COLUMN} ${LIST_CHROME.horizontalPad} py-1.5`}>
        <div className="grid min-h-10 grid-cols-[minmax(72px,auto)_1fr_minmax(72px,auto)] items-center gap-1">
          <div className="justify-self-start">
            <MobileBackButton
              fallbackTo={crewsHubHomePath()}
              label="My crew"
              className="min-h-[36px] py-0 -ml-1"
            />
          </div>
          <h1 className={`${LIST_APP_BAR.title} truncate text-center`}>{FIND_CREW_SEARCH_TITLE}</h1>
          <span className="min-w-[72px]" aria-hidden />
        </div>
      </div>
    </header>

    <div
      className={`${APP_SCROLL_BODY_CLASS} min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain pb-[calc(var(--bottom-nav-height,56px)+var(--safe-bottom,0px)+1rem)]`}
    >
      <div
        className={`${EXPLORE_SEARCH_PAGE_COLUMN} ${LIST_CHROME.horizontalPad} flex flex-col gap-4 pb-4 pt-3`}
      >
        <FindCrewSearchChrome
          query={draftQuery}
          committedQuery={committedQuery}
          onQueryChange={onQueryChange}
          onSearchSubmit={handleFindCrewSearchSubmit(onQuerySync, onSearchCommit)}
          filters={filters}
          regions={venueRegions}
          onActivityDatePresetChange={onActivityDatePresetChange}
          onVenueRegionsChange={onVenueRegionsChange}
        />
        <FindCrewResultsSection
          user={user}
          isSignedIn={isSignedIn}
          draftQuery={draftQuery}
          committedQuery={committedQuery}
          filters={filters}
          activityDatePreset={activityDatePreset}
          venueRegions={venueRegions}
          geoPath={geoPath}
          clock={clock}
          exploreCatalogItems={exploreCatalogItems}
          exploreCatalogLoading={exploreCatalogLoading}
          availabilityCatalogItems={availabilityCatalogItems}
          crewsOpenLens={crewsOpenLens}
          onOpenAvailabilityCatalogItem={onOpenAvailabilityCatalogItem}
          onOfferRideshareForAvailabilityItem={onOfferRideshareForAvailabilityItem}
          onOpenIntentOpen={onOpenIntentOpen}
          onSyncBrowse={onSyncBrowse}
        />
      </div>
    </div>
  </div>
  );
};