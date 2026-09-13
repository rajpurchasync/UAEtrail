import { ExternalLink } from 'lucide-react';

type FeaturedPick = {
  id: string;
  name: string;
  description?: string | null;
  images: string[];
  priceAed: number;
  discountPercent?: number | null;
  externalUrl?: string | null;
};

interface ShopFeaturedPicksSectionProps {
  products: FeaturedPick[];
  shopWebsiteUrl?: string | null;
  shopName: string;
}

const formatPrice = (priceAed: number, discountPercent?: number): string => {
  if (!discountPercent || discountPercent <= 0) return `From AED ${priceAed}`;
  const discounted = Math.round(priceAed * (1 - discountPercent / 100));
  return `From AED ${discounted}`;
};

/** Curated outbound picks — affiliate-style links, not in-app checkout. */
export const ShopFeaturedPicksSection = ({
  products,
  shopWebsiteUrl,
  shopName,
}: ShopFeaturedPicksSectionProps) => {
  if (products.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Featured picks</h2>
      <ul className="mt-4 space-y-3">
        {products.map((product) => {
          const href = product.externalUrl?.trim() || shopWebsiteUrl?.trim() || null;
          const content = (
            <>
              {product.images[0] ? (
                <img
                  src={product.images[0]}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-xl">
                  🛍️
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-gray-900">{product.name}</h3>
                {product.description && (
                  <p className="mt-1 text-sm leading-relaxed text-gray-600 line-clamp-3">
                    {product.description}
                  </p>
                )}
                <p className="mt-2 text-sm font-bold text-emerald-700">
                  {formatPrice(product.priceAed, product.discountPercent ?? undefined)}
                  {product.discountPercent && product.discountPercent > 0 ? (
                    <span className="ml-2 text-xs font-semibold text-rose-600">
                      {product.discountPercent}% off
                    </span>
                  ) : null}
                </p>
                {href && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    Shop on {shopName}
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </p>
                )}
              </div>
            </>
          );

          if (!href) {
            return (
              <li key={product.id} className="flex gap-3 rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm">
                {content}
              </li>
            );
          }

          return (
            <li key={product.id}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm transition hover:border-emerald-200"
              >
                {content}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
