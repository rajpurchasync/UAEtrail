import { describe, expect, it } from 'vitest';
import {
  mergeProfileDateOfBirthShare,
  resolveMemberCardDateOfBirth,
} from './profile-date-of-birth-share.js';

describe('profile date of birth share', () => {
  it('migrates legacy age audience', () => {
    expect(mergeProfileDateOfBirthShare(undefined, 'friends')).toBe('year_friends');
    expect(mergeProfileDateOfBirthShare(undefined, 'public')).toBe('year_public');
  });

  it('shows year and age for year_public on public card', () => {
    const slice = resolveMemberCardDateOfBirth({
      dateOfBirth: '1992-06-01',
      share: 'year_public',
      exposure: 'public',
      isSelf: false,
    });
    expect(slice.birthYear).toBe(1992);
    expect(slice.dateOfBirth).toBeNull();
    expect(slice.age).toBeGreaterThan(10);
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
});
