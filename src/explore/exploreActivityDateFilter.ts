import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { isGeographyMapSource } from '@uaetrail/shared-types';
import { resolveExploreItemScheduleDate } from './ui/exploreMapPinModel';

export type ExploreActivityDateNamedPreset = 'anyday' | 'today' | 'tomorrow' | 'week' | 'month';
/** Named windows, or a custom inclusive ISO range `YYYY-MM-DD..YYYY-MM-DD`. */
export type ExploreActivityDatePreset = ExploreActivityDateNamedPreset | (string & {});

export const EXPLORE_ACTIVITY_DATE_PRESET_OPTIONS: ReadonlyArray<{
  value: ExploreActivityDatePreset;
  label: string;
}> = [
  { value: 'anyday', label: 'Anyday' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
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

const isIsoInInclusiveRange = (iso: string, start: string, end: string): boolean => iso >= start && iso <= end;

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
  if (value === 'today' || value === 'tomorrow' || value === 'week' || value === 'month') {
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

export const exploreActivityDatePresetLabel = (preset: ExploreActivityDatePreset): string => {
  const custom = parseCustomActivityDateRange(preset);
  if (custom) return formatCustomActivityDateRangeLabel(custom.from, custom.to);
  return EXPLORE_ACTIVITY_DATE_PRESET_OPTIONS.find((option) => option.value === preset)?.label ?? 'Anyday';
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
  if (preset === 'month') return 'Month';
  return 'Today';
};

export const serializeExploreActivityDatePreset = (preset: ExploreActivityDatePreset): string | null =>
  preset === 'anyday' ? null : preset;

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
    case 'month':
      return { from: startOfMonthIso(today), to: endOfMonthIso(today) };
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

  const schedule = resolveExploreItemScheduleDate(item);
  if (!schedule) return false;

  const custom = parseCustomActivityDateRange(preset);
  if (custom) return isIsoInInclusiveRange(schedule, custom.from, custom.to);

  const today = todayIso();
  switch (preset) {
    case 'today':
      return schedule === today;
    case 'tomorrow':
      return schedule === addDaysIso(today, 1);
    case 'week':
      return isIsoInInclusiveRange(schedule, startOfWeekIso(today), endOfWeekIso(today));
    case 'month':
      return isIsoInInclusiveRange(schedule, startOfMonthIso(today), endOfMonthIso(today));
    default:
      return true;
  }
};
