import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { profileHubMobileBackState } from '../../utils/mobileBackNav';
import { Camera, Eye, Pencil } from 'lucide-react';
import { SecureAvatar } from '../ui/SecureAvatar';
import { ShareButton } from '../ui/ShareButton';
import { APP_SETTINGS_PRIVACY_PATH } from '../../config/routingCatalog';
type ProfileHubStat = {
  key: string;
  label: string;
  value: number | string;
  to?: string;
  onClick?: () => void;
};

type ProfileHubIdentityCardProps = {
  displayName: string;
  roleLabel: string;
  avatarUrl?: string | null;
  completionPercent: number;
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
  tierBadge?: ReactNode;
  stats: ProfileHubStat[];
};

const ProfileHubStatCell = ({ stat }: { stat: ProfileHubStat }) => {
  const inner = (
    <>
      <span className="text-xl font-bold tabular-nums leading-none text-neutral-900">
        {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
      </span>
      <span className="mt-1 max-w-full truncate text-[11px] font-medium text-neutral-500">
        {stat.label}
      </span>
    </>
  );

  const className =
    'flex min-w-0 flex-1 flex-col items-center justify-center px-1 py-2 text-center transition-colors active:bg-neutral-50';

  if (stat.to) {
    return (
      <Link to={stat.to} state={profileHubMobileBackState()} data-nav-focus={`profile-stat-${stat.key}`} className={className}>
        {inner}
      </Link>
    );
  }

  if (stat.onClick) {
    return (
      <button type="button" onClick={stat.onClick} className={className}>
        {inner}
      </button>
    );
  }

  return <div className={className}>{inner}</div>;
};

/** Identity + stats + achievement chips — one card, tight vertical rhythm. */
export const ProfileHubIdentityCard = ({
  displayName,
  roleLabel,
  avatarUrl,
  completionPercent,
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
  tierBadge,
  stats,
}: ProfileHubIdentityCardProps) => (
  <div className="glass-card overflow-hidden animate-fade-up">
    <div className="relative flex flex-col justify-center bg-gradient-to-b from-emerald-50/50 to-white px-4 pb-2 pt-[calc(var(--safe-top)+8px)] text-center">
      <div className="absolute left-1 top-1">
        <button
          type="button"
          onClick={onViewProfile}
          data-nav-focus="profile-view-public"
          className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center text-neutral-600 active:scale-[0.98] active:text-neutral-900"
          aria-label="View public profile"
        >
          <Eye className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
      </div>
      <div className="absolute right-1 top-1 flex items-center gap-0.5">
        {shareReady ? (
          <ShareButton title={shareTitle} text={shareText} path={sharePath} iconOnly light />
        ) : null}
        <button
          type="button"
          onClick={onEditProfile}
          data-nav-focus="profile-edit"
          className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center text-neutral-600 active:scale-[0.98] active:text-neutral-900"
          aria-label="Edit profile"
        >
          <Pencil className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
      </div>

      <div className="relative mx-auto mt-6 h-[88px] w-[88px] shrink-0">
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="44" fill="none" stroke="#e5e7eb" strokeWidth="5" />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="#059669"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${(completionPercent / 100) * 276} 276`}
          />
        </svg>
        <SecureAvatar
          src={avatarUrl}
          name={displayName}
          className="absolute inset-[8px] h-[72px] w-[72px] text-xl ring-4 ring-white"
        />
        <button
          type="button"
          onClick={onEditAvatar}
          className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md ring-2 ring-white active:scale-[0.98]"
          aria-label="Change profile photo"
        >
          <Camera className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
      </div>

      <h1 className="mt-2 text-lg font-bold leading-tight text-neutral-900">{displayName}</h1>

      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-100">
          {roleLabel}
        </span>
        {visibilityLabel ? (
          <Link
            to={APP_SETTINGS_PRIVACY_PATH}
            state={profileHubMobileBackState()}
            data-nav-focus="profile-privacy"
            className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-600 ring-1 ring-neutral-200/80"
          >
            {visibilityLabel}
          </Link>
        ) : null}
      </div>

      <p className="mt-1.5 text-xs text-neutral-500">
        {[cityLabel, memberSinceLabel].filter(Boolean).join(' · ')}
      </p>

      {tierBadge ? <div className="mt-2 flex justify-center">{tierBadge}</div> : null}
    </div>

    <div
      className={`grid divide-x divide-neutral-100 border-t border-neutral-100 ${
        stats.length >= 3 ? 'grid-cols-3' : stats.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
      }`}
    >
      {stats.map((stat) => (
        <ProfileHubStatCell key={stat.key} stat={stat} />
      ))}
    </div>

  </div>
);
