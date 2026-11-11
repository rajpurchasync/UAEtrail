import { useState } from 'react';
import { Star } from 'lucide-react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import { EXPLORE_TYPE } from '../../../../config/exploreTheme';
import { fetchPlaceActivities } from '../../../../hooks/placeDetailClientApi';
import { useSafeAsyncEffect } from '../../../../hooks/useSafeAsyncEffect';
import { PLACE_PEEK_RATE_LABEL } from '../../../../content/placePeekCopy';
import { PlacePlanList } from '../../../../place/placePlanList';
import { PlacePeekKindFacts } from './PlacePeekKindFacts';

const PlacePeekScheduledList = ({
  locationId,
  onNavigate,
}: {
  locationId: string | null | undefined;
  onNavigate?: () => void;
}) => {
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
      setActivities(rows);
    },
    [locationId]
  );

  return <PlacePlanList activities={activities} onNavigate={onNavigate} limit={6} />;
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
        onNavigate={onBeforeDetailNavigate}
      />
    </div>
  );
};
