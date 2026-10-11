/** Who may post in the activity crew group wall (read stays open to members). */
export type ActivityGroupChatPostPolicy = 'all_participants' | 'host_only';

export const ACTIVITY_GROUP_CHAT_POST_POLICIES: readonly ActivityGroupChatPostPolicy[] = [
  'all_participants',
  'host_only',
];

export const resolveActivityGroupChatPostPolicy = (
  stored?: ActivityGroupChatPostPolicy | null
): ActivityGroupChatPostPolicy => stored ?? 'all_participants';
