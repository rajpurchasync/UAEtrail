import { describe, expect, it } from 'vitest';
import {
  PLAN_ADD_FAB_LABEL,
  PLAN_ADD_OPTIONS,
  PLAN_ADD_QUERY_KEY,
  PLAN_GOAL_OPTION_LABEL,
  PLAN_WANT_TO_GO_LABEL,
  PLAN_WISHLIST_PICK_TITLE,
  clearPlanAddQuery,
  parsePlanAddQuery,
  setPlanAddQuery,
} from './planAdd';

describe('planAdd launcher', () => {
  it('exposes goal and wishlist options without hint copy', () => {
    expect(PLAN_ADD_FAB_LABEL).toBe('Add a Plan');
    expect(PLAN_ADD_OPTIONS.map((row) => row.id)).toEqual(['goal', 'wishlist']);
    expect(PLAN_ADD_OPTIONS.map((row) => row.label)).toEqual([
      PLAN_GOAL_OPTION_LABEL,
      PLAN_WANT_TO_GO_LABEL,
    ]);
    expect(PLAN_WISHLIST_PICK_TITLE).toBe(PLAN_WANT_TO_GO_LABEL);
    expect(PLAN_ADD_OPTIONS.every((row) => row.label && row.emoji && !('hint' in row))).toBe(true);
  });

  it('round-trips planAdd query steps', () => {
    const params = new URLSearchParams('view=plans&filter=joined');
    expect(parsePlanAddQuery(params)).toBeNull();
    setPlanAddQuery(params, 'menu');
    expect(params.get(PLAN_ADD_QUERY_KEY)).toBe('menu');
    expect(parsePlanAddQuery(params)).toBe('menu');
    setPlanAddQuery(params, 'wishlist');
    expect(parsePlanAddQuery(params)).toBe('wishlist');
    clearPlanAddQuery(params);
    expect(parsePlanAddQuery(params)).toBeNull();
    expect(params.get('view')).toBe('plans');
  });
});
