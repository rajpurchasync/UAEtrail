import type { RewardBadgeDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

export const badgesApi = {
  getMemberBadges: () => apiRequest<{ data: RewardBadgeDTO[] }>('/me/badges', { auth: true }),
} as const;
