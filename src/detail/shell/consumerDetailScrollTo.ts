import { getAppScrollContainer } from '../../config/layoutScroll';

/** Nearest overflow scroller for member entity detail (modal shell or app root). */
export const findEntityDetailScrollRoot = (from?: Element | null): HTMLElement | null => {
  if (from instanceof HTMLElement) {
    const nearest = from.closest<HTMLElement>(
      '[data-entity-detail-scroll],[data-consumer-detail-scroll]'
    );
    if (nearest) return nearest;
    const shell = from.closest<HTMLElement>('[data-entity-detail-scroll-shell]');
    if (shell) {
      const inner = shell.querySelector<HTMLElement>('[data-entity-detail-scroll]');
      if (inner) return inner;
    }
  }

  const modal = document.querySelector<HTMLElement>('[data-activity-detail-modal-shell]');
  const modalScroll = modal?.querySelector<HTMLElement>(
    '[data-entity-detail-scroll],[data-consumer-detail-scroll]'
  );
  if (modalScroll) return modalScroll;

  let el: HTMLElement | null = (from?.parentElement as HTMLElement | null) ?? null;
  while (el && el !== document.body) {
    const style = getComputedStyle(el);
    const scrollable =
      /(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 2;
    if (scrollable) return el;
    el = el.parentElement;
  }

  return getAppScrollContainer();
};

const jumpNavOffset = (): number => {
  const jump = document.querySelector<HTMLElement>('[data-consumer-detail-jump-nav]');
  return jump?.getBoundingClientRect().height ?? 0;
};

const headerPadPx = (root: HTMLElement): number => {
  const pad = getComputedStyle(root).getPropertyValue('--detail-header-pad').trim();
  const n = parseFloat(pad);
  if (Number.isFinite(n) && n > 0) return n;
  // Modal header is in-flow above the scroller — only honor an explicit CSS pad.
  return 0;
};

const preferMainColumnScrollTarget = (candidates: HTMLElement[]): HTMLElement | null => {
  const visible = candidates.filter((el) => el.getClientRects().length > 0 && el.offsetParent !== null);
  if (visible.length === 0) return null;
  const main = visible.find((el) => !el.closest('aside[aria-label="Join and actions"]'));
  return main ?? visible[0] ?? null;
};

const scrollRootOffsetTop = (node: HTMLElement, root: HTMLElement): number => {
  let top = 0;
  let el: HTMLElement | null = node;
  let hops = 0;
  while (el && el !== root && hops < 48) {
    top += el.offsetTop;
    const parent = el.offsetParent as HTMLElement | null;
    if (!parent || parent === el) break;
    el = parent;
    hops += 1;
  }
  if (el === root) return top;
  const rootTop = root.getBoundingClientRect().top;
  const nodeTop = node.getBoundingClientRect().top;
  return root.scrollTop + (nodeTop - rootTop);
};

/** Scroll in-page section anchors inside the detail scroller (hash links break with nested overflow). */
export const scrollEntityDetailToId = (
  id: string,
  behavior: ScrollBehavior = 'smooth'
): boolean => {
  const candidates = document.querySelectorAll<HTMLElement>(`#${CSS.escape(id)}`);
  const target =
    preferMainColumnScrollTarget([...candidates]) ?? document.getElementById(id);
  if (!target) return false;

  const root = findEntityDetailScrollRoot(target);
  if (!root) {
    target.scrollIntoView({ behavior, block: 'start' });
    return true;
  }

  const extra = headerPadPx(root) + jumpNavOffset() + 6;
  const inStickyAside = Boolean(target.closest('aside[aria-label="Join and actions"]'));
  let next: number;
  if (inStickyAside) {
    const grid = target.closest('[data-detail-page-shell]')?.querySelector<HTMLElement>('.md\\:grid');
    const scrollToEl = grid ?? target;
    next = scrollRootOffsetTop(scrollToEl, root) - extra;
  } else {
    const rootTop = root.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top;
    next = root.scrollTop + (targetTop - rootTop) - extra;
  }

  root.scrollTo({ top: Math.max(0, next), behavior });
  if (typeof window !== 'undefined' && window.location.hash !== `#${id}`) {
    window.history.replaceState(null, '', `#${id}`);
  }
  return true;
};

/** @deprecated Use {@link findEntityDetailScrollRoot}. */
export const findConsumerDetailScrollRoot = findEntityDetailScrollRoot;

/** @deprecated Use {@link scrollEntityDetailToId}. */
export const scrollConsumerDetailToId = scrollEntityDetailToId;
