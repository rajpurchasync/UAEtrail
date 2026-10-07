import type { ExploreCardModel } from '../../explore/exploreCardModel';
import { LIST_FEED } from '../listFeedTheme';
import { ListFeedPosterCard } from './feed/ListFeedPosterCard';

interface ListCategoryImageFeedProps {
  cards: ExploreCardModel[];
  edgeToEdge?: boolean;
}

/** Instagram-style vertical feed for Trips · Venues · Shops category pages. */
export const ListCategoryImageFeed = ({ cards, edgeToEdge = false }: ListCategoryImageFeedProps) => (
  <ul className={edgeToEdge ? LIST_FEED.categoryList : LIST_FEED.list}>
    {cards.map((card) => (
      <li key={card.id}>
        <ListFeedPosterCard card={card} edgeToEdge={edgeToEdge} />
      </li>
    ))}
  </ul>
);
