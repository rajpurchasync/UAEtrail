import { Bookmark, Heart } from 'lucide-react';
import type { ExploreCardModel } from '../../../explore/exploreCardModel';
import { ShareButton } from '../../../components/ui/ShareButton';
import { useExploreEntityFollow } from '../../../explore/ui/useExploreEntityFollow';
import { useExploreWishlistSave } from '../../../explore/ui/useExploreWishlistSave';

interface ListFeedPosterEngagementBarProps {
  card: ExploreCardModel;
}

const actionShell =
  'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-neutral-700 transition active:bg-neutral-50 disabled:opacity-45';

const actionLabel = 'text-[10px] font-semibold leading-tight text-neutral-600';

/** Like, share (send), save/follow — below join CTA on category feed posters. */
export const ListFeedPosterEngagementBar = ({ card }: ListFeedPosterEngagementBarProps) => {
  const { canSave, saved, busy: saveBusy, toggle: toggleSave } = useExploreWishlistSave(card);
  const { canFollow, following, busy: followBusy, toggle: toggleFollow } = useExploreEntityFollow(card);
  const isHost = card.viewerAccess?.level === 'host';
  const showLike = !isHost && canSave;
  const showFollow = !isHost && canFollow;

  return (
    <div
      className="flex items-stretch border-t border-neutral-100 bg-white"
      onClick={(event) => event.stopPropagation()}
    >
      {showLike ? (
        <button
          type="button"
          disabled={saveBusy}
          className={actionShell}
          aria-label={saved ? 'Unlike' : 'Like'}
          aria-pressed={saved}
          onClick={() => void toggleSave()}
        >
          <Heart
            className={`h-[1.35rem] w-[1.35rem] ${saved ? 'fill-rose-500 text-rose-500' : ''}`}
            strokeWidth={2}
            aria-hidden
          />
          <span className={actionLabel}>Like</span>
        </button>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2.5">
        <ShareButton
          title={card.shareTitle}
          text={card.shareText ?? undefined}
          path={card.sharePath}
          iconOnly
          light
          icon="send"
          className="[&_button]:!h-9 [&_button]:!w-9 [&_button]:!bg-transparent [&_button]:!shadow-none [&_button]:!ring-0"
        />
        <span className={actionLabel}>Share</span>
      </div>

      {showFollow ? (
        <button
          type="button"
          disabled={followBusy}
          className={actionShell}
          aria-label={following ? 'Unfollow' : 'Follow'}
          aria-pressed={following}
          onClick={() => void toggleFollow()}
        >
          <Bookmark
            className={`h-[1.35rem] w-[1.35rem] ${following ? 'fill-emerald-600 text-emerald-600' : ''}`}
            strokeWidth={2}
            aria-hidden
          />
          <span className={actionLabel}>{following ? 'Following' : 'Follow'}</span>
        </button>
      ) : null}
    </div>
  );
};
