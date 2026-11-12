import { CalendarDays, MapPin, Star } from 'lucide-react';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { DirectionsControl } from '../../components/ui/DirectionsControl';
import { EXPLORE_TYPE } from '../../config/exploreTheme';
import { ExploreWishlistSaveButton } from '../../explore/ui/ExploreWishlistSaveButton';
import {
  LIST_FEED_CTA_GET_DIRECTIONS,
  LIST_FEED_CTA_WISHLIST,
  LIST_FEED_CTA_WISHLIST_SAVED,
} from '../listFeedCtaCopy';
import {
  resolveListVenueListingCopy,
  type ListVenueListingRating,
} from '../listVenuePosterPresentation';
import { DiscoveryBrowsePosterBanner } from './DiscoveryBrowsePosterBanner';
import { ListExplorerItemLink } from './ListExplorerItemLink';
import {
  LIST_EXPLORER_LISTING_CHIP,
  LIST_EXPLORER_LISTING_FOOTER,
  LIST_EXPLORER_LISTING_IMAGE,
  LIST_EXPLORER_LISTING_PRIMARY_CTA,
  LIST_EXPLORER_LISTING_SHELL,
  ListExplorerListingPhotoShare,
} from './listExplorerListingChrome';

type ListExplorerVenueListingCardProps = {
  card: DiscoveryCardModel;
  onMapHover?: (exploreItemId: string | null) => void;
};

const TitleRating = ({ rating }: { rating: ListVenueListingRating }) => (
  <p
    className="mt-0.5 flex shrink-0 items-center gap-0.5 text-[12px] font-semibold tabular-nums text-neutral-800"
    aria-label={`${rating.average.toFixed(1)} out of 5 from ${rating.count} rating${rating.count === 1 ? '' : 's'}`}
  >
    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
    <span>{rating.average.toFixed(1)}</span>
    <span className="font-medium text-neutral-500">({rating.count})</span>
  </p>
);

/**
 * Catalogue listing: photo is where; body is the place name + rating;
 * overlay trip chip opens the next hosted outing (not nested in the venue link).
 */
export const ListExplorerVenueListingCard = ({
  card,
  onMapHover,
}: ListExplorerVenueListingCardProps) => {
  const listing = resolveListVenueListingCopy(card);
  const emitHover = (id: string | null) => onMapHover?.(id);
  const tripHref = listing.scheduleHint ? listing.schedulePath : null;

  return (
    <article
      className={LIST_EXPLORER_LISTING_SHELL}
      onMouseEnter={() => emitHover(card.id)}
      onMouseLeave={() => emitHover(null)}
    >
      <div className="relative">
        <ListExplorerItemLink
          to={card.path}
          exploreItemId={card.id}
          onMapHover={onMapHover}
          className="group block"
        >
          <DiscoveryBrowsePosterBanner
            card={card}
            showDistance={false}
            imageHoverZoom
            imageHeightClass={LIST_EXPLORER_LISTING_IMAGE}
            showOverlayMeta={false}
            typeIconBare
            headerActions={<ListExplorerListingPhotoShare card={card} />}
            overlayContent={
              listing.locationLine || listing.scheduleHint ? (
                <div className="min-w-0">
                  {listing.locationLine ? (
                    <p className="flex min-w-0 items-center gap-1 text-[11px] font-semibold leading-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,.45)]">
                      <MapPin className="h-3 w-3 shrink-0 text-emerald-300" aria-hidden />
                      <span className="min-w-0 truncate">
                        {listing.regionLabel && listing.hubLabel ? (
                          <>
                            {listing.regionLabel}
                            <span className="text-white/70"> · </span>
                            {listing.hubLabel}
                          </>
                        ) : (
                          listing.locationLine
                        )}
                      </span>
                    </p>
                  ) : null}
                  {listing.scheduleHint ? <div className="mt-0.5 h-5" aria-hidden /> : null}
                </div>
              ) : null
            }
          />
        </ListExplorerItemLink>
        {listing.scheduleHint ? (
          tripHref ? (
            <ListExplorerItemLink
              to={tripHref}
              exploreItemId={listing.scheduleExploreItemId}
              onMapHover={onMapHover}
              className="absolute bottom-2 left-2.5 z-20 inline-flex max-w-[calc(100%-1.25rem)] items-center gap-1 rounded-md bg-emerald-700/95 px-1.5 py-0.5 text-[11px] font-semibold text-white shadow-sm ring-1 ring-white/15"
            >
              <CalendarDays className="h-3 w-3 shrink-0" aria-hidden />
              <span className="min-w-0 truncate">{listing.scheduleHint}</span>
            </ListExplorerItemLink>
          ) : (
            <p className="absolute bottom-2 left-2.5 z-10 flex max-w-[calc(100%-1.25rem)] items-center gap-1 text-[11px] font-semibold text-emerald-200 [text-shadow:0_1px_2px_rgba(0,0,0,.45)]">
              <CalendarDays className="h-3 w-3 shrink-0" aria-hidden />
              <span className="min-w-0 truncate">{listing.scheduleHint}</span>
            </p>
          )
        ) : null}
      </div>
      <ListExplorerItemLink
        to={card.path}
        exploreItemId={card.id}
        onMapHover={onMapHover}
        className="group flex min-w-0 flex-1 flex-col"
      >
        <div className="flex flex-1 flex-col gap-1.5 px-3 pb-2 pt-2.5">
          <div className="flex min-w-0 items-start gap-2">
            <h3 className={`min-w-0 flex-1 line-clamp-2 text-[15px] font-bold leading-snug ${EXPLORE_TYPE.title}`}>
              {listing.title}
            </h3>
            {listing.rating ? <TitleRating rating={listing.rating} /> : null}
          </div>
          {listing.factLabels.length > 0 ? (
            <ul className="flex flex-wrap gap-1">
              {listing.factLabels.map((label) => (
                <li
                  key={label}
                  className={LIST_EXPLORER_LISTING_CHIP}
                >
                  {label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </ListExplorerItemLink>
      {listing.hasDirections || listing.canWishlist ? (
        <div className={LIST_EXPLORER_LISTING_FOOTER}>
          {listing.hasDirections && card.mapLatitude != null && card.mapLongitude != null ? (
            <DirectionsControl
              lat={card.mapLatitude}
              lng={card.mapLongitude}
              variant="button"
              label={LIST_FEED_CTA_GET_DIRECTIONS}
              className="min-w-0 flex-1"
              buttonClassName={LIST_EXPLORER_LISTING_PRIMARY_CTA}
              showAppPickerAffordance={false}
            />
          ) : null}
          {listing.canWishlist ? (
            <ExploreWishlistSaveButton
              card={card}
              variant="cta"
              compact
              idleLabel={LIST_FEED_CTA_WISHLIST}
              savedLabel={LIST_FEED_CTA_WISHLIST_SAVED}
            />
          ) : null}
        </div>
      ) : null}
    </article>
  );
};
