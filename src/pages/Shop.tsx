import { useEffect, useState, useMemo } from 'react';
import { ProductDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';

export const Shop = () => {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getShopProducts({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: search || undefined
      });
      setProducts(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [categoryFilter, search]);

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return Array.from(cats).sort();
  }, [products]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div
        className="relative h-48 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1600)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 via-emerald-800/70 to-teal-900/80" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="text-white max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Hiking & Camping Gear</h1>
            <p className="text-lg md:text-xl mb-6">Essential equipment for your outdoor adventures</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Premium Banner */}
        <div className="bg-emerald-600 text-white rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Premium Members Get 15% Off</h3>
              <p>Upgrade to premium membership and save on all gear purchases</p>
            </div>
            <a href="/membership" className="bg-white text-emerald-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium">
              Learn More
            </a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="md:w-64">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20 space-y-6">
              {/* Search */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Search</h3>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search products..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </form>
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Category</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${categoryFilter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    All Products
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors capitalize ${categoryFilter === cat ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">{products.length} products found</p>
              {search && (
                <button onClick={() => { setSearch(''); setSearchInput(''); }} className="text-sm text-emerald-600 hover:text-emerald-700">
                  Clear search
                </button>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-5 bg-gray-200 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🏕️</div>
                <p className="text-gray-600 text-lg mb-2">No products found</p>
                <p className="text-gray-500 text-sm">Try adjusting your filters or search</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                    {/* Product Image */}
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      )}
                      {product.discountPercent && product.discountPercent > 0 && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          -{product.discountPercent}%
                        </span>
                      )}
                      <span className="absolute top-2 left-2 bg-white/90 text-gray-700 text-xs font-medium px-2 py-1 rounded capitalize">
                        {product.category}
                      </span>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {product.discountPercent && product.discountPercent > 0 ? (
                            <>
                              <span className="text-lg font-bold text-emerald-600">
                                AED {(product.priceAed * (1 - product.discountPercent / 100)).toFixed(0)}
                              </span>
                              <span className="text-sm text-gray-400 line-through">AED {product.priceAed}</span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-emerald-600">AED {product.priceAed}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">by {product.merchantName}</p>
                      {product.packagingInfo && (
                        <p className="text-xs text-gray-400 mt-1">{product.packagingInfo}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
