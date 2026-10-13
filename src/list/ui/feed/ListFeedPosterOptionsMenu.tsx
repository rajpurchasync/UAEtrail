import { useEffect, useId, useRef, useState } from 'react';
import { Flag, Heart, MoreVertical, Share2 } from 'lucide-react';
import type { ExploreCardModel } from '../../../explore/exploreCardModel';
import { resolveExploreEntityFollowTarget } from '../../../explore/exploreCardModel';
import { useExploreEntityFollow } from '../../../explore/ui/useExploreEntityFollow';
import { ReportContentDialog } from '../../../components/ui/ReportContentDialog';
import { buildShareText, buildShareUrl } from '../../../utils/share';
import { useListFeedActions } from '../ListFeedActionsProvider';
import { shouldShowListFeedImageCta } from '../../listFeedFooterActions';
import { LIST_FEED } from '../../listFeedTheme';

interface ListFeedPosterOptionsMenuProps {
  card: ExploreCardModel;
}

export const ListFeedPosterOptionsMenu = ({ card }: ListFeedPosterOptionsMenuProps) => {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const { footerModel, onPrimaryFooter } = useListFeedActions();
  const { canFollow, following, busy, toggle } = useExploreEntityFollow(card);
  const followTarget = resolveExploreEntityFollowTarget(card);
  const showFollow = canFollow && followTarget && card.viewerAccess?.level !== 'host';
  const showJoin = shouldShowListFeedImageCta(footerModel(card));
  const reportUserId = card.profileUserId?.trim() ?? card.featuredPerson?.userId?.trim() ?? null;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  const shareNative = async () => {
    const shareUrl = buildShareUrl(card.sharePath);
    const shareBody = buildShareText(card.shareTitle, card.shareText ?? undefined);
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: card.shareTitle, text: shareBody, url: shareUrl });
        setOpen(false);
        return;
      } catch {
        /* fall through */
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareBody}\n${shareUrl}`);
      setOpen(false);
    } catch {
      /* ignore */
    }
  };

  const rowClass =
    'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold text-neutral-900 hover:bg-neutral-50 active:bg-neutral-100';

  return (
    <div ref={rootRef} className="relative z-[3] shrink-0">
      <button
        type="button"
        className={LIST_FEED.menuButton}
        aria-label="Plan options"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <MoreVertical className="h-5 w-5" aria-hidden />
      </button>

      {open ? (
        <div
          id={panelId}
          role="menu"
          className="absolute right-0 top-[calc(100%+0.35rem)] z-[50] min-w-[11.5rem] overflow-hidden rounded-2xl border border-neutral-200/90 bg-white py-1 shadow-[0_12px_40px_rgba(15,23,42,.18)]"
          onClick={(event) => event.stopPropagation()}
        >
          <button type="button" role="menuitem" className={rowClass} onClick={() => void shareNative()}>
            <Share2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            Share
          </button>
          {showFollow ? (
            <button
              type="button"
              role="menuitem"
              disabled={busy}
              className={`${rowClass} disabled:opacity-50`}
              onClick={() => {
                void toggle();
                setOpen(false);
              }}
            >
              <Heart className={`h-4 w-4 shrink-0 text-emerald-600 ${following ? 'fill-current' : ''}`} aria-hidden />
              {following ? 'Following' : 'Follow'}
            </button>
          ) : null}
          {showJoin ? (
            <button
              type="button"
              role="menuitem"
              className={rowClass}
              onClick={() => {
                onPrimaryFooter(card);
                setOpen(false);
              }}
            >
              {footerModel(card).primary.label}
            </button>
          ) : null}
          {reportUserId ? (
            <button
              type="button"
              role="menuitem"
              className={rowClass}
              onClick={() => {
                setOpen(false);
                setReportOpen(true);
              }}
            >
              <Flag className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
              Report
            </button>
          ) : null}
        </div>
      ) : null}

      {reportUserId ? (
        <ReportContentDialog
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          targetType="user"
          targetId={reportUserId}
          title="Report member"
        />
      ) : null}
    </div>
  );
};
