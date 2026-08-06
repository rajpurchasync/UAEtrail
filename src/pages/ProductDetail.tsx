import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ProductDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { SHOP_V1 } from '../config/platform';
import { PageMeta } from '../components/seo/PageMeta';
import { JsonLd } from '../components/seo/JsonLd';
import { productSchema } from '../components/seo/schemas';
import { MobileDetailShell } from '../components/mobile/MobileDetailShell';
import { ProductPurchaseActions } from '../components/shop/ProductPurchaseActions';
import { ShopCartButton } from '../components/shop/ShopCartButton';
import { ShopCartSheet } from '../components/shop/ShopCartSheet';
import { FavoriteButton } from '../components/ui/FavoriteButton';

export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [product, setProduct] = useState<
    (ProductDTO & { merchant: { id: string; shopName: string; description?: string; logo?: string } }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .getShopProductDetail(id)
      .then((res) => setProduct(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (searchParams.get('checkout') === 'cancelled') {
      setCheckoutNotice('Checkout was cancelled.');
      const next = new URLSearchParams(searchParams);
      next.delete('checkout');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (loading) {
    return (
      <>
        <PageMeta title="Loading product" path={id ? `/product/${id}` : undefined} />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" />
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <PageMeta title="Product not found" noIndex path={id ? `/product/${id}` : undefined} />
        <div className="min-h-screen flex items-center justify-center p-4 text-center">
          <div>
            <p className="text-gray-600 mb-3">{error ?? 'Product not found'}</p>
            <Link to="/shop" className="text-emerald-600 font-medium">
              Back to shop
            </Link>
          </div>
        </div>
      </>
    );
  }

  const memberPrice = product.discountPercent
    ? Math.round(product.priceAed * (1 - product.discountPercent / 100))
    : Math.round(product.priceAed * (1 - SHOP_V1.memberDiscountPercent / 100));

  return (
    <MobileDetailShell
      backTo="/shop"
      backLabel="Shop"
      headerAction={<ShopCartButton onClick={() => setCartOpen(true)} />}
    >
      <PageMeta
        title={product.name}
        description={product.description?.slice(0, 160) ?? `Shop ${product.name} on UAE Trail`}
        path={`/product/${product.id}`}
        image={product.images[0]}
        imageAlt={product.name}
      />
      <JsonLd data={productSchema(product)} id={`product-${product.id}`} />
      <div className="min-h-screen bg-gray-50 pb-nav-safe md:pb-8">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="hidden md:flex justify-end mb-4">
            <ShopCartButton onClick={() => setCartOpen(true)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <img
              src={product.images[0] ?? 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'}
              alt={product.name}
              className="w-full rounded-2xl aspect-square object-cover border border-gray-100"
            />
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1, 5).map((img, i) => (
                  <img key={i} src={img} alt="" className="rounded-lg aspect-square object-cover" />
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-emerald-600 font-medium mb-1 capitalize">{product.category}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h1>
            <Link
              to={`/merchant/${product.merchantId}`}
              className="text-sm text-gray-500 hover:text-emerald-700 mt-1 inline-block"
            >
              by {product.merchantName}
            </Link>

            <div className="mt-3">
              <FavoriteButton productId={product.id} />
            </div>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">AED {product.priceAed}</span>
              {product.discountPercent ? (
                <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                  {product.discountPercent}% off
                </span>
              ) : null}
            </div>

            {SHOP_V1.showMemberBadge && (
              <p className="mt-2 text-sm text-amber-800 bg-amber-50 inline-flex px-3 py-1.5 rounded-lg">
                Members from AED {memberPrice}
              </p>
            )}

            {product.description && <p className="mt-5 text-gray-600 leading-relaxed">{product.description}</p>}
            {product.packagingInfo && <p className="mt-3 text-sm text-gray-500">{product.packagingInfo}</p>}

            {checkoutNotice && (
              <p className="mt-4 text-sm text-amber-800 bg-amber-50 rounded-xl px-3 py-2">{checkoutNotice}</p>
            )}

            <ProductPurchaseActions
              product={product}
              layout="detail"
              onPayNow={() => setCartOpen(true)}
            />
          </div>
          </div>
        </div>
      </div>
      <ShopCartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </MobileDetailShell>
  );
};
