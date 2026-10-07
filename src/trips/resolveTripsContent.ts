import type { TripsMainView, TripsPlansRole, TripsRole } from './tripsRouting';

/** Exactly one main list/hub on /trips — avoids Joined + Hosted UI stacking. */
export type TripsContentKey =
  | 'plans-all'
  | 'plans-joined'
  | 'plans-hosted'
  | 'joined-completed'
  | 'hosted-completed'
  | 'self-completed'
  | 'hosted-needs-approval'
  | 'signed-out';

export const resolveTripsContent = (input: {
  signedIn: boolean;
  mainView: TripsMainView;
  plansRole: TripsPlansRole;
  role: TripsRole;
  canHost: boolean;
}): TripsContentKey => {
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

export const tripsContentShowsJoinedHub = (key: TripsContentKey) =>
  key === 'plans-joined' || key === 'plans-all';

/** Plans → Upcoming compose FAB (joined, all, hosted). */
export const tripsContentShowsComposeFab = (key: TripsContentKey) =>
  key === 'plans-all' || key === 'plans-joined' || key === 'plans-hosted';

export const tripsContentShowsHostedSection = (key: TripsContentKey) =>
  key === 'plans-hosted' || key === 'hosted-completed';
