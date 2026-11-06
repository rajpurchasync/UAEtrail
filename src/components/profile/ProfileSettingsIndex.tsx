import { lazy, Suspense } from 'react';
import { Bell, KeyRound, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMinWidthLg } from '../../hooks/useMinWidthLg';
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
import { DisplayPreferencesSection } from './DisplayPreferencesSection';
import { AndroidInstallSettingsSection } from '../pwa/AndroidInstallSettingsSection';
import { IosInstallSettingsSection } from '../pwa/IosInstallSettingsSection';

type ProfileSettingsIndexProps = {
  onRefresh?: () => Promise<void>;
};

const DesktopSettingsPage = lazy(() =>
  import('./DesktopSettingsPage').then((m) => ({ default: m.DesktopSettingsPage }))
);

export const ProfileSettingsIndex = ({ onRefresh }: ProfileSettingsIndexProps) => {
  const { user } = useAuth();
  const backChrome = useProfileHubBackChrome();
  const isDesktop = useMinWidthLg();
  const settingsChildBack = mobileBackNavState(PROFILE_SETTINGS_PATH, 'Settings');
  const guest = !user;

  if (isDesktop) {
    return (
      <Suspense fallback={null}>
        <DesktopSettingsPage />
      </Suspense>
    );
  }

  const content = (
    <div className="space-y-4 pb-nav-safe animate-fade-up">
      <DisplayPreferencesSection />
      <SettingsMenuGroup>
        <SettingsMenuRow
          label="Account"
          to={guest ? undefined : PROFILE_SETTINGS_ACCOUNT_PATH}
          linkState={settingsChildBack}
          icon={KeyRound}
          subtitle={guest ? 'Log in to change email and password' : 'Email, password, sign out'}
          disabled={guest}
        />
        <SettingsMenuRow
          label="Privacy"
          to={guest ? undefined : PROFILE_SETTINGS_PRIVACY_PATH}
          linkState={settingsChildBack}
          icon={Shield}
          subtitle={guest ? 'Log in to control who sees you' : 'Profile visibility and publishing profiles'}
          disabled={guest}
        />
        <SettingsMenuRow
          label="Notifications"
          to={guest ? undefined : PROFILE_SETTINGS_NOTIFICATIONS_PATH}
          linkState={settingsChildBack}
          icon={Bell}
          subtitle={guest ? 'Log in to manage outing alerts' : 'Inbox and outing alerts'}
          disabled={guest}
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
