import { useAuth } from '../../context/AuthContext';
import { ConsumerShell } from '../mobile/ConsumerShell';
import { AccountSignOutButton } from '../account';
import { ProfileAccountSettingsSections } from './ProfileAccountSettingsSections';

interface ProfileSettingsViewProps {
  onSignOut: () => void;
}

export const ProfileSettingsView = ({ onSignOut }: ProfileSettingsViewProps) => {
  const { user, refreshUser } = useAuth();

  return (
    <ConsumerShell layout="stack" title="Settings" showJourney={false} back={{ fallbackTo: '/profile', label: 'Profile' }}>
      <div className="space-y-3 pb-nav-safe animate-fade-up">
        <ProfileAccountSettingsSections
          email={user?.email ?? ''}
          onEmailChanged={refreshUser}
          onDeleted={onSignOut}
        />
        <AccountSignOutButton onSignOut={onSignOut} />
      </div>
    </ConsumerShell>
  );
};
