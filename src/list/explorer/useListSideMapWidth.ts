import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clampListPanelWidth,
  LIST_BROWSE_MAX_PX,
  maxListPanelWidthInSplit,
  persistListPanelWidth,
  readStoredListPanelWidth,
} from '../listDiscoverySideMapSplit';

/** Browse column width when the side map is open (map fills remaining space). */
export const useListSideMapWidth = (enabled: boolean) => {
  const splitRef = useRef<HTMLDivElement>(null);
  const [listPanelWidth, setListPanelWidth] = useState(readStoredListPanelWidth);
  const listPanelWidthRef = useRef(listPanelWidth);

  useEffect(() => {
    listPanelWidthRef.current = listPanelWidth;
  }, [listPanelWidth]);

  useEffect(() => {
    if (!enabled) return;
    const split = splitRef.current?.clientWidth ?? 0;
    setListPanelWidth((current) => clampListPanelWidth(current, split || undefined));
  }, [enabled]);

  const setListPanelWidthClamped = useCallback((width: number) => {
    const split = splitRef.current?.clientWidth ?? 0;
    setListPanelWidth(clampListPanelWidth(width, split || undefined));
  }, []);

  const listPanelMaxPx = useCallback(() => {
    const split = splitRef.current?.clientWidth ?? 0;
    return split > 0 ? maxListPanelWidthInSplit(split) : LIST_BROWSE_MAX_PX;
  }, []);

  const commitListPanelWidth = useCallback(() => {
    persistListPanelWidth(listPanelWidthRef.current);
  }, []);

  const getStartListWidth = useCallback(() => listPanelWidthRef.current, []);

  return {
    splitRef,
    listPanelWidth,
    listPanelMaxPx,
    setListPanelWidthClamped,
    commitListPanelWidth,
    getStartListWidth,
  };
};
