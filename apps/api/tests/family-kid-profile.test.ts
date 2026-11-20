import { describe, expect, it } from 'vitest';
import {
  createKidSchema,
  isKidProfileComplete,
  isKidRosterAge,
  normalizeKidProfileInput,
} from '../src/domain/family-kid-profile.js';

describe('family kid profile', () => {
  it('treats name-only roster rows as incomplete until trip fields are saved', () => {
    expect(
      isKidProfileComplete({
        displayName: 'Sam',
        dateOfBirth: null,
        emergencyContactName: '',
        emergencyContactPhone: '',
        medicalConditions: '',
      })
    ).toBe(false);
  });

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

  it('rejects kid DOB at or above roster max age', () => {
    const teen = new Date();
    teen.setFullYear(teen.getFullYear() - 13);
    expect(isKidRosterAge(teen)).toBe(false);

    const child = new Date();
    child.setFullYear(child.getFullYear() - 8);
    expect(isKidRosterAge(child)).toBe(true);

    expect(() =>
      createKidSchema.parse({
        displayName: 'Teen',
        dateOfBirth: teen.toISOString().slice(0, 10),
        emergencyContactName: 'Parent',
        emergencyContactPhone: '+971501234567',
        medicalConditions: 'N/A',
      })
    ).toThrow();
  });
});
