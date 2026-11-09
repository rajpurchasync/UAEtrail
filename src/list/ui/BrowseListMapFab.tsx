import { Map } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EXPLORE_MAP_CHROME_FROST, EXPLORE_MAP_CHROME_LABEL } from '../../config/exploreTheme';
import { BROWSE_LIST_MAP_CTA, BROWSE_LIST_VIEW_ON_MAP } from '../browseListCopy';
import { LIST_FLOAT_FIXED, LIST_VIEW_MAP_FLOAT_POSITION } from '../listChromeTheme';

type BrowseListMapFabProps = {
  mapHref: string;
};

/** Mobile list — bottom-left map handoff (mirror of explore **List** FAB). */
export const BrowseListMapFab = ({ mapHref }: BrowseListMapFabProps) => (
  <Link
    to={mapHref}
    className={`${LIST_FLOAT_FIXED} ${LIST_VIEW_MAP_FLOAT_POSITION} ${EXPLORE_MAP_CHROME_FROST} ${EXPLORE_MAP_CHROME_LABEL} pointer-events-auto inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 text-neutral-900 ring-1 ring-black/5 transition hover:bg-white/80 active:scale-[0.98]`}
    aria-label={BROWSE_LIST_VIEW_ON_MAP}
  >
    <Map className="h-[1.125rem] w-[1.125rem] shrink-0" strokeWidth={2} aria-hidden />
    {BROWSE_LIST_MAP_CTA}
  </Link>
);
