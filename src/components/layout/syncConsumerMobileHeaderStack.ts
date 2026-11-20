/** Measured bottom edge of the identity header — mobile menu drawer + dimmer align here. */

const CONSUMER_MENU_HEADER_SELECTORS = [
  '[data-hub-identity-header]',
  'header[data-consumer-chrome-header]',
] as const;

/** CSS default when measurement has not run (see `index.css`). */
export const CONSUMER_MOBILE_HEADER_STACK_FALLBACK =
  'calc(var(--safe-top, 0px) + 3.75rem)';

export const syncConsumerMobileHeaderStack = (): void => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const selector of CONSUMER_MENU_HEADER_SELECTORS) {
    const el = document.querySelector(selector);
    if (!(el instanceof HTMLElement)) continue;
    const bottom = Math.ceil(el.getBoundingClientRect().bottom);
    if (bottom > 0) {
      root.style.setProperty('--consumer-mobile-header-stack', `${bottom}px`);
      return;
    }
  }
  root.style.removeProperty('--consumer-mobile-header-stack');
};