import { describe, expect, it } from 'vitest';
import {
  clampMemberDobDay,
  formatMemberDobDisplay,
  formatMemberDobIso,
  isMemberDobIsoAllowed,
  parseMemberDobIso,
} from './memberDateOfBirthPicker';

describe('memberDateOfBirthPicker', () => {
  it('formats and parses ISO dates', () => {
    expect(formatMemberDobIso({ year: 1992, month: 3, day: 10 })).toBe('1992-03-10');
    expect(parseMemberDobIso('1992-03-10')).toEqual({ year: 1992, month: 3, day: 10 });
    expect(formatMemberDobDisplay('1992-03-10')).toBe('10 March 1992');
  });

  it('clamps invalid days for month', () => {
    expect(clampMemberDobDay(2020, 2, 31)).toBe(29);
    expect(clampMemberDobDay(1999, 2, 31)).toBe(28);
  });

  it('rejects dates after member max', () => {
    expect(isMemberDobIsoAllowed('2030-01-01')).toBe(false);
  });
});
