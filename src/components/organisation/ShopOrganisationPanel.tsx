import { proMembershipPath } from '../../config/routingCatalog';
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ExternalLink, Store } from 'lucide-react';
import type { ShopOrganisationDTO } from '@uaetrail/shared-types';
import {
  createShopOrganisationProfile,
  fetchShopOrganisationProfile,
  fetchShopOrganisationStores,
  updateShopOrganisationProfile,
} from '../../hooks/shopOrganisationClientApi';
import { shopPublicPath } from '../../utils/shopPaths';
import { GlassCard } from '../mobile/GlassCard';
import { AppButton } from '../mobile/AppButton';
import { ImageUpload } from '../ui';
import { AppSelect } from '../ui/AppSelect';
import { useMemberStatus } from '../../hooks/useMemberStatus';

const emptyProfile = {
  shopName: '',
  description: '',
  logo: '',
  websiteUrl: '',
  contactEmail: '',
  contactPhone: '',
  region: '',
  allowInboundChat: false,
  showContactPhone: false,
};

export const ShopOrganisationPanel = () => {
  const { hasShopProfile, loading: gateLoading } = useMemberStatus();
  const [stores, setStores] = useState<ShopOrganisationDTO[]>([]);
  const [storesLoaded, setStoresLoaded] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedStore = stores.find((store) => store.id === selectedStoreId) ?? null;

  const loadStores = async () => {
    try {
      const data = await fetchShopOrganisationStores();
      setStores(data);
      setSelectedStoreId((current) => {
        if (current && data.some((store) => store.id === current)) return current;
        return data[0]?.id ?? null;
      });
    } catch {
      setStores([]);
      setSelectedStoreId(null);
    } finally {
      setStoresLoaded(true);
    }
  };

  const loadProfile = async (merchantId: string) => {
    const profile = await fetchShopOrganisationProfile(merchantId);
    setProfileForm({
      shopName: profile.shopName,
      description: profile.description ?? '',
      logo: profile.logo ?? '',
      websiteUrl: profile.websiteUrl ?? '',
      contactEmail: profile.contactEmail ?? '',
      contactPhone: profile.contactPhone ?? '',
      region: profile.region ?? '',
      allowInboundChat: profile.allowInboundChat === true,
      showContactPhone: profile.showContactPhone === true,
    });
  };

  useEffect(() => {
    void loadStores();
  }, []);

  useEffect(() => {
    if (!selectedStoreId) return;
    void loadProfile(selectedStoreId);
  }, [selectedStoreId]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (selectedStoreId) {
        await updateShopOrganisationProfile(selectedStoreId, {
          ...profileForm,
          websiteUrl: profileForm.websiteUrl.trim() || null,
        });
      } else {
        const created = await createShopOrganisationProfile({
          ...profileForm,
          websiteUrl: profileForm.websiteUrl.trim() || undefined,
        });
        setSelectedStoreId(created.id);
      }
      await loadStores();
      if (selectedStoreId) await loadProfile(selectedStoreId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save shop');
    } finally {
      setSaving(false);
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

      {error && (
        <GlassCard padding className="border-red-200/60 bg-red-50/80">
          <p className="text-sm text-red-700">{error}</p>
        </GlassCard>
      )}

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
              Online shops appear in Explore without a map pin. Link visitors to your own site.
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
          <div className="space-y-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 px-3.5 py-3">
              <input
                type="checkbox"
                checked={profileForm.showContactPhone}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, showContactPhone: event.target.checked }))
                }
                className="mt-0.5 size-5 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                <span className="block text-sm font-semibold text-neutral-900">Show phone on shop page</span>
                <span className="mt-0.5 block text-xs text-neutral-500">
                  Visitors can call this number from the public shop page and map peek.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 px-3.5 py-3">
              <input
                type="checkbox"
                checked={profileForm.allowInboundChat}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, allowInboundChat: event.target.checked }))
                }
                className="mt-0.5 size-5 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                <span className="block text-sm font-semibold text-neutral-900">Allow messages in chat</span>
                <span className="mt-0.5 block text-xs text-neutral-500">
                  Visitors can start an in-app chat with the shop contact. Leave off if you only want phone or email.
                </span>
              </span>
            </label>
          </div>
          <AppButton type="submit" disabled={saving} className="w-full">
            {saving ? 'Saving…' : 'Save shop info'}
          </AppButton>
        </form>
      </GlassCard>
    </div>
  );
};
