/** Snapshot before prepending older chat rows — restore after DOM grows. */
export type ChatScrollPreserveAnchor = {
  scrollHeight: number;
  scrollTop: number;
  /** Distance from the scrollport top to the message that must stay put. */
  anchorOffset: number;
  /** Selector for that message after React replaces the node. */
  anchorSelector: string | null;
};

/** First rendered message in this thread, so older rows can be inserted above it. */
export const chatMessageAnchorSelector = (
  container: HTMLElement | null,
  messageAttr: 'data-dm-message-id' | 'data-wall-message-id'
): string | null => {
  const id = container?.querySelector(`[${messageAttr}]`)?.getAttribute(messageAttr);
  if (!id) return null;
  return `[${messageAttr}="${CSS.escape(id)}"]`;
};

export const captureChatScrollPreserveAnchor = (
  container: HTMLElement | null,
  anchorSelector?: string | null
): ChatScrollPreserveAnchor | null => {
  if (!container) return null;
  const anchorEl = anchorSelector ? container.querySelector(anchorSelector) : null;
  const anchorOffset =
    anchorEl instanceof HTMLElement
      ? anchorEl.getBoundingClientRect().top - container.getBoundingClientRect().top
      : 0;
  return {
    scrollHeight: container.scrollHeight,
    scrollTop: container.scrollTop,
    anchorOffset,
    anchorSelector: anchorSelector ?? null,
  };
};

export const applyChatScrollPreserveAnchor = (
  container: HTMLElement,
  anchor: ChatScrollPreserveAnchor
): void => {
  const anchorEl = anchor.anchorSelector ? container.querySelector(anchor.anchorSelector) : null;
  if (anchorEl instanceof HTMLElement) {
    const nextOffset = anchorEl.getBoundingClientRect().top - container.getBoundingClientRect().top;
    container.scrollTop += nextOffset - anchor.anchorOffset;
    return;
  }
  const heightDelta = container.scrollHeight - anchor.scrollHeight;
  container.scrollTop = anchor.scrollTop + heightDelta;
};
