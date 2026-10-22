import type { MemberGoalDTO } from '@uaetrail/shared-types';
import { ProfileGoalsSection } from '../profile/ProfileGoalsSection';
import type { SaveMemberGoalInput } from '../profile/ProfileGoalCard';
import { PlanSavedSection } from './PlanSavedSection';
import { PlanSuggestedRail } from './PlanSuggestedRail';

type PlanWishlistViewProps = {
  refreshKey?: number;
  goals: MemberGoalDTO[];
  saving: boolean;
  onCreateGoal: (input: SaveMemberGoalInput) => Promise<void>;
  onUpdateGoal: (id: string, input: SaveMemberGoalInput) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
  onReloadGoals: () => void;
  openAddSheet?: boolean;
  onOpenAddSheetHandled?: () => void;
};

export const PlanWishlistView = ({
  refreshKey = 0,
  goals,
  saving,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
  onReloadGoals,
  openAddSheet,
  onOpenAddSheetHandled,
}: PlanWishlistViewProps) => (
  <div className="space-y-8">
    <section aria-labelledby="plan-wishlist-goals">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id="plan-wishlist-goals" className="text-sm font-bold text-neutral-900">
          Your goals
        </h2>
        {goals.length > 0 ? (
          <span className="text-xs font-medium text-neutral-500 tabular-nums">{goals.length} total</span>
        ) : null}
      </div>
      <ProfileGoalsSection
        layout="trips"
        goals={goals}
        saving={saving}
        onCreateGoal={onCreateGoal}
        onUpdateGoal={onUpdateGoal}
        onDeleteGoal={onDeleteGoal}
        onReloadGoals={onReloadGoals}
        openAddSheet={openAddSheet}
        onOpenAddSheetHandled={onOpenAddSheetHandled}
      />
    </section>
    <PlanSuggestedRail refreshKey={refreshKey} />
    <section aria-labelledby="plan-wishlist-saved">
      <h2 id="plan-wishlist-saved" className="mb-3 text-sm font-bold text-neutral-900">
        Saved
      </h2>
      <PlanSavedSection />
    </section>
  </div>
);
