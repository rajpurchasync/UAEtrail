import { useState, type ReactNode } from 'react';
import { Bookmark, CalendarCheck, Target, Users } from 'lucide-react';
import type { MemberGoalDTO } from '@uaetrail/shared-types';
import { PLAN_GOALS_SECTION_TITLE, PLAN_WANT_TO_GO_LABEL } from '../../plan/planAdd';
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

const statIconTone: Record<'hosting' | 'joined' | 'goals' | 'saved', string> = {
  hosting: 'text-amber-600',
  joined: 'text-emerald-700',
  goals: 'text-orange-600',
  saved: 'text-sky-700',
};

const StatCell = ({
  label,
  value,
  icon,
  onClick,
  dimmed,
  tone,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  onClick: () => void;
  dimmed?: boolean;
  tone: keyof typeof statIconTone;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`plan-summary-stat flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-center transition active:bg-orange-100/40 md:min-h-[3rem] lg:min-h-10 lg:flex-row lg:justify-center lg:gap-2 lg:py-1.5 lg:px-2 ${
      dimmed ? 'opacity-70' : ''
    }`}
  >
    <span className={`shrink-0 ${statIconTone[tone]} lg:[&_svg]:h-4 lg:[&_svg]:w-4`} aria-hidden>
      {icon}
    </span>
    <span className="plan-summary-stat-value text-base font-bold tabular-nums leading-none text-neutral-900 md:text-sm lg:text-base">
      {value}
    </span>
    <span className="plan-summary-stat-label text-[9px] font-bold uppercase tracking-wide text-orange-900/70 md:text-[10px] lg:normal-case lg:text-xs lg:font-semibold lg:tracking-normal">
      {label}
    </span>
  </button>
);

/** Plan hub summary — hosting, joined, goals, and want-to-go venues at a glance. */
const SummaryStatSkeleton = () => (
  <div className="flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-1.5 md:min-h-[3rem] lg:min-h-10 lg:flex-row lg:gap-2 lg:py-1.5">
    <div className="h-4 w-4 animate-pulse rounded bg-orange-200/80" aria-hidden />
    <div className="h-4 w-6 animate-pulse rounded-md bg-orange-200/70" aria-hidden />
    <div className="h-2.5 w-10 animate-pulse rounded bg-orange-100" aria-hidden />
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
        className="plan-summary-strip w-full rounded-2xl border border-orange-200/60 bg-gradient-to-b from-amber-50/90 to-white px-2.5 py-2 shadow-sm md:px-2 md:py-1.5 lg:flex lg:items-center lg:gap-4 lg:rounded-xl lg:px-3 lg:py-2"
        role="region"
        aria-label="Plan summary"
        aria-busy={loading}
      >
        <p className="plan-summary-heading mb-1.5 text-[10px] font-bold uppercase tracking-wide text-orange-800/90 md:mb-1 lg:mb-0 lg:shrink-0 lg:text-[10px]">
          Summary
        </p>
        {loading ? (
          <div
            className="plan-summary-stats-grid grid flex-1 grid-cols-4 gap-0.5 lg:gap-0 lg:divide-x lg:divide-orange-200/50"
            aria-label="Loading summary"
          >
            <SummaryStatSkeleton />
            <SummaryStatSkeleton />
            <SummaryStatSkeleton />
            <SummaryStatSkeleton />
          </div>
        ) : (
          <div className="plan-summary-stats-grid grid flex-1 grid-cols-4 gap-0.5 lg:gap-0 lg:divide-x lg:divide-orange-200/50">
            <StatCell
              label="Hosting"
              tone="hosting"
              value={canHost ? String(hosting) : '—'}
              icon={<Users className="h-4 w-4" strokeWidth={2.25} />}
              onClick={() => {
                if (canHost) onSummaryFocus('hosting');
              }}
              dimmed={!canHost}
            />
            <StatCell
              label="Joined"
              tone="joined"
              value={String(joined)}
              icon={<CalendarCheck className="h-4 w-4" strokeWidth={2.25} />}
              onClick={() => onSummaryFocus('joined')}
            />
            <StatCell
              label={PLAN_GOALS_SECTION_TITLE}
              tone="goals"
              value={String(activeGoalCount)}
              icon={<Target className="h-4 w-4" strokeWidth={2.25} />}
              onClick={focusGoals}
            />
            <StatCell
              label={PLAN_WANT_TO_GO_LABEL}
              tone="saved"
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
