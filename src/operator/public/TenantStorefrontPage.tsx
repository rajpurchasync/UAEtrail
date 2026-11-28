import { useEffect, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { TenantStorefrontDetail } from './TenantStorefrontDetail';
import { EntityPublicDetailShell } from '../../components/entity-public/EntityPublicDetailShell';
import type { TenantPublicDTO } from '@uaetrail/shared-types';
import { fetchOperatorPublicProfileBySlug } from '../../hooks/operatorDeskClientApi';
import { shopPublicPath } from '../../utils/shopPaths';
import { detailBackPath } from '../../config/routingCatalog';
import { AsyncLoadingState } from '../../components/ui/AsyncLoadingState';
import {
  TENANT_STOREFRONT_TAB_QUERY,
  parseTenantStorefrontDetailTabParam,
  type TenantStorefrontDetailTabId,
} from './tenantStorefrontDetailTab';

const isShopTenant = (tenant: TenantPublicDTO): boolean =>
  tenant.businessMode === 'SHOP' || tenant.type === 'shop' || tenant.type === 'SHOP';

/** Public brand profile — `/agency` or `/partner`. Shop tenants redirect to `/shop/:id`. Individual Pro is `/member/:userId`. */
export const TenantStorefrontPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const publicTab = parseTenantStorefrontDetailTabParam(searchParams.get(TENANT_STOREFRONT_TAB_QUERY));
  const onPublicTabChange = (tab: TenantStorefrontDetailTabId) => {
    const next = new URLSearchParams(searchParams);
    next.set(TENANT_STOREFRONT_TAB_QUERY, tab);
    setSearchParams(next, { replace: true });
  };

  const [tenant, setTenant] = useState<TenantPublicDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isShop, setIsShop] = useState(false);

  const shellBack = detailBackPath('host');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchOperatorPublicProfileBySlug(id)
      .then((tenant) => {
        setTenant(tenant as TenantPublicDTO);
        setIsShop(isShopTenant(tenant as TenantPublicDTO));
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
        <AsyncLoadingState variant="centered" className="py-16" label="Loading profile" />
      </EntityPublicDetailShell>
    );
  }

  if (tenant && isShop) {
    return (
      <Navigate
        to={shopPublicPath({ shopId: tenant.shopId, slug: tenant.slug })}
        replace
      />
    );
  }

  return (
    <EntityPublicDetailShell backTo={shellBack} backLabel="Explore" showMenu={false} maxWidthClass="max-w-5xl">
      <TenantStorefrontDetail
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