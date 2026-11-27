import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  activityScheduleIncludesDate,
  activityScheduleOverlapsRange,
  exploreMapItemIsAvailabilityCatalog,
  isGeographyMapSource,
} from '@uaetrail/shared-types';
import { resolveExploreItemScheduleWindow } from './ui/exploreMapPinModel';

export type ExploreActivityDateNamedPreset =
  | 'anyday'
  | 'today'
  | 'tomorrow'
  | 'week'
  | 'nextweek'
  | 'month'
  | 'nextmonth'
  | 'thisyear'
  | 'nextyear';
/** Named windows, or a custom inclusive ISO range `YYYY-MM-DD..YYYY-MM-DD`. */
export type ExploreActivityDatePreset = ExploreActivityDateNamedPreset | (string & {});

/** Explore map default when `?date=` is absent (map chrome date pill). */
export const EXPLORE_MAP_DEFAULT_ACTIVITY_DATE_PRESET: ExploreActivityDateNamedPreset = 'week';

/** Map date pill menu — excludes Today / Tomorrow. */
export const EXPLORE_MAP_ACTIVITY_DATE_PRESET_OPTIONS: ReadonlyArray<{
  value: ExploreActivityDatePreset;
  label: string;
}> = [
  { value: 'anyday', label: 'Anyday' },
  { value: 'week', label: 'This week' },
  { value: 'nextweek', label: 'Next week' },
  { value: 'month', label: 'This month' },
  { value: 'nextmonth', label: 'Next month' },
  { value: 'thisyear', label: 'This year' },
  { value: 'nextyear', label: 'Next year' },
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const todayIso = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseIsoDate = (iso: string): Date => new Date(`${iso}T12:00:00`);

const formatIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const addDaysIso = (iso: string, days: number): string => {
  const next = parseIsoDate(iso);
  next.setDate(next.getDate() + days);
  return formatIsoDate(next);
};

const startOfWeekIso = (referenceIso: string): string => {
  const date = parseIsoDate(referenceIso);
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return formatIsoDate(date);
};

const endOfWeekIso = (referenceIso: string): string => addDaysIso(startOfWeekIso(referenceIso), 6);

const startOfMonthIso = (referenceIso: string): string => {
  const date = parseIsoDate(referenceIso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
};

const endOfMonthIso = (referenceIso: string): string => {
  const date = parseIsoDate(referenceIso);
  date.setMonth(date.getMonth() + 1, 0);
  return formatIsoDate(date);
};

const startOfNextMonthIso = (referenceIso: string): string => {
  const date = parseIsoDate(referenceIso);
  date.setDate(1);
  date.setMonth(date.getMonth() + 1);
  return formatIsoDate(date);
};

const endOfNextMonthIso = (referenceIso: string): string => {
  const date = parseIsoDate(referenceIso);
  date.setMonth(date.getMonth() + 2, 0);
  return formatIsoDate(date);
};

const startOfYearIso = (year: number): string => `${year}-01-01`;

const endOfYearIso = (year: number): string => `${year}-12-31`;

const calendarYearFromIso = (referenceIso: string): number => parseIsoDate(referenceIso).getFullYear();

const CUSTOM_ACTIVITY_DATE_RANGE = /^(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})$/;

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDayMonth = (iso: string): string => {
  const month = Number(iso.slice(5, 7));
  const day = Number(iso.slice(8, 10));
  return `${day} ${SHORT_MONTHS[month - 1] ?? iso.slice(5, 7)}`;
};

export const parseCustomActivityDateRange = (
  preset: string
): { from: string; to: string } | null => {
  const match = CUSTOM_ACTIVITY_DATE_RANGE.exec(preset);
  if (!match) return null;
  const from = match[1];
  const to = match[2];
  return from <= to ? { from, to } : { from: to, to: from };
};

export const encodeCustomActivityDateRange = (from: string, to: string): ExploreActivityDatePreset => {
  if (!ISO_DATE.test(from) || !ISO_DATE.test(to)) return 'anyday';
  return from <= to ? `${from}..${to}` : `${to}..${from}`;
};

export const formatCustomActivityDateRangeLabel = (from: string, to: string): string => {
  if (from === to) return formatDayMonth(from);
  if (from.slice(0, 7) === to.slice(0, 7)) {
    return `${Number(from.slice(8, 10))}–${formatDayMonth(to)}`;
  }
  return `${formatDayMonth(from)}–${formatDayMonth(to)}`;
};

/** Parse `?date=` — presets, `YYYY-MM-DD..YYYY-MM-DD`, plus legacy `YYYY-MM-DD` deep links. */
export const parseExploreActivityDatePreset = (value: string | null): ExploreActivityDatePreset => {
  if (!value || value === 'anyday') return 'anyday';
  if (
    value === 'today' ||
    value === 'tomorrow' ||
    value === 'week' ||
    value === 'nextweek' ||
    value === 'month' ||
    value === 'nextmonth' ||
    value === 'thisyear' ||
    value === 'nextyear'
  ) {
    return value;
  }
  const custom = parseCustomActivityDateRange(value);
  if (custom) return encodeCustomActivityDateRange(custom.from, custom.to);
  if (ISO_DATE.test(value)) {
    const today = todayIso();
    if (value === today) return 'today';
    if (value === addDaysIso(today, 1)) return 'tomorrow';
  }
  return 'anyday';
};

/** Hydrate explore map `?date=` — default to {@link EXPLORE_MAP_DEFAULT_ACTIVITY_DATE_PRESET}. */
export const resolveExploreMapActivityDatePreset = (value: string | null): ExploreActivityDatePreset => {
  const parsed = parseExploreActivityDatePreset(value);
  if (parsed === 'anyday') return EXPLORE_MAP_DEFAULT_ACTIVITY_DATE_PRESET;
  return parsed;
};

const EXPLORE_ACTIVITY_DATE_PRESET_LABELS: Record<ExploreActivityDateNamedPreset, string> = {
  anyday: 'Anyday',
  today: 'Today',
  tomorrow: 'Tomorrow',
  week: 'This week',
  nextweek: 'Next week',
  month: 'This month',
  nextmonth: 'Next month',
  thisyear: 'This year',
  nextyear: 'Next year',
};

export const exploreActivityDatePresetLabel = (preset: ExploreActivityDatePreset): string => {
  const custom = parseCustomActivityDateRange(preset);
  if (custom) return formatCustomActivityDateRangeLabel(custom.from, custom.to);
  if (preset in EXPLORE_ACTIVITY_DATE_PRESET_LABELS) {
    return EXPLORE_ACTIVITY_DATE_PRESET_LABELS[preset as ExploreActivityDateNamedPreset];
  }
  return 'Anyday';
};

/** Compact tray chip — omit when Anyday (icon only). */
export const exploreActivityDatePresetCompactLabel = (
  preset: ExploreActivityDatePreset
): string | null => {
  if (preset === 'anyday') return null;
  const custom = parseCustomActivityDateRange(preset);
  if (custom) return formatCustomActivityDateRangeLabel(custom.from, custom.to);
  if (preset === 'tomorrow') return 'Tmrw';
  if (preset === 'week') return 'Week';
  if (preset === 'nextweek') return 'Next wk';
  if (preset === 'month') return 'Month';
  if (preset === 'nextmonth') return 'Next mo';
  if (preset === 'thisyear') return 'This yr';
  if (preset === 'nextyear') return 'Next yr';
  return 'Today';
};

export const serializeExploreActivityDatePreset = (preset: ExploreActivityDatePreset): string | null =>
  preset === 'anyday' ? null : preset;

/** Omit canonical map default from explore URLs (same as anyday). */
export const serializeExploreMapActivityDatePreset = (preset: ExploreActivityDatePreset): string | null => {
  if (preset === 'anyday' || preset === EXPLORE_MAP_DEFAULT_ACTIVITY_DATE_PRESET) return null;
  return preset;
};

/** Inclusive ISO range for Explore People availability (`GET /explore/people/availability`). */
export const exploreActivityDatePresetToInclusiveRange = (
  preset: ExploreActivityDatePreset
): { from: string; to: string } => {
  const custom = parseCustomActivityDateRange(preset);
  if (custom) return custom;
  const today = todayIso();
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'tomorrow': {
      const day = addDaysIso(today, 1);
      return { from: day, to: day };
    }
    case 'week':
      return { from: startOfWeekIso(today), to: endOfWeekIso(today) };
    case 'nextweek': {
      const start = addDaysIso(endOfWeekIso(today), 1);
      return { from: start, to: addDaysIso(start, 6) };
    }
    case 'month':
      return { from: startOfMonthIso(today), to: endOfMonthIso(today) };
    case 'nextmonth':
      return { from: startOfNextMonthIso(today), to: endOfNextMonthIso(today) };
    case 'thisyear':
      return { from: startOfYearIso(calendarYearFromIso(today)), to: endOfYearIso(calendarYearFromIso(today)) };
    case 'nextyear': {
      const year = calendarYearFromIso(today) + 1;
      return { from: startOfYearIso(year), to: endOfYearIso(year) };
    }
    case 'anyday':
    default:
      return { from: today, to: addDaysIso(today, 13) };
  }
};

/** When set, scheduled activities/demand must match; venues and shops stay visible. */
export const matchesActivityDateFilter = (
  item: ExploreMapItemDTO,
  preset: ExploreActivityDatePreset
): boolean => {
  if (preset === 'anyday') return true;
  if (isGeographyMapSource(item.source) || item.source === 'shop' || item.source === 'agency') return true;

  const window = resolveExploreItemScheduleWindow(item);
  if (!window) return exploreMapItemIsAvailabilityCatalog(item);

  const custom = parseCustomActivityDateRange(preset);
  if (custom) {
    return activityScheduleOverlapsRange(window.start, window.end, custom.from, custom.to);
  }

  const today = todayIso();
  switch (preset) {
    case 'today':
      return activityScheduleIncludesDate({ date: window.start, endDate: window.end }, today);
    case 'tomorrow':
      return activityScheduleIncludesDate(
        { date: window.start, endDate: window.end },
        addDaysIso(today, 1)
      );
    case 'week':
      return activityScheduleOverlapsRange(
        window.start,
        window.end,
        startOfWeekIso(today),
        endOfWeekIso(today)
      );
    case 'nextweek': {
      const start = addDaysIso(endOfWeekIso(today), 1);
      return activityScheduleOverlapsRange(window.start, window.end, start, addDaysIso(start, 6));
    }
    case 'month':
      return activityScheduleOverlapsRange(
        window.start,
        window.end,
        startOfMonthIso(today),
        endOfMonthIso(today)
      );
    case 'nextmonth':
      return activityScheduleOverlapsRange(
        window.start,
        window.end,
        startOfNextMonthIso(today),
        endOfNextMonthIso(today)
      );
    case 'thisyear':
      return activityScheduleOverlapsRange(
        window.start,
        window.end,
        startOfYearIso(calendarYearFromIso(today)),
        endOfYearIso(calendarYearFromIso(today))
      );
    case 'nextyear': {
      const year = calendarYearFromIso(today) + 1;
      return activityScheduleOverlapsRange(
        window.start,
        window.end,
        startOfYearIso(year),
        endOfYearIso(year)
      );
    }
    default:
      return true;
  }
};
