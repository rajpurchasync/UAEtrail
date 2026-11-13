import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { AppSettingsBody } from '../components/profile/AppSettingsBody';
import { DesktopSettingsShell } from '../components/profile/DesktopSettingsShell';
import { useMinWidthLg } from '../hooks/useMinWidthLg';
import { useProfileSettingsBackChrome } from '../hooks/useProfileHubBackChrome';

export const ProfileSettingsPrivacy = () => {
  const backChrome = useProfileSettingsBackChrome();
  const isDesktop = useMinWidthLg();

  if (isDesktop) {
    return (
      <DesktopSettingsShell activeSection="privacy">
        <AppSettingsBody section="privacy" />
      </DesktopSettingsShell>
    );
  }

  return (
    <ConsumerShell layout="stack" title="Privacy" showJourney={false} back={backChrome}>
      <div className="animate-fade-up">
        <AppSettingsBody section="privacy" />
      </div>
    </ConsumerShell>
  );
};
