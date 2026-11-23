import type { CreateKindOption } from '../create/CreateKindGrid';
import {
  PLAN_SHEET_QUERY_KEY,
  PLAN_ADD_STEPS,
  clearPlanAddQuery,
  parsePlanAddQuery,
  setPlanAddQuery,
} from '../create/planAddQuery';

export {
  PLAN_SHEET_QUERY_KEY,
  PLAN_ADD_STEPS,
  clearPlanAddQuery,
  parsePlanAddQuery,
  setPlanAddQuery,
};

export type PlanAddStep = (typeof PLAN_ADD_STEPS)[number];

/** Plan hub FAB — commitments, not Explore discovery. */
export const PLAN_ADD_FAB_LABEL = 'Add a Plan';
export const PLAN_ADD_MENU_TITLE = 'Add a Plan';

export const PLAN_GOAL_OPTION_LABEL = 'Set a Goal';
export const PLAN_WANT_TO_GO_LABEL = 'Want to go';
export const PLAN_GOALS_SECTION_TITLE = 'Goals';
export const PLAN_WANT_TO_GO_SECTION_TITLE = 'Want to go';

export const PLAN_ADD_OPTION_IDS = ['goal', 'wishlist'] as const;
export type PlanAddOptionId = (typeof PLAN_ADD_OPTION_IDS)[number];

/** Plan-local add flows only — host/availability use compose (`createFlowPath`). */
export const PLAN_ADD_OPTIONS: ReadonlyArray<CreateKindOption<PlanAddOptionId>> = [
  { id: 'goal', label: PLAN_GOAL_OPTION_LABEL, emoji: '🎯' },
  { id: 'wishlist', label: PLAN_WANT_TO_GO_LABEL, emoji: '📍' },
];

export const PLAN_WISHLIST_PICK_TITLE = PLAN_WANT_TO_GO_LABEL;
