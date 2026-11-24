import { describe, expect, it } from 'vitest';
import {
  catalogOnSiteIdUpdate,
  resolveStoredOnSiteId,
} from '../src/lib/facility-on-site-sync.js';

describe('facility onSiteId sync (MIG-DESTINATION-GEO D0.5)', () => {
  it('catalogOnSiteIdUpdate writes onSiteId only', () => {
    expect(catalogOnSiteIdUpdate('place-1')).toEqual({ onSiteId: 'place-1' });
    expect(catalogOnSiteIdUpdate(null)).toEqual({ onSiteId: null });
  });

  it('resolveStoredOnSiteId reads onSiteId only', () => {
    expect(resolveStoredOnSiteId({ onSiteId: 'a' })).toBe('a');
    expect(resolveStoredOnSiteId({})).toBeNull();
  });
});