import { describe, expect, it } from 'vitest';
import {
  CHAT_THREAD_INITIAL_LIMIT,
  CHAT_THREAD_MANUAL_OLDER_LIMIT,
  mergeOlderChatRows,
  shouldShowChatLoadMore,
} from './chatThreadPagination';

describe('chatThreadPagination', () => {
  it('uses 10-message pages for initial and manual load', () => {
    expect(CHAT_THREAD_INITIAL_LIMIT).toBe(10);
    expect(CHAT_THREAD_MANUAL_OLDER_LIMIT).toBe(10);
  });

  it('shows load more whenever older history exists', () => {
    expect(shouldShowChatLoadMore(1, true)).toBe(true);
    expect(shouldShowChatLoadMore(100, true)).toBe(true);
    expect(shouldShowChatLoadMore(10, false)).toBe(false);
  });

  it('prepends older rows without duplicates', () => {
    const current = [{ id: '2' }, { id: '3' }];
    const older = [{ id: '1' }, { id: '2' }];
    expect(mergeOlderChatRows(current, older)).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }]);
  });
});
