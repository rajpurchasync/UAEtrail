import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { ProfileAccountSettingsSections } from '../components/profile/ProfileAccountSettingsSections';
import { AccountDeleteSection, AccountSignOutButton } from '../components/account';
import { useProfileSettingsBackChrome } from '../hooks/useProfileHubBackChrome';
import { useMinWidthLg } from '../hooks/useMinWidthLg';
import { desktopSettingsSectionPath } from '../config/desktopSettings';

export const ProfileSettingsAccount = () => {
  const backChrome = useProfileSettingsBackChrome();
  const { user, signOut, refreshUser } = useAuth();
  const isDesktop = useMinWidthLg();

  const refresh = async () => {
    await refreshUser();
  };

  if (isDesktop) return <Navigate to={desktopSettingsSectionPath('account')} replace />;

  return (
    <ConsumerShell
      layout="stack"
      title="Account"
      showJourney={false}
      back={backChrome}
    >
      <div className="space-y-3 pb-nav-safe animate-fade-up">
        <ProfileAccountSettingsSections email={user?.email ?? ''} onEmailChanged={refresh} />
        <AccountSignOutButton onSignOut={() => void signOut()} />
        <AccountDeleteSection onDeleted={() => void signOut()} />
      </div>
    </ConsumerShell>
  );
};
