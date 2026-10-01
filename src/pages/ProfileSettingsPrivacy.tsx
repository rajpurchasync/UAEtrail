import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { ProfileVisibilitySection } from '../components/profile/ProfileVisibilitySection';
import { ProfileMapPresenceSection } from '../components/profile/ProfileMapPresenceSection';

export const ProfileSettingsPrivacy = () => (
  <ConsumerShell
    layout="stack"
    title="Privacy"
    showJourney={false}
    back={{ fallbackTo: '/profile/settings', label: 'Settings' }}
  >
    <div className="space-y-3 pb-nav-safe animate-fade-up">
      <ProfileVisibilitySection />
      <ProfileMapPresenceSection />
    </div>
  </ConsumerShell>
);
