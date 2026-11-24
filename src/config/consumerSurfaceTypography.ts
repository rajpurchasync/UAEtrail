/**
 * Consumer modals, sheets, and map peek — minimum readable typography + flex scroll shells.
 * Prefer these over raw `text-[9px]` / `text-[10px]` in user-facing surfaces.
 */

/** Do not scale map peek below this via CSS zoom — use in-card scroll instead. */
export const MAP_PEEK_MIN_READABLE_FIT = 0.9;

export const CONSUMER_SURFACE_TYPE = {
  sheetTitle: 'text-base font-bold leading-snug text-neutral-950',
  sheetSubtitle: 'text-sm font-medium leading-snug text-neutral-600',
  sheetBody: 'text-sm leading-snug text-neutral-800',
  sheetCaption: 'text-xs font-medium leading-snug text-neutral-600',
  peekTitle: 'text-base font-bold leading-snug tracking-tight text-neutral-950',
  peekHostName: 'text-sm font-semibold text-neutral-950',
  peekMeta: 'text-xs font-medium leading-snug text-neutral-700',
  peekEssentials: 'text-xs font-semibold text-neutral-900',
  chip: 'text-[11px] font-semibold leading-tight',
  /** Ephemeral map/action tooltips — never below `text-xs`. */
  tooltip:
    'text-xs font-medium leading-snug shadow-md ring-1 ring-black/5',
  fieldLabel: 'text-xs font-medium text-neutral-600',
  badgeCount:
    'flex min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-xs font-semibold text-white',
} as const;

/** Inline save/follow notices under map icons. */
export const CONSUMER_FLOATING_NOTICE_POS =
  'pointer-events-none absolute right-0 top-full z-20 mt-1 w-max max-w-[min(240px,72vw)] rounded-lg px-2.5 py-1.5 text-right';

export const CONSUMER_MODAL_LAYOUT = {
  shell: 'flex min-h-0 flex-col overflow-hidden',
  scrollBody: 'min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-touch',
  stickyFooter: 'shrink-0 border-t border-neutral-100 bg-white',
  panelMaxHeightClass: 'max-h-[min(88dvh,calc(100dvh-var(--safe-top,0px)-var(--safe-bottom,0px)))]',
} as const;

/** Icon-only dismiss — no chip, ring, or shadow (search, sheets, dialogs). */
export const CONSUMER_MODAL_CLOSE = {
  button:
    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:text-neutral-700 active:text-neutral-900 [-webkit-tap-highlight-color:transparent]',
  buttonCompact:
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:text-neutral-700 active:text-neutral-900 [-webkit-tap-highlight-color:transparent]',
  buttonOnWarm:
    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/75 transition-colors hover:text-white active:text-white',
  corner: 'absolute right-2 top-2 z-20',
  cornerLoose: 'absolute right-3 top-3 z-20',
  icon: 'h-5 w-5',
  iconCompact: 'h-4 w-4',
} as const;