import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { AppSegmented } from '../components/mobile/AppSegmented';
import { HostPublicProfile } from '../components/host/HostPublicProfile';
import { AgencyTeamSection } from '../components/host/AgencyTeamSection';
import { useHostGate } from '../hooks/useHostGate';

type Tab = 'profile' | 'team';

export const AgencyManage = () => {
  const { loading, hasAgencyProfile, ownedProfiles } = useHostGate();
  const [tab, setTab] = useState<Tab>('profile');

  const agency = useMemo(
    () => ownedProfiles.find((profile) => profile.type === 'agency') ?? null,
    [ownedProfiles]
  );

  if (!loading && !hasAgencyProfile) {
    return <Navigate to="/become-host" replace state={{ intent: 'add-agency' }} />;
  }

  return (
    <ConsumerShell
      layout="stack"
      title="Manage agency"
      showJourney={false}
      back={{ fallbackTo: '/profile', label: 'Profile' }}
    >
      <div className="space-y-3 pb-nav-safe animate-fade-up">
        {agency && (
          <Link
            to={`/operator/${agency.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700"
          >
            View public agency page
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}

        <AppSegmented
          segments={[
            { key: 'profile', label: 'Agency info' },
            { key: 'team', label: 'Team' },
          ]}
          value={tab}
          onChange={setTab}
        />

        {loading || !agency ? (
          <div className="flex justify-center py-12">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          </div>
        ) : tab === 'profile' ? (
          <HostPublicProfile
            slug={agency.slug}
            mode="owner"
            backTo="/agency/manage"
            backLabel="Manage agency"
          />
        ) : (
          <AgencyTeamSection tenantId={agency.tenantId} />
        )}
      </div>
    </ConsumerShell>
  );
};
