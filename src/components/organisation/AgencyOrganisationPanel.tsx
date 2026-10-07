import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { AppSegmented } from '../mobile/AppSegmented';
import { OrganisationPublicProfile } from '../organisation-console/OrganisationPublicProfile';
import { AgencyTeamSection } from '../organisation-console/AgencyTeamSection';
import { useHostStatus } from '../../hooks/useHostStatus';
import { agencyProfilePath, organisationManagePath } from '../../config/routingCatalog';

type Tab = 'profile' | 'team';

export const AgencyOrganisationPanel = () => {
  const { loading, ownedProfiles } = useHostStatus();
  const [tab, setTab] = useState<Tab>('profile');

  const agency = useMemo(
    () => ownedProfiles.find((profile) => profile.type === 'agency') ?? null,
    [ownedProfiles]
  );

  return (
    <div className="space-y-3 animate-fade-up">
      {agency && (
        <Link
          to={agencyProfilePath(agency.slug) ?? '/explore'}
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
        <OrganisationPublicProfile
          slug={agency.slug}
          mode="owner"
          backTo={organisationManagePath('agency')}
          backLabel="Manage agency"
        />
      ) : (
        <AgencyTeamSection tenantId={agency.tenantId} />
      )}
    </div>
  );
};
