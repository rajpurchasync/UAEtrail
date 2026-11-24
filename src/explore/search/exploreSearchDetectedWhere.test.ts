import { describe, expect, it } from 'vitest';
import { EXPLORE_REGION_PILL_LABELS } from '../../config/regions';
import { resolveExploreSearchDetectedWhereQuery } from './exploreSearchDetectedWhere';

describe('resolveExploreSearchDetectedWhereQuery', () => {
  it('falls back to Dubai when no GPS cache exists', () => {
    expect(resolveExploreSearchDetectedWhereQuery()).toBe(EXPLORE_REGION_PILL_LABELS.Dubai);
  });
});