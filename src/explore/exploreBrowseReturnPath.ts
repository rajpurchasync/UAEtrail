import { EXPLORE_MAP_PATH } from '../config/platform';
import { BROWSE_DISCOVER_PARAM, LIST_CAT_PARAM } from '../list/browseListUrlState';
import {
  INBOUND_BUDDIES_LIST_TAB_PARAM,
  INBOUND_GOING_TAB_PARAM,
  INBOUND_SOCIAL_TAB_PARAM,
  PEOPLE_LIST_TAB_URL_PARAM,
} from '../routing/productUrlInbound';

/**
 * After full-screen Find People, return to the map — not the mobile list sheet or discover browse.
 */
export const exploreMapPathAfterPeopleFullScreen = (returnTo: string): string => {
  const trimmed = returnTo.trim() || EXPLORE_MAP_PATH;
  const qIndex = trimmed.indexOf('?');
  const pathname = (qIndex >= 0 ? trimmed.slice(0, qIndex) : trimmed) || EXPLORE_MAP_PATH;
  const params = new URLSearchParams(qIndex >= 0 ? trimmed.slice(qIndex + 1) : '');

  params.set('list', '0');
  params.delete(BROWSE_DISCOVER_PARAM);
  params.delete('view');
  params.delete(PEOPLE_LIST_TAB_URL_PARAM);
  params.delete(INBOUND_SOCIAL_TAB_PARAM);
  params.delete(INBOUND_GOING_TAB_PARAM);
  params.delete(INBOUND_BUDDIES_LIST_TAB_PARAM);
  params.delete(LIST_CAT_PARAM);

  const qs = params.toString();
  const base = pathname.startsWith('/') ? pathname : EXPLORE_MAP_PATH;
  return qs ? `${base}?${qs}` : base;
};
