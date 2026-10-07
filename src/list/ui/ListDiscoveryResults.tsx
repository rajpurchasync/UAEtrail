import type { ExploreCardModel } from '../../explore/exploreCardModel';
import { browseListResultsFoundLabel } from '../browseListCopy';
import { ListFeedPosterCard } from './feed/ListFeedPosterCard';

interface ListDiscoveryResultsProps {
  cards: ExploreCardModel[];
  chipsCount: number;
  onClearAll: () => void;
}

export const ListDiscoveryResults = ({ cards, chipsCount, onClearAll }: ListDiscoveryResultsProps) => (
  <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm font-semibold tabular-nums text-neutral-700">{browseListResultsFoundLabel(cards.length)}</p>
      {chipsCount > 0 ? (
        <button type="button" onClick={onClearAll} className="text-sm font-semibold text-emerald-700">
          Clear all
        </button>
      ) : null}
    </div>

    <ul className="flex flex-col gap-8">
      {cards.map((card) => (
        <li key={card.id}>
          <ListFeedPosterCard card={card} variant="feed" />
        </li>
      ))}
    </ul>
  </div>
);
