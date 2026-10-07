import { LIST_FEED } from '../../listFeedTheme';
import { ListPosterRatingLine } from './ListPosterRatingLine';
import type { ExploreCardModel } from '../../../explore/exploreCardModel';

/** Top-of-image identity — venue / shop name + community rating (activity host-row analogue). */
export const ListPosterCatalogHeroHeader = ({
  name,
  card,
}: {
  name: string;
  card: ExploreCardModel;
}) => {
  const shadow = LIST_FEED.overlayTextShadow;
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 z-[3] bg-gradient-to-b from-black/55 via-black/20 to-transparent px-4 pb-5 pt-3 text-center ${shadow}`}
    >
      <p className="line-clamp-2 text-[15px] font-bold leading-snug text-white sm:text-base">{name}</p>
      <ListPosterRatingLine card={card} />
    </div>
  );
};
