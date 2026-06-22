import { Link } from 'react-router-dom';
import { ChevronRight, Target } from 'lucide-react';
import { RewardPathToNextTierDTO, RewardSummaryDTO } from '@uaetrail/shared-types';
import { GlassCard } from '../mobile/GlassCard';
import { MembershipTierBadge } from '../ui/MembershipTierBadge';

interface TrailPointsProgressCardProps {
  summary: Pick<RewardSummaryDTO, 'points' | 'membershipTier' | 'nextTier' | 'pathToNextTier'>;
  compact?: boolean;
}

export const TrailPointsProgressCard = ({ summary, compact = false }: TrailPointsProgressCardProps) => {
  const { points, membershipTier, nextTier, pathToNextTier } = summary;
  const progressPercent = nextTier
    ? Math.min(
        100,
        Math.round(
          ((points - membershipTier.minPoints) / (nextTier.minPoints - membershipTier.minPoints)) * 100
        )
      )
    : 100;

  const suggestions: RewardPathToNextTierDTO['suggestions'] =
    pathToNextTier?.suggestions ?? [];

  if (compact && !nextTier) return null;

  return (
    <GlassCard padding className="!p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-gray-900 text-sm">
            {nextTier ? `Path to ${nextTier.name}` : 'Maximum tier reached'}
          </h3>
        </div>
        <Link to="/my-rewards" className="text-xs font-semibold text-emerald-600">
          View all
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-2xl font-extrabold text-emerald-700">{points.toLocaleString()}</span>
        <span className="text-xs text-gray-500">pts</span>
        <MembershipTierBadge
          tierKey={membershipTier.key}
          name={membershipTier.name}
        />
      </div>

      {nextTier && (
        <>
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{membershipTier.name}</span>
            <span>
              {pathToNextTier?.pointsRemaining ?? nextTier.pointsRemaining} pts to {nextTier.name}{' '}
              {nextTier.emoji}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-4">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {!compact && suggestions.length > 0 && (
            <ul className="space-y-2">
              {suggestions.map((item) => (
                <li key={item.title}>
                  <Link
                    to={item.path}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gray-50 hover:bg-emerald-50/80 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-emerald-800">{item.title}</p>
                      {item.note && <p className="text-[11px] text-gray-500">{item.note}</p>}
                    </div>
                    <span className="flex items-center gap-1 shrink-0 text-xs font-bold text-emerald-700">
                      +{item.points}
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {!nextTier && (
        <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
          🐐 You&apos;ve reached GOAT — top contributor status!
        </p>
      )}
    </GlassCard>
  );
};
