import { describe, expect, it } from 'vitest';
import { resolveProfileHistoryContentKey } from './resolvePlanHubView';

describe('resolveProfileHistoryContentKey', () => {
  it('maps joined role to joined history section', () => {
    expect(
      resolveProfileHistoryContentKey({
        signedIn: true,
        role: 'joined',
        canHost: true,
      })
    ).toBe('joined-completed');
  });

  it('maps hosted role when member can host', () => {
    expect(
      resolveProfileHistoryContentKey({
        signedIn: true,
        role: 'hosted',
        canHost: true,
      })
    ).toBe('hosted-completed');
  });

  it('maps hosted role to pro upsell when member cannot host', () => {
    expect(
      resolveProfileHistoryContentKey({
        signedIn: true,
        role: 'hosted',
        canHost: false,
      })
    ).toBe('hosted-needs-approval');
  });

  it('maps self role to seeking history section', () => {
    expect(
      resolveProfileHistoryContentKey({
        signedIn: true,
        role: 'self',
        canHost: true,
      })
    ).toBe('self-completed');
  });

  it('returns signed-out when guest', () => {
    expect(
      resolveProfileHistoryContentKey({
        signedIn: false,
        role: 'joined',
        canHost: false,
      })
    ).toBe('signed-out');
  });
});
