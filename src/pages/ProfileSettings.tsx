import { useAuth } from '../context/AuthContext';
import { ProfileSettingsView } from '../components/profile/ProfileSettingsView';

export const ProfileSettings = () => {
  const { signOut } = useAuth();

  return <ProfileSettingsView onSignOut={() => void signOut()} />;
};
