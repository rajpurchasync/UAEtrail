import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Loader2, MapPin, Trash2 } from 'lucide-react';
import type { FavoriteDTO } from '@uaetrail/shared-types';
import { api } from '../../api/index';
import { EXPLORE_MAP_PATH } from '../../config/platform';
import { PRODUCT_EXPLORE_CTA } from '../../content/productNorthStar';
import { GlassCard } from '../mobile/GlassCard';
import { activityDetailPath, memberProfilePath } from '@uaetrail/shared-types';
import { exploreSavedPinPath } from '../../explore/routing';

const favoriteLabel = (item: FavoriteDTO): string => {
  if (item.location?.name) return item.location.name;
  if (item.participantIntent?.title) return item.participantIntent.title;
  const plan = item.activity ?? item.event;
  if (plan?.title) return plan.title;
  if (item.merchant?.shopName) return item.merchant.shopName;
  if (item.tenant?.name) return item.tenant.name;
  if (item.product?.name) return item.product.name;
  if (item.profile?.displayName) return item.profile.displayName;
  return 'Saved item';
};

const favoriteTypeLabel = (item: FavoriteDTO): string => {
  if (item.locationId) return 'Place';
  if (item.participantIntentId || item.participantIntent) return 'Looking for crew';
  if (item.activityId || item.activity || item.event) return 'Plan';
  if (item.merchantId || item.tenantId || item.productId) return 'Shop';
  if (item.profileUserId) return 'Member';
  return 'Saved';
};

const favoritePath = (item: FavoriteDTO): string | null => {
  if (item.participantIntentId) return exploreSavedPinPath(`demand:${item.participantIntentId}`);
  if (item.locationId) return exploreSavedPinPath(`venue:${item.locationId}`);
  const plan = item.activity ?? item.event;
  if (item.activityId) return activityDetailPath(item.activityId);
  if (plan?.id) return activityDetailPath(plan.id);
  if (item.tenant?.slug) return `/shop/${item.tenant.slug}`;
  if (item.merchantId) return `/operator/${item.merchantId}`;
  if (item.profileUserId) return memberProfilePath(item.profileUserId);
  return null;
};

export const ProfileWishlistPanel = () => {
  const [items, setItems] = useState<FavoriteDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.getMeFavorites();
      setItems(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load saved map.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setAlerts = async (id: string, alertOnMatch: boolean) => {
    setTogglingId(id);
    try {
      const res = await api.patchFavoriteAlerts(id, alertOnMatch);
      setItems((prev) =>
        prev.map((row) => (row.id === id ? { ...row, alertOnMatch: res.data.alertOnMatch } : row))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update alerts.');
    } finally {
      setTogglingId(null);
    }
  };

  const remove = async (id: string) => {
    setRemovingId(id);
    try {
      await api.removeFavorite(id);
      setItems((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove saved item.');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-hidden />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <GlassCard padding className="text-center !py-10">
        <p className="text-base font-semibold text-neutral-900">Nothing saved yet</p>
        <p className="mt-2 text-sm text-neutral-500">Star places and plans on the map — we&apos;ll alert you when something matches.</p>
        <Link
          to={EXPLORE_MAP_PATH}
          className="mt-5 inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          {PRODUCT_EXPLORE_CTA}
        </Link>
      </GlassCard>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const path = favoritePath(item);
        return (
          <li key={item.id}>
            <GlassCard padding className="!p-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <MapPin className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-900">{favoriteLabel(item)}</p>
                  <p className="text-xs text-neutral-500">{favoriteTypeLabel(item)}</p>
                  {item.watchOutingCategory ? (
                    <label className="mt-2 flex items-center gap-2 text-xs text-neutral-600">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-neutral-300 text-emerald-600"
                        checked={item.alertOnMatch !== false}
                        disabled={togglingId === item.id}
                        onChange={(event) => void setAlerts(item.id, event.target.checked)}
                      />
                      Alerts for similar plans nearby
                    </label>
                  ) : null}
                </div>
                {path ? (
                  <Link to={path} className="shrink-0 text-xs font-semibold text-emerald-700">
                    Open
                    <ChevronRight className="inline h-4 w-4" aria-hidden />
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => void remove(item.id)}
                  disabled={removingId === item.id}
                  className="shrink-0 rounded-lg p-2 text-neutral-400 hover:text-red-600"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </GlassCard>
          </li>
        );
      })}
    </ul>
  );
};
