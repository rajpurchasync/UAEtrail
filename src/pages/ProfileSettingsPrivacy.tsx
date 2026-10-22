import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { ProfileVisibilitySection } from '../components/profile/ProfileVisibilitySection';
import { ProfileMapPresenceSection } from '../components/profile/ProfileMapPresenceSection';
import { useProfileSettingsBackChrome } from '../hooks/useProfileHubBackChrome';

export const ProfileSettingsPrivacy = () => {
  const backChrome = useProfileSettingsBackChrome();

  return (
    <ConsumerShell layout="stack" title="Privacy" showJourney={false} back={backChrome}>
      <div className="space-y-3 pb-nav-safe animate-fade-up">
        <ProfileVisibilitySection />
        <ProfileMapPresenceSection />
      </div>
    </ConsumerShell>
  );
};
