import type {
  ActivityListFilterKey,
  MapFilterKey,
  VenueListFilterKey,
} from '../utils/exploreRouting';

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

/** Primary chrome — brand actions, default filters. */
export const EXPLORE_BRAND_ACTIVE =
  'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/15';

/** Map filter pill when active — type color where it helps scanning. */
export const exploreMapFilterActiveClass = (key: MapFilterKey): string => {
  switch (key) {
    case 'all':
    case 'hiking':
      return EXPLORE_BRAND_ACTIVE;
    case 'camping':
      return 'bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-600/15';
    case 'carpool':
      return 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/15';
    case 'others':
      return 'bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-600/15';
    case 'shops':
      return 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/15';
    default:
      return EXPLORE_BRAND_ACTIVE;
  }
};

export const EXPLORE_MAP_FILTER_INACTIVE =
  'bg-white/95 text-gray-800 border-neutral-200/80 shadow-[0_2px_10px_rgba(15,23,42,.12)] backdrop-blur-sm';

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

export const EXPLORE_FLOATING_CONTROL =
  'inline-flex items-center rounded-full bg-white/95 shadow-[0_2px_12px_rgba(15,23,42,.14)] backdrop-blur-sm';

/** Mobile explore — offsets for floating map chrome below the solid header. */
export const EXPLORE_MOBILE_MAP_CHROME = {
  filterTop: 'max-lg:top-3',
  noticeTop: 'max-lg:top-14',
} as const;

/** Explore map stacking — keep in sync across peek cards, filters, and sheets. */
export const EXPLORE_Z = {
  /** Map filter pill row */
  mapFilters: 'z-[3000]',
  /** Pin selection peek card (above filters, below browse sheet) */
  peekCard: 'z-[4000]',
  /** Browse list sheet */
  browseSheet: 'z-[5500]',
} as const;

/** Compact map peek card — same silhouette for venues and activities. */
export const EXPLORE_PEEK = {
  position:
    `pointer-events-none absolute inset-x-0 bottom-0 ${EXPLORE_Z.peekCard} px-4 pb-[calc(var(--safe-bottom)+88px)] lg:px-6 lg:pb-6`,
  inner: 'pointer-events-auto mx-auto w-full max-w-md',
  shell:
    'overflow-hidden rounded-2xl bg-white shadow-[0_8px_32px_rgba(15,23,42,.16)] ring-1 ring-black/5',
} as const;

export const EXPLORE_LIST_FILTER_INACTIVE = 'bg-white text-gray-700 ring-1 ring-neutral-200';

export const exploreActivityListFilterActiveClass = (key: ActivityListFilterKey): string => {
  switch (key) {
    case 'camping':
      return 'bg-amber-600 text-white shadow-sm shadow-amber-600/15';
    case 'carpool':
      return 'bg-sky-600 text-white shadow-sm shadow-sky-600/15';
    case 'event':
      return 'bg-violet-600 text-white shadow-sm shadow-violet-600/15';
    default:
      return EXPLORE_BRAND_ACTIVE;
  }
};

export const exploreVenueListFilterActiveClass = (key: VenueListFilterKey): string => {
  switch (key) {
    case 'camping':
      return 'bg-amber-600 text-white shadow-sm shadow-amber-600/15';
    case 'event':
      return 'bg-violet-600 text-white shadow-sm shadow-violet-600/15';
    case 'shop':
      return 'bg-rose-600 text-white shadow-sm shadow-rose-600/15';
    default:
      return EXPLORE_BRAND_ACTIVE;
  }
};

export type MapPinRingKind = 'hiking' | 'camping' | 'event' | 'shop' | 'agency' | 'carpool';
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
    case 'carpool':
      return '#0284c7';
    case 'shop':
      return '#e11d48';
    case 'agency':
      return '#4f46e5';
    default:
      return '#059669';
  }
};
