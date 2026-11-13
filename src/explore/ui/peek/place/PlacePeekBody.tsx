import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import { EXPLORE_TYPE } from '../../../../config/exploreTheme';
import { fetchPlaceActivities } from '../../../../hooks/placeDetailClientApi';
import { useSafeAsyncEffect } from '../../../../hooks/useSafeAsyncEffect';
import { placePeekScheduledActivitiesCountLabel } from '../../../../content/placePeekCopy';
import { RatingStatTile, StatGrid } from '../../../../detail/shell';
import { PlacePeekKindFacts } from './PlacePeekKindFacts';

const PLACE_DETAIL_SCHEDULED_SECTION_ID = 'place-detail-scheduled';

type PlacePeekScheduledLoadState = 'idle' | 'loading' | 'ready';

const PlacePeekScheduledCount = ({
  locationId,
  detailPath,
  onNavigate,
}: {
  locationId: string | null | undefined;
  detailPath: string;
  onNavigate?: () => void;
}) => {
  const [loadState, setLoadState] = useState<PlacePeekScheduledLoadState>('idle');
  const [count, setCount] = useState(0);

  useSafeAsyncEffect(
    async (isActive) => {
      const id = locationId?.trim();
      if (!id) {
        if (isActive()) {
          setCount(0);
          setLoadState('idle');
        }
        return;
      }
      if (isActive()) setLoadState('loading');
      const rows = await fetchPlaceActivities(id).catch(() => []);
      if (!isActive()) return;
      setCount(rows.filter((row) => row.status === 'published').length);
      setLoadState('ready');
    },
    [locationId]
  );

  if (loadState === 'idle') return null;

  if (loadState === 'loading') {
    return (
      <p
        className={`text-sm font-medium ${EXPLORE_TYPE.body}`}
        aria-busy="true"
        aria-label="Loading scheduled activities"
      >
        <span className="inline-block h-4 w-[10.5rem] max-w-full animate-pulse rounded-md bg-neutral-200/90 dark:bg-neutral-700/80" />
      </p>
    );
  }

  if (count === 0) return null;

  const label = placePeekScheduledActivitiesCountLabel(count);
  const href = `${detailPath}#${PLACE_DETAIL_SCHEDULED_SECTION_ID}`;

  return (
    <p className={`text-sm font-medium ${EXPLORE_TYPE.body}`}>
      <Link
        to={href}
        className="font-semibold text-emerald-800 underline-offset-2 hover:underline"
        onClick={() => onNavigate?.()}
      >
        {label}
      </Link>
    </p>
  );
};

/** Catalog place map peek — kind facts, ratings, scheduled count (hero in `PlacePeekHero`). */
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
      <StatGrid label="">
        <RatingStatTile
          average={card.averageRating}
          count={card.reviewCount ?? 0}
          rateHref={`${detailPath}#place-reviews`}
        />
      </StatGrid>
      <PlacePeekScheduledCount
        locationId={card.locationId}
        detailPath={detailPath}
        onNavigate={onBeforeDetailNavigate}
      />
    </div>
  );
};
