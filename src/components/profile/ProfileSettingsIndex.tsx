import { Bell, KeyRound, Shield } from 'lucide-react';
import { ConsumerShell } from '../mobile/ConsumerShell';
import { PullToRefresh } from '../mobile/PullToRefresh';
import { SettingsMenuGroup, SettingsMenuRow } from '../settings/SettingsMenuRow';
import {
  PROFILE_SETTINGS_ACCOUNT_PATH,
  PROFILE_SETTINGS_NOTIFICATIONS_PATH,
  PROFILE_SETTINGS_PRIVACY_PATH,
  PROFILE_SETTINGS_PATH,
} from '../../config/routingCatalog';
import { mobileBackNavState } from '../../utils/mobileBackNav';
import { useProfileHubBackChrome } from '../../hooks/useProfileHubBackChrome';
import { AndroidInstallSettingsSection } from '../pwa/AndroidInstallSettingsSection';
import { IosInstallSettingsSection } from '../pwa/IosInstallSettingsSection';

type ProfileSettingsIndexProps = {
  onRefresh?: () => Promise<void>;
};

export const ProfileSettingsIndex = ({ onRefresh }: ProfileSettingsIndexProps) => {
  const backChrome = useProfileHubBackChrome();
  const settingsChildBack = mobileBackNavState(PROFILE_SETTINGS_PATH, 'Settings');
    <div className="space-y-4 pb-nav-safe animate-fade-up">
      <SettingsMenuGroup>
        <SettingsMenuRow
          label="Account"
          to={PROFILE_SETTINGS_ACCOUNT_PATH}
          linkState={settingsChildBack}
          icon={KeyRound}
          subtitle="Email, password, sign out"
        />
        <SettingsMenuRow
          label="Privacy"
          to={PROFILE_SETTINGS_PRIVACY_PATH}
          linkState={settingsChildBack}
          icon={Shield}
          subtitle="Profile visibility and publishing profiles"
        />
        <SettingsMenuRow
          label="Notifications"
          to={PROFILE_SETTINGS_NOTIFICATIONS_PATH}
          linkState={settingsChildBack}
          icon={Bell}
          subtitle="Inbox and outing alerts"
        />
      </SettingsMenuGroup>
      <IosInstallSettingsSection />
      <AndroidInstallSettingsSection />
      <p className="px-1 text-xs text-neutral-500">
        Date of birth is set when you join and cannot be changed here. Update name, location, and speaks from Edit profile
        on your profile hub.
      </p>
    </div>
  );

  return (
    <ConsumerShell layout="stack" title="Settings" showJourney={false} back={backChrome}>
      {onRefresh ? <PullToRefresh onRefresh={onRefresh}>{content}</PullToRefresh> : content}
    </ConsumerShell>
  );
};
