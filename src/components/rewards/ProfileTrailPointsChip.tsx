import { RewardSummaryDTO } from '@uaetrail/shared-types';
import { ChevronRight, Zap } from 'lucide-react';
import { MembershipTierBadge } from '../ui/MembershipTierBadge';

interface ProfileTrailPointsChipProps {
  summary: RewardSummaryDTO;
  onClick: () => void;
}

/** Top-right profile chip — tier badge + points; opens path-to-next-tier on tap. */
export const ProfileTrailPointsChip = ({ summary, onClick }: ProfileTrailPointsChipProps) => {
  const { points, membershipTier, nextTier } = summary;
  const isFree = membershipTier.key === 'free';

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-end gap-1 rounded-xl bg-white/95 backdrop-blur-sm px-3 py-2 shadow-lg shadow-black/10 ring-1 ring-white/80 hover:bg-white active:scale-[0.98] transition-all text-right"
      aria-label="View Trail Points progress"
    >
      <span className="text-lg font-extrabold text-emerald-700 tabular-nums leading-none">
        {points.toLocaleString()}
        <span className="text-[10px] font-semibold text-emerald-600/80 ml-0.5">pts</span>
      </span>
      {isFree ? (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-600">
          <Zap className="w-3 h-3 text-sky-500" strokeWidth={2.25} />
          {nextTier ? `${nextTier.pointsRemaining} to Active` : 'Trail Points'}
          <ChevronRight className="w-3 h-3 opacity-50" />
        </span>
      ) : (
        <span className="inline-flex items-center gap-1">
          <MembershipTierBadge
            tierKey={membershipTier.key}
            name={membershipTier.name}
            size="sm"
          />
          <ChevronRight className="w-3 h-3 text-gray-400" />
        </span>
      )}
    </button>
  );
};
