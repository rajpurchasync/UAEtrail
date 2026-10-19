import { Heart } from 'lucide-react';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { useExploreEntityFollow } from './useExploreEntityFollow';

interface ExploreFollowButtonProps {
  card: DiscoveryCardModel;
  light?: boolean;
  /** List poster / map photo — icon only, no chip or circle background. */
  bare?: boolean;
}

export const ExploreFollowButton = ({ card, light = false, bare = false }: ExploreFollowButtonProps) => {
  const { canFollow, following, busy, notice, toggle } = useExploreEntityFollow(card);

  if (card.viewerAccess?.level === 'host' || !canFollow) return null;

  const shell = bare
    ? 'text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)] hover:opacity-90'
    : light
      ? 'bg-neutral-100 text-gray-700 hover:bg-neutral-200'
      : 'bg-black/35 text-white backdrop-blur-sm hover:bg-black/45';

  const followLabel = following ? 'Unfollow' : 'Follow';

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={(event) => {
          event.stopPropagation();
          void toggle();
        }}
        className={`inline-flex h-9 w-9 items-center justify-center disabled:opacity-60 ${bare ? '' : 'rounded-full'} ${shell}`}
        aria-label={followLabel}
        title={followLabel}
        aria-pressed={following}
      >
        <Heart
          className={`h-[1.125rem] w-[1.125rem] ${following ? 'fill-current' : ''}`}
          strokeWidth={2.25}
          aria-hidden
        />
      </button>
      {notice ? (
        <p className="max-w-[200px] text-right text-[10px] font-medium leading-snug text-neutral-600">
          {notice}
        </p>
      ) : null}
    </div>
  );
};
