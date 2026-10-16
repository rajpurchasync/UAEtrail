import { ProfileHistorySubviewPills } from '../profile-history/ProfileHistorySubviewPills';
import { tripsPlansRoleChips, type TripsPlansRole } from '../../member-plan/tripsRouting';

type TripsPlansUpcomingHeaderProps = {
  activeRole: TripsPlansRole;
  onRoleChange: (role: TripsPlansRole) => void;
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
      pills={tripsPlansRoleChips(canHost)}
      activeId={activeRole}
      onChange={onRoleChange}
    />
  </div>
);
