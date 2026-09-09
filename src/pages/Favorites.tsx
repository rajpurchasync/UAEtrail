import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Mountain, ShoppingBag, Tent, User } from 'lucide-react';
import { ProductDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { fetchPublicMappedData } from '../api/public';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { FilterChips } from '../components/mobile/FilterChips';
import { TrailCard, CampingCard } from '../components/ui';
import { SecureAvatar } from '../components/ui/SecureAvatar';
import { PageMeta } from '../components/seo/PageMeta';
import { explorePath } from '../utils/exploreRouting';
import type { Trail, CampingSpot } from '../types';

type SavedTab = 'all' | 'trails' | 'camps' | 'shop' | 'people';

const SAVED_TAB_OPTIONS: Array<{ key: SavedTab; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'trails', label: 'Trails' },
  { key: 'camps', label: 'Camps' },
  { key: 'shop', label: 'Shop' },
  { key: 'people', label: 'People' },
];

type FavoriteProduct = ProductDTO & { merchantName: string };

type SavedShop = {
  id: string;
  name: string;
  path: string;
  logo?: string | null;
};

type SavedProfile = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
};

export const Favorites = () => {
  const [activeTab, setActiveTab] = useState<SavedTab>('all');
  const [savedTrails, setSavedTrails] = useState<Trail[]>([]);
  const [savedCamps, setSavedCamps] = useState<CampingSpot[]>([]);
  const [savedProducts, setSavedProducts] = useState<FavoriteProduct[]>([]);
  const [savedShops, setSavedShops] = useState<SavedShop[]>([]);
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    const loadSavedContent = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const [favoritesResponse, mappedData] = await Promise.all([
          api.getMeFavorites(),
          fetchPublicMappedData(),
        ]);

        if (disposed) return;

        const favoriteLocationIds = new Set(
          favoritesResponse.data
            .map((item) => item.locationId)
            .filter((id): id is string => Boolean(id))
        );

        setSavedTrails(mappedData.trails.filter((trail) => favoriteLocationIds.has(trail.id)));
        setSavedCamps(mappedData.camps.filter((camp) => favoriteLocationIds.has(camp.id)));
        setSavedProducts(
          favoritesResponse.data
            .filter((item) => Boolean(item.product))
            .map((item) => {
              const product = item.product!;
              return {
                id: product.id,
                merchantId: product.merchantId,
                merchantName: product.merchantName ?? 'Shop',
                name: product.name,
                images: product.images,
                priceAed: product.priceAed,
                discountPercent: product.discountPercent ?? undefined,
                stockQuantity: 0,
                lowStockThreshold: 0,
                category: product.category,
                status: 'active',
              } as FavoriteProduct;
            })
        );
        setSavedShops(
          favoritesResponse.data.flatMap((item) => {
            if (item.merchant) {
              return [{
                id: item.merchant.id,
                name: item.merchant.shopName,
                path: `/merchant/${item.merchant.id}`,
                logo: item.merchant.logo,
              }];
            }
            if (item.tenant) {
              return [{
                id: item.tenant.id,
                name: item.tenant.name,
                path: `/operator/${item.tenant.slug ?? item.tenant.id}`,
                logo: item.tenant.logoUrl,
              }];
            }
            return [];
          })
        );
        setSavedProfiles(
          favoritesResponse.data
            .filter((item) => Boolean(item.profile))
            .map((item) => ({
              id: item.profile!.id,
              displayName: item.profile!.displayName,
              avatarUrl: item.profile!.avatarUrl,
            }))
        );
      } catch (error) {
        if (disposed) return;
        setSavedTrails([]);
        setSavedCamps([]);
        setSavedProducts([]);
        setSavedShops([]);
        setSavedProfiles([]);
        setLoadError(error instanceof Error ? error.message : 'Couldn\'t load your saved places — try again.');
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    };

    void loadSavedContent();

    return () => {
      disposed = true;
    };
  }, []);

  const savedPlacesCount = savedTrails.length + savedCamps.length;
  const savedShopCount = savedProducts.length + savedShops.length;
  const savedPeopleCount = savedProfiles.length;
  const totalSavedCount = savedPlacesCount + savedShopCount + savedPeopleCount;

  const emptyState = useMemo(
    () => (
      <div className="glass-card p-6 text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
          <Heart className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-900">No saved items yet</h2>
        <p className="text-sm text-neutral-600 mt-2 max-w-md mx-auto">
          Save places and shop items using the heart icon. Your saved items will appear here.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Link to={explorePath({ panel: 'venues', list: true })} className="app-chip-active">Browse locations</Link>
          <Link to={explorePath({ panel: 'shops', list: true, filter: 'shops' })} className="app-chip-inactive">Browse shops</Link>
        </div>
      </div>
    ),
    []
  );

  const showTrails = activeTab === 'all' || activeTab === 'trails';
  const showCamps = activeTab === 'all' || activeTab === 'camps';
  const showShop = activeTab === 'all' || activeTab === 'shop';
  const showPeople = activeTab === 'all' || activeTab === 'people';

  return (
    <ConsumerShell
      layout="stack"
      title="Saved"
      showJourney={false}
      back={{ fallbackTo: '/profile', label: 'Profile' }}
      toolbar={
        <FilterChips options={SAVED_TAB_OPTIONS} value={activeTab} onChange={setActiveTab} />
      }
    >
      <PageMeta
        title="Saved items"
        description="Your saved trails, camping spots, and shop items in one place for quick planning."
        path="/favorites"
      />

      {loadError && !loading && (
        <div className="glass-card p-4 mb-4 border-red-200/60 bg-red-50/40">
          <p className="text-sm text-red-700">{loadError}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : totalSavedCount === 0 ? (
        emptyState
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="glass-card p-4">
              <p className="text-xs text-neutral-500 uppercase tracking-[0.16em]">Saved places</p>
              <div className="mt-2 flex items-center gap-2 text-neutral-900">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="text-xl font-bold">{savedPlacesCount}</span>
              </div>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-neutral-500 uppercase tracking-[0.16em]">Saved shop items</p>
              <div className="mt-2 flex items-center gap-2 text-neutral-900">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span className="text-xl font-bold">{savedShopCount}</span>
              </div>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-neutral-500 uppercase tracking-[0.16em]">Total saved</p>
              <div className="mt-2 flex items-center gap-2 text-neutral-900">
                <Heart className="w-4 h-4 text-emerald-600" />
                <span className="text-xl font-bold">{totalSavedCount}</span>
              </div>
            </div>
          </div>

          {showTrails && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Mountain className="w-4 h-4 text-emerald-600" />
                <h2 className="text-lg font-semibold text-neutral-900">Favorite Trails</h2>
                <span className="text-sm text-neutral-500">({savedTrails.length})</span>
              </div>
              {savedTrails.length === 0 ? (
                <div className="glass-card p-4 text-sm text-neutral-600">
                  No favorite trails yet.
                </div>
              ) : (
                <div className="browse-card-grid">
                  {savedTrails.map((trail) => (
                    <TrailCard key={trail.id} trail={trail} />
                  ))}
                </div>
              )}
            </section>
          )}

          {showCamps && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Tent className="w-4 h-4 text-emerald-600" />
                <h2 className="text-lg font-semibold text-neutral-900">Favorite Camping Spots</h2>
                <span className="text-sm text-neutral-500">({savedCamps.length})</span>
              </div>
              {savedCamps.length === 0 ? (
                <div className="glass-card p-4 text-sm text-neutral-600">
                  No favorite camping spots yet.
                </div>
              ) : (
                <div className="browse-card-grid">
                  {savedCamps.map((camp) => (
                    <CampingCard key={camp.id} camp={camp} />
                  ))}
                </div>
              )}
            </section>
          )}

          {showShop && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <h2 className="text-lg font-semibold text-neutral-900">Favourite shops</h2>
                <span className="text-sm text-neutral-500">({savedShops.length})</span>
              </div>
              {savedShops.length === 0 ? (
                <div className="glass-card p-4 text-sm text-neutral-600">
                  No favourite shops yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {savedShops.map((shop) => (
                    <Link
                      key={shop.id}
                      to={shop.path}
                      className="glass-card flex items-center gap-3 p-4 hover:shadow-md transition-shadow"
                    >
                      {shop.logo ? (
                        <img src={shop.logo} alt="" className="h-12 w-12 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-xl">🛍️</div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-900 truncate">{shop.name}</p>
                        <p className="text-xs text-neutral-500">Gear shop</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {showShop && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <h2 className="text-lg font-semibold text-neutral-900">Favourite Shop Items</h2>
                <span className="text-sm text-neutral-500">({savedProducts.length})</span>
              </div>
              {savedProducts.length === 0 ? (
                <div className="glass-card p-4 text-sm text-neutral-600">
                  No favorite shop items yet.
                </div>
              ) : (
                <div className="browse-card-grid">
                  {savedProducts.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <img
                        src={product.images?.[0] ?? 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'}
                        alt={product.name}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="p-4">
                        <p className="text-xs text-gray-500 mb-1 capitalize">{product.category}</p>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                        <p className="text-emerald-700 font-bold mt-1">AED {product.priceAed}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">by {product.merchantName}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {showPeople && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                <h2 className="text-lg font-semibold text-neutral-900">Favourite people</h2>
                <span className="text-sm text-neutral-500">({savedProfiles.length})</span>
              </div>
              {savedProfiles.length === 0 ? (
                <div className="glass-card p-4 text-sm text-neutral-600">
                  No favourite profiles yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {savedProfiles.map((profile) => (
                    <Link
                      key={profile.id}
                      to={`/member/${profile.id}`}
                      className="glass-card flex items-center gap-3 p-4 hover:shadow-md transition-shadow"
                    >
                      <SecureAvatar
                        src={profile.avatarUrl}
                        name={profile.displayName}
                        className="h-12 w-12 text-sm"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-900 truncate">{profile.displayName}</p>
                        <p className="text-xs text-neutral-500">Member profile</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </ConsumerShell>
  );
};