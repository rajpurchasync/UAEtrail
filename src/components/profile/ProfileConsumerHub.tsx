import { useMemo } from 'react';

import { PRO_MEMBERSHIP_PATH } from '../../config/routingCatalog';

import type { MemberGoalDTO } from '@uaetrail/shared-types';

import { ProfileHubIdentityCard } from './ProfileHubIdentityCard';

import { SettingsMenuGroup, SettingsMenuRow } from '../settings/SettingsMenuRow';

import { ProfileGoalsSection } from './ProfileGoalsSection';

import {

  ProfileQuickLauncher,

  buildProfileQuickLauncherItems,

} from './ProfileQuickLauncher';

import type { ProfileCompletionItem } from '../../utils/profileCompletion';

import type { ProfileHubStat } from './ProfileConsumerHub.types';

import type { SaveMemberGoalInput } from './ProfileGoalCard';



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

  goals: MemberGoalDTO[];

  goalSaving: boolean;

  onCreateGoal: (input: SaveMemberGoalInput) => Promise<void>;

  onUpdateGoal: (goalId: string, input: SaveMemberGoalInput) => Promise<void>;

  onDeleteGoal: (goalId: string) => Promise<void>;

  onReloadGoals?: () => void;

  badgesEarnedCount?: number;

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

  goals,

  goalSaving,

  onCreateGoal,

  onUpdateGoal,

  onDeleteGoal,

  onReloadGoals,

  badgesEarnedCount = 0,

  buddyBadge,

  showHosting = false,

  onSignOut,

}: ProfileConsumerHubProps) => {

  const showComplete =

    completionPercent < 100 && completionItems.some((item) => !item.done);

  const nextMissing = completionItems.find((item) => !item.done);



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

          className="glass-card-interactive flex w-full items-center gap-3 border border-emerald-200/60 bg-emerald-50/50 px-3 py-3 text-left"

        >

          <span className="text-sm font-bold tabular-nums text-emerald-800">{completionPercent}%</span>

          <span className="min-w-0 flex-1 text-xs font-medium text-emerald-900">

            Complete your profile

            {nextMissing ? ` — ${nextMissing.label}` : ''}

          </span>

        </button>

      ) : null}



      <ProfileGoalsSection

        goals={goals}

        saving={goalSaving}

        onCreateGoal={onCreateGoal}

        onUpdateGoal={onUpdateGoal}

        onDeleteGoal={onDeleteGoal}

        onReloadGoals={onReloadGoals}

        layout="profile"

      />



      <SettingsMenuGroup>

        <SettingsMenuRow

          label="Pro Membership"

          subtitle="Professional guide, agency, or shop profile"

          to={PRO_MEMBERSHIP_PATH}

        />

        <SettingsMenuRow label="Sign out" destructive onClick={onSignOut} />

      </SettingsMenuGroup>

    </div>

  );

};


