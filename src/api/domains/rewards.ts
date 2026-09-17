import type {
  RewardCatalogDTO,
  RewardLeaderboardEntryDTO,
  RewardStatsDTO,
  RewardSummaryDTO,
} from '@uaetrail/shared-types';
import { apiRequest } from '../client';

export const rewardsApi = {
  getRewardCatalog: () => apiRequest<{ data: RewardCatalogDTO }>('/rewards/catalog'),
  getRewardStats: () => apiRequest<{ data: RewardStatsDTO }>('/rewards/stats'),
  getMyRewards: () => apiRequest<{ data: RewardSummaryDTO }>('/me/rewards', { auth: true }),
  getRewardsLeaderboard: () =>
    apiRequest<{ data: RewardLeaderboardEntryDTO[] }>('/rewards/leaderboard', { auth: true }),
} as const;
