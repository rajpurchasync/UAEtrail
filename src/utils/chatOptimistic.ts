import type { ChatMessageReactionDTO } from '@uaetrail/shared-types';
import type { GroupWallReactionKind } from '../constants/groupReactions';

export const OPTIMISTIC_CHAT_ID_PREFIX = 'opt-';

export const createOptimisticChatId = (): string =>
  `${OPTIMISTIC_CHAT_ID_PREFIX}${crypto.randomUUID()}`;

export const isOptimisticChatId = (id: string): boolean =>
  id.startsWith(OPTIMISTIC_CHAT_ID_PREFIX);

type ReactionRow = Pick<ChatMessageReactionDTO, 'kind' | 'count' | 'reactedByMe'>;

/** Toggle one reaction locally; sync replaces this with server truth. */
export const applyOptimisticReactionToggle = <T extends ReactionRow>(
  reactions: T[] | undefined,
  kind: GroupWallReactionKind
): T[] => {
  const list = [...(reactions ?? [])];
  const index = list.findIndex((row) => row.kind === kind);
  if (index >= 0) {
    const row = list[index];
    if (row.reactedByMe) {
      const nextCount = row.count - 1;
      if (nextCount <= 0) {
        list.splice(index, 1);
      } else {
        list[index] = { ...row, count: nextCount, reactedByMe: false };
      }
    } else {
      list[index] = { ...row, count: row.count + 1, reactedByMe: true };
    }
    return list;
  }
  return [...list, { kind, count: 1, reactedByMe: true } as T];
};

export const replaceOptimisticChatRow = <T extends { id: string }>(
  rows: T[],
  optimisticId: string,
  confirmed: T
): T[] => {
  const withoutDuplicate = rows.filter((row) => row.id !== confirmed.id);
  const index = withoutDuplicate.findIndex((row) => row.id === optimisticId);
  if (index >= 0) {
    const next = [...withoutDuplicate];
    next[index] = confirmed;
    return next;
  }
  if (withoutDuplicate.some((row) => row.id === confirmed.id)) return withoutDuplicate;
  return [...withoutDuplicate, confirmed];
};
