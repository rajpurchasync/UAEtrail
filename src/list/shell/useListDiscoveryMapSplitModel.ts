/** Desktop list + side map column (trips/places feed — not crews category). */

import { useCallback, useEffect, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { useBindExploreListMapHover } from '../../discovery/discoveryPortExploreMapChromeContext';
import { useMinWidthMd } from '../../hooks/useMinWidthMd';
import { useMinWidthPx } from '../../hooks/useMinWidthPx';
import { collapseDesktopSideNav } from '../../hooks/useDesktopSideNavExpanded';
import { useListSideMapWidth } from '../explorer/useListSideMapWidth';
import {
  LIST_DISCOVERY_MAP_AUTO_MIN_PX,
  LIST_DISCOVERY_MAP_DISMISSED_STORAGE_KEY,
  LIST_DISCOVERY_MAP_OPEN_STORAGE_KEY,
} from '../browse/listDiscoveryMapLayout';
import { browseListEntityLinkState } from '../browse/browseListNavState';

const readListMapColumnOpen = (): boolean => {
  try {
    return sessionStorage.getItem(LIST_DISCOVERY_MAP_OPEN_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const writeListMapColumnOpen = (open: boolean) => {
  try {
    sessionStorage.setItem(LIST_DISCOVERY_MAP_OPEN_STORAGE_KEY, open ? '1' : '0');
  } catch {
    /* ignore */
  }
};

const readListMapDismissed = (): boolean => {
  try {
    return sessionStorage.getItem(LIST_DISCOVERY_MAP_DISMISSED_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const writeListMapDismissed = (dismissed: boolean) => {
  try {
    sessionStorage.setItem(LIST_DISCOVERY_MAP_DISMISSED_STORAGE_KEY, dismissed ? '1' : '0');
  } catch {
    /* ignore */
  }
};

export type ListDiscoveryMapSplitModelInput = {
  enabled: boolean;
  exploreSearch: boolean;
  navigate: NavigateFunction;
  locationPathname: string;
  locationSearch: string;
};

export const useListDiscoveryMapSplitModel = ({
  enabled,
  exploreSearch,
  navigate,
  locationPathname,
  locationSearch,
}: ListDiscoveryMapSplitModelInput) => {
  const desktopMd = useMinWidthMd();
  const wideListMapSplit = useMinWidthPx(LIST_DISCOVERY_MAP_AUTO_MIN_PX);
  const [listMapColumnOpen, setListMapColumnOpen] = useState(readListMapColumnOpen);
  const [listMapDismissed, setListMapDismissed] = useState(readListMapDismissed);
  const [listMapHighlightedId, setListMapHighlightedId] = useState<string | null>(null);
  const [listMapSelectedId, setListMapSelectedId] = useState<string | null>(null);

  const listMapSplitEnabled = enabled;
  const showListMapColumn =
    listMapSplitEnabled && desktopMd && !listMapDismissed && (wideListMapSplit || listMapColumnOpen);
  const showListMapColumnPrompt =
    listMapSplitEnabled &&
    desktopMd &&
    !showListMapColumn &&
    (listMapDismissed || !wideListMapSplit);

  useBindExploreListMapHover(setListMapHighlightedId);

  const openListMapColumn = useCallback(() => {
    collapseDesktopSideNav();
    setListMapDismissed(false);
    writeListMapDismissed(false);
    setListMapColumnOpen(true);
    writeListMapColumnOpen(true);
  }, []);

  const closeListMapColumn = useCallback(() => {
    setListMapDismissed(true);
    writeListMapDismissed(true);
    setListMapColumnOpen(false);
    writeListMapColumnOpen(false);
    setListMapHighlightedId(null);
    setListMapSelectedId(null);
  }, []);

  useEffect(() => {
    if (wideListMapSplit && !listMapDismissed) {
      setListMapColumnOpen(false);
      writeListMapColumnOpen(false);
    }
  }, [wideListMapSplit, listMapDismissed]);

  const handleListMapSelectItem = useCallback(
    (item: ExploreMapItemDTO) => {
      setListMapSelectedId(item.id);
      setListMapHighlightedId(item.id);
      if (exploreSearch && item.path) {
        const returnTo = `${locationPathname}${locationSearch}`;
        navigate(item.path, { state: browseListEntityLinkState(returnTo) });
      }
    },
    [exploreSearch, locationPathname, locationSearch, navigate]
  );

  const sideMapWidth = useListSideMapWidth(showListMapColumn);

  return {
    showListMapColumn,
    showListMapColumnPrompt,
    openListMapColumn,
    closeListMapColumn,
    listMapHighlightedId,
    setListMapHighlightedId,
    listMapSelectedId,
    handleListMapSelectItem,
    sideMapWidth,
  };
};