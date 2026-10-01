import type { RewardBadgeDTO } from '@uaetrail/shared-types';

type PublicMemberBadgeMedallionsProps = {
  tierBadges: RewardBadgeDTO[];
  achievementBadges: RewardBadgeDTO[];
  title?: string;
};

const Medallion = ({ badge }: { badge: RewardBadgeDTO }) => (
  <div
    className="flex w-[72px] shrink-0 flex-col items-center gap-1"
    title={badge.description}
  >
    <span
      className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-amber-50 to-white text-2xl shadow ring-2 ring-amber-200/90"
      aria-hidden
    >
      {badge.emoji}
    </span>
    <span className="max-w-[72px] truncate text-center text-[10px] font-semibold text-neutral-800">
      {badge.name}
    </span>
  </div>
);

export const PublicMemberBadgeMedallions = ({
  tierBadges,
  achievementBadges,
  title = 'Badges',
}: PublicMemberBadgeMedallionsProps) => {
  const earned = [...tierBadges, ...achievementBadges].filter((b) => b.earned);
  if (earned.length === 0) return null;

  return (
    <section aria-label={title}>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">{title}</p>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-none">
        {earned.map((badge) => (
          <Medallion key={badge.key} badge={badge} />
        ))}
      </div>
    </section>
  );
};
