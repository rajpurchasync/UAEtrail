/** Shared width + alignment for DM and group wall bubbles. */
export const CHAT_BUBBLE_MAX_CLASS = 'max-w-[min(20rem,calc(100vw-2rem))]';
export const CHAT_BUBBLE_SHELL_CLASS = `w-fit shrink-0 ${CHAT_BUBBLE_MAX_CLASS}`;
export const CHAT_MESSAGE_ROW_CLASS = 'flex w-full min-w-0 mb-1';

export const chatMessageRowAlign = (isMe: boolean) =>
  `${CHAT_MESSAGE_ROW_CLASS} ${isMe ? 'justify-end' : 'justify-start'}`;
