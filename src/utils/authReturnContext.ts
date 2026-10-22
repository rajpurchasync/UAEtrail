import type { NavigateFunction } from 'react-router-dom';
import { signInPath, signUpPath } from '../config/surfacePaths';

interface LocationLike {
  pathname: string;
  search: string;
  hash?: string;
}

interface AuthReturnContext {
  from: string;
  scrollY: number;
  focusSelector?: string;
}

const AUTH_RETURN_CONTEXT_STORAGE_KEY = 'uaetrail.auth.return-context';

/** After auth, reopen join UI when `1` (activity detail or explore deep link). */
export const AUTH_RESUME_JOIN_QUERY = 'join';

/** After auth, open invite-friends sheet on activity detail. */
export const AUTH_RESUME_INVITE_FRIENDS_QUERY = 'inviteFriends';

/** On `/chat`, resolve activity crew thread when `1` (with `activity` id). */
export const AUTH_RESUME_CREW_CHAT_QUERY = 'crewChat';

export const ACTIVITY_JOIN_CTA_SELECTOR = '[data-activity-join-cta]';
export const EXPLORE_JOIN_CTA_SELECTOR = '[data-explore-join-cta]';

const getSafeWindow = (): Window | null => (typeof window === 'undefined' ? null : window);

const buildPathFromLocation = (location: LocationLike, overrideHash?: string): string => {
  const hash = overrideHash ?? location.hash ?? '';
  return `${location.pathname}${location.search}${hash}`;
};

const withAuthResumeFlags = (
  path: string,
  flags: { join?: boolean; inviteFriends?: boolean }
): string => {
  if (!flags.join && !flags.inviteFriends) return path;
  const hashIndex = path.indexOf('#');
  const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : '';
  const queryIndex = withoutHash.indexOf('?');
  const pathname = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const search = queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : '';
  const params = new URLSearchParams(search);
  if (flags.join) params.set(AUTH_RESUME_JOIN_QUERY, '1');
  if (flags.inviteFriends) params.set(AUTH_RESUME_INVITE_FRIENDS_QUERY, '1');
  const qs = params.toString();
  return `${pathname}${qs ? `?${qs}` : ''}${hash}`;
};

export const withAuthResumeQuery = (path: string, options?: { join?: boolean }): string =>
  withAuthResumeFlags(path, { join: options?.join });

export const withAuthResumeInviteFriends = (path: string): string =>
  withAuthResumeFlags(path, { inviteFriends: true });

/** Build sign-in URL for a known return path (no scroll capture). */
export const signInPathForReturn = (
  returnPath: string,
  options?: { focusSelector?: string }
): string =>
  signInPath({ redirect: returnPath, focus: options?.focusSelector });

export const buildSignInRedirect = (
  location: LocationLike,
  options?: { focusSelector?: string; hash?: string; returnPath?: string }
): { href: string; signUpHref: string; from: string } => {
  const from = options?.returnPath ?? buildPathFromLocation(location, options?.hash);
  const win = getSafeWindow();
  const scrollY = win ? Math.max(0, Math.round(win.scrollY)) : undefined;
  const focus = options?.focusSelector;
  return {
    from,
    href: signInPath({
      redirect: from,
      focus,
      scrollY,
    }),
    signUpHref: signUpPath({
      redirect: from,
      focus,
      scrollY,
    }),
  };
};

export const buildAuthGateUrls = (
  location: LocationLike,
  options?: { returnPath?: string; focusSelector?: string }
): { signInHref: string; signUpHref: string; from: string } => {
  const built = buildSignInRedirect(location, {
    returnPath: options?.returnPath,
    focusSelector: options?.focusSelector,
  });
  return {
    signInHref: built.href,
    signUpHref: built.signUpHref,
    from: built.from,
  };
};

export const navigateToAuthGate = (
  navigate: NavigateFunction,
  location: LocationLike,
  options?: { returnPath?: string; focusSelector?: string }
): void => {
  const { signInHref, from } = buildAuthGateUrls(location, options);
  navigate(signInHref, { state: { from } });
};

export const parseAuthReturnContextFromSearch = (
  searchParams: URLSearchParams,
  from: string | undefined
): AuthReturnContext | null => {
  if (!from) return null;
  const rawScrollY = searchParams.get('scrollY');
  const parsedScrollY = rawScrollY ? Number.parseInt(rawScrollY, 10) : Number.NaN;
  const scrollY = Number.isFinite(parsedScrollY) && parsedScrollY >= 0 ? parsedScrollY : 0;
  const focusSelector = searchParams.get('focus')?.trim() || undefined;
  return { from, scrollY, focusSelector };
};

export const saveAuthReturnContext = (context: AuthReturnContext): void => {
  const win = getSafeWindow();
  if (!win) return;
  win.sessionStorage.setItem(AUTH_RETURN_CONTEXT_STORAGE_KEY, JSON.stringify(context));
};

export const loadAuthReturnContext = (): AuthReturnContext | null => {
  const win = getSafeWindow();
  if (!win) return null;
  const raw = win.sessionStorage.getItem(AUTH_RETURN_CONTEXT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthReturnContext;
    if (!parsed.from || typeof parsed.from !== 'string') return null;
    return {
      from: parsed.from,
      scrollY: Number.isFinite(parsed.scrollY) && parsed.scrollY >= 0 ? parsed.scrollY : 0,
      focusSelector: parsed.focusSelector?.trim() || undefined,
    };
  } catch {
    return null;
  }
};

export const clearAuthReturnContext = (): void => {
  const win = getSafeWindow();
  if (!win) return;
  win.sessionStorage.removeItem(AUTH_RETURN_CONTEXT_STORAGE_KEY);
};
