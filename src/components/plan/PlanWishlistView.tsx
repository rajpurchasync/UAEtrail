import type { MemberGoalDTO } from '@uaetrail/shared-types';
import {
  PLAN_GOAL_OPTION_LABEL,
  PLAN_GOALS_SECTION_TITLE,
  PLAN_WANT_TO_GO_SECTION_TITLE,
} from '../../plan/planAdd';
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
  onAddSheetOpenChange?: (open: boolean) => void;
  /** Bumped when user taps Want to go in the plan summary strip — scroll after the list loads. */
  savedSummaryScrollRequest?: number;
  onSavedSummaryScrollReady?: () => void;
  onAddWantToGo?: () => void;
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
  onAddSheetOpenChange,
  savedSummaryScrollRequest = 0,
  onSavedSummaryScrollReady,
  onAddWantToGo,
}: PlanWishlistViewProps) => (
  <div className="space-y-8">
    <section
      id="plan-wishlist-goals"
      tabIndex={-1}
      className="scroll-mt-[calc(var(--safe-top)+7.5rem)] outline-none"
      aria-labelledby="plan-wishlist-goals-heading"
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id="plan-wishlist-goals-heading" className="text-sm font-bold text-neutral-900">
          {PLAN_GOALS_SECTION_TITLE}
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
        onAddSheetOpenChange={onAddSheetOpenChange}
        addButtonLabel={PLAN_GOAL_OPTION_LABEL}
      />
    </section>
    <section
      id="plan-wishlist-saved"
      tabIndex={-1}
      className="scroll-mt-[calc(var(--safe-top)+7.5rem)] outline-none"
      aria-labelledby="plan-wishlist-saved-heading"
    >
      <h2 id="plan-wishlist-saved-heading" className="mb-3 text-sm font-bold text-neutral-900">
        {PLAN_WANT_TO_GO_SECTION_TITLE}
      </h2>
      <PlanSavedSection
        summaryScrollRequest={savedSummaryScrollRequest}
        onSummaryScrollReady={onSavedSummaryScrollReady}
        onAdd={onAddWantToGo}
      />
    </section>
    <PlanSuggestedRail refreshKey={refreshKey} />
  </div>
);
