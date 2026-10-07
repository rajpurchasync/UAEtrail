import type {
  ActivityListFilterKey,
  MapFilterKey,
  VenueListFilterKey,
} from '../config/routingCatalog';

export type { VenueListFilterKey };

/** Shared explore surface tokens — shapes, sheets, and semantic colors. */
export const EXPLORE_SHAPE = {
  pill: 'rounded-full',
  control: 'rounded-2xl',
  sheetTop: 'rounded-t-3xl',
  sheetDesktop: 'lg:rounded-2xl',
  sheetHandle: 'mx-auto h-1 w-10 shrink-0 rounded-full bg-neutral-200',
} as const;

export const EXPLORE_SHEET = {
  scrim: 'bg-black/40 lg:bg-black/45',
  panel: 'bg-white shadow-2xl lg:shadow-xl',
  maxHeight: 'lg:max-h-[min(85vh,720px)]',
  browseHeight: 'flex h-[82dvh] min-h-0 flex-col bg-[#f8fafb]',
  browseList: 'min-h-0 flex-1 space-y-2.5 overflow-y-auto px-1 pb-[calc(var(--safe-bottom)+12px)] lg:px-0 lg:pb-4',
} as const;

export const exploreSheetPanelClass = `${EXPLORE_SHAPE.sheetTop} ${EXPLORE_SHAPE.sheetDesktop} ${EXPLORE_SHEET.panel} ${EXPLORE_SHEET.maxHeight}`;

/** Primary chrome — brand actions, default filters (Nomadtable-style: darker, higher contrast). */
export const EXPLORE_BRAND_ACTIVE =
  'bg-emerald-700 text-white border-emerald-800 shadow-sm shadow-emerald-900/20';

/** Map filter pill when active — type color where it helps scanning. */
export const exploreMapFilterActiveClass = (key: MapFilterKey): string => {
  switch (key) {
    case 'all':
    case 'hiking':
      return EXPLORE_BRAND_ACTIVE;
    case 'camping':
      return 'bg-amber-700 text-white border-amber-800 shadow-sm shadow-amber-900/20';
    case 'rideshare':
      return 'bg-sky-700 text-white border-sky-800 shadow-sm shadow-sky-900/20';
    case 'others':
      return 'bg-violet-700 text-white border-violet-800 shadow-sm shadow-violet-900/20';
    case 'shops':
      return 'bg-rose-700 text-white border-rose-800 shadow-sm shadow-rose-900/20';
    default:
      return EXPLORE_BRAND_ACTIVE;
  }
};

export const EXPLORE_MAP_FILTER_INACTIVE =
  'border-neutral-300 bg-white text-neutral-950 shadow-[0_2px_10px_rgba(15,23,42,.16)] backdrop-blur-sm';

/** Shared pill shells — map chrome (no 44px touch min-height; medium height). */
export const EXPLORE_FILTER_PILL = {
  map:
    'inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-bold leading-snug shadow-[0_2px_10px_rgba(15,23,42,.14)] transition',
  mapTopic:
    'inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-bold leading-snug shadow-[0_2px_10px_rgba(15,23,42,.14)] transition',
  sub:
    'inline-flex shrink-0 snap-start items-center rounded-full border px-3 py-1 text-[13px] font-bold leading-snug shadow-sm transition',
  subList:
    'inline-flex shrink-0 snap-start items-center rounded-full border px-3 py-1 text-[13px] font-bold leading-snug shadow-sm transition',
  list:
    'inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-bold leading-snug shadow-sm transition',
} as const;

/** Explore copy hierarchy — avoid washed-out gray on map and browse. */
export const EXPLORE_TYPE = {
  title: 'text-neutral-950',
  body: 'text-neutral-800',
  muted: 'text-neutral-700',
  caption: 'text-neutral-600',
} as const;

/** Horizontal pill rows in the browse list panel — visible scrollbar (map keeps scrollbar-none). */
export const EXPLORE_LIST_PILLS_SCROLL =
  'min-w-0 overflow-x-auto scroll-smooth snap-x snap-mandatory desktop-scrollbar-x pb-1 [-webkit-overflow-scrolling:touch]';

/** Browse list panel — underline tabs (not floating map pills). */
export const EXPLORE_BROWSE_PANEL_TAB = {
  row: 'mb-2 flex gap-1 border-b border-neutral-200',
  tab:
    'shrink-0 px-2.5 pb-2 pt-0.5 text-sm font-semibold transition [-webkit-tap-highlight-color:transparent]',
  active: 'text-emerald-800 decoration-emerald-600 underline decoration-2 underline-offset-[10px]',
  inactive: 'text-neutral-500 hover:text-neutral-800',
} as const;

/** Explore Social panel segment tabs (All | Friends | Followed). */
export const EXPLORE_BROWSE_SEGMENT_TAB = {
  row: `${EXPLORE_BROWSE_PANEL_TAB.row} gap-3`,
  active: `${EXPLORE_BROWSE_PANEL_TAB.tab} ${EXPLORE_BROWSE_PANEL_TAB.active}`,
  inactive: `${EXPLORE_BROWSE_PANEL_TAB.tab} ${EXPLORE_BROWSE_PANEL_TAB.inactive}`,
} as const;

/** Compose FAB sheet — emerald brand (Organize · Find · Add). */
export const EXPLORE_COMPOSE = {
  menuIconWrap: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20',
  kindTile:
    'rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-emerald-50/80 to-white active:border-emerald-300 lg:hover:border-emerald-200',
  kindIconWrap: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25',
} as const;

/** Create / organize / find / add wizard — shared step titles and choice cards. */
export const EXPLORE_FLOW = {
  stepTitle: 'text-xl font-bold leading-snug text-neutral-900',
  /** Vertical rhythm around centered step / sheet main title */
  stepHeaderShell: 'relative pt-3 pb-4 mb-3 lg:pt-4 lg:pb-5 lg:mb-4',
  stepTitleBlock: 'flex flex-col items-center px-8 py-1 text-center',
  stepBackRow: 'mt-2 flex justify-start border-t border-neutral-100/90 pt-2',
  stepBackButton:
    'inline-flex items-center gap-0.5 rounded-full py-1 pl-1 pr-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100',
  choiceCardBase: 'w-full rounded-2xl border-2 px-4 py-3.5 text-left transition active:scale-[0.99]',
  choiceCardActive: 'border-emerald-600 bg-emerald-50/50',
  choiceCardInactive: 'border-neutral-200 bg-white',
  choiceCardTitle: 'text-sm font-bold text-neutral-900',
  choiceCardSubtitle: 'mt-0.5 text-xs leading-snug text-neutral-500',
  choiceGrid2: 'grid grid-cols-2 gap-3',
  kindTile:
    'rounded-2xl border-2 px-3 py-4 text-left transition active:scale-[0.99] sm:px-4',
  kindTileActive: 'border-emerald-600 bg-emerald-50/60 shadow-sm',
  kindTileIdle: 'border-neutral-200 bg-white',
  menuRowTitle: 'text-base font-bold leading-snug text-neutral-900 lg:text-[17px]',
  mapPinCard:
    'flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 px-4 py-4 text-left transition hover:border-emerald-300 active:scale-[0.99]',
} as const;

/** Create intent — distinct affordances for supply vs demand vs venues. */
export const EXPLORE_INTENT = {
  host: {
    iconWrap: 'bg-rose-600 text-white shadow-md shadow-rose-600/30',
    card: 'border-rose-200 bg-gradient-to-br from-rose-50 to-white active:border-rose-500 lg:hover:border-rose-400',
    label: 'text-rose-800',
  },
  request: {
    iconWrap: 'bg-teal-600 text-white shadow-md shadow-teal-600/30',
    card: 'border-teal-200 bg-gradient-to-br from-teal-50 to-white active:border-teal-500 lg:hover:border-teal-400',
    label: 'text-teal-800',
  },
  contribute: {
    iconWrap: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30',
    card: 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-white active:border-indigo-500 lg:hover:border-indigo-400',
    label: 'text-indigo-800',
  },
  /** @deprecated use host */
  add: {
    iconWrap: 'bg-rose-600 text-white shadow-md shadow-rose-600/30',
    card: 'border-rose-200 bg-gradient-to-br from-rose-50 to-white active:border-rose-500 lg:hover:border-rose-400',
    label: 'text-rose-800',
  },
} as const;

/** Date / secondary map chips — slightly stronger edge than toolbar search & Social. */
export const EXPLORE_FLOATING_CONTROL =
  'inline-flex items-center rounded-full border border-neutral-200/90 bg-white text-neutral-950 shadow-[0_2px_12px_rgba(15,23,42,.16)] backdrop-blur-sm';

/** Search + Social on the map — original frosted pill (unchanged with filter pill styling). */
export const EXPLORE_MAP_TOOLBAR_FLOATING =
  'inline-flex items-center rounded-full bg-white/95 shadow-[0_2px_12px_rgba(15,23,42,.14)] backdrop-blur-sm';

/** Shared vertical padding for map toolbar pills (Social + intent menu). */
export const EXPLORE_MAP_TOOLBAR_PILL_PADDING = 'py-2';

/** Mobile explore — offsets for floating map chrome below the solid header. */
export const EXPLORE_MOBILE_MAP_CHROME = {
  filterTop: 'max-lg:top-0',
  noticeTop: 'max-lg:top-[8rem]',
} as const;

/** Explore map stacking — keep in sync across peek cards, filters, and sheets. */
export const EXPLORE_Z = {
  /** Map filter pill row */
  mapFilters: 'z-[3000]',
  /** Pin selection peek card (above filters, below browse sheet) */
  peekCard: 'z-[4000]',
  /** Browse list sheet */
  browseSheet: 'z-[5500]',
  /** FAB compose menu + organize / find / add wizards (above map filters & browse sheet) */
  composeFlow: 'z-[6500]',
  /** Guest sign-in / join modal — above compose menu & peek (FAB, join, browse gates) */
  guestJoinSheet: 'z-[6600]',
} as const;

/** Compact map peek card — centered overlay so it cannot grow into the header. */
export const EXPLORE_PEEK = {
  position:
    `absolute inset-0 ${EXPLORE_Z.peekCard} flex items-center justify-center px-4 pt-3 pb-[calc(var(--explore-float-base)+0.5rem)] lg:p-6`,
  inner: 'relative mx-auto flex max-h-full w-full max-w-md flex-col',
  shell:
    'flex min-h-0 max-h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_32px_rgba(15,23,42,.16)] ring-1 ring-black/5',
} as const;

export const EXPLORE_LIST_FILTER_INACTIVE =
  'bg-white text-neutral-950 ring-1 ring-neutral-300 font-bold';

export const exploreActivityListFilterActiveClass = (key: ActivityListFilterKey): string => {
  switch (key) {
    case 'camping':
      return 'bg-amber-700 text-white shadow-sm shadow-amber-900/20';
    case 'rideshare':
      return 'bg-sky-700 text-white shadow-sm shadow-sky-900/20';
    case 'event':
      return 'bg-violet-700 text-white shadow-sm shadow-violet-900/20';
    default:
      return EXPLORE_BRAND_ACTIVE;
  }
};

export const exploreVenueListFilterActiveClass = (key: VenueListFilterKey): string => {
  switch (key) {
    case 'camping':
      return 'bg-amber-700 text-white shadow-sm shadow-amber-900/20';
    case 'event':
      return 'bg-violet-700 text-white shadow-sm shadow-violet-900/20';
    case 'shop':
      return 'bg-rose-700 text-white shadow-sm shadow-rose-900/20';
    default:
      return EXPLORE_BRAND_ACTIVE;
  }
};

export type MapPinRingKind = 'hiking' | 'camping' | 'event' | 'shop' | 'agency' | 'rideshare';
export type MapPinRingSource = 'activity' | 'venue' | 'shop' | 'agency' | 'demand';

/** Type-colored ring on map pins — matches filter / badge colors. */
export const exploreMapPinRingColor = (
  kind: MapPinRingKind,
  source?: MapPinRingSource
): string => {
  if (source === 'demand') return '#0d9488';
  switch (kind) {
    case 'camping':
      return '#d97706';
    case 'event':
      return '#7c3aed';
    case 'rideshare':
      return '#0284c7';
    case 'shop':
      return '#e11d48';
    case 'agency':
      return '#4f46e5';
    default:
      return '#059669';
  }
};

/** Map peek card footer CTAs — brand primary, neutral secondary. */
export const EXPLORE_PEEK_CTA = {
  primary: 'w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700',
  secondary:
    'block w-full rounded-xl border border-neutral-200 bg-white py-3.5 text-center text-sm font-bold text-neutral-800',
  secondaryText: 'w-full py-2.5 text-center text-sm font-semibold text-neutral-700',
  link: 'text-sm font-semibold text-sky-800 underline underline-offset-2 hover:text-sky-950',
} as const;
