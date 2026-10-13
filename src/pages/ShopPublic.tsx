import { useEffect, useState } from 'react';
import { useSafeAsyncEffect } from '../hooks/useSafeAsyncEffect';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { exploreMapPeekPath } from '@uaetrail/shared-types';
import type { TenantProfile } from '../api/types';
import { fetchOrganisationProfileBySlug } from '../hooks/organisationConsoleApi';
import { fetchPublicPlaceDetail } from '../hooks/placeDetailClientApi';
import { fetchShopPublic } from '../hooks/shopPublicClientApi';
import { PageMeta } from '../components/seo/PageMeta';
import { ShopPublicPage, type ShopPublicView } from '../components/shop/ShopPublicPage';
import { explorePath } from '../config/routingCatalog';
import { shopPublicPath } from '../utils/shopPaths';
import { communityShopPlaceToView } from '../utils/communityShopPlace';

const resolvePresence = (latitude?: number | null, longitude?: number | null): ShopPublicView['presence'] =>
  latitude != null && longitude != null ? 'physical' : 'online';

const tenantToShopView = (tenant: TenantProfile): ShopPublicView => ({
  id: tenant.shopId ?? tenant.merchantId ?? tenant.slug,
  reviewTargetId: tenant.id,
  shopName: tenant.name,
  description: tenant.description ?? tenant.ownerBio ?? null,
  logo: null,
  websiteUrl: tenant.website ?? null,
  region: tenant.region ?? null,
  latitude: tenant.latitude ?? null,
  longitude: tenant.longitude ?? null,
  contactPersonName: tenant.ownerName ?? null,
  contactPersonUserId: tenant.ownerId ?? null,
  products: (tenant.shopProducts ?? []).map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    images: product.images,
    priceAed: product.priceAed,
    discountPercent: product.discountPercent,
    externalUrl: null,
  })),
  presence: resolvePresence(tenant.latitude, tenant.longitude),
});

/** Public gear shop — resolves merchant id or tenant slug to one page. */
export const ShopPublic = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<ShopPublicView | null>(null);
  const [loading, setLoading] = useState(true);
  const [communityPeekOnly, setCommunityPeekOnly] = useState(false);
  const mapBack = explorePath({ panel: 'shops', filter: 'shops' });

  useSafeAsyncEffect(
    async (isActive) => {
      if (!id) return;
      if (isActive()) {
        setLoading(true);
        setCommunityPeekOnly(false);
      }

      const applyShop = (next: ShopPublicView | null, peekOnly = false) => {
        if (!isActive()) return;
        setCommunityPeekOnly(peekOnly);
        setShop(next);
      };

      try {
        const merchant = await fetchShopPublic(id);
        if (!isActive()) return;
        applyShop({
          id: merchant.id,
          reviewTargetId: merchant.tenantId ?? null,
          shopName: merchant.shopName,
          description: merchant.description ?? null,
          logo: merchant.logo ?? null,
          websiteUrl: merchant.websiteUrl ?? null,
          region: merchant.region ?? null,
          latitude: merchant.latitude ?? null,
          longitude: merchant.longitude ?? null,
          contactEmail: merchant.contactEmail ?? null,
          contactPhone: merchant.contactPhone ?? null,
          contactPersonName: merchant.contactPersonName ?? null,
          contactPersonAvatar: merchant.contactPersonAvatar ?? null,
          contactPersonUserId: merchant.contactPersonUserId ?? null,
          products: merchant.products.map((product) => ({
            id: product.id,
            name: product.name,
            description: product.description ?? null,
            images: product.images,
            priceAed: product.priceAed,
            discountPercent: product.discountPercent ?? null,
            externalUrl: product.externalUrl ?? null,
          })),
          presence: resolvePresence(merchant.latitude, merchant.longitude),
        });
      } catch {
        try {
          const tenant = await fetchOrganisationProfileBySlug(id);
          if (!isActive()) return;
          applyShop(tenantToShopView(tenant as TenantProfile));
        } catch {
          try {
            const place = await fetchPublicPlaceDetail(id);
            if (!isActive()) return;
            const view = communityShopPlaceToView(place);
            if (view) {
              applyShop(view, true);
            } else {
              applyShop(null);
            }
          } catch {
            applyShop(null);
          }
        }
      } finally {
        if (isActive()) {
          setLoading(false);
        }
      }
    },
    [id]
  );

  useEffect(() => {
    if (!communityPeekOnly || !id) return;
    navigate(exploreMapPeekPath(`venue:${id}`, 'shops'), { replace: true });
  }, [communityPeekOnly, id, navigate]);

  if (loading || communityPeekOnly) {
    return (
      <>
        <PageMeta title="Loading shop" path={id ? shopPublicPath({ id }) : undefined} />
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-emerald-600" />
        </div>
      </>
    );
  }

  if (!shop) {
    return (
      <>
        <PageMeta title="Shop not found" noIndex path={id ? shopPublicPath({ id }) : undefined} />
        <div className="flex min-h-screen items-center justify-center">
          <Link to={mapBack} className="font-medium text-emerald-600">
            Back to explore
          </Link>
        </div>
      </>
    );
  }

  return <ShopPublicPage shop={shop} />;
};
