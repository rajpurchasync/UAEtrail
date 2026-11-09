import { describe, expect, it } from 'vitest';
import { resolveActivityScrollDetailAudienceBadges } from './activityScrollDetailAudienceBadges';

describe('resolveActivityScrollDetailAudienceBadges', () => {
  it('keeps audience rules and drops difficulty / rideshare chips', () => {
    expect(
      resolveActivityScrollDetailAudienceBadges([
        'Women only',
        'Difficulty: Hard',
        'Reachable by 4x4 only',
        'Rideshare available',
      ])
    ).toEqual(['Women only', 'Kids welcome']);
  });

  it('does not add kids welcome when children are excluded', () => {
    expect(resolveActivityScrollDetailAudienceBadges(['Women only', 'No children'])).toEqual([
      'Women only',
      'No children',
    ]);
  });
});
