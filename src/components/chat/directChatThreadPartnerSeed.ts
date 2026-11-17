import type { ChatMessageDTO } from '@uaetrail/shared-types';
import type { DirectChatThreadCache } from '../../utils/chatThreadCache';

/** Thread snapshot when the open DM partner changes — no React hooks here. */
export type DirectChatThreadPartnerSeed = {
  messages: ChatMessageDTO[];
  hasMoreOlder: boolean;
  loadingMessages: boolean;
};

export const directChatThreadSeedWhenPartnerClosed = (): DirectChatThreadPartnerSeed => ({
  messages: [],
  hasMoreOlder: false,
  loadingMessages: false,
});

export const directChatThreadSeedForPartnerOpen = (input: {
  partnerUserId: string;
  cached: DirectChatThreadCache | undefined;
}): DirectChatThreadPartnerSeed => {
  if (input.cached?.messages.length) {
    return {
      messages: input.cached.messages,
      hasMoreOlder: input.cached.hasMoreOlder,
      loadingMessages: false,
    };
  }
  return {
    messages: [],
    hasMoreOlder: false,
    loadingMessages: true,
  };
};