import { describe, expect, it } from 'vitest';
import {
  applyOptimisticReactionToggle,
  createOptimisticChatId,
  isOptimisticChatId,
  replaceOptimisticChatRow,
} from './chatOptimistic';

describe('chatOptimistic', () => {
  it('creates and detects optimistic ids', () => {
    const id = createOptimisticChatId();
    expect(id.startsWith('opt-')).toBe(true);
    expect(isOptimisticChatId(id)).toBe(true);
    expect(isOptimisticChatId('server-id')).toBe(false);
  });

  it('toggles reactions optimistically', () => {
    const added = applyOptimisticReactionToggle([], 'heart');
    expect(added).toEqual([{ kind: 'heart', count: 1, reactedByMe: true }]);

    const removed = applyOptimisticReactionToggle(added, 'heart');
    expect(removed).toEqual([]);
  });

  it('replaces optimistic rows with confirmed messages', () => {
    const optId = createOptimisticChatId();
    const rows = [{ id: optId, body: 'hi' }];
    const confirmed = { id: 'real-1', body: 'hi' };
    expect(replaceOptimisticChatRow(rows, optId, confirmed)).toEqual([confirmed]);
  });
});
