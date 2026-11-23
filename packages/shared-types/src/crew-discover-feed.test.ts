import { describe, expect, it } from 'vitest';
import { CREW_DISCOVER_FEED_SCHEMA_VERSION } from './crew-discover-feed.js';

describe('crew discover feed (PLS-2)', () => {
  it('pins schema version', () => {
    expect(CREW_DISCOVER_FEED_SCHEMA_VERSION).toBe(1);
  });
});