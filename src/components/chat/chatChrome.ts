import { LIST_CHROME } from '../../list/browse/listChromeTheme';

/** Chat hub + thread chrome — align with standalone list discovery (`/list` Trips/Venues). */

export const CHAT_CHROME = {
  hubColumn: `flex h-full min-h-0 w-full flex-col ${LIST_CHROME.pageBg}`,
  hubToolbarPad: `shrink-0 mx-auto w-full ${LIST_CHROME.horizontalPad} ${LIST_CHROME.standaloneMobileInset}`,
  hubListScroll: 'min-h-0 flex-1 overflow-y-auto overscroll-y-contain scroll-touch pb-bottom-nav-safe md:pb-3',
  hubListSurface: 'bg-white md:mx-3 md:rounded-xl md:border md:border-neutral-200/80 md:overflow-hidden',
  sectionLabel:
    'sticky top-0 z-[1] bg-white/95 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500 backdrop-blur-sm md:px-3',
} as const;
