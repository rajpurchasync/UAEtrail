import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPlaceActivities } from '../../../../hooks/placeDetailClientApi';
import { useSafeAsyncEffect } from '../../../../hooks/useSafeAsyncEffect';
import { placePeekScheduledActivitiesCountLabel } from '../../../../content/placePeekCopy';

const PLACE_DETAIL_SCHEDULED_SECTION_ID = 'place-detail-scheduled';

export const PlaceMapPeekScheduledRow = ({
  locationId,
  detailPath,
  onNavigate,
}: {
  locationId: string | null;
  detailPath: string;
  onNavigate?: () => void;
}) => {
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready'>('idle');
  const [count, setCount] = useState(0);

  useSafeAsyncEffect(
    async (isActive) => {
      const id = locationId?.trim();
      if (!id) {
        if (isActive()) setLoadState('idle');
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
      <p className="text-xs font-medium text-neutral-500" aria-busy="true">
        <span className="inline-block h-3.5 w-36 max-w-full animate-pulse rounded bg-neutral-200" />
      </p>
    );
  }

  if (count === 0) return null;

  const label = placePeekScheduledActivitiesCountLabel(count);
  const href = `${detailPath}#${PLACE_DETAIL_SCHEDULED_SECTION_ID}`;

  return (
    <p className="text-xs font-semibold text-emerald-800">
      <Link to={href} className="hover:underline" onClick={() => onNavigate?.()}>
        {label} →
      </Link>
    </p>
  );
};