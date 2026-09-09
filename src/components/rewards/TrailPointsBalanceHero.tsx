import { useMemo } from 'react';
import type { RewardSummaryDTO } from '@uaetrail/shared-types';
import { GlassCard } from '../mobile/GlassCard';
import { MembershipTierBadge } from '../ui/MembershipTierBadge';

interface TrailPointsBalanceHeroProps {
  summary: RewardSummaryDTO;
}

export const TrailPointsBalanceHero = ({ summary }: TrailPointsBalanceHeroProps) => {
  const progressPercent = useMemo(() => {
    if (!summary.nextTier) return 100;
    const currentMin = summary.membershipTier.minPoints;
    const nextMin = summary.nextTier.minPoints;
    const span = nextMin - currentMin;
    if (span <= 0) return 100;
    return Math.min(100, Math.round(((summary.points - currentMin) / span) * 100));
  }, [summary]);

  return (
    <GlassCard padding className="border-0 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-100">Your balance</p>
          <p className="text-3xl font-extrabold tracking-tight">{summary.points.toLocaleString()}</p>
          <p className="mt-1 text-sm text-emerald-100">Trail Points</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl sm:h-12 sm:w-12 sm:text-2xl">
          {summary.membershipTier.emoji ?? '🌱'}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <MembershipTierBadge
          tierKey={summary.membershipTier.key}
          name={summary.membershipTier.name}
          emoji={summary.membershipTier.emoji}
          size="md"
        />
        {summary.membershipTier.key === 'free' && (
          <span className="text-xs text-emerald-100 sm:text-sm">Earn points to unlock Active</span>
        )}
      </div>

      <div className="mt-4 border-t border-white/20 pt-4">
        <div className="mb-2 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold">{summary.membershipTier.name} tier</span>
          {summary.nextTier ? (
            <span className="text-xs text-emerald-100 sm:text-sm">
              {summary.nextTier.pointsRemaining} pts to {summary.nextTier.name}
            </span>
          ) : (
            <span className="text-xs text-emerald-100 sm:text-sm">GOAT — highest tier</span>
          )}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {summary.membershipTier.benefits?.[0] && (
          <p className="mt-2 text-xs leading-relaxed text-emerald-100/90">{summary.membershipTier.benefits[0]}</p>
        )}
      </div>
    </GlassCard>
  );
};
