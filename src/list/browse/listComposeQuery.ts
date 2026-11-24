/** Create-flow URL params on list discovery — keep in sync with `src/explore/routing.ts` keys. */
export const LIST_PLAN_WITH_QUERY_KEY = 'planWith';
export const LIST_AVAILABILITY_SLOT_QUERY_KEY = 'availabilitySlot';

export const parseListPlanWithUserId = (
  searchParams: Pick<URLSearchParams, 'get'>
): string | null => searchParams.get(LIST_PLAN_WITH_QUERY_KEY)?.trim() || null;