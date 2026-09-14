import { ExternalLink, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageMeta } from '../seo/PageMeta';
import { MobileDetailShell } from '../mobile/MobileDetailShell';
import { ShopContactSection } from './ShopContactSection';
import { ShopFeaturedPicksSection } from './ShopFeaturedPicksSection';
import { ShareButton } from '../ui/ShareButton';
import { explorePath } from '../../utils/exploreRouting';
import { shopPublicPath } from '../../utils/shopPaths';

export type ShopFeaturedPick = {
  id: string;
  name: string;
  description?: string | null;
  images: string[];
  priceAed: number;
  discountPercent?: number | null;
  externalUrl?: string | null;
};

export type ShopPublicView = {
  id: string;
  shopName: string;
  description?: string | null;
  logo?: string | null;
  websiteUrl?: string | null;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactPersonName?: string | null;
  contactPersonAvatar?: string | null;
  contactPersonUserId?: string | null;
  products: ShopFeaturedPick[];
  presence: 'physical' | 'online';
};

interface ShopPublicPageProps {
  shop: ShopPublicView;
}

/** Unified public gear-shop page — intro, contact, and outbound featured picks. */
export const ShopPublicPage = ({ shop }: ShopPublicPageProps) => {
  const publicPath = shopPublicPath({ merchantId: shop.id });
  const mapBack = explorePath({ panel: 'shops', filter: 'shops' });
  const website = shop.websiteUrl?.trim() || null;

  return (
    <MobileDetailShell
      backTo={mapBack}
      backLabel="Explore"
      showMenu={false}
      headerAction={
        <ShareButton
          title={shop.shopName}
          text={shop.description?.slice(0, 120) ?? `${shop.shopName} on UAE Trail`}
          path={publicPath}
          iconOnly
          light
        />
      }
    >
      <PageMeta
        title={shop.shopName}
        description={shop.description?.slice(0, 160) ?? `${shop.shopName} on UAE Trail`}
        path={publicPath}
        image={shop.logo ?? undefined}
        imageAlt={shop.shopName}
      />

      <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
        <section className="flex items-start gap-4">
          {shop.logo ? (
            <img src={shop.logo} alt="" className="h-16 w-16 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl">
              🛍️
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-snug text-gray-900">{shop.shopName}</h1>
            {shop.region && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                {shop.presence === 'online' ? `${shop.region} · Online` : shop.region}
              </p>
            )}
            {shop.presence === 'online' && !shop.region && (
              <p className="mt-1 text-sm text-gray-500">Online partner · ships to UAE</p>
            )}
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
              {shop.presence === 'online' ? 'Online gear partner' : 'Gear shop'}
            </p>
          </div>
          <ShareButton
            title={shop.shopName}
            text={shop.description?.slice(0, 120) ?? `${shop.shopName} on UAE Trail`}
            path={publicPath}
            className="hidden shrink-0 md:block"
          />
        </section>

        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Visit shop website
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        )}

        {shop.description && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">About</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-700">{shop.description}</p>
          </section>
        )}

        <ShopFeaturedPicksSection
          products={shop.products}
          shopWebsiteUrl={website}
          shopName={shop.shopName}
        />

        {shop.products.length === 0 && !website && (
          <p className="mt-8 text-sm text-neutral-500">
            This shop has not added featured picks or a website link yet.
          </p>
        )}

        <ShopContactSection
          shop={{
            region: shop.region ?? undefined,
            latitude: shop.latitude ?? null,
            longitude: shop.longitude ?? null,
            contactEmail: shop.contactEmail ?? undefined,
            contactPhone: shop.contactPhone ?? undefined,
            contactPersonName: shop.contactPersonName ?? undefined,
            contactPersonAvatar: shop.contactPersonAvatar ?? undefined,
            contactPersonUserId: shop.contactPersonUserId ?? undefined,
          }}
        />

        <Link
          to={mapBack}
          className="mt-6 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
        >
          Back to explore
        </Link>
      </div>
    </MobileDetailShell>
  );
};
