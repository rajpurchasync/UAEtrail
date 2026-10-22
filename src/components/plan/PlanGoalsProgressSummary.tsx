import { useState } from 'react';
import { ChevronRight, Target } from 'lucide-react';
import type { MemberGoalDTO } from '@uaetrail/shared-types';
import { ProfileGoalCard, type SaveMemberGoalInput } from '../profile/ProfileGoalCard';
import { formatGoalHeadline } from '../profile/goalCopy';
import { aggregateMemberGoals } from '../../utils/memberGoalsAggregate';
import type { PlanMainTab } from '../../plan/planTab';

type PlanGoalsProgressSummaryProps = {
  goals: MemberGoalDTO[];
  mainTab: PlanMainTab;
  saving: boolean;
  onCreateGoal: (input: SaveMemberGoalInput) => Promise<void>;
  onReloadGoals: () => void;
  onOpenWishlist: () => void;
};

const AggregateProgressRing = ({
  current,
  target,
  progress,
}: {
  current: number;
  target: number;
  progress: number;
}) => {
  const dim = 72;
  const center = dim / 2;
  const r = 30;
  const stroke = 5;
  const ring = 2 * Math.PI * r;
  const dash = progress * ring;
  const pct = Math.round(progress * 100);

  return (
    <div className="relative shrink-0" style={{ width: dim, height: dim }} aria-hidden>
      <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${dim} ${dim}`}>
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="rgb(254 215 170 / 0.9)"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="#ea580c"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${ring}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-bold tabular-nums leading-none text-neutral-900">
          {current}
          <span className="text-xs font-semibold text-neutral-500">/{target || '—'}</span>
        </span>
        <span className="mt-0.5 text-[10px] font-semibold text-orange-700/90">{pct}%</span>
      </div>
    </div>
  );
};

/** Aggregated goal progress above Plan tabs — individual goals live on Wishlist. */
export const PlanGoalsProgressSummary = ({
  goals,
  mainTab,
  saving,
  onCreateGoal,
  onReloadGoals,
  onOpenWishlist,
}: PlanGoalsProgressSummaryProps) => {
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const aggregate = aggregateMemberGoals(goals);
  const { activeGoals, completedCount, totalCurrent, totalTarget, progress } = aggregate;

  const headline =
    activeGoals.length === 0
      ? completedCount > 0
        ? 'All goals complete'
        : 'Set outdoor goals'
      : activeGoals.length === 1
        ? formatGoalHeadline(
            activeGoals[0]!.activityFilter,
            activeGoals[0]!.targetCount,
            activeGoals[0]!.targetDate
          )
        : `${activeGoals.length} goals in progress`;

  const subline =
    activeGoals.length === 0
      ? completedCount > 0
        ? `${completedCount} completed — add a new challenge anytime`
        : 'Track hikes, camps, and outings in one place'
      : activeGoals.length === 1
        ? `${totalCurrent} of ${totalTarget} logged toward this goal`
        : `${totalCurrent} of ${totalTarget} outings logged across your goals`;

  const handlePress = () => {
    if (goals.length === 0) {
      setAddSheetOpen(true);
      return;
    }
    if (mainTab === 'wishlist') {
      document.getElementById('plan-wishlist-goals')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    onOpenWishlist();
  };

  return (
    <>
      <button
        type="button"
        onClick={handlePress}
        className="relative w-full overflow-hidden rounded-2xl border border-orange-200/70 bg-gradient-to-br from-amber-50/95 via-white to-orange-50/80 px-4 py-3 text-left shadow-sm shadow-orange-900/5 transition active:scale-[0.99]"
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-400 via-orange-500 to-rose-500"
          aria-hidden
        />
        <div className="flex items-center gap-3 pl-1">
          {activeGoals.length > 0 ? (
            <AggregateProgressRing
              current={totalCurrent}
              target={totalTarget}
              progress={progress}
            />
          ) : (
            <div
              className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 text-orange-700 shadow-inner"
              aria-hidden
            >
              <Target className="h-5 w-5" strokeWidth={2.25} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-orange-700/90">
              {activeGoals.length > 1 ? 'Goals' : 'Goal'}
              {completedCount > 0 && activeGoals.length > 0
                ? ` · ${completedCount} done`
                : null}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[15px] font-bold leading-snug text-neutral-900">{headline}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-600">{subline}</p>
            {activeGoals.length > 1 ? (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-orange-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                  role="progressbar"
                  aria-valuenow={totalCurrent}
                  aria-valuemin={0}
                  aria-valuemax={totalTarget}
                />
              </div>
            ) : null}
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-orange-700/50" aria-hidden />
        </div>
      </button>

      <ProfileGoalCard
        surfaceHidden
        goal={null}
        saving={saving}
        onSave={async (input) => {
          await onCreateGoal(input);
          setAddSheetOpen(false);
        }}
        onReloadGoal={onReloadGoals}
        sheetOpen={addSheetOpen}
        onSheetOpenChange={setAddSheetOpen}
      />
    </>
  );
};
