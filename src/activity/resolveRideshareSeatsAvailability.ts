import type { ActivityDetailDTO } from '@uaetrail/shared-types';

export type RideshareSeatsAvailability = {
  available: number;
  total: number;
  label: string;
  isFull: boolean;
};

/** Join capacity for rideshare detail (slots wire, with rideshare seat count as fallback total). */
export const resolveRideshareSeatsAvailability = (
  activity: ActivityDetailDTO
): RideshareSeatsAvailability | null => {
  const available = activity.slotsAvailable;
  if (available == null || Number.isNaN(available)) return null;

  const totalFromSlots = activity.slotsTotal ?? 0;
  const totalFromRide = activity.rideshareSeats ?? 0;
  const total = totalFromSlots > 0 ? totalFromSlots : totalFromRide > 0 ? totalFromRide : null;

  if (available <= 0) {
    const fullLabel =
      total != null && total > 0
        ? `Full — 0 of ${total} seats left`
        : 'Full — no seats left';
    return { available: 0, total: total ?? 0, label: fullLabel, isFull: true };
  }

  if (total != null && total > 0) {
    const label = `${available} of ${total} seat${total === 1 ? '' : 's'} left`;
    return { available, total, label, isFull: false };
  }

  return {
    available,
    total: available,
    label: `${available} seat${available === 1 ? '' : 's'} left`,
    isFull: false,
  };
};
