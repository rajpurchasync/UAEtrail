import type {
  RewardBadgeDTO,
  RewardCatalogDTO,
  RewardLeaderboardEntryDTO,
  RewardStatsDTO,
  RewardSummaryDTO,
} from '@uaetrail/shared-types';
import { apiRequest } from '../client';

export const rewardsApi = {
  getRewardCatalog: () => apiRequest<{ data: RewardCatalogDTO }>('/rewards/catalog'),
  getRewardStats: () => apiRequest<{ data: RewardStatsDTO }>('/rewards/stats'),
  /** Legacy summary — prefer {@link getMemberBadges} for consumer UI (no points wallet). */
  getMyRewards: () => apiRequest<{ data: RewardSummaryDTO }>('/me/rewards', { auth: true }),
  getMemberBadges: () =>
    apiRequest<{ data: RewardSummaryDTO }>('/me/rewards', { auth: true }).then(
      (res): { data: RewardBadgeDTO[] } => ({
        data: res.data.badges ?? [],
      })
    ),
  getRewardsLeaderboard: () =>
    apiRequest<{ data: RewardLeaderboardEntryDTO[] }>('/rewards/leaderboard', { auth: true }),
} as const;
