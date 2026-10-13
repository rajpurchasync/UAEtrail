import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { resolveExploreItemScheduleDate } from './ui/exploreMapPinModel';

export type ExploreActivityDatePreset = 'anyday' | 'today' | 'tomorrow' | 'week' | 'month';

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

/** Parse `?date=` — presets plus legacy `YYYY-MM-DD` deep links. */
export const parseExploreActivityDatePreset = (value: string | null): ExploreActivityDatePreset => {
  if (!value || value === 'anyday') return 'anyday';
  if (value === 'today' || value === 'tomorrow' || value === 'week' || value === 'month') {
    return value;
  }
  if (ISO_DATE.test(value)) {
    const today = todayIso();
    if (value === today) return 'today';
    if (value === addDaysIso(today, 1)) return 'tomorrow';
  }
  return 'anyday';
};

export const exploreActivityDatePresetLabel = (preset: ExploreActivityDatePreset): string =>
  EXPLORE_ACTIVITY_DATE_PRESET_OPTIONS.find((option) => option.value === preset)?.label ?? 'Anyday';

export const serializeExploreActivityDatePreset = (preset: ExploreActivityDatePreset): string | null =>
  preset === 'anyday' ? null : preset;

/** Inclusive ISO range for Explore People availability (`GET /explore/people/availability`). */
export const exploreActivityDatePresetToInclusiveRange = (
  preset: ExploreActivityDatePreset
): { from: string; to: string } => {
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
  if (item.source === 'venue' || item.source === 'shop' || item.source === 'agency') return true;

  const schedule = resolveExploreItemScheduleDate(item);
  if (!schedule) return false;

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
