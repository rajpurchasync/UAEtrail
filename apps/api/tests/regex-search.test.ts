import { describe, expect, it } from 'vitest';
import { escapeRegexLiteral, normalizeSearchRegexInput } from '../src/lib/regex-search.js';

describe('regex-search', () => {
  it('escapes regex metacharacters', () => {
    expect(escapeRegexLiteral('a+b(c)')).toBe('a\\+b\\(c\\)');
  });

  it('returns null for blank search', () => {
    expect(normalizeSearchRegexInput('   ')).toBeNull();
  });

  it('caps length', () => {
    const long = 'a'.repeat(100);
    expect(normalizeSearchRegexInput(long)?.length).toBe(64);
  });
});
