import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';

import { browseListResultsFoundLabel } from '../browseListCopy';

import { ListCategoryImageFeed } from './ListCategoryImageFeed';



interface ListDiscoveryResultsProps {

  cards: DiscoveryCardModel[];

  showClearAll: boolean;

  onClearAll: () => void;

  /** When search is places-only, venue posters + topic pills align with Places category. */
  placesOnly?: boolean;

}



export const ListDiscoveryResults = ({
  cards,
  showClearAll,
  onClearAll,
  placesOnly = false,
}: ListDiscoveryResultsProps) => (

  <div className="space-y-5 pt-1">

    <div className="flex flex-wrap items-center justify-between gap-2">

      <p className="text-sm font-semibold tabular-nums text-neutral-700">{browseListResultsFoundLabel(cards.length)}</p>

      {showClearAll ? (

        <button type="button" onClick={onClearAll} className="text-sm font-semibold text-emerald-700">

          Clear all

        </button>

      ) : null}

    </div>



    <ListCategoryImageFeed cards={cards} category={placesOnly ? 'venues' : undefined} />

  </div>

);


