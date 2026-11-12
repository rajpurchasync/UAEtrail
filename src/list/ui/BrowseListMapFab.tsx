import { Map } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOBILE_DOCK_ICON } from '../../config/exploreTheme';
import { BROWSE_LIST_MAP_CTA, BROWSE_LIST_VIEW_ON_MAP } from '../browseListCopy';
import { LIST_MAP_FLOAT, LIST_VIEW_MAP_FLOAT_POSITION } from '../listChromeTheme';

type BrowseListMapFabProps = {
  mapHref: string;
};

/** Mobile list — same dock pill as explore **List**. */
export const BrowseListMapFab = ({ mapHref }: BrowseListMapFabProps) => (
  <Link
    to={mapHref}
    className={`${LIST_MAP_FLOAT} ${LIST_VIEW_MAP_FLOAT_POSITION}`}
    aria-label={BROWSE_LIST_VIEW_ON_MAP}
  >
    <Map className={MOBILE_DOCK_ICON} strokeWidth={2.25} aria-hidden />
    {BROWSE_LIST_MAP_CTA}
  </Link>
);
