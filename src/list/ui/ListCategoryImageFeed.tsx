import type { ExploreCardModel } from '../../explore/exploreCardModel';
import type { BrowseMainCategoryKey } from '../browseListTaxonomy';
import { LIST_FEED } from '../listFeedTheme';
import { ListFeedPosterCard } from './feed/ListFeedPosterCard';
import { ListFeedVenuePosterCard } from './feed/ListFeedVenuePosterCard';

interface ListCategoryImageFeedProps {
  cards: ExploreCardModel[];
  category?: BrowseMainCategoryKey;
  edgeToEdge?: boolean;
}

/** Instagram-style vertical feed — category pages only (join / share / publisher). */
export const ListCategoryImageFeed = ({ cards, category, edgeToEdge = false }: ListCategoryImageFeedProps) => (
  <ul className={edgeToEdge ? LIST_FEED.categoryList : LIST_FEED.list}>
    {cards.map((card) => (
      <li key={card.id}>
        {category === 'venues' || card.source === 'venue' ? (
          <ListFeedVenuePosterCard card={card} edgeToEdge={edgeToEdge} />
        ) : (
          <ListFeedPosterCard card={card} edgeToEdge={edgeToEdge} />
        )}
      </li>
    ))}
  </ul>
);
