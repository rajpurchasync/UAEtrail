import type { ActivityDetailDTO, ActivityEngagementStripsDTO } from '@uaetrail/shared-types';
import {
  activityKindChromeEmoji,
  activityKindChromeLabel,
} from '../../../activity/activityKindChrome';
import {
  resolveActivityDetailHeroStatusChips,
  resolveActivityDetailMarketingStatusChips,
} from '../../../activity/activityDetailHeroStatus';
import type { JoinRequestUiState } from '../../../utils/joinRequestUi';

export type ActivityDetailHeroFactsInput = {
  activity: ActivityDetailDTO;
  joinUiState: JoinRequestUiState;
  previewMode: boolean;
  isHostUser: boolean;
  wireStrips: ActivityEngagementStripsDTO | null | undefined;
  publicDetail: boolean;
  showMobileTabs: boolean;
};

export const resolveActivityDetailViewModelHeroFacts = ({
  activity,
  joinUiState,
  previewMode,
  isHostUser,
  wireStrips,
  publicDetail,
  showMobileTabs,
}: ActivityDetailHeroFactsInput) => {
  const statusChipInput = {
    joinUiState,
    slotsAvailable: activity.slotsAvailable ?? 0,
    slotsTotal: activity.slotsTotal ?? 0,
    previewMode,
    isHostUser,
    pendingJoinInviteCount: wireStrips?.pendingJoinInviteCount,
    confirmedParticipantCount: activity.participants?.length ?? 0,
  };

  const heroStatusChips = resolveActivityDetailHeroStatusChips(statusChipInput);
  const consumerStatusChips = resolveActivityDetailMarketingStatusChips(statusChipInput);
  const heroFactChips = publicDetail
    ? consumerStatusChips
    : showMobileTabs
      ? [
          {
            label: `${activityKindChromeEmoji(activity.activityType)} ${activityKindChromeLabel(activity.activityType)}`,
            tone: 'neutral' as const,
          },
          ...heroStatusChips,
        ]
      : heroStatusChips;

  return { heroStatusChips, consumerStatusChips, heroFactChips };
};