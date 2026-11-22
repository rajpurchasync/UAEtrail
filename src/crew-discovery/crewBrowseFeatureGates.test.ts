import { describe, expect, it } from 'vitest';
import { crewBrowseLanesForProduct } from './crewBrowseFeatureGates';
import { FEATURE_FLAGS } from '@/config/platform';

describe('crewBrowseFeatureGates', () => {
  it('hides Community tab until MIG-COMMUNITY-DISCOVER', () => {
    expect(FEATURE_FLAGS.communityDiscover).toBe(false);
    expect(crewBrowseLanesForProduct()).toEqual(['people', 'professional']);
  });
});