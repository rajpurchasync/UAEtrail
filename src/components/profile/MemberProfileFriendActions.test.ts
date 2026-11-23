import { describe, expect, it } from 'vitest';
import { resolveMemberFriendConnectionLabel } from './MemberProfileFriendActions';

describe('resolveMemberFriendConnectionLabel', () => {
  it('returns friends when buddies', () => {
    expect(
      resolveMemberFriendConnectionLabel({
        areFriends: true,
        incomingRequest: null,
        outgoingRequest: null,
        canSendRequest: false,
      })
    ).toBe('friends');
  });

  it('returns pending_outgoing when request sent', () => {
    expect(
      resolveMemberFriendConnectionLabel({
        areFriends: false,
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
