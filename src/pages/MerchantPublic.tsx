import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MerchantProfileDTO, ProductDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';

export const MerchantPublic = () => {
  const { id } = useParams<{ id: string }>();
  const [merchant, setMerchant] = useState<(MerchantProfileDTO & { products: ProductDTO[] }) | null>(null);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link to="/shop" className="text-emerald-600 font-medium">Back to shop</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-nav-safe md:pb-8">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-8 flex items-center gap-4">
          {merchant.logo ? (
            <img src={merchant.logo} alt="" className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl">
              {merchant.shopName.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{merchant.shopName}</h1>
            {merchant.description && <p className="text-gray-600 mt-1">{merchant.description}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {merchant.products.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full aspect-square object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                <p className="text-emerald-700 font-bold mt-1">AED {product.priceAed}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
