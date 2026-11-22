/** Unified route gate for activity · place · intent — sign-in only; publish gate stays in hosting wizard. */
import { signInPathForReturn } from '../../utils/authReturnContext';
import {
  isPlaceWizard,
  isIntentFixedWizard,
  isIntentOpenWizard,
  isComposeMenu,
  isActivityWizard,
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
    isActivityWizard(route) ||
    isIntentFixedWizard(route) ||
    isIntentOpenWizard(route) ||
    isPlaceWizard(route)
  );
};

/** Auth before applying a `?compose=` URL change — capability gates live in wizards. */
export const resolveComposeRouteChange = (
  route: ExploreCompose | null,
  ctx: ComposeRouteGuardContext
): ComposeRouteGuardDecision => {
  if (route && isActivityWizard(route)) {
    if (!ctx.user) {
      return { type: 'sign-in', href: signInPathForReturn(composeAuthReturnPath(route, ctx)) };
    }
    // Publish gate runs in the hosting wizard (publish step) — not before `?compose=activity:*` opens.
  }

  if (
    route &&
    (isIntentFixedWizard(route) ||
      isIntentOpenWizard(route) ||
      isPlaceWizard(route)) &&
    !ctx.user
  ) {
    return { type: 'sign-in', href: signInPathForReturn(composeAuthReturnPath(route, ctx)) };
  }

  return { type: 'set', route };
};