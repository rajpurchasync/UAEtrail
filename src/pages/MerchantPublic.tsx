import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import type { MerchantPublicDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { PageMeta } from '../components/seo/PageMeta';
import { MobileDetailShell } from '../components/mobile/MobileDetailShell';
import { SecureAvatar } from '../components/ui/SecureAvatar';
import { EnvironmentImage } from '../components/ui/EnvironmentImage';

export const MerchantPublic = () => {
  const { id } = useParams<{ id: string }>();
  const [merchant, setMerchant] = useState<MerchantPublicDTO | null>(null);
  const [loading, setLoading] = useState(true);

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
          <Link to="/" className="font-medium text-emerald-600">
            Back to explore
          </Link>
        </div>
      </>
    );
  }

  return (
    <MobileDetailShell backTo="/" backLabel="Explore">
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
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-xl font-bold text-emerald-700">
              {merchant.shopName.charAt(0)}
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
          </div>
        </section>

        {merchant.description && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">About</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-700">{merchant.description}</p>
          </section>
        )}

        {(merchant.contactPhone || merchant.contactEmail || merchant.contactPersonName) && (
          <section className="mt-8 rounded-2xl border border-neutral-100 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Contact</h2>
            <div className="mt-4 space-y-4">
              {merchant.contactPersonName && (
                <div className="flex items-center gap-3">
                  <SecureAvatar
                    src={merchant.contactPersonAvatar}
                    name={merchant.contactPersonName}
                    className="h-10 w-10 text-sm"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{merchant.contactPersonName}</p>
                    <p className="text-xs text-gray-500">Shop contact</p>
                  </div>
                </div>
              )}
              {merchant.contactPhone && (
                <p className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                  <a href={`tel:${merchant.contactPhone}`} className="font-medium text-emerald-700">
                    {merchant.contactPhone}
                  </a>
                </p>
              )}
              {merchant.contactEmail && (
                <p className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                  <a href={`mailto:${merchant.contactEmail}`} className="font-medium text-emerald-700">
                    {merchant.contactEmail}
                  </a>
                </p>
              )}
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Products &amp; services
          </h2>
          {merchant.products.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">No listings published yet.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {merchant.products.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="overflow-hidden rounded-2xl border border-neutral-100 bg-white transition-shadow hover:shadow-md"
                >
                  {product.images[0] && (
                    <EnvironmentImage
                      src={product.images[0]}
                      alt={product.name}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="line-clamp-2 font-semibold leading-snug text-gray-900">{product.name}</h3>
                    {product.description && (
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500">
                        {product.description}
                      </p>
                    )}
                    <p className="mt-2 font-bold text-emerald-700">AED {product.priceAed}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </MobileDetailShell>
  );
};
