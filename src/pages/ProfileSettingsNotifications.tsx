import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { SettingsMenuGroup, SettingsMenuRow } from '../components/settings/SettingsMenuRow';
import { NOTIFICATIONS_PATH, planHubPath } from '../config/routingCatalog';
import { useProfileSettingsBackChrome } from '../hooks/useProfileHubBackChrome';

export const ProfileSettingsNotifications = () => {
  const backChrome = useProfileSettingsBackChrome();

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
            subtitle="Activity, friends, and map alerts"
          />
          <SettingsMenuRow
            label="Saved map & alerts"
            to={planHubPath({ layer: 'places' })}
            subtitle="Places, shops, and plans you starred"
          />
        </SettingsMenuGroup>
      </div>
    </ConsumerShell>
  );
};
