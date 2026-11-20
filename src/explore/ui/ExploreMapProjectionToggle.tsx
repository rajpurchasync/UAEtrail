import { Map, List } from 'lucide-react';
import { exploreMapScopeSegmentClass } from '../../config/exploreTheme';
import { EXPLORE_MAP_CHROME_FROST } from '../../config/exploreTheme';
import { LIST_HUB_SEARCH_ROW } from '../../list/listChromeTheme';

type ExploreMapProjectionToggleProps = {
  mode: 'map' | 'list';
  listCount: number;
  onSelectMap: () => void;
  onSelectList: () => void;
  /** List-first surfaces — map CTA only; map stage keeps full `both` toggle. */
  variant?: 'both' | 'map-only';
  /** Hub list uses list side-action tokens; standalone `/list` mobile row uses map frost pills. */
  toggleChrome?: 'mapFrost' | 'listSide';
};

const TRAY = `flex h-8 w-auto max-w-[min(100%,14rem)] shrink-0 items-center gap-0.5 overflow-hidden rounded-full p-0.5 ring-1 ring-black/5 ${EXPLORE_MAP_CHROME_FROST}`;

/** Booking-style map vs list — scope comes from bottom nav, not this row. */
export const ExploreMapProjectionToggle = ({
  mode,
  listCount,
  onSelectMap,
  onSelectList,
  variant = 'both',
  toggleChrome = 'mapFrost',
}: ExploreMapProjectionToggleProps) => {
  const listAria =
    listCount > 0 ? `List view, ${listCount} results` : 'List view';

  if (variant === 'map-only') {
    if (toggleChrome === 'listSide') {
      return (
        <button
          type="button"
          className={LIST_HUB_SEARCH_ROW.mapAction}
          onClick={onSelectMap}
          aria-label="Open map view"
        >
          <Map className="h-5 w-5 shrink-0 stroke-[2.25]" aria-hidden />
          <span className="whitespace-nowrap">Map</span>
        </button>
      );
    }
    return (
      <div className={TRAY} role="group" aria-label="Open map view">
        <button
          type="button"
          className={`${exploreMapScopeSegmentClass(false, 'activity')} !h-full !min-h-0 !gap-1 !px-2.5 !py-0.5 !text-sm`}
          onClick={onSelectMap}
        >
          <Map className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2.25} aria-hidden />
          <span className="whitespace-nowrap">Map</span>
        </button>
      </div>
    );
  }

  return (
    <div className={TRAY} role="tablist" aria-label="Map or list view">
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'map'}
        className={`${exploreMapScopeSegmentClass(mode === 'map', 'activity')} !h-full !min-h-0 !gap-1 !px-2.5 !py-0.5 !text-sm`}
        onClick={onSelectMap}
      >
        <Map className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2.25} aria-hidden />
        <span className="whitespace-nowrap">Map</span>
      </button>
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
    </div>
  );
};