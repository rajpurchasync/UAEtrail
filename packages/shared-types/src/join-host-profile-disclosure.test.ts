import { describe, expect, it } from 'vitest';
import {
  joinHostProfileShareNotice,
  resolveJoinHostProfileDisclosureNeeds,
  hostJoinProfileSnippetFromProfile,
} from './join-host-profile-disclosure.js';

describe('join host profile disclosure', () => {
  it('detects women-only and minimum age rules', () => {
    expect(resolveJoinHostProfileDisclosureNeeds(['Women only'], null)).toEqual({
      needsGender: true,
      needsAge: false,
    });
    expect(resolveJoinHostProfileDisclosureNeeds(['Minimum age: 18'], null)).toEqual({
      needsGender: false,
      needsAge: true,
    });
  });

  it('builds host snippet for restricted activities', () => {
    const needs = resolveJoinHostProfileDisclosureNeeds(['Women only', 'Minimum age: 21'], null);
    const snippet = hostJoinProfileSnippetFromProfile(
      { gender: 'female', dateOfBirth: '1990-05-12' },
      needs
    );
    expect(snippet?.gender).toBe('female');
    expect(snippet?.dateOfBirth).toBe('1990-05-12');
    expect(snippet?.age).toBeGreaterThan(10);
  });

  it('returns join notice copy when disclosure applies', () => {
    const msg = joinHostProfileShareNotice({ needsGender: true, needsAge: true });
    expect(msg).toMatch(/host will see/i);
    expect(msg).toMatch(/gender/i);
  });
});
