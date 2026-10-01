import type { MemberGoalPublicDTO } from '@uaetrail/shared-types';
import { GlassCard } from '../mobile/GlassCard';
import { formatGoalDeadlineLabel, goalActivityLabel, goalActivityLabelTitle } from './goalCopy';

type PublicMemberYearGoalProps = {
  goal: MemberGoalPublicDTO;
};

export const PublicMemberYearGoal = ({ goal }: PublicMemberYearGoalProps) => {
  const progress = Math.min(1, goal.currentCount / Math.max(1, goal.targetCount));
  const label = goalActivityLabel(goal.activityFilter);
  const title = goalActivityLabelTitle(goal.activityFilter);
  const by = formatGoalDeadlineLabel(goal.targetDate);

  return (
    <GlassCard padding>
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Outdoor goal</p>
      <p className="mt-1 text-base font-bold text-neutral-900">
        {goal.completed ? 'Goal complete' : `${goal.currentCount} of ${goal.targetCount} ${label}`}
      </p>
      <p className="mt-0.5 text-sm text-neutral-600">
        {title} · by {by} · checked-in outings
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${Math.round(progress * 100)}%` }}
          role="progressbar"
          aria-valuenow={goal.currentCount}
          aria-valuemin={0}
          aria-valuemax={goal.targetCount}
          aria-label={`${goal.currentCount} of ${goal.targetCount} ${label}`}
        />
      </div>
    </GlassCard>
  );
};
