import { describe, expect, it } from 'vitest';
import { resolveExploreHubDetectedWhereQuery } from './exploreHubDetectedWhere';

describe('resolveExploreHubDetectedWhereQuery', () => {
  it('falls back to Dubai when no location signals exist', () => {
    expect(resolveExploreHubDetectedWhereQuery()).toBe('Dubai');
  });
});