import { useMemo } from 'react';

import { PRO_MEMBERSHIP_PATH } from '../../config/routingCatalog';


import { ProfileHubIdentityCard } from './ProfileHubIdentityCard';

import { SettingsMenuGroup, SettingsMenuRow } from '../settings/SettingsMenuRow';

import { ProfilePlanGoalsTeaser } from './ProfilePlanGoalsTeaser';

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

  goalsCount: number;

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

  goalsCount,

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



      <ProfilePlanGoalsTeaser goalsCount={goalsCount} />



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


