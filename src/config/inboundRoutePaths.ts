/**
 * Bookmark-only URL segments — `App.tsx` redirects to canonical routes in surfacePaths.
 * Do not link these in product UI; use the canonical path helpers instead.
 */

export const INBOUND_BECOME_HOST_PATH = '/become-host' as const;
export const INBOUND_BECOME_ORGANIZER_PATH = '/become-organizer' as const;

/** Retired publishing console prefixes (no SPA routes — chrome/auth matchers only). */
export const INBOUND_RETIRED_CONSOLE_PREFIXES = ['/host', '/operator', '/organizer'] as const;
