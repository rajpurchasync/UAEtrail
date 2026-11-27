import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { persistAuthSessionTokens, switchMeRoleSession } from '../../hooks/accountSessionApi';
import { getActiveTenantId } from '../../api/tenant';
import { useAuth } from '../../context/AuthContext';
import { TenantSwitcher } from '../../components/ui';
import { OrganisationPublicProfile } from '../public/OrganisationPublicProfile';
import { ConsoleShell } from './ConsoleShell';
import { GlassCard } from '../../components/mobile/GlassCard';
import { AppSegmented } from '../../components/mobile/AppSegmented';
import { AgencyOrganisationPanel } from './AgencyOrganisationPanel';
import { ShopOrganisationPanel } from './ShopOrganisationPanel';
import {
  OPERATOR_PROFILE_PATH,
  PRO_MEMBERSHIP_PATH,
  parseOrganisationKind,
  signInPath,
  type OrganisationKind,
} from '../../config/routingCatalog';
import { navigateToVisitorHome } from '../../hosting/navigateHostRoleHome';
import { useMyTenantMemberships } from '../../hooks/usePublishingConsoleQueries';
import { useMemberStatus } from '../../hooks/useMemberStatus';
import { resolveHostingPublishingProfileKind } from '@/discovery/discoveryPortExploreHosting';
import {
  publishingProfileKindToDeskBrand,
  workspaceProfileLabel,
} from '../../content/workspaceVocabulary';

export const PublicProfileEdit = () => {
  const { user, initializing, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const kindParam = parseOrganisationKind(searchParams.get('kind'));
  const [activeTenantId, setActiveTenantId] = useState(getActiveTenantId());
  const { data: memberships, isPending: loadingTenants } = useMyTenantMemberships();
  const gate = useMemberStatus({ enabled: Boolean(user) });
  const { ownedProfiles, loading: loadingStatus, hasAgencyProfile, hasShopProfile } = gate;
  const [switchingRole, setSwitchingRole] = useState(false);
  const [switchMessage, setSwitchMessage] = useState<string | null>(null);

  const activeProfile = useMemo(
    () => ownedProfiles.find((profile) => profile.tenantId === activeTenantId) ?? ownedProfiles[0],
    [ownedProfiles, activeTenantId]
  );

  const activePublishingKind = activeProfile
    ? resolveHostingPublishingProfileKind(activeProfile)
    : 'community';

  const hasMultipleBusinessKinds = hasAgencyProfile && hasShopProfile;

  const manageKind = useMemo((): OrganisationKind | null => {
    if (activePublishingKind === 'shop') return 'shop';
    if (activePublishingKind === 'agency') return 'agency';
    if (hasMultipleBusinessKinds) {
      if (kindParam === 'shop') return 'shop';
      if (kindParam === 'agency') return 'agency';
    }
    return null;
  }, [activePublishingKind, hasMultipleBusinessKinds, kindParam]);

  const tenantSlug = useMemo(() => {
    if (!memberships?.length) return '';
    const match = memberships.find((t) => t.tenantId === activeTenantId) ?? memberships[0];
    return match?.tenantSlug ?? '';
  }, [memberships, activeTenantId]);

  useEffect(() => {
    if (loadingStatus || !manageKind || !hasMultipleBusinessKinds || kindParam === manageKind) return;
    setSearchParams({ kind: manageKind }, { replace: true });
  }, [manageKind, hasMultipleBusinessKinds, kindParam, loadingStatus, setSearchParams]);

  const setManageKind = (kind: OrganisationKind) => {
    setSearchParams({ kind }, { replace: true });
  };

  const switchToVisitorMode = async () => {
    setSwitchMessage(null);
    setSwitchingRole(true);
    try {
      const session = await switchMeRoleSession('participant');
      persistAuthSessionTokens(session.tokens);
      await refreshUser();
      navigateToVisitorHome(navigate);
    } catch (err) {
      setSwitchMessage(err instanceof Error ? err.message : 'Failed to switch role');
    } finally {
      setSwitchingRole(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center consumer-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={signInPath({ redirect: OPERATOR_PROFILE_PATH })}
        replace
        state={{ from: OPERATOR_PROFILE_PATH }}
      />
    );
  }

  const deskBrand = publishingProfileKindToDeskBrand(activePublishingKind);
  const profileTitle = workspaceProfileLabel(deskBrand);

  const showBusinessManagePanels =
    manageKind === 'shop' || manageKind === 'agency' || activePublishingKind === 'shop';

  const showAgencyPublicEditor =
    activePublishingKind === 'agency' ||
    activePublishingKind === 'partner' ||
    activePublishingKind === 'hospitality' ||
    (manageKind === 'agency' && activePublishingKind !== 'shop');

  if (!loadingStatus && showBusinessManagePanels && !hasAgencyProfile && !hasShopProfile && !kindParam) {
    return <Navigate to={PRO_MEMBERSHIP_PATH} replace />;
  }

  return (
    <ConsoleShell title={profileTitle} headerExtra={<TenantSwitcher onChange={setActiveTenantId} />}>
      <GlassCard padding className="mb-3 border border-emerald-100/80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Role mode</p>
            <p className="mt-1 text-xs text-neutral-600">
              Switch to visitor to explore the map and join outings.
            </p>
          </div>
          <button
            type="button"
            disabled={switchingRole}
            onClick={() => void switchToVisitorMode()}
            className="ios-btn min-h-[40px] bg-emerald-600 px-3 text-white"
          >
            {switchingRole ? 'Switching...' : 'Switch to Visitor'}
          </button>
        </div>
        {switchMessage && <p className="mt-2 text-xs text-red-600">{switchMessage}</p>}
      </GlassCard>

      {hasMultipleBusinessKinds && manageKind && (
        <AppSegmented
          segments={[
            { key: 'agency', label: 'Agency' },
            { key: 'shop', label: 'Shop' },
          ]}
          value={manageKind}
          onChange={setManageKind}
          className="mb-3"
        />
      )}

      {loadingTenants || loadingStatus ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      ) : manageKind === 'shop' || activePublishingKind === 'shop' ? (
        <ShopOrganisationPanel />
      ) : manageKind === 'agency' || activePublishingKind === 'agency' ? (
        <AgencyOrganisationPanel />
      ) : showAgencyPublicEditor && tenantSlug ? (
        <OrganisationPublicProfile slug={tenantSlug} mode="owner" />
      ) : activePublishingKind === 'pro_guide' || activePublishingKind === 'community' ? (
        <GlassCard padding className="py-8 text-center">
          <p className="text-sm text-neutral-700">
            Your public face is your member profile. Update Pro details from Profile → Guide.
          </p>
        </GlassCard>
      ) : !tenantSlug ? (
        <GlassCard padding className="py-10 text-center">
          <p className="text-neutral-600">Select an operator profile above to edit your storefront.</p>
        </GlassCard>
      ) : (
        <OrganisationPublicProfile slug={tenantSlug} mode="owner" />
      )}
    </ConsoleShell>
  );
};