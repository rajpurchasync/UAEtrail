import type { ReactNode } from 'react';
import { GlassCard } from '../mobile/GlassCard';
import { SecureAvatar } from '../ui/SecureAvatar';
import { ShareButton } from '../ui/ShareButton';

interface ProfileHeroSectionProps {
  displayName: string;
  roleLabel: string;
  avatarUrl?: string | null;
  completionPercent: number;
  shareTitle: string;
  shareText: string;
  sharePath: string;
  shareReady?: boolean;
  showCompletionBadge?: boolean;
  onEditAvatar: () => void;
  onEditProfile: () => void;
  onViewProfile: () => void;
  extra?: ReactNode;
}

export const ProfileHeroSection = ({
  displayName,
  roleLabel,
  avatarUrl,
  completionPercent,
  shareTitle,
  shareText,
  sharePath,
  shareReady = true,
  showCompletionBadge = true,
  onEditAvatar,
  onEditProfile,
  onViewProfile,
  extra,
}: ProfileHeroSectionProps) => (
  <GlassCard padding className="!p-5 text-center animate-fade-up">
    <div className="mb-3 flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={onViewProfile}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg shadow-sm ring-1 ring-neutral-200/90"
        aria-label="View public profile"
        title="View public profile"
      >
        <span aria-hidden>👁️</span>
      </button>
      {shareReady && (
        <ShareButton title={shareTitle} text={shareText} path={sharePath} iconOnly light />
      )}
      <button
        type="button"
        onClick={onEditProfile}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg shadow-sm ring-1 ring-neutral-200/90"
        aria-label="Edit profile"
        title="Edit profile"
      >
        <span aria-hidden>✏️</span>
      </button>
    </div>

    <div className="relative mx-auto mb-3 h-[92px] w-[92px]">
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="44" fill="none" stroke="#f3f4f6" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="#059669"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${(completionPercent / 100) * 276} 276`}
        />
      </svg>
      <SecureAvatar
        src={avatarUrl}
        name={displayName}
        className="absolute inset-[10px] h-[72px] w-[72px] text-xl ring-2 ring-white"
      />
      <button
        type="button"
        onClick={onEditAvatar}
        className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-base text-white shadow-md"
        aria-label="Add or change profile photo"
      >
        <span aria-hidden>📷</span>
      </button>
      {showCompletionBadge && completionPercent < 100 && (
        <span className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
          {completionPercent}%
        </span>
      )}
    </div>

    <h1 className="text-xl font-bold text-neutral-900">{displayName}</h1>
    <p className="mt-1 text-sm text-neutral-500 capitalize">{roleLabel}</p>
    {extra && <div className="mt-2 flex justify-center">{extra}</div>}
  </GlassCard>
);
