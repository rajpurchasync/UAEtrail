import { describe, expect, it } from 'vitest';
import { DISCOVER_RECOMMENDATIONS_SCHEMA_VERSION } from './discover-recommendations';

describe('discover-recommendations contract', () => {
  it('schema version is stable', () => {
    expect(DISCOVER_RECOMMENDATIONS_SCHEMA_VERSION).toBe(1);
  });
});