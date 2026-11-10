import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { AppSettingsBody } from '../components/profile/AppSettingsBody';
import { DesktopSettingsShell } from '../components/profile/DesktopSettingsShell';
import { useMinWidthLg } from '../hooks/useMinWidthLg';
import { useProfileSettingsBackChrome } from '../hooks/useProfileHubBackChrome';

export const ProfileSettingsAccount = () => {
  const backChrome = useProfileSettingsBackChrome();
  const isDesktop = useMinWidthLg();

  if (isDesktop) {
    return (
      <DesktopSettingsShell activeSection="account">
        <AppSettingsBody section="account" />
      </DesktopSettingsShell>
    );
  }

  return (
    <ConsumerShell layout="stack" title="Account" showJourney={false} back={backChrome}>
      <div className="animate-fade-up">
        <AppSettingsBody section="account" />
      </div>
    </ConsumerShell>
  );
};
