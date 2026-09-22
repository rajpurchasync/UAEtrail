import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/services';
import { ConsumerShell } from '../mobile/ConsumerShell';
import { PullToRefresh } from '../mobile/PullToRefresh';
import { AccountSignOutButton } from '../account';
import { ProfileAccountSettingsSections } from './ProfileAccountSettingsSections';
import { ProfileLanguagesCard } from './ProfileLanguagesCard';
import { ProfileMapPresenceSection } from './ProfileMapPresenceSection';
import { useOrganisationGate } from '../../hooks/useOrganisationGate';
import { isHostRole } from '../../utils/roles';

interface ProfileSettingsViewProps {
  onSignOut: () => void;
}

export const ProfileSettingsView = ({ onSignOut }: ProfileSettingsViewProps) => {
  const { user, refreshUser } = useAuth();
  const { ownedProfiles } = useOrganisationGate({ enabled: Boolean(user) });
  const canHost = isHostRole(user?.role);
  const canEditLanguages = canHost || ownedProfiles.length > 0;

  const [memberDetails, setMemberDetails] = useState<{ languages: string | null }>({ languages: null });

  useEffect(() => {
    if (!user) return;
    void Promise.all([api.getMyOrganisationApplication().catch(() => null)]).then(([hostRes]) => {
      const meta = hostRes?.data?.metadata;
      setMemberDetails({
        languages: meta?.languages?.trim() || null,
      });
    });
  }, [user]);

  const refreshSettings = async () => {
    await refreshUser();
    const hostRes = await api.getMyOrganisationApplication().catch(() => null);
    const meta = hostRes?.data?.metadata;
    setMemberDetails({
      languages: meta?.languages?.trim() || null,
    });
  };

  return (
    <ConsumerShell layout="stack" title="Settings" showJourney={false} back={{ fallbackTo: '/profile', label: 'Profile' }}>
      <PullToRefresh onRefresh={refreshSettings}>
        <div className="space-y-3 pb-nav-safe animate-fade-up">
          <ProfileLanguagesCard
            languages={memberDetails.languages}
            canEdit={canEditLanguages}
            onUpdated={(languages) => setMemberDetails({ languages })}
          />

          <ProfileMapPresenceSection />

          <ProfileAccountSettingsSections
            email={user?.email ?? ''}
            onEmailChanged={refreshSettings}
            onDeleted={onSignOut}
          />

          <AccountSignOutButton onSignOut={onSignOut} />
        </div>
      </PullToRefresh>
    </ConsumerShell>
  );
};
