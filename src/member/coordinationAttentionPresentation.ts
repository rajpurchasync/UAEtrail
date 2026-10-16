import type { MemberCoordinationAttentionItemDTO } from '@uaetrail/shared-types';
import { exploreActivityInvitePathFromRouting } from '../explore/routing';
import { planHostedSchedulePath } from '../plan/planRouting';
import { BUDDIES_PATH, MY_REQUESTS_PATH, NOTIFICATIONS_PATH } from '../config/surfacePaths';

const plural = (count: number, singular: string, pluralLabel: string): string =>
  count === 1 ? `1 ${singular}` : `${count} ${pluralLabel}`;

export const coordinationAttentionPath = (item: MemberCoordinationAttentionItemDTO): string => {
  switch (item.kind) {
    case 'host_join_queue':
    case 'join_request_withdrawn':
      return planHostedSchedulePath();
    case 'joiner_pending_host':
    case 'join_request_rejected':
    case 'participant_revoked':
      return MY_REQUESTS_PATH;
    case 'buddy_request_incoming':
      return `${BUDDIES_PATH}?tab=requests`;
    case 'activity_join_invite':
      if (item.count === 1 && item.activityId) {
        return exploreActivityInvitePathFromRouting(item.activityId);
      }
      return NOTIFICATIONS_PATH;
    default:
      return MY_REQUESTS_PATH;
  }
};

export const coordinationAttentionLabel = (item: MemberCoordinationAttentionItemDTO): string => {
  const { kind, count } = item;
  switch (kind) {
    case 'host_join_queue':
      return plural(count, 'person wants to join your outing', 'people want to join your outings');
    case 'join_request_withdrawn':
      return plural(count, 'join request was withdrawn', 'join requests were withdrawn');
    case 'joiner_pending_host':
      return plural(count, 'request waiting on a host', 'requests waiting on hosts');
    case 'join_request_rejected':
      return plural(count, 'join request was declined', 'join requests were declined');
    case 'participant_revoked':
      return count === 1
        ? 'A host removed you from an outing'
        : `${count} outings removed you from the crew`;
    case 'buddy_request_incoming':
      return plural(count, 'friend request', 'friend requests');
    case 'activity_join_invite':
      if (count === 1 && item.inviterDisplayName?.trim()) {
        return `${item.inviterDisplayName.trim()} invited you to join an outing`;
      }
      return plural(count, 'friend invited you to join an outing', 'friends invited you to join outings');
    default:
      return '';
  }
};
