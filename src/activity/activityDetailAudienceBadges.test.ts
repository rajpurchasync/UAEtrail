import { describe, expect, it } from 'vitest';
import { resolveActivityDetailAudienceBadges } from './activityDetailAudienceBadges';

describe('resolveActivityDetailAudienceBadges', () => {
  it('keeps audience rules and drops difficulty / rideshare chips', () => {
    expect(
      resolveActivityDetailAudienceBadges([
        'Women only',
        'Difficulty: Hard',
        'Reachable by 4x4 only',
        'Rideshare available',
      ])
    ).toEqual(['Women only', 'Kids welcome']);
  });

  it('does not add kids welcome when children are excluded', () => {
    expect(resolveActivityDetailAudienceBadges(['Women only', 'No children'])).toEqual([
      'Women only',
      'No children',
    ]);
  });
});
