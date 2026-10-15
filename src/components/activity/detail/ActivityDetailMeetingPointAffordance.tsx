import { MapPin } from 'lucide-react';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { DirectionsControl } from '../../ui';

const stripShell = 'rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5';
const stripLabel =
  'mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500';

type ActivityDetailMeetingPointAffordanceProps = {
  activity: ActivityDetailDTO;
  accessLat: number | null;
  accessLng: number | null;
  hasAccessCoordinates: boolean;
};

/** Crew-only meeting point (marketing fold — joined participants). */
export const ActivityDetailMeetingPointAffordance = ({
  activity,
  accessLat,
  accessLng,
  hasAccessCoordinates,
}: ActivityDetailMeetingPointAffordanceProps) => {
  const label =
    activity.meetingPoint?.trim() ||
    activity.startPoint?.trim() ||
    activity.parkingPoint?.trim() ||
    activity.locationName;

  if (!label && !hasAccessCoordinates) return null;

  return (
    <section className={stripShell} aria-label="Meeting point">
      <div className={stripLabel}>
        <MapPin className="h-3.5 w-3.5" aria-hidden />
        Meeting point
      </div>
      {label ? <p className="text-sm font-medium text-neutral-900 leading-snug">{label}</p> : null}
      {hasAccessCoordinates && accessLat != null && accessLng != null ? (
        <DirectionsControl
          lat={accessLat}
          lng={accessLng}
          variant="link"
          className="mt-2"
          label="Get directions"
          showAppPickerAffordance={false}
          showLeadingIcon={false}
        />
      ) : null}
    </section>
  );
};
