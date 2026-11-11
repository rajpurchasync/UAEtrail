import {
  PROFILE_BADGES_PATH,
  PROFILE_HISTORY_PATH,
  PROFILE_REVIEWS_PATH,
  PROFILE_SETTINGS_PATH,
  PROFILE_SUBMISSIONS_PATH,
  PRO_MEMBERSHIP_PATH,
  planUpcomingPath,
  planWishlistTabPath,
} from '../../config/routingCatalog';
import { planGoalsWishlistPath } from '../../plan/planRouting';
import { profileHubMobileBackState } from '../../utils/mobileBackNav';
import {
  Award,
  Backpack,
  CalendarDays,
  Heart,
  LogOut,
  MapPin,
  Settings,
  Sparkles,
  Star,
  Target,
} from 'lucide-react';
import { ProfileHubMenuRow } from './ProfileHubMenuRow';

const back = profileHubMobileBackState();

export const PROFILE_HUB_CALENDAR_PATH = planUpcomingPath('all', 'calendar');

type ProfileHubNavMenuProps = {
  badgesEarnedCount?: number;
  onSignOut: () => void;
};

export const ProfileHubNavMenu = ({
  badgesEarnedCount = 0,
  onSignOut,
}: ProfileHubNavMenuProps) => (
  <div className="space-y-3">
    <div className="glass-card divide-y divide-neutral-100 overflow-hidden">
      <ProfileHubMenuRow label="Calendar" to={PROFILE_HUB_CALENDAR_PATH} icon={CalendarDays} linkState={back} />
      <ProfileHubMenuRow label="Wishlist" to={planWishlistTabPath()} icon={Heart} linkState={back} />
      <ProfileHubMenuRow label="Goals" to={planGoalsWishlistPath()} icon={Target} linkState={back} />
      <ProfileHubMenuRow label="Past trips" to={PROFILE_HISTORY_PATH} icon={Backpack} linkState={back} />
      <ProfileHubMenuRow
        label="Badges"
        to={PROFILE_BADGES_PATH}
        icon={Award}
        linkState={back}
        badge={badgesEarnedCount > 0 ? badgesEarnedCount : undefined}
      />
      <ProfileHubMenuRow label="Reviews" to={PROFILE_REVIEWS_PATH} icon={Star} linkState={back} />
      <ProfileHubMenuRow label="Contributions" to={PROFILE_SUBMISSIONS_PATH} icon={MapPin} linkState={back} />
      <ProfileHubMenuRow label="Settings" to={PROFILE_SETTINGS_PATH} icon={Settings} linkState={back} />
    </div>

    <div className="glass-card overflow-hidden">
      <ProfileHubMenuRow label="Pro membership" to={PRO_MEMBERSHIP_PATH} icon={Sparkles} linkState={back} />
    </div>

    <button
      type="button"
      onClick={onSignOut}
      data-nav-focus="profile-sign-out"
      className="glass-card-interactive flex w-full items-center justify-center gap-2 px-3.5 py-3 text-[15px] font-medium text-red-600"
    >
      <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden />
      Sign out
    </button>
  </div>
);
