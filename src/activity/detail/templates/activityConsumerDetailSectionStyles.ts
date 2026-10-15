/** Visual tokens for consumer activity detail — each block reads as a different job. */

export const CONSUMER_DETAIL_SECTION_TITLE =
  'text-[13px] font-bold uppercase tracking-wide text-neutral-500';

export const CONSUMER_DETAIL_PANEL = {
  logistics:
    'rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-white p-4 shadow-[0_4px_20px_rgba(14,116,144,.1)]',
  prep:
    'rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/70 via-white to-white p-4 shadow-[0_4px_18px_rgba(180,83,9,.08)]',
  place:
    'flex items-center gap-3.5 rounded-2xl border border-emerald-200/70 bg-white px-4 py-3.5 shadow-[0_6px_24px_rgba(5,150,105,.12)] ring-1 ring-emerald-100/80 active:bg-emerald-50/30',
  trust:
    'flex items-center gap-3 rounded-2xl border-l-4 border-emerald-600 bg-neutral-50 px-3.5 py-3.5 shadow-sm ring-1 ring-neutral-100',
  social:
    'rounded-2xl border border-neutral-200 bg-white px-3.5 py-3.5 shadow-[0_2px_14px_rgba(15,23,42,.06)]',
} as const;
