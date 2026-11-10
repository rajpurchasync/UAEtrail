import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { AppSettingsBody } from '../components/profile/AppSettingsBody';
import { DesktopSettingsShell } from '../components/profile/DesktopSettingsShell';
import { useMinWidthLg } from '../hooks/useMinWidthLg';
import { useProfileSettingsBackChrome } from '../hooks/useProfileHubBackChrome';

export const ProfileSettingsDisplay = () => {
  const backChrome = useProfileSettingsBackChrome();
  const isDesktop = useMinWidthLg();

  if (isDesktop) {
    return (
      <DesktopSettingsShell activeSection="display">
        <AppSettingsBody section="display" />
      </DesktopSettingsShell>
    );
  }

  return (
    <ConsumerShell layout="stack" title="Display" showJourney={false} back={backChrome}>
      <div className="animate-fade-up">
        <AppSettingsBody section="display" />
      </div>
    </ConsumerShell>
  );
};
