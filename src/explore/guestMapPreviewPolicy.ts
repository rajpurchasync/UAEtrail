import { EXPLORE_GUEST_MAP_PREVIEW_MAX_MATCHES } from './exploreBrowseTaxonomy';

/** Guest map preview limits for signed-out sessions (all environments — sign in for full access). */
export const isGuestMapCatalogPreviewLimited = (): boolean => true;

export const GUEST_EXPLORE_PREVIEW_MAX_VIEWS = EXPLORE_GUEST_MAP_PREVIEW_MAX_MATCHES;

export const EXPLORE_GUEST_MAP_PREVIEW_DISMISSED_KEY = 'explore-guest-map-preview-dismissed';
const EXPLORE_GUEST_PREVIEW_VIEWED_IDS_KEY = 'explore-guest-preview-viewed-ids';

export const readExploreGuestMapPreviewDismissed = (): boolean => {
  try {
    return sessionStorage.getItem(EXPLORE_GUEST_MAP_PREVIEW_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
};

export const writeExploreGuestMapPreviewDismissed = (): void => {
  try {
    sessionStorage.setItem(EXPLORE_GUEST_MAP_PREVIEW_DISMISSED_KEY, '1');
  } catch {
    /* ignore */
  }
};

const readViewedIds = (): string[] => {
  if (!isGuestMapCatalogPreviewLimited()) return [];
  try {
    const raw = sessionStorage.getItem(EXPLORE_GUEST_PREVIEW_VIEWED_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
  } catch {
    return [];
  }
};

const writeViewedIds = (ids: readonly string[]): void => {
  try {
    sessionStorage.setItem(EXPLORE_GUEST_PREVIEW_VIEWED_IDS_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
};

export const guestExplorePreviewViewCount = (): number => readViewedIds().length;

export const guestExplorePreviewLimitReached = (): boolean =>
  isGuestMapCatalogPreviewLimited() &&
  guestExplorePreviewViewCount() >= GUEST_EXPLORE_PREVIEW_MAX_VIEWS;

/** Guests may re-open items already counted toward the preview limit. */
export const guestExplorePreviewCanViewItem = (exploreItemId: string): boolean => {
  if (!isGuestMapCatalogPreviewLimited()) return true;
  const ids = readViewedIds();
  if (ids.includes(exploreItemId)) return true;
  return ids.length < GUEST_EXPLORE_PREVIEW_MAX_VIEWS;
};

export const guestExplorePreviewCanSearch = (): boolean =>
  !isGuestMapCatalogPreviewLimited() || !guestExplorePreviewLimitReached();

export type GuestExplorePreviewViewResult = {
  allowed: boolean;
  limitReached: boolean;
  viewCount: number;
};

/** Record a map peek / detail preview for guests (unique ids only). */
export const recordGuestExplorePreviewView = (exploreItemId: string): GuestExplorePreviewViewResult => {
  if (!isGuestMapCatalogPreviewLimited()) {
    return { allowed: true, limitReached: false, viewCount: 0 };
  }
  const trimmed = exploreItemId.trim();
  if (!trimmed) return { allowed: false, limitReached: guestExplorePreviewLimitReached(), viewCount: guestExplorePreviewViewCount() };

  const ids = readViewedIds();
  if (ids.includes(trimmed)) {
    return {
      allowed: true,
      limitReached: ids.length >= GUEST_EXPLORE_PREVIEW_MAX_VIEWS,
      viewCount: ids.length,
    };
  }
  if (ids.length >= GUEST_EXPLORE_PREVIEW_MAX_VIEWS) {
    return { allowed: false, limitReached: true, viewCount: ids.length };
  }
  const next = [...ids, trimmed];
  writeViewedIds(next);
  return {
    allowed: true,
    limitReached: next.length >= GUEST_EXPLORE_PREVIEW_MAX_VIEWS,
    viewCount: next.length,
  };
};
