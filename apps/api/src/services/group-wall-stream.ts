import type { GroupWallStreamEventDTO } from '@uaetrail/shared-types';
import { listGroupMembersDetailed } from '../lib/social-groups-store.js';
import { publishChatStreamEvent } from './chat-stream.js';

/** Push a new wall message to connected members (except author). */
export const publishGroupWallStreamToMembers = async (
  payload: GroupWallStreamEventDTO,
  authorUserId: string
): Promise<void> => {
  const members = await listGroupMembersDetailed(payload.groupId);
  const recipientIds = members
    .map((member) => member.userId)
    .filter((userId): userId is string => Boolean(userId) && userId !== authorUserId);

  if (recipientIds.length === 0) return;

  await Promise.all(
    recipientIds.map((userId) =>
      publishChatStreamEvent(userId, {
        type: 'group_wall_message',
        data: payload,
      })
    )
  );
};
