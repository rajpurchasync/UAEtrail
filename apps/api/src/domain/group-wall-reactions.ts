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
