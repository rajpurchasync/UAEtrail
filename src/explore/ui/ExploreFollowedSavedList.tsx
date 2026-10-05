import { Link } from 'react-router-dom';
import type { FavoriteDTO } from '@uaetrail/shared-types';
import { resolveEntityPath } from '@uaetrail/shared-types';
import {
  EXPLORE_SOCIAL_EMPTY_FOLLOWED_EVENTS,
  EXPLORE_SOCIAL_EMPTY_FOLLOWED_PLACES,
  EXPLORE_SOCIAL_LOADING,
} from '../../content/exploreSocialPanelCopy';
import type { ExploreFollowedSegment } from './useExploreBrowseUrlState';

type ExploreFollowedSavedListProps = {
  segment: ExploreFollowedSegment;
  favorites: FavoriteDTO[];
  loading: boolean;
  error: string | null;
  onOpenActivity?: (activityId: string) => void;
};

export const ExploreFollowedSavedList = ({
  segment,
  favorites,
  loading,
  error,
  onOpenActivity,
}: ExploreFollowedSavedListProps) => {
  if (loading) {
    return <p className="py-8 text-center text-sm text-gray-500">{EXPLORE_SOCIAL_LOADING}</p>;
  }
  if (error) {
    return <p className="py-8 text-center text-sm text-red-600">{error}</p>;
  }

  const places = favorites.filter((f) => Boolean(f.locationId && f.location));
  const events = favorites.filter((f) => Boolean(f.activityId && (f.activity || f.event)));

  const rows =
    segment === 'places'
      ? places
      : segment === 'events'
        ? events
        : [];

  if (segment !== 'people' && rows.length === 0) {
    const empty =
      segment === 'places' ? EXPLORE_SOCIAL_EMPTY_FOLLOWED_PLACES : EXPLORE_SOCIAL_EMPTY_FOLLOWED_EVENTS;
    return (
      <div className="rounded-2xl border border-dashed border-emerald-200/80 bg-emerald-50/30 px-4 py-8 text-center">
        <p className="text-sm text-neutral-600">{empty}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((favorite) => {
        if (segment === 'places' && favorite.location) {
          const path = resolveEntityPath({ kind: 'trail', id: favorite.location.id });
          return (
            <Link
              key={favorite.id}
              to={path}
              className="rounded-2xl border border-neutral-200/90 bg-white p-3 text-sm font-semibold text-gray-900 shadow-sm active:opacity-90"
            >
              {favorite.location.name}
            </Link>
          );
        }
        const activity = favorite.activity ?? favorite.event;
        if (segment === 'events' && activity) {
          const path = resolveEntityPath({ kind: 'activity', id: activity.id });
          const openOnMap = () => onOpenActivity?.(activity.id);
          const body = (
            <>
              <p className="text-sm font-bold text-gray-900">{activity.title}</p>
              {activity.locationName ? (
                <p className="mt-0.5 text-xs text-neutral-600">{activity.locationName}</p>
              ) : null}
            </>
          );
          return onOpenActivity ? (
            <button
              key={favorite.id}
              type="button"
              onClick={openOnMap}
              className="w-full rounded-2xl border border-neutral-200/90 bg-white p-3 text-left shadow-sm active:opacity-90"
            >
              {body}
            </button>
          ) : (
            <Link
              key={favorite.id}
              to={path}
              className="block rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm active:opacity-90"
            >
              {body}
            </Link>
          );
        }
        return null;
      })}
    </div>
  );
};
