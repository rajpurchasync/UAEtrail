/**
 * Notification `meta` contract — keep payloads small and consistent.
 * FE routes via `inferNotificationPath` (actor + entity ids + optional path).
 */
export type NotificationKind =
  | 'badge'
  | 'buddy.request'
  | 'buddy.accepted'
  | 'connection_buddy_request'
  | 'connection_buddy_accepted'
  | 'connection_member_followed'
  | 'demand_join_request_pending'
  | 'goal_behind_pace'
  | 'goal_complete'
  | 'goal_halfway'
  | 'group_invite'
  | 'group_invite_accepted'
  | 'group_message'
  | 'host_application_approved'
  | 'host_application_rejected'
  | 'host_application_submitted'
  | 'join_request_approved'
  | 'join_request_pending'
  | 'join_request_rejected'
  | 'join_request_waitlisted'
  | 'join_request_withdrawn'
  | 'location_approved'
  | 'location_rejected'
  | 'location_submitted'
  | 'member_published'
  | 'friend_published'
  | 'friend_activity_published'
  | 'message'
  | 'request_withdrawal'
  | 'reward'
  | 'schedule_change'
  | 'tier_upgrade'
  | 'user_registered'
  | 'activity_published'
  | 'wishlist_match'
  | (string & {});

/** Standard optional fields on `NotificationDTO.meta`. */
export interface NotificationMeta {
  kind?: NotificationKind;
  /** Member who performed the action (profile link + actor label). Always a user id. */
  actorUserId?: string;
  path?: string;
  activityId?: string;
  groupId?: string;
  requestId?: string;
  intentId?: string;
  inviteToken?: string;
  badgeKey?: string;
  /** @deprecated Use actorUserId */
  buddyUserId?: string;
  /** @deprecated Use actorUserId */
  fromUserId?: string;
  /** @deprecated Use actorUserId */
  senderId?: string;
  followerUserId?: string;
  locationId?: string;
  userId?: string;
}
