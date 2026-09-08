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

const getSafeWindow = (): Window | null => (typeof window === 'undefined' ? null : window);

const buildPathFromLocation = (location: LocationLike, overrideHash?: string): string => {
  const hash = overrideHash ?? location.hash ?? '';
  return `${location.pathname}${location.search}${hash}`;
};

export const buildSignInRedirect = (
  location: LocationLike,
  options?: { focusSelector?: string; hash?: string }
): { href: string; from: string } => {
  const from = buildPathFromLocation(location, options?.hash);
  const params = new URLSearchParams({ redirect: from });
  const win = getSafeWindow();
  if (win) {
    params.set('scrollY', String(Math.max(0, Math.round(win.scrollY))));
  }
  if (options?.focusSelector) {
    params.set('focus', options.focusSelector);
  }
  return { href: `/signin?${params.toString()}`, from };
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
      focusSelector: parsed.focusSelector?.trim() || undefined
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