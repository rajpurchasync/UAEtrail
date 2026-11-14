import { Car, Clock, MapPin } from 'lucide-react';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { SecureAvatar } from '../../components/ui/SecureAvatar';
import { EXPLORE_TYPE } from '../../config/exploreTheme';
import { resolveTripBrowseCardCopy } from './tripBrowseCardCopy';
import { DiscoveryBrowsePosterBanner } from '../../discovery/DiscoveryBrowsePosterBanner';
import { BrowseItemLink } from './BrowseItemLink';
import { BrowseCardJoinFooter } from './BrowseCardJoinFooter';
import { DiscoveryCardHostProfileNav } from '../../discovery/DiscoveryCardHostProfileNav';
import { BrowseActivityStatusChips } from './BrowseActivityStatusChips';
import { useListFeedActionsOptional } from '../ui/ListFeedActionsProvider';
import {
  BROWSE_CARD_CHIP,
  BROWSE_CARD_IMAGE,
  BROWSE_CARD_SHELL,
  BrowseCardPhotoShare,
} from './browseCardChrome';

type TripBrowseCardProps = {
  card: DiscoveryCardModel;
  onMapHover?: (exploreItemId: string | null) => void;
};

/** Explore trips bucket — thumbnail card for hosted/seeking activities (`DiscoveryCardModel`). */
export const TripBrowseCard = ({ card, onMapHover }: TripBrowseCardProps) => {
  const listing = resolveTripBrowseCardCopy(card);
  const listActions = useListFeedActionsOptional();
  const joinUiState = listActions?.joinUiStateForCard(card);
  const emitHover = (id: string | null) => onMapHover?.(id);

  return (
    <article
      className={BROWSE_CARD_SHELL}
      onMouseEnter={() => emitHover(card.id)}
      onMouseLeave={() => emitHover(null)}
    >
      <div className="relative">
        <BrowseItemLink
          to={card.path}
          exploreItemId={card.id}
          onMapHover={onMapHover}
          className="group block"
        >
          <DiscoveryBrowsePosterBanner
            card={card}
            imageHoverZoom
            imageHeightClass={BROWSE_CARD_IMAGE}
            showOverlayMeta={false}
            hideHostBand
            embedHostInItemLink
            typeIconBare
            headerActions={<BrowseCardPhotoShare card={card} />}
            overlayContent={
              listing.locationLine || listing.whenLine || listing.price || listing.soldOut ? (
                <div className="flex items-end gap-1.5">
                  <div className="min-w-0 flex-1">
                    {listing.locationLine ? (
                      <p className="flex min-w-0 items-center gap-1 text-[11px] font-semibold leading-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,.45)]">
                        <MapPin className="h-3 w-3 shrink-0 text-emerald-300" aria-hidden />
                        <span className="min-w-0 truncate">{listing.locationLine}</span>
                      </p>
                    ) : null}
                    {listing.whenLine ? (
                      <p className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] font-semibold leading-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,.45)]">
                        <Clock className="h-3 w-3 shrink-0 text-white/85" aria-hidden />
                        <span className="min-w-0 truncate">{listing.whenLine}</span>
                      </p>
                    ) : null}
                    {listing.carpool ? <div className="mt-0.5 h-5" aria-hidden /> : null}
                  </div>
                  {listing.price || listing.soldOut ? (
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {listing.soldOut ? (
                        <span className="rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                          Sold out
                        </span>
                      ) : null}
                      {listing.price ? (
                        <span className="rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-bold leading-none text-neutral-900 shadow-sm">
                          {listing.price}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null
            }
          />
        </BrowseItemLink>
        {listing.carpool ? (
          <BrowseItemLink
            to={listing.carpool.path}
            exploreItemId={listing.carpool.exploreItemId}
            onMapHover={onMapHover}
            className="absolute bottom-2 left-2.5 z-20 inline-flex max-w-[calc(100%-1.25rem)] items-center gap-1 rounded-md bg-sky-700/95 px-1.5 py-0.5 text-[11px] font-semibold text-white shadow-sm ring-1 ring-white/15"
          >
            <Car className="h-3 w-3 shrink-0" aria-hidden />
            <span className="min-w-0 truncate">{listing.carpool.label}</span>
          </BrowseItemLink>
        ) : null}
      </div>
      <BrowseItemLink
        to={card.path}
        exploreItemId={card.id}
        onMapHover={onMapHover}
        className="group flex min-w-0 flex-1 flex-col"
      >
        <div className="flex flex-1 flex-col gap-1.5 px-3 pb-2 pt-2.5">
          <h3 className={`min-w-0 line-clamp-2 text-[15px] font-bold leading-snug ${EXPLORE_TYPE.title}`}>
            {listing.title}
          </h3>
          {listing.hostName ? (
            <DiscoveryCardHostProfileNav
              card={card}
              embedInItemLink
              ariaLabel={`View ${listing.hostName} profile`}
              className="flex min-w-0 items-center gap-1.5 text-left text-[12px] font-medium text-neutral-600 hover:text-emerald-800"
            >
              <SecureAvatar
                src={listing.hostAvatar}
                name={listing.hostName}
                className="h-5 w-5 shrink-0 text-[8px] ring-1 ring-white"
              />
              <span className="min-w-0 truncate underline decoration-neutral-300 underline-offset-2">
                {listing.hostName}
              </span>
            </DiscoveryCardHostProfileNav>
          ) : null}
          <BrowseActivityStatusChips card={card} joinUiState={joinUiState} />
          {listing.factLabels.length > 0 ? (
            <ul className="flex flex-wrap gap-1">
              {listing.factLabels.map((label) => (
                <li key={label} className={BROWSE_CARD_CHIP}>
                  {label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </BrowseItemLink>
      <BrowseCardJoinFooter card={card} />
    </article>
  );
};