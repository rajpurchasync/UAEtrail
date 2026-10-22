import { PRO_MEMBERSHIP_PATH } from '../../config/routingCatalog';
import { useEffect, useMemo } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { ConsumerShell } from '../../components/mobile/ConsumerShell';
import { AppSegmented } from '../../components/mobile/AppSegmented';
import { AgencyOrganisationPanel } from '../../components/organisation/AgencyOrganisationPanel';
import { ShopOrganisationPanel } from '../../components/organisation/ShopOrganisationPanel';
import { useMemberStatus } from '../../hooks/useMemberStatus';

import { parseOrganisationKind, type OrganisationKind } from '../../config/routingCatalog';
import { useProfileHubBackChrome } from '../../hooks/useProfileHubBackChrome';

export const Manage = () => {
  const backChrome = useProfileHubBackChrome();
  const [searchParams, setSearchParams] = useSearchParams();
  const kindParam = parseOrganisationKind(searchParams.get('kind'));
  const { loading, hasAgencyProfile, hasShopProfile } = useMemberStatus();

  const hasMultipleKinds = hasAgencyProfile && hasShopProfile;

  const activeKind = useMemo((): OrganisationKind | null => {
    if (hasMultipleKinds) {
      if (kindParam === 'shop') return 'shop';
      return 'agency';
    }
    if (hasAgencyProfile) return 'agency';
    if (hasShopProfile) return 'shop';
    return kindParam;
  }, [hasAgencyProfile, hasShopProfile, hasMultipleKinds, kindParam]);

  useEffect(() => {
    if (loading || !activeKind || !hasMultipleKinds || kindParam === activeKind) return;
    setSearchParams({ kind: activeKind }, { replace: true });
  }, [activeKind, hasMultipleKinds, kindParam, loading, setSearchParams]);

  if (!loading && !hasAgencyProfile && !hasShopProfile && !kindParam) {
    return <Navigate to={PRO_MEMBERSHIP_PATH} replace />;
  }

  const shellTitle = hasMultipleKinds
    ? 'Manage host'
    : activeKind === 'shop'
      ? 'Manage shop'
      : 'Manage agency';

  const setKind = (kind: OrganisationKind) => {
    setSearchParams({ kind }, { replace: true });
  };

  return (
    <ConsumerShell
      layout="stack"
      title={shellTitle}
      showJourney={false}
      back={backChrome}
    >
      <div className="space-y-3 pb-nav-safe">
        {hasMultipleKinds && activeKind && (
          <AppSegmented
            segments={[
              { key: 'agency', label: 'Agency' },
              { key: 'shop', label: 'Shop' },
            ]}
            value={activeKind}
            onChange={setKind}
          />
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          </div>
        ) : activeKind === 'agency' ? (
          <AgencyOrganisationPanel />
        ) : activeKind === 'shop' ? (
          <ShopOrganisationPanel />
        ) : (
          <Navigate to={PRO_MEMBERSHIP_PATH} replace />
        )}
      </div>
    </ConsumerShell>
  );
};
