import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { HostPublicProfile } from '../components/host/HostPublicProfile';
import { ShopPublicDetail } from '../components/shop/ShopPublicDetail';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { api, TenantProfile } from '../api/services';

const isShopTenant = (tenant: TenantProfile): boolean =>
  tenant.businessMode === 'SHOP' || tenant.type === 'shop' || tenant.type === 'SHOP';

/** Public operator page — host/agency profile, or gear-shop detail when tenant is a shop. */
export const OperatorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isShop, setIsShop] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .getTenantProfile(id)
      .then((res) => {
        setTenant(res.data);
        setIsShop(isShopTenant(res.data));
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
    return <ShopPublicDetail tenant={tenant} />;
  }

  return (
    <ConsumerShell
      layout="stack"
      title="Host profile"
      showJourney={false}
      back={{ fallbackTo: '/explore?panel=shops&list=1&filter=shops', label: 'Explore' }}
    >
      <HostPublicProfile slug={id} mode="public" backTo="/explore?list=1" backLabel="Back to map" />
    </ConsumerShell>
  );
};
