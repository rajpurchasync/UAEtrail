import { signInPathForReturn } from '../utils/authReturnContext';
import { isAddWizard, isFindWizard, isOrganizeWizard, type ExploreCompose } from './compose';
import { explorePath } from './routing';

export type ComposeRouteGuardDecision =
  | { type: 'set'; route: ExploreCompose | null }
  | { type: 'sign-in'; href: string }
  | { type: 'become-host' }
  | { type: 'blocked' };

type ComposeRouteGuardContext = {
  user: { id: string } | null | undefined;
  hostGateLoading: boolean;
  canPublish: boolean;
};

/** Auth and host-gate checks before applying an explore compose URL change. */
export const resolveComposeRouteChange = (
  route: ExploreCompose | null,
  ctx: ComposeRouteGuardContext
): ComposeRouteGuardDecision => {
  if (route && isOrganizeWizard(route)) {
    if (!ctx.user) {
      return { type: 'sign-in', href: signInPathForReturn(explorePath({ compose: route })) };
    }
    if (ctx.hostGateLoading) return { type: 'blocked' };
    if (!ctx.canPublish) return { type: 'become-host' };
  }

  if (route && (isFindWizard(route) || isAddWizard(route)) && !ctx.user) {
    return { type: 'sign-in', href: signInPathForReturn(explorePath({ compose: route })) };
  }

  return { type: 'set', route };
};
