import { describe, expect, it } from 'vitest';
import { resolveMemberBuddyConnectionLabel } from './MemberProfileBuddyActions';

describe('resolveMemberBuddyConnectionLabel', () => {
  it('returns friends when buddies', () => {
    expect(
      resolveMemberBuddyConnectionLabel({
        areBuddies: true,
        incomingRequest: null,
        outgoingRequest: null,
        canSendRequest: false,
      })
    ).toBe('friends');
  });

  it('returns pending_outgoing when request sent', () => {
    expect(
      resolveMemberBuddyConnectionLabel({
        areBuddies: false,
        incomingRequest: null,
        outgoingRequest: {
          id: 'r1',
          fromUserId: 'a',
          toUserId: 'b',
          status: 'pending',
          message: null,
          createdAt: '',
          updatedAt: '',
        },
        canSendRequest: false,
      })
    ).toBe('pending_outgoing');
  });
});
