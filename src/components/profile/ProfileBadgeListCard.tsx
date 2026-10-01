import type { RewardBadgeDTO } from '@uaetrail/shared-types';

type ProfileBadgeListCardProps = {
  badge: RewardBadgeDTO;
  onSelect: () => void;
};

/** Badge-only tile — section (Earned / Pipeline) carries status; no labels on the card. */
export const ProfileBadgeListCard = ({ badge, onSelect }: ProfileBadgeListCardProps) => (
  <button
    type="button"
    onClick={onSelect}
    className={`flex h-full min-h-[140px] w-full flex-col items-center rounded-2xl border p-3 text-center transition active:scale-[0.98] ${
      badge.earned
        ? 'border-amber-300/90 bg-gradient-to-b from-amber-50 to-orange-50/90 shadow-sm'
        : 'border-neutral-200/90 bg-neutral-50/80'
    }`}
  >
    <span
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-3xl ${
        badge.earned ? 'bg-white shadow ring-2 ring-amber-200/80' : 'bg-neutral-200/90 grayscale opacity-75'
      }`}
      aria-hidden
    >
      {badge.emoji}
    </span>
    <p
      className={`mt-2 line-clamp-2 text-[13px] font-bold leading-snug ${
        badge.earned ? 'text-neutral-900' : 'text-neutral-600'
      }`}
    >
      {badge.name}
    </p>
    <p
      className={`mt-1.5 line-clamp-3 text-[11px] leading-relaxed ${
        badge.earned ? 'text-neutral-600' : 'text-neutral-500'
      }`}
    >
      {badge.description}
    </p>
  </button>
);
