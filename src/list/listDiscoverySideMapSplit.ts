/** Resizable side map next to list / guest preview — listing cards stay one column. */

export const LIST_SIDE_MAP_WIDTH_STORAGE_KEY = 'uaetrail.listSideMap.width';
export const LIST_SIDE_LIST_WIDTH_STORAGE_KEY = 'uaetrail.listSideMap.listWidth';

export const LIST_SIDE_MAP_MIN_PX = 280;
export const LIST_SIDE_LIST_DEFAULT_PX = 450;
/** Upper cap for list column — user can drag wider on large screens (map keeps {@link LIST_SIDE_MAP_MIN_PX}). */
export const LIST_BROWSE_MAX_PX = 680;
export const LIST_BROWSE_MIN_PX = 360;
export const LIST_SIDE_MAP_RESIZE_HANDLE_PX = 12;

export const maxListPanelWidthInSplit = (splitWidthPx: number): number => {
  if (!Number.isFinite(splitWidthPx) || splitWidthPx <= 0) return LIST_BROWSE_MAX_PX;
  const maxFromSplit =
    splitWidthPx - LIST_SIDE_MAP_MIN_PX - LIST_SIDE_MAP_RESIZE_HANDLE_PX;
  return Math.min(LIST_BROWSE_MAX_PX, Math.max(LIST_BROWSE_MIN_PX, maxFromSplit));
};

export const clampListPanelWidth = (width: number, splitWidthPx?: number): number => {
  const max =
    splitWidthPx != null && splitWidthPx > 0
      ? maxListPanelWidthInSplit(splitWidthPx)
      : LIST_BROWSE_MAX_PX;
  return Math.min(Math.max(width, LIST_BROWSE_MIN_PX), max);
};

/** @deprecated Map-min-width storage — migrated to list panel width on read. */
export const readStoredSideMapWidth = (): number => LIST_SIDE_LIST_DEFAULT_PX;

export const readStoredListPanelWidth = (): number => {
  if (typeof window === 'undefined') return LIST_SIDE_LIST_DEFAULT_PX;
  const listRaw = Number.parseInt(window.localStorage.getItem(LIST_SIDE_LIST_WIDTH_STORAGE_KEY) ?? '', 10);
  if (Number.isFinite(listRaw)) return clampListPanelWidth(listRaw);
  const priorMapWidthRaw = Number.parseInt(
    window.localStorage.getItem(LIST_SIDE_MAP_WIDTH_STORAGE_KEY) ?? '',
    10
  );
  if (Number.isFinite(priorMapWidthRaw)) {
    return clampListPanelWidth(LIST_BROWSE_MAX_PX);
  }
  return LIST_SIDE_LIST_DEFAULT_PX;
};

export const persistListPanelWidth = (width: number) => {
  try {
    window.localStorage.setItem(LIST_SIDE_LIST_WIDTH_STORAGE_KEY, String(Math.round(width)));
  } catch {
    /* ignore */
  }
};

/** @deprecated Use persistListPanelWidth */
export const persistSideMapWidth = persistListPanelWidth;
