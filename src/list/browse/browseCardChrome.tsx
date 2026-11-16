import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { ShareButton } from '../../components/ui/ShareButton';

/** Trips + venues thumbnail browse cards — shared shell tokens. */
export const BROWSE_CARD_SHELL =
  'rounded-xl flex h-full flex-col overflow-hidden border border-neutral-200 bg-white shadow-[0_1px_4px_rgba(15,23,42,.05)]';

export const BROWSE_CARD_IMAGE = 'aspect-[3/2] w-full shrink-0';

export const BROWSE_CARD_BODY = 'flex flex-1 flex-col gap-2 px-3 pb-2 pt-2.5';

export const BROWSE_CARD_FOOTER = 'mt-auto flex gap-2 border-t border-neutral-100 px-3 py-2';

export const BROWSE_CARD_PRIMARY_CTA =
  'flex h-9 w-full flex-1 items-center justify-center gap-1 rounded-[8px] bg-emerald-700 px-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-emerald-800 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-70';

export const BROWSE_CARD_CHIP =
  'rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-medium leading-tight text-neutral-700';

export const BrowseCardPhotoShare = ({ card }: { card: DiscoveryCardModel }) =>
  card.sharePath ? (
    <ShareButton
      title={card.shareTitle}
      text={card.shareText ?? undefined}
      path={card.sharePath}
      iconOnly
      iconClassName="h-3.5 w-3.5"
    />
  ) : null;