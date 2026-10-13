import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJoinedUpcomingPlanData } from '../../hooks/useJoinedUpcomingPlanData';
import { exploreMapItemIsSeeking } from '@uaetrail/shared-types';
import {
  ConsumerErrorCard,
  ConsumerInlineEmpty,
  ConsumerLoadingSpinner,
} from '../../components/mobile/ConsumerFeedback';

import {
  PRODUCT_EXPLORE_CTA,
  PRODUCT_JOINED_UPCOMING_EMPTY_BODY,
  PRODUCT_JOINED_UPCOMING_EMPTY_TITLE,
} from '../../content/productNorthStar';
import { useExploreMap } from '../../hooks/useExploreMap';
import { useAuth } from '../../context/AuthContext';
import { viewerIsActivityHostUser } from '../../utils/viewerHostsActivity';
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
  const { user } = useAuth();
  const { data: mapItems = [], isLoading: mapLoading } = useExploreMap();
  const {
    activities,
    requests,
    loading,
    error: loadError,
  } = useJoinedUpcomingPlanData(true, refreshKey);
  const error = loadError ?? null;

  const myActivityIds = useMemo(
    () => new Set(activities.map((activity) => activity.id)),
    [activities]
  );
  const upcomingPlans = useMemo(
    () => buildUpcomingPlanRows(activities, requests),
    [activities, requests]
  );

  const peekItems = useMemo(() => {
    const today = new Date(new Date().toDateString());
    return mapItems
      .filter((item) => {
        if (exploreMapItemIsSeeking(item)) {
          return !item.convertedActivityId;
        }
        const activity = item.activity;
        if (!activity || activity.status !== 'published') return false;
        if (myActivityIds.has(activity.id)) return false;
        if (viewerIsActivityHostUser(activity, user?.id)) {
          return false;
        }
        return new Date(activity.date) >= today;
      })
      .sort((a, b) => {
        const dateA = a.activity?.date ?? '';
        const dateB = b.activity?.date ?? '';
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      })
      .slice(0, 8);
  }, [mapItems, myActivityIds, user?.id]);

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
    <div className="space-y-6 animate-fade-up">
      {error && <ConsumerErrorCard message={error} />}

      <section aria-label="Your upcoming plans">
        <h2 className="mb-2 text-sm font-bold tracking-tight text-neutral-900">Your upcoming plans</h2>
        {upcomingPlans.length === 0 ? (
            <ConsumerInlineEmpty
              message={`${PRODUCT_JOINED_UPCOMING_EMPTY_TITLE} — ${PRODUCT_JOINED_UPCOMING_EMPTY_BODY}`}
              actionLabel={PRODUCT_EXPLORE_CTA}
              actionTo={EXPLORE_MAP_PATH}
            />
          ) : filteredUpcoming.length === 0 ? (
            <ConsumerInlineEmpty message="No upcoming plans match your search." />
          ) : (
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 pr-6 scrollbar-none snap-x snap-mandatory">
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
          <h2 className="mb-2 text-sm font-bold tracking-tight text-neutral-900">Suggested for you</h2>
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
