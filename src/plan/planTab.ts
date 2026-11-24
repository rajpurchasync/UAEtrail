import { PLAN_PATH } from '../config/surfacePaths';

/** Primary Plan mobile tabs (bottom of Plan chrome). */
export type PlanMainTab = 'upcoming' | 'wishlist';

export const PLAN_MAIN_TABS: { key: PlanMainTab; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'wishlist', label: 'Wishlist' },
];

/** Upcoming feed filter — hosting includes fixed map availability slots. */
export type PlanCommitmentFilter = 'hosting' | 'joined';

/** Calendar scope — `all` shows busy (activities) + availability blocks together. */
export type PlanCalendarScope = PlanCommitmentFilter | 'all';

export type PlanUpcomingLayout = 'list' | 'calendar';

export const parsePlanMainTab = (tabRaw: string | null): PlanMainTab =>
  tabRaw === 'wishlist' ? 'wishlist' : 'upcoming';

export const parsePlanCommitmentFilter = (
  filterRaw: string | null,
  canHost: boolean
): PlanCommitmentFilter => {
  if (filterRaw === 'joined') return 'joined';
  if (filterRaw === 'hosting' && canHost) return 'hosting';
  return 'joined';
};

export const parsePlanCalendarScope = (
  filterRaw: string | null,
  layout: PlanUpcomingLayout,
  canHost: boolean
): PlanCalendarScope => {
  if (filterRaw === 'all') return 'all';
  if (layout === 'calendar' && !filterRaw) return 'all';
  return parsePlanCommitmentFilter(filterRaw, canHost);
};

export const parsePlanUpcomingLayout = (layoutRaw: string | null): PlanUpcomingLayout =>
  layoutRaw === 'calendar' ? 'calendar' : 'list';

export const planMainTabPath = (
  tab: PlanMainTab = 'upcoming',
  options?: {
    filter?: PlanCommitmentFilter | 'all';
    layout?: PlanUpcomingLayout;
  }
): string => {
  const params = new URLSearchParams();
  params.set('view', 'plans');
  if (tab === 'wishlist') {
    params.set('tab', 'wishlist');
    return `${PLAN_PATH}?${params.toString()}`;
  }
  if (options?.filter === 'joined') {
    params.set('filter', 'joined');
  } else if (options?.filter === 'hosting') {
    params.set('filter', 'hosting');
  } else if (options?.filter === 'all') {
    params.set('filter', 'all');
  }
  if (options?.layout === 'calendar') {
    params.set('layout', 'calendar');
  }
  return `${PLAN_PATH}?${params.toString()}`;
};

/** Hosting lens on My Plans upcoming tab (`filter=hosting`). */
export const planHostingFilterPath = (): string =>
  planMainTabPath('upcoming', { filter: 'hosting' });

export const planJoinedFilterPath = (): string =>
  planMainTabPath('upcoming', { filter: 'joined' });

export const planWishlistTabPath = (): string => planMainTabPath('wishlist');

/** Strip stale query keys; canonical plan uses `tab` / `filter` / `layout` only. */
export const normalizePlanMobileParams = (
  params: URLSearchParams,
  _canHost: boolean
): { changed: boolean } => {
  let changed = false;
  for (const key of ['lens', 'role'] as const) {
    if (params.has(key)) {
      params.delete(key);
      changed = true;
    }
  }

  if (
    params.get('view') === 'plans' &&
    params.get('tab') !== 'wishlist' &&
    !params.get('filter')
  ) {
    params.set('filter', 'joined');
    changed = true;
  }

  if (params.get('tab') === 'wishlist') {
    if (params.has('filter')) {
      params.delete('filter');
      changed = true;
    }
    if (params.has('layout')) {
      params.delete('layout');
      changed = true;
    }
  }

  return { changed };
};
