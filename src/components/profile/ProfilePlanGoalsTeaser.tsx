import { Link } from 'react-router-dom';
import { ChevronRight, Target } from 'lucide-react';
import { planGoalsWishlistPath } from '../../plan/planRouting';
import { profileHubMobileBackState } from '../../utils/mobileBackNav';

type ProfilePlanGoalsTeaserProps = {
  goalsCount: number;
};

/** Profile shows counts + Plan deep link — full goals CRUD lives on Plan → Wishlist. */
export const ProfilePlanGoalsTeaser = ({ goalsCount }: ProfilePlanGoalsTeaserProps) => (
  <Link
    to={planGoalsWishlistPath()}
    state={profileHubMobileBackState()}
    className="glass-card-interactive flex items-center gap-3 px-4 py-3.5"
  >
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
      <Target className="h-5 w-5" aria-hidden />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-semibold text-neutral-900">Goals</span>
      <span className="block text-xs text-neutral-500">
        {goalsCount > 0
          ? `${goalsCount} active on Plan — tap to manage`
          : 'Set outdoor goals on Plan'}
      </span>
    </span>
    <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
  </Link>
);
