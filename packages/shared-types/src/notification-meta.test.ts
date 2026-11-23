import { describe, expect, it } from 'vitest';
import { resolveNotificationActorUserId } from './notification-meta.js';

describe('resolveNotificationActorUserId', () => {
  it('prefers actorUserId', () => {
    expect(
      resolveNotificationActorUserId({
        actorUserId: 'a1',
        fromUserId: 'legacy-f',
        buddyUserId: 'legacy-b',
      })
    ).toBe('a1');
  });

  it('falls back to legacy keys', () => {
    expect(resolveNotificationActorUserId({ fromUserId: 'legacy-f' })).toBe('legacy-f');
    expect(resolveNotificationActorUserId({ buddyUserId: 'legacy-b' })).toBe('legacy-b');
    expect(resolveNotificationActorUserId({ senderId: 'legacy-s' })).toBe('legacy-s');
  });
});