import type { NavigateFunction } from 'react-router-dom';
import {
  APP_SETTINGS_PATH,
  APP_SETTINGS_SAFETY_PATH,
  MY_CREWS_PATH,
  GROUPS_PATH,
  isNotificationHubPath,
} from '../config/surfacePaths';
import {
  INBOUND_APP_SETTINGS_PATH,
  INBOUND_APP_SETTINGS_SAFETY_PATH,
} from '../config/inboundBookmarkPaths';
import { armViewReturn, peekViewReturnSnapshot, viewReturnPathKey } from './viewReturnMemory';

/**
 * In-app back stack.
 *
 * Mirrors the browser history entries this SPA created (keyed by router
 * `location.key`) so "Back" can return to the screen the member actually came
 * from — a real history POP that restores scroll and focus — instead of a
 * hard-wired parent. The hard-wired parent (`fallbackTo`) is only used when
 * nothing usable is underneath (deep link, fresh tab, reload past the start).
 */
export type BackStackEntry = { key: string; path: string };

export type BackStackState = { entries: BackStackEntry[]; index: number };

export type BackNavType = 'POP' | 'PUSH' | 'REPLACE';

export type BackTarget =
  | { kind: 'pop'; delta: number; path: string }
  | { kind: 'fallback'; path: string };

const STORAGE_KEY = 'uaetrail.back-stack.v1';
const MAX_ENTRIES = 80;

let state: BackStackState = { entries: [], index: -1 };
let loaded = false;
let lastRecordedKey: string | null = null;

const pathnameOf = (pathKey: string): string => {
  const q = pathKey.indexOf('?');
  return q >= 0 ? pathKey.slice(0, q) : pathKey;
};

const load = (): void => {
  if (loaded) return;
  loaded = true;
  if (typeof window === 'undefined') return;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<BackStackState>;
    if (!Array.isArray(parsed.entries) || typeof parsed.index !== 'number') return;
    const entries = parsed.entries.filter(
      (e): e is BackStackEntry =>
        Boolean(e) && typeof e.key === 'string' && typeof e.path === 'string'
    );
    const index = Math.min(parsed.index, entries.length - 1);
    state = { entries, index };
  } catch {
    state = { entries: [], index: -1 };
  }
};

const persist = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full / disabled — stack still works in memory.
  }
};

export const getBackStack = (): BackStackState => {
  load();
  return state;
};

/** Test-only reset. */
export const resetBackStack = (): void => {
  state = { entries: [], index: -1 };
  loaded = true;
  lastRecordedKey = null;
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
};

/** Slot for a browser-history position we never saw (external page, cleared storage). */
const UNKNOWN_ENTRY: BackStackEntry = { key: '', path: '' };

const isUnknownEntry = (entry: BackStackEntry | undefined): boolean => !entry || entry.path === '';

const padTo = (entries: BackStackEntry[], length: number): BackStackEntry[] => {
  const out = entries.slice(0, length);
  while (out.length < length) out.push(UNKNOWN_ENTRY);
  return out;
};

/**
 * Pure transition — exported for tests.
 *
 * `historyIndex` is the router's own position in browser history
 * (`window.history.state.idx`); when present it is authoritative so the stack
 * mirrors real history across typed URLs, reloads and the non-unique `default`
 * key of a first load.
 */
export const applyNavigation = (
  prev: BackStackState,
  entry: BackStackEntry,
  navType: BackNavType,
  historyIndex?: number
): BackStackState => {
  if (typeof historyIndex === 'number' && Number.isInteger(historyIndex) && historyIndex >= 0) {
    if (navType === 'POP') {
      const existing = prev.entries[historyIndex];
      if (existing && existing.key === entry.key) {
        const entries = prev.entries.slice();
        entries[historyIndex] = entry;
        return { entries, index: historyIndex };
      }
      // Landed on a history position we did not create (typed URL, new document,
      // cleared storage): keep what is below, forget everything above.
      const entries = padTo(prev.entries, historyIndex);
      entries.push(entry);
      return { entries, index: historyIndex };
    }
    const entries = padTo(prev.entries, historyIndex + (navType === 'REPLACE' ? 1 : 0));
    if (navType === 'REPLACE') entries[historyIndex] = entry;
    else entries.push(entry);
    return { entries: entries.slice(-MAX_ENTRIES), index: Math.min(historyIndex, MAX_ENTRIES - 1) };
  }

  if (navType === 'POP') {
    const i = prev.entries.findIndex((e) => e.key === entry.key);
    if (i >= 0) {
      // Path can change under the same key (replace from within the same entry).
      const entries = prev.entries.slice();
      entries[i] = entry;
      return { entries, index: i };
    }
    // Unknown entry: fresh load / deep link / history before we tracked. Start over.
    return { entries: [entry], index: 0 };
  }
  if (navType === 'REPLACE') {
    if (prev.index < 0 || prev.index >= prev.entries.length) return { entries: [entry], index: 0 };
    const entries = prev.entries.slice();
    entries[prev.index] = entry;
    return { entries, index: prev.index };
  }
  const kept = prev.entries.slice(0, prev.index + 1);
  const entries = [...kept, entry].slice(-MAX_ENTRIES);
  return { entries, index: entries.length - 1 };
};

/** React Router keeps its position in `history.state.idx`. */
const readHistoryIndex = (): number | undefined => {
  if (typeof window === 'undefined') return undefined;
  const idx = (window.history.state as { idx?: unknown } | null)?.idx;
  return typeof idx === 'number' && Number.isInteger(idx) && idx >= 0 ? idx : undefined;
};

/** Called by the layout on every router location change. */
export const recordNavigation = (key: string, pathKey: string, navType: BackNavType): void => {
  load();
  // Every router navigation mints a new key; a repeat is a re-render, not a move.
  if (lastRecordedKey === key) return;
  lastRecordedKey = key;
  state = applyNavigation(state, { key, path: pathKey }, navType, readHistoryIndex());
  persist();
};

/**
 * Screens that should never be a back destination: auth, verification and
 * edit/create forms. Going "back" from the screen that followed them should
 * skip over them to the screen that opened the flow.
 */
const TRANSIENT_EXACT = new Set([
  '/signin',
  '/signup',
  '/sign-in',
  '/sign-up',
  '/verify',
  '/welcome',
  '/forgot-password',
  '/reset-password',
]);

export const isTransientBackPath = (pathname: string): boolean => {
  if (TRANSIENT_EXACT.has(pathname)) return true;
  return /\/(edit|new|create)$/.test(pathname);
};

const isAuthTransientPath = (pathname: string): boolean => TRANSIENT_EXACT.has(pathname);

/**
 * Logical parent for a path when the in-app stack has nothing usable
 * (pasted URL, reload, skipped edit form). Used as a last resort — not instead
 * of the screen that actually opened the current one.
 */
export const inferBackParent = (pathKey: string): string | null => {
  const pathname = pathnameOf(pathKey);
  if (isAuthTransientPath(pathname)) return '/';
  if (pathname === '/profile/edit') return '/profile';
  if (pathname === '/profile/vehicles/new' || /^\/profile\/vehicles\/[^/]+\/edit$/.test(pathname)) {
    return '/profile/vehicles';
  }
  const form = pathname.match(/^(.*)\/(edit|new|create)$/);
  if (form?.[1]) return form[1];
  if (pathname === APP_SETTINGS_SAFETY_PATH || pathname === INBOUND_APP_SETTINGS_SAFETY_PATH) {
    return '/profile';
  }
  if (pathname.startsWith(`${APP_SETTINGS_PATH}/`) && pathname !== APP_SETTINGS_PATH) {
    return APP_SETTINGS_PATH;
  }
  if (
    pathname.startsWith(`${INBOUND_APP_SETTINGS_PATH}/`) &&
    pathname !== INBOUND_APP_SETTINGS_PATH
  ) {
    return APP_SETTINGS_PATH;
  }
  if (pathname === '/profile/history/map') return '/profile/history?view=completed';
  if (pathname.startsWith('/profile/') && pathname !== '/profile') return '/profile';
  if (
    pathname === MY_CREWS_PATH ||
    pathname === GROUPS_PATH ||
    pathname === '/settings/notifications' ||
    pathname.startsWith('/settings/notifications/') ||
    pathname === '/my-requests'
  ) {
    return '/profile';
  }
  if (/^\/my-requests\/[^/]+$/.test(pathname)) return '/my-requests';
  return null;
};

const sameDestination = (left: string, right: string): boolean => {
  const leftKey = viewReturnPathKey(left);
  const rightKey = viewReturnPathKey(right);
  return leftKey === rightKey || pathnameOf(leftKey) === pathnameOf(rightKey);
};

const sanitizeFallbackPath = (fallbackTo: string, currentPathKey: string): string => {
  const fallbackPathname = pathnameOf(viewReturnPathKey(fallbackTo));
  if (!isTransientBackPath(fallbackPathname)) return fallbackTo;
  return inferBackParent(fallbackTo) ?? inferBackParent(currentPathKey) ?? '/explore';
};

export type ResolveBackTargetOptions = {
  /** Extra paths to skip (e.g. auth-gated routes when dismissing sign-in). */
  skipPath?: (pathname: string) => boolean;
};

/**
 * Decide where "Back" goes.
 *
 * Walk the in-app stack beneath the current screen (nearest first) and pop to
 * the first entry that is a real parent in the member's flow:
 *  - skip the exact same URL (save → same screen round trips, reloads);
 *  - skip transient screens (auth, edit forms) — they are never a destination;
 *  - skip other URLs on the same route (tab / filter / sort churn) unless the
 *    declared parent is that same route (chat thread → inbox, plan drill → plan),
 *    in which case the previous state of that route is the parent.
 * On an edit/create form, only the declared item/parent is a pop target — a
 * pasted edit URL must not pop to an unrelated earlier screen, then ping-pong
 * back to the form. Auth screens still pop to the public opener underneath.
 * When nothing qualifies, open the declared parent (`fallbackTo`).
 */
export const resolveBackTarget = (
  stack: BackStackState,
  currentPathKey: string,
  fallbackTo: string,
  options?: ResolveBackTargetOptions
): BackTarget => {
  const fallback = sanitizeFallbackPath(fallbackTo, currentPathKey);
  const fallbackKey = viewReturnPathKey(fallback);
  const currentPathname = pathnameOf(currentPathKey);
  const parentIsSameRoute = pathnameOf(fallbackKey) === currentPathname;
  const currentIsFormTransient =
    isTransientBackPath(currentPathname) && !isAuthTransientPath(currentPathname);
  const skipPath = options?.skipPath;

  for (let i = stack.index - 1; i >= 0; i -= 1) {
    const entry = stack.entries[i];
    // Below here is history we did not create (maybe another site) — never pop into it.
    if (isUnknownEntry(entry)) break;
    if (entry.path === currentPathKey) continue;
    const entryPathname = pathnameOf(entry.path);
    if (isTransientBackPath(entryPathname)) continue;
    if (skipPath?.(entryPathname)) continue;
    // Notification history / preferences / saved are peer Settings panels — do not
    // walk back through them (Saved → Notification settings → Notifications).
    if (isNotificationHubPath(currentPathname) && isNotificationHubPath(entryPathname)) continue;
    if (currentIsFormTransient) {
      if (sameDestination(entry.path, fallbackKey)) {
        return { kind: 'pop', delta: stack.index - i, path: entry.path };
      }
      continue;
    }
    if (entryPathname === currentPathname && !parentIsSameRoute) continue;
    return { kind: 'pop', delta: stack.index - i, path: entry.path };
  }
  return { kind: 'fallback', path: fallback };
};

/**
 * Browser/hardware back landed on an edit/auth screen that should not be a
 * destination (the member had already left it). Continue backward — if that
 * would return to the screen they just left, open its parent instead so the
 * form cannot ping-pong.
 *
 * First load of a pasted edit URL (`previousPathKey` null) is left alone.
 */
export const resolveTransientPopSkip = (
  stack: BackStackState,
  currentPathKey: string,
  previousPathKey: string | null,
  fallbackTo: string
): BackTarget | null => {
  if (!previousPathKey) return null;
  if (!isTransientBackPath(pathnameOf(currentPathKey))) return null;
  const inferred = inferBackParent(currentPathKey) ?? fallbackTo;
  const target = resolveBackTarget(stack, currentPathKey, inferred);
  if (sameDestination(target.path, previousPathKey)) {
    const grandparent = inferBackParent(previousPathKey) ?? '/explore';
    return resolveBackTarget(stack, currentPathKey, grandparent);
  }
  return target;
};

const currentPathKey = (): string => {
  if (typeof window === 'undefined') return '';
  return viewReturnPathKey(window.location.pathname, window.location.search);
};

/** Where the back control will land right now (for labels). */
export const peekBackTarget = (fallbackTo: string, options?: ResolveBackTargetOptions): BackTarget =>
  resolveBackTarget(getBackStack(), currentPathKey(), fallbackTo, options);

const goToBackTarget = (navigate: NavigateFunction, target: BackTarget, focusSelector?: string | null): void => {
  const targetKey = viewReturnPathKey(target.path);
  const focus =
    focusSelector !== undefined ? focusSelector : (peekViewReturnSnapshot(targetKey)?.focusSelector ?? null);
  armViewReturn(targetKey, focus);
  if (target.kind === 'pop') {
    navigate(-target.delta);
    return;
  }
  navigate(target.path, { replace: true });
};

/**
 * Go back to the screen the member came from (history POP → scroll + focus
 * restored by the layout), or open `fallbackTo` as the parent when there is no
 * in-app history. Use this for header Back controls and for "task done" exits
 * (saved a form, cancelled a request) so the completed screen is not left in
 * history.
 */
export const navigateBack = (
  navigate: NavigateFunction,
  fallbackTo: string,
  options?: { focusSelector?: string | null; skipPath?: (pathname: string) => boolean }
): void => {
  const target = peekBackTarget(
    fallbackTo,
    options?.skipPath ? { skipPath: options.skipPath } : undefined
  );
  goToBackTarget(navigate, target, options?.focusSelector);
};

/**
 * After a history POP lands on a transient screen, continue backward. Returns
 * true when a follow-up navigation was started.
 */
export const skipTransientIfPoppedOnto = (
  navigate: NavigateFunction,
  currentPathKeyValue: string,
  previousPathKey: string | null
): boolean => {
  const fallback = inferBackParent(currentPathKeyValue) ?? '/explore';
  const target = resolveTransientPopSkip(
    getBackStack(),
    currentPathKeyValue,
    previousPathKey,
    fallback
  );
  if (!target) return false;
  goToBackTarget(navigate, target);
  return true;
};
