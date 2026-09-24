import { maxDateOfBirthForMember } from '../constants/userProfileOptions';

export const MEMBER_DOB_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export type MemberDobParts = { year: number; month: number; day: number };

export const parseMemberDobIso = (iso: string): MemberDobParts | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [yearRaw, monthRaw, dayRaw] = iso.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
};

export const formatMemberDobIso = ({ year, month, day }: MemberDobParts): string =>
  `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

export const formatMemberDobDisplay = (iso: string): string | null => {
  const parts = parseMemberDobIso(iso);
  if (!parts) return null;
  const monthLabel = MEMBER_DOB_MONTHS[parts.month - 1];
  if (!monthLabel) return null;
  return `${parts.day} ${monthLabel} ${parts.year}`;
};

export const daysInMonth = (year: number, month: number): number =>
  new Date(year, month, 0).getDate();

export const clampMemberDobDay = (year: number, month: number, day: number): number =>
  Math.min(Math.max(1, day), daysInMonth(year, month));

export const memberDobYearBounds = (): { minYear: number; maxYear: number } => {
  const maxIso = maxDateOfBirthForMember();
  const maxParts = parseMemberDobIso(maxIso);
  const maxYear = maxParts?.year ?? new Date().getFullYear() - 5;
  return { minYear: maxYear - 100, maxYear };
};

export const memberDobYearOptions = (): number[] => {
  const { minYear, maxYear } = memberDobYearBounds();
  const years: number[] = [];
  for (let year = maxYear; year >= minYear; year -= 1) {
    years.push(year);
  }
  return years;
};

export const isMemberDobIsoAllowed = (iso: string): boolean => {
  const parts = parseMemberDobIso(iso);
  if (!parts) return false;
  const maxIso = maxDateOfBirthForMember();
  return iso <= maxIso;
};

export const defaultMemberDobDraft = (): MemberDobParts => {
  const maxIso = maxDateOfBirthForMember();
  const parsed = parseMemberDobIso(maxIso);
  if (parsed) {
    return { year: parsed.year - 25, month: parsed.month, day: clampMemberDobDay(parsed.year - 25, parsed.month, parsed.day) };
  }
  const now = new Date();
  const year = now.getFullYear() - 25;
  return { year, month: 1, day: 1 };
};
