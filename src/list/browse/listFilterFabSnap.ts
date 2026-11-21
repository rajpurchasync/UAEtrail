export type ListFilterFabCorner = 'tl' | 'tr' | 'bl' | 'br';

export const LIST_FILTER_FAB_STORAGE_KEY = 'uaetrail.list-filter-fab-corner';
export const LIST_FILTER_FAB_SIZE = 48;
export const LIST_FILTER_FAB_EDGE = 16;
export const LIST_FILTER_FAB_DRAG_PX = 8;

const CORNERS = new Set<ListFilterFabCorner>(['tl', 'tr', 'bl', 'br']);

export const parseListFilterFabCorner = (value: string | null | undefined): ListFilterFabCorner => {
  if (value && CORNERS.has(value as ListFilterFabCorner)) return value as ListFilterFabCorner;
  return 'bl';
};

export const readListFilterFabCorner = (): ListFilterFabCorner => {
  if (typeof window === 'undefined') return 'bl';
  try {
    return parseListFilterFabCorner(window.localStorage.getItem(LIST_FILTER_FAB_STORAGE_KEY));
  } catch {
    return 'bl';
  }
};

export const persistListFilterFabCorner = (corner: ListFilterFabCorner): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LIST_FILTER_FAB_STORAGE_KEY, corner);
  } catch {
    // ignore quota / private mode
  }
};

export const snapListFilterFabCorner = (x: number, y: number, vw: number, vh: number): ListFilterFabCorner => {
  const left = x < vw / 2;
  const top = y < vh / 2;
  if (top) return left ? 'tl' : 'tr';
  return left ? 'bl' : 'br';
};

export type ListFilterFabInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export const listFilterFabCornerStyle = (
  corner: ListFilterFabCorner,
  insets: ListFilterFabInsets
): { top?: number; right?: number; bottom?: number; left?: number } => {
  switch (corner) {
    case 'tl':
      return { top: insets.top, left: insets.left };
    case 'tr':
      return { top: insets.top, right: insets.right };
    case 'bl':
      return { bottom: insets.bottom, left: insets.left };
    case 'br':
      return { bottom: insets.bottom, right: insets.right };
  }
};