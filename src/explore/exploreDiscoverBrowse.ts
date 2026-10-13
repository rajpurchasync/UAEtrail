import { EXPLORE_MAP_PATH, LIST_DISCOVERY_PATH } from '../config/platform';
import { BROWSE_DISCOVER_PARAM, parseBrowseDiscoverOpen } from '../list/browseListUrlState';

/** True on `/list` or `/explore?browse=1` (visual discover — not map-only explore). */
export const isDiscoverBrowseRoute = (pathname: string, search: string): boolean => {
  if (pathname === LIST_DISCOVERY_PATH || pathname.startsWith(`${LIST_DISCOVERY_PATH}/`)) {
    return true;
  }
  if (pathname !== EXPLORE_MAP_PATH && !pathname.startsWith(`${EXPLORE_MAP_PATH}/`)) {
    return false;
  }
  const params = new URLSearchParams(search.replace(/^\?/, '').trim());
  return parseBrowseDiscoverOpen(params.get(BROWSE_DISCOVER_PARAM));
};
