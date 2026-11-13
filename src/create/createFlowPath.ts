import type { ExploreCompose } from '../explore/compose';
import { buildComposeAuthReturnPath } from '../explore/create/guestComposeResume';
import { explorePath } from '../explore/routing';

/**
 * Open a create-flow session on the current product surface.
 * Marketing (`/`) and admin have no create overlay — those go to Explore.
 */
export const createFlowPath = (
  pathname: string,
  search: string,
  route: ExploreCompose
): string => {
  if (!pathname || pathname === '/') return explorePath({ compose: route });
  if (pathname.startsWith('/admin') || pathname.startsWith('/signin') || pathname.startsWith('/signup')) {
    return explorePath({ compose: route });
  }
  if (pathname.startsWith('/publishing') || pathname.startsWith('/hosting')) {
    return explorePath({ compose: route });
  }
  if (
    pathname.startsWith('/explore') ||
    pathname.startsWith('/list') ||
    pathname.startsWith('/plan') ||
    pathname.startsWith('/activity') ||
    pathname.startsWith('/trail') ||
    pathname.startsWith('/camp') ||
    pathname.startsWith('/place') ||
    pathname.startsWith('/venue') ||
    pathname.startsWith('/shop') ||
    pathname.startsWith('/area')
  ) {
    return buildComposeAuthReturnPath(pathname, search, route);
  }
  return explorePath({ compose: route });
};

export const createFlowPathFromWindow = (route: ExploreCompose): string => {
  if (typeof window === 'undefined') return explorePath({ compose: route });
  return createFlowPath(window.location.pathname, window.location.search, route);
};
