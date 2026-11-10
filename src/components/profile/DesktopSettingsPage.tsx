import { DesktopSettingsShell } from './DesktopSettingsShell';
import { AppSettingsBody } from './AppSettingsBody';

/** Desktop `/settings` — display section only (other sections use dedicated routes). */
export const DesktopSettingsPage = () => (
  <DesktopSettingsShell activeSection="display">
    <AppSettingsBody section="display" />
  </DesktopSettingsShell>
);
