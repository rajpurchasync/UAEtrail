import { ProfileHistorySubviewPills } from '../profile-history/ProfileHistorySubviewPills';
import { planUpcomingRoleChips, type PlanUpcomingRole } from '../../member-plan/planHubRouting';

type TripsPlansUpcomingHeaderProps = {
  activeRole: PlanUpcomingRole;
  onRoleChange: (role: PlanUpcomingRole) => void;
  canHost: boolean;
};

/** @deprecated Plan tab uses `PlanPageTabs`; kept for one release. */
export const TripsPlansUpcomingHeader = ({
  activeRole,
  onRoleChange,
  canHost,
}: TripsPlansUpcomingHeaderProps) => (
  <div className="space-y-3">
    <h2 className="text-lg font-bold tracking-tight text-neutral-900">Upcoming</h2>
    <ProfileHistorySubviewPills
      pills={planUpcomingRoleChips(canHost)}
      activeId={activeRole}
      onChange={onRoleChange}
    />
  </div>
);
