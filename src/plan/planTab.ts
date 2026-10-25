import { PLAN_PATH } from '../config/surfacePaths';

/** Primary Plan mobile tabs (bottom of Plan chrome). */
export type PlanMainTab = 'upcoming' | 'wishlist';

export const PLAN_MAIN_TABS: { key: PlanMainTab; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'wishlist', label: 'Wishlist' },
];

/** Upcoming feed filter — hosting includes “looking for company” posts. */
export type PlanCommitmentFilter = 'hosting' | 'joined';

export type PlanUpcomingLayout = 'list' | 'calendar';

export const parsePlanMainTab = (
  tabRaw: string | null,
  lensRaw: string | null
): PlanMainTab => {
  if (tabRaw === 'wishlist') return 'wishlist';
  if (lensRaw === 'saved' || lensRaw === 'goals') return 'wishlist';
  return 'upcoming';
};

export const parsePlanCommitmentFilter = (
  filterRaw: string | null,
  roleRaw: string | null,
  canHost: boolean
): PlanCommitmentFilter => {
  if (filterRaw === 'joined') return 'joined';
  if (filterRaw === 'hosting' && canHost) return 'hosting';
  if (roleRaw === 'joined') return 'joined';
  if (roleRaw === 'hosted' && canHost) return 'hosting';
  return canHost ? 'hosting' : 'joined';
};

export const parsePlanUpcomingLayout = (
  layoutRaw: string | null,
  lensRaw: string | null
): PlanUpcomingLayout => {
  if (layoutRaw === 'calendar' || lensRaw === 'calendar') return 'calendar';
  return 'list';
};

export const planMainTabPath = (
  tab: PlanMainTab = 'upcoming',
  options?: {
    filter?: PlanCommitmentFilter;
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
  }
  if (options?.layout === 'calendar') {
    params.set('layout', 'calendar');
  }
  return `${PLAN_PATH}?${params.toString()}`;
};

export const planHostingFilterPath = (): string =>
  planMainTabPath('upcoming', { filter: 'hosting' });

export const planJoinedFilterPath = (): string =>
  planMainTabPath('upcoming', { filter: 'joined' });

export const planWishlistTabPath = (): string => planMainTabPath('wishlist');

/** Map legacy `?lens=` deep links into tab / layout (mutates params). */
export const normalizePlanMobileParams = (
  params: URLSearchParams,
  canHost: boolean
): { changed: boolean } => {
  let changed = false;
  const lens = params.get('lens');

  if (lens === 'saved' || lens === 'goals') {
    params.set('tab', 'wishlist');
    params.delete('lens');
    changed = true;
  } else if (lens === 'calendar') {
    params.set('layout', 'calendar');
    params.delete('lens');
    changed = true;
  } else if (lens === 'schedule') {
    params.delete('lens');
    changed = true;
  }

  const role = params.get('role');
  if (role === 'hosted' && canHost) {
    params.set('filter', 'hosting');
    params.delete('role');
    changed = true;
  } else if (role === 'joined') {
    params.set('filter', 'joined');
    params.delete('role');
    changed = true;
  } else if (role === 'all') {
    params.delete('role');
    if (!params.get('filter') && params.get('tab') !== 'wishlist') {
      params.set('filter', canHost ? 'hosting' : 'joined');
      changed = true;
    }
  }

  if (
    params.get('view') === 'plans' &&
    params.get('tab') !== 'wishlist' &&
    !params.get('filter') &&
    params.get('lens') !== 'availability'
  ) {
    params.set('filter', canHost ? 'hosting' : 'joined');
    changed = true;
  }

  if (params.get('tab') === 'wishlist') {
    params.delete('filter');
    params.delete('layout');
  }

  if (lens === 'availability' && params.get('tab') !== 'wishlist') {
    // Keep availability as lens for deep links until moved to profile sheet.
  }

  return { changed };
};
