/** Consumer mobile drawer — aligned with settings groups + explore emerald chrome. */

export const MOBILE_DRAWER = {
  aside:
    'absolute inset-y-0 right-0 flex w-[min(100vw-3rem,20rem)] max-w-full flex-col border-l border-neutral-200/80 bg-neutral-50 shadow-2xl transition-transform duration-300 ease-out',
  nav: 'flex-1 overflow-y-auto px-3 py-3 pb-safe',
  stack: 'space-y-3',
  group:
    'overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm divide-y divide-neutral-100',
  sectionLabel: 'px-1 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500',
  row:
    'group flex w-full items-center gap-3 px-3 py-3 text-left touch-manipulation transition-[background-color] duration-150 ease-out [-webkit-tap-highlight-color:transparent]',
  rowActive: 'bg-emerald-50/95',
  /** Press = soft emerald; hover only when the device has a real pointer (no sticky gray on touch). */
  rowIdle:
    'active:bg-emerald-50/55 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-emerald-50/40',
  label: 'text-[15px] font-semibold leading-snug text-neutral-900',
  labelActive: 'text-emerald-900',
  closeBtn:
    'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-neutral-500 transition-[background-color,transform] duration-150 active:scale-95 active:bg-neutral-100/80 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-neutral-100/70',
} as const;

export const mobileDrawerIconWell = (active: boolean) =>
  active
    ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-800 bg-emerald-600 text-white shadow-sm shadow-emerald-900/15 transition-[border-color,box-shadow] duration-150'
    : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200/80 bg-white text-emerald-800 shadow-[0_1px_3px_rgba(15,23,42,.06)] transition-[border-color,box-shadow] duration-150 [@media(hover:hover)_and_(pointer:fine)]:group-hover:border-emerald-200/90 [@media(hover:hover)_and_(pointer:fine)]:group-hover:shadow-[0_2px_8px_rgba(5,150,105,.08)]';

export const mobileDrawerIconTone = (active: boolean) =>
  active ? 'text-white' : 'text-emerald-800/90';

export const mobileDrawerRowClass = (active: boolean) =>
  `${MOBILE_DRAWER.row} ${
    active
      ? `${MOBILE_DRAWER.rowActive} active:bg-emerald-50/95 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-emerald-50/95`
      : MOBILE_DRAWER.rowIdle
  }`;
