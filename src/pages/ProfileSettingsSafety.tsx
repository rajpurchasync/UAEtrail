import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { useProfileSettingsBackChrome } from '../hooks/useProfileHubBackChrome';
import { useMinWidthLg } from '../hooks/useMinWidthLg';
import { DesktopSettingsShell } from '../components/profile/DesktopSettingsShell';
import { AppSettingsBody } from '../components/profile/AppSettingsBody';

export const ProfileSettingsSafety = () => {
  const backChrome = useProfileSettingsBackChrome();
  const isDesktop = useMinWidthLg();

  if (isDesktop) {
    return (
      <DesktopSettingsShell activeSection="safety">
        <AppSettingsBody section="safety" />
      </DesktopSettingsShell>
    );
  }

  return (
    <ConsumerShell layout="stack" title="Safety & emergency" showJourney={false} back={backChrome}>
      <div className="animate-fade-up">
        <AppSettingsBody section="safety" />
      </div>
    </ConsumerShell>
  );
};
