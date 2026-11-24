import { Heart } from 'lucide-react';
import type { MouseEvent } from 'react';
import { UiTooltip } from '../../components/ui/UiTooltip';
import {
  PLACE_PEEK_FOOTER_TRIP_ALERTS,
  PLACE_PEEK_FOOTER_TRIP_ALERTS_ON,
} from '../../content/placePeekCopy';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { useExploreWishlistSave } from './useExploreWishlistSave';
import {
  CONSUMER_FLOATING_NOTICE_POS,
  CONSUMER_SURFACE_TYPE,
} from '../../config/consumerSurfaceTypography';

interface ExploreWishlistSaveButtonProps {
  card: DiscoveryCardModel;
  light?: boolean;
  bare?: boolean;
  /** Labeled listing CTA — same save store, visible “Add to Wishlist” copy. */
  variant?: 'icon' | 'cta';
  idleLabel?: string;
  savedLabel?: string;
  /** One-row listing footer — shorter control. */
  compact?: boolean;
}

const WishlistNotice = ({
  notice,
  tone,
}: {
  notice: string | null;
  tone: 'light' | 'dark';
}) =>
  notice ? (
    <p
      role="status"
      className={`${CONSUMER_FLOATING_NOTICE_POS} ${CONSUMER_SURFACE_TYPE.tooltip} ${
        tone === 'light' ? 'bg-white/95 text-neutral-800' : 'bg-white text-neutral-700'
      }`}
    >
      {notice}
    </p>
  ) : null;

/** Save to Plan wishlist (`GET /me/wishlist`) — same store as Plan → Saved. */
export const ExploreWishlistSaveButton = ({
  card,
  light = false,
  bare = false,
  variant = 'icon',
  idleLabel,
  savedLabel,
  compact = false,
}: ExploreWishlistSaveButtonProps) => {
  const { canSave, saved, busy, notice, toggle } = useExploreWishlistSave(card);

  if (card.viewerAccess?.level === 'host' || !canSave) return null;

  const saveLabel = saved
    ? savedLabel ?? PLACE_PEEK_FOOTER_TRIP_ALERTS_ON
    : idleLabel ?? PLACE_PEEK_FOOTER_TRIP_ALERTS;

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void toggle();
  };

  if (variant === 'cta') {
    return (
      <div className="relative min-w-0 flex-1">
        <button
          type="button"
          disabled={busy}
          onClick={handleToggle}
          className={
            compact
              ? 'inline-flex h-9 w-full items-center justify-center gap-1 whitespace-nowrap rounded-[8px] border border-neutral-200 bg-white px-2 text-[12px] font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-60'
              : 'inline-flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-neutral-200 bg-white px-3 text-[13px] font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-60'
          }
          aria-label={saveLabel}
          aria-pressed={saved}
        >
          <Heart
            className={`h-4 w-4 shrink-0 ${saved ? 'fill-emerald-700 text-emerald-700' : 'text-neutral-700'}`}
            strokeWidth={2.25}
            aria-hidden
          />
          <span>{saveLabel}</span>
        </button>
        <WishlistNotice notice={notice} tone="light" />
      </div>
    );
  }

  const shell = bare
    ? 'text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)] hover:opacity-90'
    : light
      ? 'bg-neutral-100 text-gray-700 hover:bg-neutral-200'
      : 'bg-black/35 text-white backdrop-blur-sm hover:bg-black/45';

  return (
    <div className="relative shrink-0">
      <UiTooltip label={saveLabel}>
        <button
          type="button"
          disabled={busy}
          onClick={handleToggle}
          className={`inline-flex h-9 w-9 items-center justify-center disabled:opacity-60 ${bare ? '' : 'rounded-full'} ${shell}`}
          aria-label={saveLabel}
          aria-pressed={saved}
        >
          <Heart
            className={`h-[1.125rem] w-[1.125rem] ${saved ? 'fill-current text-emerald-700' : ''}`}
            strokeWidth={2.25}
            aria-hidden
          />
        </button>
      </UiTooltip>
      <WishlistNotice notice={notice} tone={bare || light ? 'light' : 'dark'} />
    </div>
  );
};
