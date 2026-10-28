import { useState, type ReactNode } from 'react';
import { Bookmark, CalendarCheck, Target, Users } from 'lucide-react';
import type { MemberGoalDTO } from '@uaetrail/shared-types';
import { ProfileGoalCard, type SaveMemberGoalInput } from '../profile/ProfileGoalCard';
import { usePlanHubSummary } from '../../hooks/usePlanHubSummary';

export type PlanSummaryFocus = 'hosting' | 'joined' | 'goals' | 'saved';

type PlanGoalsProgressSummaryProps = {
  goals: MemberGoalDTO[];
  goalsLoading?: boolean;
  canHost: boolean;
  refreshKey: number;
  saving: boolean;
  onCreateGoal: (input: SaveMemberGoalInput) => Promise<void>;
  onReloadGoals: () => void;
  onSummaryFocus: (focus: PlanSummaryFocus) => void;
};

const StatCell = ({
  label,
  value,
  icon,
  onClick,
  dimmed,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  onClick: () => void;
  dimmed?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-center transition active:bg-neutral-100 ${
      dimmed ? 'opacity-70' : ''
    }`}
  >
    <span className="text-emerald-800" aria-hidden>{icon}</span>
    <span className="text-lg font-bold tabular-nums leading-none text-neutral-900">{value}</span>
    <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{label}</span>
  </button>
);

/** Plan hub summary — hosting, joined, goals, and saved places at a glance. */
const SummaryStatSkeleton = () => (
  <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 px-1 py-2">
    <div className="h-4 w-4 animate-pulse rounded bg-neutral-200" aria-hidden />
    <div className="h-5 w-7 animate-pulse rounded-md bg-neutral-200" aria-hidden />
    <div className="h-2.5 w-11 animate-pulse rounded bg-neutral-100" aria-hidden />
  </div>
);

export const PlanGoalsProgressSummary = ({
  goals,
  goalsLoading = false,
  canHost,
  refreshKey,
  saving,
  onCreateGoal,
  onReloadGoals,
  onSummaryFocus,
}: PlanGoalsProgressSummaryProps) => {
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const { hosting, joined, goals: activeGoalCount, savedPlaces, loading } = usePlanHubSummary(
    goals,
    canHost,
    true,
    refreshKey,
    goalsLoading
  );

  const focusGoals = () => {
    if (activeGoalCount === 0 && goals.length === 0) {
      setAddSheetOpen(true);
      return;
    }
    onSummaryFocus('goals');
  };

  return (
    <>
      <div
        className="glass-card w-full px-3 py-3"
        role="region"
        aria-label="Plan summary"
        aria-busy={loading}
      >
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
          Summary
        </p>
        {loading ? (
          <div className="grid grid-cols-4 gap-0.5" aria-label="Loading summary">
            <SummaryStatSkeleton />
            <SummaryStatSkeleton />
            <SummaryStatSkeleton />
            <SummaryStatSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-0.5">
            <StatCell
              label="Hosting"
              value={canHost ? String(hosting) : '—'}
              icon={<Users className="h-4 w-4" strokeWidth={2.25} />}
              onClick={() => {
                if (canHost) onSummaryFocus('hosting');
              }}
              dimmed={!canHost}
            />
            <StatCell
              label="Joined"
              value={String(joined)}
              icon={<CalendarCheck className="h-4 w-4" strokeWidth={2.25} />}
              onClick={() => onSummaryFocus('joined')}
            />
            <StatCell
              label="Goals"
              value={String(activeGoalCount)}
              icon={<Target className="h-4 w-4" strokeWidth={2.25} />}
              onClick={focusGoals}
            />
            <StatCell
              label="Saved"
              value={String(savedPlaces)}
              icon={<Bookmark className="h-4 w-4" strokeWidth={2.25} />}
              onClick={() => onSummaryFocus('saved')}
            />
          </div>
        )}
      </div>

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
