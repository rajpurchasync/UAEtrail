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
  sheetDesktop: 'sm:rounded-2xl',
  sheetHandle: 'mx-auto h-1 w-10 shrink-0 rounded-full bg-neutral-200',
} as const;

export const EXPLORE_SHEET = {
  scrim: 'bg-black/40 lg:bg-black/45',
  panel: 'bg-white shadow-2xl lg:shadow-xl',
  maxHeight: 'lg:max-h-[min(85vh,720px)]',
  /** Consumer slide-up sheets (invite, compact actions) — matches ConsumerBottomSheet. */
  compactMaxWidth: 'max-w-md',
  compactPanelClass: '!overflow-hidden pb-0 sm:shadow-2xl',
  browseHeight: 'flex h-[82dvh] min-h-0 flex-col bg-[#f8fafb]',
  browseFullscreen:
    'flex min-h-0 flex-1 flex-col bg-neutral-50 pt-[var(--safe-top)] pb-[calc(var(--bottom-nav-height,56px)+var(--safe-bottom,0px))]',
  browseList:
    'min-h-0 flex-1 space-y-2.5 overflow-y-auto px-1 pb-[calc(var(--safe-bottom)+12px)] lg:px-0 lg:pb-4',
  browseListSheet:
    'min-h-0 flex-1 space-y-2.5 overflow-y-auto px-0 pb-[calc(var(--safe-bottom)+12px)]',
} as const;

/** Map list panel rows — activities, venues, shops, people browse. */
export const EXPLORE_LIST_ROW = {
  shell:
    'rounded-2xl border border-neutral-200/75 bg-white shadow-[0_1px_8px_rgba(15,23,42,.06)] ring-1 ring-black/[0.02] transition',
  main:
    'flex w-full items-center gap-3 p-3.5 text-left transition active:scale-[0.995] active:bg-neutral-50/80',
  bodyIndent: 'space-y-0 px-3 pb-3 pl-[4.25rem]',
  title: 'text-[15px] font-bold leading-snug text-neutral-950',
  meta: 'mt-0.5 truncate text-sm font-medium leading-snug text-neutral-700',
  footer: 'text-sm font-medium leading-snug text-neutral-800',
  /** Inline text button inside list footer copy (e.g. outing title). */
  inlineAction:
    'font-semibold text-neutral-950 underline decoration-neutral-300 underline-offset-2',
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
  /** Browse list sheet — icon above label, equal-width grid row. */
  listStacked:
    'inline-flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border px-0.5 py-1 text-center shadow-sm transition [-webkit-tap-highlight-color:transparent]',
  /** Stacked filter cell — same shell as listStacked, no flex growth (grid/back chip). */
  listStackedCell:
    'inline-flex min-w-0 w-full flex-col items-center justify-center gap-0.5 rounded-lg border px-0.5 py-1 text-center shadow-sm transition [-webkit-tap-highlight-color:transparent]',
  /** Map mobile expanded row — equal-width grid cells, no horizontal scroll. */
  mapMobileStacked:
    'flex min-w-0 flex-1 flex-col items-center justify-center gap-0 rounded-lg border px-0.5 py-1 text-center shadow-sm transition [-webkit-tap-highlight-color:transparent]',
} as const;

/** Label under emoji on compact map/list filter grids. */
export const EXPLORE_COMPACT_PILL_LABEL = 'w-full truncate text-[9px] font-bold leading-tight';

/** Equal-width pill grid (pass column count via style). */
export const EXPLORE_COMPACT_PILL_GRID = 'grid w-full min-w-0 gap-0.5';

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

/** Explore People browse panel segment tabs (All | Friends | Followed | Discover). */
export const EXPLORE_BROWSE_SEGMENT_TAB = {
  row: `${EXPLORE_BROWSE_PANEL_TAB.row} gap-3`,
  active: `${EXPLORE_BROWSE_PANEL_TAB.tab} ${EXPLORE_BROWSE_PANEL_TAB.active}`,
  inactive: `${EXPLORE_BROWSE_PANEL_TAB.tab} ${EXPLORE_BROWSE_PANEL_TAB.inactive}`,
} as const;

/** Mobile pull-up compose — scroll insets under transparent tab header / above home indicator. */
export const EXPLORE_COMPOSE_IMMERSIVE = {
  scrollPadTop: 'max-lg:pt-[var(--safe-top)]',
  scrollPadBottom: 'max-lg:pb-[calc(var(--safe-bottom)+1.25rem)]',
} as const;

/** Compose FAB sheet — emerald brand (Host · Find crew · Add). */
export const EXPLORE_COMPOSE = {
  menuIconWrap: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20',
  kindTile:
    'rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-emerald-50/80 to-white active:border-emerald-300 lg:hover:border-emerald-200',
  kindIconWrap: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25',
} as const;

/** Create / host / seek / add wizard — shared step titles and choice cards. */
export const EXPLORE_FLOW = {
  stepTitle:
    'text-xl font-bold leading-snug text-neutral-900 md:text-base md:font-semibold lg:text-base',
  /** Vertical rhythm around centered step / sheet main title */
  stepHeaderShell: 'relative pt-3 pb-4 mb-3 md:mb-2 md:pb-2 md:pt-2 lg:mb-2 lg:pb-2 lg:pt-2',
  stepTitleBlock: 'flex flex-col items-center px-8 py-1 text-center',
  stepBackRow: 'mt-2 flex justify-start border-t border-neutral-100/90 pt-2',
  stepBackButton:
    'inline-flex items-center gap-0.5 rounded-full py-1 pl-1 pr-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100',
  choiceCardBase:
    'w-full rounded-2xl border-2 px-4 py-3.5 text-left transition active:scale-[0.99] md:rounded-md md:border md:px-3 md:py-2 md:active:scale-100',
  choiceCardActive: 'border-emerald-600 bg-emerald-50/50',
  choiceCardInactive: 'border-neutral-200 bg-white',
  choiceCardTitle: 'text-sm font-bold text-neutral-900',
  choiceCardSubtitle: 'mt-0.5 text-xs leading-snug text-neutral-500',
  choiceGrid2: 'grid grid-cols-2 gap-3 md:gap-2',
  kindTile:
    'flex min-h-[7.25rem] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 px-3 py-4 text-center transition active:scale-[0.99] sm:px-4 lg:min-h-16 lg:gap-1 lg:py-2',
  kindTileActive: 'border-emerald-600 bg-emerald-50/60 shadow-sm',
  kindTileIdle: 'border-neutral-200 bg-white',
  menuRowTitle: 'text-base font-bold leading-snug text-neutral-900 lg:text-[17px]',
  mapPinCard:
    'flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 px-4 py-4 text-left transition hover:border-emerald-300 active:scale-[0.99] md:rounded-md md:border md:px-3 md:py-2.5 md:active:scale-100',
  /** Text fields in host / seek / add compose (large touch on mobile, form-like on md+). */
  composeField:
    'w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-neutral-900 outline-none focus:border-emerald-400 md:rounded-md md:border-neutral-300 md:px-3 md:py-1.5 md:text-sm',
  composeFieldEmoji:
    'w-12 shrink-0 rounded-2xl border border-neutral-200 px-1 py-2 text-center text-lg outline-none focus:border-emerald-400 md:w-10 md:rounded-md md:py-1.5 md:text-base',
  composeBtnSm:
    'shrink-0 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 md:rounded-md md:px-2.5 md:py-1.5 md:text-xs',
  composePrimary:
    'w-full min-h-12 rounded-2xl px-4 py-3.5 text-base font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50 md:min-h-9 md:max-w-xs md:rounded-md md:py-2 md:text-sm md:font-semibold md:shadow-sm',
  composeOptionRow:
    'flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left md:rounded-md md:border md:px-3 md:py-2',
} as const;

/** Create intent — Host · Find crew · Add on map. */
export const EXPLORE_INTENT = {
  host: {
    iconWrap: 'bg-rose-600 text-white shadow-md shadow-rose-600/30',
    card: 'border-rose-200 bg-gradient-to-br from-rose-50 to-white active:border-rose-500 lg:hover:border-rose-400',
    label: 'text-rose-800',
  },
  seek: {
    iconWrap: 'bg-teal-600 text-white shadow-md shadow-teal-600/30',
    card: 'border-teal-200 bg-gradient-to-br from-teal-50 to-white active:border-teal-500 lg:hover:border-teal-400',
    label: 'text-teal-800',
  },
  add: {
    iconWrap: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30',
    card: 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-white active:border-indigo-500 lg:hover:border-indigo-400',
    label: 'text-indigo-800',
  },
} as const;

/** Map floating chrome — frosted glass over the map (toolbar, filters, List, Find crew). */
export const EXPLORE_MAP_CHROME_FROST =
  'bg-white/55 shadow-[0_2px_12px_rgba(15,23,42,.12)] backdrop-blur-md';

/** Date / secondary map chips — same frost as map toolbar. */
export const EXPLORE_FLOATING_CONTROL =
  `inline-flex items-center rounded-full border border-white/80 text-neutral-950 ${EXPLORE_MAP_CHROME_FROST}`;

/** Browse list sheet — search row icon buttons (calendar, places filter). */
export const EXPLORE_BROWSE_SHEET_CONTROL =
  'inline-flex shrink-0 items-center justify-center rounded-xl border border-neutral-200/80 bg-white text-emerald-800 shadow-sm transition [-webkit-tap-highlight-color:transparent]';

/** Search + intent row on the map (activities · places · search). */
export const EXPLORE_MAP_TOOLBAR_FLOATING =
  `inline-flex items-center rounded-full ${EXPLORE_MAP_CHROME_FROST}`;

/** Shared vertical padding for map toolbar pills (Social + intent menu). */
export const EXPLORE_MAP_TOOLBAR_PILL_PADDING = 'py-2';

/** Emoji glyphs in h-7 map toolbar segments (intent row + mobile filter CTA). 25% above `text-lg`. */
export const EXPLORE_MAP_TOOLBAR_SEGMENT_ICON = 'text-[1.40625rem] leading-none';

/** Layout for the map filter tray (frost fill applied separately so layer tints can win). */
const EXPLORE_MAP_FILTER_TRAY_LAYOUT =
  'flex w-full min-w-0 items-stretch gap-1 rounded-2xl p-1 shadow-[0_2px_12px_rgba(15,23,42,.12)] backdrop-blur-md';

/** Mobile map — expanded activity/place filters (same outer height as intent toolbar: py-2 + h-7). */
export const EXPLORE_MAP_MOBILE_FILTER_CTA_BAR =
  `${EXPLORE_MAP_FILTER_TRAY_LAYOUT} ring-1 ring-white/50 bg-white/55`;

/** Layer switcher fill — Events = brand emerald, Places = sky. `bar` matches the filter pills. */
export const exploreMapLayerIconClass = (
  selected: boolean,
  layer: 'activity' | 'places',
  layout: 'compact' | 'bar' = 'compact',
) => {
  const base =
    layout === 'bar'
      ? 'relative inline-flex h-full min-h-8 w-10 shrink-0 items-center justify-center self-stretch rounded-xl transition-colors duration-200 [-webkit-tap-highlight-color:transparent]'
      : 'relative inline-flex h-7 w-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 [-webkit-tap-highlight-color:transparent]';
  if (!selected) return `${base} hover:bg-white/70 active:bg-white/85`;
  return layer === 'places'
    ? `${base} bg-sky-500/25 ring-1 ring-sky-400/50`
    : `${base} bg-emerald-500/25 ring-1 ring-emerald-400/50`;
};

/** Filter tray tint matches the active Events / Places icon. */
export const exploreMapLayerFilterBarClass = (layer: 'activity' | 'places') =>
  layer === 'places'
    ? `${EXPLORE_MAP_FILTER_TRAY_LAYOUT} bg-sky-50/80 ring-1 ring-sky-200/70`
    : `${EXPLORE_MAP_FILTER_TRAY_LAYOUT} bg-emerald-50/80 ring-1 ring-emerald-200/70`;

/** Segment fills the tray. 32px clears the WCAG 2.2 target-size minimum (24px). */
export const EXPLORE_MAP_MOBILE_FILTER_CTA_SEGMENT_HIT = 'h-full min-h-8 self-stretch';

/** Filter glyphs stay readable inside the shorter desktop bar. */
export const EXPLORE_MAP_MOBILE_FILTER_CTA_ICON = 'text-[1.35rem] leading-none';

/** “All” text-only segment in the same bar. */
export const EXPLORE_MAP_MOBILE_FILTER_CTA_ALL_LABEL = 'text-xs font-bold leading-none';

const MAP_MOBILE_FILTER_CTA_SEGMENT_BASE =
  `flex min-w-0 flex-1 basis-0 ${EXPLORE_MAP_MOBILE_FILTER_CTA_SEGMENT_HIT} items-center justify-center rounded-xl px-1 text-center transition [-webkit-tap-highlight-color:transparent]`;

export const exploreMapMobileFilterCtaSegmentClass = (
  selected: boolean,
  filterKey: MapFilterKey = 'all'
): string =>
  selected
    ? `${MAP_MOBILE_FILTER_CTA_SEGMENT_BASE} ${exploreMapFilterActiveClass(filterKey)} border-0 shadow-none ring-0`
    : `${MAP_MOBILE_FILTER_CTA_SEGMENT_BASE} text-neutral-800 hover:bg-white/70 active:bg-white/85`;

/** Mobile explore — offsets for floating map chrome below the solid header. */
export const EXPLORE_MOBILE_MAP_CHROME = {
  filterTop: 'max-lg:top-0',
  noticeTop: 'max-lg:top-[8rem]',
} as const;

/** Bottom sheets over the map (Find crew list, compose peek) — leave filters visible. */
export const EXPLORE_BROWSE_PEEK_SHEET = {
  shellTopPad: 'pt-[var(--explore-browse-peek-top)]',
  panelMaxHeight: 'max-h-[calc(100dvh-var(--explore-browse-peek-top)-var(--safe-bottom,0px))]',
  panelHeight:
    'h-[min(70dvh,calc(100dvh-var(--explore-browse-peek-top)-var(--safe-bottom,0px)))]',
  /** Mobile map peek only — desktop compose dialog keeps lg height cap. */
  panelPeekMobile: `max-lg:h-[min(70dvh,calc(100dvh-var(--explore-browse-peek-top)-var(--safe-bottom,0px)))] max-lg:max-h-[calc(100dvh-var(--explore-browse-peek-top)-var(--safe-bottom,0px))]`,
} as const;

/** Explore map stacking — keep in sync across peek cards, filters, and sheets. */
export const EXPLORE_Z = {
  /** Map filter pill row */
  mapFilters: 'z-[3000]',
  /** Pin selection peek card (above filters, below browse sheet) */
  peekCard: 'z-[4000]',
  /** Public `/activity/:id` consumer shell */
  activityDetailModal: 'z-[5000]',
  /** Invite-friends sheet opened from activity detail (above modal shell) */
  activityDetailInviteSheet: 'z-[5100]',
  /** Browse list sheet */
  browseSheet: 'z-[5500]',
  /** FAB compose menu + organize / find / add wizards (above map filters & browse sheet) */
  composeFlow: 'z-[6500]',
  /** Mobile compose pull-up full screen (same stack as peek compose; tab header hidden while open). */
  composeFlowImmersive: 'z-[6500]',
  /** Guest sign-in / join modal — above compose menu & peek (FAB, join, browse gates) */
  guestJoinSheet: 'z-[6600]',
  /** Discard-draft confirm above immersive compose */
  composeDiscardConfirm: 'z-[6700]',
} as const;

/**
 * Map peek card — centered overlay on mobile so it cannot grow into the header;
 * docked full-height panel on the left of the map on desktop (map stays interactive).
 */
export const EXPLORE_PEEK = {
  position:
    `absolute inset-0 ${EXPLORE_Z.peekCard} flex items-center justify-center px-4 pt-3 pb-[calc(var(--explore-float-base)+0.5rem)] lg:items-stretch lg:justify-start lg:p-3`,
  scrim: 'bg-black/40 lg:bg-transparent',
  inner:
    'relative mx-auto flex max-h-full w-full max-w-md flex-col lg:mx-0 lg:h-full lg:w-[400px] lg:max-w-[calc(100%-1.5rem)] lg:[&_[data-pin-summary=card]]:h-full',
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

export type MapPinRingKind = 'hiking' | 'camping' | 'event' | 'shop' | 'agency' | 'rideshare' | 'area';
export type MapPinRingSource = 'activity' | 'venue' | 'shop' | 'agency' | 'seeking';

/** Type-colored ring on map pins — matches filter / badge colors. */
export const exploreMapPinRingColor = (
  kind: MapPinRingKind,
  source?: MapPinRingSource
): string => {
  if (source === 'seeking') return '#0d9488';
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
    case 'area':
      return '#64748b';
    default:
      return '#059669';
  }
};

/** Map peek card footer CTAs — brand primary, neutral secondary. */
export const EXPLORE_PEEK_CTA = {
  primary: 'w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700',
  secondary:
    'block w-full rounded-xl border border-neutral-200 bg-white py-3.5 text-center text-sm font-bold text-neutral-800',
  secondaryText:
    'block w-full py-2.5 text-center text-sm font-semibold text-neutral-700',
  link: 'text-sm font-semibold text-sky-800 underline underline-offset-2 hover:text-sky-950',
  /** Compact activity peek footer (join + 3-up row) — fits map pin summary card. */
  peekJoin:
    'w-full rounded-lg bg-emerald-600 py-2.5 text-[13px] font-bold leading-snug text-white shadow-sm hover:bg-emerald-700 active:scale-[0.99]',
  peekJoinDisabled:
    'w-full cursor-not-allowed rounded-lg bg-neutral-100 py-2.5 text-[13px] font-bold leading-snug text-neutral-500',
  peekJoinPending:
    'w-full cursor-not-allowed rounded-lg bg-amber-50 py-2.5 text-[13px] font-bold leading-snug text-amber-900',
  peekTile:
    'flex min-h-[2.875rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border border-neutral-200 bg-white px-1 py-1.5 text-center text-[11px] font-semibold leading-tight text-neutral-800 no-underline hover:bg-neutral-50 hover:text-neutral-800 active:bg-neutral-100',
  /** Icon above peek footer tile label — brand stroke, no grey fill (tile is already white + border). */
  peekTileIcon: 'h-4 w-4 shrink-0 text-emerald-700',
} as const;
