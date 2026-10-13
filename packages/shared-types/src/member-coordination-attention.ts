/** Member coordination signals (join queues, buddy requests, invites) — not seeking map posts. */
export const MEMBER_COORDINATION_ATTENTION_KINDS = [
  'host_join_queue',
  'join_request_withdrawn',
  'joiner_pending_host',
  'join_request_rejected',
  'participant_revoked',
  'buddy_request_incoming',
  'activity_join_invite',
] as const;

export type MemberCoordinationAttentionKind = (typeof MEMBER_COORDINATION_ATTENTION_KINDS)[number];

export type MemberCoordinationAttentionItemDTO = {
  kind: MemberCoordinationAttentionKind;
  count: number;
  /** Set when `kind === 'activity_join_invite'` and `count === 1`. */
  activityId?: string | null;
  /** Inviter display name for single activity join invite (client builds copy). */
  inviterDisplayName?: string | null;
};

export type MemberCoordinationAttentionDTO = {
  items: MemberCoordinationAttentionItemDTO[];
};
