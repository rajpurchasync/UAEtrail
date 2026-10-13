import type { ExploreCardModel } from '../../../explore/exploreCardModel';
import { LIST_FEED } from '../../listFeedTheme';
import { resolveCatalogHeaderAreaLocationLine } from '../../listVenuePosterPresentation';
import { ListFeedCatalogRatingBadge } from '../poster/ListFeedCatalogRatingBadge';

/** Above-image row — place name + area/location (left), rating (right). Mirrors activity host header. */
export const ListFeedCatalogEntityHeader = ({
  card,
  name,
}: {
  card: ExploreCardModel;
  name: string;
}) => {
  const areaLocationLine = resolveCatalogHeaderAreaLocationLine(card);

  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-3">
      <span className="min-w-0 flex-1">
        <span className={LIST_FEED.publisherName}>{name}</span>
        {areaLocationLine ? (
          <span className={`mt-0.5 block ${LIST_FEED.publisherType}`}>{areaLocationLine}</span>
        ) : null}
      </span>
      <ListFeedCatalogRatingBadge card={card} />
    </div>
  );
};
