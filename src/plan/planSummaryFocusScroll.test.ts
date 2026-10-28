import { describe, expect, it, vi } from 'vitest';
import {
  PLAN_SUMMARY_FOCUS_ELEMENT_IDS,
  scrollElementIntoAppView,
} from './planSummaryFocusScroll';

describe('planSummaryFocusScroll', () => {
  it('maps summary stats to stable section element ids', () => {
    expect(PLAN_SUMMARY_FOCUS_ELEMENT_IDS.hosting).toBe('plan-summary-focus-hosting');
    expect(PLAN_SUMMARY_FOCUS_ELEMENT_IDS.joined).toBe('plan-summary-focus-joined');
    expect(PLAN_SUMMARY_FOCUS_ELEMENT_IDS.goals).toBe('plan-wishlist-goals');
    expect(PLAN_SUMMARY_FOCUS_ELEMENT_IDS.saved).toBe('plan-wishlist-saved');
  });

  it('scrollElementIntoAppView scrolls the app scroll body', () => {
    const container = document.createElement('div');
    container.className = 'app-scroll-body';
    container.scrollTop = 0;
    container.scrollTo = vi.fn();
    const root = document.createElement('main');
    root.id = 'app-scroll-root';
    root.appendChild(container);
    document.body.appendChild(root);

    const target = document.createElement('section');
    target.id = 'plan-wishlist-saved';
    container.appendChild(target);
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      top: 400,
      left: 0,
      right: 0,
      bottom: 500,
      width: 0,
      height: 100,
      x: 0,
      y: 400,
      toJSON: () => ({}),
    });
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      left: 0,
      right: 0,
      bottom: 700,
      width: 0,
      height: 600,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    });

    scrollElementIntoAppView(target);
    expect(container.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ top: 204, behavior: 'smooth' })
    );

    root.remove();
  });
});
