import { isGeographyMapSource, type ExploreMapItemDTO } from '@uaetrail/shared-types';

export type ExploreActivityDatePreset = 'anyday' | 'today' | 'tomorrow' | 'week' | 'month';

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

export const parseExploreActivityDatePreset = (value: string | null | undefined): ExploreActivityDatePreset => {
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

export const resolveExploreItemScheduleDate = (item: ExploreMapItemDTO): string | null => {
  const raw = item.date ?? item.activity?.date ?? null;
  if (!raw?.trim()) return null;
  return raw.slice(0, 10);
};

export const matchesExploreActivityDateFilter = (
  item: ExploreMapItemDTO,
  preset: ExploreActivityDatePreset
): boolean => {
  if (preset === 'anyday') return true;
  if (isGeographyMapSource(item.source) || item.source === 'shop' || item.source === 'agency') return true;

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
