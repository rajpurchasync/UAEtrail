export type BuddyRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface BuddyUserPreviewDTO {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface BuddyRequestDTO {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: BuddyRequestStatus;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  fromUser?: BuddyUserPreviewDTO;
  toUser?: BuddyUserPreviewDTO;
}

export interface BuddySummaryDTO {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  connectedAt: string;
}

export interface BuddyRelationshipDTO {
  areBuddies: boolean;
  incomingRequest: BuddyRequestDTO | null;
  outgoingRequest: BuddyRequestDTO | null;
  canSendRequest: boolean;
}
