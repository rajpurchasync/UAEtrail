export type ConsumerDetailSectionTone =
  | 'neutral'
  | 'emerald'
  | 'sky'
  | 'amber'
  | 'violet'
  | 'rose'
  | 'slate'
  | 'indigo';

const scrollMt = 'scroll-mt-24 md:scroll-mt-28 lg:scroll-mt-8';

/** Bordered panel only — vertical rhythm comes from parent `space-y-3` / grid `gap-3`. */
export const CONSUMER_DETAIL_SECTION_SHELL =
  'relative overflow-visible rounded-xl border-2 p-4 pt-7 lg:rounded-lg lg:p-3 lg:pt-6';

export const CONSUMER_DETAIL_SECTION_LABEL =
  'absolute start-3 top-0 z-10 max-w-[calc(100%-1.5rem)] -translate-y-1/2 truncate rounded-md border-2 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] shadow-sm ring-2 ring-white dark:ring-neutral-950 lg:text-[9px]';

const bodyText = 'text-neutral-800 dark:text-neutral-100';

export const CONSUMER_DETAIL_SECTION_TONE: Record<
  ConsumerDetailSectionTone,
  { section: string; label: string; body: string }
> = {
  neutral: {
    section: `border-neutral-200/90 bg-neutral-50/95 dark:border-neutral-700 dark:bg-neutral-900/90 ${scrollMt}`,
    label: 'border-neutral-300 bg-white text-neutral-600 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200',
    body: bodyText,
  },
  slate: {
    section: `border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-slate-50/40 dark:border-neutral-700 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 ${scrollMt}`,
    label: 'border-slate-300 bg-white text-slate-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200',
    body: bodyText,
  },
  emerald: {
    section: `border-emerald-200/90 bg-white dark:border-emerald-900/60 dark:bg-neutral-900 ${scrollMt}`,
    label: 'border-emerald-300 bg-white text-emerald-900 dark:border-emerald-800 dark:bg-neutral-900 dark:text-emerald-100',
    body: bodyText,
  },
  sky: {
    section: `border-sky-200/90 bg-gradient-to-br from-sky-50/95 via-white to-white dark:border-sky-900/50 dark:from-sky-950/35 dark:via-neutral-900 dark:to-neutral-950 ${scrollMt}`,
    label: 'border-sky-300 bg-white text-sky-900 dark:border-sky-800 dark:bg-neutral-900 dark:text-sky-100',
    body: bodyText,
  },
  amber: {
    section: `border-amber-200/85 bg-gradient-to-br from-amber-50/90 via-white to-white dark:border-amber-900/50 dark:from-amber-950/35 dark:via-neutral-900 dark:to-neutral-950 ${scrollMt}`,
    label: 'border-amber-300 bg-white text-amber-950 dark:border-amber-800 dark:bg-neutral-900 dark:text-amber-100',
    body: bodyText,
  },
  violet: {
    section: `border-violet-200/85 bg-gradient-to-br from-violet-50/80 via-white to-white dark:border-violet-900/50 dark:from-violet-950/35 dark:via-neutral-900 dark:to-neutral-950 ${scrollMt}`,
    label: 'border-violet-300 bg-white text-violet-900 dark:border-violet-800 dark:bg-neutral-900 dark:text-violet-100',
    body: bodyText,
  },
  rose: {
    section: `border-rose-200/85 bg-gradient-to-br from-rose-50/75 via-white to-white dark:border-rose-900/50 dark:from-rose-950/35 dark:via-neutral-900 dark:to-neutral-950 ${scrollMt}`,
    label: 'border-rose-300 bg-white text-rose-900 dark:border-rose-800 dark:bg-neutral-900 dark:text-rose-100',
    body: bodyText,
  },
  indigo: {
    section: `border-indigo-200/85 bg-gradient-to-br from-indigo-50/80 via-white to-white dark:border-indigo-900/50 dark:from-indigo-950/35 dark:via-neutral-900 dark:to-neutral-950 ${scrollMt}`,
    label: 'border-indigo-300 bg-white text-indigo-900 dark:border-indigo-800 dark:bg-neutral-900 dark:text-indigo-100',
    body: bodyText,
  },
};

/** Legacy activity open-section tone → shared section tone. */
export const consumerDetailLogisticsTone = 'sky' as const satisfies ConsumerDetailSectionTone;
export const consumerDetailPrepTone = 'amber' as const satisfies ConsumerDetailSectionTone;
