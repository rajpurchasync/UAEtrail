import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/services';
import type { UserProfile } from '../../api/types';
import { ConsumerShell } from '../mobile/ConsumerShell';
import { PullToRefresh } from '../mobile/PullToRefresh';
import { ProfileAccountSettingsSections } from './ProfileAccountSettingsSections';
import { ProfileMemberDetailsCard } from './ProfileMemberDetailsCard';
import { ProfileMapPresenceSection } from './ProfileMapPresenceSection';

interface ProfileSettingsViewProps {
  onSignOut: () => void;
}

export const ProfileSettingsView = ({ onSignOut }: ProfileSettingsViewProps) => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<Pick<
    UserProfile,
    'dateOfBirth' | 'gender' | 'countryCode' | 'city' | 'languages'
  > | null>(null);

  const loadProfile = async () => {
    const profileRes = await api.getMeProfile();
    setProfile({
      dateOfBirth: profileRes.data.dateOfBirth,
      gender: profileRes.data.gender,
      countryCode: profileRes.data.countryCode,
      city: profileRes.data.city,
      languages: profileRes.data.languages,
    });
  };

  useEffect(() => {
    if (!user) return;
    void loadProfile();
  }, [user?.id]);

  const refreshSettings = async () => {
    await refreshUser();
    await loadProfile();
  };

  return (
    <ConsumerShell layout="stack" title="Settings" showJourney={false} back={{ fallbackTo: '/profile', label: 'Profile' }}>
      <PullToRefresh onRefresh={refreshSettings}>
        <div className="space-y-3 pb-nav-safe animate-fade-up">
          {profile ? (
            <ProfileMemberDetailsCard profile={profile} onUpdated={refreshSettings} />
          ) : null}

          <ProfileMapPresenceSection />

          <ProfileAccountSettingsSections
            email={user?.email ?? ''}
            onEmailChanged={refreshSettings}
            onDeleted={onSignOut}
          />
        </div>
      </PullToRefresh>
    </ConsumerShell>
  );
};
