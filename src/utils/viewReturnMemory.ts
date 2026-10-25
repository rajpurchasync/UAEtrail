import { getAppScrollContainers } from '../config/layoutScroll';

export type ViewReturnSnapshot = {
  scrollTops: number[];
  focusSelector: string | null;
};

const snapshots = new Map<string, ViewReturnSnapshot>();
let pendingFocusSelector: string | null = null;
let armedPath: string | null = null;
let armedFocus: string | null = null;
let focusCaptureInstalled = false;

export const viewReturnPathKey = (pathname: string, search = ''): string => {
  const path = search ? `${pathname}${search.startsWith('?') ? search : `?${search}`}` : pathname;
  const hashIndex = path.indexOf('#');
  return hashIndex >= 0 ? path.slice(0, hashIndex) : path;
};

const cssEscape = (value: string): string => {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value);
  return value.replace(/["\\]/g, '\\$&');
};

/** Stable selector for the control the member activated before leaving the screen. */
export const focusSelectorFromElement = (target: EventTarget | null): string | null => {
  if (!(target instanceof Element)) return null;
  const el = target.closest('a,button,[data-nav-focus]');
  if (!(el instanceof HTMLElement)) return null;
  const marked = el.getAttribute('data-nav-focus');
  if (marked) return `[data-nav-focus="${cssEscape(marked)}"]`;
  if (el.id) return `#${cssEscape(el.id)}`;
  const href = el.getAttribute('href');
  if (href && el.tagName === 'A') return `a[href="${cssEscape(href)}"]`;
  return null;
};

export const noteInteractionFocus = (selector: string | null): void => {
  pendingFocusSelector = selector;
};

export const installViewReturnFocusCapture = (): void => {
  if (focusCaptureInstalled || typeof document === 'undefined') return;
  focusCaptureInstalled = true;
  document.addEventListener(
    'click',
    (event) => {
      const selector = focusSelectorFromElement(event.target);
      if (selector) pendingFocusSelector = selector;
    },
    true
  );
};

export const captureLeavingView = (pathKey: string): void => {
  if (typeof document === 'undefined') return;
  const containers = getAppScrollContainers();
  snapshots.set(pathKey, {
    scrollTops: containers.map((el) => el.scrollTop),
    focusSelector: pendingFocusSelector,
  });
  pendingFocusSelector = null;
};

/** Explicit back (not browser POP) should restore this path, optionally a different control. */
export const armViewReturn = (pathKey: string, focusSelector?: string | null): void => {
  armedPath = viewReturnPathKey(pathKey);
  armedFocus = focusSelector ?? null;
};

export const takeArmedViewReturn = (
  pathKey: string
): { focusSelector: string | null } | null => {
  if (!armedPath) return null;
  const armed = armedPath;
  const focusSelector = armedFocus;
  armedPath = null;
  armedFocus = null;
  if (armed !== pathKey) return null;
  return { focusSelector };
};

export const peekViewReturnSnapshot = (pathKey: string): ViewReturnSnapshot | null =>
  snapshots.get(pathKey) ?? null;

/** Restore scroll, then focus. Returns false while the focused node is not mounted yet. */
export const applyViewReturnSnapshot = (
  snapshot: ViewReturnSnapshot,
  focusOverride?: string | null
): boolean => {
  const containers = getAppScrollContainers();
  if (containers.length === 0) return false;
  containers.forEach((el, index) => {
    const top = snapshot.scrollTops[index];
    if (typeof top === 'number') el.scrollTop = top;
  });
  const selector = focusOverride || snapshot.focusSelector;
  if (!selector) return true;
  const target = document.querySelector<HTMLElement>(selector);
  if (!target) return false;
  target.focus({ preventScroll: true });
  return true;
};
