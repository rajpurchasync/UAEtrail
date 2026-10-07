import type { ExploreCardModel } from '../../../explore/exploreCardModel';
import { LIST_FEED } from '../../listFeedTheme';
import { resolveCatalogVenueKindLabel } from '../../listVenuePosterPresentation';
import { ListFeedCatalogRatingBadge } from '../poster/ListFeedCatalogRatingBadge';

/** Above-image row — location name + venue kind (left), rating (right). Mirrors activity host header. */
export const ListFeedCatalogEntityHeader = ({
  card,
  name,
}: {
  card: ExploreCardModel;
  name: string;
}) => {
  const kindLabel = resolveCatalogVenueKindLabel(card);

  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-3">
      <span className="min-w-0 flex-1">
        <span className={LIST_FEED.publisherName}>{name}</span>
        {kindLabel ? <span className={`mt-0.5 block ${LIST_FEED.publisherType}`}>{kindLabel}</span> : null}
      </span>
      <ListFeedCatalogRatingBadge card={card} />
    </div>
  );
};
