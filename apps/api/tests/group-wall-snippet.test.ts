import { describe, expect, it } from 'vitest';
import { groupWallBodySnippet } from '@uaetrail/shared-types';

describe('groupWallBodySnippet', () => {
  it('returns the first line trimmed', () => {
    expect(groupWallBodySnippet('Hello crew\nMore text')).toBe('Hello crew');
  });

  it('truncates long lines', () => {
    const long = 'x'.repeat(200);
    const snippet = groupWallBodySnippet(long);
    expect(snippet.length).toBeLessThanOrEqual(160);
    expect(snippet.endsWith('…')).toBe(true);
  });
});
