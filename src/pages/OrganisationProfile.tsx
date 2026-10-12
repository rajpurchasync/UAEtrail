import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { OrganisationPublicProfile } from '../components/organisation-console/OrganisationPublicProfile';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import type { TenantProfile } from '../api/types';
import { fetchOrganisationProfileBySlug } from '../hooks/organisationConsoleApi';
import { shopPublicPath } from '../utils/shopPaths';
import { detailBackPath } from '../config/routingCatalog';

const isShopTenant = (tenant: TenantProfile): boolean =>
  tenant.businessMode === 'SHOP' || tenant.type === 'shop' || tenant.type === 'SHOP';

/** Public brand profile — `/guide`, `/agency`, or `/partner`. Shop tenants redirect to `/shop/:id`. */
export const OrganisationProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isShop, setIsShop] = useState(false);

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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-emerald-600" />
      </div>
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
    <ConsumerShell
      layout="stack"
      title="Host profile"
      showJourney={false}
      back={{ fallbackTo: detailBackPath('host'), label: 'Explore' }}
    >
      <OrganisationPublicProfile slug={id} mode="public" backTo={detailBackPath('host')} backLabel="Back to map" />
    </ConsumerShell>
  );
};
