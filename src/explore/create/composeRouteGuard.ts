import { signInPathForReturn } from '../../utils/authReturnContext';
import {
  memberPublishGateHref,
  memberPublishGateInputFromMemberStatus,
} from '../../utils/memberPublishGate';
import {
  isAddWizard,
  isComposeMenu,
  isSeekFixedWizard,
  isHostWizard,
  isSeekFlexibleWizard,
  type ExploreCompose,
} from '../compose';
import { explorePath } from '../routing';

export type ComposeRouteGuardDecision =
  | { type: 'set'; route: ExploreCompose | null }
  | { type: 'sign-in'; href: string }
  | { type: 'complete-profile'; href: string }
  | { type: 'blocked' };

type ComposeRouteGuardContext = {
  user: { id: string } | null | undefined;
  hostGateLoading: boolean;
  canPublish: boolean;
  profileComplete: boolean;
};

/** Create wizards and FAB submenu picks that require a signed-in member. */
export const composeRouteRequiresAuth = (route: ExploreCompose | null): boolean => {
  if (!route) return false;
  if (isComposeMenu(route)) return Boolean(route.intent);
  return (
    isHostWizard(route) ||
    isSeekFixedWizard(route) ||
    isSeekFlexibleWizard(route) ||
    isAddWizard(route)
  );
};

/** Auth and host-gate checks before applying a `?compose=` URL change. */
export const resolveComposeRouteChange = (
  route: ExploreCompose | null,
  ctx: ComposeRouteGuardContext
): ComposeRouteGuardDecision => {
  if (route && isComposeMenu(route) && route.intent && !ctx.user) {
    return { type: 'sign-in', href: signInPathForReturn(explorePath({ compose: route })) };
  }

  if (route && isHostWizard(route)) {
    if (!ctx.user) {
      return { type: 'sign-in', href: signInPathForReturn(explorePath({ compose: route })) };
    }
    if (ctx.hostGateLoading) return { type: 'blocked' };
    if (!ctx.canPublish) {
      const returnTo = explorePath({ compose: route });
      return {
        type: 'complete-profile',
        href: memberPublishGateHref(
          returnTo,
          memberPublishGateInputFromMemberStatus({
            viewerUserId: ctx.user?.id ?? null,
            profileComplete: ctx.profileComplete,
            canPublish: ctx.canPublish,
          })
        ),
      };
    }
  }

  if (
    route &&
    (isSeekFixedWizard(route) || isSeekFlexibleWizard(route) || isAddWizard(route)) &&
    !ctx.user
  ) {
    return { type: 'sign-in', href: signInPathForReturn(explorePath({ compose: route })) };
  }

  return { type: 'set', route };
};
