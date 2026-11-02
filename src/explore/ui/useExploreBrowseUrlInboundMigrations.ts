import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SetURLSearchParams } from 'react-router-dom';
import { listDiscoveryPathFromExploreSearch } from '../../list/routing';
import {
  BROWSE_DISCOVER_PARAM,
  parseBrowseDiscoverOpen,
} from '../../list/browseListUrlState';
import { EXPLORE_PIN_QUERY_KEY } from '../routing';

const isPeopleView = (view: string | null): boolean =>
  view === 'people' || view === 'social' || view === 'going';

/** Mobile catalog list/browse on `/explore` opens `/list`. Desktop keeps `list=1` on the map. */
export const useExploreBrowseUrlInboundMigrations = (input: {
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  isDesktop: boolean;
}) => {
  const navigate = useNavigate();
  const search = input.searchParams.toString();
  const setSearchParams = input.setSearchParams;
  const isDesktop = input.isDesktop;

  useEffect(() => {
    const params = new URLSearchParams(search);
    const browse = parseBrowseDiscoverOpen(params.get(BROWSE_DISCOVER_PARAM));
    const list = params.get('list') === '1';
    const people = isPeopleView(params.get('view'));
    const pin = params.get(EXPLORE_PIN_QUERY_KEY)?.trim();

    if (people) return;

    if (list && pin && !browse) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('list');
          return next;
        },
        { replace: true }
      );
      return;
    }

    if (isDesktop) return;

    if (browse || list) {
      navigate(listDiscoveryPathFromExploreSearch(search), { replace: true });
    }
  }, [search, setSearchParams, navigate, isDesktop]);
};
