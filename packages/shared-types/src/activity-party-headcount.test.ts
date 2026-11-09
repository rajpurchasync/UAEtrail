import { describe, expect, it } from 'vitest';
import { resolveActivityPartyHeadcount } from './activity-party-headcount';

describe('resolveActivityPartyHeadcount', () => {
  it('counts adults and kids', () => {
    expect(resolveActivityPartyHeadcount(1, 2)).toBe(3);
    expect(resolveActivityPartyHeadcount(2, 0)).toBe(2);
  });

  it('defaults to one adult', () => {
    expect(resolveActivityPartyHeadcount(undefined, 0)).toBe(1);
  });
});
