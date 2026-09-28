import { useNavigate } from 'react-router-dom';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildExploreCardModel } from '../../explore/exploreCardModel';
import { ExploreListRow } from '../../explore/ui/ExploreListRow';
import { matchesActivitySearch } from '../../utils/activitySearch';

interface ActivitiesSuggestedListProps {
  items: ExploreMapItemDTO[];
  searchQuery?: string;
}

/** Vertical browse list — same rows as the explore map list panel. */
export const ActivitiesSuggestedList = ({ items, searchQuery = '' }: ActivitiesSuggestedListProps) => {
  const navigate = useNavigate();

  const filtered = items.filter((item) => {
    const title = item.title ?? item.activity?.title;
    const location = item.subtitle ?? item.activity?.locationName;
    return matchesActivitySearch(searchQuery, title, location);
  });

  if (filtered.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {filtered.map((item) => {
        const card = buildExploreCardModel(item);
        return (
          <ExploreListRow
            key={item.id}
            card={card}
            onClick={() => navigate(card.path)}
          />
        );
      })}
    </div>
  );
};
