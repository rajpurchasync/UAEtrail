import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { MemberGoalDTO } from '@uaetrail/shared-types';
import { ProfileGoalCard, type SaveMemberGoalInput } from '../profile/ProfileGoalCard';
import { formatGoalHeadline } from '../profile/goalCopy';

type PlanGoalsProgressSummaryProps = {
  primaryGoal: MemberGoalDTO | null;
  saving: boolean;
  onSaveGoal: (input: SaveMemberGoalInput) => Promise<void>;
  onClearGoal: () => Promise<void>;
  onReloadGoals: () => void;
};

/** Collapsed goal progress above Plan tabs — tap to expand or set a goal. */
export const PlanGoalsProgressSummary = ({
  primaryGoal,
  saving,
  onSaveGoal,
  onClearGoal,
  onReloadGoals,
}: PlanGoalsProgressSummaryProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  const progress =
    primaryGoal && primaryGoal.targetCount > 0
      ? Math.min(1, primaryGoal.currentCount / primaryGoal.targetCount)
      : 0;
  const headline = primaryGoal
    ? formatGoalHeadline(primaryGoal.activityFilter, primaryGoal.targetCount, primaryGoal.targetDate)
    : 'Set an outdoor goal';

  return (
    <>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="w-full rounded-2xl border border-orange-200/60 bg-gradient-to-r from-amber-50/90 to-white px-4 py-3 text-left shadow-sm active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-orange-800/90">Goal</p>
            <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-neutral-900">{headline}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-orange-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                style={{ width: `${Math.round(progress * 100)}%` }}
                role="progressbar"
                aria-valuenow={primaryGoal?.currentCount ?? 0}
                aria-valuemin={0}
                aria-valuemax={primaryGoal?.targetCount ?? 1}
              />
            </div>
          </div>
          <ChevronDown className="h-5 w-5 shrink-0 text-orange-700/60" aria-hidden />
        </div>
      </button>

      <ProfileGoalCard
        surfaceHidden
        goal={primaryGoal}
        saving={saving}
        onSave={onSaveGoal}
        onClear={primaryGoal ? onClearGoal : undefined}
        onReloadGoal={onReloadGoals}
        sheetOpen={sheetOpen}
        onSheetOpenChange={setSheetOpen}
      />
    </>
  );
};
