import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import type { MerchantPublicDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { PageMeta } from '../components/seo/PageMeta';
import { MobileDetailShell } from '../components/mobile/MobileDetailShell';
import { ShopContactSection } from '../components/shop/ShopContactSection';
import { ShopProductCatalogSection } from '../components/shop/ShopProductCatalogSection';
import { ShareButton, FavoriteButton } from '../components/ui';
import { explorePath } from '../utils/exploreRouting';

export const MerchantPublic = () => {
  const { id } = useParams<{ id: string }>();
  const [merchant, setMerchant] = useState<MerchantPublicDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const mapBack = explorePath({ panel: 'shops', list: true, filter: 'shops' });

  useEffect(() => {
    if (!id) return;
    api
      .getMerchantPublic(id)
      .then((res) => setMerchant(res.data))
      .catch(() => setMerchant(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <PageMeta title="Loading shop" path={id ? `/merchant/${id}` : undefined} />
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-emerald-600" />
        </div>
      </>
    );
  }

  if (!merchant) {
    return (
      <>
        <PageMeta title="Shop not found" noIndex path={id ? `/merchant/${id}` : undefined} />
        <div className="flex min-h-screen items-center justify-center">
          <Link to={mapBack} className="font-medium text-emerald-600">
            Back to map
          </Link>
        </div>
      </>
    );
  }

  return (
    <MobileDetailShell
      backTo={mapBack}
      backLabel="Explore"
      showMenu={false}
      headerAction={
        <div className="flex items-center gap-1.5">
          <FavoriteButton merchantId={id} compact />
          <ShareButton
            title={merchant.shopName}
            text={merchant.description?.slice(0, 120) ?? `${merchant.shopName} on UAE Trail`}
            path={`/merchant/${id}`}
            iconOnly
            light
          />
        </div>
      }
    >
      <PageMeta
        title={merchant.shopName}
        description={merchant.description?.slice(0, 160) ?? `${merchant.shopName} on UAE Trail`}
        path={`/merchant/${id}`}
        image={merchant.logo}
        imageAlt={merchant.shopName}
      />

      <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
        <section className="flex items-start gap-4">
          {merchant.logo ? (
            <img src={merchant.logo} alt="" className="h-16 w-16 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-xl">
              🛍️
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-snug text-gray-900">{merchant.shopName}</h1>
            {merchant.region && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                {merchant.region}
              </p>
            )}
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-700">Gear shop</p>
          </div>
          <ShareButton
            title={merchant.shopName}
            text={merchant.description?.slice(0, 120) ?? `${merchant.shopName} on UAE Trail`}
            path={`/merchant/${id}`}
            className="hidden md:block shrink-0"
          />
        </section>

        {merchant.description && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">About</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-700">{merchant.description}</p>
          </section>
        )}

        <ShopContactSection merchant={merchant} />

        <ShopProductCatalogSection products={merchant.products} />

        {merchant.products.length === 0 && (
          <p className="mt-8 text-sm text-neutral-500">
            This shop has not listed any gear items yet.
          </p>
        )}

        <Link
          to={mapBack}
          className="mt-6 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
        >
          Back to map
        </Link>
      </div>
    </MobileDetailShell>
  );
};
