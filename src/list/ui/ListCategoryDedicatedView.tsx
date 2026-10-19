import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import type { BrowseMainCategoryKey } from '../browseListTaxonomy';
import { ListCategoryImageFeed } from './ListCategoryImageFeed';

interface ListCategoryDedicatedViewProps {
  category: BrowseMainCategoryKey;
  cards: DiscoveryCardModel[];
}

/** Category feed — result count lives in `ListDiscoveryHeader`. */
export const ListCategoryDedicatedView = ({ category, cards }: ListCategoryDedicatedViewProps) => (
  <div className="w-full">
    <ListCategoryImageFeed cards={cards} category={category} edgeToEdge />
  </div>
);
