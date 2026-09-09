import { ExternalLink, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TenantProfile } from '../../api/services';
import { PageMeta } from '../seo/PageMeta';
import { MobileDetailShell } from '../mobile/MobileDetailShell';
import { ShopProductCatalogSection } from './ShopProductCatalogSection';
import { ShareButton } from '../ui/ShareButton';
import { FavoriteButton } from '../ui/FavoriteButton';
import { HostMessageButton } from '../ui/HostMessageButton';
import { explorePath } from '../../utils/exploreRouting';
import { buildGoogleMapsSearchUrl } from '../../utils/mapLinks';

interface ShopPublicDetailProps {
  tenant: TenantProfile;
}

/** Public gear-shop profile — map discovery first; shows catalogue when merchant inventory exists. */
export const ShopPublicDetail = ({ tenant }: ShopPublicDetailProps) => {
  const website = tenant.website?.trim() || null;
  const hasCoords = tenant.latitude != null && tenant.longitude != null;
  const mapBack = explorePath({ panel: 'shops', list: true, filter: 'shops' });
  const products = tenant.shopProducts ?? [];

  return (
    <MobileDetailShell
      backTo={mapBack}
      backLabel="Explore"
      showMenu={false}
      headerAction={
        <div className="flex items-center gap-1.5">
          <FavoriteButton tenantId={tenant.id} compact />
          <ShareButton
            title={tenant.name}
            text={tenant.description?.slice(0, 120) ?? `${tenant.name} on UAE Trail`}
            path={`/operator/${tenant.slug}`}
            iconOnly
            light
          />
        </div>
      }
    >
      <PageMeta
        title={tenant.name}
        description={tenant.description?.slice(0, 160) ?? `${tenant.name} — gear shop on UAE Trail`}
        path={`/operator/${tenant.slug}`}
      />

      <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
        <section className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
            🛍️
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-snug text-gray-900">{tenant.name}</h1>
            {tenant.region && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                {tenant.region}
              </p>
            )}
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-700">Gear shop</p>
          </div>
        </section>

        {(tenant.description || tenant.ownerBio) && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">About</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-700">
              {tenant.description || tenant.ownerBio}
            </p>
          </section>
        )}

        <ShopProductCatalogSection products={products} />

        {products.length === 0 && (
          <p className="mt-8 text-sm text-neutral-500">This shop has not listed any gear items yet.</p>
        )}

        <section className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Contact</h2>
          <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-neutral-900">{tenant.ownerName}</span>
              <span className="text-xs text-neutral-500">Shop contact</span>
            </div>
            <HostMessageButton hostUserId={tenant.ownerId} className="w-full" />
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
              >
                Visit website
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            {hasCoords && (
              <a
                href={buildGoogleMapsSearchUrl(tenant.latitude!, tenant.longitude!)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-800"
              >
                <MapPin className="h-4 w-4 text-emerald-600" />
                Open in Maps
              </a>
            )}
          </div>
        </section>

        {tenant.merchantId && (
          <Link
            to={`/merchant/${tenant.merchantId}`}
            className="mt-6 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            View merchant profile
          </Link>
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
