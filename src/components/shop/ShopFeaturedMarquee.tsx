import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { ProductDTO } from '@uaetrail/shared-types';

interface ShopFeaturedMarqueeProps {
  products: ProductDTO[];
}

const FeaturedCard = ({ product }: { product: ProductDTO }) => (
  <Link
    to={`/product/${product.id}`}
    className="shop-marquee-card group flex items-center gap-3 shrink-0 w-[220px] sm:w-[260px] bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
  >
    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 shrink-0 overflow-hidden">
      {product.images?.[0] ? (
        <img src={product.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">—</div>
      )}
    </div>
    <div className="min-w-0 pr-3 py-2">
      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Featured</p>
      <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">{product.name}</p>
      <p className="text-sm font-bold text-emerald-600 mt-0.5">AED {product.priceAed}</p>
    </div>
  </Link>
);

export const ShopFeaturedMarquee = ({ products }: ShopFeaturedMarqueeProps) => {
  if (products.length === 0) return null;

  const loop = [...products, ...products];

  return (
    <section className="mb-6 md:mb-8" aria-label="Featured products">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Featured</h2>
      </div>
      <div className="shop-marquee-mask relative overflow-hidden rounded-xl">
        <div className="shop-marquee-track flex gap-3 py-1">
          {loop.map((product, i) => (
            <FeaturedCard key={`${product.id}-${i}`} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};
