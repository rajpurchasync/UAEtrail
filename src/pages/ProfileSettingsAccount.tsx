import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { ProfileAccountSettingsSections } from '../components/profile/ProfileAccountSettingsSections';
import { AccountSignOutButton } from '../components/account';
import { useProfileSettingsBackChrome } from '../hooks/useProfileHubBackChrome';

export const ProfileSettingsAccount = () => {
  const backChrome = useProfileSettingsBackChrome();
  const { user, signOut, refreshUser } = useAuth();

  const refresh = async () => {
    await refreshUser();
  };

  return (
    <ConsumerShell
      layout="stack"
      title="Account"
      showJourney={false}
      back={backChrome}
    >
      <div className="space-y-3 pb-nav-safe animate-fade-up">
        <ProfileAccountSettingsSections
          email={user?.email ?? ''}
          onEmailChanged={refresh}
          onDeleted={() => void signOut()}
        />
        <AccountSignOutButton onSignOut={() => void signOut()} />
      </div>
    </ConsumerShell>
  );
};
