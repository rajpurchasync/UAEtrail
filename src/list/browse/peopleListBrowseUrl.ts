import {
  parsePeopleBrowseTab,
  serializePeopleBrowseTab,
  type PeopleBrowseTab,
} from '@/people-discovery/peopleBrowseTab';
import {
  INBOUND_BUDDIES_LIST_TAB_PARAM,
  PEOPLE_LIST_TAB_URL_PARAM,
  readPeopleCrewsTabParam,
} from '../../routing/productUrlInbound';

export type { PeopleBrowseTab };

export { PEOPLE_LIST_TAB_URL_PARAM, readPeopleCrewsTabParam };

/** Full-screen `/list?listCat=people` — default **Overview** when tab param omitted. */
export const parsePeopleListBrowseTab = (raw: string | null): PeopleBrowseTab => {
  if (!raw || raw === INBOUND_BUDDIES_LIST_TAB_PARAM) return 'hub';
  return parsePeopleBrowseTab(raw);
};

/** Explore map people rail — default **Looking for** when tab param omitted. */
export const parseExplorePeopleBrowseTab = (
  searchParams: Pick<URLSearchParams, 'get'>
): PeopleBrowseTab => parsePeopleBrowseTab(readPeopleCrewsTabParam(searchParams));

export const serializePeopleListBrowseTab = (tab: PeopleBrowseTab): string | null => {
  if (tab === 'hub') return null;
  return serializePeopleBrowseTab(tab);
};