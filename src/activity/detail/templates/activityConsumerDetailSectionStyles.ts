import {
  MOBILE_PRODUCT_HEADER_FROSTED,
  MOBILE_PRODUCT_HEADER_TRANSITION,
} from '../../../config/consumerScrollChrome';

/** Visual tokens for consumer activity detail — each block reads as a different job. */

export const CONSUMER_DETAIL_SECTION_TITLE =
  'text-[13px] font-bold uppercase tracking-wide text-neutral-500 lg:text-[11px] lg:tracking-[0.08em]';

const CONSUMER_DETAIL_CHROME_PAD = 'px-3 pb-safe pt-3';

/** Sticky engagement bar — frosted while content scrolls underneath. */
export const CONSUMER_DETAIL_STICKY_FOOTER_FROSTED =
  `border-t border-neutral-200/45 bg-white/72 ${CONSUMER_DETAIL_CHROME_PAD} shadow-[0_-10px_36px_rgba(15,23,42,.08)] backdrop-blur-xl transition-[background-color,backdrop-filter,box-shadow] duration-200 supports-[backdrop-filter]:bg-white/55`;

/** Footer at rest (bottom of scroll or no overflow) — solid, no faux glass. */
export const CONSUMER_DETAIL_STICKY_FOOTER_REST =
  `border-t border-neutral-100 bg-white ${CONSUMER_DETAIL_CHROME_PAD} shadow-none transition-[background-color,backdrop-filter,box-shadow] duration-200`;

/** @deprecated Use {@link CONSUMER_DETAIL_STICKY_FOOTER_FROSTED}. */
export const CONSUMER_DETAIL_STICKY_FOOTER = CONSUMER_DETAIL_STICKY_FOOTER_FROSTED;

/** Top chrome at scroll offset zero — glass, so the first pixels of content show through. */
export const CONSUMER_DETAIL_STICKY_HEADER_REST =
  `border-b border-neutral-200/20 bg-white/55 backdrop-blur-2xl shadow-none ${MOBILE_PRODUCT_HEADER_TRANSITION} supports-[backdrop-filter]:bg-white/40`;

/** Top chrome while content scrolls beneath the bar. */
export const CONSUMER_DETAIL_STICKY_HEADER_FROSTED = MOBILE_PRODUCT_HEADER_FROSTED;

/** Full-bleed media on phones; inset rounded stage from tablet up (avoids horizontal overflow). */
export const CONSUMER_DETAIL_MEDIA_BLEED =
  '-mx-4 w-[calc(100%+2rem)] overflow-hidden bg-neutral-100 md:mx-0 md:w-full md:rounded-2xl md:shadow-[0_8px_24px_rgba(28,25,23,.08)] lg:rounded-xl lg:shadow-none';

export const CONSUMER_DETAIL_PANEL = {
  logistics:
    'rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-white p-4 shadow-[0_4px_20px_rgba(14,116,144,.1)] lg:rounded-xl lg:p-3 lg:shadow-none',
  prep:
    'rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/70 via-white to-white p-4 shadow-[0_4px_18px_rgba(180,83,9,.08)] lg:rounded-xl lg:p-3 lg:shadow-none',
  place:
    'flex items-center gap-3.5 rounded-2xl border border-emerald-200/70 bg-white px-4 py-3.5 shadow-[0_6px_24px_rgba(5,150,105,.12)] ring-1 ring-emerald-100/80 active:bg-emerald-50/30 lg:gap-2.5 lg:rounded-xl lg:px-3 lg:py-2.5 lg:shadow-none',
  trust:
    'flex items-center gap-3 rounded-2xl border-l-4 border-emerald-600 bg-neutral-50 px-3.5 py-3.5 shadow-sm ring-1 ring-neutral-100 dark:border-emerald-500 dark:bg-neutral-800/90 dark:ring-neutral-700 lg:gap-2.5 lg:rounded-xl lg:px-3 lg:py-2 lg:shadow-none',
  social:
    'rounded-2xl border border-neutral-200 bg-white px-3.5 py-3.5 shadow-[0_2px_14px_rgba(15,23,42,.06)] dark:border-neutral-700 dark:bg-neutral-900/80 lg:rounded-xl lg:px-3 lg:py-2.5 lg:shadow-none',
} as const;
