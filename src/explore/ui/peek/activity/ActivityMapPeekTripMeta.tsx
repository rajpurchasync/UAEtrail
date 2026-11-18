import { Clock, MapPin } from 'lucide-react';
import { EXPLORE_PEEK } from '../../../../config/exploreTheme';

/** Where + when — dedicated rows under the title (map decision fields). */
export const ActivityMapPeekTripMeta = ({
  locationLine,
  scheduleLine,
}: {
  locationLine: string | null;
  scheduleLine: string | null;
}) => {
  if (!locationLine && !scheduleLine) return null;

  return (
    <ul className="m-0 list-none space-y-1 p-0" aria-label="Outing time and place">
      {locationLine ? (
        <li className={EXPLORE_PEEK.tripMetaRow}>
          <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{locationLine}</span>
        </li>
      ) : null}
      {scheduleLine ? (
        <li className={EXPLORE_PEEK.tripMetaRow}>
          <Clock className="h-3.5 w-3.5 shrink-0 text-rose-500" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{scheduleLine}</span>
        </li>
      ) : null}
    </ul>
  );
};