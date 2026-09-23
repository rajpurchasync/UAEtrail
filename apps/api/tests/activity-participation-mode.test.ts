import { describe, expect, it } from 'vitest';
import {
  APPROVAL_PARTICIPATION_REQUIREMENT,
  RSVP_PARTICIPATION_REQUIREMENT,
  inferParticipationModeFromRequirements,
} from '@uaetrail/shared-types';
import { resolveParticipationMode } from '../src/domain/activity-participation-mode.js';

describe('participation mode resolution', () => {
  it('prefers stored field over requirements text', () => {
    expect(
      resolveParticipationMode('approval', [RSVP_PARTICIPATION_REQUIREMENT])
    ).toBe('approval');
    expect(
      resolveParticipationMode('rsvp', [APPROVAL_PARTICIPATION_REQUIREMENT])
    ).toBe('rsvp');
  });

  it('infers RSVP from legacy requirements marker', () => {
    expect(
      inferParticipationModeFromRequirements([RSVP_PARTICIPATION_REQUIREMENT, 'Women only'])
    ).toBe('rsvp');
  });

  it('defaults to approval when unknown', () => {
    expect(inferParticipationModeFromRequirements(['Women only'])).toBe('approval');
    expect(resolveParticipationMode(null, null)).toBe('approval');
  });
});
