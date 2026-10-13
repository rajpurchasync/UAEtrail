import { useEffect, useState } from 'react';
import type { MemberGoalDTO } from '@uaetrail/shared-types';
import { MAX_MEMBER_GOALS } from '@uaetrail/shared-types';
import { Plus } from 'lucide-react';
import { AppButton } from '../mobile/AppButton';
import { ProfileGoalCard, type SaveMemberGoalInput } from './ProfileGoalCard';

type ProfileGoalsSectionProps = {
  goals: MemberGoalDTO[];
  saving: boolean;
  onCreateGoal: (input: SaveMemberGoalInput) => Promise<void>;
  onUpdateGoal: (goalId: string, input: SaveMemberGoalInput) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
  onReloadGoals?: () => void;
  /** Trips hub uses compact rows only; profile shows empty warm card when none. */
  layout?: 'profile' | 'trips';
  /** Open the “add goal” sheet from parent chrome (e.g. Trips filters). */
  openAddSheet?: boolean;
  onOpenAddSheetHandled?: () => void;
};

export const ProfileGoalsSection = ({
  goals,
  saving,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
  onReloadGoals,
  layout = 'profile',
  openAddSheet = false,
  onOpenAddSheetHandled,
}: ProfileGoalsSectionProps) => {
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const canAddMore = goals.length < MAX_MEMBER_GOALS;

  useEffect(() => {
    if (!openAddSheet) return;
    setAddSheetOpen(true);
    onOpenAddSheetHandled?.();
  }, [openAddSheet, onOpenAddSheetHandled]);

  if (goals.length === 0 && layout === 'profile') {
    return (
      <ProfileGoalCard
        goal={null}
        saving={saving}
        onSave={onCreateGoal}
        onReloadGoal={onReloadGoals}
      />
    );
  }

  return (
    <div className="space-y-3">
      {layout === 'profile' && goals.length > 0 ? (
        <div className="flex items-center justify-between gap-2 px-0.5">
          <h2 className="text-sm font-bold text-neutral-900">My goals</h2>
          <span className="text-xs font-medium text-neutral-500 tabular-nums">
            {goals.length}/{MAX_MEMBER_GOALS}
          </span>
        </div>
      ) : null}

      {goals.map((goal) => (
        <ProfileGoalCard
          key={goal.id}
          variant="compact"
          goal={goal}
          saving={saving}
          onSave={(input) => onUpdateGoal(goal.id, input)}
          onClear={() => onDeleteGoal(goal.id)}
          onReloadGoal={onReloadGoals}
        />
      ))}

      {canAddMore ? (
        <AppButton
          type="button"
          variant="tint"
          fullWidth
          className="!min-h-[44px]"
          onClick={() => setAddSheetOpen(true)}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" aria-hidden />
            Add another goal
          </span>
        </AppButton>
      ) : null}

      <ProfileGoalCard
        surfaceHidden
        goal={null}
        saving={saving}
        onSave={async (input) => {
          await onCreateGoal(input);
          setAddSheetOpen(false);
        }}
        sheetOpen={addSheetOpen}
        onSheetOpenChange={setAddSheetOpen}
        onReloadGoal={onReloadGoals}
      />
    </div>
  );
};
