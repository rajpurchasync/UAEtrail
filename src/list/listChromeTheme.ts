import {
  EXPLORE_BRAND_ACTIVE,
  MOBILE_DOCK_PRIMARY,
  MOBILE_DOCK_SECONDARY,
} from '../config/exploreTheme';

/** List discovery chrome — super-app tokens (not map overlay pills). */

export const LIST_CHROME = {
  pageBg: 'bg-neutral-50',
  chromeBg: 'bg-white/95 backdrop-blur-md',
  chromeBorder: 'border-b border-neutral-200/60 shadow-[0_1px_0_rgba(15,23,42,.04)]',
  maxWidth: 'mx-auto w-full max-w-lg md:max-w-xl lg:max-w-lg',
  horizontalPad: 'px-4 md:px-6',
  /** Standalone `/list` — layout supplies identity row; light top pad only. */
  standaloneMobileInset: 'pt-1 pb-2 md:pt-1',
  menuButton:
    '!bg-neutral-100/90 !text-neutral-700 !border-neutral-200/70 hover:!bg-neutral-200/80',
} as const;

export const LIST_APP_BAR = {
  row: 'flex min-h-12 items-center justify-between gap-3 md:min-h-9',
  title: 'truncate text-lg font-semibold tracking-tight text-neutral-900',
  guestLink: 'text-lg font-semibold text-emerald-700 active:opacity-80',
} as const;

export const LIST_SEARCH = {
  shell:
    'flex min-h-11 items-center gap-2 rounded-2xl border border-neutral-200/80 bg-white px-3 shadow-[0_1px_2px_rgba(15,23,42,.04)] transition-[box-shadow,border-color] focus-within:border-emerald-200 focus-within:shadow-[0_0_0_3px_rgba(16,185,129,.12)] md:min-h-9 lg:min-h-8 lg:rounded-xl lg:px-2.5',
  input:
    'min-w-0 flex-1 bg-transparent text-[0.9375rem] font-medium text-neutral-900 outline-none placeholder:font-normal placeholder:text-neutral-400',
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
    'inline-flex shrink-0 snap-start items-center rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors active:scale-[0.98] lg:min-h-8 lg:px-3 lg:py-1',
    active ? EXPLORE_BRAND_ACTIVE : 'bg-neutral-100 text-neutral-700',
  ].join(' ');

/** Events / Places tabs — brand fill on selection (contrast vs track in dark theme). */
export const listExplorerBucketTabClass = (active: boolean): string =>
  [
    'border',
    active
      ? EXPLORE_BRAND_ACTIVE
      : 'border-transparent bg-transparent text-neutral-500 hover:text-neutral-800',
  ].join(' ');

export const listExplorerBucketCountClass = (active: boolean): string =>
  active
    ? 'list-explorer-bucket-count list-explorer-bucket-count--active bg-white text-emerald-900 shadow-sm ring-1 ring-emerald-950/10'
    : 'bg-neutral-200/90 text-neutral-600';

/** Sort menu trigger — no `!` on text colors so dark-theme remaps apply. */
export const listExplorerSortTriggerClass = (nonDefaultSort: boolean): string =>
  [
    'list-explorer-sort-trigger',
    nonDefaultSort
      ? 'list-explorer-sort-trigger--active text-emerald-800 ring-1 ring-emerald-500/30'
      : 'text-neutral-700',
  ].join(' ');

/** Filter FAB popover chips — dense on md+ (narrow list / side-map column). */
export const listFilterPopChipClass = (active: boolean): string =>
  [
    'inline-flex h-8 min-h-8 shrink-0 items-center justify-center rounded-full px-3 text-xs font-semibold transition-colors active:scale-[0.98]',
    'md:h-7 md:min-h-7 md:px-2 md:text-[10px] md:leading-none',
    active ? EXPLORE_BRAND_ACTIVE : 'bg-neutral-100 text-neutral-700',
  ].join(' ');

/** Area grid — equal cell chips (long emirate names truncate). */
export const listFilterPopGridChipClass = (active: boolean): string =>
  `${listFilterPopChipClass(active)} w-full min-w-0 px-1 md:px-0.5`;

/** Filter pop layout tokens (mobile touch targets, desktop compact, no inner scroll). */
export const LIST_FILTER_POP = {
  shell: 'w-[min(20.5rem,calc(100vw-2rem))] md:w-[17.25rem]',
  panel:
    'border border-neutral-200/90 bg-white p-3 shadow-[0_12px_40px_rgba(15,23,42,.18)] md:p-2 md:rounded-xl',
  sections: 'space-y-2.5 md:space-y-1',
  block: 'space-y-1 md:space-y-0.5',
  label: 'text-[10px] font-semibold uppercase tracking-wide text-neutral-500 md:text-[9px] md:tracking-wider',
  chipRow: 'flex flex-wrap gap-1.5 md:gap-0.5',
  headerRow: 'mb-2 flex items-center justify-between gap-2 md:mb-1',
  title: 'text-sm font-bold text-neutral-900 md:text-xs',
  reset: 'text-sm font-semibold text-emerald-700 md:text-[11px]',
  footer: 'mt-2.5 flex gap-2 md:mt-1.5 md:gap-1.5',
  footerBtn:
    'min-h-11 flex-1 rounded-2xl text-sm font-semibold md:min-h-7 md:rounded-lg md:py-0.5 md:text-[11px]',
  areaGrid: 'grid grid-cols-3 gap-1 md:grid-cols-3 md:gap-0.5',
} as const;

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

export const LIST_FLOAT_FIXED = 'fixed z-[1150] md:hidden';

/** Filter FAB — draggable on list surfaces. */
export const LIST_FILTER_FAB_Z = 'z-[1220]';

/** Sort sheet / dropdown — must stack above {@link LIST_FILTER_FAB_Z}. */
export const LIST_OVERLAY_Z = 'z-[1250]';

export const LIST_MAP_FLOAT = `${LIST_FLOAT_FIXED} ${MOBILE_DOCK_SECONDARY}`;

export const LIST_CREATE_FAB = `${LIST_FLOAT_FIXED} ${MOBILE_DOCK_PRIMARY} max-w-[calc(100vw-7.5rem)]`;

export const LIST_MAP_FLOAT_POSITION =
  'right-4 bottom-[calc(var(--explore-float-base)+var(--explore-map-fab-inset))]';

/** Mirrors explore map **List** pill — list trips/venues return to map (left). */
export const LIST_VIEW_MAP_FLOAT_POSITION =
  'left-4 bottom-[calc(var(--explore-float-base)+var(--explore-map-fab-inset))]';

export const LIST_DESKTOP_MAP_LINK =
  'hidden min-h-10 items-center rounded-full bg-neutral-100 px-4 text-sm font-semibold text-neutral-900 md:inline-flex active:bg-neutral-200';

/** Side map column — close control (list super-app chrome, not dark map HUD). */
export const LIST_MAP_COLUMN_CLOSE =
  'absolute right-3 top-3 z-[1000] inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200/80 bg-white/95 text-neutral-700 shadow-[0_4px_18px_rgba(15,23,42,.12)] ring-1 ring-black/[0.06] backdrop-blur-md transition active:scale-[0.97] hover:bg-neutral-50';
