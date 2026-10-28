import { Heart } from 'lucide-react';
import {
  PLACE_PEEK_FOOTER_TRIP_ALERTS,
  PLACE_PEEK_FOOTER_TRIP_ALERTS_ON,
} from '../../content/placePeekCopy';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { useExploreWishlistSave } from './useExploreWishlistSave';

interface ExploreWishlistSaveButtonProps {
  card: DiscoveryCardModel;
  light?: boolean;
  bare?: boolean;
}

/** Save to Plan wishlist (`GET /me/wishlist`) — same store as Plan → Saved. */
export const ExploreWishlistSaveButton = ({
  card,
  light = false,
  bare = false,
}: ExploreWishlistSaveButtonProps) => {
  const { canSave, saved, busy, notice, toggle } = useExploreWishlistSave(card);

  if (card.viewerAccess?.level === 'host' || !canSave) return null;

  const shell = bare
    ? 'text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)] hover:opacity-90'
    : light
      ? 'bg-neutral-100 text-gray-700 hover:bg-neutral-200'
      : 'bg-black/35 text-white backdrop-blur-sm hover:bg-black/45';

  const saveLabel = saved ? PLACE_PEEK_FOOTER_TRIP_ALERTS_ON : PLACE_PEEK_FOOTER_TRIP_ALERTS;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        disabled={busy}
        onClick={(event) => {
          event.stopPropagation();
          void toggle();
        }}
        className={`inline-flex h-9 w-9 items-center justify-center disabled:opacity-60 ${bare ? '' : 'rounded-full'} ${shell}`}
        aria-label={saveLabel}
        title={saveLabel}
        aria-pressed={saved}
      >
        <Heart
          className={`h-[1.125rem] w-[1.125rem] ${saved ? 'fill-current text-emerald-700' : ''}`}
          strokeWidth={2.25}
          aria-hidden
        />
      </button>
      {notice ? (
        <p
          role="status"
          className={`pointer-events-none absolute right-0 top-full z-20 mt-1 w-max max-w-[min(240px,72vw)] rounded-lg px-2.5 py-1.5 text-right text-[10px] font-medium leading-snug shadow-md ring-1 ring-black/5 ${
            bare || light ? 'bg-white/95 text-neutral-800' : 'bg-white text-neutral-700'
          }`}
        >
          {notice}
        </p>
      ) : null}
    </div>
  );
};
