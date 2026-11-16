import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { EXPLORE_TYPE } from '../../config/exploreTheme';
import { resolveTripBrowseCardCopy } from './tripBrowseCardCopy';
import { BrowseItemLink } from './BrowseItemLink';
import { DiscoveryBrowseListEngagementFooter } from '../../discovery/DiscoveryBrowseListEngagementFooter';
import { DiscoveryCardHostedByRow } from '../../discovery/DiscoveryCardHostedByRow';
import { BrowseActivityStatusChips } from './BrowseActivityStatusChips';
import { useListFeedActionsOptional } from '../ui/ListFeedActionsProvider';
import { BROWSE_CARD_BODY, BROWSE_CARD_SHELL } from './browseCardChrome';
import { DiscoveryBrowseCardHero } from '../../discovery/browse/DiscoveryBrowseCardHero';
import { DiscoveryBrowseCardMetaSlot } from '../../discovery/browse/DiscoveryBrowseCardMetaSlot';
import { DiscoveryBrowseCardChipRow } from '../../discovery/browse/DiscoveryBrowseCardChipRow';
import { DiscoveryBrowseCardCarpoolRow } from '../../discovery/browse/DiscoveryBrowseCardCarpoolRow';

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

  const cornerBadges =
    listing.soldOut || listing.price ? (
      <>
        {listing.soldOut ? (
          <span className="pointer-events-auto rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            Sold out
          </span>
        ) : null}
        {listing.price ? (
          <span className="pointer-events-auto rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-bold leading-none text-neutral-900 shadow-sm">
            {listing.price}
          </span>
        ) : null}
      </>
    ) : null;

  return (
    <article
      className={BROWSE_CARD_SHELL}
      onMouseEnter={() => emitHover(card.id)}
      onMouseLeave={() => emitHover(null)}
    >
      <BrowseItemLink
        to={card.path}
        exploreItemId={card.id}
        onMapHover={onMapHover}
        className="group block"
      >
        <DiscoveryBrowseCardHero card={card} hideHostBand cornerBadges={cornerBadges} />
      </BrowseItemLink>
      <div className={BROWSE_CARD_BODY}>
        <BrowseItemLink
          to={card.path}
          exploreItemId={card.id}
          onMapHover={onMapHover}
          className="group block min-w-0"
        >
          <h3 className={`min-w-0 line-clamp-2 text-[15px] font-bold leading-snug ${EXPLORE_TYPE.title}`}>
            {listing.title}
          </h3>
        </BrowseItemLink>
        {listing.metaLine ? (
          <DiscoveryBrowseCardMetaSlot
            line={listing.metaLine}
            href={listing.metaHref}
            onMapHover={onMapHover}
          />
        ) : null}
        <BrowseItemLink
          to={card.path}
          exploreItemId={card.id}
          onMapHover={onMapHover}
          className="group block min-w-0"
        >
          {listing.hostName ? (
            <DiscoveryCardHostedByRow
              card={card}
              embedInItemLink
              mapPeekCompact
              className="text-neutral-600"
            />
          ) : null}
          <BrowseActivityStatusChips card={card} joinUiState={joinUiState} />
        </BrowseItemLink>
        {listing.carpool ? (
          <DiscoveryBrowseCardCarpoolRow
            label={listing.carpool.label}
            path={listing.carpool.path}
            exploreItemId={listing.carpool.exploreItemId}
            onMapHover={onMapHover}
          />
        ) : null}
        <BrowseItemLink
          to={card.path}
          exploreItemId={card.id}
          onMapHover={onMapHover}
          className="group block min-w-0"
        >
          <DiscoveryBrowseCardChipRow
            labels={listing.placeLogisticsLabels}
            tone="logistics"
            maxVisible={2}
            ariaLabel="Trail access"
          />
          <DiscoveryBrowseCardChipRow labels={listing.visibleFactLabels} maxVisible={3} />
        </BrowseItemLink>
      </div>
      <DiscoveryBrowseListEngagementFooter card={card} />
    </article>
  );
};