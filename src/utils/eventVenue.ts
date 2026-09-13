import type { ActivityFormState } from '../components/activities/activityFormState';
import { api } from '../api/services';

const padVenueDescription = (detail: string, state: string, emirate: string): string => {
  const trimmed = detail.trim();
  if (trimmed.length >= 20) return trimmed;
  const suffix = ` Event place in ${state}, ${emirate}.`;
  return (trimmed + suffix).slice(0, 3000).padEnd(20, '.');
};

/** Create or reuse an event-spot place record from inline fields. */
export const resolveEventVenueLocationId = async (
  tenantId: string,
  form: ActivityFormState
): Promise<string> => {
  if (form.locationId) return form.locationId;

  const emirate = form.eventEmirate.trim();
  const state = form.eventState.trim();
  const detail = form.eventVenueDetail.trim();
  if (!emirate || !state || !detail) {
    throw new Error('Select a state and enter place details for the event.');
  }

  const coverImage = form.images[0];
  if (!coverImage) {
    throw new Error('Add a cover image before saving the event place.');
  }

  const name = detail.slice(0, 120);
  const res = await api.submitPlace(tenantId, {
    name,
    countryCode: 'AE',
    emirate,
    region: state,
    activityType: 'event' as const,
    description: padVenueDescription(detail, state, emirate),
    difficulty: 'easy',
    images: [coverImage],
  });

  return res.data.id;
};

/** Canonical name — same as resolveEventVenueLocationId. */
export const resolveEventPlaceId = resolveEventVenueLocationId;
