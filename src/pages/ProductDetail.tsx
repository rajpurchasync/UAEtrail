import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, ShoppingBag, Loader2 } from 'lucide-react';
import { ProductDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { SHOP_V1 } from '../config/platform';
import { PageMeta } from '../components/seo/PageMeta';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<
    (ProductDTO & { merchant: { id: string; shopName: string; description?: string; logo?: string } }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .getShopProductDetail(id)
      .then((res) => setProduct(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Product not found'))
      .finally(() => setLoading(false));
    api.getCheckoutConfig().then((res) => setStripeEnabled(res.data.stripeEnabled)).catch(() => {});
  }, [id]);

  const handleStripeCheckout = async () => {
    if (!id || !product) return;
    if (!user) {
      navigate('/signin', { state: { from: `/product/${id}` } });
      return;
    }
    setCheckingOut(true);
    setError(null);
    try {
      const res = await api.createCheckoutSession(id);
      if (res.data.url) {
        window.location.href = res.data.url;
      } else {
        setError('Checkout session could not be started.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div>
          <p className="text-gray-600 mb-3">{error ?? 'Product not found'}</p>
          <Link to="/shop" className="text-emerald-600 font-medium">Back to shop</Link>
        </div>
      </div>
    );
  }

  const memberPrice = product.discountPercent
    ? Math.round(product.priceAed * (1 - product.discountPercent / 100))
    : Math.round(product.priceAed * (1 - SHOP_V1.memberDiscountPercent / 100));

  const canStripeCheckout = stripeEnabled && !product.externalUrl;

  return (
    <div className="min-h-screen bg-gray-50 pb-nav-safe md:pb-8">
      <PageMeta
        title={product.name}
        description={product.description?.slice(0, 160) ?? `Shop ${product.name} on UAE Trail`}
        path={`/product/${product.id}`}
      />
      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-8">
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
          <p className="text-sm text-emerald-600 font-medium mb-1">{product.category}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h1>
          <Link to={`/merchant/${product.merchantId}`} className="text-sm text-gray-500 hover:text-emerald-700 mt-1 inline-block">
            by {product.merchantName}
          </Link>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">AED {product.priceAed}</span>
            {product.discountPercent && (
              <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                {product.discountPercent}% off
              </span>
            )}
          </div>

          {SHOP_V1.showMemberBadge && (
            <p className="mt-2 text-sm text-amber-800 bg-amber-50 inline-flex px-3 py-1.5 rounded-lg">
              Members from AED {memberPrice}
            </p>
          )}

          {product.description && <p className="mt-5 text-gray-600 leading-relaxed">{product.description}</p>}
          {product.packagingInfo && (
            <p className="mt-3 text-sm text-gray-500">{product.packagingInfo}</p>
          )}

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          {product.externalUrl ? (
            <a
              href={product.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              Buy from partner
            </a>
          ) : canStripeCheckout ? (
            <button
              type="button"
              onClick={() => void handleStripeCheckout()}
              disabled={checkingOut}
              className="mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              {checkingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingBag className="w-5 h-5" />}
              {checkingOut ? 'Starting checkout…' : 'Buy now'}
            </button>
          ) : (
            <Link
              to="/membership"
              className="mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              Get member deal
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
