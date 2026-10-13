import type { MemberBrowseCardDTO, SocialPersonRowDTO } from '@uaetrail/shared-types';

export const memberPersonRowFromBrowseCard = (card: MemberBrowseCardDTO): SocialPersonRowDTO => ({
  userId: card.id,
  displayName: card.displayName,
  avatarUrl: card.avatarUrl,
  cityLabel: card.city,
  activitiesAttended: card.activitiesAttended ?? 0,
  relationship: 'following',
  buddyRequestState: card.buddyRequestState ?? 'none',
  canMessage: card.canMessage ?? false,
  canSendBuddyRequest: card.canSendBuddyRequest ?? false,
  upcomingTrip: null,
});
