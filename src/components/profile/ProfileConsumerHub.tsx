import { useMemo } from 'react';
import type { MemberGoalDTO, MemberGoalActivityFilter, RewardBadgeDTO } from '@uaetrail/shared-types';
import { ProfileHubIdentityCard } from './ProfileHubIdentityCard';
import { SettingsMenuGroup, SettingsMenuRow } from '../settings/SettingsMenuRow';
import { ProfileGoalCard } from './ProfileGoalCard';
import {
  ProfileQuickLauncher,
  buildProfileQuickLauncherItems,
} from './ProfileQuickLauncher';
import type { ProfileCompletionItem } from '../../utils/profileCompletion';
import type { ProfileHubStat } from './ProfileConsumerHub.types';

export type { ProfileHubStat };

type ProfileConsumerHubProps = {
  displayName: string;
  roleLabel: string;
  avatarUrl?: string | null;
  completionPercent: number;
  completionItems: ProfileCompletionItem[];
  onCompleteProfile: () => void;
  shareTitle: string;
  shareText: string;
  sharePath: string;
  shareReady?: boolean;
  onEditAvatar: () => void;
  onEditProfile: () => void;
  onViewProfile: () => void;
  memberSinceLabel?: string | null;
  visibilityLabel?: string | null;
  cityLabel?: string | null;
  hubStats: ProfileHubStat[];
  goal: MemberGoalDTO | null;
  goalSaving: boolean;
  onSaveGoal: (input: {
    activityFilter: MemberGoalActivityFilter;
    targetCount: number;
    targetDate: string;
  }) => Promise<void>;
  onClearGoal?: () => Promise<void>;
  achievementBadges: RewardBadgeDTO[];
  buddyBadge?: number;
  showHosting?: boolean;
  onSignOut: () => void;
};

export const ProfileConsumerHub = ({
  displayName,
  roleLabel,
  avatarUrl,
  completionPercent,
  completionItems,
  onCompleteProfile,
  shareTitle,
  shareText,
  sharePath,
  shareReady = true,
  onEditAvatar,
  onEditProfile,
  onViewProfile,
  memberSinceLabel,
  visibilityLabel,
  cityLabel,
  hubStats,
  goal,
  goalSaving,
  onSaveGoal,
  onClearGoal,
  achievementBadges,
  buddyBadge,
  showHosting = false,
  onSignOut,
}: ProfileConsumerHubProps) => {
  const showComplete =
    completionPercent < 100 && completionItems.some((item) => !item.done);
  const nextMissing = completionItems.find((item) => !item.done);

  const badgesEarnedCount = useMemo(
    () => achievementBadges.filter((b) => b.earned).length,
    [achievementBadges]
  );

  const launcherItems = useMemo(
    () =>
      buildProfileQuickLauncherItems({
        buddyBadge,
        badgesEarnedCount,
        showHosting,
      }),
    [buddyBadge, badgesEarnedCount, showHosting]
  );

  return (
    <div className="space-y-3 pb-nav-safe animate-fade-up">
      <ProfileHubIdentityCard
        displayName={displayName}
        roleLabel={roleLabel}
        avatarUrl={avatarUrl}
        completionPercent={completionPercent}
        shareTitle={shareTitle}
        shareText={shareText}
        sharePath={sharePath}
        shareReady={shareReady}
        onEditAvatar={onEditAvatar}
        onEditProfile={onEditProfile}
        onViewProfile={onViewProfile}
        memberSinceLabel={memberSinceLabel}
        visibilityLabel={visibilityLabel}
        cityLabel={cityLabel}
        stats={hubStats}
      />

      <ProfileQuickLauncher items={launcherItems} />

      {showComplete ? (
        <button
          type="button"
          onClick={onCompleteProfile}
          className="flex w-full items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-2.5 text-left active:bg-emerald-100/80"
        >
          <span className="text-sm font-bold tabular-nums text-emerald-800">{completionPercent}%</span>
          <span className="min-w-0 flex-1 text-xs font-medium text-emerald-900">
            Complete your profile
            {nextMissing ? ` — ${nextMissing.label}` : ''}
          </span>
        </button>
      ) : null}

      <ProfileGoalCard goal={goal} saving={goalSaving} onSave={onSaveGoal} onClear={onClearGoal} />

      <SettingsMenuGroup>
        <SettingsMenuRow label="Sign out" destructive onClick={onSignOut} />
      </SettingsMenuGroup>
    </div>
  );
};
