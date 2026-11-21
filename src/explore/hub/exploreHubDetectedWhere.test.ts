import { describe, expect, it } from 'vitest';
import { resolveExploreHubDetectedWhereQuery } from './exploreHubDetectedWhere';

describe('resolveExploreHubDetectedWhereQuery', () => {
  it('returns empty when no location signals exist (UI shows Everywhere / placeholder)', () => {
    expect(resolveExploreHubDetectedWhereQuery()).toBe('');
  });
});