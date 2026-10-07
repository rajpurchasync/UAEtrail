import type { ExploreCardModel } from '../../explore/exploreCardModel';
import type { BrowseMainCategoryKey } from '../browseListTaxonomy';
import { ListCategoryImageFeed } from './ListCategoryImageFeed';

interface ListCategoryDedicatedViewProps {
  category: BrowseMainCategoryKey;
  cards: ExploreCardModel[];
}

/** Category feed — result count lives in `ListDiscoveryHeader`. */
export const ListCategoryDedicatedView = ({ category, cards }: ListCategoryDedicatedViewProps) => (
  <div className="w-full">
    <ListCategoryImageFeed cards={cards} category={category} edgeToEdge />
  </div>
);
