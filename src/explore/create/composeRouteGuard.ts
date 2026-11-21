/** Unified route gate for Host · Add · Availability — sign-in only; publish gate stays in hosting wizard. */
import { signInPathForReturn } from '../../utils/authReturnContext';
import {
  isAddWizard,
  isAvailabilityFixedWizard,
  isAvailabilityOpenWizard,
  isComposeMenu,
  isHostWizard,
  type ExploreCompose,
} from '../compose';
import { buildComposeAuthReturnPath } from './guestComposeResume';
import { explorePath } from '../routing';

export type ComposeRouteGuardDecision =
  | { type: 'set'; route: ExploreCompose | null }
  | { type: 'sign-in'; href: string };

type ComposeRouteGuardContext = {
  user: { id: string } | null | undefined;
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
    isAvailabilityFixedWizard(route) ||
    isAvailabilityOpenWizard(route) ||
    isAddWizard(route)
  );
};

/** Auth before applying a `?compose=` URL change — capability gates live in wizards. */
export const resolveComposeRouteChange = (
  route: ExploreCompose | null,
  ctx: ComposeRouteGuardContext
): ComposeRouteGuardDecision => {
  if (route && isHostWizard(route)) {
    if (!ctx.user) {
      return { type: 'sign-in', href: signInPathForReturn(composeAuthReturnPath(route, ctx)) };
    }
    // Host publish gate runs in the hosting wizard (publish step) — not before `?compose=host:*` opens.
  }

  if (
    route &&
    (isAvailabilityFixedWizard(route) ||
      isAvailabilityOpenWizard(route) ||
      isAddWizard(route)) &&
    !ctx.user
  ) {
    return { type: 'sign-in', href: signInPathForReturn(composeAuthReturnPath(route, ctx)) };
  }

  return { type: 'set', route };
};
