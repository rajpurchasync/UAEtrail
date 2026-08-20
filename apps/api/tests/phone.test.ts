import { describe, expect, it } from 'vitest';
import { formatE164Phone, isValidE164Phone, isValidNationalPhone } from '../src/lib/phone.js';

describe('phone helpers', () => {
  it('formats UAE numbers to E.164', () => {
    expect(formatE164Phone('+971', '50 123 4567')).toBe('+971501234567');
    expect(isValidE164Phone('+971501234567')).toBe(true);
  });

  it('validates national numbers', () => {
    expect(isValidNationalPhone('501234567')).toBe(true);
    expect(isValidNationalPhone('123')).toBe(false);
  });
});
