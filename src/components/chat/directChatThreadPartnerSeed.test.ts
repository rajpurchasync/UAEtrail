import { describe, expect, it } from 'vitest';
import {
  directChatThreadSeedForPartnerOpen,
  directChatThreadSeedWhenPartnerClosed,
} from './directChatThreadPartnerSeed';

describe('directChatThreadPartnerSeed', () => {
  it('clears load state when the thread closes', () => {
    expect(directChatThreadSeedWhenPartnerClosed()).toEqual({
      messages: [],
      hasMoreOlder: false,
      loadingMessages: false,
    });
  });

  it('hydrates from cache without a loading spinner', () => {
    const seed = directChatThreadSeedForPartnerOpen({
      partnerUserId: 'u2',
      cached: { messages: [{ id: 'm1' } as never], hasMoreOlder: true },
    });
    expect(seed.loadingMessages).toBe(false);
    expect(seed.messages).toHaveLength(1);
    expect(seed.hasMoreOlder).toBe(true);
  });

  it('starts loading when there is no cache', () => {
    const seed = directChatThreadSeedForPartnerOpen({
      partnerUserId: 'u2',
      cached: undefined,
    });
    expect(seed).toEqual({
      messages: [],
      hasMoreOlder: false,
      loadingMessages: true,
    });
  });
});