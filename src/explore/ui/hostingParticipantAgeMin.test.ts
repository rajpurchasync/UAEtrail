import { describe, expect, it } from 'vitest';
import {
  formatParticipantMinAgeFieldValue,
  parseParticipantMinAgeFieldValue,
} from './hostingParticipantAgeMin';

describe('hostingParticipantAgeMin', () => {
  it('allows clearing the field and typing a new minimum age', () => {
    expect(formatParticipantMinAgeFieldValue(18)).toBe('18');
    expect(parseParticipantMinAgeFieldValue('')).toBe(0);
    expect(formatParticipantMinAgeFieldValue(0)).toBe('');
    expect(parseParticipantMinAgeFieldValue('21')).toBe(21);
  });
});
