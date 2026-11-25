import { describe, expect, it } from 'vitest';
import { BROWSE_DISCOVER_PARAM, LIST_CAT_PARAM } from './discoverySessionParams';

describe('discoverySessionParams', () => {
  it('exposes stable list/explore shared query keys', () => {
    expect(LIST_CAT_PARAM).toBe('listCat');
    expect(BROWSE_DISCOVER_PARAM).toBe('browse');
  });
});