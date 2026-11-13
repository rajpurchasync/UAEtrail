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
import { buildComposeAuthReturnPath } from './guestComposeResume';
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
  /** Current surface — create session stays here, not bounced to Explore. */
  resumePathname?: string;
  resumeSearch?: string;
};

const composeAuthReturnPath = (
  route: ExploreCompose,
  ctx: ComposeRouteGuardContext
): string => {
  if (ctx.resumePathname) {
    return buildComposeAuthReturnPath(ctx.resumePathname, ctx.resumeSearch ?? '', route);
  }
  return explorePath({ compose: route });
};

/** Create wizards require a signed-in member; FAB menu drill-down stays public until a wizard opens. */
export const composeRouteRequiresAuth = (route: ExploreCompose | null): boolean => {
  if (!route) return false;
  if (isComposeMenu(route)) return false;
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
  if (route && isHostWizard(route)) {
    if (!ctx.user) {
      return { type: 'sign-in', href: signInPathForReturn(composeAuthReturnPath(route, ctx)) };
    }
    if (ctx.hostGateLoading) return { type: 'blocked' };
    if (!ctx.canPublish) {
      const returnTo = composeAuthReturnPath(route, ctx);
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
    return { type: 'sign-in', href: signInPathForReturn(composeAuthReturnPath(route, ctx)) };
  }

  return { type: 'set', route };
};
