/** Visual hierarchy: segmented main tab vs underline sub-nav (not duplicate pill rows). */

export const MY_CREW_MAIN_TAB_TRACK =
  'inline-flex min-w-0 shrink-0 rounded-full border border-neutral-200/80 bg-neutral-100/80 p-0.5';

export const myCrewMainTabClass = (active: boolean): string =>
  [
    'inline-flex h-9 items-center justify-center rounded-full border px-4 text-[13px] font-semibold transition',
    active
      ? 'border-emerald-800/30 bg-emerald-700 text-white shadow-sm'
      : 'border-transparent bg-transparent text-neutral-600 hover:text-neutral-900',
  ].join(' ');

export const MY_CREW_SUB_NAV_ROW =
  'flex items-center gap-5 overflow-x-auto scroll-smooth border-b border-neutral-200/70 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export const myCrewSubNavTabClass = (active: boolean): string =>
  [
    'relative shrink-0 snap-start whitespace-nowrap pb-2.5 pt-1 text-sm font-semibold transition-colors',
    active
      ? 'text-emerald-800 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-full after:bg-emerald-600 after:content-[""]'
      : 'text-neutral-500 hover:text-neutral-800',
  ].join(' ');