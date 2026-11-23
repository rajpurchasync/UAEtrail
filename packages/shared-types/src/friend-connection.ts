export type FriendRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface FriendUserPreviewDTO {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface FriendRequestDTO {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  fromUser?: FriendUserPreviewDTO;
  toUser?: FriendUserPreviewDTO;
}

export interface FriendSummaryDTO {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  connectedAt: string;
}

export interface FriendRelationshipDTO {
  areFriends: boolean;
  incomingRequest: FriendRequestDTO | null;
  outgoingRequest: FriendRequestDTO | null;
  canSendRequest: boolean;
}
