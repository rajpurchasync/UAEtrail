import { Award, MapPinned, Settings, UserRound, Users } from 'lucide-react';
import { SettingsMenuGroup, SettingsMenuRow } from '../settings/SettingsMenuRow';

type ProfileHubMenuProps = {
  buddyBadge?: number;
  showHosting?: boolean;
  trailPointsEligible?: boolean;
};

export const ProfileHubMenu = ({
  buddyBadge,
  showHosting = false,
  trailPointsEligible = true,
}: ProfileHubMenuProps) => (
  <div className="space-y-4">
    <SettingsMenuGroup title="People">
      <SettingsMenuRow label="Friends" to="/buddies" icon={Users} badge={buddyBadge} />
      <SettingsMenuRow label="Groups" to="/groups" icon={UserRound} />
    </SettingsMenuGroup>

    <SettingsMenuGroup title="Your trail">
      <SettingsMenuRow label="Trips" to="/trips" subtitle="Upcoming, past, and saved map" icon={MapPinned} />
      {trailPointsEligible ? (
        <SettingsMenuRow label="My badges" to="/profile/badges" icon={Award} />
      ) : null}
      <SettingsMenuRow label="Map contributions" to="/contributions" subtitle="Reviews and places you added" />
    </SettingsMenuGroup>

    <SettingsMenuGroup title="Account">
      {showHosting ? (
        <SettingsMenuRow label="Hosting console" to="/host/overview" subtitle="Manage outings you host" />
      ) : null}
      <SettingsMenuRow label="Settings" to="/profile/settings" icon={Settings} />
    </SettingsMenuGroup>
  </div>
);
