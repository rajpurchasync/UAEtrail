import { describe, expect, it } from 'vitest';
import { assertPartyKidsAllowed } from '../src/domain/activity-party-join.js';

describe('assertPartyKidsAllowed', () => {
  it('blocks kids when requirements say no children', () => {
    expect(() => assertPartyKidsAllowed(1, ['No children'], undefined)).toThrow(/does not allow children/i);
  });

  it('allows zero kids without checking rules', () => {
    expect(() => assertPartyKidsAllowed(0, ['No children'], false)).not.toThrow();
  });
});
