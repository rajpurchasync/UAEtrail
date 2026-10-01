import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/index';
import {
  ConsumerErrorCard,
  ConsumerInlineEmpty,
  ConsumerLoadingSpinner,
} from '../../components/mobile/ConsumerFeedback';
import { EXPLORE_MAP_PATH } from '../../config/platform';
import {
  PRODUCT_EXPLORE_CTA,
  PRODUCT_JOINED_UPCOMING_EMPTY_BODY,
  PRODUCT_JOINED_UPCOMING_EMPTY_TITLE,
  PRODUCT_LOAD_ERROR,
} from '../../content/productNorthStar';
import { useExploreMap } from '../../hooks/useExploreMap';
import {
  buildUpcomingPlanRows,
  type UpcomingPlanRow,
} from '../../utils/activityHubSections';
import { matchesActivitySearch } from '../../utils/activitySearch';
import { ActivitiesSuggestedList } from './ActivitiesSuggestedList';
import { UpcomingPlanCard } from './UpcomingPlanCard';

const upcomingRowMatches = (row: UpcomingPlanRow, query: string) => {
  if (row.kind === 'confirmed') {
    const activity = row.activity;
    return matchesActivitySearch(query, activity.title, activity.locationName);
  }
  const activity = row.request.activity;
  return matchesActivitySearch(query, activity.title, activity.locationName);
};

interface ActivitiesHubViewProps {
  refreshKey?: number;
  searchQuery?: string;
}

export const ActivitiesHubView = ({
  refreshKey = 0,
  searchQuery = '',
}: ActivitiesHubViewProps) => {
  const navigate = useNavigate();
  const { data: mapItems = [], isLoading: mapLoading } = useExploreMap();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myActivityIds, setMyActivityIds] = useState<Set<string>>(new Set());
  const [upcomingPlans, setUpcomingPlans] = useState<ReturnType<typeof buildUpcomingPlanRows>>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getMeActivities(), api.getMeRequests()])
      .then(([activitiesRes, requestsRes]) => {
        setMyActivityIds(new Set(activitiesRes.data.map((activity) => activity.id)));
        setUpcomingPlans(buildUpcomingPlanRows(activitiesRes.data, requestsRes.data));
      })
      .catch((err) => setError(err instanceof Error ? err.message : PRODUCT_LOAD_ERROR))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const peekItems = useMemo(() => {
    const today = new Date(new Date().toDateString());
    return mapItems
      .filter((item) => {
        if (item.source === 'demand') {
          return !item.convertedActivityId;
        }
        const activity = item.activity;
        if (!activity || activity.status !== 'published') return false;
        if (myActivityIds.has(activity.id)) return false;
        return new Date(activity.date) >= today;
      })
      .sort((a, b) => {
        const dateA = a.activity?.date ?? '';
        const dateB = b.activity?.date ?? '';
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      })
      .slice(0, 8);
  }, [mapItems, myActivityIds]);

  const filteredUpcoming = useMemo(
    () => upcomingPlans.filter((row) => upcomingRowMatches(row, searchQuery)),
    [upcomingPlans, searchQuery]
  );

  const hasPeekMatches =
    peekItems.some((item) => {
      const title = item.title ?? item.activity?.title;
      const location = item.subtitle ?? item.activity?.locationName;
      return matchesActivitySearch(searchQuery, title, location);
    }) && !mapLoading;

  if (loading) {
    return <ConsumerLoadingSpinner className="py-16" />;
  }

  return (
    <div className="mt-3 space-y-6 animate-fade-up pb-20 md:pb-0">
      {error && <ConsumerErrorCard message={error} />}

      <section aria-label="Your upcoming plans">
        <h2 className="mb-3 px-0.5 text-sm font-bold text-neutral-900">Your upcoming plans</h2>
        {upcomingPlans.length === 0 ? (
            <ConsumerInlineEmpty
              message={`${PRODUCT_JOINED_UPCOMING_EMPTY_TITLE} — ${PRODUCT_JOINED_UPCOMING_EMPTY_BODY}`}
              actionLabel={PRODUCT_EXPLORE_CTA}
              actionTo={EXPLORE_MAP_PATH}
            />
          ) : filteredUpcoming.length === 0 ? (
            <ConsumerInlineEmpty message="No upcoming plans match your search." />
          ) : (
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none snap-x snap-mandatory">
              {filteredUpcoming.map((row) => (
                <UpcomingPlanCard
                  key={row.kind === 'confirmed' ? row.activity.id : row.request.id}
                  row={row}
                  onClick={() =>
                    navigate(
                      row.kind === 'confirmed'
                        ? `/activity/${row.activity.id}`
                        : `/activity/${row.request.activity.id}`
                    )
                  }
                />
              ))}
            </div>
          )}
      </section>

      <section aria-label="Suggested for you">
          <h2 className="mb-3 px-0.5 text-sm font-bold text-neutral-900">Suggested for you</h2>
          {mapLoading ? (
            <ConsumerLoadingSpinner className="py-10" />
          ) : peekItems.length === 0 ? (
            <ConsumerInlineEmpty
              message="Nothing suggested right now — browse the map for outings near you."
              actionLabel={PRODUCT_EXPLORE_CTA}
              actionTo={EXPLORE_MAP_PATH}
            />
          ) : !hasPeekMatches ? (
            <ConsumerInlineEmpty message="Nothing in suggestions matches your search." />
          ) : (
            <ActivitiesSuggestedList items={peekItems} searchQuery={searchQuery} />
          )}
        </section>
    </div>
  );
};
