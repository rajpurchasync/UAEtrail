import type { PlanHistoryMainView, PlanHistoryRole, PlanUpcomingRole } from './planHubRouting';

/** Which main panel to render on `/plan` or profile history — not a domain entity. */
export type PlanHubContentKey =
  | 'plans-all'
  | 'plans-joined'
  | 'plans-hosted'
  | 'joined-completed'
  | 'hosted-completed'
  | 'self-completed'
  | 'hosted-needs-approval'
  | 'signed-out';

export const resolvePlanHubView = (input: {
  signedIn: boolean;
  mainView: PlanHistoryMainView;
  plansRole: PlanUpcomingRole;
  role: PlanHistoryRole;
  canHost: boolean;
}): PlanHubContentKey => {
  if (!input.signedIn) return 'signed-out';
  if (input.mainView === 'plans') {
    if (input.plansRole === 'hosted') {
      if (!input.canHost) return 'hosted-needs-approval';
      return 'plans-hosted';
    }
    if (input.plansRole === 'joined') return 'plans-joined';
    return 'plans-all';
  }
  if (input.role === 'hosted') {
    if (!input.canHost) return 'hosted-needs-approval';
    return 'hosted-completed';
  }
  if (input.role === 'self') return 'self-completed';
  return 'joined-completed';
};

export const planHubContentShowsJoinedHub = (key: PlanHubContentKey) =>
  key === 'plans-joined' || key === 'plans-all';

export const planHubContentShowsComposeFab = (key: PlanHubContentKey) =>
  key === 'plans-all' || key === 'plans-joined' || key === 'plans-hosted';

export const planHubContentShowsHostedSection = (key: PlanHubContentKey) =>
  key === 'plans-hosted' || key === 'hosted-completed';
