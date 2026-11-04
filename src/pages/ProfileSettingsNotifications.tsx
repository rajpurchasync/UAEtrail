import { Navigate } from 'react-router-dom';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { SettingsMenuGroup, SettingsMenuRow } from '../components/settings/SettingsMenuRow';
import { NOTIFICATIONS_PATH, planHubPath, PROFILE_SETTINGS_NOTIFICATIONS_PATH } from '../config/routingCatalog';
import { useProfileSettingsBackChrome } from '../hooks/useProfileHubBackChrome';
import { useMinWidthLg } from '../hooks/useMinWidthLg';
import { desktopSettingsSectionPath } from '../config/desktopSettings';
import { mobileBackNavState } from '../utils/mobileBackNav';

export const ProfileSettingsNotifications = () => {
  const backChrome = useProfileSettingsBackChrome();
  const isDesktop = useMinWidthLg();
  const notificationsChildBack = mobileBackNavState(PROFILE_SETTINGS_NOTIFICATIONS_PATH, 'Notifications');

  if (isDesktop) return <Navigate to={desktopSettingsSectionPath('notifications')} replace />;

  return (
    <ConsumerShell layout="stack" title="Notifications" showJourney={false} back={backChrome}>
      <div className="space-y-3 pb-nav-safe animate-fade-up">
        <p className="px-1 text-sm text-neutral-600 leading-relaxed">
          In-app alerts and saved-map match notifications.
        </p>
        <SettingsMenuGroup>
          <SettingsMenuRow
            label="Notification inbox"
            to={NOTIFICATIONS_PATH}
            linkState={notificationsChildBack}
            subtitle="Activity, friends, and map alerts"
          />
          <SettingsMenuRow
            label="Saved map & alerts"
            to={planHubPath({ layer: 'places' })}
            linkState={notificationsChildBack}
            subtitle="Places, shops, and plans you starred"
          />
        </SettingsMenuGroup>
      </div>
    </ConsumerShell>
  );
};
