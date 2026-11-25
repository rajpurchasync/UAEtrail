import { Link } from 'react-router-dom';
import { usePlacePublishedActivitiesCount } from '../../../../hooks/usePlacePublishedActivitiesCount';
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
  const { count, loadState } = usePlacePublishedActivitiesCount(locationId);

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