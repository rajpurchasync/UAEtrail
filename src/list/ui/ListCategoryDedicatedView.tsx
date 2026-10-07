import type { ExploreCardModel } from '../../explore/exploreCardModel';
import type { BrowseMainCategoryKey } from '../browseListTaxonomy';
import { listCategoryResultsLabel } from '../listCategoryCopy';
import { ListCategoryImageFeed } from './ListCategoryImageFeed';

interface ListCategoryDedicatedViewProps {
  category: BrowseMainCategoryKey;
  cards: ExploreCardModel[];
}

export const ListCategoryDedicatedView = ({ category, cards }: ListCategoryDedicatedViewProps) => (
  <div className="w-full">
    <p className="mb-4 mt-1 px-4 text-sm font-medium text-neutral-700 md:mt-2 md:px-0">
      {listCategoryResultsLabel(cards.length, category)}
    </p>
    <ListCategoryImageFeed cards={cards} edgeToEdge />
  </div>
);
