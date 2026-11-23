/** Plan sheet launcher — goals and wishlist only (not compose wire). */
export const PLAN_SHEET_QUERY_KEY = 'planSheet';

export const PLAN_ADD_STEPS = ['menu', 'goal', 'wishlist'] as const;
type PlanAddStep = (typeof PLAN_ADD_STEPS)[number];

export const parsePlanAddQuery = (params: Pick<URLSearchParams, 'get'>): PlanAddStep | null => {
  const raw = params.get(PLAN_SHEET_QUERY_KEY);
  if (raw === 'menu' || raw === 'goal' || raw === 'wishlist') return raw;
  return null;
};

export const setPlanAddQuery = (params: URLSearchParams, step: PlanAddStep): void => {
  params.set(PLAN_SHEET_QUERY_KEY, step);
};

export const clearPlanAddQuery = (params: URLSearchParams): void => {
  params.delete(PLAN_SHEET_QUERY_KEY);
};