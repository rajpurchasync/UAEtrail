import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import type { BrowseMainCategoryKey } from '../browseListTaxonomy';
import { LIST_CHROME } from '../listChromeTheme';
import { buildListDiscoverRails, type ListDiscoverRail } from '../listDiscoverRails';
import { ListDiscoverCategoryNavigateRow } from './ListDiscoverCategoryNavigateRow';
import { ListDiscoverRailPreviewCard } from './ListDiscoverRailPreviewCard';

interface ListDiscoverHomeProps {
  cards: DiscoveryCardModel[];
  mapItems: ExploreMapItemDTO[];
  onOpenCategory: (key: BrowseMainCategoryKey, patch?: { placeTopics?: import('../listVenuePlaceTopics').ListVenuePlaceTopicKey[] }) => void;
}

const RAIL_SCROLL =
  'flex gap-3 overflow-x-auto pb-1 scroll-smooth snap-x snap-mandatory [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

const DiscoverRailSection = ({
  rail,
  onSeeAll,
}: {
  rail: ListDiscoverRail;
  onSeeAll: () => void;
}) => (
  <section className="space-y-2.5" aria-labelledby={`list-rail-${rail.id}`}>
    <div className="flex items-end justify-between gap-2">
      <h3 id={`list-rail-${rail.id}`} className="text-[15px] font-bold tracking-tight text-neutral-900">
        {rail.title}
      </h3>
      <button
        type="button"
        onClick={onSeeAll}
        className="shrink-0 text-sm font-semibold text-emerald-700 active:opacity-80"
      >
        See all
      </button>
    </div>
    <div className={RAIL_SCROLL}>
      {rail.items.map((card) => (
        <ListDiscoverRailPreviewCard key={card.id} card={card} />
      ))}
    </div>
  </section>
);

export const ListDiscoverHome = ({ cards, mapItems, onOpenCategory }: ListDiscoverHomeProps) => {
  const rails = buildListDiscoverRails(cards, mapItems);

  return (
    <div className="space-y-6">
      <div className={`${LIST_CHROME.chromeBorder} pb-6`}>
        <ListDiscoverCategoryNavigateRow onOpenCategory={onOpenCategory} />
      </div>

      {rails.length > 0 ? (
        <div className="space-y-6">
          {rails.map((rail) => (
            <DiscoverRailSection
              key={rail.id}
              rail={rail}
              onSeeAll={() =>
                rail.id === 'shops'
                  ? onOpenCategory('venues', { placeTopics: ['shop'] })
                  : onOpenCategory(rail.id)
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};
