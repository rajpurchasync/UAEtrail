export type SocialPeopleSegment = 'all' | 'friends' | 'followed';

export type SocialPeopleRelationship = 'friend' | 'following';

export type SocialPersonBuddyRequestState = 'none' | 'incoming' | 'outgoing';

export type SocialPersonTripRole = 'hosting' | 'joining';

/** Subtle upcoming outing hint for a person card (explore map–derived). */
export type SocialPersonTripHintDTO = {
  activityId: string;
  exploreItemId: string;
  title: string;
  date: string | null;
  time: string | null;
  role: SocialPersonTripRole;
};

export type SocialPersonRowDTO = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  cityLabel: string | null;
  activitiesAttended: number;
  relationship: SocialPeopleRelationship;
  buddyRequestState: SocialPersonBuddyRequestState;
  canMessage: boolean;
  canSendBuddyRequest: boolean;
  upcomingTrip: SocialPersonTripHintDTO | null;
};

export type SocialPeopleDTO = {
  people: SocialPersonRowDTO[];
};

export type SocialPeoplePreviewPersonDTO = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
};

export type SocialPeoplePreviewDTO = {
  avatars: SocialPeoplePreviewPersonDTO[];
  friendUserIds: string[];
  friendCount: number;
  followedCount: number;
  allCount: number;
};
