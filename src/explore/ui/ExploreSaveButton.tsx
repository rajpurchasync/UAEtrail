import { Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ExploreCardModel } from '../exploreCardModel';
import { useExploreSaveFavorite } from './useExploreSaveFavorite';

interface ExploreSaveButtonProps {
  card: ExploreCardModel;
  light?: boolean;
}

export const ExploreSaveButton = ({ card, light = false }: ExploreSaveButtonProps) => {
  const { canSave, saved, busy, notice, toggle } = useExploreSaveFavorite(card);

  if (card.showHostActions || !canSave) return null;

  const shell = light
    ? 'bg-neutral-100 text-gray-700 hover:bg-neutral-200'
    : 'bg-black/35 text-white backdrop-blur-sm hover:bg-black/45';

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => void toggle()}
        className={`flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-60 ${shell}`}
        aria-label={saved ? 'Remove from saved map' : 'Save to your map'}
        aria-pressed={saved}
      >
        <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} aria-hidden />
      </button>
      {notice ? (
        <p className="max-w-[200px] text-right text-[10px] font-medium leading-snug text-neutral-600">
          {notice.includes('Profile') ? (
            <>
              Saved —{' '}
              <Link to="/profile/wishlist" className="text-emerald-700 underline">
                Profile
              </Link>
            </>
          ) : (
            notice
          )}
        </p>
      ) : null}
    </div>
  );
};
