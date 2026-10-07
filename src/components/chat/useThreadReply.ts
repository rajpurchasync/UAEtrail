import { useCallback, useEffect, useRef, useState } from 'react';
import type { GroupWallReplyTarget } from '../../utils/groupWallReply';

export type ChatThreadMessageSelectorAttr = 'data-dm-message-id' | 'data-wall-message-id';

const HIGHLIGHT_MS = 2200;

/**
 * Shared reply state + scroll-to-quote for DM and group wall threads.
 * Resets reply when `threadKey` changes (partner id or group id).
 */
export const useThreadReply = (
  threadKey: string | null | undefined,
  messageSelectorAttr: ChatThreadMessageSelectorAttr = 'data-dm-message-id'
) => {
  const [replyTo, setReplyTo] = useState<GroupWallReplyTarget | null>(null);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const highlightTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setReplyTo(null);
  }, [threadKey]);

  useEffect(
    () => () => {
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current);
      }
    },
    []
  );

  const scrollToMessage = useCallback(
    (messageId: string) => {
      const container = scrollContainerRef.current;
      const el = container?.querySelector(`[${messageSelectorAttr}="${messageId}"]`);
      if (!el || !(el instanceof HTMLElement)) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightMessageId(messageId);
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current);
      }
      highlightTimerRef.current = window.setTimeout(() => {
        setHighlightMessageId(null);
        highlightTimerRef.current = null;
      }, HIGHLIGHT_MS);
    },
    [messageSelectorAttr]
  );

  const clearReply = useCallback(() => setReplyTo(null), []);

  return {
    replyTo,
    setReplyTo,
    clearReply,
    highlightMessageId,
    scrollContainerRef,
    scrollToMessage,
  };
};

/** Clear reply banner before send; restore on failure. */
export const runWithReplyTarget = async (
  replyTo: GroupWallReplyTarget | null,
  setReplyTo: (value: GroupWallReplyTarget | null) => void,
  send: (replyToMessageId?: string) => void | Promise<void>
): Promise<void> => {
  const previousReply = replyTo;
  setReplyTo(null);
  try {
    await send(previousReply?.id);
  } catch (error) {
    setReplyTo(previousReply);
    throw error;
  }
};
