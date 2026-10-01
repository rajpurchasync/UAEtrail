import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Eye, Pencil } from 'lucide-react';
import { SecureAvatar } from '../ui/SecureAvatar';
import { ShareButton } from '../ui/ShareButton';
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
      <span className="mt-1 max-w-full truncate text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
        {stat.label}
      </span>
    </>
  );

  const className =
    'flex min-w-0 flex-1 flex-col items-center justify-center px-1 py-3 text-center transition-colors active:bg-neutral-50';

  if (stat.to) {
    return (
      <Link to={stat.to} className={className}>
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
    <div
      className="relative flex min-h-[min(40dvh,380px)] flex-col justify-center bg-gradient-to-b from-emerald-50/70 via-white/40 to-transparent px-4 pb-4 pt-4 text-center"
    >
      <div className="absolute left-1 top-1">
        <button
          type="button"
          onClick={onViewProfile}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl bg-violet-100/90 text-violet-700 shadow-sm ring-1 ring-violet-200/80 active:scale-[0.98]"
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
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl bg-white/90 text-neutral-700 shadow-sm ring-1 ring-neutral-200/80 active:scale-[0.98]"
          aria-label="Edit profile"
        >
          <Pencil className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
      </div>

      <div className="relative mx-auto h-[112px] w-[112px] shrink-0">
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
          className="absolute inset-[10px] h-[92px] w-[92px] text-2xl ring-4 ring-white"
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

      <h1 className="mt-4 text-xl font-bold leading-tight text-neutral-900">{displayName}</h1>

      <p className="mt-1 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-xs text-neutral-500">
        <span className="font-medium capitalize text-neutral-600">{roleLabel}</span>
        {memberSinceLabel ? (
          <>
            <span className="text-neutral-300" aria-hidden>·</span>
            <span>{memberSinceLabel}</span>
          </>
        ) : null}
        {cityLabel ? (
          <>
            <span className="text-neutral-300" aria-hidden>·</span>
            <span>{cityLabel}</span>
          </>
        ) : null}
      </p>

      {visibilityLabel ? (
        <Link
          to="/profile/settings/privacy"
          className="mt-1.5 inline-block text-[11px] font-semibold text-emerald-700 underline-offset-2 hover:underline"
        >
          {visibilityLabel}
        </Link>
      ) : null}

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
