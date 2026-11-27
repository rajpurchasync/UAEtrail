import { Star } from 'lucide-react';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { EXPLORE_TYPE } from '../../config/exploreTheme';
import { resolveVenueBrowseCardCopy, type VenueBrowseCardRating } from './venueBrowseCardCopy';
import { BrowseItemLink, browseCardHoverPoint } from './BrowseItemLink';
import { BROWSE_CARD_BODY, BROWSE_CARD_SHELL } from './browseCardChrome';
import { DiscoveryBrowseListEngagementFooter } from '../../discovery/DiscoveryBrowseListEngagementFooter';
import { DiscoveryBrowseCardHero } from '../../discovery/browse/DiscoveryBrowseCardHero';
import { DiscoveryBrowseCardMetaSlot } from '../../discovery/browse/DiscoveryBrowseCardMetaSlot';
import { DiscoveryBrowseCardChipRow } from '../../discovery/browse/DiscoveryBrowseCardChipRow';
import { DiscoveryBrowseCardScheduleRow } from '../../discovery/browse/DiscoveryBrowseCardScheduleRow';

type VenueBrowseCardProps = {
  card: DiscoveryCardModel;
  onMapHover?: (exploreItemId: string | null) => void;
};

const TitleRating = ({ rating }: { rating: VenueBrowseCardRating }) => (
  <p
    className="mt-0.5 flex shrink-0 items-center gap-0.5 text-[12px] font-semibold tabular-nums text-neutral-800"
    aria-label={`${rating.average.toFixed(1)} out of 5 from ${rating.count} rating${rating.count === 1 ? '' : 's'}`}
  >
    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
    <span>{rating.average.toFixed(1)}</span>
    <span className="font-medium text-neutral-500">({rating.count})</span>
  </p>
);

/** Explore venues bucket — thumbnail card for places and shops. */
export const VenueBrowseCard = ({ card, onMapHover }: VenueBrowseCardProps) => {
  const listing = resolveVenueBrowseCardCopy(card);
  const hoverPoint = browseCardHoverPoint(card);
  const emitHover = (id: string | null) => onMapHover?.(id);

  return (
    <article
      className={BROWSE_CARD_SHELL}
      onMouseEnter={() => emitHover(card.id)}
      onMouseLeave={() => emitHover(null)}
    >
      <BrowseItemLink
        to={card.path}
        exploreItemId={card.id}
        mapPoint={hoverPoint}
        onMapHover={onMapHover}
        className="group block"
      >
        <DiscoveryBrowseCardHero card={card} hideHostBand />
      </BrowseItemLink>
      <div className={BROWSE_CARD_BODY}>
        <BrowseItemLink
          to={card.path}
          exploreItemId={card.id}
          mapPoint={hoverPoint}
          onMapHover={onMapHover}
          className="group flex min-w-0 items-start gap-2"
        >
          <h3 className={`min-w-0 flex-1 line-clamp-2 text-[15px] font-bold leading-snug ${EXPLORE_TYPE.title}`}>
            {listing.title}
          </h3>
          {listing.rating ? <TitleRating rating={listing.rating} /> : null}
        </BrowseItemLink>
        {listing.metaLine ? (
          <DiscoveryBrowseCardMetaSlot
            line={listing.metaLine}
            href={listing.metaHref}
            onMapHover={onMapHover}
          />
        ) : null}
        {listing.scheduleHint ? (
          <DiscoveryBrowseCardScheduleRow
            hint={listing.scheduleHint}
            path={listing.schedulePath}
            exploreItemId={listing.scheduleExploreItemId}
            onMapHover={onMapHover}
          />
        ) : null}
        <BrowseItemLink
          to={card.path}
          exploreItemId={card.id}
          mapPoint={hoverPoint}
          onMapHover={onMapHover}
          className="group block min-w-0"
        >
          <DiscoveryBrowseCardChipRow labels={listing.visibleFactLabels} maxVisible={3} />
        </BrowseItemLink>
      </div>
      <DiscoveryBrowseListEngagementFooter card={card} />
    </article>
  );
};