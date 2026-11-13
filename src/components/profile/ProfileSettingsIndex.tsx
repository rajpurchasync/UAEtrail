import { lazy, Suspense } from 'react';
import { useMinWidthLg } from '../../hooks/useMinWidthLg';
import { ConsumerShell } from '../mobile/ConsumerShell';
import { PullToRefresh } from '../mobile/PullToRefresh';
import { useProfileHubBackChrome } from '../../hooks/useProfileHubBackChrome';
import { SETTINGS_SURFACE_TITLE } from '../../config/settingsHub';
import { AppSettingsBody } from './AppSettingsBody';

type ProfileSettingsIndexProps = {
  onRefresh?: () => Promise<void>;
};

const DesktopSettingsPage = lazy(() =>
  import('./DesktopSettingsPage').then((m) => ({ default: m.DesktopSettingsPage }))
);

export const ProfileSettingsIndex = ({ onRefresh }: ProfileSettingsIndexProps) => {
  const backChrome = useProfileHubBackChrome();
  const isDesktop = useMinWidthLg();

  if (isDesktop) {
    return (
      <Suspense fallback={null}>
        <DesktopSettingsPage />
      </Suspense>
    );
  }

  const content = (
    <div className="animate-fade-up">
      <AppSettingsBody />
    </div>
  );

  return (
    <ConsumerShell layout="stack" title={SETTINGS_SURFACE_TITLE} showJourney={false} back={backChrome}>
      {onRefresh ? <PullToRefresh onRefresh={onRefresh}>{content}</PullToRefresh> : content}
    </ConsumerShell>
  );
};
