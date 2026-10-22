/** Recent window on thread open — fast first paint. */
export const CHAT_THREAD_INITIAL_LIMIT = 10;

/** Each manual "Load more" at the top of history. */
export const CHAT_THREAD_MANUAL_OLDER_LIMIT = 10;

export const shouldShowChatLoadMore = (_loadedCount: number, hasMoreOlder: boolean): boolean =>
  hasMoreOlder;

export const mergeOlderChatRows = <T extends { id: string }>(current: T[], older: T[]): T[] => {
  if (older.length === 0) return current;
  const ids = new Set(current.map((row) => row.id));
  const prepended = older.filter((row) => !ids.has(row.id));
  if (prepended.length === 0) return current;
  return [...prepended, ...current];
};
