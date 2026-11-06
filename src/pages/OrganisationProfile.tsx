import { useEffect, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { OrganisationPublicProfile } from '../components/organisation-console/OrganisationPublicProfile';
import { EntityPublicDetailShell } from '../components/entity-public/EntityPublicDetailShell';
import type { TenantProfile } from '../api/types';
import { fetchOrganisationProfileBySlug } from '../hooks/organisationConsoleApi';
import { shopPublicPath } from '../utils/shopPaths';
import { detailBackPath } from '../config/routingCatalog';
import {
  ORGANISATION_PUBLIC_TAB_QUERY,
  parseOrganisationPublicDetailTabParam,
  type OrganisationPublicDetailTabId,
} from '../organisation/organisationPublicDetailTab';

const isShopTenant = (tenant: TenantProfile): boolean =>
  tenant.businessMode === 'SHOP' || tenant.type === 'shop' || tenant.type === 'SHOP';

/** Public brand profile — `/agency` or `/partner`. Shop tenants redirect to `/shop/:id`. Individual Pro is `/member/:userId`. */
export const OrganisationProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const publicTab = parseOrganisationPublicDetailTabParam(searchParams.get(ORGANISATION_PUBLIC_TAB_QUERY));
  const onPublicTabChange = (tab: OrganisationPublicDetailTabId) => {
    const next = new URLSearchParams(searchParams);
    next.set(ORGANISATION_PUBLIC_TAB_QUERY, tab);
    setSearchParams(next, { replace: true });
  };

  const [tenant, setTenant] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isShop, setIsShop] = useState(false);

  const shellBack = detailBackPath('host');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchOrganisationProfileBySlug(id)
      .then((tenant) => {
        setTenant(tenant as TenantProfile);
        setIsShop(isShopTenant(tenant as TenantProfile));
      })
      .catch(() => {
        setTenant(null);
        setIsShop(false);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) return null;

  if (loading) {
    return (
      <EntityPublicDetailShell backTo={shellBack} backLabel="Explore" showMenu={false}>
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-emerald-600" />
        </div>
      </EntityPublicDetailShell>
    );
  }

  if (tenant && isShop) {
    return (
      <Navigate
        to={shopPublicPath({ merchantId: tenant.shopId, slug: tenant.slug })}
        replace
      />
    );
  }

  return (
    <EntityPublicDetailShell backTo={shellBack} backLabel="Explore" showMenu={false} maxWidthClass="max-w-5xl">
      <OrganisationPublicProfile
        slug={id}
        mode="public"
        compact={false}
        entityTabLayout
        publicDetailTab={publicTab}
        onPublicDetailTabChange={onPublicTabChange}
        backTo={shellBack}
        backLabel="Explore"
      />
    </EntityPublicDetailShell>
  );
};
