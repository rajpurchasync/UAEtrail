import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { RewardBadgeDTO } from '@uaetrail/shared-types';
import { ProfileBadgeDetailDialog } from './ProfileBadgeDetailDialog';
import { sortBadgesByCatalogOrder } from '../../constants/memberBadges';

type ProfileBadgeShowcaseProps = {
  displayName: string;
  tierBadges: RewardBadgeDTO[];
  achievementBadges: RewardBadgeDTO[];
  sharePath?: string;
};

const Medallion = ({
  badge,
  earned,
  onSelect,
}: {
  badge: RewardBadgeDTO;
  earned: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={`flex w-[88px] shrink-0 snap-start flex-col items-center gap-1.5 active:scale-95 transition-transform ${
      earned ? '' : 'opacity-45 grayscale'
    }`}
  >
    <span
      className={`flex h-[72px] w-[72px] items-center justify-center rounded-full text-3xl shadow-md ring-4 ${
        earned
          ? 'bg-gradient-to-b from-amber-50 to-white ring-amber-200/90'
          : 'bg-neutral-100 ring-neutral-200/80'
      }`}
      aria-hidden
    >
      {badge.emoji}
    </span>
    <span className="max-w-[88px] truncate text-center text-[11px] font-semibold leading-tight text-neutral-800">
      {badge.name}
    </span>
  </button>
);

export const ProfileBadgeShowcase = ({
  displayName,
  tierBadges,
  achievementBadges,
  sharePath = '/profile',
}: ProfileBadgeShowcaseProps) => {
  const [selected, setSelected] = useState<RewardBadgeDTO | null>(null);

  const badges = useMemo(
    () => sortBadgesByCatalogOrder([...tierBadges, ...achievementBadges]),
    [achievementBadges, tierBadges]
  );

  if (badges.length === 0) return null;

  const earnedCount = badges.filter((b) => b.earned).length;
  const preview = badges.slice(0, 12);

  return (
    <section aria-label="My badges" className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">My badges</h2>
          <p className="text-xs text-neutral-500">{earnedCount} in your collection</p>
        </div>
        <Link to="/profile/badges" className="text-xs font-semibold text-emerald-700">
          View all
        </Link>
      </div>

      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-0.5 scrollbar-none snap-x snap-mandatory">
        {preview.map((badge) => (
          <Medallion
            key={badge.key}
            badge={badge}
            earned={badge.earned}
            onSelect={() => setSelected(badge)}
          />
        ))}
      </div>

      <ProfileBadgeDetailDialog
        badge={selected}
        displayName={displayName}
        sharePath={sharePath}
        onClose={() => setSelected(null)}
      />
    </section>
  );
};
