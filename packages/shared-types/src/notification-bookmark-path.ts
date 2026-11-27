const MESSAGE_PATH_PREFIXES = [
  '/messages',
  '/operator/messages',
  '/publishing/messages',
  '/host/messages',
  '/hosting/messages',
  '/organizer/messages',
] as const;

/** Stale host/operator console path prefixes (notifications, auth return, consumer chrome). */
export const INBOUND_STALE_CONSOLE_PREFIXES = [
  '/publishing',
  '/host',
  '/organizer',
  '/hosting',
] as const;

const CONSOLE_PREFIXES = INBOUND_STALE_CONSOLE_PREFIXES;

const PLAN_PATH = '/plan';
const PROFILE_HISTORY_PATH = '/profile/history';
const JOURNEY_MAP_PATH = '/profile/history/map';
const PROFILE_BADGES_PATH = '/profile/badges';
const PRO_MEMBERSHIP_PATH = '/profile/pro-membership';
const OPERATOR_PREFIX = '/operator';
const CHAT_PATH = '/chat';
const SETTINGS_PATH = '/settings';
const PROFILE_SETTINGS_PREFIX = '/profile/settings';
const PROFILE_SUBMISSIONS_PATH = '/profile/submissions';
const LEGACY_NOTIFICATIONS_PREFIX = '/notifications';
const EXPLORE_PATH = '/explore';
const CREWS_PATH = '/crews';
const BECOME_HOST_PATH = '/become-host';
const BECOME_ORGANIZER_PATH = '/become-organizer';

const INBOUND_PLAN_HUB_PATHNAMES = new Set(['/trips', '/trips/map', '/activities']);

const splitPathSearchHash = (raw: string) => {
  const hashIndex = raw.indexOf('#');
  const withoutHash = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw;
  const hash = hashIndex >= 0 ? raw.slice(hashIndex) : '';
  const queryIndex = withoutHash.indexOf('?');
  const pathname = queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex);
  const search = queryIndex === -1 ? '' : withoutHash.slice(queryIndex);
  return { pathname, search, hash };
};

const joinPath = (pathname: string, search: string, hash: string) => `${pathname}${search}${hash}`;

/** Pathname-level bookmark rewrites (nginx + notifications). */
export const rewriteStaleNotificationBookmarkPath = (raw: string): string | null => {
  if (!raw.startsWith('/')) return null;

  const { pathname, search, hash } = splitPathSearchHash(raw);

  if (pathname === '/my-rewards' || pathname === '/rewards' || pathname === '/trail-points') {
    return joinPath(PROFILE_BADGES_PATH, search, hash);
  }

  if (MESSAGE_PATH_PREFIXES.some((prefix) => pathname === prefix)) {
    return joinPath(CHAT_PATH, search, hash);
  }

  if (pathname === '/host/overview') {
    return joinPath(PRO_MEMBERSHIP_PATH, search, hash);
  }

  if (pathname === BECOME_HOST_PATH || pathname === BECOME_ORGANIZER_PATH) {
    return joinPath(PRO_MEMBERSHIP_PATH, search, hash);
  }

  if (pathname === '/map' || pathname === '/discovery') {
    return joinPath(EXPLORE_PATH, search, hash);
  }

  if (pathname === '/community' || pathname.startsWith('/community/')) {
    return joinPath(EXPLORE_PATH, search, hash);
  }

  if (pathname === '/buddies' || pathname.startsWith('/buddies/')) {
    const suffix = pathname.slice('/buddies'.length);
    return joinPath(`${CREWS_PATH}${suffix}`, search, hash);
  }

  const consolePrefix = CONSOLE_PREFIXES.find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (consolePrefix && !pathname.endsWith('/messages')) {
    const suffix = pathname.slice(consolePrefix.length) || '/overview';
    return joinPath(`${OPERATOR_PREFIX}${suffix}`, search, hash);
  }

  if (pathname === '/profile/my-trips/map') {
    return joinPath(JOURNEY_MAP_PATH, search, hash);
  }

  if (pathname === '/profile/my-trips') {
    return joinPath(PROFILE_HISTORY_PATH, search, hash);
  }

  if (pathname === '/contributions' || pathname.startsWith('/contributions/')) {
    const suffix = pathname.slice('/contributions'.length);
    return joinPath(`${PROFILE_SUBMISSIONS_PATH}${suffix}`, search, hash);
  }

  if (pathname === '/profile/wishlist') {
    return `${PLAN_PATH}?view=plans&tab=wishlist`;
  }

  if (pathname === PROFILE_SETTINGS_PREFIX || pathname.startsWith(`${PROFILE_SETTINGS_PREFIX}/`)) {
    const suffix = pathname.slice(PROFILE_SETTINGS_PREFIX.length);
    return joinPath(`${SETTINGS_PATH}${suffix}`, search, hash);
  }

  if (
    pathname === LEGACY_NOTIFICATIONS_PREFIX ||
    pathname.startsWith(`${LEGACY_NOTIFICATIONS_PREFIX}/`)
  ) {
    const suffix = pathname.slice(LEGACY_NOTIFICATIONS_PREFIX.length);
    return joinPath(`${SETTINGS_PATH}/notifications${suffix}`, search, hash);
  }

  return null;
};

/** `/trips` / `/activities` query shapes → canonical plan or history paths. */
const resolveStalePlanHubNotificationPath = (raw: string): string | null => {
  const { pathname, search, hash: _hash } = splitPathSearchHash(raw);
  if (pathname === '/trips/map' || pathname.endsWith('/trips/map')) {
    const qs = search.replace(/^\?/, '');
    return qs ? `${JOURNEY_MAP_PATH}?${qs}` : JOURNEY_MAP_PATH;
  }

  if (!INBOUND_PLAN_HUB_PATHNAMES.has(pathname)) return null;

  const params = new URLSearchParams(search.replace(/^\?/, ''));
  const view = params.get('view');
  const segment = params.get('segment');
  const inboundTab = params.get('tab');
  const inboundSub = params.get('sub');

  if (view === 'map') {
    const qs = params.toString();
    return qs ? `${JOURNEY_MAP_PATH}?${qs}` : JOURNEY_MAP_PATH;
  }

  const wantsHistory =
    view === 'completed' ||
    view === 'history' ||
    segment === 'completed' ||
    segment === 'past' ||
    inboundSub === 'attended' ||
    (inboundTab === 'joined' && segment === 'completed');

  if (wantsHistory) {
    const next = new URLSearchParams(params);
    next.set('view', 'completed');
    const qs = next.toString();
    return qs ? `${PROFILE_HISTORY_PATH}?${qs}` : `${PROFILE_HISTORY_PATH}?view=completed`;
  }

  if (segment === 'wishlist' || params.get('saved')) {
    return `${PLAN_PATH}?view=plans&tab=wishlist`;
  }

  if (inboundTab === 'joined' && segment === 'upcoming') {
    return `${PLAN_PATH}?view=plans&filter=joined`;
  }

  const next = new URLSearchParams(params);
  next.set('view', 'plans');
  if (segment === 'completed' || segment === 'past') {
    next.delete('segment');
  }
  const qs = next.toString();
  return qs ? `${PLAN_PATH}?${qs}` : PLAN_PATH;
};

/** Single entry for API migration + client `inferNotificationPath` meta.path. */
export const canonicalizeNotificationBookmarkPath = (raw: string): string => {
  if (!raw.startsWith('/')) return raw;
  const planHub = resolveStalePlanHubNotificationPath(raw);
  if (planHub) return planHub;
  const simple = rewriteStaleNotificationBookmarkPath(raw);
  if (simple) return simple;
  return raw;
};