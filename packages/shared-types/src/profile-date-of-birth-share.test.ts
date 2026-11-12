import { describe, expect, it } from 'vitest';
import {
  formatProfileMonthDayLabel,
  mergeProfileDateOfBirthShare,
  resolveMemberCardDateOfBirth,
} from './profile-date-of-birth-share.js';

describe('profile date of birth share', () => {
  it('migrates legacy age audience to day+month', () => {
    expect(mergeProfileDateOfBirthShare(undefined, 'friends')).toBe('month_day_friends');
    expect(mergeProfileDateOfBirthShare(undefined, 'public')).toBe('month_day_public');
  });

  it('migrates retired year_* share levels', () => {
    expect(mergeProfileDateOfBirthShare('year_friends')).toBe('month_day_friends');
    expect(mergeProfileDateOfBirthShare('year_public')).toBe('month_day_public');
  });

  it('shows month-day only for month_day_public on public card', () => {
    const slice = resolveMemberCardDateOfBirth({
      dateOfBirth: '1992-06-01',
      share: 'month_day_public',
      exposure: 'public',
      isSelf: false,
    });
    expect(slice.monthDay).toBe('06-01');
    expect(slice.dateOfBirth).toBeNull();
    expect(slice.birthYear).toBeNull();
    expect(slice.age).toBeNull();
  });

  it('shows full dob for full_friends when trusted', () => {
    const slice = resolveMemberCardDateOfBirth({
      dateOfBirth: '1992-06-01',
      share: 'full_friends',
      exposure: 'full',
      isSelf: false,
    });
    expect(slice.dateOfBirth).toBe('1992-06-01');
  });

  it('shows month-day for friends_of_friends when relation is FoF', () => {
    const slice = resolveMemberCardDateOfBirth({
      dateOfBirth: '1992-06-01',
      share: 'month_day_friends_of_friends',
      exposure: 'public',
      isSelf: false,
      relation: 'friend_of_friend',
    });
    expect(slice.monthDay).toBe('06-01');
    expect(slice.dateOfBirth).toBeNull();
  });

  it('hides FoF dob from strangers', () => {
    const slice = resolveMemberCardDateOfBirth({
      dateOfBirth: '1992-06-01',
      share: 'month_day_friends_of_friends',
      exposure: 'public',
      isSelf: false,
      relation: 'stranger',
    });
    expect(slice.monthDay).toBeNull();
  });

  it('formats month-day labels without a year', () => {
    expect(formatProfileMonthDayLabel('06-01')).toBe('1 June');
  });
});
