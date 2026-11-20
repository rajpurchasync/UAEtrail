import { List, Map } from 'lucide-react';
import { exploreMapScopeSegmentClass } from '../../config/exploreTheme';
import { EXPLORE_MAP_CHROME_FROST } from '../../config/exploreTheme';

const TRAY = `flex h-8 shrink-0 items-center gap-0.5 overflow-hidden rounded-full p-0.5 ring-1 ring-black/5 ${EXPLORE_MAP_CHROME_FROST}`;

type ExploreSearchResultsViewToggleProps = {
  mode: 'list' | 'map';
  listCount: number;
  onSelectList: () => void;
  onSelectMap: () => void;
};

/** Search results chrome — List · View (map) on the right. */
export const ExploreSearchResultsViewToggle = ({
  mode,
  listCount,
  onSelectList,
  onSelectMap,
}: ExploreSearchResultsViewToggleProps) => {
  const listAria = listCount > 0 ? `List, ${listCount} results` : 'List';

  return (
    <div className={TRAY} role="tablist" aria-label="List or map view">
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'list'}
        aria-label={listAria}
        className={`${exploreMapScopeSegmentClass(mode === 'list', 'places')} !h-full !min-h-0 !gap-1 !px-2.5 !py-0.5 !text-sm`}
        onClick={onSelectList}
      >
        <List className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2.25} aria-hidden />
        <span className="whitespace-nowrap">List</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'map'}
        aria-label="View on map"
        className={`${exploreMapScopeSegmentClass(mode === 'map', 'activity')} !h-full !min-h-0 !gap-1 !px-2.5 !py-0.5 !text-sm`}
        onClick={onSelectMap}
      >
        <Map className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2.25} aria-hidden />
        <span className="whitespace-nowrap">View</span>
      </button>
    </div>
  );
};