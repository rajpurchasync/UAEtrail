import { GROUP_WALL_REACTION_EMOJI } from './groupReactions';

/** Emojis available in chat/comment compose pickers (includes group reaction set). */
export const CHAT_EMOJI_LIST = [
  ...new Set([
    ...Object.values(GROUP_WALL_REACTION_EMOJI),
    '👋',
    '🙌',
    '🔥',
    '✨',
    '🎉',
    '😍',
    '🤔',
    '😢',
    '🙏',
    '💪',
    '🌿',
    '🥾',
    '🌅',
    '📍',
    '☀️',
    '🌙',
    '⭐',
  ]),
];
