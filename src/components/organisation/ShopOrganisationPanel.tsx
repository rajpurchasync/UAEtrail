import { proMembershipPath } from '../../config/routingCatalog';
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ExternalLink, Package, Store, Trash2 } from 'lucide-react';
import type { ProductDTO, ShopOrganisationDTO } from '@uaetrail/shared-types';
import { api } from '../../api/index';
import { shopPublicPath } from '../../utils/shopPaths';
import { GlassCard } from '../mobile/GlassCard';
import { AppButton } from '../mobile/AppButton';
import { AppSegmented } from '../mobile/AppSegmented';
import { ImageUpload } from '../ui';
import { AppSelect } from '../ui/AppSelect';

import { useHostStatus } from '../../hooks/useHostStatus';

type Tab = 'shop' | 'products';

const emptyProfile = {
  shopName: '',
  description: '',
  logo: '',
  websiteUrl: '',
  contactEmail: '',
  contactPhone: '',
  region: '',
};

const emptyProduct = {
  name: '',
  description: '',
  priceAed: 0,
  discountPercent: 0,
  externalUrl: '',
  images: [] as string[],
};

const productDefaults = {
  category: 'gear',
  status: 'active' as const,
  stockQuantity: 1,
  lowStockThreshold: 0,
};

export const ShopOrganisationPanel = () => {
  const { hasShopProfile, loading: gateLoading } = useHostStatus();
  const [tab, setTab] = useState<Tab>('shop');
  const [stores, setStores] = useState<ShopOrganisationDTO[]>([]);
  const [storesLoaded, setStoresLoaded] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [products, setProducts] = useState<(ProductDTO & { createdAt?: string })[]>([]);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedStore = stores.find((store) => store.id === selectedStoreId) ?? null;
  const visibleProducts = products.filter((product) => product.status !== 'inactive');

  const loadStores = async () => {
    try {
      const res = await api.getShopOrganisationStores();
      setStores(res.data);
      setSelectedStoreId((current) => {
        if (current && res.data.some((store) => store.id === current)) return current;
        return res.data[0]?.id ?? null;
      });
    } catch {
      setStores([]);
      setSelectedStoreId(null);
    } finally {
      setStoresLoaded(true);
    }
  };

  const loadProfile = async (merchantId: string) => {
    const res = await api.getShopOrganisationProfile(merchantId);
    setProfileForm({
      shopName: res.data.shopName,
      description: res.data.description ?? '',
      logo: res.data.logo ?? '',
      websiteUrl: res.data.websiteUrl ?? '',
      contactEmail: res.data.contactEmail ?? '',
      contactPhone: res.data.contactPhone ?? '',
      region: res.data.region ?? '',
    });
  };

  const loadProducts = async (merchantId: string) => {
    const res = await api.getShopOrganisationProducts(merchantId);
    setProducts(res.data);
  };

  useEffect(() => {
    void loadStores();
  }, []);

  useEffect(() => {
    if (!selectedStoreId) return;
    void loadProfile(selectedStoreId);
    void loadProducts(selectedStoreId);
  }, [selectedStoreId]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (selectedStoreId) {
        await api.updateShopOrganisationProfile(selectedStoreId, {
          ...profileForm,
          websiteUrl: profileForm.websiteUrl.trim() || null,
        });
      } else {
        const created = await api.createShopOrganisationProfile({
          ...profileForm,
          websiteUrl: profileForm.websiteUrl.trim() || undefined,
        });
        setSelectedStoreId(created.data.id);
      }
      await loadStores();
      if (selectedStoreId) await loadProfile(selectedStoreId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save shop');
    } finally {
      setSaving(false);
    }
  };

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedStoreId) return;
    if (!productForm.images[0]) {
      setError('Add a photo for this item.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: productForm.name.trim(),
        description: productForm.description.trim() || undefined,
        images: productForm.images.slice(0, 1),
        priceAed: productForm.priceAed,
        discountPercent: productForm.discountPercent || undefined,
        externalUrl: productForm.externalUrl.trim() || undefined,
        ...productDefaults,
      };
      if (editingProductId) {
        await api.updateShopOrganisationProduct(editingProductId, payload);
      } else {
        await api.addShopOrganisationProduct({ shopId: selectedStoreId, ...payload });
      }
      setShowProductForm(false);
      setEditingProductId(null);
      setProductForm(emptyProduct);
      await loadProducts(selectedStoreId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const startEditProduct = (product: ProductDTO) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      description: product.description ?? '',
      priceAed: product.priceAed,
      discountPercent: product.discountPercent ?? 0,
      externalUrl: product.externalUrl ?? '',
      images: product.images.slice(0, 1),
    });
    setShowProductForm(true);
    setTab('products');
  };

  const removeProduct = async (product: ProductDTO) => {
    if (!selectedStoreId) return;
    if (!window.confirm(`Remove "${product.name}" from your shop profile?`)) return;
    setError(null);
    try {
      await api.deleteShopOrganisationProduct(product.id);
      if (editingProductId === product.id) {
        setShowProductForm(false);
        setEditingProductId(null);
        setProductForm(emptyProduct);
      }
      await loadProducts(selectedStoreId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove product');
    }
  };

  if (!gateLoading && storesLoaded && !hasShopProfile && stores.length === 0) {
    return <Navigate to={proMembershipPath({ intent: 'add-shop' })} replace />;
  }

  if (gateLoading || !storesLoaded) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-up">
      {stores.length > 1 && (
        <GlassCard padding className="!py-3">
          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Store</label>
          <AppSelect
            value={selectedStoreId ?? ''}
            onChange={(storeId) => setSelectedStoreId(storeId || null)}
            options={stores.map((store) => ({ value: store.id, label: store.shopName }))}
            inputClassName="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            aria-label="Store"
          />
        </GlassCard>
      )}

      {selectedStore && (
        <Link
          to={shopPublicPath({ merchantId: selectedStore.id })}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700"
        >
          View public shop page
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      )}

      <AppSegmented
        segments={[
          { key: 'shop', label: 'Shop info' },
          { key: 'products', label: 'Featured picks' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {error && (
        <GlassCard padding className="border-red-200/60 bg-red-50/80">
          <p className="text-sm text-red-700">{error}</p>
        </GlassCard>
      )}

      {tab === 'shop' && (
        <GlassCard padding>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="flex items-center gap-2 text-neutral-900">
              <Store className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold">Shop details</h2>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500">Shop name *</label>
              <input
                required
                value={profileForm.shopName}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, shopName: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500">About</label>
              <textarea
                rows={3}
                value={profileForm.description}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, description: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500">Region</label>
              <input
                value={profileForm.region}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, region: event.target.value }))}
                placeholder="e.g. Dubai Marina"
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500">Shop website</label>
              <input
                type="url"
                value={profileForm.websiteUrl}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, websiteUrl: event.target.value }))}
                placeholder="https://yourshop.com"
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Online shops appear in Explore without a map pin. Featured picks link out to your site.
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 mb-2 block">Logo</label>
              <ImageUpload
                images={profileForm.logo ? [profileForm.logo] : []}
                onChange={(urls) => setProfileForm((prev) => ({ ...prev, logo: urls[0] ?? '' }))}
                max={1}
                keyPrefix="shop-logos"
                kind="shop-logo"
                preset="rectangle"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-neutral-500">Contact email</label>
                <input
                  type="email"
                  value={profileForm.contactEmail}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500">Contact phone</label>
                <input
                  value={profileForm.contactPhone}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
                />
              </div>
            </div>
            <AppButton type="submit" disabled={saving} className="w-full">
              {saving ? 'Saving…' : 'Save shop info'}
            </AppButton>
          </form>
        </GlassCard>
      )}

      {tab === 'products' && (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
              <Package className="h-4 w-4 text-emerald-600" />
              Your items
            </p>
            <button
              type="button"
              onClick={() => {
                setShowProductForm(true);
                setEditingProductId(null);
                setProductForm(emptyProduct);
                setError(null);
              }}
              className="text-sm font-semibold text-emerald-700"
            >
              + Add item
            </button>
          </div>

          {showProductForm && (
            <GlassCard padding>
              <form onSubmit={saveProduct} className="space-y-3">
                <h3 className="text-sm font-bold text-neutral-900">{editingProductId ? 'Edit item' : 'New item'}</h3>
                <div>
                  <label className="text-xs font-semibold text-neutral-500">Title *</label>
                  <input
                    required
                    value={productForm.name}
                    onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
                    placeholder="e.g. Hiking poles"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 mb-2 block">Photo *</label>
                  <ImageUpload
                    images={productForm.images}
                    onChange={(urls) => setProductForm((prev) => ({ ...prev, images: urls.slice(0, 1) }))}
                    max={1}
                    keyPrefix="products"
                    kind="product-image"
                    preset="rectangle"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500">Description</label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
                    placeholder="Short details for shoppers"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-500">Price (AED) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={productForm.priceAed || ''}
                      onChange={(event) =>
                        setProductForm((prev) => ({ ...prev, priceAed: parseInt(event.target.value, 10) || 0 }))
                      }
                      className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-500">Discount %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={productForm.discountPercent || ''}
                      onChange={(event) =>
                        setProductForm((prev) => ({
                          ...prev,
                          discountPercent: parseInt(event.target.value, 10) || 0,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500">Buy link (optional)</label>
                  <input
                    type="url"
                    value={productForm.externalUrl}
                    onChange={(event) => setProductForm((prev) => ({ ...prev, externalUrl: event.target.value }))}
                    placeholder="https://yourshop.com/product"
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
                  />
                  <p className="mt-1 text-xs text-neutral-500">Opens your site — no checkout on UAE Trail.</p>
                </div>
                <div className="flex gap-2">
                  <AppButton type="submit" disabled={saving} className="flex-1">
                    {saving ? 'Saving…' : editingProductId ? 'Save changes' : 'Add item'}
                  </AppButton>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductForm(false);
                      setEditingProductId(null);
                      setProductForm(emptyProduct);
                    }}
                    className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </GlassCard>
          )}

          {visibleProducts.length === 0 ? (
            <GlassCard padding className="text-center">
              <p className="text-sm text-neutral-500">No items yet. Add your first listing above.</p>
            </GlassCard>
          ) : (
            visibleProducts.map((product) => (
              <GlassCard key={product.id} padding className="!p-3">
                <div className="flex gap-3">
                  {product.images[0] ? (
                    <img src={product.images[0]} alt="" className="h-16 w-16 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-neutral-100 shrink-0 text-lg">
                      🛍️
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5">{product.description}</p>
                    )}
                    <p className="text-sm font-bold text-emerald-700 mt-1">
                      AED {product.priceAed}
                      {product.discountPercent ? (
                        <span className="text-xs font-semibold text-rose-600 ml-1">-{product.discountPercent}%</span>
                      ) : null}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => startEditProduct(product)}
                        className="text-xs font-semibold text-emerald-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeProduct(product)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </>
      )}
    </div>
  );
};
