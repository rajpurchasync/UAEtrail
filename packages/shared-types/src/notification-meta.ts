/**
 * Notification `meta` contract — keep payloads small and consistent.
 * FE routes via `inferNotificationPath` (actor + entity ids + optional path).
 */
export type NotificationKind =
  | 'badge'
  | 'connection_friend_request'
  | 'connection_friend_accepted'
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
  | 'member_activity_published'
  | 'message'
  | 'request_withdrawal'
  | 'reward'
  | 'schedule_change'
  | 'tier_upgrade'
  | 'user_registered'
  | 'activity_published'
  | 'entity_activity_published'
  | 'activity_guide_invite'
  | 'activity_venue_live'
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
  /** Actor for follow events — not the same as `actorUserId` on connection requests. */
  followerUserId?: string;
  locationId?: string;
  tenantId?: string;
  userId?: string;
  /** Wishlist row that triggered a geographic/category match alert. */
  wishlistItemId?: string;
  /** Host decision / revoke message (COH-06). */
  hostNote?: string;
}

const readMetaString = (meta: Record<string, unknown> | null | undefined, key: string): string | null => {
  const value = meta?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
};

/** Read canonical actor from stored notification meta (legacy keys accepted on read only). */
export const resolveNotificationActorUserId = (
  meta: Record<string, unknown> | NotificationMeta | null | undefined
): string | null => {
  if (!meta || typeof meta !== 'object') return null;
  const record = meta as Record<string, unknown>;
  return (
    readMetaString(record, 'actorUserId') ??
    readMetaString(record, 'fromUserId') ??
    readMetaString(record, 'senderId')
  );
};
