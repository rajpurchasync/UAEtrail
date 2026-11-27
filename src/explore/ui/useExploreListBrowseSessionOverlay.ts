import { useMemo } from 'react';
import { readDiscoveryBrowseListSessionForExploreOverlay } from '../../discovery/discoveryBrowseListSessionExploreParity';
import type { DiscoveryBrowseListSessionSnapshot } from '../../discovery/discoveryBrowseListSessionRead';

export const useExploreListBrowseSessionOverlay = (
  listOpen: boolean,
  pathname: string,
  searchParams: URLSearchParams
): DiscoveryBrowseListSessionSnapshot | null =>
  useMemo(
    () =>
      listOpen ? readDiscoveryBrowseListSessionForExploreOverlay(pathname, searchParams) : null,
    [listOpen, pathname, searchParams]
  );