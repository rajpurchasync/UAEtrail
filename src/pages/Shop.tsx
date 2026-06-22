import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronDown, ChevronRight, X, CheckCircle2 } from 'lucide-react';
import { ProductDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { FEATURE_FLAGS } from '../config/platform';
import { PageMeta } from '../components/seo/PageMeta';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { FilterChips } from '../components/mobile/FilterChips';
import { FilterIconButton } from '../components/mobile/FilterIconButton';
import { PAGE_BANNERS } from '../config/pageBanners';
import { ShopFeaturedMarquee } from '../components/shop/ShopFeaturedMarquee';
import { ProductPurchaseActions } from '../components/shop/ProductPurchaseActions';
import { ShopCartButton } from '../components/shop/ShopCartButton';
import { ShopCartSheet } from '../components/shop/ShopCartSheet';
import { useShopCart } from '../context/ShopCartContext';

const SHOP_CHIP_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'apparel', label: 'Apparel' },
  { key: 'camping accessories', label: 'Camping' },
  { key: 'hiking gears', label: 'Hiking' },
];

const SHOP_CATEGORIES = [
  {
    name: 'Apparel',
    subcategories: ['T-Shirts', 'Jackets', 'Pants', 'Hats'],
  },
  {
    name: 'Camping Accessories',
    subcategories: ['Tents', 'Sleeping Bags', 'Cooking Gear', 'Lanterns'],
  },
  {
    name: 'Hiking Gears',
    subcategories: ['Backpacks', 'Boots', 'Trekking Poles', 'Water Bottles'],
  },
];

export const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { clearCart } = useShopCart();
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);

  useEffect(() => {
    const status = searchParams.get('checkout');
    if (status === 'success') {
      setCheckoutNotice('Payment received — thank you for your order!');
      clearCart();
      const next = new URLSearchParams(searchParams);
      next.delete('checkout');
      next.delete('order');
      setSearchParams(next, { replace: true });
    } else if (status === 'cancelled') {
      setCheckoutNotice('Checkout was cancelled. Your cart is unchanged.');
      const next = new URLSearchParams(searchParams);
      next.delete('checkout');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, clearCart]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getShopProducts({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: search || undefined,
      });
      setProducts(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api
      .getShopProducts({ pageSize: 20 })
      .then((res) => {
        const all = res.data ?? [];
        const discounted = all.filter((p) => p.discountPercent && p.discountPercent > 0);
        setFeaturedProducts((discounted.length >= 3 ? discounted : all).slice(0, 10));
      })
      .catch(() => setFeaturedProducts([]));
  }, []);

  useEffect(() => {
    loadProducts();
  }, [categoryFilter, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const selectCategory = (cat: string) => {
    setCategoryFilter(cat);
    setShowFilters(false);
  };

  return (
    <>
      <PageMeta
        title="Outdoor gear shop"
        description="Hiking and camping equipment for UAE adventures — apparel, tents, backpacks, and more."
        path="/shop"
      />
      <ConsumerShell
        layout="tab"
        title="Shop"
        banner={{ src: PAGE_BANNERS.shop, alt: 'Camping tent under the stars' }}
        action={<ShopCartButton onClick={() => setCartOpen(true)} />}
        toolbar={
          <div className="md:hidden space-y-3">
            <div className="flex items-center gap-2">
              <form onSubmit={handleSearch} className="flex-1 relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search products..."
                  className="glass-search pl-4"
                />
              </form>
              <FilterIconButton onClick={() => setShowFilters(true)} aria-label="Filters">
                <SlidersHorizontal className="w-4 h-4" />
              </FilterIconButton>
            </div>
            <FilterChips options={SHOP_CHIP_CATEGORIES} value={categoryFilter} onChange={selectCategory} />
          </div>
        }
      >
        {checkoutNotice && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-800">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="flex-1">{checkoutNotice}</p>
            <button type="button" onClick={() => setCheckoutNotice(null)} className="text-emerald-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <ShopFeaturedMarquee products={featuredProducts} />

        <div className="max-w-7xl mx-auto md:px-0">
          {FEATURE_FLAGS.membershipEnabled && (
            <div className="bg-emerald-600 text-white rounded-lg p-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold mb-2">Premium Members Get 15% Off</h3>
                  <p className="text-sm text-emerald-100">Upgrade to premium membership and save on all gear purchases</p>
                </div>
                <a
                  href="/membership"
                  className="bg-white text-emerald-600 px-6 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-center"
                >
                  Learn More
                </a>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-8">
            {showFilters && (
              <div
                className="md:hidden fixed inset-0 z-50 bg-black/40"
                onClick={() => setShowFilters(false)}
                role="presentation"
              >
                <div
                  className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto bg-white rounded-t-[20px] p-4 pb-nav-safe shadow-ios"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-neutral-900">Filter by Category</h3>
                    <button
                      type="button"
                      onClick={() => setShowFilters(false)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-400"
                      aria-label="Close filters"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectCategory('all')}
                    className={`block w-full text-left px-3 py-3 rounded-ios text-[17px] ${categoryFilter === 'all' ? 'bg-emerald-600 text-white' : 'text-neutral-700 active:bg-neutral-100'}`}
                  >
                    All Products
                  </button>
                  {SHOP_CATEGORIES.map((cat) => (
                    <div key={cat.name} className="mt-1">
                      <button
                        type="button"
                        onClick={() => setExpandedCat(expandedCat === cat.name ? null : cat.name)}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-ios text-[17px] ${
                          categoryFilter === cat.name.toLowerCase()
                            ? 'bg-emerald-600/10 text-emerald-700 font-semibold'
                            : 'text-neutral-700 active:bg-neutral-100'
                        }`}
                      >
                        <span>{cat.name}</span>
                        {expandedCat === cat.name ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      {expandedCat === cat.name && (
                        <div className="ml-3 mt-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => selectCategory(cat.name.toLowerCase())}
                            className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${categoryFilter === cat.name.toLowerCase() ? 'text-emerald-700 font-semibold' : 'text-neutral-500'}`}
                          >
                            All {cat.name}
                          </button>
                          {cat.subcategories.map((sub) => (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => selectCategory(sub.toLowerCase())}
                              className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${categoryFilter === sub.toLowerCase() ? 'text-emerald-700 font-semibold bg-emerald-50' : 'text-neutral-500'}`}
                            >
                              {sub}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <aside className="hidden md:block md:w-64 shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20 space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Search</h3>
                  <form onSubmit={handleSearch}>
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search products..."
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </form>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Category</h3>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setCategoryFilter('all')}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${categoryFilter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      All Products
                    </button>
                    {SHOP_CATEGORIES.map((cat) => (
                      <div key={cat.name}>
                        <button
                          type="button"
                          onClick={() => setExpandedCat(expandedCat === cat.name ? null : cat.name)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                            categoryFilter === cat.name.toLowerCase() ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span>{cat.name}</span>
                          {expandedCat === cat.name ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                        {expandedCat === cat.name && (
                          <div className="ml-3 mt-1 space-y-0.5">
                            <button
                              type="button"
                              onClick={() => setCategoryFilter(cat.name.toLowerCase())}
                              className={`block w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${categoryFilter === cat.name.toLowerCase() ? 'text-emerald-700 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                              All {cat.name}
                            </button>
                            {cat.subcategories.map((sub) => (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => setCategoryFilter(sub.toLowerCase())}
                                className={`block w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${categoryFilter === sub.toLowerCase() ? 'text-emerald-700 font-semibold bg-emerald-50' : 'text-gray-500 hover:text-gray-700'}`}
                              >
                                {sub}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="text-sm text-gray-600">{products.length} products found</p>
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setSearchInput('');
                    }}
                    className="text-sm text-emerald-600 hover:text-emerald-700"
                  >
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
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
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
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                  {products.map((product) => (
                    <article
                      key={product.id}
                      className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                    >
                      <Link to={`/product/${product.id}`} className="block flex-1">
                        <div className="relative h-40 sm:h-48 bg-gray-100 overflow-hidden">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              No image
                            </div>
                          )}
                          {product.discountPercent && product.discountPercent > 0 && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                              -{product.discountPercent}%
                            </span>
                          )}
                          <span className="absolute top-2 left-2 bg-white/90 text-gray-700 text-[10px] sm:text-xs font-medium px-2 py-1 rounded capitalize">
                            {product.category}
                          </span>
                        </div>
                        <div className="p-3 sm:p-4">
                          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm sm:text-base">{product.name}</h3>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-base sm:text-lg font-bold text-emerald-600">AED {product.priceAed}</span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-gray-500 mt-1.5 truncate">by {product.merchantName}</p>
                        </div>
                      </Link>
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4" onClick={(e) => e.preventDefault()}>
                        <ProductPurchaseActions product={product} layout="card" onPayNow={() => setCartOpen(true)} />
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </ConsumerShell>
      <ShopCartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};
