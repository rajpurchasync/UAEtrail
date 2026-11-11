import type { ProfileCompletionItem } from '../../utils/profileCompletion';
import type { ProfileHubStat } from './ProfileConsumerHub.types';
import type { ProfileHubEditFocus } from './ProfileHubDetailsCard';
import { ProfileHubIdentityCard } from './ProfileHubIdentityCard';
import { ProfileHubDetailsCard } from './ProfileHubDetailsCard';
import { ProfileHubNavMenu } from './ProfileHubNavMenu';

export type { ProfileHubStat };

type ProfileConsumerHubProps = {
  displayName: string;
  roleLabel: string;
  avatarUrl?: string | null;
  bio?: string | null;
  languages?: string | null;
  completionPercent: number;
  completionItems: ProfileCompletionItem[];
  onCompleteProfile: () => void;
  shareTitle: string;
  shareText: string;
  sharePath: string;
  shareReady?: boolean;
  onEditAvatar: () => void;
  onEditProfile: () => void;
  onEditProfileSection: (focus: ProfileHubEditFocus) => void;
  onViewProfile: () => void;
  memberSinceLabel?: string | null;
  visibilityLabel?: string | null;
  cityLabel?: string | null;
  hubStats: ProfileHubStat[];
  badgesEarnedCount?: number;
  onSignOut: () => void;
};

export const ProfileConsumerHub = ({
  displayName,
  roleLabel,
  avatarUrl,
  bio,
  languages,
  completionPercent,
  completionItems,
  onCompleteProfile,
  shareTitle,
  shareText,
  sharePath,
  shareReady = true,
  onEditAvatar,
  onEditProfile,
  onEditProfileSection,
  onViewProfile,
  memberSinceLabel,
  visibilityLabel,
  cityLabel,
  hubStats,
  badgesEarnedCount = 0,
  onSignOut,
}: ProfileConsumerHubProps) => {
  const showComplete =
    completionPercent < 100 && completionItems.some((item) => !item.done);
  const nextMissing = completionItems.find((item) => !item.done);

  return (
    <div className="mx-auto w-full max-w-lg space-y-3 pb-nav-safe animate-fade-up">
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

      <div className="space-y-3">
        <ProfileHubDetailsCard
          bio={bio}
          languages={languages}
          onEditSection={onEditProfileSection}
        />
      </div>

      <ProfileHubNavMenu badgesEarnedCount={badgesEarnedCount} onSignOut={onSignOut} />

      {showComplete ? (
        <button
          type="button"
          onClick={onCompleteProfile}
          data-nav-focus="profile-complete"
          className="glass-card-interactive flex w-full items-center gap-3 border border-emerald-200/60 bg-emerald-50/50 px-3 py-3 text-left"
        >
          <span className="text-sm font-bold tabular-nums text-emerald-800">{completionPercent}%</span>
          <span className="min-w-0 flex-1 text-xs font-medium text-emerald-900">
            Complete your profile
            {nextMissing ? ` — ${nextMissing.label}` : ''}
          </span>
        </button>
      ) : null}
    </div>
  );
};
