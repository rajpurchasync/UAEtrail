import { describe, expect, it } from 'vitest';
import { directMessagesMatchThread, mergeChatRowsById } from './chatThreadCache';

describe('chatThreadCache', () => {
  it('merges rows by id in chronological order', () => {
    const merged = mergeChatRowsById(
      [{ id: '2', createdAt: '2026-01-02T00:00:00.000Z' }],
      [{ id: '1', createdAt: '2026-01-01T00:00:00.000Z' }]
    );
    expect(merged.map((row) => row.id)).toEqual(['1', '2']);
  });

  it('detects mismatched direct thread rows', () => {
    const viewer = 'u1';
    const partner = 'u2';
    expect(
      directMessagesMatchThread(
        [{ id: '1', senderId: viewer, receiverId: partner, content: 'x', createdAt: '' }],
        viewer,
        partner
      )
    ).toBe(true);
    expect(
      directMessagesMatchThread(
        [{ id: '1', senderId: viewer, receiverId: 'other', content: 'x', createdAt: '' }],
        viewer,
        partner
      )
    ).toBe(false);
  });
});
