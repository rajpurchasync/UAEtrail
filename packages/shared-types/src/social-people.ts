export type {
  SocialPeopleSegmentCanonical,
  SocialPeopleSegmentCanonical as SocialPeopleSegment,
  SocialPeopleSegmentWire,
} from './wire-lexicon.js';

export type SocialPeopleRelationship = 'friend' | 'following';

export type SocialPersonFriendRequestState = 'none' | 'incoming' | 'outgoing';

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
  friendRequestState: SocialPersonFriendRequestState;
  canMessage: boolean;
  canSendFriendRequest: boolean;
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
  /** People you follow who are not friends — for Find crew availability labels. */
  followedUserIds: string[];
  friendCount: number;
  followedCount: number;
  allCount: number;
};
