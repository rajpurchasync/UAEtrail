import { Map, List } from 'lucide-react';
import { exploreMapScopeSegmentClass } from '../../config/exploreTheme';
import { EXPLORE_MAP_CHROME_FROST } from '../../config/exploreTheme';

type ExploreMapProjectionToggleProps = {
  mode: 'map' | 'list';
  listCount: number;
  onSelectMap: () => void;
  onSelectList: () => void;
};

const TRAY = `flex h-8 w-auto max-w-[min(100%,14rem)] shrink-0 items-center gap-0.5 overflow-hidden rounded-full p-0.5 ring-1 ring-black/5 ${EXPLORE_MAP_CHROME_FROST}`;

/** Booking-style map vs list — scope comes from bottom nav, not this row. */
export const ExploreMapProjectionToggle = ({
  mode,
  listCount,
  onSelectMap,
  onSelectList,
}: ExploreMapProjectionToggleProps) => {
  const listLabel = listCount > 0 ? `List (${listCount})` : 'List';

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
        className={`${exploreMapScopeSegmentClass(mode === 'list', 'places')} !h-full !min-h-0 !gap-1 !px-2.5 !py-0.5 !text-sm`}
        onClick={onSelectList}
      >
        <List className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2.25} aria-hidden />
        <span className="whitespace-nowrap">{listLabel}</span>
      </button>
    </div>
  );
};