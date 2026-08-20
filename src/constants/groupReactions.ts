export const GROUP_WALL_REACTION_KINDS = [
  'like',
  'dislike',
  'happy',
  'heart',
  'laugh',
  'mountain',
  'camping',
  'car',
] as const;

export type GroupWallReactionKind = (typeof GROUP_WALL_REACTION_KINDS)[number];

export const GROUP_WALL_REACTION_EMOJI: Record<GroupWallReactionKind, string> = {
  like: '👍',
  dislike: '👎',
  happy: '😊',
  heart: '❤️',
  laugh: '😂',
  mountain: '⛰️',
  camping: '🏕️',
  car: '🚗',
};

export const GROUP_WALL_REACTION_LABEL: Record<GroupWallReactionKind, string> = {
  like: 'Like',
  dislike: 'Dislike',
  happy: 'Happy',
  heart: 'Heart',
  laugh: 'Laugh',
  mountain: 'Mountain',
  camping: 'Camping',
  car: 'Car',
};
