import { describe, expect, it } from 'vitest';
import {
  isKidProfileComplete,
  normalizeKidProfileInput,
} from '../src/domain/family-kid-profile.js';

describe('family kid profile', () => {
  it('requires name, DOB, emergency contact, and medical info', () => {
    expect(
      isKidProfileComplete({
        displayName: 'Sam',
        dateOfBirth: '2018-05-01',
        emergencyContactName: 'Parent',
        emergencyContactPhone: '+971501234567',
        medicalConditions: 'N/A',
      })
    ).toBe(true);

    expect(
      isKidProfileComplete({
        displayName: 'Sam',
        dateOfBirth: '2018-05-01',
        emergencyContactName: 'Parent',
        emergencyContactPhone: '+971501234567',
        medicalConditions: '',
      })
    ).toBe(false);
  });

  it('normalizes medical N/A and validates phone', () => {
    expect(() =>
      normalizeKidProfileInput({
        medicalConditions: 'n/a',
        emergencyContactPhone: '+971501234567',
      })
    ).not.toThrow();

    expect(() =>
      normalizeKidProfileInput({
        emergencyContactPhone: '0501234567',
      })
    ).toThrow();
  });

  it('accepts optional gender, photo, and relation without requiring them for completeness', () => {
    expect(
      isKidProfileComplete({
        displayName: 'Sam',
        dateOfBirth: '2018-05-01',
        emergencyContactName: 'Parent',
        emergencyContactPhone: '+971501234567',
        medicalConditions: 'N/A',
        gender: null,
        photoUrl: null,
      })
    ).toBe(true);

    const normalized = normalizeKidProfileInput({
      gender: 'female',
      photoUrl: 'https://cdn.example.com/kid.webp',
      emergencyContactRelation: 'Me',
    });
    expect(normalized.gender).toBe('female');
    expect(normalized.photoUrl).toBe('https://cdn.example.com/kid.webp');
    expect(normalized.emergencyContactRelation).toBe('Me');
  });
});
