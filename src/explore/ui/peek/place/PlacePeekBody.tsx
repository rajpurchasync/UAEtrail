import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { Star } from 'lucide-react';
import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import { EXPLORE_TYPE } from '../../../../config/exploreTheme';
import { fetchPlaceActivities } from '../../../../hooks/placeDetailClientApi';
import { useSafeAsyncEffect } from '../../../../hooks/useSafeAsyncEffect';
import { activityDetailPath } from '../../../../config/routingCatalog';
import { mapPeekDetailNavState } from '../../../mapPeekDetailNavState';
import { PLACE_PEEK_RATE_LABEL, PLACE_PEEK_SCHEDULED } from '../../../../content/placePeekCopy';
import { PlacePeekKindFacts } from './PlacePeekKindFacts';

const formatScheduledMeta = (activity: ActivityDTO): string => {
  const datePart = new Date(activity.date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timePart = activity.time?.trim();
  return timePart ? `${datePart} · ${timePart}` : datePart;
};

const PlacePeekScheduledList = ({
  locationId,
  detailPath: _detailPath,
  mapItemId,
  onNavigate,
}: {
  locationId: string | null | undefined;
  detailPath: string;
  mapItemId: string;
  onNavigate?: () => void;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityDTO[]>([]);

  useSafeAsyncEffect(
    async (isActive) => {
      const id = locationId?.trim();
      if (!id) {
        if (isActive()) setActivities([]);
        return;
      }
      const rows = await fetchPlaceActivities(id).catch(() => []);
      if (!isActive()) return;
      setActivities(rows.filter((row) => row.status === 'published').slice(0, 6));
    },
    [locationId]
  );

  if (activities.length === 0) return null;

  return (
    <section className="mt-4" aria-label={PLACE_PEEK_SCHEDULED}>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        {PLACE_PEEK_SCHEDULED}
      </h3>
      <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-100 bg-white">
        {activities.map((activity) => {
          const title = activity.title?.trim();
          if (!title) return null;
          return (
          <li key={activity.id}>
            <button
              type="button"
              data-nav-focus={`place-${mapItemId}-activity-${activity.id}`}
              onClick={() => {
                onNavigate?.();
                navigate(activityDetailPath(activity.id), {
                  state: mapPeekDetailNavState(location),
                });
              }}
              className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-neutral-50 active:bg-neutral-100"
            >
              <span className="text-sm font-semibold text-neutral-900 line-clamp-2">
                {title}
              </span>
              <span className={`text-xs ${EXPLORE_TYPE.muted}`}>{formatScheduledMeta(activity)}</span>
            </button>
          </li>
          );
        })}
      </ul>
    </section>
  );
};

const PlacePeekRatingsRow = ({ card, detailPath }: { card: DiscoveryCardModel; detailPath: string }) => {
  const count = card.reviewCount ?? 0;
  const avg = card.averageRating;

  if (count > 0 && avg != null) {
    return (
      <p className={`flex items-center gap-1.5 text-sm font-semibold ${EXPLORE_TYPE.body}`}>
        <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
        <span>{avg.toFixed(1)}</span>
        <span className={`font-medium ${EXPLORE_TYPE.muted}`}>· {count} ratings</span>
      </p>
    );
  }

  return (
    <p className={`flex flex-wrap items-center gap-2 text-sm ${EXPLORE_TYPE.muted}`}>
      <Star className="h-4 w-4 text-amber-300" aria-hidden />
      <span>No ratings yet</span>
      <a href={`${detailPath}#place-reviews`} className="font-semibold text-emerald-700 underline-offset-2 hover:underline">
        {PLACE_PEEK_RATE_LABEL}
      </a>
    </p>
  );
};

/** Catalog place map peek — kind facts, ratings, scheduled plans (hero in `PlacePeekHero`). */
export const PlacePeekBody = ({
  card,
  onBeforeDetailNavigate,
}: {
  card: DiscoveryCardModel;
  detailAccess?: unknown;
  onGuestGatedDetail?: () => void;
  onBeforeDetailNavigate?: () => void;
}) => {
  const detailPath = card.path;

  return (
    <div className="space-y-3 pb-1">
      <PlacePeekKindFacts card={card} />
      <PlacePeekRatingsRow card={card} detailPath={detailPath} />
      <PlacePeekScheduledList
        locationId={card.locationId}
        detailPath={detailPath}
        mapItemId={card.id}
        onNavigate={onBeforeDetailNavigate}
      />
    </div>
  );
};
