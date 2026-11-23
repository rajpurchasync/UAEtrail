import type { PlanHistoryRole } from '../plan/planRouting';

/** Profile history list panel — `/profile/history` only (not My Plans `/plan`). */
export type ProfileHistoryContentKey =
  | 'joined-completed'
  | 'hosted-completed'
  | 'self-completed'
  | 'hosted-needs-approval'
  | 'signed-out';

export const resolveProfileHistoryContentKey = (input: {
  signedIn: boolean;
  role: PlanHistoryRole;
  canHost: boolean;
}): ProfileHistoryContentKey => {
  if (!input.signedIn) return 'signed-out';
  if (input.role === 'hosted') {
    if (!input.canHost) return 'hosted-needs-approval';
    return 'hosted-completed';
  }
  if (input.role === 'self') return 'self-completed';
  return 'joined-completed';
};
