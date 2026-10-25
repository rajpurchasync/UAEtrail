import { useEffect } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import {
  BROWSE_DISCOVER_PARAM,
  LIST_CAT_PARAM,
  parseBrowseDiscoverOpen,
  parseListCatParam,
} from '../../list/browseListUrlState';

/** Desktop default list + retired `list=1`+`listCat` → `browse=1` migrations (C18). */
export const useExploreBrowseUrlInboundMigrations = (input: {
  isDesktop: boolean;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
}) => {
  useEffect(() => {
    if (!input.isDesktop) return;
    if (parseBrowseDiscoverOpen(input.searchParams.get(BROWSE_DISCOVER_PARAM))) return;
    const listParam = input.searchParams.get('list');
    if (listParam === '0' || listParam === '1') return;
    input.setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('list', '1');
        return next;
      },
      { replace: true }
    );
  }, [input]);

  useEffect(() => {
    const listParam = input.searchParams.get('list');
    const browseParam = input.searchParams.get(BROWSE_DISCOVER_PARAM);
    const retiredListCat = parseListCatParam(input.searchParams.get(LIST_CAT_PARAM));
    if (listParam === '1' && retiredListCat && browseParam !== '1') {
      input.setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(BROWSE_DISCOVER_PARAM, '1');
          next.set('list', '0');
          return next;
        },
        { replace: true }
      );
    }
  }, [input]);
};
