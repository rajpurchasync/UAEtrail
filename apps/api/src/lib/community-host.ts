import { countPublishedActivitiesHostedByUser } from './activity-engagement-store.js';
import { countParticipantIntentsByUser } from './participant-intents-store.js';

/** Published hosted outings or seeking posts on the map (any kind). */
export const isCommunityHostByUserId = async (userId: string): Promise<boolean> => {
  const [hosted, demandPosts] = await Promise.all([
    countPublishedActivitiesHostedByUser(userId),
    countParticipantIntentsByUser(userId),
  ]);
  return hosted > 0 || demandPosts > 0;
};
