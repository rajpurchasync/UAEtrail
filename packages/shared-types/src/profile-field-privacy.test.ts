import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROFILE_FIELD_PRIVACY,
  canViewProfileField,
  mergeProfileFieldPrivacy,
} from './profile-field-privacy.js';

describe('profile field privacy', () => {
  it('merges stored settings over defaults', () => {
    const merged = mergeProfileFieldPrivacy({ bio: 'hidden', tripHistory: 'public' });
    expect(merged.bio).toBe('hidden');
    expect(merged.tripHistory).toBe('public');
  });

  it('ignores invalid audience values', () => {
    const merged = mergeProfileFieldPrivacy({ bio: 'invalid' as 'public' });
    expect(merged.bio).toBe('public');
  });

  it('defaults trip history and vehicles to hidden', () => {
    expect(DEFAULT_PROFILE_FIELD_PRIVACY.tripHistory).toBe('hidden');
    expect(DEFAULT_PROFILE_FIELD_PRIVACY.vehicles).toBe('hidden');
    expect(DEFAULT_PROFILE_FIELD_PRIVACY.vehiclePlate).toBe('hidden');
  });

  it('respects friends vs public exposure', () => {
    expect(canViewProfileField('public', 'public', false)).toBe(true);
    expect(canViewProfileField('public', 'full', false)).toBe(true);
    expect(canViewProfileField('public', 'none', false)).toBe(false);
    expect(canViewProfileField('friends', 'public', false)).toBe(false);
    expect(canViewProfileField('friends', 'full', false)).toBe(true);
    expect(canViewProfileField('hidden', 'full', false)).toBe(false);
    expect(canViewProfileField('hidden', 'full', true)).toBe(true);
  });
});
