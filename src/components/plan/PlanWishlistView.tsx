import type { MemberGoalDTO } from '@uaetrail/shared-types';
import { ProfileGoalsSection } from '../profile/ProfileGoalsSection';
import type { SaveMemberGoalInput } from '../profile/ProfileGoalCard';
import { PlanSavedSection } from './PlanSavedSection';

type PlanWishlistViewProps = {
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
      <h2 id="plan-wishlist-goals" className="mb-3 text-sm font-bold text-neutral-900">
        Goals
      </h2>
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
    <section aria-labelledby="plan-wishlist-saved">
      <h2 id="plan-wishlist-saved" className="mb-3 text-sm font-bold text-neutral-900">
        Saved
      </h2>
      <PlanSavedSection />
    </section>
  </div>
);
