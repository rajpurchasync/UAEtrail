import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/services';

export interface FavoriteTarget {
  locationId?: string;
  activityId?: string;
  productId?: string;
  merchantId?: string;
  tenantId?: string;
  profileUserId?: string;
}

interface FavoriteButtonProps extends FavoriteTarget {
  className?: string;
  compact?: boolean;
}

const hasFavoriteTarget = (target: FavoriteTarget): boolean =>
  Boolean(
    target.locationId ||
      target.activityId ||
      target.productId ||
      target.merchantId ||
      target.tenantId ||
      target.profileUserId
  );

export const FavoriteButton = ({
  locationId,
  activityId,
  productId,
  merchantId,
  tenantId,
  profileUserId,
  className = '',
  compact = false,
}: FavoriteButtonProps) => {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !hasFavoriteTarget({ locationId, activityId, productId, merchantId, tenantId, profileUserId })) {
      return;
    }
    api
      .checkFavorite({ locationId, activityId, productId, merchantId, tenantId, profileUserId })
      .then((res) => {
        setSaved(res.data.saved);
        setFavoriteId(res.data.favoriteId);
      })
      .catch(() => undefined);
  }, [user, locationId, activityId, productId, merchantId, tenantId, profileUserId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    setLoading(true);
    try {
      if (saved && favoriteId) {
        await api.removeFavorite(favoriteId);
        setSaved(false);
        setFavoriteId(null);
      } else {
        const res = await api.addFavorite({
          locationId,
          activityId,
          productId,
          merchantId,
          tenantId,
          profileUserId,
        });
        setSaved(true);
        setFavoriteId(res.data.id);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const sizeClass = compact ? 'min-h-[36px] min-w-[36px]' : 'min-h-[44px] min-w-[44px]';
  const iconClass = compact ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? 'Remove from favourites' : 'Add to favourites'}
      className={`${sizeClass} flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm border border-gray-100 active:scale-95 transition-all disabled:opacity-60 ${className}`}
    >
      <Heart
        className={`${iconClass} ${saved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
      />
    </button>
  );
};
