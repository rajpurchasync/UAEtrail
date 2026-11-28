import { Bookmark } from 'lucide-react';
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { ProductNavLink } from '../components/navigation/ProductNavLink';
import { resolveTripBrowseCardCopy } from '../list/browse/tripBrowseCardCopy';
import { useExploreWishlistSave } from '../explore/ui/useExploreWishlistSave';
import {
  MEMBER_HOME_CARPOOL_OPEN,
  MEMBER_HOME_HOST_PREFIX,
  MEMBER_HOME_JOIN_TRIP,
  MEMBER_HOME_REQUEST_TO_JOIN,
  memberHomeKindChip,
} from './memberHomeCopy';

type HomeJoinCardProps = {
  card: DiscoveryCardModel;
};

export const HomeJoinCard = ({ card }: HomeJoinCardProps) => {
  const listing = resolveTripBrowseCardCopy(card);
  const wishlist = useExploreWishlistSave(card);
  const kind = memberHomeKindChip(card.kind);
  const joinLabel = /request/i.test(card.primaryCta)
    ? MEMBER_HOME_REQUEST_TO_JOIN
    : MEMBER_HOME_JOIN_TRIP;

  return (
    <article className="rounded-[1.35rem] border border-white bg-white p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {kind ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                {kind}
              </span>
            ) : null}
            {listing.carpool ? (
              <span className="text-[12px] font-semibold text-orange-600">{MEMBER_HOME_CARPOOL_OPEN}</span>
            ) : null}
          </div>
          <ProductNavLink to={card.path} className="block">
            <h3 className="text-[17px] font-bold leading-snug text-neutral-900">{listing.title}</h3>
            {listing.metaLine ? (
              <p className="mt-0.5 text-[13px] text-neutral-500">{listing.metaLine}</p>
            ) : null}
          </ProductNavLink>
        </div>
        {wishlist.canSave ? (
          <button
            type="button"
            onClick={() => void wishlist.toggle()}
            disabled={wishlist.busy}
            className="shrink-0 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-50"
            aria-label={wishlist.saved ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Bookmark
              className={`h-5 w-5 ${wishlist.saved ? 'fill-emerald-700 text-emerald-700' : ''}`}
              strokeWidth={2}
            />
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-[13px] text-neutral-600">
          {listing.hostName ? (
            <>
              <span className="text-neutral-400">{MEMBER_HOME_HOST_PREFIX} </span>
              <span className="font-semibold text-neutral-800">{listing.hostName}</span>
            </>
          ) : null}
          {listing.hostName && card.spotsLabel ? ' · ' : null}
          {card.spotsLabel ? <span className="font-semibold text-orange-700">{card.spotsLabel}</span> : null}
        </p>
        {card.showJoinActions && !listing.soldOut ? (
          <ProductNavLink
            to={card.path}
            className="shrink-0 rounded-full bg-neutral-950 px-3.5 py-2 text-[13px] font-bold text-white"
          >
            {joinLabel}
          </ProductNavLink>
        ) : null}
      </div>
    </article>
  );
};
