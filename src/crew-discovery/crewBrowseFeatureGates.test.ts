import { describe, expect, it } from 'vitest';
import { crewBrowseLanesForProduct } from './crewBrowseFeatureGates';
import { FEATURE_FLAGS } from '@/config/platform';

describe('crewBrowseFeatureGates', () => {
  it('exposes Community tab when community discover ships', () => {
    expect(FEATURE_FLAGS.communityDiscover).toBe(true);
    expect(crewBrowseLanesForProduct()).toEqual(['people', 'community', 'professional']);
  });
});