import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/services';

interface FavoriteButtonProps {
  locationId?: string;
  activityId?: string;
  productId?: string;
  className?: string;
}

export const FavoriteButton = ({ locationId, activityId, productId, className = '' }: FavoriteButtonProps) => {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || (!locationId && !activityId && !productId)) return;
    api
      .checkFavorite(locationId, activityId, productId)
      .then((res) => {
        setSaved(res.data.saved);
        setFavoriteId(res.data.favoriteId);
      })
      .catch(() => undefined);
  }, [user, locationId, activityId, productId]);

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
        const res = await api.addFavorite({ locationId, activityId, productId });
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

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? 'Remove from saved' : 'Save item'}
      className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm border border-gray-100 active:scale-95 transition-all disabled:opacity-60 ${className}`}
    >
      <Heart
        className={`w-5 h-5 ${saved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
      />
    </button>
  );
};
