import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { SetURLSearchParams } from 'react-router-dom';
import { applyProductSearchMutation } from '../../routing/productSearchMutation';
import { listDiscoveryPathFromExploreSearch } from '../../list/routing';
import {
  BROWSE_DISCOVER_PARAM,
  parseBrowseDiscoverOpen,
} from '../../list/browseListUrlState';
import { compactExploreParentFilterSearchParams, EXPLORE_PIN_QUERY_KEY } from '../routing';

const isPeopleView = (view: string | null): boolean =>
  view === 'people' || view === 'social' || view === 'going';

/** Mobile catalog list/browse on `/explore` opens `/list`. Desktop keeps `list=1` on the map. */
export const useExploreBrowseUrlInboundMigrations = (input: {
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  isDesktop: boolean;
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const search = input.searchParams.toString();
  const setSearchParams = input.setSearchParams;
  const isDesktop = input.isDesktop;

  useEffect(() => {
    const params = new URLSearchParams(search);
    const browse = parseBrowseDiscoverOpen(params.get(BROWSE_DISCOVER_PARAM));
    const list = params.get('list') === '1';
    const people = isPeopleView(params.get('view'));
    const pin = params.get(EXPLORE_PIN_QUERY_KEY)?.trim();

    if (compactExploreParentFilterSearchParams(params)) {
      const next = params.toString();
      if (next !== search) {
        applyProductSearchMutation({ pathname, navigate, setSearchParams }, (draft) => {
          for (const key of [...draft.keys()]) {
            draft.delete(key);
          }
          params.forEach((value, key) => draft.set(key, value));
        });
      }
      return;
    }

    if (people) return;

    if (list && pin && !browse) {
      applyProductSearchMutation({ pathname, navigate, setSearchParams }, (draft) => {
        draft.delete('list');
      });
      return;
    }

    /** Visual discover (`browse=1`) is `/list` on every viewport — not a clipped map overlay. */
    if (browse) {
      navigate(listDiscoveryPathFromExploreSearch(search), { replace: true });
      return;
    }

    if (isDesktop) return;

    if (list) {
      navigate(listDiscoveryPathFromExploreSearch(search), { replace: true });
    }
  }, [search, setSearchParams, navigate, isDesktop, pathname]);
};
