import { getAppScrollContainer } from '../config/layoutScroll';
import type { PlanSummaryFocus } from '../components/plan/PlanGoalsProgressSummary';

/** Stable element ids — goals/saved match wishlist section anchors. */
export const PLAN_SUMMARY_FOCUS_ELEMENT_IDS = {
  hosting: 'plan-summary-focus-hosting',
  joined: 'plan-summary-focus-joined',
  goals: 'plan-wishlist-goals',
  saved: 'plan-wishlist-saved',
} as const satisfies Record<PlanSummaryFocus, string>;

const SCROLL_TOP_INSET_PX = 96;
/** After summary stat tap — block list row activation (mobile ghost-click after scroll). */
const SUMMARY_SCROLL_GUARD_MS = 500;
let summaryScrollGuardUntil = 0;

export const armPlanSummaryFocusScrollGuard = (): void => {
  summaryScrollGuardUntil = performance.now() + SUMMARY_SCROLL_GUARD_MS;
};

export const isPlanSummaryFocusScrollGuardActive = (): boolean =>
  performance.now() < summaryScrollGuardUntil;

const SUMMARY_SCROLL_DEFER_MS = 120;

/** Scroll within `.app-scroll-body` when present (product shell). */
export const scrollElementIntoAppView = (target: HTMLElement): void => {
  const container = getAppScrollContainer();
  if (!container) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const nextTop =
    container.scrollTop + (targetRect.top - containerRect.top) - SCROLL_TOP_INSET_PX;
  container.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
};

/** Scroll the plan hub to the section matching a summary stat (after tab updates). */
export const scrollToPlanSummaryFocus = (focus: PlanSummaryFocus): void => {
  armPlanSummaryFocusScrollGuard();
  const id = PLAN_SUMMARY_FOCUS_ELEMENT_IDS[focus];
  let attempts = 0;
  const run = () => {
    const target = document.getElementById(id);
    if (target) {
      scrollElementIntoAppView(target);
      if (focus === 'goals' || focus === 'saved') {
        target.focus({ preventScroll: true });
      }
      return;
    }
    if (attempts >= 30) return;
    attempts += 1;
    window.setTimeout(run, 50);
  };
  window.setTimeout(() => window.requestAnimationFrame(run), SUMMARY_SCROLL_DEFER_MS);
};
