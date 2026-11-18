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
    case 'facilities':
      return 'bg-teal-700 text-white border-teal-800 shadow-sm shadow-teal-900/20';
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
export const EXPLORE_COMPACT_PILL_LABEL = 'w-full truncate text-xs font-bold leading-tight';

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

/** Shared h2 styling for Host · Seek · Add sheets (pickers + wizards). */
export const EXPLORE_COMPOSE_FLOW_TITLE_CLASS =
  'compose-flow-title text-xl font-bold leading-snug tracking-tight text-neutral-900';

/** Compose FAB sheet — emerald brand (Host · Find crew · Add). */
export const EXPLORE_COMPOSE = {
  menuIconWrap: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20',
  kindTile:
    'rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-emerald-50/80 to-white active:border-emerald-300 lg:hover:border-emerald-200',
  kindIconWrap: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25',
  /** Centered FAB picker modal — symmetric gutters match the panel close control. */
  pickerBody: 'flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-6 pb-6 pt-3',
  pickerHeader:
    'grid w-full shrink-0 grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center pb-6',
  pickerTitle: `col-start-2 text-pretty text-center ${EXPLORE_COMPOSE_FLOW_TITLE_CLASS}`,
  /** Wizard step body scroll area — keep in sync with {@link EXPLORE_COMPOSE.wizardStepHeader} bleed. */
  wizardScrollPadX: 'px-7 md:px-8',
  /** Wizard step — full-bleed header band; back/close in side gutters, title centered on same row. */
  wizardStepHeader:
    'relative z-10 mb-4 min-h-10 w-[calc(100%+3.5rem)] shrink-0 -mx-7 md:w-[calc(100%+4rem)] md:-mx-8',
  wizardStepBack:
    'pointer-events-auto absolute left-2.5 -top-1 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100',
  wizardStepClose:
    'pointer-events-auto absolute right-2.5 -top-1 z-20 inline-flex h-10 w-10 items-center justify-center',
  wizardStepTitle: `relative z-0 flex min-h-10 w-full items-center justify-center px-11 text-pretty text-center ${EXPLORE_COMPOSE_FLOW_TITLE_CLASS}`,
  pickerChoiceGrid: 'grid w-full grid-cols-2 gap-3.5',
} as const;

/** Create / host / seek / add wizard — shared step titles and choice cards. */
export const EXPLORE_FLOW = {
  /** @deprecated Use {@link EXPLORE_COMPOSE_FLOW_TITLE_CLASS} */
  stepTitle: EXPLORE_COMPOSE_FLOW_TITLE_CLASS,
  sheetTitle: EXPLORE_COMPOSE_FLOW_TITLE_CLASS,
  /** Vertical rhythm around centered step / sheet main title */
  stepHeaderShell: 'relative pt-3 pb-4 mb-3 md:mb-2 md:pb-2 md:pt-2 lg:mb-2 lg:pb-2 lg:pt-2',
  stepTitleBlock: 'flex flex-col items-center px-8 py-1 text-center',
  stepBackRow: 'mt-2 flex justify-start border-t border-neutral-100/90 pt-2',
  stepBackButton:
    'inline-flex items-center gap-0.5 rounded-full py-1 pl-1 pr-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100',
  choiceCardBase:
    'explore-flow-choice-card w-full rounded-2xl border-2 px-4 py-3.5 text-left transition-colors duration-150 ease-out active:scale-[0.99] md:rounded-md md:border md:px-3 md:py-2 md:active:scale-100',
  choiceCardActive: 'explore-flow-choice-card--active border-emerald-600 bg-emerald-50/50',
  choiceCardInactive: 'explore-flow-choice-card--inactive border-neutral-200 bg-white',
  choiceCardTitle: 'text-sm font-bold leading-snug text-neutral-900',
  choiceCardSubtitle: 'mt-0.5 text-xs leading-snug text-neutral-500',
  choiceGrid2: 'grid grid-cols-2 gap-3 md:gap-2',
  kindTile:
    'explore-flow-choice-card flex min-h-[7.25rem] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 px-3 py-4 text-center transition-colors duration-150 ease-out active:scale-[0.99] sm:px-4 lg:min-h-16 lg:gap-1 lg:py-2',
  kindTileActive: 'explore-flow-choice-card--active border-emerald-600 bg-emerald-50/60 shadow-sm',
  kindTileIdle: 'explore-flow-choice-card--inactive border-neutral-200 bg-white',
  menuRowTitle: 'text-base font-bold leading-snug text-neutral-900 lg:text-[17px]',
  mapPinCard:
    'flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 px-4 py-4 text-left transition hover:border-emerald-300 active:scale-[0.99] md:rounded-md md:border md:px-3 md:py-2.5 md:active:scale-100',
  /** Text fields in host / seek / add compose (large touch on mobile, form-like on md+). */
  composeField:
    'w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-neutral-900 outline-none focus:border-emerald-400 md:rounded-md md:border-neutral-300 md:px-3 md:py-1.5 md:text-sm',
  /** Field labels above compose inputs — sentence case (see meeting / information steps). */
  composeFieldLabel: 'mb-1 block text-sm font-medium text-neutral-700',
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

/** Locate / layer / style icons floating on the map (mobile + desktop) — theme via `.explore-map-overlay-icon-btn`. */
export const EXPLORE_MAP_OVERLAY_ICON_BTN =
  'explore-map-overlay-icon-btn pointer-events-auto inline-flex h-[var(--explore-map-overlay-size)] w-[var(--explore-map-overlay-size)] shrink-0 items-center justify-center rounded-full border transition active:scale-95 disabled:opacity-60 md:h-11 md:w-11';

/** Per-icon frost on the map (no shared toolbar tray). */
export const EXPLORE_MAP_OVERLAY_STANDALONE = 'explore-map-overlay-icon-btn--standalone border-0';

export const EXPLORE_MAP_OVERLAY_ICON =
  'h-6 w-6 shrink-0';

/** Stroke for map chrome glyphs — sits with 12px chrome labels. */
export const EXPLORE_MAP_OVERLAY_ICON_STROKE = 1.5;

export const EXPLORE_MAP_OVERLAY_ICON_BTN_SIZE =
  'h-[var(--explore-map-overlay-size)] w-[var(--explore-map-overlay-size)] md:h-11 md:w-11';

/** Shared height + type — map List/Create, list Map/Create, hub FABs. */
const MOBILE_DOCK_PILL =
  'mobile-dock-pill shrink-0 rounded-full transition active:scale-[0.98]';

export const MOBILE_DOCK_SECONDARY = `${MOBILE_DOCK_PILL} ${EXPLORE_MAP_CHROME_FROST} ring-1 ring-black/5 text-neutral-900 hover:bg-white/80`;

export const MOBILE_DOCK_PRIMARY =
  `${MOBILE_DOCK_PILL} bg-emerald-600 text-white shadow-[0_4px_20px_rgba(5,150,105,.45)] hover:bg-emerald-700`;

export const MOBILE_DOCK_ICON = 'h-5 w-5 shrink-0';

export const EXPLORE_MAP_MOBILE_DOCK_SECONDARY = MOBILE_DOCK_SECONDARY;
export const EXPLORE_MAP_MOBILE_DOCK_PRIMARY = MOBILE_DOCK_PRIMARY;
export const EXPLORE_MAP_MOBILE_DOCK_ICON = MOBILE_DOCK_ICON;

/** Map filter pill when active — Places layer uses sky-forward chips. */
export const exploreMapPlacesFilterActiveClass = (key: MapFilterKey): string => {
  switch (key) {
    case 'all':
    case 'hiking':
    case 'camping':
      return 'bg-sky-600 text-white shadow-sm shadow-sky-900/20';
    case 'facilities':
      return 'bg-teal-700 text-white border-teal-800 shadow-sm shadow-teal-900/20';
    case 'shops':
      return 'bg-rose-700 text-white border-rose-800 shadow-sm shadow-rose-900/20';
    case 'others':
      return 'bg-violet-700 text-white border-violet-800 shadow-sm shadow-violet-900/20';
    default:
      return 'bg-sky-600 text-white shadow-sm shadow-sky-900/20';
  }
};

/** Floating map chrome label — matches bottom nav / Find crew (12px semibold). */
export const EXPLORE_MAP_CHROME_LABEL = 'text-[0.8125rem] font-semibold leading-none';

/** Shared frost shell — sub-filter row and map control toolbar. */
export const EXPLORE_MAP_FROST_TRAY =
  'explore-map-filter-tray rounded-2xl bg-white/55 p-1 shadow-[0_2px_12px_rgba(15,23,42,.12)] ring-1 ring-white/70 backdrop-blur-md';

/** List / map float controls — readable on satellite and desert tiles. */
export const EXPLORE_MAP_FLOATING_CHROME_BTN = `${EXPLORE_MAP_FROST_TRAY} explore-map-floating-chrome-btn inline-flex items-center gap-2 px-4 py-2.5 ${EXPLORE_MAP_CHROME_LABEL} text-neutral-900 transition hover:bg-white/95 hover:text-neutral-950 active:bg-white active:text-neutral-950`;

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
  'flex w-full min-w-0 items-stretch gap-1 md:gap-1.5 rounded-2xl p-1 md:px-1.5 shadow-[0_2px_12px_rgba(15,23,42,.12)] backdrop-blur-md';

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
  `flex min-w-0 flex-1 basis-0 ${EXPLORE_MAP_MOBILE_FILTER_CTA_SEGMENT_HIT} items-center justify-center rounded-xl px-1 md:px-2 text-center transition [-webkit-tap-highlight-color:transparent]`;

export const exploreMapMobileFilterCtaSegmentClass = (
  selected: boolean,
  filterKey: MapFilterKey = 'all'
): string =>
  selected
    ? `${MAP_MOBILE_FILTER_CTA_SEGMENT_BASE} ${exploreMapFilterActiveClass(filterKey)} border-0 shadow-none ring-0`
    : `${MAP_MOBILE_FILTER_CTA_SEGMENT_BASE} text-neutral-800 hover:bg-white/70 active:bg-white/85`;

const MAP_CHILD_CHIP_BASE =
  'inline-flex h-full min-h-[2.375rem] w-full max-lg:min-w-0 shrink-0 items-center justify-center gap-1.5 rounded-full px-2 py-[0.4rem] lg:w-auto lg:px-2.5 lg:py-[0.45rem] text-[12px] font-semibold leading-none transition [-webkit-tap-highlight-color:transparent]';

/** Second-level map category chip (icon + label). */
export const exploreMapChildChipClass = (
  selected: boolean,
  filterKey: MapFilterKey = 'all',
  layer: 'activity' | 'places' = 'activity'
): string => {
  const activeClass =
    layer === 'places' ? exploreMapPlacesFilterActiveClass(filterKey) : exploreMapFilterActiveClass(filterKey);
  return selected
    ? `${MAP_CHILD_CHIP_BASE} ${activeClass} border-0 shadow-none ring-0`
    : `${MAP_CHILD_CHIP_BASE} text-neutral-900 hover:bg-white/50 active:bg-white/70`;
};

/** “All” is text-only in the mark — min width on lg+ matches icon + label chips (e.g. Rideshare). */
export const EXPLORE_MAP_FILTER_ALL_CHIP_CLASS = 'lg:min-w-[6.5rem]';

const MAP_MOBILE_FLOAT_CHIP_BASE =
  'inline-flex min-h-8 max-w-[10.5rem] shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold leading-snug whitespace-nowrap transition [-webkit-tap-highlight-color:transparent] lg:max-w-none lg:min-h-[2.375rem] lg:px-3 lg:py-2';

/** Compact mark box for h-8 map chrome — pairs with `ExploreMarkEmoji` (`index.css` `--explore-mark-emoji-size-chip`). */
export const EXPLORE_MAP_MOBILE_FLOAT_CHIP_MARK = 'explore-filter-mark--chip';

/** Lucide / flag icons paired with float pills. */
export const EXPLORE_MAP_MOBILE_FLOAT_CHIP_GLYPH_CLASS = 'explore-map-float-chip-glyph shrink-0';

/** Mobile map quick filters — individual frosted pills (no shared tray). */
export const exploreMapMobileFloatChipClass = (
  selected: boolean,
  filterKey: MapFilterKey = 'all',
  layer: 'activity' | 'places' = 'activity'
): string => {
  const activeClass =
    layer === 'places' ? exploreMapPlacesFilterActiveClass(filterKey) : exploreMapFilterActiveClass(filterKey);
  const frost = `${EXPLORE_MAP_CHROME_FROST} ring-1 ring-black/5 shadow-[0_2px_12px_rgba(15,23,42,.08)]`;
  return selected
    ? `${MAP_MOBILE_FLOAT_CHIP_BASE} ${activeClass} border-0`
    : `${MAP_MOBILE_FLOAT_CHIP_BASE} ${frost} text-neutral-900 hover:bg-white/80 active:bg-white/95`;
};

export const exploreMapScopeSegmentClass = (selected: boolean, layer: 'activity' | 'places'): string => {
  const base =
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold leading-snug transition [-webkit-tap-highlight-color:transparent]';
  if (!selected) return `${base} text-neutral-700 hover:bg-white/80`;
  return layer === 'places'
    ? `${base} bg-sky-600 text-white shadow-sm shadow-sky-900/20`
    : `${base} bg-emerald-700 text-white shadow-sm shadow-emerald-900/20`;
};

/** Map top scope — emoji + label at readable `text-sm` inside the h-8 tray. */
export const exploreMapScopeSegmentLabeledClass = (
  selected: boolean,
  layer: 'activity' | 'places'
): string =>
  `${exploreMapScopeSegmentClass(selected, layer)} !h-full !min-h-0 !w-auto !shrink-0 !justify-center !gap-1 !px-1.5 !py-0.5 !text-sm !leading-snug`;

/** Mobile explore — offsets for floating map chrome below the solid header. */
export const EXPLORE_MOBILE_MAP_CHROME = {
  filterTop: 'max-lg:top-0',
  noticeTop: 'max-lg:top-[12.5rem]',
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
  /** Map filter pill row — above pin peek so the toolbar stays usable */
  mapFilters: 'z-[4200]',
  /** Pin selection peek card (below filters, below browse sheet) */
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
  /** Share / invite sheet — above compose publish-success */
  shareSheet: 'z-[6800]',
} as const;

/**
 * Map peek card — compact bubble over the pin (mobile + desktop), not a full-height dock.
 */
export const EXPLORE_PEEK = {
  position: `absolute inset-0 overflow-hidden ${EXPLORE_Z.peekCard} pointer-events-none`,
  scrim: 'map-peek-bubble-scrim pointer-events-auto absolute inset-0',
  inner: 'map-peek-bubble pointer-events-auto absolute flex w-[min(100%-1.5rem,23.75rem)] flex-col overflow-hidden',
  shell:
    'map-peek-bubble-card flex shrink-0 flex-col overflow-hidden rounded-[1.35rem] bg-white shadow-[0_12px_40px_rgba(15,23,42,.22)] ring-1 ring-black/8',
  /** Photo/banner chrome — share, close, wishlist, type emoji. */
  mediaIconBtn:
    'inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm hover:bg-black/50 transition-colors',
  mediaEmojiBadge:
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/35 text-lg backdrop-blur-sm',
  /** Map trip peek — light type chip + neutral icon buttons (reference layout). */
  tripTypeBadge:
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-lg ring-1 ring-emerald-100',
  tripChromeBtn:
    'inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200/90 bg-white text-neutral-700 shadow-sm hover:bg-neutral-50',
  tripShareBtn:
    'inline-flex h-9 w-9 items-center justify-center text-neutral-600 hover:text-neutral-900',
  venueTypePill:
    'inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-900 ring-1 ring-emerald-100',
  venueTitle: 'text-base font-bold leading-snug tracking-tight text-neutral-950 line-clamp-2',
  venueMeta: 'text-[11px] font-medium leading-snug text-neutral-600 line-clamp-2',
  venueThumbBadge:
    'absolute bottom-1 left-1 max-w-[calc(100%-0.5rem)] truncate rounded-md bg-black/55 px-1.5 py-0.5 text-[9px] font-semibold text-white',
  venueAmenityChip:
    'inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight',
  tripTitle: 'text-lg font-bold leading-snug tracking-tight text-neutral-950',
  tripHostName: 'text-sm font-semibold text-neutral-950',
  tripSchedule: 'text-xs font-medium text-neutral-600',
  tripMetaRow: 'flex items-center gap-1.5 text-xs font-medium leading-snug text-neutral-700',
  tripEssentials: 'text-xs font-semibold text-neutral-900',
  tripPolicyChip:
    'inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight',
  tripCapacity: 'flex items-center gap-1.5 text-xs font-medium text-neutral-700',
  tripStatChip:
    'inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight',
  tripSituationalBtn:
    'flex w-full min-h-[2.75rem] items-center gap-2 rounded-2xl bg-teal-50 px-3 py-2 text-left text-[11px] font-semibold text-teal-900 ring-1 ring-teal-100 hover:bg-teal-100/80',
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
    case 'facilities':
      return 'bg-teal-700 text-white shadow-sm shadow-teal-900/20';
    case 'event':
      return 'bg-violet-700 text-white shadow-sm shadow-violet-900/20';
    case 'shop':
      return 'bg-rose-700 text-white shadow-sm shadow-rose-900/20';
    default:
      return EXPLORE_BRAND_ACTIVE;
  }
};

export type MapPinRingKind = 'hiking' | 'camping' | 'event' | 'shop' | 'agency' | 'rideshare' | 'area';
export type MapPinRingSource = 'activity' | 'venue' | 'shop' | 'agency' | 'availability';

/** Type-colored ring on map pins — matches filter / badge colors. */
/** Map trip pin fill / ring — aligned with `exploreMapFilterActiveClass` tints. */
export const exploreMapPinRingColor = (
  kind: MapPinRingKind,
  source?: MapPinRingSource
): string => {
  if (source === 'availability') return '#0f766e';
  switch (kind) {
    case 'camping':
      return '#b45309';
    case 'event':
      return '#6d28d9';
    case 'rideshare':
      return '#0369a1';
    case 'shop':
      return '#e11d48';
    case 'agency':
      return '#4f46e5';
    case 'area':
      return '#64748b';
    default:
      return '#047857';
  }
};

/** Map peek card footer CTAs — brand primary, neutral secondary. */
export const EXPLORE_PEEK_CTA = {
  primary:
    'w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 md:py-2 md:text-[13px] md:font-semibold',
  secondary:
    'block w-full rounded-xl border border-neutral-200 bg-white py-3.5 text-center text-sm font-bold text-neutral-800 md:py-2 md:text-[13px] md:font-semibold dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100',
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
  /** Icon-only secondary on map peek dual footer (message host, share, …). */
  peekIconAction:
    'flex h-[2.875rem] w-[2.875rem] shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100',
  venueDirections:
    'flex min-h-[2.75rem] items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-2 py-2.5 text-[12px] font-bold text-neutral-900 hover:bg-neutral-100',
  /** Icon above peek footer tile label — brand stroke, no grey fill (tile is already white + border). */
  peekTileIcon: 'h-4 w-4 shrink-0 text-emerald-700',
} as const;
