import type { ActivityFormState } from '../components/activities/activityFormState';
import { api } from '../api/services';

const padVenueDescription = (detail: string, state: string, emirate: string): string => {
  const trimmed = detail.trim();
  if (trimmed.length >= 20) return trimmed;
  const suffix = ` Event venue in ${state}, ${emirate}.`;
  return (trimmed + suffix).slice(0, 3000).padEnd(20, '.');
};

/** Create or reuse an event-spot location record from inline venue fields. */
export const resolveEventVenueLocationId = async (
  tenantId: string,
  form: ActivityFormState
): Promise<string> => {
  if (form.locationId) return form.locationId;

  const emirate = form.eventEmirate.trim();
  const state = form.eventState.trim();
  const detail = form.eventVenueDetail.trim();
  if (!emirate || !state || !detail) {
    throw new Error('Select a state and enter location details for the event venue.');
  }

  const coverImage = form.images[0];
  if (!coverImage) {
    throw new Error('Add a cover image before saving the event venue.');
  }

  const name = detail.slice(0, 120);
  const res = await api.submitLocation(tenantId, {
    name,
    countryCode: 'AE',
    emirate,
    region: state,
    activityType: 'community_activity' as const,
    description: padVenueDescription(detail, state, emirate),
    difficulty: 'easy',
    images: [coverImage],
  });

  return res.data.id;
};
