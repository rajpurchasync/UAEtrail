import { EXPLORE_BRAND_ACTIVE } from '../config/exploreTheme';

/** List discovery chrome — super-app tokens (not map overlay pills). */

export const LIST_CHROME = {
  pageBg: 'bg-neutral-50',
  chromeBg: 'bg-white/95 backdrop-blur-md',
  chromeBorder: 'border-b border-neutral-200/60 shadow-[0_1px_0_rgba(15,23,42,.04)]',
  maxWidth: 'mx-auto w-full max-w-lg md:max-w-xl lg:max-w-lg',
  horizontalPad: 'px-4 md:px-6',
  menuButton:
    '!bg-neutral-100/90 !text-neutral-700 !border-neutral-200/70 hover:!bg-neutral-200/80',
} as const;

export const LIST_APP_BAR = {
  row: 'flex min-h-12 items-center justify-between gap-3',
  title: 'truncate text-lg font-semibold tracking-tight text-neutral-900',
  guestLink: 'text-lg font-semibold text-emerald-700 active:opacity-80',
} as const;

export const LIST_SEARCH = {
  shell:
    'flex min-h-11 items-center gap-2 rounded-2xl border border-neutral-200/80 bg-white px-3 shadow-[0_1px_2px_rgba(15,23,42,.04)] transition-[box-shadow,border-color] focus-within:border-emerald-200 focus-within:shadow-[0_0_0_3px_rgba(16,185,129,.12)]',
  input:
    'min-w-0 flex-1 bg-transparent text-[15px] font-medium text-neutral-900 outline-none placeholder:font-normal placeholder:text-neutral-400',
  icon: 'h-[17px] w-[17px] shrink-0 text-neutral-400',
  /** Map / refine / category filters — aligned row height. */
  sideAction:
    'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-neutral-100 bg-white shadow-[0_1px_3px_rgba(15,23,42,.06)] transition active:scale-[0.97] hover:bg-neutral-50',
  sideActionMap: '!text-emerald-700',
} as const;

export const LIST_CHIP_SCROLL =
  'flex items-center gap-2 overflow-x-auto scroll-smooth [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export const listChipClass = (active: boolean): string =>
  [
    'inline-flex shrink-0 snap-start items-center rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors active:scale-[0.98]',
    active ? EXPLORE_BRAND_ACTIVE : 'bg-neutral-100 text-neutral-700',
  ].join(' ');

/** Category page pills — compact, single-line scroll rows. */
export const listCategoryPillClass = (active: boolean): string =>
  [
    'inline-flex h-9 shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors active:scale-[0.98]',
    active
      ? 'border-emerald-600/20 bg-emerald-600 text-white shadow-sm'
      : 'border-transparent bg-neutral-100/90 text-neutral-700',
  ].join(' ');

export const LIST_FILTERS_CHIP_BADGE = 'absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white';

export const LIST_CATEGORY_TILE = {
  ring: (selected: boolean) =>
    selected ? 'ring-[2.5px] ring-neutral-900 ring-offset-2 ring-offset-white' : '',
} as const;

export const listFilterIconButtonClass = (): string => LIST_SEARCH.sideAction;

/** Category topic row — floating filters control (over scroll/grid). */
export const LIST_CATEGORY_FLOATING_FILTER =
  'inline-flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200/80 bg-white text-neutral-800 shadow-[0_4px_18px_rgba(15,23,42,.14)] transition active:scale-[0.97] hover:bg-neutral-50';

export const LIST_SECTION_TITLE = 'text-[15px] font-semibold text-neutral-500';

export const LIST_FLOAT_FIXED =
  'fixed z-[1150] transition active:scale-95 md:hidden';

export const LIST_MAP_FLOAT =
  `${LIST_FLOAT_FIXED} inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 shadow-[0_4px_20px_rgba(15,23,42,.12)] ring-1 ring-black/[0.06] backdrop-blur-sm`;

export const LIST_CREATE_FAB =
  `${LIST_FLOAT_FIXED} inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 p-0 text-white shadow-[0_4px_20px_rgba(5,150,105,.45)] hover:bg-emerald-700`;

export const LIST_MAP_FLOAT_POSITION =
  'right-4 bottom-[calc(var(--bottom-nav-height,56px)+var(--safe-bottom,0px)+16px)]';

export const LIST_DESKTOP_MAP_LINK =
  'hidden min-h-10 items-center rounded-full bg-neutral-100 px-4 text-sm font-semibold text-neutral-900 md:inline-flex active:bg-neutral-200';
