/**
 * Fixed overlays on md+ stay in the consumer main column (not over `DesktopSideNav`).
 * `--desktop-side-nav-width` is set on `<html>` by `DesktopSideNav`.
 */
export const CONSUMER_MAIN_OVERLAY_INSET =
  'fixed max-md:inset-0 md:inset-y-0 md:right-0 md:left-[var(--desktop-side-nav-width,72px)] md:w-auto';

/**
 * Chat split pane (inbox + thread). Set `--chat-inbox-width` on `.chat-app` when the inbox column is visible.
 */
export const CHAT_SPLIT_OVERLAY_INSET =
  'fixed max-md:inset-0 md:inset-y-0 md:right-0 md:left-[calc(var(--desktop-side-nav-width,72px)+var(--chat-inbox-width,0px))] md:w-auto';

/** Left edge of the consumer overlay region (side nav + optional chat inbox column). */
export const readConsumerOverlayContentLeftPx = (): number => {
  if (typeof window === 'undefined' || !window.matchMedia('(min-width: 768px)').matches) return 0;
  const navRight =
    document.querySelector('[data-desktop-side-nav]')?.getBoundingClientRect().right ?? 0;
  const chatApp = document.querySelector('.chat-app');
  if (!chatApp) return navRight;
  const columns = chatApp.querySelectorAll(':scope > div');
  if (columns.length < 2) return navRight;
  const inbox = columns[0];
  const thread = columns[1];
  if (!inbox || !thread) return navRight;
  const inboxVisible = window.getComputedStyle(inbox).display !== 'none';
  const threadVisible = window.getComputedStyle(thread).display !== 'none';
  if (inboxVisible && threadVisible) {
    return navRight + inbox.getBoundingClientRect().width;
  }
  return navRight;
};
